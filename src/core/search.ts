import { z } from "zod";

export type SearchParams = Record<string, string | string[] | undefined>;
export const pageSize = 20;
export const pageNumber = z.coerce.number().int().min(1).max(500000).catch(1);
export const uuid = z.guid().refine((value) => value !== "00000000-0000-0000-0000-000000000000");
export const optionalId = z.preprocess((value) => value === "" ? undefined : value, uuid.optional());
export const optionalDay = z.preprocess((value) => value === "" ? undefined : value, z.iso.date().optional());

export function searchHref(path: string, values: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? path + "?" + query : path;
}
