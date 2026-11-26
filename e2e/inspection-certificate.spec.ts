import { expect, test } from "@playwright/test";
import { endpoint, idem, prepareInspection } from "./fixtures/fullstack";

test("PA-05 / PA-06 / PA-07 / PA-10 cierra, consulta historial y emite QR/PDF", async ({ request, page }) => {
  test.setTimeout(75_000);
  const { inspection, vehicle, payment, citizen, inspector } = await prepareInspection(request, 7);
  const cancellation = await request.post(endpoint("/api/citas/" + payment.citaId + "/cancelacion"), {
    headers: idem(citizen), data: { motivo: "Prueba de inspección iniciada" },
  });
  expect(cancellation.status()).toBe(409);
  const path = "/api/inspecciones/" + inspection.id;
  const record = await request.put(endpoint(path + "/registro"), {
    headers: inspector, data: { defectos: [], versionEsperada: inspection.version },
  });
  expect(record.status()).toBe(200);
  const closed = await request.post(endpoint(path + "/cierre"), {
    headers: idem(inspector), data: { versionEsperada: (await record.json()).version },
  });
  expect(closed.status()).toBe(200);
  expect(await closed.json()).toMatchObject({ estado: "CERRADA", resultado: "Aprobado" });
  const history = await request.get(endpoint("/api/vehiculos/" + vehicle.id + "/historial"), { headers: citizen });
  expect(history.status()).toBe(200);
  expect((await history.json()).items).toEqual(expect.arrayContaining([expect.objectContaining({ resultado: "Aprobado" })]));
  const issued = await request.post(endpoint(path + "/certificado"), { headers: idem(citizen) });
  expect([200, 202]).toContain(issued.status());
  const certificate = await issued.json();
  const certPath = "/api/certificados/" + certificate.id;
  await expect.poll(async () => {
    const result = await request.get(endpoint(certPath), { headers: citizen });
    return (await result.json()).estado;
  }, { timeout: 30_000 }).toBe("EMITIDO");
  const pdf = await request.get(endpoint(certPath + "/pdf"), { headers: citizen });
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");

  const qr = "/verificar/" + certificate.id;
  await page.goto(qr + "?hash=" + certificate.hashManifiesto);
  const main = page.getByRole("main");
  await expect(main.getByText("Centro E2E")).toBeVisible();
  await expect(main.locator("dd")).toHaveCount(4);
  await expect(main.getByText(/ciudadano1@example\.test/)).toHaveCount(0);
  await page.goto(qr + "?hash=" + (certificate.hashManifiesto === "a".repeat(64) ? "b" : "a").repeat(64));
  await expect(main.getByText("Integridad no válida", { exact: true })).toBeVisible();
  await page.goto("/verificar/90000000-0000-4000-8000-000000000001?hash=" + "a".repeat(64));
  await expect(main.getByText("Certificado no encontrado", { exact: true })).toBeVisible();
});
