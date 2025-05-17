import axios from "axios";
import supabase from "../../db/db.js";
import jwt from "jsonwebtoken";

export const callbackDiscordFunction = async (req, res, next) => {
  try {
    // 1. Validar parámetros de la URL
    const { code } = req.query;
    if (!code) {
      return res.redirect(302, `${process.env.FRONTEND_URL}/?error=no_code`);
    }

    // 2. Intercambiar código por tokens
    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI,
    });

    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      params,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    // 3. Obtener datos del usuario
    const [userData, guildsData] = await Promise.all([
      axios.get("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
      }),
      axios.get("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
      }),
    ]);

    // 4. Verificar usuario existente
    const { data: existingUser } = await supabase
      .from("users_discord")
      .select("*")
      .eq("discord_data.user.id", userData.data.id)
      .single();

    if (existingUser) {
      // Actualizar usuario existente
      const { error: updateError } = await supabase
        .from("users_discord")
        .update({
          discord_data: {
            user: userData.data,
            access_token: tokenResponse.data.access_token,
            refresh_token: tokenResponse.data.refresh_token,
            guilds: guildsData.data,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingUser.id);

      if (updateError) throw updateError;
    } else {
      // Crear nuevo usuario
      const { error: insertError } = await supabase
        .from("users_discord")
        .insert({
          discord_data: {
            user: userData.data,
            access_token: tokenResponse.data.access_token,
            refresh_token: tokenResponse.data.refresh_token,
            guilds: guildsData.data,
          },
          updated_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;
    }

    // 5. Crear JWT
    const token = jwt.sign(
      {
        sub: userData.data.id,
        access_token: tokenResponse.data.access_token,
        user: {
          id: userData.data.id,
          username: userData.data.username,
          avatar: userData.data.avatar,
        },
        guilds: guildsData.data,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      process.env.DISCORD_JWT_SECRET
    );

    // 6. Redirigir al frontend
    res.redirect(
      302,
      `${process.env.FRONTEND_URL}/?token=${encodeURIComponent(token)}`
    );
  } catch (error) {
    console.error("Callback error:", error);
    const errorType = error.response?.data?.error || "internal_error";
    const errorMessage = encodeURIComponent(error.message || "Unknown error");
    res.redirect(
      302,
      `${process.env.FRONTEND_URL}/?error=${errorType}&message=${errorMessage}`
    );
  }
};
