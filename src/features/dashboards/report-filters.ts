import { z } from "zod";
import { optionalDay, optionalId, pageNumber, type SearchParams } from "@/core/search";
import { dominicanDay } from "@/shared/dates/dominican";

const maxDurationMs = 366 * 86_400_000;

export const reportFilters = z.object({
  desde: optionalDay,
  hasta: optionalDay,
  centroId: optionalId,
  rampaId: optionalId,
  inspectorId: optionalId,
  pagina: pageNumber,
  paginaAlertas: pageNumber,
}).transform(({ desde = dominicanDay(), hasta = desde, ...rest }) => ({ desde, hasta, ...rest }))
  .refine(({ desde, hasta }) => {
    const duration = Date.parse(hasta) - Date.parse(desde);
    return duration >= 0 && duration <= maxDurationMs && hasta !== "9999-12-31";
  });

export function parseReportFilters(search: SearchParams, profileCenter: string | null) {
  return reportFilters.safeParse({ ...search, centroId: profileCenter ?? search.centroId });
}
