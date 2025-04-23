import axios from "axios";
import supabase from "../../db/db.js";
import jwt from "jsonwebtoken";

export const callbackDiscordFunction = async (req, res, next) => {
  try {
    // 1. Validar parámetros de la URL
    const { code } = req.query;

    // 3. Intercambiar código por tokens
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

    // 4. Obtener datos del usuario
    const [userData, guildsData] = await Promise.all([
      axios.get("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
      }),
      axios.get("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
      }),
    ]);

    const { data: existingUser } = await supabase
      .from("users_discord")
      .select("*")
      .eq("discord_data.user.id", userData.user.id)
      .single();

    if (existingUser) {
      //verificar si el token sigue funcionando
      const { data: userData } = await axios.get(
        `https://discord.com/api/users/@me`,
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.data.access_token}`,
          },
        }
      );

      if (userData.id !== existingUser.discord_data.user.id) {
        //token invalido, eliminar de la base de datos
        await supabase.from("users_discord").delete().eq("id", existingUser.id);

        return res.redirect(
          302,
          `${process.env.FRONTEND_URL}/?error=discord_token_invalid`
        );
      }
    }

    // 5. Guardar en Supabase
    const { error } = await supabase.from("users_discord").insert({
      discord_data: {
        user: userData.data,
        access_token: tokenResponse.data.access_token,
        refresh_token: tokenResponse.data.refresh_token,
        guilds: guildsData.data,
      },
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    const data = await supabase
      .from("users_discord")
      .select("*")
      .eq("discord_data.user.id", userData.data.id)
      .single();
    if (!data) throw new Error("No se encontró el usuario en la base de datos");

    // 6. Crear JWT seguro para el frontend
    const token = jwt.sign(
      {
        sub: userData.data.id,
        access_token: tokenResponse.data.access_token,
        guilds: guildsData.data,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hora
      },
      process.env.DISCORD_JWT_SECRET
    );

    // 7. Redirigir al frontend con el token
    res.redirect(
      302,
      `${process.env.FRONTEND_URL}/token=${encodeURIComponent(token)}`
    );
  } catch (error) {
    console.error("Callback error:", error);
    const errorType = error.response?.data?.error || "internal_error";
    res.redirect(302, `${process.env.FRONTEND_URL}?error=${errorType}`);
  }
};
