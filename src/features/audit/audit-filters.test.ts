import { expect, it } from "vitest";
import { auditDateBounds, auditFilters } from "./audit-filters";

it("envía filtros UTC inclusivos representando días completos de Santo Domingo", () => {
  const parsed = auditFilters.parse({ desde: "2026-11-25", hasta: "2026-11-26", operacion: "  Reglas  " });
  expect(auditDateBounds(parsed)).toEqual({ desdeUtc: "2026-11-25T04:00:00.000Z", hastaUtc: "2026-11-27T03:59:59.9999999Z" });
  expect(parsed.operacion).toBe("Reglas");
  expect(auditFilters.safeParse({ desde: "2026-11-27", hasta: "2026-11-26" }).success).toBe(false);
});
