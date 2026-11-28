import type { ReactNode } from "react";
import { Button } from "./controls";

export function LoadingSkeleton({ label = "Cargando…" }: { label?: string }) {
  return <div role="status" className="space-y-2"><p>{label}</p>
    <div aria-hidden="true" className="h-9 animate-pulse rounded-control bg-surface-elevated motion-reduce:animate-none" />
  </div>;
}

export function EmptyState({ message = "Sin datos" }: { message?: string }) {
  return <p role="status" className="py-4 text-muted">{message}</p>;
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="space-y-2"><AlertBanner variant="error">{message}</AlertBanner>
    {retry && <Button variant="secondary" size="touch" onClick={retry}>Reintentar</Button>}
  </div>;
}

export function AlertBanner({ children, variant = "notice" }: { children: ReactNode; variant?: "notice" | "error" }) {
  return <div role={variant === "error" ? "alert" : "status"}
    className={variant === "error"
      ? "rounded-control border border-status-rejected bg-surface-elevated p-3 text-status-rejected"
      : "rounded-control border border-brand-accent bg-brand-tint p-4 text-primary"}>{children}</div>;
}

export function Toast({ message, variant = "notice", onDismiss }: {
  message: string; variant?: "notice" | "error"; onDismiss?: () => void;
}) {
  return <div className="flex flex-wrap items-start gap-2">
    <AlertBanner variant={variant}>{message}</AlertBanner>
    {onDismiss && <Button variant="secondary" onClick={onDismiss}>Descartar notificación</Button>}
  </div>;
}
