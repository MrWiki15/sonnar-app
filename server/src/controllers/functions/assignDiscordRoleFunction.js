import { discordBot } from "../../discord/bot.js";
import axios from "axios";

export const assignDiscordRoleFunction = async (req, res, next) => {
  try {
    const { discordUserId, guildId, roleId, wallet, tokenId } = req.body;

    // Validación
    if (!discordUserId || !guildId || !roleId || !wallet || !tokenId) {
      return res.status(400).json({
        code: "missing_parameters",
        message: "Parámetros requeridos faltantes",
      });
    }

    // verificar si el bot está conectado
    if (!discordBot.user.id) {
      return res.status(400).json({
        code: "missing_parameters",
        message: "El bot no está conectado",
      });
    }

    //verificar que el token esté en la billetera
    const mirrorNodeBaseUrl = "https://testnet.mirrornode.hedera.com/api/v1";
    const response = await axios.get(
      `${mirrorNodeBaseUrl}/tokens/${tokenId}/balances`,
      { params: { "account.id": wallet } }
    );

    const balances = response.data.balances || [];
    const balance = balances.length > 0 ? balances[0].balance : 0;

    if (balance <= 0) {
      return res.status(400).json({
        code: "missing_parameters",
        message: "El token no está en la billetera",
      });
    }

    // Obtener servidor
    const guild = await discordBot.guilds.fetch(guildId).catch(() => {
      throw new Error("Servidor no encontrado o bot no está en el servidor");
    });

    // Verificar permisos del bot
    const botMember = await guild.members.fetch(discordBot.user.id);
    if (!botMember.permissions.has("ManageRoles")) {
      return res.status(403).json({
        code: "missing_permissions",
        message: "El bot no tiene permisos para gestionar roles",
      });
    }

    // Obtener usuario
    const member = await guild.members.fetch(discordUserId).catch(() => {
      throw new Error("Usuario no encontrado en el servidor");
    });

    // Verificar rol
    const role = await guild.roles.fetch(roleId);
    if (!role) {
      return res.status(404).json({
        code: "role_not_found",
        message: "El rol especificado no existe",
      });
    }

    // Verificar jerarquía de roles
    if (role.position >= botMember.roles.highest.position) {
      return res.status(403).json({
        code: "invalid_role_position",
        message: "El rol está por encima de la posición del bot",
      });
    }

    // Asignar rol
    await member.roles.add(roleId);

    res.json({
      success: true,
      message: "Rol asignado exitosamente",
    });
  } catch (error) {
    // Manejo específico de errores de la API de Discord
    if (error.message === "Unknown Member") {
      return res.status(404).json({
        code: "user_not_in_guild",
        message: "El usuario no está en el servidor",
      });
    }

    if (error.message.includes("Missing Permissions")) {
      return res.status(403).json({
        code: "missing_permissions",
        message: "Permisos insuficientes para realizar esta acción",
      });
    }

    next(error);
  }
};
