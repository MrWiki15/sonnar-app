export const setupDiscordFunction = async (req, res) => {
  try {
    const { guildId, partyId, roleId, userId, partyName, emoji } = req.body;

    // 1. Validación de entrada
    if (!guildId || !partyId || !roleId || !partyName || !emoji) {
      return res.status(400).json({
        code: "missing_required_fields",
        message: "Faltan campos requeridos",
      });
    }

    // 2. Obtener configuración existente
    const { data: existingSetup, error: setupError } = await supabase
      .from("discord_setups")
      .select("*")
      .eq("guild_id", guildId)
      .single();

    if (!existingSetup) {
      return res.status(404).json({
        code: "setup_not_found",
        message: "No se encontró configuración para este servidor",
      });
    }

    // 3. Verificar permisos
    const guild = await discordBot.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);

    if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return res.status(403).json({
        code: "insufficient_permissions",
        message: "Se requieren permisos de administrador",
      });
    }

    // 4. Verificar si el party ya está registrado
    if (existingSetup.roles.some((r) => r.party_id === partyId)) {
      return res.status(409).json({
        code: "party_already_exists",
        message: "Este evento ya está registrado en este servidor",
      });
    }

    // 5. Actualizar embed KYC
    const kycChannel = await guild.channels.fetch(existingSetup.channels.kyc);
    const kycMessage = await kycChannel.messages.fetch(
      existingSetup.kyc_message_id
    );

    const embed = EmbedBuilder.from(kycMessage.embeds[0]);
    embed.addFields({
      name: `${emoji} ${partyName}`,
      value: `ID: ${partyId}`,
      inline: true,
    });

    await kycMessage.edit({ embeds: [embed] });
    await kycMessage.react(emoji);

    // 6. Crear nuevo canal privado
    const newChannel = await guild.channels.create({
      name: `💬-${partyName.toLowerCase().replace(/\s+/g, "-").slice(0, 90)}`,
      type: ChannelType.GuildText,
      parent: existingSetup.category_id,
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

    // 7. Actualizar configuración
    const { data: updatedSetup, error: updateError } = await supabase
      .from("discord_setups")
      .update({
        roles: [
          ...existingSetup.roles,
          {
            id: roleId,
            emoji,
            party_id: partyId,
            party_name: partyName,
          },
        ],
        channels: {
          ...existingSetup.channels,
          [`party_${partyId}`]: newChannel.id,
        },
      })
      .eq("id", existingSetup.id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      setup: updatedSetup,
      new_channel_id: newChannel.id,
    });
  } catch (error) {
    console.error("Setup error:", error);
    res.status(500).json({
      code: "setup_failed",
      message: error.message || "Failed to update Discord setup",
    });
  }
};
