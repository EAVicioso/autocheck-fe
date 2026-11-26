"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./controls";
import { cn } from "./classes";

type DialogProps = { open: boolean; onClose(): void; title: string; children: ReactNode };

function Dialog({ open, onClose, title, children, drawer }: DialogProps & { drawer?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const label = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    if (!open && dialog?.open) dialog.close();
    return () => { if (dialog?.open) dialog.close(); };
  }, [open]);

  return <dialog ref={ref} aria-labelledby={label} onCancel={(event) => { event.preventDefault(); onClose(); }}
    className={cn(
      "overflow-y-auto border border-subtle bg-surface-elevated p-6 text-primary shadow-panel backdrop:bg-overlay/55",
      drawer ? "my-0 mr-0 ml-auto h-dvh max-h-none w-full max-w-md" : "m-auto max-h-dvh w-full max-w-lg rounded-panel",
    )}>
    <header className="mb-4 flex items-center justify-between gap-4">
      <h2 id={label} className="text-xl font-semibold">{title}</h2>
      <Button variant="secondary" size="touch" onClick={onClose}>Cerrar</Button>
    </header>
    {children}
  </dialog>;
}

export function Modal(props: DialogProps) {
  return <Dialog {...props} />;
}

export function Drawer(props: DialogProps) {
  return <Dialog {...props} drawer />;
}
