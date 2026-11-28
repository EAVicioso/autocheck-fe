"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@/components/ui/controls";
import { FormField } from "@/components/ui/form-field";
import { AlertBanner } from "@/components/ui/feedback";
import { profileForm, type Feedback } from "./forms";

type Values = { nombre: string; celular: string };

export function ProfileForm({ values, save }: { values: Values; save(values: Values): Promise<Feedback> }) {
  const [feedback, setFeedback] = useState<Feedback>();
  const { control, handleSubmit, setError, formState } = useForm({ defaultValues: values, resolver: zodResolver(profileForm) });

  return <form noValidate className="space-y-3" onSubmit={handleSubmit(async (data) => {
    const next = await save(data);
    for (const name of ["nombre", "celular"] as const) {
      if (next.fields?.[name]) setError(name, { message: next.fields[name] });
    }
    setFeedback(next);
  })}>
    <fieldset disabled={formState.isSubmitting || feedback?.kind === "notice"} className="space-y-3">
      <FormField name="nombre" control={control} label="Nombre">{(field) => <Input {...field} autoComplete="name" />}</FormField>
      <FormField name="celular" control={control} label="Celular">{(field) => <Input {...field} type="tel" autoComplete="tel" />}</FormField>
      <Button type="submit">{formState.isSubmitting ? "Guardando…" : "Guardar perfil"}</Button>
    </fieldset>
    {feedback && <AlertBanner variant={feedback.kind}>{feedback.message}</AlertBanner>}
    {feedback?.kind === "notice" && <Button variant="secondary" onClick={() => window.location.reload()}>Editar de nuevo</Button>}
  </form>;
}

