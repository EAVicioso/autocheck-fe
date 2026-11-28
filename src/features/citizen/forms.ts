import { z } from "zod";
import type { Problem } from "@/shared/api/contract.generated";
import { formErrorPath } from "@/shared/forms/problem-path";

export const profileForm = z.object({
  nombre: z.string().trim().min(1, "Escribe tu nombre.").max(120),
  celular: z.string().trim().max(30),
});

export type Feedback = { kind: "notice" | "error"; message: string; fields?: Record<string, string> };

const conflicts: Record<string, string> = {
  REGISTRO_DUPLICADO: "Ya existe un vehículo con esa matrícula o VIN.",
  OPERACIONES_PENDIENTES: "El vehículo tiene operaciones pendientes y no se puede archivar.",
  VERSION_DESACTUALIZADA: "El registro cambió. Recarga la página antes de guardar.",
  RECURSO_ARCHIVADO: "El registro ya está archivado.",
};

export function rejected(status: number, problem: Problem | null): Feedback {
  const fields = Object.fromEntries(Object.entries(problem?.errors ?? {})
    .flatMap(([path, errors]) => errors[0] ? [[formErrorPath(path), errors[0]]] : []));
  const code = problem?.codigo ?? "";
  const message = Object.hasOwn(conflicts, code) ? conflicts[code]
    : status === 400 ? "Revisa los datos del formulario."
    : status === 403 || status === 404 ? "El recurso no está disponible."
    : status === 429 ? "Demasiados intentos. Espera antes de volver a enviar."
    : "No se pudo confirmar el cambio. Consulta el estado antes de volver a enviar.";
  return { kind: "error", message, fields };
}

