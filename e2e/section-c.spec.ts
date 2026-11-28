import { expect, test, type Page } from "@playwright/test";
import { once } from "node:events";
import { createServer, type Server, type ServerResponse } from "node:http";
import { frontendProxy } from "./fixtures/frontend-proxy.mjs";
import { dominicanDay } from "../src/shared/dates/dominican";

const backend = "http://127.0.0.1:3401";
const origin = "http://127.0.0.1:3400";
const id = (value: number) => "00000000-0000-4000-8000-" + String(value).padStart(12, "0");
const fallback = { respuesta: "El servicio de asistencia no está disponible temporalmente. Intenta de nuevo.",
  categoria: "NO_DETERMINADA", codigo: "SERVICIO_NO_DISPONIBLE" };

async function login(page: Page, account = "owner-c") {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").filter({ visible: true }).fill(account + "@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).filter({ visible: true }).fill("Fixture123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("heading", { name: account === "ciudadano" ? "Área ciudadana" : "Área administrativa" })).toBeVisible();
}

test("PA-02 el reloj del servidor desbloquea a las 15:00 y un restablecimiento conserva el bloqueo", async ({ page, request }) => {
  const correo = "lock-c@example.invalid";
  await request.post(backend + "/__fixture/lock-clock", { data: { advanceMs: 0, reset: true } });
  const tryLogin = (contrasena: string) => request.post(backend + "/api/auth/login", { data: { correo, contrasena } });
  for (let attempt = 0; attempt < 4; attempt++) expect((await tryLogin("ClaveErrada1")).status()).toBe(401);
  expect((await tryLogin("Fixture123")).status()).toBe(200);
  for (let attempt = 0; attempt < 5; attempt++) expect((await tryLogin("ClaveErrada1")).status()).toBe(401);
  expect((await request.post(backend + "/api/auth/restablecimiento", {
    data: { token: "lock-fixture", nuevaContrasena: "Fixture456" },
  })).status()).toBe(204);
  await request.post(backend + "/__fixture/lock-clock", { data: { advanceMs: 899_000 } });
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").filter({ visible: true }).fill(correo);
  await page.getByLabel("Contraseña", { exact: true }).filter({ visible: true }).fill("Fixture456");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Cuenta bloqueada. Vuelve a intentar en 1 s.");
  await request.post(backend + "/__fixture/lock-clock", { data: { advanceMs: 1000 } });
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("heading", { name: "Área ciudadana" })).toBeVisible();
});

