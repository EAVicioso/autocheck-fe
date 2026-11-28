import { expect, test, type Page } from "@playwright/test";
import { limits } from "./fixtures/srs";

const app = "http://127.0.0.1:" + (process.env.AUTOCHECK_E2E_FRONTEND_PORT ?? "3400");
const api = "http://127.0.0.1:" + (process.env.AUTOCHECK_E2E_BACKEND_PORT ?? "3401");
const certificateId = "00000000-0000-4000-8000-000000000002";
const missingCertificateId = "00000000-0000-4000-8000-000000000003";

async function login(page: Page, account: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").filter({ visible: true }).fill(account + "@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).filter({ visible: true }).fill("Fixture123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

async function accessCookie(page: Page) {
  const cookies = await page.context().cookies();
  const cookie = cookies.find(({ name }) => name === "__Host-autocheck-access");
  expect(cookie).toMatchObject({ httpOnly: true, secure: true, sameSite: "Lax" });
  return cookie!.value;
}

async function setSessionClock(page: Page, accessToken: string, data: { inactiveMs?: number; expireJwt?: boolean }) {
  const status = await page.request.post(api + "/__fixture/session", {
    headers: { Authorization: "Bearer " + accessToken }, data,
  });
  expect(status.ok()).toBe(true);
  return status.json();
}

test("landing, alta, recuperación y restablecimiento ejecutan el esqueleto", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "AutoCheck" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar consulta" })).toHaveCount(0);
  await page.getByRole("link", { name: "Registrarme" }).click();
  await page.getByLabel("Nombre").filter({ visible: true }).fill("Fixture");
  await page.getByLabel("Correo electrónico").filter({ visible: true }).fill("nuevo@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).filter({ visible: true }).fill("ñññññññ١");
  await page.getByRole("button", { name: "Registrarme" }).click();
  await expect(page.getByText("Confirma tu correo para iniciar sesión.")).toBeVisible();

  await page.goto("/recuperacion");
  await page.getByLabel("Correo electrónico").filter({ visible: true }).fill("nuevo@example.invalid");
  await page.getByRole("button", { name: "Solicitar recuperación" }).click();
  await expect(page.getByText("Si la cuenta existe, recibirás instrucciones de recuperación.")).toBeVisible();

  await page.goto("/restablecimiento?token=fixture");
  await page.getByLabel("Nueva contraseña").filter({ visible: true }).fill("ñññññññ١");
  await page.getByRole("button", { name: "Restablecer contraseña" }).click();
  await expect(page.getByText("Contraseña restablecida. Inicia sesión de nuevo.")).toBeVisible();
  await expect(page).toHaveURL("/restablecimiento");
});

test("cada entrada protegida exige sesión ante acceso directo", async ({ page }) => {
  for (const path of ["/ciudadano", "/inspector", "/admin"]) {
    await page.goto(path);
    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  }
});

for (const { account, path, heading, rol, permisos, centroId } of [
  { account: "ciudadano", path: "/ciudadano", heading: "Área ciudadana", rol: "Ciudadano", permisos: [], centroId: null },
  { account: "inspector", path: "/inspector", heading: "Área de inspección", rol: "Inspector", permisos: [], centroId: "00000000-0000-4000-8000-000000000001" },
  { account: "admin", path: "/admin", heading: "Área administrativa", rol: "Administrador", permisos: ["auditoria.consultar"], centroId: null },
]) {
  test("el perfil " + rol + " accede a su área y se rechaza otra", async ({ page }) => {
    await login(page, account);
    await expect(page).toHaveURL(path);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await accessCookie(page);
    const profile = await page.request.post("/api/session/perfil", { headers: { Origin: app } });
    const dto = await profile.json();
    expect(dto).toMatchObject({ rol, permisos, centroId });
    expect(Object.keys(dto).sort()).toEqual(["centroId", "id", "permisos", "rol"]);
    const other = path === "/admin" ? "/inspector" : "/admin";
    await page.goto(other);
    await expect(page.getByText("This page could not be found.")).toBeVisible();
    await expect(page.getByRole("heading", { name: other === "/admin" ? "Área administrativa" : "Área de inspección" })).toHaveCount(0);
  });
}

test("deduplica dos refresh simultáneos y el polling no registra actividad", async ({ page }) => {
  await page.clock.install();
  await login(page, "ciudadano");
  await expect(page.getByRole("heading", { name: "Área ciudadana" })).toBeVisible();
  const stale = await accessCookie(page);
  await setSessionClock(page, stale, { inactiveMs: limits.inactivitySeconds[0] * 1000, expireJwt: true });
  const callProfile = () => page.request.post("/api/session/perfil", { headers: { Origin: app } });
  const responses = await Promise.all([callProfile(), callProfile()]);
  expect(responses.map((response) => response.status())).toEqual([200, 200]);
  const access = await accessCookie(page);
  expect(access).not.toBe(stale);
  expect(await setSessionClock(page, access, {})).toMatchObject({ refreshes: 1, activity: 0 });
  await expect(page.getByRole("button", { name: "Enviar consulta" })).toBeVisible();

  await setSessionClock(page, access, { inactiveMs: limits.inactivitySeconds[1] * 1000 });
  await page.clock.fastForward(60_001);
  await expect(page).toHaveURL("/login");
  await expect(page.getByRole("button", { name: "Enviar consulta" })).toHaveCount(0);
  expect((await page.context().cookies()).some(({ name }) => name === "__Host-autocheck-refresh")).toBe(false);
  expect(await setSessionClock(page, access, {})).toMatchObject({ refreshes: 1, activity: 0 });
});

test("un canje tardío con cookies antiguas conserva la sesión renovada", async ({ page }) => {
  await login(page, "ciudadano");
  await expect(page.getByRole("button", { name: "Enviar consulta" })).toBeVisible();
  const access = await accessCookie(page);
  const oldCookies = (await page.context().cookies())
    .filter(({ name }) => name.startsWith("__Host-autocheck-"))
    .map(({ name, value }) => name + "=" + value).join("; ");
  await setSessionClock(page, access, { expireJwt: true });

  const current = await page.request.post("/api/session/perfil", { headers: { Origin: app } });
  expect(current.status()).toBe(200);
  const rotated = await accessCookie(page);
  expect(rotated).not.toBe(access);

  const late = await page.request.post("/api/session/perfil", { headers: { Origin: app, Cookie: oldCookies } });
  expect(late.status()).toBe(401);
  expect(late.headers()["set-cookie"]).toBeUndefined();
  expect(await accessCookie(page)).toBe(rotated);
  expect((await page.request.post("/api/session/perfil", { headers: { Origin: app } })).status()).toBe(200);
  expect(await setSessionClock(page, rotated, {})).toMatchObject({ refreshes: 1 });
});

test("la primera interacción tras vencer el JWT registra actividad de la sesión renovada", async ({ page }) => {
  await login(page, "ciudadano");
  const input = page.getByRole("textbox", { name: "Consulta" });
  await expect(input).toBeVisible();
  const stale = await accessCookie(page);
  await setSessionClock(page, stale, { inactiveMs: limits.inactivitySeconds[0] * 1000, expireJwt: true });

  const reported = page.waitForResponse((response) => response.url().endsWith("/api/session/actividad"));
  await input.press("Shift");
  expect((await reported).status()).toBe(204);
  const rotated = await accessCookie(page);
  expect(rotated).not.toBe(stale);
  expect(await setSessionClock(page, rotated, {})).toMatchObject({ refreshes: 1, activity: 1 });
});

test("el BFF rechaza CSRF y logout revoca y elimina cookies", async ({ page }) => {
  await login(page, "ciudadano");
  await expect(page).toHaveURL("/ciudadano");
  const access = await accessCookie(page);
  const rejected = await page.request.post("/api/session/logout", { headers: { Origin: "http://otro.example.invalid" } });
  expect(rejected.status()).toBe(403);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("/login");
  expect((await page.context().cookies()).some(({ name }) => name.startsWith("__Host-autocheck-"))).toBe(false);
  expect(await setSessionClock(page, access, {})).toMatchObject({ revoked: true });
});

test("una visita directa renueva el JWT sin registrar actividad", async ({ page }) => {
  await login(page, "inspector");
  await expect(page.getByRole("heading", { name: "Área de inspección" })).toBeVisible();
  const stale = await accessCookie(page);
  await setSessionClock(page, stale, { expireJwt: true });
  await page.goto("/inspector");
  await expect(page.getByRole("heading", { name: "Área de inspección" })).toBeVisible();
  const access = await accessCookie(page);
  expect(access).not.toBe(stale);
  expect(await setSessionClock(page, access, {})).toMatchObject({ refreshes: 1, activity: 0 });
});

test("conserva el hash del QR y maneja 200, 404 y 409", async ({ page }) => {
  await login(page, "ciudadano");
  await expect(page).toHaveURL("/ciudadano");
  const hash = "a".repeat(64);
  const verification = page.getByRole("main");
  await page.goto("/verificar/" + certificateId + "?hash=" + hash);
  await expect(page).toHaveURL("/verificar/" + certificateId + "?hash=" + hash);
  await expect(verification.getByText("Centro de prueba")).toBeVisible();
  await expect(verification.locator("dd")).toHaveText([certificateId, /Santo Domingo/, "Centro de prueba", "Aprobado"]);
  await expect(verification.locator("time")).toHaveAttribute("datetime", "2026-11-24T04:00:00Z");
  await expect(page.getByText("Dato interno de fixture")).toHaveCount(0);
  await page.goto("/verificar/" + missingCertificateId + "?hash=" + hash);
  await expect(verification.getByText("Certificado no encontrado")).toBeVisible();
  await page.goto("/verificar/" + certificateId + "?hash=invalido");
  await expect(verification.getByText("Integridad no válida")).toBeVisible();
  await page.goto("/verificar/" + certificateId + "?hash=" + "b".repeat(64));
  await expect(verification.getByText("No se pudo verificar el certificado.")).toBeVisible();
});

test("asistencia conserva la consulta después de renovar un JWT y exige reintento explícito", async ({ page }) => {
  await login(page, "ciudadano");
  await expect(page.getByRole("heading", { name: "Área ciudadana" })).toBeVisible();
  const widget = page.getByRole("complementary", { name: "Asistencia" });
  await widget.getByRole("textbox", { name: "Consulta" }).fill("Consulta conservada");
  const stale = await accessCookie(page);
  await setSessionClock(page, stale, { expireJwt: true });
  let attempts = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/api/asistencia")) attempts++;
  });
  await widget.locator("form").evaluate((form: HTMLFormElement) => form.requestSubmit());
  await expect(widget.getByText("Sesión verificada. Puedes reintentar la consulta.")).toBeVisible();
  await expect(page).toHaveURL("/ciudadano");
  await expect(widget.getByRole("textbox")).toHaveValue("Consulta conservada");
  expect(await accessCookie(page)).not.toBe(stale);
  expect(attempts).toBe(1);
  await widget.getByRole("button", { name: "Reintentar consulta" }).click();
  await expect(widget.getByText("Respuesta de prueba.")).toBeVisible();
  expect(attempts).toBe(2);
});

