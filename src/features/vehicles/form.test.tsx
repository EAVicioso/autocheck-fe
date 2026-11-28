import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { VehicleForm } from "./form";
import { vehicleForm } from "./validation";

const brand = "10000000-0000-4000-8000-000000000001";
const otherBrand = "10000000-0000-4000-8000-000000000002";
const model = "10000000-0000-4000-8000-000000000003";
const color = "10000000-0000-4000-8000-000000000004";
const values = { matricula: "A-123", vin: "12345678912345678", anio: "2020", modeloId: model, colorId: color };

it("limpia el modelo cuando cambia la marca", async () => {
  const user = userEvent.setup();
  const save = vi.fn();
  render(<VehicleForm values={values} brands={[{ id: brand, nombre: "Uno", padreId: null }, { id: otherBrand, nombre: "Dos", padreId: null }]}
    models={[{ id: model, nombre: "Modelo uno", padreId: brand }]} colors={[{ id: color, nombre: "Azul", padreId: null }]} save={save} />);
  expect(screen.getByLabelText("Modelo")).toHaveValue(model);
  await user.selectOptions(screen.getByLabelText("Marca"), otherBrand);
  expect(screen.getByLabelText("Modelo")).toHaveValue("");
  await user.click(screen.getByRole("button", { name: "Guardar vehículo" }));
  expect(save).not.toHaveBeenCalled();
});

it("valida los límites del año y el conjunto de caracteres del VIN", () => {
  expect(vehicleForm.safeParse(values).success).toBe(true);
  expect(vehicleForm.safeParse({ ...values, anio: "2101" }).success).toBe(false);
  expect(vehicleForm.safeParse({ ...values, vin: "I2345678912345678" }).success).toBe(false);
});

