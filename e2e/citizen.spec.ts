import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { dominicanDay } from "../src/shared/dates/dominican";
import { endpoint, futureSlot, loginPage } from "./fixtures/fullstack";

const fullStack = process.env.AUTOCHECK_E2E_FULLSTACK === "1";

async function login(page: Page) {
  if (fullStack) await loginPage(page, "citizen");
  else {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("ciudadano@example.invalid");
    await page.getByLabel("Contraseña", { exact: true }).fill("Fixture123");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
  }
  await expect(page.getByRole("heading", { name: "Área ciudadana" })).toBeVisible();
}

async function createVehicle(page: Page) {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
  const plate = "E2E-" + suffix;
  await page.getByLabel("Matrícula").fill(plate);
  await page.getByLabel("VIN").fill("E2EAC" + suffix);
  await page.getByLabel("Año").fill("2020");
  await page.getByLabel("Marca").selectOption({ index: 1 });
  await page.getByLabel("Modelo").selectOption({ index: 1 });
  await page.getByLabel("Color").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Guardar vehículo" }).click();
  return plate;
}

async function selectSlot(page: Page, index = 0) {
  await page.getByLabel("Centro").selectOption({ index: 1 });
  await page.getByLabel("Fecha de la cita").fill(dominicanDay(futureSlot(3)));
  await page.getByRole("radio", { name: /· Libre$/ }).nth(index).check();
  await page.getByRole("button", { name: "Revisar reserva" }).click();
}

test.beforeEach(async ({ request }) => {
  if (!fullStack) await request.post(endpoint("/__fixture/citizen"), { data: {} });
});

