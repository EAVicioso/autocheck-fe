"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { askAssistance } from "@/features/assistance/client";
import { assistanceFallback, assistanceSchema } from "@/features/assistance/contract";
import { Button, Textarea } from "./controls";
import { ErrorState } from "./feedback";
import { FormField } from "./form-field";

export function ChatbotWidget({ onUnauthorized, send = askAssistance }: {
  onUnauthorized(): void;
  send?: typeof askAssistance;
}) {
  const { control, handleSubmit, formState, reset } = useForm({
    resolver: zodResolver(assistanceSchema), defaultValues: { consulta: "" },
  });
  const activeRequest = useRef<AbortController | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; unavailable: boolean } | null>(null);
  useEffect(() => () => activeRequest.current?.abort(), []);

  function submit(event: SubmitEvent<HTMLFormElement>) {
    return handleSubmit(async (input) => {
      if (activeRequest.current) return;
      const controller = new AbortController();
      activeRequest.current = controller;
      setFeedback(null);
      try {
        const result = await send(input, controller.signal);
        if (controller.signal.aborted) return;
        if (result.status === 401) {
          onUnauthorized();
          return;
        }
        const unavailable = result.source === "local-timeout" || result.status === 503;
        setFeedback({
          message: unavailable ? assistanceFallback.respuesta : result.reply?.respuesta ?? "No se pudo procesar la solicitud.",
          unavailable,
        });
        if (result.status === 200) reset();
      } catch {
        if (!controller.signal.aborted) setFeedback({ message: "No se pudo procesar la solicitud.", unavailable: false });
      } finally {
        activeRequest.current = null;
      }
    })(event);
  }

  return <form method="post" noValidate onSubmit={submit} className="space-y-3">
    <FormField control={control} name="consulta" label="Consulta">{(field) => <Textarea {...field} rows={2} />}</FormField>
    <Button type="submit" size="touch" disabled={formState.isSubmitting}>
      {feedback?.unavailable ? "Reintentar consulta" : "Enviar consulta"}
    </Button>
    {feedback && (feedback.unavailable ? <ErrorState message={feedback.message} /> : <p role="status">{feedback.message}</p>)}
  </form>;
}
