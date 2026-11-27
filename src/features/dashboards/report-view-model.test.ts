import { expect, it } from "vitest";
import type { Alerta } from "@/shared/api/contract.generated";
import { reportFilters } from "./report-filters";
import { distinctAlertWindows, rejectionLabel } from "./report-view-model";

it("presenta el porcentaje proyectado y el caso sin cerradas", () => {
  expect(rejectionLabel(0, null)).toBe("Sin datos");
  expect(rejectionLabel(4, 25)).toBe("25%");
  expect(rejectionLabel(4, 0)).toBe("0%");
});

it("conserva días civiles inclusivos, incluida la fecha límite del rango", () => {
  expect(reportFilters.safeParse({ desde: "2026-11-26", hasta: "2026-11-26" }).success).toBe(true);
  expect(reportFilters.safeParse({ desde: "2026-11-26", hasta: "2027-11-27" }).success).toBe(true);
  expect(reportFilters.safeParse({ desde: "2026-11-26", hasta: "2027-11-28" }).success).toBe(false);
  expect(reportFilters.safeParse({ desde: "2026-11-27", hasta: "2026-11-26" }).success).toBe(false);
});

it("deduplica por inspector, centro y cierre final manteniendo las 21 inspecciones de la proyección", () => {
  const base: Alerta = {
    id: "a", inspectorId: "inspector", centroId: "centro", aprobadas: 20, total: 21, porcentaje: 2000 / 21,
    desdeUtc: "2026-11-26T03:59:59Z", hastaUtc: "2026-11-26T04:00:00Z", fecha: "2026-11-26",
    inspecciones: Array.from({ length: 21 }, (_, index) => String(index)),
  };
  const result = distinctAlertWindows([base, { ...base, id: "b" }, { ...base, id: "c", centroId: "otro" },
    { ...base, id: "d", inspecciones: [...base.inspecciones.slice(1), "21"] }]);
  expect(result.map((window) => window.id)).toEqual(["a", "c", "d"]);
  expect(result[0].total).toBe(21);
});