test("PA-08 a–d filtra días dominicanos y ventanas de 21 con desempate y denominador fijo", async ({ page }) => {
  await login(page);
  const report = "/admin/reportes?desde=2026-11-25&hasta=2026-11-26&centroId=" + id(1);
  await page.goto(report + "&inspectorId=" + id(21));
  const daily = page.getByRole("table", { name: "Detalle diario" });
  await expect(daily.getByRole("row")).toHaveCount(4);
  await expect(daily.getByRole("row").filter({ hasText: "2026-11-26" })).toContainText("50%");
  await expect(daily.getByRole("row").filter({ hasText: id(11) })).toContainText("100%");
  await expect(page.getByText(/Última actualización:/).first()).toContainText("Santo Domingo");
  const table = page.getByRole("table", { name: "Alertas preventivas" });
  await expect(table.getByText("20 de 21")).toHaveCount(2);
  await expect(table.getByText("95.24%", { exact: true })).toHaveCount(2);

  await page.getByRole("textbox", { name: "ID de la rampa" }).fill(id(11));
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(table.getByText("20 de 21")).toHaveCount(1);
  await expect(table.getByText("2026-11-26")).toBeVisible();
  await expect(daily.getByRole("row")).toHaveCount(2);

  await page.goto(report + "&inspectorId=" + id(22));
  await expect(daily).toBeVisible();
  await expect(table).toHaveCount(0);
  await page.goto(report + "&inspectorId=" + id(23));
  await expect(table.getByText("21 de 21")).toBeVisible();
  await expect(table.getByText("100%", { exact: true })).toBeVisible();
  await page.goto("/admin/reportes?desde=2000-01-01&hasta=2000-01-01");
  await expect(page.getByText("Sin datos", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("NaN", { exact: true })).toHaveCount(0);
});

test("PA-08 aplica el centro del administrador local al formulario y a ambos reportes", async ({ page }) => {
  await login(page, "local-c");
  await page.goto("/admin/reportes?desde=2026-11-25&hasta=2026-11-26&centroId=" + id(2));
  const center = page.getByRole("textbox", { name: "ID del centro" });
  await expect(center).toHaveValue(id(1));
  await expect(center).toHaveAttribute("readonly", "");
  await expect(page.getByRole("table", { name: "Detalle diario" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Alertas preventivas" })).toBeVisible();
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL((url) => url.searchParams.get("centroId") === id(1));
});

test("PA-09 a–d valida en ambas fronteras y ofrece reintento explícito después de timeout, red o JSON inválido", async ({ page }) => {
  await login(page, "ciudadano");
  const region = page.getByRole("complementary", { name: "Asistencia" });
  const input = region.getByRole("textbox", { name: "Consulta" });
  await input.fill(" ".repeat(3));
  await region.getByRole("button", { name: "Enviar consulta" }).click();
  await expect(region.getByText("Escribe una consulta.")).toBeVisible();
  await input.fill("x".repeat(2001));
  await region.getByRole("button", { name: "Enviar consulta" }).click();
  await expect(region.getByText("Usa hasta 2000 caracteres.")).toBeVisible();
  for (const consulta of ["  ", "x".repeat(2001)]) {
    const result = await page.request.post("/api/asistencia", { headers: { Origin: origin }, data: { consulta } });
    expect(result.status()).toBe(400);
    expect(await result.json()).toEqual({ respuesta: expect.stringMatching(/\S/), categoria: "NO_DETERMINADA", codigo: "SOLICITUD_INVALIDA" });
  }
  const stalled = await page.request.post("/api/asistencia", { headers: { Origin: origin }, data: { consulta: "Timeout" } });
  expect(stalled.status()).toBe(503);
  expect(await stalled.json()).toEqual(fallback);
  let sent = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/api/asistencia")) sent++;
  });
  for (const [index, consulta] of ["Timeout", "Error de conexión", "Respuesta inválida"].entries()) {
    await input.fill(consulta);
    const response = page.waitForResponse((result) => result.url().endsWith("/api/asistencia"));
    await region.getByRole("button", { name: index ? "Reintentar consulta" : "Enviar consulta" }).click();
    const result = await response;
    expect(result.status()).toBe(503);
    expect(await result.json()).toEqual(fallback);
    const elapsed = result.request().timing().responseEnd;
    expect(elapsed).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(3000);
    await expect(region.getByRole("alert")).toHaveText(fallback.respuesta);
    expect(sent).toBe(index + 1);
  }
  await input.fill("  ¿Qué es la ITV?  ");
  const response = page.waitForResponse((result) => result.url().endsWith("/api/asistencia"));
  await region.getByRole("button", { name: "Reintentar consulta" }).click();
  expect((await response).status()).toBe(200);
  await expect(region.getByText("Respuesta de prueba.")).toBeVisible();
});

test("PA-11 a–b asigna, revoca y registra el cambio de acceso", async ({ page, request }) => {
  const session = await request.post(backend + "/api/auth/login", { data: { correo: "owner-c@example.invalid", contrasena: "Fixture123" } });
  expect(session.status()).toBe(200);
  const { accessToken } = await session.json();
  const readAccess = () => request.get(backend + "/api/usuarios/" + id(21) + "/acceso", {
    headers: { Authorization: "Bearer " + accessToken },
  });
  await login(page);
  await page.getByRole("link", { name: "Usuarios y roles" }).click();
  await page.getByRole("link", { name: "Manuela Prueba" }).click();
  const role = page.getByRole("radio", { name: "Administrador", exact: true });
  await expect(role).toBeEnabled();
  await role.check();
  await page.getByLabel("Consultar auditoría").check();
  await expect(role).toBeChecked();
  await page.getByRole("button", { name: "Guardar acceso" }).click();
  await expect(page.getByText("Acceso actualizado.")).toBeVisible();
  expect(await (await readAccess()).json()).toMatchObject({ rol: "Administrador", permisos: ["auditoria.consultar"] });
  await page.reload();
  await expect(page.getByLabel("Consultar auditoría")).toBeChecked();
  await page.getByRole("radio", { name: "Ciudadano", exact: true }).check();
  await page.getByRole("button", { name: "Guardar acceso" }).click();
  await expect(page.getByText("Acceso actualizado.")).toBeVisible();
  expect(await (await readAccess()).json()).toMatchObject({ rol: "Ciudadano", permisos: [] });
  await page.reload();
  await expect(page.getByLabel("Consultar auditoría")).not.toBeChecked();
  await page.goto("/admin/auditoria?operacion=CambiarAcceso");
  await expect(page.getByRole("cell", { name: "CambiarAcceso" })).toHaveCount(2);
});

test("PA-12 a–c cambia capacidad y rechaza interrupciones de citas y retenciones", async ({ page }) => {
  await login(page);
  await page.goto("/admin/centros/" + id(1));
  await expect(page.getByText(/Capacidad simultánea/)).toContainText("1");
  const ramp = page.getByRole("region", { name: "Rampa con retención" });
  await ramp.getByLabel("Rampa activa").uncheck();
  await ramp.getByRole("button", { name: "Guardar rampa" }).click();
  await expect(ramp.getByRole("alert")).toHaveText("Resuelve las citas y retenciones antes de desactivar la rampa.");
  await page.getByRole("textbox", { name: "Cierre Lunes" }).fill("12:00");
  await page.getByRole("button", { name: "Guardar horarios" }).click();
  await expect(page.getByText("Resuelve las citas y retenciones antes de cambiar el horario.")).toBeVisible();
  await page.getByRole("checkbox", { name: "Centro activo" }).uncheck();
  await page.getByRole("button", { name: "Guardar centro" }).click();
  await expect(page.getByText("Resuelve las citas y retenciones antes de desactivar el centro.")).toBeVisible();
  await page.getByRole("textbox", { name: "Nombre de la rampa" }).last().fill("Rampa adicional");
  await page.getByRole("button", { name: "Agregar rampa" }).click();
  await expect(page.getByText(/Capacidad simultánea/)).toContainText("2");
  await page.goto("/admin/centros/nuevo");
  await page.getByRole("textbox", { name: "Nombre del centro" }).fill("Nuevo centro E2E");
  await page.getByRole("textbox", { name: "Dirección" }).fill("Santiago");
  await page.getByRole("button", { name: "Registrar centro" }).click();
  await expect(page.getByRole("heading", { name: "Nuevo centro E2E" })).toBeVisible();
});

test("PA-12 muestra el guardado y permite reintentar si no se pudo validar el acceso", async ({ page, request }) => {
  await login(page);
  const detail = "/admin/centros/" + id(1);
  await page.goto(detail);
  const save = page.getByRole("button", { name: "Guardar centro" });
  const active = page.getByRole("checkbox", { name: "Centro activo" });
  await active.uncheck();
  await save.click();
  const previousError = page.getByText("Resuelve las citas y retenciones antes de desactivar el centro.");
  await expect(previousError).toBeVisible();

  const access = (await page.context().cookies()).find((cookie) => cookie.name === "__Host-autocheck-access");
  const setProfileUnavailable = async (profileUnavailable: boolean) => {
    const result = await request.post(backend + "/__fixture/session", {
      headers: { Authorization: "Bearer " + access?.value }, data: { profileUnavailable },
    });
    expect(result.ok()).toBe(true);
  };
  const gate = Promise.withResolvers<void>();
  await page.route(origin + detail, async (route) => {
    if (route.request().method() === "POST") await gate.promise;
    await route.continue();
  });
  await setProfileUnavailable(true);
  try {
    await active.check();
    await save.click();
    await expect(page.getByRole("button", { name: "Guardando…" })).toBeDisabled();
    await expect(previousError).toHaveCount(0);
    gate.resolve();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("No se pudo validar el acceso. Vuelve a intentar.");
  } finally {
    gate.resolve();
    await setProfileUnavailable(false);
  }
  await save.click();
  await expect(page.getByText("Centro actualizado.")).toBeVisible();
});

test("PA-05b / RAE-02 crea una versión futura y conserva M anterior", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "Reglas de inspección" }).click();
  await expect(page.getByRole("cell", { name: "3", exact: true })).toBeVisible();
  await page.getByRole("spinbutton", { name: "Nuevo M" }).fill("4");
  await page.getByLabel("Vigencia (Santo Domingo)").filter({ visible: true })
    .fill(dominicanDay(new Date(Date.now() + 2 * 86_400_000)) + "T12:00");
  await page.getByRole("button", { name: "Registrar versión" }).click();
  await expect(page.getByText("Nueva versión de M registrada.")).toBeVisible();
  await expect(page.getByRole("cell", { name: "4", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "3", exact: true })).toBeVisible();
});

