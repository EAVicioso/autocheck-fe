import { expect, it } from "vitest";
import { formErrorPath } from "./problem-path";

it("conserva índices y convierte nombres de validación PascalCase", () => {
  expect(formErrorPath("$.Defectos[0].Descripcion")).toBe("defectos.0.descripcion");
  expect(formErrorPath("VIN")).toBe("vin");
  expect(formErrorPath("nuevaContrasena")).toBe("nuevaContrasena");
});
