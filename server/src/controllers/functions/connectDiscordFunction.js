import axios from "axios";
import jwt from "jsonwebtoken";
import supabase from "../../db/db.js";

const getManagedGuilds = (guilds) => {
  return guilds.filter(
    (g) =>
      (g.permissions & 0x8) === 0x8 || // ADMINISTRATOR
      (g.permissions & 0x20) === 0x20 // MANAGE_GUILD
  );
};

export const connectDiscordFunction = async (req, res) => {
  try {
    const { code, state } = req.body;

    console.log(code);
    console.log(state);

    // 2. Intercambiar código por token
    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI,
    });

    const tokenRes = await axios.post(
      "https://discord.com/api/oauth2/token",
      params,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 5000,
      }
    );

    // 3. Obtener datos del usuario
    const [userData, guildsData] = await Promise.all([
      axios.get("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
        timeout: 5000,
      }),
      axios.get("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
        timeout: 5000,
      }),
    ]);

    // 4. Guardar en Supabase (tabla users)
    const { error } = await supabase.from("users").upsert(
      {
        id: userData.data.id,
        discord_data: {
          access_token: tokenRes.data.access_token,
          refresh_token: tokenRes.data.refresh_token,
          guilds: getManagedGuilds(guildsData.data),
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) throw error;

    // 5. Generar JWT seguro
    const token = jwt.sign(
      {
        sub: userData.data.id,
        access_token: tokenRes.data.access_token,
        guilds: getManagedGuilds(guildsData.data),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hora
      },
      process.env.JWT_SECRET,
      { algorithm: "HS256" }
    );

    res.json({
      token,
      user: {
        id: userData.data.id,
        username: userData.data.username,
        guilds: getManagedGuilds(guildsData.data),
      },
    });
  } catch (error) {
    console.error("Discord connection error:", error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || "Internal server error";
    res.status(status).json({
      code: "discord_connection_failed",
      message,
    });
  }
};
