"use client";

import { useId, type ReactNode } from "react";
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";

type AccessibleField = { id: string; "aria-invalid": boolean; "aria-describedby"?: string };

export function FieldFrame({ label, id, hint, error, children }: {
  label: string; id: string; hint?: string; error?: string;
  children(accessibility: AccessibleField): ReactNode;
}) {
  const description = [hint && id + "-hint", error && id + "-error"].filter(Boolean).join(" ");
  return <div className="space-y-1">
    <label className="text-sm font-semibold" htmlFor={id}>{label}</label>
    {children({ id, "aria-invalid": Boolean(error), "aria-describedby": description || undefined })}
    {hint && <p id={id + "-hint"} className="text-sm text-muted">{hint}</p>}
    {error && <p id={id + "-error"} className="text-sm text-status-rejected">{error}</p>}
  </div>;
}

export function FormField<T extends FieldValues, N extends FieldPath<T>>({ control, name, label, hint, children }: {
  control: Control<T>;
  name: N;
  label: string;
  hint?: string;
  children(field: ReturnType<typeof useController<T, N>>["field"] & AccessibleField): ReactNode;
}) {
  const id = useId();
  const { field, fieldState } = useController({ control, name });
  return <FieldFrame id={id} label={label} hint={hint} error={fieldState.error?.message}>
    {(accessibility) => children({ ...field, ...accessibility })}
  </FieldFrame>;
}
