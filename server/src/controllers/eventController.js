import {
  AccountCreateTransaction,
  AccountBalanceQuery,
  TokenCreateTransaction,
  Hbar,
  HbarUnit,
  PrivateKey,
  Key,
  TokenUpdateTransaction,
  Transaction,
  TransferTransaction,
  TokenId,
  AccountUpdateTransaction,
  Status,
  AccountId,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  TokenMintTransaction,
  TokenInfoQuery,
  ContractId,
  ContractCallQuery,
  AccountInfoQuery,
  TokenAssociateTransaction,
  AccountAllowanceApproveTransaction,
  TokenBurnTransaction,
} from "@hashgraph/sdk";
import supabase from "../db/db.js";
import { getHederaClient } from "../hedera/hederaClient.js";
import { encryptKey, decryptKey } from "../utils/crypto.js";
import Joi from "joi";
import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import Long from "long";

const client = getHederaClient();

export const createEvent = async (req, res, next) => {
  console.log("createEvent");
  try {
    const { event_id, organizer_wallet } = req.body;

    const { data: existingEvent } = await supabase
      .from("parties")
      .select("parti_wallet")
      .eq("id", event_id)
      .single();

    if (existingEvent?.parti_wallet) {
      return res
        .status(400)
        .json({ error: "El evento ya tiene una wallet asociada" });
    }

    const newPrivateKey = PrivateKey.generateED25519();
    const transaction = await new AccountCreateTransaction()
      .setKey(newPrivateKey.publicKey)
      .setInitialBalance(Hbar.from(0))
      .execute(client);

    const receipt = await transaction.getReceipt(client);
    const newAccountId = receipt.accountId.toString();

    await supabase
      .from("parties")
      .update({
        parti_wallet: newAccountId,
        parti_wallet_private_key: encryptKey(newPrivateKey.toString()),
      })
      .eq("id", event_id);

    res.json({
      success: true,
      wallet: newAccountId,
    });
  } catch (error) {
    next(new Error(`Error al crear evento: ${error.message}`));
  }
};

export const checkWalletFunding = async (req, res, next) => {
  try {
    const { event_id } = req.body;

    // Validar entrada
    if (!event_id) {
      return res.status(400).json({ error: "event_id es requerido" });
    }

    // Obtener wallet del evento
    const { data: event, error } = await supabase
      .from("parties")
      .select("parti_wallet")
      .eq("id", event_id)
      .single();

    if (!event?.parti_wallet) {
      return res.status(404).json({ error: "Wallet del evento no encontrada" });
    }

    // Consultar balance
    const balance = await new AccountBalanceQuery()
      .setAccountId(event.parti_wallet)
      .execute(client);

    // Convertir a Hbar
    const hbarBalance = Hbar.from(balance.hbars.toTinybars()); // Tinybars → Hbar
    const requiredBalance = Hbar.from(10, HbarUnit.Hbar); // 20 HBAR

    // Comparar valores numéricos
    if (
      hbarBalance.to(HbarUnit.Hbar).toNumber() <
      requiredBalance.to(HbarUnit.Hbar).toNumber()
    ) {
      return res.status(402).json({
        funded: false,
        required: "10 ℏ",
        current: hbarBalance.toString(),
      });
    }

    res.json({ funded: true });
  } catch (error) {
    next(new Error(`Error verificando fondo: ${error.message}`));
  }
};

