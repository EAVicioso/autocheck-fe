import type { DiaRD, Utc } from "@/shared/api/contract.generated";

export const dominicanTimeZone = "America/Santo_Domingo";
const calendar = new Intl.DateTimeFormat("es-DO", {
  timeZone: dominicanTimeZone, calendar: "iso8601", numberingSystem: "latn",
  year: "numeric", month: "2-digit", day: "2-digit",
});

export function dominicanDay(instant: Utc | Date = new Date()): DiaRD {
  const parts = calendar.formatToParts(typeof instant === "string" ? new Date(instant) : instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return [get("year")?.padStart(4, "0"), get("month"), get("day")].join("-");
}

export function utcInstant(date: Date): Utc {
  return date.toISOString();
}
