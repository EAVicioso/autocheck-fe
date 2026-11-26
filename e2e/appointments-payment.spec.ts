import { expect, test } from "@playwright/test";
import { dominicanDay } from "../src/shared/dates/dominican";
import { awaitPayment, authorize, createVehicle, endpoint, futureSlot, idem, startPayment } from "./fixtures/fullstack";
import { ids, limits } from "./fixtures/srs";

test("PA-03 / PA-04 / PA-12 seleccionar horario no retiene; pago crea retención idempotente", async ({ request }) => {
  const citizen = await authorize(request, "citizen");
  const vehicle = await createVehicle(request, citizen);
  const starts = futureSlot(3);
  const url = endpoint("/api/centros/" + ids.center + "/disponibilidad?fecha=" + dominicanDay(starts));
  for (let read = 0; read < 2; read++) {
    const result = await request.get(url, { headers: citizen });
    expect(result.status()).toBe(200);
    const { bloques } = await result.json();
    const selected = bloques.find((block: { inicioUtc: string; rampaId: string }) =>
      Date.parse(block.inicioUtc) === Date.parse(starts) && block.rampaId === ids.ramp);
    expect(selected?.estado).toBe("LIBRE");
  }

  const mutation = idem(citizen);
  const before = Date.now();
  const payment = await startPayment(request, mutation, vehicle, starts);
  const ttl = Math.round((Date.parse(payment.expiraUtc) - before) / 1000);
  expect(ttl).toBeGreaterThanOrEqual(limits.retentionSeconds[0]);
  expect(ttl).toBeLessThanOrEqual(limits.retentionSeconds[2]);
  expect(await startPayment(request, mutation, vehicle, starts)).toEqual(payment);
  const paid = await awaitPayment(request, citizen, payment.intentoId);
  expect(paid.citaId).toBeTruthy();
});
