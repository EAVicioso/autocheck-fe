import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { actors } from "./fixtures/srs";
import { authorize, endpoint, loginPage } from "./fixtures/fullstack";

type NextTestWindow = Window & { next?: { router?: { push(path: string): void } } };

test("PA-11 rechaza al ciudadano en entradas directas y navegaciones App Router", async ({ page }) => {
  await loginPage(page, "citizen");
  await expect(page).toHaveURL("/ciudadano");
  for (const [path, title] of [["/inspector", "Área de inspección"], ["/admin", "Área administrativa"]]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "This page could not be found." })).toBeVisible();
    await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
    await page.goto("/ciudadano");
    await expect(page.getByRole("heading", { name: "Área ciudadana" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Consulta" })).toBeVisible();
    await page.waitForFunction(() => typeof (window as NextTestWindow).next?.router?.push === "function");
    const response = page.waitForResponse((res) => new URL(res.url()).pathname === path && res.request().headers().rsc === "1");
    await page.evaluate((href) => {
      (window as NextTestWindow).next?.router?.push(href);
    }, path);
    await response;
    await expect(page.getByRole("heading", { name: "This page could not be found." })).toBeVisible();
    await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
    await expect(page).toHaveURL(path);
  }
});

test("PA-01 registra la cuenta por la UI y obtiene el perfil ciudadano", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop-chromium", "El alta se verifica una vez contra los mismos datos.");
  const correo = "alta-" + randomUUID() + "@example.test";
  const contrasena = "ñññññññ١";
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Ciudadano E2E");
  await page.getByLabel("Correo electrónico").fill(correo);
  await page.getByLabel("Contraseña", { exact: true }).fill(contrasena);
  await page.getByRole("button", { name: "Registrarme" }).click();
  await expect(page.getByText("Cuenta activa. Ya puedes iniciar sesión.")).toBeVisible();
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(correo);
  await page.getByLabel("Contraseña", { exact: true }).fill(contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("heading", { name: "Área ciudadana" })).toBeVisible();
});

test("RS-09 conserva los campos cerrados antes de hidratar el formulario", async ({ browser, baseURL }, info) => {
  test.skip(info.project.name !== "desktop-chromium", "La forma SSR se verifica una vez.");
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL + "/registro");
    await expect(page.getByLabel("Contraseña", { exact: true })).toBeDisabled();
    await expect(page.locator("form")).toHaveAttribute("method", "post");
    await expect(page.getByRole("button", { name: "Registrarme" })).toBeDisabled();
  } finally {
    await context.close();
  }
});

test("PA-02 el quinto fallo inicia el bloqueo y la siguiente solicitud recibe 429", async ({ request }, info) => {
  test.skip(info.project.name !== "desktop-chromium", "El bloqueo se verifica una vez contra la API.");
  const correo = "bloqueo-" + randomUUID() + "@example.test";
  const good = { correo, contrasena: actors.citizen.contrasena };
  const signup = await request.post(endpoint("/api/auth/registro"), { data: { ...good, nombre: "Prueba de bloqueo" } });
  expect(signup.status()).toBe(201);
  for (let attempt = 1; attempt <= 5; attempt++) {
    const result = await request.post(endpoint("/api/auth/login"), { data: { ...good, contrasena: "IntentoFallido1" } });
    expect(result.status(), "Intento " + attempt).toBe(401);
  }
  const locked = await request.post(endpoint("/api/auth/login"), { data: good });
  expect(locked.status()).toBe(429);
  expect(await locked.json()).toMatchObject({ codigo: "CUENTA_BLOQUEADA" });
});

test("PA-02 / PA-11 protege inspector y admin y autentica con la API real", async ({ page, request }, info) => {
  await page.goto("/inspector");
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  await loginPage(page, "inspector");
  await expect(page.getByRole("heading", { name: "Área de inspección" })).toBeVisible();
  const close = page.getByRole("button", { name: "Cerrar sesión" });
  const box = await close.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);
  if (info.project.name === "inspector-tablet-touch") await close.tap();
  else await close.click();
  await expect(page).toHaveURL(/\/login$/);

  if (info.project.name === "desktop-chromium") {
    const citizen = await authorize(request, "citizen");
    const admin = await authorize(request, "admin");
    expect((await request.get(endpoint("/api/usuarios"), { headers: citizen })).status()).toBe(403);
    expect((await request.get(endpoint("/api/usuarios"), { headers: admin })).status()).toBe(200);
  }
});
