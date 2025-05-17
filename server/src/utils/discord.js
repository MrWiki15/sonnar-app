// utils/discord.js
import axios from "axios";

export const getDiscordGuilds = async (accessToken) => {
  try {
    const response = await axios.get(
      "https://discord.com/api/users/@me/guilds",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error("Respuesta inválida de la API de Discord");
    }

    return response.data.map((guild) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon || undefined,
      permissions: guild.permissions,
      features: guild.features || [],
      owner: guild.owner || false,
    }));
  } catch (error) {
    console.error(
      "Error obteniendo guilds de Discord:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Error al obtener servidores de Discord"
    );
  }
};