test("asistencia elimina cookies si el perfil confirma que la sesión expiró", async ({ page }) => {
  await login(page, "ciudadano");
  await expect(page.getByRole("heading", { name: "Área ciudadana" })).toBeVisible();
  const widget = page.getByRole("complementary", { name: "Asistencia" });
  await widget.getByRole("textbox", { name: "Consulta" }).fill("Consulta sin sesión");
  await setSessionClock(page, await accessCookie(page), { inactiveMs: limits.inactivitySeconds[1] * 1000 });
  const profile = page.waitForResponse((response) => response.url().endsWith("/api/session/perfil") && response.status() === 401);
  await widget.locator("form").evaluate((form: HTMLFormElement) => form.requestSubmit());
  await profile;
  await expect(page).toHaveURL("/login");
  await expect.poll(async () => (await page.context().cookies()).filter(({ name }) => name.startsWith("__Host-autocheck-")).length).toBe(0);
});

test("asistencia muestra la contingencia y cabe en el ancho móvil del esqueleto", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "inspector");
  await expect(page).toHaveURL("/inspector");
  const input = page.getByRole("textbox", { name: "Consulta" });
  await input.fill("Timeout");
  await input.press("Tab");
  const send = page.getByRole("button", { name: "Enviar consulta" });
  await expect(send).toBeFocused();
  await send.press("Enter");
  await expect(page.getByText("El servicio de asistencia no está disponible temporalmente. Intenta de nuevo.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