export const createTokenForEvent = async (req, res, next) => {
  try {
    const { event_id } = req.body;

    // 1. Obtener evento
    const { data, error } = await supabase
      .from("parties")
      .select("*")
      .eq("id", event_id)
      .single();
    if (!data || error) throw new Error("Evento no encontrado");

    // 2. Configurar cliente
    const operatorKey = PrivateKey.fromString(
      decryptKey(data.parti_wallet_private_key)
    );
    const client = getHederaClient().setOperator(
      data.parti_wallet,
      operatorKey
    );

    // 3. Generar claves
    const supplyKey = PrivateKey.generateED25519();
    const adminKey = PrivateKey.generateED25519();
    const metadataKey = PrivateKey.generateED25519();

    // 4. Construir transacción
    const transaction = await new TokenCreateTransaction()
      .setTokenName(data.name)
      .setTokenSymbol(data.name.slice(0, 3).toUpperCase())
      .setDecimals(2)
      .setInitialSupply(0)
      .setTreasuryAccountId(data.parti_wallet)
      .setSupplyKey(supplyKey.publicKey)
      .setAdminKey(adminKey.publicKey)
      .setMetadataKey(metadataKey.publicKey)
      .freezeWith(client);

    // 5. Firmar
    transaction.sign(operatorKey);
    transaction.sign(supplyKey);
    transaction.sign(adminKey);
    transaction.sign(metadataKey);

    // 6. Ejecutar
    const tokenTx = await transaction.execute(client);
    const tokenId = (await tokenTx.getReceipt(client)).tokenId;

    // 7. Guardar en BD
    await supabase
      .from("parties")
      .update({
        token_id: tokenId.toString(),
        token_supply_public_key: supplyKey.publicKey.toString(),
        token_supply_private_key: encryptKey(supplyKey.toString()),
        token_admin_public_key: adminKey.publicKey.toString(),
        token_admin_private_key: encryptKey(adminKey.toString()),
        token_metadata_public_key: metadataKey.publicKey.toString(),
        token_metadata_private_key: encryptKey(metadataKey.toString()),
      })
      .eq("id", event_id);

    res.json({ success: true, tokenId: tokenId.toString() });
  } catch (error) {
    console.error("Error en createTokenForEvent:", error);
    next(new Error(`Error creando token: ${error.message}`));
  }
};

export const updateTokenForEvent = async (req, res, next) => {
  try {
    const { event_id, newName, newDescription, newImage } = req.body;

    if (!event_id || !newName || !newDescription || !newImage) {
      throw new Error("Faltan parámetros requeridos");
    }

    const { data: event, error } = await supabase
      .from("parties")
      .select("*")
      .eq("id", event_id)
      .single();

    if (error || !event) throw new Error("Evento no encontrado");
    if (!event.token_id) throw new Error("Token no creado para este evento");

    // 1. Subir imagen a IPFS
    const imageResponse = await axios.get(newImage, {
      responseType: "arraybuffer",
    });
    const __dirname = path.resolve();

    const tempFilePath = path.join(__dirname, "temp-image");
    fs.writeFileSync(tempFilePath, imageResponse.data);

    const imageType = imageResponse.headers["content-type"] || "image/png";
    const imageExt = imageType.split("/")[1] || "png";

    const imageFormData = new FormData();
    imageFormData.append("file", fs.createReadStream(tempFilePath), {
      filename: `event-${event_id}-image.${imageExt}`,
      contentType: imageType,
    });

    const imageUpload = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      imageFormData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          ...imageFormData.getHeaders(),
        },
      }
    );

    const imageCID = imageUpload.data.IpfsHash;
    const imageURI = `ipfs://${imageCID}`;

    // 2. Construir metadata HIP412
    const metadata = {
      format: "HIP412@2.0.0",
      name: newName,
      creator: "Sonnar by Polaris",
      description: newDescription,
      image: imageURI,
      attributes: [
        {
          trait_type: "Event Type",
          value: event.is_online ? "Online" : "Presencial",
        },
        {
          trait_type: "Event Goal",
          value: event.goal_amount,
        },
        {
          trait_type: "Event Date",
          value: event.date,
        },
        {
          trait_type: "Event Location",
          value: event.is_online ? event.address : event.city,
        },
        {
          trait_type: "Event Price",
          value: event.entry_price,
        },
        {
          trait_type: "Event Capacity",
          value: event.capacity,
        },
      ],
      files: [
        {
          uri: imageURI,
          type: imageType,
          is_default_file: true,
        },
      ],
    };

    // 3. Subir metadata a IPFS
    const metadataResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        pinataMetadata: { name: `${event_id}_metadata` },
        pinataContent: metadata,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    );

    const metadataCID = metadataResponse.data.IpfsHash;

    // Eliminar archivo temporal
    fs.unlinkSync(tempFilePath);

    // 4. Actualizar token en Hedera
    const operatorKey = PrivateKey.fromString(
      decryptKey(event.parti_wallet_private_key)
    );
    const client = getHederaClient().setOperator(
      event.parti_wallet,
      operatorKey
    );

    const ipfsBytes = new TextEncoder().encode(metadataCID);
    if (ipfsBytes.length > 100)
      throw new Error("El hash IPFS excede el límite de 100 bytes");

    const transaction = await new TokenUpdateTransaction()
      .setTokenId(TokenId.fromString(event.token_id))
      .setMetadata(ipfsBytes)
      .freezeWith(client);

    transaction.sign(operatorKey);
    transaction.sign(
      PrivateKey.fromString(decryptKey(event.token_admin_private_key))
    );

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    if (receipt.status !== Status.Success) {
      throw new Error(`Transacción fallida: ${receipt.status}`);
    }

    // 5. Actualizar base de datos
    const { error: updateError } = await supabase
      .from("parties")
      .update({
        token_metadata: metadataCID,
        updated_at: new Date().toISOString(),
      })
      .eq("id", event_id);

    if (updateError) throw updateError;

    res.status(200).json({
      success: true,
      message: "Token actualizado correctamente",
      ipfsHash: metadataCID,
      tokenId: event.token_id,
      imageCID,
    });
  } catch (e) {
    console.error("Error en updateTokenForEvent:", e);
    next(new Error(`Error al actualizar el token: ${e.message}`));
  }
};

