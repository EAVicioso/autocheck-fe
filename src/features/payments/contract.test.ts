import { expect, it } from "vitest";
import { citizenCommand } from "./contract";

it("el inicio desde el navegador solo admite datos de la reserva", () => {
  const id = "10000000-0000-4000-8000-000000000001";
  const body = { vehiculoId: id, centroId: id, rampaId: id, inicioUtc: "2026-11-29T12:00:00+00:00" };
  expect(citizenCommand.safeParse({ action: "start", key: id, body }).success).toBe(true);
  expect(citizenCommand.safeParse({ action: "start", key: id, body: { ...body, escenario: "RECHAZADO" } }).success).toBe(false);
  expect(citizenCommand.safeParse({ action: "webhook", id }).success).toBe(false);
});
