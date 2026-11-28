import type { Alerta } from "@/shared/api/contract.generated";

const percentage = new Intl.NumberFormat("es-DO", { style: "percent", maximumFractionDigits: 2 });

export function percentageLabel(value: number) {
  return Number.isFinite(value) ? percentage.format(value / 100) : "Sin datos";
}

export function rejectionLabel(closed: number, rejectedPercentage: number | null) {
  return closed === 0 || rejectedPercentage === null ? "Sin datos" : percentageLabel(rejectedPercentage);
}

export function distinctAlertWindows(alerts: readonly Alerta[]) {
  const windows = new Map<string, Alerta>();
  for (const alert of alerts) {
    if (!windows.has(alert.id)) windows.set(alert.id, alert);
  }
  return [...windows.values()];
}
