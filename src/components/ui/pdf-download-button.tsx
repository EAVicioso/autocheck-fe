"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./controls";
import { ErrorState } from "./feedback";

export function PdfDownloadButton({ load }: {
  load(signal: AbortSignal): Promise<{ file: Blob; filename: string }>;
}) {
  const request = useRef<AbortController | null>(null);
  const [state, setState] = useState<"ready" | "loading" | "error">("ready");
  useEffect(() => () => request.current?.abort(), []);

  async function download() {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setState("loading");
    try {
      const { file, filename } = await load(controller.signal);
      if (controller.signal.aborted) return;
      if (file.type !== "application/pdf") throw new Error("Formato inesperado.");
      const url = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setState("ready");
    } catch {
      if (!controller.signal.aborted) setState("error");
    } finally {
      request.current = null;
    }
  }

  return state === "error" ? <ErrorState message="No se pudo descargar el PDF." retry={() => void download()} />
    : <Button size="touch" disabled={state === "loading"} onClick={() => void download()}>
      {state === "loading" ? "Descargando PDF…" : "Descargar PDF"}
    </Button>;
}
