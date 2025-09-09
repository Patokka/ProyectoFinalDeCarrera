// app/lib/auth.ts
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!; // mismo secreto que en FastAPI

interface JwtPayload {
  cuil: string;
  nombre: string;
  apellido: string;
  rol: string;
  exp: number;
  iat?: number;
}

export function getUserFromCookie(): JwtPayload | null {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    // Verifica y devuelve el payload decodificado
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch (err) {
    console.error("Token inválido o expirado:", err);
    return null;
  }
}