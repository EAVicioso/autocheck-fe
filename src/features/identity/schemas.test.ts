import { expect, it } from "vitest";
import { registrationSchema, resetSchema } from "./schemas";

it.each([
  ["ñññññññ١", true],
  ["Fixture123", true],
  ["ññññññññ", false],
  ["١٢٣٤٥٦٧٨", false],
  ["ññññññ١", false],
  ["ñ".repeat(256) + "١", false],
])("aplica la misma política de contraseña a registro y recuperación (%s)", (password, valid) => {
  expect(registrationSchema.safeParse({
    correo: "fixture@example.invalid", contrasena: password, nombre: "Fixture",
  }).success).toBe(valid);
  expect(resetSchema.safeParse({ token: "fixture", nuevaContrasena: password }).success).toBe(valid);
});
