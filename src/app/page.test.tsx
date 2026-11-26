import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import Home from "./page";

it("muestra la entrada pública de AutoCheck", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("AutoCheck");
  expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/login");
});
