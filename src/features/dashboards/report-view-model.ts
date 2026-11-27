import type { Alerta } from "@/shared/api/contract.generated";

const percentage = new Intl.NumberFormat("es-DO", { style: "percent", maximumFractionDigits: 2 });

export function rejectionLabel(closed: number, rejectedPercentage: number | null) {
  return closed === 0 || rejectedPercentage === null || !Number.isFinite(rejectedPercentage)
    ? "Sin datos" : percentage.format(rejectedPercentage / 100);
}

export function distinctAlertWindows(alerts: readonly Alerta[]) {
  const windows = new Map<string, Alerta>();
  for (const alert of alerts) {
    const finalInspection = alert.inspecciones.at(-1);
    if (!finalInspection) continue;
    const key = [alert.inspectorId, alert.centroId, finalInspection].join(":");
    if (!windows.has(key)) windows.set(key, alert);
  }
  return [...windows.values()];
}
