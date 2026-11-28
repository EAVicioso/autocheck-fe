import { Check } from "lucide-react";
import { cn } from "./classes";

export function Stepper({ steps, current, label }: {
  steps: readonly string[];
  current: number;
  label: string;
}) {
  return <ol aria-label={label} className="flex flex-wrap gap-y-4">
    {steps.map((step, index) => {
      const completed = index < current;
      const active = index === current;
      return <li key={step} aria-current={active ? "step" : undefined} className="flex min-w-0 flex-1 basis-24 flex-col">
        <div aria-hidden="true" className="flex items-center">
          <span className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border-2",
            completed || active ? "border-brand-accent bg-brand-accent" : "border-brand-primary bg-brand-primary",
          )}>
            {completed ? <Check className="size-6 stroke-on-brand" strokeWidth={3} /> : active
              ? <span className="text-xl font-bold text-on-brand">{index + 1}</span>
              : <span className="text-sm font-semibold text-on-brand">{index + 1}</span>}
          </span>
          {index < steps.length - 1 && <span className={cn(
            "h-0.5 flex-1", completed ? "bg-brand-accent" : "bg-brand-tint",
          )} />}
        </div>
        <span className={cn("mt-2 pr-2 text-sm", completed || active ? "font-semibold text-primary" : "text-muted")}>
          {step}{completed && <span className="sr-only"> (completado)</span>}
        </span>
      </li>;
    })}
  </ol>;
}
