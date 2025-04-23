export const getDiscordRolesFunction = async (req, res, next) => {
  const { guildId, token } = req.params;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const botId = process.env.DISCORD_BOT_ID; // Asegúrate de definir BOT_ID en .env

  try {
    // 1. Obtener todos los roles del guild
    const rolesResponse = await axios.get(
      `https://discord.com/api/v10/guilds/${guildId}/roles`,
      { headers: { Authorization: `Bot ${botToken}` } }
    );
    const allRoles = rolesResponse.data;

    // 2. Obtener roles asignados al bot para determinar la posición más alta
    const memberResponse = await axios.get(
      `https://discord.com/api/v10/guilds/${guildId}/members/${botId}`,
      { headers: { Authorization: `Bot ${botToken}` } }
    );
    const botRoles = memberResponse.data.roles; // array de IDs

    // 3. Calcular la posición más alta del bot
    const botHighest = allRoles
      .filter((r) => botRoles.includes(r.id))
      .reduce((max, r) => (r.position > max ? r.position : max), 0);

    // 4. Filtrar roles por posición menor que la del bot
    const manageable = allRoles
      .filter((r) => r.position < botHighest)
      .map((r) => ({ id: r.id, name: r.name }));

    return res.json({ roles: manageable });
  } catch (error) {
    console.error("Error obteniendo roles del guild vía API:", error);
    return res
      .status(500)
      .json({ error: "No se pudieron obtener los roles del servidor" });
  }
};
