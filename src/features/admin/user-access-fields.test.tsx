import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { UserAccessFields } from "./user-access-fields";

it("solo habilita permisos cuando está seleccionado el rol Administrador", async () => {
  const user = userEvent.setup();
  render(<form aria-label="Acceso"><UserAccessFields initialRole="Ciudadano" initialPermissions={[]} active
    center="" scoped={false} /></form>);
  const permission = screen.getByRole("checkbox", { name: "Consultar auditoría" });
  expect(permission).toBeDisabled();
  await user.click(screen.getByRole("radio", { name: "Administrador" }));
  await user.click(permission);
  expect(new FormData(screen.getByRole<HTMLFormElement>("form")).getAll("permisos")).toEqual(["auditoria.consultar"]);
  await user.click(screen.getByRole("radio", { name: "Ciudadano" }));
  expect(permission).not.toBeChecked();
  expect(permission).toBeDisabled();
});
