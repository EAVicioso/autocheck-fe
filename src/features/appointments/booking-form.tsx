"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink, DatePicker, LabeledControl, RadioGroup, Select } from "@/components/ui/controls";
import { AlertBanner, EmptyState, LoadingSkeleton } from "@/components/ui/feedback";
import { Card } from "@/components/ui/layout";
import { useAvailabilityUpdates } from "@/features/availability/use-availability-updates";
import { CitizenRequestError, citizenRequest } from "@/features/payments/client";
import { clearDraft, newDraft, readDraft, storeDraft, type PaymentDraft } from "@/features/payments/draft";
import { dominicanDateTime } from "@/shared/dates/dominican";
import type { Bloque } from "@/shared/api/contract.generated";

const slotKey = (slot: Bloque) => slot.rampaId + "|" + slot.inicioUtc;

export function BookingForm({ actor, vehicles, centers, initialVehicle, previousInspection, today, emptyVehicles }: {
  actor: string;
  vehicles: { id: string; matricula: string }[];
  centers: { id: string; nombre: string }[];
  initialVehicle?: string;
  previousInspection?: string;
  today: string;
  emptyVehicles: ReactNode;
}) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState(vehicles.some(({ id }) => id === initialVehicle) ? initialVehicle ?? "" : "");
  const [center, setCenter] = useState("");
  const [date, setDate] = useState(today);
  const [draft, setDraft] = useState<PaymentDraft>();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const running = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => { setDraft(readDraft(actor)); setReady(true); }, 0);
    return () => clearTimeout(timer);
  }, [actor]);

  async function send(attempt: PaymentDraft) {
    if (running.current) return;
    running.current = true;
    setSubmitting(true);
    setMessage("");
    try {
      storeDraft(actor, attempt);
      setDraft(attempt);
      const result = await citizenRequest(attempt.command);
      const next = { ...attempt, intentoId: result.intentoId };
      setDraft(next);
      storeDraft(actor, next);
      router.push("/ciudadano/pagos/" + result.intentoId);
    } catch (error) {
      if (error instanceof CitizenRequestError && error.status === 401) {
        router.replace("/login?renovar=1");
      } else if (error instanceof CitizenRequestError && [400, 403, 404, 409].includes(error.status)) {
        clearDraft(actor, { key: attempt.command.key });
        setDraft(undefined);
        setMessage(error.problem?.codigo === "BLOQUE_NO_DISPONIBLE"
          ? "Ese horario ya no está libre. Selecciona otro." : "No se pudo iniciar el pago. Revisa la selección.");
      } else {
        setMessage("No se pudo confirmar el inicio. Reintenta el mismo envío.");
      }
    } finally {
      running.current = false;
      setSubmitting(false);
    }
  }

  if (!ready) return <LoadingSkeleton />;
  if (draft) return <Card className="space-y-3 p-5">
    <p>Tienes un intento de pago por consultar.</p>
    {message && <AlertBanner variant="error">{message}</AlertBanner>}
    {draft.intentoId ? <ButtonLink href={"/ciudadano/pagos/" + draft.intentoId}>Consultar pago</ButtonLink>
      : <Button disabled={submitting} onClick={() => void send(draft)}>Reintentar el mismo envío</Button>}
  </Card>;
  if (!vehicles.length) return emptyVehicles;
  if (!centers.length) return <EmptyState message="No hay centros activos disponibles." />;

  return <Card className="space-y-4 p-5">
    {previousInspection && <p>Reinspección</p>}
    <LabeledControl label="Vehículo"><Select value={vehicle} disabled={Boolean(previousInspection) || submitting}
      onChange={(event) => setVehicle(event.target.value)}>
      <option value="">Selecciona un vehículo</option>
      {vehicles.map(({ id, matricula }) => <option value={id} key={id}>{matricula}</option>)}
    </Select></LabeledControl>
    {vehicle && <LabeledControl label="Centro"><Select value={center} disabled={submitting} onChange={(event) => setCenter(event.target.value)}>
      <option value="">Selecciona un centro</option>
      {centers.map(({ id, nombre }) => <option value={id} key={id}>{nombre}</option>)}
    </Select></LabeledControl>}
    {center && vehicle && <LabeledControl label="Fecha de la cita"><DatePicker min={today} value={date} disabled={submitting}
      onChange={(event) => setDate(event.target.value)} /></LabeledControl>}
    {message && <AlertBanner variant="error">{message}</AlertBanner>}
    {center && vehicle && date >= today && <Slots key={vehicle + "|" + center + "|" + date} center={center} date={date}
      vehicleLabel={vehicles.find(({ id }) => id === vehicle)?.matricula ?? ""}
      centerLabel={centers.find(({ id }) => id === center)?.nombre ?? ""}
      submitting={submitting}
      onStart={(slot) => void send(newDraft({
        vehiculoId: vehicle, centroId: center, rampaId: slot.rampaId, inicioUtc: slot.inicioUtc,
        ...(previousInspection ? { inspeccionAnteriorId: previousInspection } : {}),
      }))} />}
  </Card>;
}

