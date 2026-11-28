"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/controls";
import { AlertBanner } from "@/components/ui/feedback";
import { startInspection } from "./actions";

export function StartInspectionForm({ appointmentId }: { appointmentId: string }) {
  const [state, action, pending] = useActionState<{ message: string } | null>(startInspection.bind(null, appointmentId), null);
  return <form action={action} className="space-y-2">
    <Button size="touch" disabled={pending} type="submit">{pending ? "Iniciando…" : "Iniciar inspección"}</Button>
    {state && <AlertBanner variant="error">{state.message}</AlertBanner>}
  </form>;
}
