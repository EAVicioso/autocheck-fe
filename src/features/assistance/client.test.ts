/** @vitest-environment node */
import { expect, it, vi } from "vitest";
import { askAssistance } from "./client";
import { assistanceFallback, assistanceReply, assistanceSchema } from "./contract";

it("valida límites tras el trim y exige las tres claves con una respuesta no vacía", () => {
  expect(assistanceSchema.parse({ consulta: "  " + "x".repeat(2000) + "  " }).consulta).toHaveLength(2000);
  expect(assistanceSchema.safeParse({ consulta: "  " }).success).toBe(false);
  expect(assistanceSchema.safeParse({ consulta: "x".repeat(2001) }).success).toBe(false);
  expect(assistanceReply.safeParse({ ...assistanceFallback, respuesta: " " }).success).toBe(false);
  expect(assistanceReply.safeParse({ ...assistanceFallback, id: "extra" }).success).toBe(false);
});

it("presenta la contingencia ante un fallo de red o un éxito malformado", async () => {
  const input = { consulta: "Horario" };
  const rejected = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("network"));
  const malformed = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ respuesta: " " }));
  expect(await askAssistance(input, undefined, rejected)).toEqual({ source: "network", status: null, reply: assistanceFallback });
  expect(await askAssistance(input, undefined, malformed)).toEqual({ source: "http", status: 503, reply: assistanceFallback });
  expect(rejected).toHaveBeenCalledTimes(1);
});

it("cancela a los 3 s incluso si el cuerpo del HTTP sigue pendiente", async () => {
  vi.useFakeTimers();
  try {
    const stalled = new Response(new ReadableStream({ start() {} }));
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(stalled);
    const pending = askAssistance({ consulta: "Horario" }, undefined, fetcher);
    await vi.advanceTimersByTimeAsync(2999);
    expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(await pending).toEqual({ source: "local-timeout", status: null, reply: {
      respuesta: "El servicio de asistencia no está disponible temporalmente. Intenta de nuevo.",
      categoria: "NO_DETERMINADA", codigo: "SERVICIO_NO_DISPONIBLE",
    } });
    expect(fetcher).toHaveBeenCalledTimes(1);
  } finally {
    vi.useRealTimers();
  }
});

it("preserva el 503 HTTP y sus tres claves como resultado distinto", async () => {
  const result = await askAssistance({ consulta: "Horario" }, undefined,
    async () => Response.json(assistanceFallback, { status: 503 }));
  expect(result).toEqual({ source: "http", status: 503, reply: assistanceFallback });
});