export const getTokenMetadata = async (req, res, next) => {
  try {
    const { event_id } = req.query;

    const { data, error } = await supabase
      .from("parties")
      .select("*")
      .eq("id", event_id)
      .single();
    if (!data || error) throw new Error("Evento no encontrado");

    fetch(
      `https://white-kind-toad-673.mypinata.cloud/ipfs/${data.token_metadata}`
    )
      .then((response) => response.json())
      .then((data) => {
        res.json({ success: true, metadata: data });
      });
  } catch (e) {
    console.error("Error en getTokenMetadata:", e);
    next(new Error(`Error al obtener metadatos del token: ${e.message}`));
  }
};

export const windrawMoney = async (req, res, next) => {
  try {
    const { event_id, user_wallet, amount } = req.body;

    const { data, error } = await supabase
      .from("parties")
      .select("*")
      .eq("id", event_id)
      .single();
    if (!data || error) throw new Error("Evento no encontrado");
    if (!data.parti_wallet)
      throw new Error(
        "Wallet del evento no encontrada, complete el setup para continuar"
      );
    if (!data.parti_wallet_private_key)
      throw new Error(
        "Token no tiene el setup completado, complete el setup para poder retirar dinero"
      );

    //crear memo
    const memo = `windraw hbar from sonnar app -> https://sonnar.club -> ${new Date().toISOString()}`;

    // Configurar cliente
    const operatorKey = PrivateKey.fromString(
      decryptKey(data.parti_wallet_private_key)
    );

    const client = getHederaClient().setOperator(
      data.parti_wallet,
      operatorKey
    );

    const transaction = await new TransferTransaction()
      .addHbarTransfer(
        AccountId.fromString(data.parti_wallet),
        Hbar.from(-amount, HbarUnit.Hbar)
      )
      .addHbarTransfer(
        AccountId.fromString(user_wallet),
        Hbar.from(amount, HbarUnit.Hbar)
      )
      .setTransactionMemo(memo)
      .freezeWith(client);

    const transferResponse = await transaction.execute(client);
    const transferReceipt = await transferResponse.getReceipt(client);

    console.log(`Retito completado:`, transferReceipt.status.toString());

    res.json({
      success: true,
      transactionId: transferResponse.transactionId.toString(),
      tokensReceived: amount,
    });
  } catch (e) {
    console.error("Error en windrawMoney: ", e);
    next(
      new Error(`Error retirar dinero de la wallet del parti: ${e.message}`)
    );
  }
};

export const windrawToken = async (req, res, next) => {
  try {
    const { event_id, user_wallet, amount } = req.body;

    const { data, error } = await supabase
      .from("parties")
      .select("*")
      .eq("id", event_id)
      .single();
    if (!data || error) throw new Error("Evento no encontrado");
    if (!data.parti_wallet)
      throw new Error(
        "Wallet del evento no encontrada, complete el setup para continuar"
      );
    if (!data.parti_wallet_private_key)
      throw new Error(
        "Token no tiene el setup completado, complete el setup para poder retirar dinero"
      );

    //crear memo
    const memo = `windraw token from sonnar app -> https://sonnar.club -> ${new Date().toISOString()}`;

    // Configurar cliente
    const operatorKey = PrivateKey.fromString(
      decryptKey(data.parti_wallet_private_key)
    );

    const client = getHederaClient().setOperator(
      data.parti_wallet,
      operatorKey
    );

    const transaction = await new TransferTransaction()
      .addTokenTransfer(
        TokenId.fromString(data.token_id),
        AccountId.fromString(data.parti_wallet),
        Number(-amount * 100)
      )
      .addTokenTransfer(
        TokenId.fromString(data.token_id),
        AccountId.fromString(user_wallet),
        Number(amount * 100)
      )
      .setTransactionMemo(memo)
      .freezeWith(client);

    const transferResponse = await transaction.execute(client);
    const transferReceipt = await transferResponse.getReceipt(client);

    console.log(`Retito completado:`, transferReceipt.status.toString());

    res.json({
      success: true,
      transactionId: transferResponse.transactionId.toString(),
      tokensReceived: amount,
    });
  } catch (e) {
    console.error("Error en windrawToken: ", e);
    next(
      new Error(`Error retirar un token de la wallet del parti: ${e.message}`)
    );
  }
};

