import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Badge } from "./badge";

it("identifica estados administrativos y anomalías con texto visible", () => {
  render(<><Badge status="Activo" /><Badge status="Inactivo" /><Badge status="Anomalía preventiva" /></>);
  expect(screen.getByText("Activo")).toBeVisible();
  expect(screen.getByText("Inactivo")).toBeVisible();
  expect(screen.getByText("Anomalía preventiva")).toHaveClass("text-status-alert");
});