async function listen(server: Server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("El servidor de prueba no tiene un puerto TCP.");
  return address.port;
}

test("el proxy E2E transmite respuestas completas y cierra las truncadas", async () => {
  let truncated: ServerResponse | undefined;
  const upstream = createServer((request, response) => {
    if (request.url !== "/truncated") {
      response.end("respuesta completa");
      return;
    }
    truncated = response;
    response.writeHead(200, { "Content-Length": 100 });
    response.write("respuesta parcial");
  });
  const proxy = createServer(frontendProxy("127.0.0.1", await listen(upstream)));
  try {
    const url = "http://127.0.0.1:" + await listen(proxy);
    expect(await (await fetch(url)).text()).toBe("respuesta completa");
    const signal = AbortSignal.timeout(2000);
    const partial = await fetch(url + "/truncated", { signal });
    expect(partial.status).toBe(200);
    truncated?.destroy();
    await expect(partial.text()).rejects.toThrow();
    expect(signal.aborted).toBe(false);
  } finally {
    for (const server of [proxy, upstream]) {
      server.close();
      server.closeAllConnections();
    }
  }
});

test("PA-13 a–b restringe el registro a auditoría global y entrega únicamente columnas de lectura", async ({ page }) => {
  await login(page, "local-c");
  await expect(page.getByRole("link", { name: "Auditoría" })).toHaveCount(0);
  await page.goto("/admin/auditoria");
  await expect(page.getByRole("heading", { name: "This page could not be found." })).toBeVisible();
  await page.goto("/admin/centros/nuevo");
  await expect(page.getByRole("heading", { name: "This page could not be found." })).toBeVisible();
  await page.goto("/admin");
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("/login");
  await login(page, "limited-c");
  await expect(page.getByRole("link", { name: "Usuarios y roles" })).toHaveCount(0);
  await page.goto("/admin/usuarios");
  await expect(page.getByRole("heading", { name: "This page could not be found." })).toBeVisible();
  await page.goto("/admin");
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("/login");
  await login(page);
  const document = await page.goto("/admin/auditoria?desde=2026-11-26&hasta=2026-11-26");
  const table = page.getByRole("table", { name: "Registro de auditoría" });
  await expect(table.getByRole("columnheader")).toHaveCount(6);
  await expect(table.getByRole("cell", { name: "Proceso del sistema" })).toBeVisible();
  await expect(table.getByRole("cell", { name: "corr-fixture-01" })).toBeVisible();
  expect(await document?.text()).not.toContain("fixture-only-snapshot");
  await expect(table.getByRole("button")).toHaveCount(0);
  const audit = page.getByRole("region", { name: "Registro de auditoría" });
  await audit.getByRole("textbox", { name: "Operación", exact: true }).fill("No existe");
  await audit.getByRole("button", { name: "Filtrar auditoría" }).click();
  await expect(audit.getByText("Sin datos", { exact: true })).toBeVisible();
});
