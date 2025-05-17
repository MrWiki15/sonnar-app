import axios from "axios";

export const getDiscordRolesFunction = async (req, res, next) => {
  const { guildId } = req.body;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const botId = process.env.DISCORD_BOT_ID;

  // Validación
  if (!guildId || !/^\d{17,19}$/.test(guildId)) {
    return res.status(400).json({ error: "ID de servidor inválido" });
  }

  try {
    // Verificar permisos del bot
    const guildRes = await axios.get(
      `https://discord.com/api/v10/guilds/${guildId}`,
      {
        headers: { Authorization: `Bot ${botToken}` },
      }
    );

    if (!guildRes.data?.roles?.some((item) => item.name === "Sonnar")) {
      return res.status(403).json({
        error: "El bot no está en este servidor o no tiene acceso",
        debug: guildRes.data,
      });
    }

    // Obtener roles y membresía del bot
    const [rolesRes, memberRes] = await Promise.all([
      axios.get(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
        headers: { Authorization: `Bot ${botToken}` },
      }),
      axios.get(
        `https://discord.com/api/v10/guilds/${guildId}/members/${botId}`,
        {
          headers: { Authorization: `Bot ${botToken}` },
        }
      ),
    ]);

    // Calcular posición máxima
    const botRoles = memberRes.data.roles;
    const botHighest = rolesRes.data
      .filter((r) => botRoles.includes(r.id))
      .reduce((max, r) => Math.max(max, r.position), 0);

    // Filtrar y cachear
    const manageable = rolesRes.data
      .filter((r) => r.position < botHighest)
      .map(({ id, name, color }) => ({ id, name, color }));

    res.json({ roles: manageable });
  } catch (error) {
    // Manejo específico de errores
    if (error.response?.status === 404) {
      return res.status(404).json({ error: "Recurso no encontrado" });
    }
    if (error.response?.status === 403) {
      return res.status(403).json({ error: "Acceso denegado" });
    }
    next(error);
  }
};
