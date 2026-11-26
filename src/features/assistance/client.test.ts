/** @vitest-environment node */
import { expect, it, vi } from "vitest";
import { askAssistance } from "./client";
import { assistanceFallback } from "./contract";

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
