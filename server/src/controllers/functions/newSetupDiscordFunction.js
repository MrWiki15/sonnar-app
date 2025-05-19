import { ChannelType, PermissionsBitField, EmbedBuilder } from "discord.js";
import { discordBot } from "../../discord/bot.js";
import supabase from "../../db/db.js";

export const newSetupDiscordFunction = async (req, res) => {
  try {
    const { guildId, categoryName, emoji, roleId, userId, partyId, partyName } =
      req.body;

    // 1. Validación de entrada
    if (
      !guildId ||
      !categoryName ||
      !emoji ||
      !roleId ||
      !userId ||
      !partyId ||
      !partyName
    ) {
      return res.status(400).json({
        code: "missing_required_fields",
        message: "Faltan campos requeridos",
      });
    }

    // 2. Verificar permisos
    const guild = await discordBot.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);

    if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return res.status(403).json({
        code: "insufficient_permissions",
        message: "Se requieren permisos de administrador",
      });
    }

    // 3. Crear estructura de canales
    const category = await guild.channels.create({
      name: `${categoryName.slice(0, 95)} ${emoji}`.trim(),
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: roleId,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
          ],
        },
      ],
    });

    // 4. Crear canales hijos
    const [announcements, kyc, chat] = await Promise.all([
      // Canal de anuncios (público)
      guild.channels.create({
        name: "📢-anuncios",
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
            deny: [PermissionsBitField.Flags.SendMessages],
          },
        ],
      }),
      // Canal de KYC (público)
      guild.channels.create({
        name: "✅-verificacion",
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
            deny: [PermissionsBitField.Flags.SendMessages],
          },
        ],
      }),
      // Canal de chat (privado)
      guild.channels.create({
        name: "💬-chat",
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: roleId,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
            ],
          },
        ],
      }),
    ]);

    // 5. Crear embed de verificación
    const embed = new EmbedBuilder()
      .setTitle("🔐 Verificación de Eventos")
      .setDescription(
        "Reacciona con el emoji correspondiente para verificar tu participación"
      )
      .setColor(0x5865f2)
      .addFields({
        name: `${emoji} ${partyName}`,
        value: `[Ver evento](http://localhost:8080/fiesta/${partyId})`, // Añadir value
        inline: true,
      });

    const kycMessage = await kyc.send({ embeds: [embed] });
    await kycMessage.react(emoji);

    // 6. Guardar en Supabase
    const { data: setup, error: dbError } = await supabase
      .from("discord_setups")
      .insert({
        guild_id: guildId,
        category_id: category.id,
        roles: [
          {
            id: roleId,
            emoji,
            party_id: partyId,
            party_name: partyName,
          },
        ],
        channels: {
          announcements: announcements.id,
          kyc: kyc.id,
          chat: chat.id,
        },
        kyc_message_id: kycMessage.id,
      })
      .select("*")
      .single();

    if (dbError) throw dbError;

    // 7. Vincular con la party
    await supabase
      .from("parties")
      .update({
        discord_setup_id: setup.id,
      })
      .eq("id", partyId);

    res.json({
      success: true,
      setup,
      invite_link: await createInviteLink(guild),
    });
  } catch (error) {
    console.error("New setup error:", error);
    res.status(500).json({
      code: "setup_failed",
      message: error.message || "Failed to create Discord setup",
    });
  }
};

// Helper para crear enlace de invitación
async function createInviteLink(guild) {
  try {
    const channel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText
    );
    const invite = await channel.createInvite({ maxAge: 86400, unique: true });
    return invite.url;
  } catch (error) {
    console.error("Error creating invite:", error);
    return null;
  }
}
