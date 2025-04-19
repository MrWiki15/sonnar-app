import { AccountBalanceQuery, Hbar, HbarUnit } from "@hashgraph/sdk";
import supabase from "../../db/db.js";
import { getHederaClient } from "../../hedera/hederaClient.js";

const client = getHederaClient();

export const checkWalletFundingFunction = async (req, res, next) => {
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
