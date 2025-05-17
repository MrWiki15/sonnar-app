// utils/auth.ts
import jwt from "jsonwebtoken";

export const generateJWT = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "15m",
    issuer: "sonnar",
    audience: "discord-integration",
  });
};
