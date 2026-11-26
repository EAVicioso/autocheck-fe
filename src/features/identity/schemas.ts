import { z } from "zod";

const correo = z.string().trim().max(254).email("Escribe un correo válido.");
const password = z.string().min(8).max(256)
  .regex(/\p{L}/u, "Incluye al menos una letra.")
  .regex(/\p{N}/u, "Incluye al menos un número.");
export const registrationSchema = z.strictObject({
  correo, contrasena: password, nombre: z.string().trim().min(1).max(120),
});
export const loginSchema = z.strictObject({ correo, contrasena: z.string().min(1).max(256) });
export const recoverySchema = z.strictObject({ correo });
export const resetSchema = z.strictObject({ token: z.string().min(1).max(8192), nuevaContrasena: password });
