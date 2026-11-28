"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/controls";
import { PdfDownloadButton } from "@/components/ui/pdf-download-button";

export function PendingCertificate() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    // Six bounded reads. The server stops the poller when the status changes.
    const timers = Array.from({ length: 6 }, (_, index) => setTimeout(() => router.refresh(), (index + 1) * 5000));
    return () => timers.forEach(clearTimeout);
  }, [router]);
  return <Button variant="secondary" size="touch" disabled={pending}
    onClick={() => startTransition(() => router.refresh())}>
    {pending ? "Consultando…" : "Consultar estado"}
  </Button>;
}

export function DownloadCertificate({ id }: { id: string }) {
  return <PdfDownloadButton load={async (signal) => {
    const response = await fetch("/api/certificados/" + encodeURIComponent(id) + "/pdf", { cache: "no-store", signal });
    if (!response.ok) throw new Error("No se pudo descargar el certificado.");
    return { file: await response.blob(), filename: "certificado-" + id + ".pdf" };
  }} />;
}
