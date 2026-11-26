import { expect, type APIRequestContext, type APIResponse, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import type { Inspeccion, Pago, Session, Vehiculo } from "../../src/shared/api/contract.generated";
import { actors, ids } from "./srs";

const upstream = "http://127.0.0.1:3401";
type Actor = keyof typeof actors;

export function endpoint(path: string) { return upstream + path; }

export async function loginPage(page: Page, actor: Actor) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(actors[actor].correo);
  await page.getByLabel("Contraseña", { exact: true }).fill(actors[actor].contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

async function checked<T>(response: APIResponse, expected: number): Promise<T> {
  expect(response.status(), response.url()).toBe(expected);
  return response.json();
}

export async function authorize(request: APIRequestContext, actor: Actor) {
  const session = await checked<Session>(await request.post(endpoint("/api/auth/login"), { data: actors[actor] }), 200);
  return { Authorization: "Bearer " + session.accessToken };
}

export function idem(headers: Record<string, string>, key = randomUUID()) {
  return { ...headers, "Idempotency-Key": key };
}

export async function createVehicle(request: APIRequestContext, headers: Record<string, string>) {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase().replaceAll("I", "1");
  return checked<Vehiculo>(await request.post(endpoint("/api/vehiculos"), {
    headers, data: { matricula: "E2E-" + suffix, vin: "E2EAC" + suffix, anio: 2020, modeloId: ids.model, colorId: ids.color },
  }), 201);
}

export function futureSlot(offset: number) {
  const halfHour = 30 * 60_000;
  return new Date((Math.ceil(Date.now() / halfHour) + 48 + offset) * halfHour).toISOString();
}

export async function startPayment(request: APIRequestContext, headers: Record<string, string>, vehicle: Vehiculo, starts: string) {
  const data = { vehiculoId: vehicle.id, centroId: ids.center, rampaId: ids.ramp, inicioUtc: starts, demoraSegundos: 4 };
  return checked<{ intentoId: string; retencionId: string; expiraUtc: string }>(
    await request.post(endpoint("/api/pagos/intentos"), { headers, data }), 201,
  );
}

export async function awaitPayment(request: APIRequestContext, headers: Record<string, string>, intentoId: string) {
  const path = endpoint("/api/pagos/intentos/" + intentoId);
  await expect.poll(async () => (await checked<Pago>(await request.get(path, { headers }), 200)).estado,
    { timeout: 25_000 }).toBe("APROBADO");
  return checked<Pago>(await request.get(path, { headers }), 200);
}

export async function prepareInspection(request: APIRequestContext, offset: number) {
  const citizen = await authorize(request, "citizen");
  const admin = await authorize(request, "admin");
  const inspector = await authorize(request, "inspector");
  const vehicle = await createVehicle(request, citizen);
  const attempt = await startPayment(request, idem(citizen), vehicle, futureSlot(offset));
  const payment = await awaitPayment(request, citizen, attempt.intentoId);
  expect(payment.citaId).toBeTruthy();
  const assignment = await request.put(endpoint("/api/citas/" + payment.citaId + "/inspector"), {
    headers: admin, data: { inspectorId: ids.inspector },
  });
  expect(assignment.status()).toBe(200);
  const inspection = await checked<Inspeccion>(await request.post(endpoint("/api/inspecciones"), {
    headers: idem(inspector), data: { citaId: payment.citaId },
  }), 201);
  return { inspection, vehicle, payment, citizen, inspector };
}