function Slots({ center, date, vehicleLabel, centerLabel, submitting, onStart }: {
  center: string; date: string; vehicleLabel: string; centerLabel: string; submitting: boolean; onStart(slot: Bloque): void;
}) {
  const [blocks, setBlocks] = useState<Bloque[]>();
  const [selected, setSelected] = useState("");
  const [review, setReview] = useState(false);
  const [invalidated, setInvalidated] = useState(false);
  const [error, setError] = useState(false);
  useAvailabilityUpdates({
    centroId: center, fecha: date,
    onSnapshot: ({ bloques }) => {
      setBlocks(bloques);
      setError(false);
      if (selected && !bloques.some((slot) => slotKey(slot) === selected && slot.estado === "LIBRE")) {
        setSelected("");
        setReview(false);
        setInvalidated(true);
      }
    },
    onError: () => { setError(true); },
  });

  const slot = blocks?.find((candidate) => slotKey(candidate) === selected && candidate.estado === "LIBRE");
  const ramps = [...new Set(blocks?.map(({ rampaId }) => rampaId))].sort();
  const label = (block: Bloque) => dominicanDateTime(block.inicioUtc) + " · Rampa " + (ramps.indexOf(block.rampaId) + 1);

  if (error) return <AlertBanner variant="error">No se pudo actualizar la disponibilidad. Se volverá a consultar automáticamente.</AlertBanner>;
  if (!blocks) return <LoadingSkeleton label="Consultando disponibilidad…" />;
  if (!blocks.length) return <EmptyState message="No hay horarios para esta fecha." />;

  if (review && slot) return <section className="space-y-3" aria-label="Revisión de la reserva">
    <h2 className="font-semibold">Revisa tu cita</h2>
    <p>{vehicleLabel} · {centerLabel} · {label(slot)}</p>
    <Button variant="secondary" disabled={submitting} onClick={() => setReview(false)}>Cambiar horario</Button>{" "}
    <Button disabled={submitting} onClick={() => onStart(slot)}>Iniciar pago simulado</Button>
  </section>;

  return <div className="space-y-3">
    {invalidated && <AlertBanner variant="notice">El horario seleccionado dejó de estar disponible.</AlertBanner>}
    <RadioGroup legend="Horario en Santo Domingo" name="horario" value={selected} onChange={(value) => {
      setSelected(value); setInvalidated(false);
    }} options={blocks.map((entry) => ({
      value: slotKey(entry), label: label(entry) + " · " + ({ LIBRE: "Libre", RETENIDO: "Retenido", CONFIRMADO: "Ocupado" })[entry.estado],
      disabled: entry.estado !== "LIBRE",
    }))} />
    <Button disabled={!slot} onClick={() => setReview(true)}>Revisar reserva</Button>
  </div>;
}
