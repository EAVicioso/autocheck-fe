import type { ComponentProps, ReactNode } from "react";
import { cn } from "./classes";

const control = "w-full min-h-11 rounded-control border border-subtle bg-surface-elevated px-3 py-2 text-primary disabled:opacity-60 aria-invalid:border-status-rejected";

type ButtonProps = Omit<ComponentProps<"button">, "size"> & {
  variant?: "primary" | "secondary" | "danger";
  size?: "default" | "touch";
};

export function Button({ variant = "primary", size = "default", type = "button", className, ...props }: ButtonProps) {
  return <button {...props} type={type} className={cn(
    "inline-flex cursor-pointer items-center justify-center rounded-control px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-60",
    size === "touch" ? "min-h-11 min-w-11" : "min-h-10",
    variant === "primary" && "bg-brand-primary text-on-brand hover:bg-brand-primary-hover",
    variant === "secondary" && "border border-subtle bg-surface-elevated text-primary hover:bg-surface",
    variant === "danger" && "bg-status-rejected text-on-brand",
    className,
  )} />;
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(control, className)} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={cn(control, className)} />;
}

export function Textarea({ className, rows = 3, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} rows={rows} className={cn(control, className)} />;
}

export function Checkbox({ label, className, ...props }: Omit<ComponentProps<"input">, "type"> & { label: ReactNode }) {
  return <label className="flex min-h-11 items-center gap-3">
    <input {...props} type="checkbox" className={cn("size-5 accent-brand-primary", className)} />{label}
  </label>;
}

export function RadioGroup({ legend, name, options, value, onChange, disabled }: {
  legend: string;
  name: string;
  options: readonly { value: string; label: string; disabled?: boolean }[];
  value: string;
  onChange(value: string): void;
  disabled?: boolean;
}) {
  return <fieldset disabled={disabled} className="space-y-1">
    <legend className="font-semibold">{legend}</legend>
    {options.map((option) => <label key={option.value} className="flex min-h-11 items-center gap-3">
      <input type="radio" name={name} value={option.value} disabled={option.disabled} checked={value === option.value}
        onChange={() => onChange(option.value)} className="size-5 accent-brand-primary" />{option.label}
    </label>)}
  </fieldset>;
}

export function DatePicker(props: Omit<ComponentProps<"input">, "type" | "value" | "defaultValue"> & {
  value?: string; defaultValue?: string;
}) {
  // Native date inputs emit YYYY-MM-DD. Keep the civil day intact across host timezones.
  return <Input {...props} type="date" data-time-zone="America/Santo_Domingo" />;
}