import { config } from "./config.js";

export const createLiquidityPool = async (req, res, next) => {
  let client;

  // Helper de slippage mejorado para manejar Long
  const applySlippage = (amountLong, slippagePct) =>
    amountLong.multiply(Long.fromNumber(100 - slippagePct)).divide(100);

  try {
    // Validar inputs más exhaustiva
    const { event_id, token_amount, hbar_amount, slippage = "1" } = req.body;

    if (!event_id || !token_amount || !hbar_amount) {
      throw new Error(
        "Missing required parameters: event_id, token_amount and hbar_amount are required"
      );
    }

    if (isNaN(parseFloat(token_amount)) || parseFloat(token_amount) <= 0) {
      throw new Error("Invalid token amount - must be a positive number");
    }

    if (isNaN(parseFloat(hbar_amount)) || parseFloat(hbar_amount) <= 0) {
      throw new Error("Invalid HBAR amount - must be a positive number");
    }

    const slippageValue = parseFloat(slippage);
    if (isNaN(slippageValue) || slippageValue < 0 || slippageValue >= 100) {
      throw new Error("Invalid slippage value - must be between 0 and 100");
    }

    // Obtener evento y token con manejo de errores mejorado
    const { data: event, error: eventError } = await supabase
      .from("parties")
      .select("*")
      .eq("id", event_id)
      .single();

    if (eventError) throw new Error(`Database error: ${eventError.message}`);
    if (!event?.token_id) throw new Error("Event or token not found");

    // Obtener configuración según entorno
    const {
      SAUCERSWAP_V1_ROUTER,
      SAUCERSWAP_V1_FACTORY,
      WHBAR_TOKEN_ID,
      DEFAULT_GAS_LIMITS,
      POOL_CREATION_DEADLINE,
    } = config.networkConfig(process.env.NETWORK || "testnet");

    const WHBAR_SOLIDITY_ADDRESS =
      TokenId.fromString(WHBAR_TOKEN_ID).toSolidityAddress();
    const ZERO_ADDRESS = "0000000000000000000000000000000000000000";

    // Init Hedera client con verificación de operador
    client = getHederaClient();
    const operatorKey = PrivateKey.fromString(
      decryptKey(event.parti_wallet_private_key)
    );
    client.setOperator(event.parti_wallet, operatorKey);

    // Verificar balance antes de proceder
    const accountBalance = await new AccountBalanceQuery()
      .setAccountId(client.operatorAccountId)
      .execute(client);

    const requiredHbar = Hbar.from(hbar_amount);
    if (accountBalance.hbars.toString() < requiredHbar.toString()) {
      throw new Error(
        `Insufficient HBAR balance. Required: ${requiredHbar}, Available: ${accountBalance.hbars}`
      );
    }

    // Token info con manejo de errores
    const tokenId = TokenId.fromString(event.token_id);
    let tokenInfo;
    try {
      tokenInfo = await new TokenInfoQuery()
        .setTokenId(tokenId)
        .execute(client);
    } catch (error) {
      throw new Error(`Failed to fetch token info: ${error.message}`);
    }

    const tokenDecimals = tokenInfo.decimals;

    // Escalar montos con validación
    const tokenAmountScaled = Long.fromNumber(
      Math.round(parseFloat(token_amount) * 10 ** tokenDecimals)
    );
    const hbarTinybars = Hbar.from(parseFloat(hbar_amount)).toTinybars();

    // Aprobar token al router con manejo de gas configurable
    try {
      const approveTx = await new AccountAllowanceApproveTransaction()
        .approveTokenAllowance(
          tokenId,
          client.operatorAccountId,
          AccountId.fromString(SAUCERSWAP_V1_ROUTER),
          tokenAmountScaled
        )
        .setMaxTransactionFee(Hbar.from(2)) // Fee adecuado para approve
        .freezeWith(client)
        .sign(operatorKey);

      const approveReceipt = await (
        await approveTx.execute(client)
      ).getReceipt(client);
      if (approveReceipt.status !== Status.Success) {
        throw new Error("Token approval failed");
      }
    } catch (error) {
      throw new Error(`Failed to approve token allowance: ${error.message}`);
    }

    // Revisar existencia del pool con reintentos
    let poolCheck, rawPoolAddress;
    try {
      poolCheck = await new ContractCallQuery()
        .setContractId(ContractId.fromString(SAUCERSWAP_V1_FACTORY))
        .setGas(DEFAULT_GAS_LIMITS.poolCheck)
        .setFunction(
          "getPair",
          new ContractFunctionParameters()
            .addAddress(tokenId.toSolidityAddress())
            .addAddress(WHBAR_SOLIDITY_ADDRESS)
        )
        .execute(client);

      rawPoolAddress = poolCheck.getAddress(0);
    } catch (error) {
      throw new Error(`Failed to check pool existence: ${error.message}`);
    }

    const poolExists = rawPoolAddress && rawPoolAddress !== ZERO_ADDRESS;

    // Manejo de asociación WHBAR mejorado
    const whbarTokenId = TokenId.fromString(WHBAR_TOKEN_ID);
    let acctInfo = await new AccountInfoQuery()
      .setAccountId(client.operatorAccountId)
      .execute(client);

    const hasWhbar = Array.from(acctInfo.tokenRelationships.values()).some(
      (tr) => tr.tokenId.toString() === whbarTokenId.toString()
    );

    if (!hasWhbar) {
      try {
        const currentMaxAssoc = Number(acctInfo.maxAutomaticTokenAssociations);
        const newMaxAssoc = currentMaxAssoc + 1;

        const updateTx = await new AccountUpdateTransaction()
          .setAccountId(client.operatorAccountId)
          .setMaxAutomaticTokenAssociations(newMaxAssoc)
          .freezeWith(client)
          .sign(operatorKey);

        await (await updateTx.execute(client)).getReceipt(client);

        const whbarAssoc = await new TokenAssociateTransaction()
          .setAccountId(client.operatorAccountId)
          .setTokenIds([whbarTokenId])
          .freezeWith(client)
          .sign(operatorKey);

        await (await whbarAssoc.execute(client)).getReceipt(client);

        // Refrescar info de la cuenta
        acctInfo = await new AccountInfoQuery()
          .setAccountId(client.operatorAccountId)
          .execute(client);
      } catch (error) {
        throw new Error(`Failed to associate WHBAR token: ${error.message}`);
      }
    }

    // Montos mínimos con slippage (en unitarios long)
    const minTokenAmount = applySlippage(tokenAmountScaled, slippageValue);
    const minHbarAmount = applySlippage(hbarTinybars, slippageValue);

    // Parámetros de la función con deadline configurable
    const deadline =
      Math.floor(Date.now() / 1000) + (POOL_CREATION_DEADLINE || 1800);
    const liquidityParams = new ContractFunctionParameters()
      .addAddress(tokenId.toSolidityAddress())
      .addUint256(tokenAmountScaled.toString())
      .addUint256(minTokenAmount.toString())
      .addUint256(minHbarAmount.toString())
      .addAddress(client.operatorAccountId.toSolidityAddress())
      .addUint256(deadline.toString());

    // Variables resultantes
    let record, result, amountToken, amountHBAR, liquidity;

    if (poolExists) {
      // Asociar LP token si no está asociado
      const lpTokenId = TokenId.fromSolidityAddress(rawPoolAddress);
      const hasLpToken = Array.from(acctInfo.tokenRelationships.values()).some(
        (tr) => tr.tokenId.toString() === lpTokenId.toString()
      );

      if (!hasLpToken) {
        try {
          const currentMaxAssoc = Number(
            acctInfo.maxAutomaticTokenAssociations
          );
          const newMaxAssoc = currentMaxAssoc + 1;

          await (
            await new AccountUpdateTransaction()
              .setAccountId(client.operatorAccountId)
              .setMaxAutomaticTokenAssociations(newMaxAssoc)
              .execute(client)
          ).getReceipt(client);

          const assocTx = await new TokenAssociateTransaction()
            .setAccountId(client.operatorAccountId)
            .setTokenIds([lpTokenId])
            .freezeWith(client)
            .sign(operatorKey);

          await (await assocTx.execute(client)).getReceipt(client);
        } catch (error) {
          throw new Error(`Failed to associate LP token: ${error.message}`);
        }
      }

      // Ejecutar addLiquidityETH con gas configurable
      try {
        const liquidityTx = await new ContractExecuteTransaction()
          .setContractId(ContractId.fromString(SAUCERSWAP_V1_ROUTER))
          .setGas(DEFAULT_GAS_LIMITS.addLiquidity || 240_000)
          .setPayableAmount(Hbar.fromTinybars(hbarTinybars.toString()))
          .setFunction("addLiquidityETH", liquidityParams)
          .freezeWith(client)
          .sign(operatorKey);

        record = await (await liquidityTx.execute(client)).getRecord(client);
        result = record.contractFunctionResult;
        amountToken = result.getUint256(0);
        amountHBAR = result.getUint256(1);
        liquidity = result.getUint256(2);
      } catch (error) {
        throw new Error(`Failed to add liquidity: ${error.message}`);
      }
    } else {
      // Nuevo pool: obtener fee de creación
      let feeTinybars;
      try {
        const feeQ = await new ContractCallQuery()
          .setContractId(ContractId.fromString(SAUCERSWAP_V1_FACTORY))
          .setGas(DEFAULT_GAS_LIMITS.feeCheck || 100_000)
          .setFunction("pairCreateFee")
          .execute(client);

        feeTinybars = feeQ.getUint256(0);
        if (!feeTinybars || Long.fromString(feeTinybars.toString()).isZero()) {
          throw new Error("Failed to get pool creation fee");
        }
      } catch (error) {
        throw new Error(`Failed to query pool creation fee: ${error.message}`);
      }

      // Crear nuevo pool con gas configurable
      try {
        const liquidityTx = await new ContractExecuteTransaction()
          .setContractId(ContractId.fromString(SAUCERSWAP_V1_ROUTER))
          .setGas(DEFAULT_GAS_LIMITS.createPool || 3_200_000)
          .setPayableAmount(Hbar.fromTinybars(feeTinybars.toString()))
          .setFunction("addLiquidityETHNewPool", liquidityParams)
          .freezeWith(client)
          .sign(operatorKey);

        record = await (await liquidityTx.execute(client)).getRecord(client);
        result = record.contractFunctionResult;
        amountToken = result.getUint256(0);
        amountHBAR = result.getUint256(1);
        liquidity = result.getUint256(2);
      } catch (error) {
        throw new Error(`Failed to create new pool: ${error.message}`);
      }
    }

    // Verificar pool final con reintento
    let finalAddr;
    try {
      const finalQ = await new ContractCallQuery()
        .setContractId(ContractId.fromString(SAUCERSWAP_V1_FACTORY))
        .setGas(DEFAULT_GAS_LIMITS.poolCheck)
        .setFunction(
          "getPair",
          new ContractFunctionParameters()
            .addAddress(tokenId.toSolidityAddress())
            .addAddress(WHBAR_SOLIDITY_ADDRESS)
        )
        .execute(client);

      finalAddr = finalQ.getAddress(0);
      if (finalAddr === ZERO_ADDRESS) {
        throw new Error("Pool creation failed - pool not found after creation");
      }
    } catch (error) {
      throw new Error(`Failed to verify pool creation: ${error.message}`);
    }

    // Actualizar DB con manejo de errores
    try {
      const { error: updateError } = await supabase
        .from("parties")
        .update({
          pool_id: finalAddr,
          pool_url: `https://app.saucerswap.finance/pool/${finalAddr}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", event_id);

      if (updateError) {
        console.error("Database update failed:", updateError);
        // No fallamos la operación completa por un error de DB
      }
    } catch (dbError) {
      console.error("Database update exception:", dbError);
    }

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: `Liquidity ${
        poolExists ? "added to" : "created for"
      } pool successfully`,
      data: {
        pool_address: finalAddr,
        token_used: `${Long.fromString(amountToken.toString()).div(
          Long.fromNumber(10 ** tokenDecimals)
        )} ${tokenInfo.symbol}`,
        hbar_used: Hbar.fromTinybars(amountHBAR).toString(),
        liquidity_tokens: liquidity.toString(),
        explorer_url: `https://hashscan.io/${
          process.env.NETWORK || "testnet"
        }/token/${finalAddr}`,
      },
    });
  } catch (error) {
    console.error("Error in createLiquidityPool:", {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
    });

    // Error sanitizado para el cliente
    const userMessage = error.message.includes("Failed to")
      ? "Transaction failed. Please try again or contact support."
      : error.message;

    res.status(500).json({
      success: false,
      message: userMessage,
      error_code: "LIQUIDITY_POOL_ERROR",
    });
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("Failed to close Hedera client:", closeError);
      }
    }
  }
};
