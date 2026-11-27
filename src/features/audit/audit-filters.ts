import { z } from "zod";
import { dominicanLocalToUtc, inclusiveEndUtc } from "@/core/dominican-range";
import { optionalDay, optionalId, pageNumber } from "@/core/search";

export const auditFilters = z.object({
  desde: optionalDay,
  hasta: optionalDay,
  operacion: z.string().trim().max(128).optional(),
  entidad: z.string().trim().max(256).optional(),
  actorId: optionalId,
  pagina: pageNumber,
}).refine(({ desde, hasta }) => hasta !== "9999-12-31" && (!desde || !hasta || desde <= hasta));

export function auditDateBounds({ desde, hasta }: Pick<z.infer<typeof auditFilters>, "desde" | "hasta">) {
  return {
    desdeUtc: desde ? dominicanLocalToUtc(desde + "T00:00") : undefined,
    hastaUtc: hasta ? inclusiveEndUtc(hasta) : undefined,
  };
}
