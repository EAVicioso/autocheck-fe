import { expect, test } from "@playwright/test";
import { endpoint, idem, loginPage, prepareAssignedAppointment } from "./fixtures/fullstack";

test("PA-05 / PA-06 / PA-07 / PA-10 cierra, consulta historial y emite QR/PDF desde la interfaz", async ({ request, page }, info) => {
  test.setTimeout(100_000);
  const { vehicle, payment, citizen } = await prepareAssignedAppointment(request, info.project.name === "inspector-tablet-touch" ? 11 : 7);
  await loginPage(page, "inspector");
  const appointment = page.getByRole("listitem").filter({ hasText: payment.citaId! });
  const start = appointment.getByRole("button", { name: "Iniciar inspección" });
  await expect(start).toBeVisible();
  if (info.project.name === "inspector-tablet-touch") {
    const bounds = await start.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    await start.tap();
  } else {
    await start.click();
  }
  await expect(page).toHaveURL(/\/inspector\/inspecciones\/[\w-]+$/);
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
  const cancellation = await request.post(endpoint("/api/citas/" + payment.citaId + "/cancelacion"), {
    headers: idem(citizen), data: { motivo: "Inspección iniciada" },
  });
  expect(cancellation.status()).toBe(409);
  const close = page.getByRole("button", { name: "Cerrar inspección" });
  await expect(close).toBeDisabled();
  await page.getByRole("button", { name: "Guardar registro" }).click();
  await expect(page.getByText("Registro guardado.")).toBeVisible();
  await close.click();
  await page.getByRole("button", { name: "Confirmar cierre" }).click();
  await expect(page.getByRole("heading", { name: "Aprobado" })).toBeVisible();

  await page.context().clearCookies();
  await loginPage(page, "citizen");
  await page.getByRole("link", { name: "Historial vehicular" }).click();
  await page.getByRole("link", { name: vehicle.matricula }).click();
  await page.getByRole("link", { name: "Ver detalle" }).click();
  await expect(page).toHaveURL(new RegExp("/ciudadano/inspecciones/" + id + "$"));
  await page.getByRole("button", { name: "Solicitar certificado" }).click();
  await expect(page).toHaveURL(/\/ciudadano\/certificados\/[\w-]+$/);
  const certificateId = new URL(page.url()).pathname.split("/").at(-1)!;
  const download = page.getByRole("button", { name: "Descargar PDF" });
  await expect(download).toBeVisible({ timeout: 40_000 });
  const downloaded = page.waitForEvent("download");
  await download.click();
  expect((await downloaded).suggestedFilename()).toBe("certificado-" + certificateId + ".pdf");
  const pdfPath = "/api/certificados/" + certificateId + "/pdf";
  const pdf = await page.request.get(pdfPath);
  expect(pdf.status()).toBe(200);
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");
  expect((await request.get(pdfPath)).status()).toBe(401);

  await page.getByRole("link", { name: "Abrir verificación pública" }).click();
  await expect(page).toHaveURL(new RegExp("/verificar/" + certificateId + "\\?hash=[0-9a-f]{64}$"));
  const url = new URL(page.url());
  const main = page.getByRole("main");
  await expect(main.getByText("Centro E2E")).toBeVisible();
  await expect(main.locator("dd")).toHaveCount(4);
  await expect(main.getByText(/ciudadano1@example\.test/)).toHaveCount(0);
  url.searchParams.set("hash", url.searchParams.get("hash") === "a".repeat(64) ? "b".repeat(64) : "a".repeat(64));
  await page.goto(url.href);
  await expect(main.getByText("Integridad no válida", { exact: true })).toBeVisible();
  await page.goto("/verificar/90000000-0000-4000-8000-000000000001?hash=" + "a".repeat(64));
  await expect(main.getByText("Certificado no encontrado", { exact: true })).toBeVisible();
});
