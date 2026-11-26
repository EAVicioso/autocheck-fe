import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { AppShell, Breadcrumb, Card, PageHeader, RoleSidebar, Topbar } from "./layout";
import { Tabs } from "./tabs";

it("identifica la navegación actual, el contenido principal y el aviso académico", () => {
  const items = [{ href: "/inspector", label: "Inspector", current: true }];
  render(<AppShell sidebar={<RoleSidebar label="Portal" items={items} />} topbar={<Topbar>AutoCheck</Topbar>}>
    <Breadcrumb items={items} />
    <Card><PageHeader title="Área de inspección" /></Card>
  </AppShell>);
  expect(screen.getByRole("link", { name: "Inspector" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("navigation", { name: "Ruta de navegación" })).toHaveTextContent("Inspector");
  expect(screen.getByRole("main")).toContainElement(screen.getByRole("heading", { name: "Área de inspección" }));
  expect(screen.getByText(/sin validez legal ni oficial ante INTRANT/)).toBeVisible();
});

it("activa los tabs con teclas y mantiene sus enlaces ARIA", async () => {
  const user = userEvent.setup();
  render(<Tabs label="Detalle" tabs={[
    { id: "a", label: "Resumen", content: "Resumen de inspección" },
    { id: "b", label: "Historial", content: "Historial del vehículo" },
  ]} />);
  await user.tab();
  await user.keyboard("{ArrowRight}");
  const tab = screen.getByRole("tab", { name: "Historial" });
  expect(tab).toHaveFocus();
  expect(tab).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel", { name: "Historial" })).toHaveTextContent("Historial del vehículo");
});
