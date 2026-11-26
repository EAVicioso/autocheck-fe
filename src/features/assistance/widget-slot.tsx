"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSession } from "@/features/identity/session-context";
import { askAssistance } from "./client";
import { assistanceSchema } from "./contract";

function AssistanceForm() {
  const { register, handleSubmit, formState, reset } = useForm({
    resolver: zodResolver(assistanceSchema), defaultValues: { consulta: "" },
  });
  const { clear } = useSession();
  const activeRequest = useRef<AbortController | null>(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => () => activeRequest.current?.abort(), []);

  function submit(event: SubmitEvent<HTMLFormElement>) {
    return handleSubmit(async (input) => {
      if (activeRequest.current) return;
      const controller = new AbortController();
      activeRequest.current = controller;
      setFeedback("");
      try {
        const result = await askAssistance(input, controller.signal);
        if (result.status === 401) {
          clear();
          return;
        }
        setFeedback(result.reply?.respuesta ?? "No se pudo procesar la solicitud.");
        if (result.status === 200) reset();
      } catch {
        if (!controller.signal.aborted) setFeedback("No se pudo procesar la solicitud.");
      } finally {
        activeRequest.current = null;
      }
    })(event);
  }

  return (
    <form noValidate onSubmit={submit}>
      <label htmlFor="consulta-asistencia">Consulta</label>{" "}
      <textarea id="consulta-asistencia" {...register("consulta")} rows={2}
        aria-invalid={Boolean(formState.errors.consulta)}
        aria-describedby={formState.errors.consulta ? "consulta-asistencia-error" : undefined} />
      {formState.errors.consulta && <p id="consulta-asistencia-error">{formState.errors.consulta.message}</p>}
      <button type="submit" disabled={formState.isSubmitting}>Enviar consulta</button>
      {feedback && <p role="status">{feedback}</p>}
    </form>
  );
}

export function AssistanceSlot() {
  const session = useSession();
  return (
    <aside aria-label="Asistencia" id="asistencia">
      {session.status === "active" && <AssistanceForm key={session.profile.id} />}
    </aside>
  );
}
