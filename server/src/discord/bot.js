import { Client, GatewayIntentBits, Partials, EmbedBuilder } from "discord.js";
import supabase from "../db/db.js";
import dotenv from "dotenv";

dotenv.config();

export const discordBot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
  ],
});

// Evento de inicio
discordBot.on("ready", () => {
  console.log(`Bot conectado como ${discordBot.user.tag}`);
  discordBot.user.setActivity("Verificaciones KYC");
});

// Manejo de reacciones KYC
discordBot.on("messageReactionAdd", async (reaction, user) => {
  try {
    // Evitar que el bot reaccione a sí mismo
    if (user.bot) return;

    // Obtener el mensaje completo si es parcial
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    // Buscar configuración en Supabase
    const { data: setup } = await supabase
      .from("discord_setups")
      .select("kyc_message_id, roles")
      .eq("kyc_message_id", reaction.message.id)
      .single();

    if (!setup) return;

    // Encontrar el party correspondiente al emoji
    const party = setup.roles.find((r) => r.emoji === reaction.emoji.name);
    if (!party) return;

    // Enviar mensaje privado
    try {
      const dmChannel = await user.createDM();
      await dmChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`Verificación para ${party.party_name}`)
            .setDescription(
              `Haz clic en el enlace para completar la verificación:\n` +
                `${process.env.BOT_BASE_URL}/kyc/${party.party_id}`
            )
            .setColor(0x5865f2),
        ],
      });
    } catch (dmError) {
      console.error(`Error enviando DM a ${user.id}:`, dmError);

      // Intentar enviar mensaje al canal si falla el DM
      if (reaction.message.channel.isTextBased()) {
        await reaction.message.channel.send(
          `${user}, no pude enviarte un mensaje privado. ` +
            `Por favor habilita los DMs para recibir tu enlace de verificación.`
        );
      }
    }
  } catch (error) {
    console.error("Error en manejo de reacción:", error);
  }
});

// Manejo de errores
discordBot.on("error", console.error);
process.on("unhandledRejection", console.error);

// Iniciar bot
discordBot.login(process.env.DISCORD_BOT_TOKEN).catch((err) => {
  console.error("Error al iniciar bot:", err);
  process.exit(1);
});
