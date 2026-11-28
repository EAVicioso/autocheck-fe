"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, LabeledControl, Textarea } from "@/components/ui/controls";
import { Modal } from "@/components/ui/dialog";
import { AlertBanner } from "@/components/ui/feedback";
import { CitizenRequestError, citizenRequest } from "@/features/payments/client";

export function CancelAppointment({ id, reschedule }: { id: string; reschedule: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"cancel" | "reschedule">();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [message, setMessage] = useState("");
  const running = useRef(false);
  const attempt = useRef<{ key: string; motivo: string } | undefined>(undefined);

  function finish() {
    attempt.current = undefined;
    setMode(undefined);
    if (mode === "reschedule") router.push(reschedule);
    else router.refresh();
  }

  async function checkStatus() {
    const result = await citizenRequest({ action: "appointment", id });
    if (result.estado === "CANCELADA") {
      finish();
      return true;
    }
    if (result.estado !== "CONFIRMADA" || Date.parse(result.inicioUtc) <= Date.now()) {
      setMode(undefined);
      router.refresh();
      return true;
    }
    return false;
  }

  async function cancel() {
    if (running.current || !reason.trim()) return;
    running.current = true;
    setPending(true);
    setMessage("");
    try {
      if (uncertain && await checkStatus()) return;
      attempt.current ??= { key: crypto.randomUUID(), motivo: reason.trim() };
      await citizenRequest({ action: "cancel", id, ...attempt.current });
      finish();
    } catch (error) {
      if (error instanceof CitizenRequestError && error.status === 401) {
        router.replace("/login?renovar=1");
      } else if (error instanceof CitizenRequestError && [400, 403, 404].includes(error.status)) {
        attempt.current = undefined;
        setUncertain(false);
        setMessage("No se pudo cancelar la cita.");
      } else {
        setUncertain(true);
        setMessage("No se pudo confirmar el resultado. Reintenta para consultar el estado antes de enviar la misma solicitud.");
        if (error instanceof CitizenRequestError && error.status === 409) {
          try {
            if (!await checkStatus()) setMessage("La cita tiene un conflicto con el estado vigente.");
          } catch { /* The next attempt reconciles before writing. */ }
        }
      }
    } finally {
      running.current = false;
      setPending(false);
    }
  }

  return <>
    <Button variant="danger" onClick={() => setMode("cancel")}>Cancelar cita</Button>
    <Button variant="secondary" onClick={() => setMode("reschedule")}>Cambiar horario</Button>
    <Modal open={Boolean(mode)} title={mode === "reschedule" ? "Cambiar horario" : "Cancelar cita"}
      onClose={() => { if (!running.current) setMode(undefined); }}>
      <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void cancel(); }}>
        {mode === "reschedule" && <p>Primero se cancelará esta cita. Luego podrás elegir y pagar otro horario.</p>}
        <LabeledControl label="Motivo de cancelación"><Textarea value={reason} disabled={pending || uncertain}
          maxLength={300} required onChange={(event) => setReason(event.target.value)} /></LabeledControl>
        {message && <AlertBanner variant="error">{message}</AlertBanner>}
        <Button type="submit" variant="danger" disabled={pending || !reason.trim()}>
          {pending ? "Consultando…" : uncertain ? "Reintentar cancelación" : "Confirmar cancelación"}
        </Button>
      </form>
    </Modal>
  </>;
}
