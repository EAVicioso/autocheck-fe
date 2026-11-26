/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import { createApiClient, failureKind } from "./client";
import { operations } from "./contract.generated";

const baseUrl = "http://api.example.invalid";
const profileOperation = "GET /api/usuarios/me";
const transport401 = () => new Response(null, { status: 401 });
const success = () => Response.json({});

describe("contrato HTTP", () => {
  it("registra las 57 operaciones y mantiene variantes, claves y formatos", () => {
    expect(Object.keys(operations)).toHaveLength(57);
    expect(operations["POST /api/inspecciones/{id}/certificado"].success).toEqual({ 200: "json", 202: "json" });
    expect(operations["POST /api/inspecciones/{id}/certificado"].idempotent).toBe(true);
    expect(operations["POST /api/auth/logout"].success).toEqual({ 204: "empty" });
    expect(operations["GET /api/certificados/{id}/pdf"].success).toEqual({ 200: "pdf" });
  });

  it("deduplica refresh de transporte y repite cada GET una sola vez", async () => {
    const refresh = vi.fn(async () => "rotated");
    const fetcher = vi.fn<typeof fetch>(async (_url, init) =>
      new Headers(init?.headers).get("Authorization") === "Bearer rotated" ? success() : transport401());
    const client = createApiClient({ baseUrl, fetch: fetcher, token: () => "expired", refresh });

    const results = await Promise.all([client.request(profileOperation, {}), client.request(profileOperation, {})]);
    expect(results.every((result) => result.ok)).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it("termina al segundo challenge y distingue la invalidación de aplicación", async () => {
    const refresh = vi.fn(async () => "rotated");
    const clear = vi.fn();
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => transport401());
    const client = createApiClient({ baseUrl, fetch: fetcher, refresh, onInvalidSession: clear });
    await expect(client.request(profileOperation, {})).resolves.toMatchObject({ kind: "transport-401" });
    expect(fetcher).toHaveBeenCalledTimes(2);

    fetcher.mockImplementationOnce(async () => Response.json(
      { status: 401, codigo: "SESION_EXPIRADA", traceId: "fixture" },
      { status: 401, headers: { "Content-Type": "application/problem+json" } },
    ));
    await expect(client.request(profileOperation, {})).resolves.toMatchObject({ kind: "application-session" });
    expect(clear).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("no repite mutaciones sin idempotencia ni asistencia", async () => {
    const refresh = vi.fn(async () => "rotated");
    const fetcher = vi.fn<typeof fetch>(async () => transport401());
    const client = createApiClient({ baseUrl, fetch: fetcher, refresh });
    await client.request("POST /api/auth/actividad", {});
    await client.request("POST /api/asistencia", { body: { consulta: "Horario" } });
    expect(refresh).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("fija payload y clave de idempotencia para reintentar un resultado incierto", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError("Connection closed"))
      .mockImplementation(async () => Response.json({}, { status: 200 }));
    const client = createApiClient({ baseUrl, fetch: fetcher });
    const body = { motivo: "Prueba" };
    const send = client.prepare("POST /api/citas/{id}/cancelacion", {
      params: { id: "fixture" }, headers: { "Idempotency-Key": "fixture-key" }, body,
    });

    await expect(send()).rejects.toMatchObject({ kind: "network" });
    body.motivo = "Cambio posterior";
    await expect(send()).resolves.toMatchObject({ ok: true });
    const requests = fetcher.mock.calls.map(([, init]) => ({
      body: init?.body, key: new Headers(init?.headers).get("Idempotency-Key"),
    }));
    expect(requests).toEqual(Array(2).fill({ body: '{"motivo":"Prueba"}', key: "fixture-key" }));
  });

  it("lee 204 y PDF sin pasar por JSON", async () => {
    const pdf = Uint8Array.from([37, 80, 68, 70, 13, 10, 128, 255]);
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(pdf, {
        headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="fixture.pdf"' },
      }));
    const client = createApiClient({ baseUrl, fetch: fetcher, token: () => "fixture" });
    await expect(client.request("POST /api/auth/logout", {})).resolves.toMatchObject({ ok: true, status: 204, body: undefined });
    const download = await client.request("GET /api/certificados/{id}/pdf", { params: { id: "fixture" } });
    expect(download.ok && download.headers.contentDisposition).toContain("fixture.pdf");
    expect(download.ok && new Uint8Array(await download.body.arrayBuffer())).toEqual(pdf);
  });

  it("mantiene Int64 en JSON y en query sin redondear", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('{"version":9223372036854775807}', { headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = createApiClient({ baseUrl, fetch: fetcher });
    const version = BigInt("9223372036854775807");
    const result = await client.request("PATCH /api/usuarios/me", { body: { nombre: "Fixture", celular: "", version } });
    expect(result.ok && result.body.version).toBe(version);
    expect(fetcher.mock.calls[0][1]?.body).toContain('"version":9223372036854775807');
    await client.request("DELETE /api/usuarios/{id}", { params: { id: "fixture" }, query: { version } });
    expect(String(fetcher.mock.calls[1][0])).toContain("version=9223372036854775807");
  });

  it("mantiene códigos de error de negocio y Retry-After", async () => {
    const problem = { status: 429, codigo: "CUENTA_BLOQUEADA", traceId: "fixture" };
    const client = createApiClient({ baseUrl, fetch: async () => Response.json(problem, {
      status: 429, headers: { "Content-Type": "application/problem+json", "Retry-After": "60" },
    }) });
    await expect(client.request("POST /api/auth/login", { body: { correo: "x@example.invalid", contrasena: "fixture" } }))
      .resolves.toMatchObject({ kind: "rate-limit", error: problem, headers: { retryAfter: "60" } });
    expect(failureKind(403, null)).toBe("forbidden");
    expect(failureKind(409, null)).toBe("conflict");
    expect(failureKind(401, { ...problem, codigo: "CREDENCIALES_INVALIDAS" })).toBe("unauthorized");
  });

  it("cancela el fetch por señal externa y por timeout", async () => {
    vi.useFakeTimers();
    try {
      const fetcher = vi.fn<typeof fetch>(() => new Promise(() => {}));
      const client = createApiClient({ baseUrl, fetch: fetcher, timeoutMs: 20 });
      const controller = new AbortController();
      const cancelled = expect(client.request(profileOperation, {}, { signal: controller.signal }))
        .rejects.toMatchObject({ kind: "aborted" });
      controller.abort();
      await cancelled;
      const timed = expect(client.request(profileOperation, {})).rejects.toMatchObject({ kind: "timeout" });
      await vi.advanceTimersByTimeAsync(20);
      await timed;
      expect(fetcher.mock.calls.map(([, init]) => init?.signal?.aborted)).toEqual([true, true]);
    } finally {
      vi.useRealTimers();
    }
  });
});
