import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ProfileForm } from "./profile-form";

it("valida el nombre y muestra el error por campo devuelto por el API", async () => {
  const user = userEvent.setup();
  const save = vi.fn().mockResolvedValue({ kind: "error", message: "Revisa los datos.", fields: { celular: "Celular inválido." } });
  render(<ProfileForm values={{ nombre: "", celular: "" }} save={save} />);
  await user.click(screen.getByRole("button", { name: "Guardar perfil" }));
  expect(await screen.findByText("Escribe tu nombre.")).toBeVisible();
  expect(save).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText("Nombre"), "Sebastián");
  await user.click(screen.getByRole("button", { name: "Guardar perfil" }));
  expect(await screen.findByText("Celular inválido.")).toBeVisible();
  expect(save).toHaveBeenCalledWith({ nombre: "Sebastián", celular: "" });
});

