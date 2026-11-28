"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Select, Textarea } from "@/components/ui/controls";
import { AlertBanner } from "@/components/ui/feedback";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/layout";
import type { CatalogoItem, Inspeccion } from "@/shared/api/contract.generated";
import { formErrorPath } from "@/shared/forms/problem-path";
import { closeInspection, saveDefects, type InspectionActionResult } from "./actions";
import { defectListSchema, severities, type DefectForm } from "./defects";
import { InspectionCounts } from "./summary";

function savedDefects(inspection: Inspeccion): DefectForm {
  return { defectos: (inspection.defectos ?? []).map((defect) => ({
    ...defect, categoria: defect.categoria ?? "", subcategoria: defect.subcategoria ?? "",
  })) };
}

export function InspectionEditor({ initial, categories, subcategories }: {
  initial: Inspeccion; categories: CatalogoItem[]; subcategories: CatalogoItem[];
}) {
  const [inspection, setInspection] = useState(initial);
  const [feedback, setFeedback] = useState<{ message: string; error: boolean }>();
  const [conflict, setConflict] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const form = useForm<DefectForm>({ resolver: zodResolver(defectListSchema), defaultValues: savedDefects(initial) });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "defectos" });
  const values = useWatch({ control: form.control, name: "defectos" });
  const dirty = form.formState.isDirty;

  function apply(result: InspectionActionResult, message: string) {
    if ("inspection" in result) {
      setInspection(result.inspection);
      form.reset(savedDefects(result.inspection));
      setFeedback({ message, error: false });
      return;
    }
    for (const [key, messages] of Object.entries(result.fields ?? {})) {
      const name = formErrorPath(key);
      if (/^defectos\.\d+\.(descripcion|cantidad|severidad|categoria|subcategoria)$/.test(name)) {
        form.setError(name as FieldPath<DefectForm>, { type: "server", message: messages[0] });
      }
    }
    setConflict(Boolean(result.conflict));
    setFeedback({ message: result.message, error: true });
  }

  return <Card className="space-y-4">
    <h2 className="text-xl font-semibold">{inspection.resultado ?? "Registro de defectos"}</h2>
    <p className="text-sm text-muted">Reglas de inspección {inspection.versionReglas}</p>
    <InspectionCounts {...inspection} />
    {feedback && <AlertBanner variant={feedback.error ? "error" : "notice"}>{feedback.message}</AlertBanner>}
    {inspection.estado === "CERRADA" ? <p>La inspección está cerrada. El resultado es definitivo.</p> :
      <form className="space-y-4" onSubmit={form.handleSubmit((input) => {
        if (pending || conflict || confirm) return;
        startTransition(async () => {
          apply(await saveDefects(inspection.id, inspection.version, input), "Registro guardado.");
        });
      })}>
        <fieldset className="space-y-4" disabled={pending || conflict || confirm}>
          {fields.length === 0 && <p>{inspection.defectos === null
            ? "Agrega los defectos observados o guarda el registro vacío para declarar cero defectos."
            : "El registro no contiene defectos."}</p>}
          {fields.map((field, index) => {
            const category = categories.find((item) => item.nombre === values[index]?.categoria);
            const options = subcategories.filter((item) => item.padreId === category?.id);
            return <fieldset key={field.id} className="grid gap-4 rounded-panel border border-subtle p-3 sm:grid-cols-2">
              <legend className="px-1 font-semibold">Defecto {index + 1}</legend>
              <FormField control={form.control} name={`defectos.${index}.categoria`} label="Categoría">{(input) =>
                <Select {...input} onChange={(event) => {
                  input.onChange(event);
                  form.setValue(`defectos.${index}.subcategoria`, "", { shouldDirty: true });
                }}>
                  <option value="">Selecciona una categoría</option>
                  {categories.map((item) => <option key={item.id} value={item.nombre}>{item.nombre}</option>)}
                </Select>}
              </FormField>
              <FormField control={form.control} name={`defectos.${index}.subcategoria`} label="Subcategoría">{(input) =>
                <Select {...input} disabled={!category}>
                  <option value="">Selecciona una subcategoría</option>
                  {options.map((item) => <option key={item.id} value={item.nombre}>{item.nombre}</option>)}
                </Select>}
              </FormField>
              <FormField control={form.control} name={`defectos.${index}.severidad`} label="Severidad">{(input) =>
                <Select {...input}>{severities.map((label) => <option key={label}>{label}</option>)}</Select>}
              </FormField>
              <FormField control={form.control} name={`defectos.${index}.cantidad`} label="Cantidad">{(input) =>
                <Input {...input} type="number" min={1} max={100}
                  value={Number.isNaN(input.value) ? "" : input.value}
                  onChange={(event) => input.onChange(event.currentTarget.valueAsNumber)} />}
              </FormField>
              <div className="sm:col-span-2">
                <FormField control={form.control} name={`defectos.${index}.descripcion`} label="Descripción">{(input) =>
                  <Textarea {...input} maxLength={300} />}
                </FormField>
              </div>
              <Button size="touch" variant="secondary" onClick={() => remove(index)}>Quitar defecto {index + 1}</Button>
            </fieldset>;
          })}
          <div className="flex flex-wrap gap-4">
            <Button size="touch" variant="secondary" disabled={fields.length >= 100 || !categories.length}
              onClick={() => append({ categoria: "", subcategoria: "", descripcion: "", severidad: "Leve", cantidad: 1 })}>
              Agregar defecto
            </Button>
            <Button size="touch" type="submit">{pending ? "Procesando…" : "Guardar registro"}</Button>
            <Button size="touch" variant="secondary" disabled={dirty || inspection.defectos === null}
              onClick={() => setConfirm(true)}>Cerrar inspección</Button>
          </div>
          {dirty && <p className="text-sm text-muted">Guarda los cambios antes de cerrar la inspección.</p>}
        </fieldset>
        {conflict && <Button size="touch" variant="secondary" onClick={() => startTransition(() => router.refresh())}>
          Cargar la última versión
        </Button>}
        {confirm && <section aria-labelledby="confirm-inspection" className="space-y-4 rounded-panel bg-brand-tint p-6">
          <h3 id="confirm-inspection" className="text-lg font-semibold">Confirmar resultado</h3>
          <p>Confirma el cierre definitivo con el registro guardado.</p>
          <div className="flex flex-wrap gap-4">
            <Button size="touch" disabled={pending} onClick={() => startTransition(async () => {
              const result = await closeInspection(inspection.id, inspection.version);
              setConfirm(false);
              apply(result, "Inspección cerrada.");
            })}>Confirmar cierre</Button>
            <Button size="touch" disabled={pending} variant="secondary" onClick={() => setConfirm(false)}>Volver</Button>
          </div>
        </section>}
      </form>}
  </Card>;
}
