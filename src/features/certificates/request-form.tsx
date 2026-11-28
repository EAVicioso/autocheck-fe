"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/controls";
import { AlertBanner } from "@/components/ui/feedback";
import { requestCertificate } from "./actions";

export function CertificateRequestForm({ inspectionId }: { inspectionId: string }) {
  const [state, action, pending] = useActionState<{ message: string } | null>(requestCertificate.bind(null, inspectionId), null);
  return <form action={action} className="space-y-2">
    <Button size="touch" type="submit" disabled={pending}>{pending ? "Solicitando…" : "Solicitar certificado"}</Button>
    {state && <AlertBanner variant="error">{state.message}</AlertBanner>}
  </form>;
}
