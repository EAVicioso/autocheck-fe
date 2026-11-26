import { expect, test } from "@playwright/test";
import { authorize, endpoint, loginPage } from "./fixtures/fullstack";

test("PA-08 / PA-13 devuelve métricas sin datos y restringe la auditoría", async ({ request }) => {
  const admin = await authorize(request, "admin");
  const citizen = await authorize(request, "citizen");
  const stats = await request.get(endpoint("/api/reportes/inspecciones?desde=2000-01-01&hasta=2000-01-01"), { headers: admin });
  expect(stats.status()).toBe(200);
  const metrics = await stats.json();
  expect(metrics).toMatchObject({ estado: "Sin datos", cerradas: 0, porcentajeRechazo: null });
  expect(metrics).toHaveProperty("ultimaActualizacionUtc");
  expect((await request.get(endpoint("/api/auditorias"), { headers: citizen })).status()).toBe(403);
  expect((await request.get(endpoint("/api/auditorias"), { headers: admin })).status()).toBe(200);
});

test("PA-09 muestra contingencia exacta y solo reintenta por acción explícita", async ({ page }) => {
  await loginPage(page, "citizen");
  await expect(page.getByRole("heading", { name: "Área ciudadana" })).toBeVisible();
  const widget = page.getByRole("complementary", { name: "Asistencia" });
  await widget.getByRole("textbox", { name: "Consulta" }).fill("Consulta E2E de contingencia");
  await widget.getByRole("button", { name: "Enviar consulta" }).click();
  await expect(widget.getByRole("alert")).toHaveText("El servicio de asistencia no está disponible temporalmente. Intenta de nuevo.");
  const response = page.waitForResponse((r) => r.url().endsWith("/api/asistencia") && r.request().method() === "POST");
  await widget.getByRole("button", { name: "Reintentar consulta" }).click();
  expect((await response).status()).toBe(503);
});
