import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import type { Bloque } from "@/shared/api/contract.generated";
import { useAvailabilityUpdates } from "@/features/availability/use-availability-updates";
import { BookingForm } from "./booking-form";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/features/availability/use-availability-updates", () => ({ useAvailabilityUpdates: vi.fn() }));

it("invalida la revisión si el bloque se ocupa y descarta la selección al cambiar de centro", async () => {
  sessionStorage.clear();
  const user = userEvent.setup();
  render(<BookingForm actor="test" vehicles={[{ id: "vehicle", matricula: "A-123" }]}
    centers={[{ id: "center", nombre: "Centro uno" }, { id: "other", nombre: "Centro dos" }]}
    initialVehicle="vehicle" today="2026-11-29" emptyVehicles={null} />);
  await user.selectOptions(await screen.findByLabelText("Centro"), "center");
  const block: Bloque = { rampaId: "rampa", inicioUtc: "2026-11-29T12:00:00Z", estado: "LIBRE", expiraUtc: null };
  const snapshot = (bloques: Bloque[]) => act(() => vi.mocked(useAvailabilityUpdates).mock.lastCall?.[0]
    .onSnapshot({ zonaHoraria: "America/Santo_Domingo", bloques }));
  snapshot([block]);
  await user.click(screen.getByRole("radio", { name: /Libre/ }));
  await user.click(screen.getByRole("button", { name: "Revisar reserva" }));
  expect(screen.getByRole("button", { name: "Iniciar pago simulado" })).toBeEnabled();

  snapshot([{ ...block, estado: "CONFIRMADO" }]);
  expect(screen.getByText("El horario seleccionado dejó de estar disponible.")).toBeVisible();
  expect(screen.getByRole("button", { name: "Revisar reserva" })).toBeDisabled();

  await user.selectOptions(screen.getByLabelText("Centro"), "other");
  expect(screen.getByText("Consultando disponibilidad…")).toBeVisible();
  expect(vi.mocked(useAvailabilityUpdates).mock.lastCall?.[0].centroId).toBe("other");
  snapshot([block]);
  expect(screen.getByRole("radio", { name: /Libre/ })).not.toBeChecked();
});
