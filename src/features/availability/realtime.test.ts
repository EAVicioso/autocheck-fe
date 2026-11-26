import { afterEach, expect, it, vi } from "vitest";
import { subscribeAvailability, watchAvailability } from "./realtime";

afterEach(() => vi.useRealTimers());

it.each(["sin canal", "con un evento perdido"])("revalida REST por polling %s y cancela al desmontar", async (scenario) => {
  vi.useFakeTimers();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
  const read = vi.fn<NonNullable<Parameters<typeof watchAvailability>[0]["read"]>>()
    .mockResolvedValue({ zonaHoraria: "America/Santo_Domingo", bloques: [] });
  const close = watchAvailability({
    centroId: "centro", fecha: "2026-11-23", read, onSnapshot: vi.fn(), onError: vi.fn(),
    connect: scenario === "con un evento perdido" ? () => () => {} : undefined,
  });
  try {
    await vi.advanceTimersByTimeAsync(29_999);
    expect(read).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(read).toHaveBeenCalledTimes(2);
    close();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(read).toHaveBeenCalledTimes(2);
  } finally {
    close();
    vi.unstubAllEnvs();
  }
});

it("reconsulta al vencer la retención y no entra en bucle con un snapshot vencido", async () => {
  vi.useFakeTimers();
  const expires = Date.now() + 5_000;
  const read = vi.fn<NonNullable<Parameters<typeof watchAvailability>[0]["read"]>>()
    .mockResolvedValue({ zonaHoraria: "America/Santo_Domingo", bloques: [{
      estado: "RETENIDO", rampaId: "rampa", inicioUtc: new Date(expires).toISOString(), expiraUtc: new Date(expires).toISOString(),
    }] });
  const close = watchAvailability({
    centroId: "centro", fecha: "2026-11-23", read, connect: () => () => {}, onSnapshot: vi.fn(), onError: vi.fn(),
  });
  try {
    await vi.advanceTimersByTimeAsync(4_999);
    expect(read).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2);
    expect(read).toHaveBeenCalledTimes(2);
  } finally {
    close();
  }
});

it("filtra Broadcast por centro y revalida tras cada suscripción", () => {
  let emit: (event: { payload: { centroId: string } }) => void = () => {};
  let status: (state: string) => void = () => {};
  const channel = {
    on: vi.fn((_type, _event, handler: typeof emit) => { emit = handler; return channel; }),
    subscribe: vi.fn((handler: typeof status) => { status = handler; return channel; }),
  };
  const client = { channel: vi.fn(() => channel), removeChannel: vi.fn(async () => "ok") };
  const invalidate = vi.fn();
  const dispose = subscribeAvailability(client as unknown as Parameters<typeof subscribeAvailability>[0], "centro", true, invalidate);
  expect(client.channel).toHaveBeenCalledWith("disponibilidad:centro", { config: { private: true } });
  expect(channel.on).toHaveBeenCalledWith("broadcast", { event: "actualizada" }, expect.any(Function));
  status("SUBSCRIBED");
  emit({ payload: { centroId: "otro" } });
  emit({ payload: { centroId: "centro" } });
  status("CLOSED");
  status("SUBSCRIBED");
  expect(invalidate).toHaveBeenCalledTimes(3);
  dispose();
  expect(client.removeChannel).toHaveBeenCalledWith(channel);
});

it("relee REST al invalidar y aborta al dejar el centro", async () => {
  let invalidate = () => {};
  const disconnect = vi.fn();
  const read = vi.fn<NonNullable<Parameters<typeof watchAvailability>[0]["read"]>>()
    .mockResolvedValueOnce({ zonaHoraria: "America/Santo_Domingo", bloques: [] })
    .mockImplementation(() => new Promise(() => {}));
  const onSnapshot = vi.fn();
  const close = watchAvailability({
    centroId: "centro", fecha: "2026-11-23", read, onSnapshot, onError: vi.fn(),
    connect: (_id, update) => { invalidate = update; return disconnect; },
  });
  await vi.waitFor(() => expect(onSnapshot).toHaveBeenCalled());
  invalidate();
  expect(read).toHaveBeenCalledTimes(2);
  expect(read.mock.calls[1].slice(0, 2)).toEqual(["centro", "2026-11-23"]);
  close();
  expect(read.mock.calls[1][2].aborted).toBe(true);
  expect(disconnect).toHaveBeenCalledOnce();
});
