"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/controls";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { AlertBanner } from "@/components/ui/feedback";
import { Card } from "@/components/ui/layout";
import { dominicanDateTime } from "@/shared/dates/dominican";
import type { Cita, Pago } from "@/shared/api/contract.generated";
import { CitizenRequestError, citizenRequest } from "./client";
import { clearDraft } from "./draft";

const labels: Record<Pago["estado"], string> = {
  PENDIENTE: "Esperando el resultado del pago",
  APROBADO: "Pago aprobado",
  RECHAZADO: "Pago rechazado. Elige otro horario.",
  ERROR: "El pago simulado falló. Elige otro horario.",
  VENCIDO: "La retención venció. Elige otro horario.",
  ABANDONADO: "La retención fue liberada.",
  REVERTIDO: "El pago simulado fue revertido. Elige otro horario.",
};

export function PaymentStatus({ actor, initial }: { actor: string; initial: Pago }) {
  const router = useRouter();
  const [payment, setPayment] = useState(initial);
  const [appointment, setAppointment] = useState<Cita>();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [abandoning, setAbandoning] = useState(false);
  const [poll, setPoll] = useState(initial.estado === "PENDIENTE");
  const request = useRef<AbortController | undefined>(undefined);
  const expires = Date.parse(payment.expiraUtc);

  useEffect(() => () => { request.current?.abort(); }, []);

  async function reconcile(abandon = false) {
    if (request.current) {
      if (!abandon) return;
      request.current.abort();
    }
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setAbandoning(abandon);
    setMessage("");
    try {
      if (abandon) {
        try {
          await citizenRequest({ action: "abandon", id: payment.retencionId }, controller.signal);
        } catch (error) {
          if (!(error instanceof CitizenRequestError) || error.problem?.codigo !== "CITA_CONFIRMADA") throw error;
        }
      }
      const result = await citizenRequest({ action: "payment", id: payment.intentoId }, controller.signal);
      if (controller.signal.aborted) return;
      setPayment(result);
      if (result.estado !== "PENDIENTE") {
        setPoll(false);
        clearDraft(actor, { intentoId: result.intentoId });
      } else {
        setPoll(Date.now() < Date.parse(result.expiraUtc));
      }
      if (result.estado === "APROBADO" && result.citaId) {
        const detail = await citizenRequest({ action: "appointment", id: result.citaId }, controller.signal);
        if (!controller.signal.aborted) setAppointment(detail);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof CitizenRequestError && error.status === 401) {
        router.replace("/login?renovar=1");
        return;
      }
      if (abandon || Date.now() >= expires || error instanceof CitizenRequestError && error.status < 500) setPoll(false);
      setMessage(abandon ? "No se pudo confirmar el abandono. Consulta el estado antes de volver a intentarlo."
        : "No se pudo consultar el estado. Vuelve a intentarlo.");
    } finally {
      if (request.current === controller) {
        request.current = undefined;
        setBusy(false);
        setAbandoning(false);
      }
    }
  }

  const read = useEffectEvent(() => { void reconcile(); });
  useEffect(() => {
    if (initial.estado === "APROBADO") {
      const timer = setTimeout(() => read(), 0);
      return () => clearTimeout(timer);
    }
    if (initial.estado !== "PENDIENTE") clearDraft(actor, { intentoId: initial.intentoId });
  }, [actor, initial.estado, initial.intentoId]);

  useEffect(() => {
    if (!poll) return;
    const interval = setInterval(() => { if (Date.now() < expires) read(); }, 2000);
    const expiration = setTimeout(() => read(), Math.max(0, expires - Date.now()));
    return () => { clearInterval(interval); clearTimeout(expiration); };
  }, [expires, poll]);

  const pending = payment.estado === "PENDIENTE";
  const amount = new Intl.NumberFormat("es-DO", { style: "currency", currency: payment.moneda }).format(payment.monto);
  return <Card className="max-w-xl space-y-4 p-5">
    <AlertBanner variant="notice">{appointment
      ? appointment.estado === "CONFIRMADA" ? "Cita confirmada" : "El pago se aprobó. Consulta el estado actual de la cita."
      : labels[payment.estado]}</AlertBanner>
    <p>Monto simulado: {amount}</p>
    {pending && <CountdownTimer expiresAtUtc={payment.expiraUtc} />}
    {appointment && <p>{dominicanDateTime(appointment.inicioUtc)}</p>}
    {message && <AlertBanner variant="error">{message}</AlertBanner>}
    <div className="flex flex-wrap gap-2">
      {appointment ? <ButtonLink href={"/ciudadano/citas/" + appointment.id}>Ver cita</ButtonLink>
        : <Button variant="secondary" disabled={busy} onClick={() => void reconcile()}>Consultar estado</Button>}
      {pending && <Button variant="danger" disabled={abandoning} onClick={() => void reconcile(true)}>Abandonar retención</Button>}
      {!pending && payment.estado !== "APROBADO" && <ButtonLink href="/ciudadano/citas/nueva">Seleccionar otro horario</ButtonLink>}
      <ButtonLink href="/ciudadano/citas">Mis citas</ButtonLink>
    </div>
  </Card>;
}
