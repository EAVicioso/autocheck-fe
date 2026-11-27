import { dominicanTimeZone } from "@/shared/dates/dominican";

const offset = new Intl.DateTimeFormat("en", { timeZone: dominicanTimeZone, timeZoneName: "longOffset" });

export function dominicanLocalToUtc(local: string) {
  const time = local.length === 16 ? local + ":00" : local;
  const approximate = new Date(time + "Z");
  const zone = offset.formatToParts(approximate).find((part) => part.type === "timeZoneName")?.value;
  return new Date(time + (zone?.slice(3) || "Z")).toISOString();
}

export function inclusiveEndUtc(day: string) {
  const nextDay = new Date(day + "T00:00Z");
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const next = Date.parse(dominicanLocalToUtc(nextDay.toISOString().slice(0, 16)));
  // The API's inclusive bound accepts .NET ticks (100 ns).
  return new Date(next - 1000).toISOString().replace(".000Z", ".9999999Z");
}
