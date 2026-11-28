import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Pago } from "@/shared/api/contract.generated";
import { PaymentStatus } from "./status";
import { citizenRequest } from "./client";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("./client", async (importOriginal) => ({
  ...await importOriginal<typeof import("./client")>(),
  citizenRequest: vi.fn(),
}));

const id = "10000000-0000-4000-8000-000000000001";
const start = new Date("2026-11-29T12:00:00.000Z");
const expires = new Date(start.getTime() + 300_000).toISOString();
const payment: Pago = {
  intentoId: id, retencionId: id, estado: "PENDIENTE", expiraUtc: expires,
  citaId: null, reversionId: null, monto: 1000, moneda: "DOP", siguienteAccion: null,
};

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.useRealTimers();
});

it("consulta al llegar a 300 segundos y presenta la decisión del servidor", async () => {
  vi.useFakeTimers({ now: start.getTime() + 299_000 });
  vi.mocked(citizenRequest).mockResolvedValue({ ...payment, estado: "VENCIDO" });
  render(<PaymentStatus actor={id} initial={payment} />);
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(screen.getByRole("timer")).toHaveTextContent("0:01");
  expect(citizenRequest).not.toHaveBeenCalled();
  await act(() => vi.advanceTimersByTimeAsync(999));
  expect(screen.getByText("La retención venció. Elige otro horario.")).toBeVisible();
  expect(citizenRequest).toHaveBeenCalledTimes(1);
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(citizenRequest).toHaveBeenCalledTimes(1);
});

it("detiene la consulta automática si el servidor sigue pendiente al vencimiento", async () => {
  vi.useFakeTimers({ now: start.getTime() + 299_000 });
  vi.mocked(citizenRequest).mockResolvedValue(payment);
  render(<PaymentStatus actor={id} initial={payment} />);
  await act(() => vi.advanceTimersByTimeAsync(2000));
  expect(screen.getByText("Esperando el resultado del pago")).toBeVisible();
  expect(screen.getByRole("button", { name: "Consultar estado" })).toBeEnabled();
  expect(citizenRequest).toHaveBeenCalledTimes(1);
});
