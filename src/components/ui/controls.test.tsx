import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { Button, Checkbox, DatePicker, Input, RadioGroup, Select, Textarea } from "./controls";
import { FormField } from "./form-field";

it("expone controles nativos etiquetados y un botón táctil", async () => {
  const user = userEvent.setup();
  const choose = vi.fn();
  render(<>
    <Button size="touch">Continuar</Button>
    <Checkbox label="Acepto" /><DatePicker aria-label="Día" defaultValue="2026-11-25" />
    <Select aria-label="Centro"><option>Centro de prueba</option></Select>
    <Textarea aria-label="Observaciones" />
    <RadioGroup legend="Tipo" name="tipo" value="a" onChange={choose} options={[{ value: "a", label: "Primera" }, { value: "b", label: "Segunda" }]} />
  </>);
  expect(screen.getByRole("button")).toHaveClass("min-h-11", "min-w-11");
  await user.click(screen.getByRole("checkbox", { name: "Acepto" }));
  expect(screen.getByRole("checkbox")).toBeChecked();
  expect(screen.getByLabelText("Día")).toHaveValue("2026-11-25");
  expect(screen.getByLabelText("Día")).toHaveAttribute("data-time-zone", "America/Santo_Domingo");
  expect(screen.getByRole("combobox", { name: "Centro" })).toHaveValue("Centro de prueba");
  await user.type(screen.getByRole("textbox", { name: "Observaciones" }), "Revisar");
  await user.click(screen.getByRole("radio", { name: "Segunda" }));
  expect(choose).toHaveBeenCalledWith("b");
});

it("vincula el error Zod al campo y conserva el valor al corregir", async () => {
  const user = userEvent.setup();
  const submit = vi.fn();

  function Form() {
    const { control, handleSubmit } = useForm({
      defaultValues: { code: "" }, resolver: zodResolver(z.object({ code: z.string().min(1, "Escribe un código.") })),
    });
    return <form onSubmit={handleSubmit(submit)}>
      <FormField name="code" label="Código" control={control}>{(field) => <Input {...field} />}</FormField>
      <Button type="submit">Guardar</Button>
    </form>;
  }
  render(<Form />);
  const field = screen.getByRole("textbox", { name: "Código" });
  await user.click(screen.getByRole("button"));
  expect(await screen.findByText("Escribe un código.")).toBeVisible();
  expect(field).toHaveAccessibleDescription("Escribe un código.");
  await user.type(field, "A");
  await user.click(screen.getByRole("button"));
  expect(submit.mock.calls[0][0]).toEqual({ code: "A" });
});
