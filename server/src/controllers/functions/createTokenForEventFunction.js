import { TokenCreateTransaction, PrivateKey } from "@hashgraph/sdk";
import supabase from "../../db/db.js";
import { getHederaClient } from "../../hedera/hederaClient.js";
import { encryptKey, decryptKey } from "../../utils/crypto.js";

export const createTokenForEventFunction = async (req, res, next) => {
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
