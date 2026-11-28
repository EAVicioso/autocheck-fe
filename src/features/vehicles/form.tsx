"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, LabeledControl, Select } from "@/components/ui/controls";
import { Modal } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { AlertBanner } from "@/components/ui/feedback";
import type { Feedback } from "@/features/citizen/forms";
import type { CatalogoItem } from "@/shared/api/contract.generated";
import { vehicleForm, type VehicleValues } from "./validation";

export function VehicleForm({ values, brands, models, colors, save }: {
  values: VehicleValues;
  brands: CatalogoItem[];
  models: CatalogoItem[];
  colors: CatalogoItem[];
  save(input: VehicleValues): Promise<Feedback>;
}) {
  const [brand, setBrand] = useState(models.find((model) => model.id === values.modeloId)?.padreId ?? "");
  const [feedback, setFeedback] = useState<Feedback>();
  const { control, handleSubmit, setValue, setError, formState } = useForm({ defaultValues: values, resolver: zodResolver(vehicleForm) });

  return <form noValidate className="space-y-3" onSubmit={handleSubmit(async (data) => {
    const next = await save(data);
    for (const field of Object.keys(values) as (keyof VehicleValues)[]) {
      if (next.fields?.[field]) setError(field, { message: next.fields[field] });
    }
    setFeedback(next);
  })}>
    <fieldset disabled={formState.isSubmitting} className="space-y-3">
      <FormField name="matricula" label="Matrícula" control={control}>{(field) => <Input {...field} />}</FormField>
      <FormField name="vin" label="VIN" control={control}>{(field) => <Input {...field} />}</FormField>
      <FormField name="anio" label="Año" control={control}>{(field) => <Input {...field} inputMode="numeric" />}</FormField>
      <LabeledControl label="Marca"><Select value={brand} onChange={(event) => {
        setBrand(event.target.value);
        setValue("modeloId", "", { shouldValidate: formState.isSubmitted });
      }}><option value="">Selecciona una marca</option>
        {brands.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
      </Select></LabeledControl>
      <FormField name="modeloId" label="Modelo" control={control}>{(field) =>
        <Select {...field} disabled={!brand}><option value="">Selecciona un modelo</option>
          {models.filter((item) => item.padreId === brand).map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
        </Select>}</FormField>
      <FormField name="colorId" label="Color" control={control}>{(field) =>
        <Select {...field}><option value="">Selecciona un color</option>
          {colors.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
        </Select>}</FormField>
      <Button type="submit">{formState.isSubmitting ? "Guardando…" : "Guardar vehículo"}</Button>
    </fieldset>
    {feedback && <AlertBanner variant={feedback.kind}>{feedback.message}</AlertBanner>}
  </form>;
}

export function ArchiveVehicle({ archive }: { archive(): Promise<Feedback> }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>();
  const running = useRef(false);

  return <><Button variant="danger" onClick={() => setOpen(true)}>Archivar vehículo</Button>
    <Modal open={open} onClose={() => { if (!running.current) setOpen(false); }} title="Archivar vehículo">
      <p className="mb-3">El vehículo dejará de aparecer en tus vehículos activos.</p>
      {feedback && <AlertBanner variant={feedback.kind}>{feedback.message}</AlertBanner>}
      <Button variant="danger" disabled={pending} onClick={async () => {
        if (running.current) return;
        running.current = true;
        setPending(true);
        try { setFeedback(await archive()); }
        finally { running.current = false; setPending(false); }
      }}>Confirmar archivo</Button>
    </Modal>
  </>;
}

