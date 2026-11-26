"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "./classes";

type Tab = { id: string; label: string; content: ReactNode };

export function Tabs({ label, tabs }: { label: string; tabs: readonly Tab[] }) {
  const prefix = useId();
  const [selection, select] = useState(tabs[0]?.id);
  const active = tabs.some(({ id }) => id === selection) ? selection : tabs[0]?.id;
  if (!active) return null;

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1;
    let next: number;
    switch (event.key) {
      case "ArrowRight": next = index === last ? 0 : index + 1; break;
      case "ArrowLeft": next = index === 0 ? last : index - 1; break;
      case "Home": next = 0; break;
      case "End": next = last; break;
      default: return;
    }
    event.preventDefault();
    select(tabs[next].id);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  return <div>
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1 border-b border-subtle">
      {tabs.map(({ id, label }, index) => <button key={id} type="button" id={prefix + "-tab-" + id}
        role="tab" aria-controls={prefix + "-panel-" + id} aria-selected={id === active}
        tabIndex={id === active ? 0 : -1} onClick={() => select(id)} onKeyDown={(event) => navigate(event, index)}
        className={cn("min-h-11 border-b-2 border-transparent px-4", id === active && "border-brand-primary font-semibold text-brand-primary")}>{label}</button>)}
    </div>
    {tabs.map(({ id, content }) => <div key={id} id={prefix + "-panel-" + id}
      role="tabpanel" hidden={id !== active} tabIndex={0} aria-labelledby={prefix + "-tab-" + id}>{content}</div>)}
  </div>;
}
