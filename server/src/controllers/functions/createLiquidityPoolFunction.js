import {
  AccountBalanceQuery,
  Hbar,
  PrivateKey,
  TokenId,
  AccountUpdateTransaction,
  Status,
  AccountId,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  TokenInfoQuery,
  ContractId,
  ContractCallQuery,
  AccountInfoQuery,
  TokenAssociateTransaction,
  AccountAllowanceApproveTransaction,
} from "@hashgraph/sdk";
import supabase from "../../db/db.js";
import { getHederaClient } from "../../hedera/hederaClient.js";
import { decryptKey } from "../../utils/crypto.js";
import Long from "long";

import { config } from "../config.js";

export const createLiquidityPoolFunction = async (req, res, next) => {
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
