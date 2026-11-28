import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Input, LabeledControl } from "@/components/ui/controls";
import { AdminForm, type AdminFeedback, type AdminFormAction } from "./forms";

it("anuncia el guardado, bloquea el formulario y oculta el mensaje de un intento anterior", async () => {
  const pending = Promise.withResolvers<AdminFeedback>();
  const save = vi.fn<AdminFormAction>()
    .mockResolvedValueOnce({ kind: "error", message: "Resultado anterior." })
    .mockImplementationOnce(() => pending.promise);
  const user = userEvent.setup();
  render(<AdminForm action={save} label="Guardar centro">
    <LabeledControl label="Nombre"><Input name="nombre" defaultValue="Centro" /></LabeledControl>
  </AdminForm>);

  const button = screen.getByRole("button", { name: "Guardar centro" });
  await user.click(button);
  expect(await screen.findByRole("alert")).toHaveTextContent("Resultado anterior.");
  await user.click(button);
  expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
  expect(screen.getByRole("textbox", { name: "Nombre" })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Guardando cambios…");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  await user.click(button);
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[1][1].get("nombre")).toBe("Centro");
  await act(async () => pending.resolve({ kind: "notice", message: "Centro actualizado." }));
  expect(screen.getByRole("status")).toHaveTextContent("Centro actualizado.");
  expect(button).toBeEnabled();
});
