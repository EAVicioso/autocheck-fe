import { cn } from "./classes";

const statuses = {
  LIBRE: "text-status-approved",
  RETENIDO: "text-status-pending",
  CONFIRMADO: "text-brand-primary",
  Aprobado: "text-status-approved",
  Rechazado: "text-status-rejected",
} as const;

export function Badge({ status }: { status: keyof typeof statuses }) {
  return <span className={cn("inline-flex rounded-control border border-current px-2 py-1 text-sm font-semibold", statuses[status])}>
    {status}
  </span>;
}
