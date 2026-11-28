import { expect, it } from "vitest";
import type { Alerta } from "@/shared/api/contract.generated";
import { parseReportFilters, reportFilters } from "./report-filters";
import { distinctAlertWindows, percentageLabel, rejectionLabel } from "./report-view-model";

it("presenta el porcentaje proyectado y el caso sin cerradas", () => {
  expect(rejectionLabel(0, null)).toBe("Sin datos");
  expect(rejectionLabel(4, 25)).toBe("25%");
  expect(rejectionLabel(4, 0)).toBe("0%");
  expect(percentageLabel(2000 / 21)).toBe("95.24%");
  expect(percentageLabel(100)).toBe("100%");
});

it("conserva días civiles inclusivos, incluida la fecha límite del rango", () => {
  expect(reportFilters.safeParse({ desde: "2026-11-26", hasta: "2026-11-26" }).success).toBe(true);
  expect(reportFilters.safeParse({ desde: "2026-11-26", hasta: "2027-11-27" }).success).toBe(true);
  expect(reportFilters.safeParse({ desde: "2026-11-26", hasta: "2027-11-28" }).success).toBe(false);
  expect(reportFilters.safeParse({ desde: "2026-11-27", hasta: "2026-11-26" }).success).toBe(false);
});

it("aplica el centro asignado antes de validar el filtro y conserva la selección del administrador global", () => {
  const assigned = "00000000-0000-4000-8000-000000000001";
  const selected = "00000000-0000-4000-8000-000000000002";
  expect(parseReportFilters({ centroId: selected }, assigned).data?.centroId).toBe(assigned);
  expect(parseReportFilters({ centroId: "incorrecto" }, assigned).data?.centroId).toBe(assigned);
  expect(parseReportFilters({ centroId: selected }, null).data?.centroId).toBe(selected);
  expect(parseReportFilters({ centroId: "incorrecto" }, null).success).toBe(false);
});

it("deduplica por ID de alerta y conserva ventanas distintas con el mismo último elemento", () => {
  const base: Alerta = {
    id: "a", inspectorId: "inspector", centroId: "centro", aprobadas: 20, total: 21, porcentaje: 2000 / 21,
    desdeUtc: "2026-11-26T03:59:59Z", hastaUtc: "2026-11-26T04:00:00Z", fecha: "2026-11-26",
    inspecciones: Array.from({ length: 21 }, (_, index) => String(index)),
  };
  const duplicate = { ...base, inspecciones: [...base.inspecciones].reverse() };
  const nextWindow = { ...base, id: "b", inspecciones: ["21", ...base.inspecciones.slice(1)] };
  const result = distinctAlertWindows([base, duplicate, nextWindow]);
  expect(result.map((window) => window.id)).toEqual(["a", "b"]);
  expect(result[0].total).toBe(21);
});
