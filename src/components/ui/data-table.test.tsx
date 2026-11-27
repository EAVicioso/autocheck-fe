import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { DataTable } from "./data-table";

it("conserva el filtro al navegar páginas servidas por el servidor", () => {
  render(<DataTable caption="Usuarios" columns={[{ id: "name", heading: "Nombre", render: (row) => row }]}
    rowKey={(row) => row} state={{ status: "ready", rows: ["Ana"], hasNext: true }} page={1}
    pageHref={(page) => "/admin/usuarios?nombre=Ana&pagina=" + page} />);
  expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
  expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute("href", "/admin/usuarios?nombre=Ana&pagina=2");
});
