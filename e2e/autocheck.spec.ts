import { expect, test, type Page } from "@playwright/test";

const app = "http://127.0.0.1:3400";
const api = "http://127.0.0.1:3401";
const certificateId = "00000000-0000-4000-8000-000000000002";
const missingCertificateId = "00000000-0000-4000-8000-000000000003";

async function login(page: Page, account: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(account + "@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill("Fixture123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

async function accessCookie(page: Page) {
  const cookies = await page.context().cookies();
  const cookie = cookies.find(({ name }) => name === "autocheck-access");
  expect(cookie).toMatchObject({ httpOnly: true, sameSite: "Lax" });
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
  await page.getByLabel("Nombre").fill("Fixture");
  await page.getByLabel("Correo electrónico").fill("nuevo@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill("Fixture123");
  await page.getByRole("button", { name: "Registrarme" }).click();
  await expect(page.getByText("Confirma tu correo para iniciar sesión.")).toBeVisible();

  await page.goto("/recuperacion");
  await page.getByLabel("Correo electrónico").fill("nuevo@example.invalid");
  await page.getByRole("button", { name: "Solicitar recuperación" }).click();
  await expect(page.getByText("Si la cuenta existe, recibirás instrucciones de recuperación.")).toBeVisible();

  await page.goto("/restablecimiento?token=fixture");
  await page.getByLabel("Nueva contraseña").fill("Fixture123");
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
  await setSessionClock(page, stale, { inactiveMs: 60 * 60 * 1000 - 1, expireJwt: true });
  const callProfile = () => page.request.post("/api/session/perfil", { headers: { Origin: app } });
  const responses = await Promise.all([callProfile(), callProfile()]);
  expect(responses.map((response) => response.status())).toEqual([200, 200]);
  const access = await accessCookie(page);
  expect(access).not.toBe(stale);
  expect(await setSessionClock(page, access, {})).toMatchObject({ refreshes: 1, activity: 0 });
  await expect(page.getByRole("button", { name: "Enviar consulta" })).toBeVisible();

  await setSessionClock(page, access, { inactiveMs: 60 * 60 * 1000 });
  await page.clock.fastForward(60_001);
  await expect(page).toHaveURL("/login");
  await expect(page.getByRole("button", { name: "Enviar consulta" })).toHaveCount(0);
  expect((await page.context().cookies()).some(({ name }) => name === "autocheck-refresh")).toBe(false);
  expect(await setSessionClock(page, access, {})).toMatchObject({ refreshes: 1, activity: 0 });
});

test("el BFF rechaza CSRF y logout revoca y elimina cookies", async ({ page }) => {
  await login(page, "ciudadano");
  await expect(page).toHaveURL("/ciudadano");
  const access = await accessCookie(page);
  const rejected = await page.request.post("/api/session/logout", { headers: { Origin: "http://otro.example.invalid" } });
  expect(rejected.status()).toBe(403);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("/login");
  expect((await page.context().cookies()).some(({ name }) => name.startsWith("autocheck-"))).toBe(false);
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
  await expect(verification.locator("dd")).toHaveText([certificateId, "2026-11-24T04:00:00Z", "Centro de prueba", "Aprobado"]);
  await expect(page.getByText("Dato interno de fixture")).toHaveCount(0);
  await page.goto("/verificar/" + missingCertificateId + "?hash=" + hash);
  await expect(verification.getByText("Certificado no encontrado.")).toBeVisible();
  await page.goto("/verificar/" + certificateId + "?hash=invalido");
  await expect(verification.getByText("Integridad del certificado no válida.")).toBeVisible();
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
