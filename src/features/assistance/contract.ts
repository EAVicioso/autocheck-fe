import { z } from "zod";
import type { Asistencia } from "@/shared/api/contract.generated";
export { assistanceFallback } from "@/shared/api/contract.generated";

export const assistanceTimeoutMs = 3000;
export const assistanceTimeoutHeader = "X-AutoCheck-Assistance-Timeout";
export const assistanceInvalid = {
  respuesta: "Escribe una consulta de 1 a 2000 caracteres.",
  categoria: "NO_DETERMINADA",
  codigo: "SOLICITUD_INVALIDA",
} as const satisfies Asistencia;
export const assistanceSchema = z.strictObject({
  consulta: z.string().trim().min(1, "Escribe una consulta.").max(2000, "Usa hasta 2000 caracteres."),
});

export const assistanceReply = z.strictObject({
  respuesta: z.string().refine((value) => value.trim().length > 0),
  categoria: z.enum(["USO_PLATAFORMA", "ITV", "FUERA_DE_ALCANCE", "NO_DETERMINADA"]),
  codigo: z.enum(["OK", "INFORMACION_INSUFICIENTE", "FUERA_DE_ALCANCE", "SOLICITUD_INVALIDA", "SERVICIO_NO_DISPONIBLE"]),
}) satisfies z.ZodType<Asistencia>;
