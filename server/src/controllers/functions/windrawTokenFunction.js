import {
  PrivateKey,
  TransferTransaction,
  TokenId,
  AccountId,
} from "@hashgraph/sdk";
import supabase from "../../db/db.js";
import { getHederaClient } from "../../hedera/hederaClient.js";
import { decryptKey } from "../../utils/crypto.js";

export const windrawTokenFunction = async (req, res, next) => {
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