test("PA-03/04/12a crea vehículo, reserva, confirma el pago y cancela la cita", async ({ page, browser }, info) => {
  await login(page);
  await page.getByRole("link", { name: "Mis vehículos" }).click();
  await page.getByRole("link", { name: "Registrar vehículo" }).click();
  const plate = await createVehicle(page);
  await expect(page.getByRole("link", { name: "Editar " + plate })).toBeVisible();
  await page.goto("/ciudadano/citas/nueva");
  await page.getByLabel("Vehículo").selectOption({ label: plate });
  await selectSlot(page, fullStack ? (info.project.name === "mobile-webkit" ? 12 : 10) : 0);
  await page.getByRole("button", { name: "Iniciar pago simulado" }).click();
  await expect(page.getByText("Cita confirmada", { exact: true })).toBeVisible({ timeout: 25000 });
  await page.getByRole("link", { name: "Ver cita" }).click();
  await expect(page.getByRole("heading", { name: "Detalle de la cita" })).toBeVisible();
  const appointmentUrl = page.url();
  await expect(page.getByText(plate, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar cita", exact: true }).click();
  await page.getByLabel("Motivo de cancelación").fill("Cambio de planes");
  await page.getByRole("button", { name: "Confirmar cancelación" }).click();
  await expect(page.getByText("Cancelada", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Reservar otro horario" }).click();
  await expect(page.getByRole("combobox", { name: "Vehículo" }).locator("option:checked")).toHaveText(plate);

  if (fullStack && info.project.name === "desktop-chromium") {
    const other = await browser.newContext({ ignoreHTTPSErrors: true });
    try {
      const visitor = await other.newPage();
      await visitor.goto(new URL("/registro", appointmentUrl).href);
      const email = "cita-ajena-" + randomUUID() + "@example.test";
      await visitor.getByLabel("Nombre").fill("Otro Ciudadano");
      await visitor.getByLabel("Correo electrónico").fill(email);
      await visitor.getByLabel("Contraseña", { exact: true }).fill("Fixture123");
      await visitor.getByRole("button", { name: "Registrarme" }).click();
      await expect(visitor.getByText("Cuenta activa. Ya puedes iniciar sesión.")).toBeVisible();
      await visitor.goto(new URL("/login", appointmentUrl).href);
      await visitor.getByLabel("Correo electrónico").fill(email);
      await visitor.getByLabel("Contraseña", { exact: true }).fill("Fixture123");
      await visitor.getByRole("button", { name: "Iniciar sesión" }).click();
      await expect(visitor.getByRole("heading", { name: "Área ciudadana" })).toBeVisible();
      await visitor.goto(appointmentUrl);
      await expect(visitor.getByRole("heading", { name: "This page could not be found." })).toBeVisible();
      await expect(visitor.getByText(plate, { exact: true })).toHaveCount(0);
    } finally { await other.close(); }
  }
});

for (const [scenario, message] of [
  ["RECHAZADO", "Pago rechazado. Elige otro horario."],
  ["ERROR", "El pago simulado falló. Elige otro horario."],
  ["VENCIDO", "La retención venció. Elige otro horario."],
  ["REVERTIDO", "El pago simulado fue revertido. Elige otro horario."],
  ["PENDIENTE", "La retención fue liberada."],
] as const) {
  test("PA-04 muestra el estado " + scenario, async ({ page, request }) => {
    test.skip(fullStack, "Escenario controlado con el doble HTTP.");
    await request.post(endpoint("/__fixture/citizen"), { data: { scenario: scenario === "REVERTIDO" ? "VENCIDO" : scenario } });
    await login(page);
    await page.getByRole("link", { name: "Agendar cita" }).click();
    await page.getByRole("link", { name: "Registrar vehículo para agendar" }).click();
    const plate = await createVehicle(page);
    await expect(page.getByLabel("Vehículo")).toHaveValue(/.+/);
    await expect(page.getByLabel("Vehículo").locator("option:checked")).toHaveText(plate);
    await selectSlot(page);
    await page.getByRole("button", { name: "Iniciar pago simulado" }).click();
    if (scenario === "REVERTIDO") {
      await expect(page.getByText("La retención venció. Elige otro horario.")).toBeVisible();
      const id = new URL(page.url()).pathname.split("/").at(-1);
      await request.post(endpoint("/__fixture/citizen-outcome"), { data: { id, estado: "REVERTIDO" } });
      await page.getByRole("button", { name: "Consultar estado" }).click();
      await expect(page.getByRole("link", { name: "Ver cita" })).toHaveCount(0);
    }
    if (scenario === "PENDIENTE") {
      await expect(page.getByRole("timer")).toBeVisible();
      await page.reload();
      await page.getByRole("button", { name: "Abandonar retención" }).click();
    }
    await expect(page.getByText(message, { exact: true })).toBeVisible();
  });
}

test("PA-03 recupera un envío incierto con el mismo cuerpo y clave, incluso tras recargar", async ({ page }) => {
  test.skip(fullStack, "Se simula una respuesta perdida en el navegador.");
  await login(page);
  await page.getByRole("link", { name: "Agendar cita" }).click();
  await page.getByRole("link", { name: "Registrar vehículo para agendar" }).click();
  await createVehicle(page);
  await selectSlot(page);
  const starts: string[] = [];
  await page.route("**/api/ciudadano", async (route) => {
    const payload = route.request().postDataJSON();
    if (payload.action !== "start") return route.continue();
    starts.push(route.request().postData() ?? "");
    if (starts.length === 1) {
      await route.fetch();
      await route.abort();
    } else await route.continue();
  });
  await page.getByRole("button", { name: "Iniciar pago simulado" }).dblclick();
  await expect(page.getByText("No se pudo confirmar el inicio. Reintenta el mismo envío.")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Reintentar el mismo envío" }).click();
  await expect(page.getByText("Cita confirmada", { exact: true })).toBeVisible();
  expect(starts).toHaveLength(2);
  expect(starts[0]).toBe(starts[1]);
});

test("PA-03 muestra un horario ocupado y permite volver a elegir", async ({ page, request }) => {
  test.skip(fullStack, "Conflicto inyectado por el doble HTTP.");
  await request.post(endpoint("/__fixture/citizen"), { data: { scenario: "OCUPADO" } });
  await login(page);
  await page.getByRole("link", { name: "Agendar cita" }).click();
  await page.getByRole("link", { name: "Registrar vehículo para agendar" }).click();
  await createVehicle(page);
  await selectSlot(page);
  await page.getByRole("button", { name: "Iniciar pago simulado" }).click();
  await expect(page.getByText("Ese horario ya no está libre. Selecciona otro.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Revisar reserva" })).toBeDisabled();
});


test("edita el perfil y actualiza y archiva un vehículo propio", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop-chromium", "El CRUD se verifica una vez por entorno.");
  await login(page);
  await page.getByRole("link", { name: "Mi perfil" }).click();
  await page.getByLabel("Celular").fill("8095550101");
  await page.getByRole("button", { name: "Guardar perfil" }).click();
  await expect(page.getByText("Perfil actualizado.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Celular")).toHaveValue("8095550101");
  await page.goto("/ciudadano/vehiculos/nuevo");
  const plate = await createVehicle(page);
  await page.getByRole("link", { name: "Editar " + plate }).click();
  await page.getByRole("textbox", { name: "Año", exact: true }).fill("2024");
  await page.getByRole("button", { name: "Guardar vehículo" }).click();
  const row = page.getByRole("row").filter({ hasText: plate });
  await expect(row.getByText("2024", { exact: true })).toBeVisible();
  await row.getByRole("link").click();
  await page.getByRole("button", { name: "Archivar vehículo" }).click();
  await page.getByRole("button", { name: "Confirmar archivo" }).click();
  await expect(page.getByRole("heading", { name: "Mis vehículos" })).toBeVisible();
  await expect(row).toHaveCount(0);
});
