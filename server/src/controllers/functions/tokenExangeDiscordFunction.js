// controllers/discordController.js
import axios from "axios";
import jwt from "jsonwebtoken";
import { getDiscordGuilds } from "../../utils/discord.js";

export const tokenExchangeDiscordFunction = async (req, res, next) => {
  try {
    const { code, redirect_uri } = req.body;

    if (!code || !redirect_uri) {
      return res
        .status(400)
        .json({ error: "Parámetros requeridos: code y redirect_uri" });
    }

    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri,
        scope: "identify guilds",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const discordToken = tokenResponse.data.access_token;
    const userGuilds = await getDiscordGuilds(discordToken);

    const tokenPayload = {
      access_token: discordToken,
      guilds: userGuilds,
      exp: Math.floor(Date.now() / 1000) + 900, // 15 minutos
    };

    const jwtToken = jwt.sign(tokenPayload, process.env.DISCORD_JWT_SECRET, {
      issuer: "sonnar",
      audience: "discord-integration",
    });

    res.json({
      token: jwtToken,
      guilds: userGuilds.filter((g) => (g.permissions & 0x8) === 0x8),
    });
  } catch (error) {
    next(error);
  }
};
