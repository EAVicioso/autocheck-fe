import { expect, it, vi } from "vitest";
import { subscribeAvailability, watchAvailability } from "./realtime";

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
