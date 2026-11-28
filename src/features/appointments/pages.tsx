import { notFound } from "next/navigation";
import { z } from "zod";
import { Button, ButtonLink, DatePicker, LabeledControl, Select } from "@/components/ui/controls";
import { DataTable } from "@/components/ui/data-table";
import { AlertBanner } from "@/components/ui/feedback";
import { Card } from "@/components/ui/layout";
import { optionalDay, pageNumber, pageSize, searchHref, uuid, type SearchParams } from "@/core/search";
import { SectionApiError, sectionData } from "@/core/section-server";
import { CitizenPage, type citizenContext } from "@/features/citizen/server";
import { dominicanDateTime } from "@/shared/dates/dominican";
import type { EstadoCita } from "@/shared/api/contract.generated";
import { CancelAppointment } from "./cancel";

const path = "/ciudadano/citas";
const statuses = ["CONFIRMADA", "CANCELADA", "EN_INSPECCION", "COMPLETADA"] as const;
const labels: Record<EstadoCita, string> = {
  CONFIRMADA: "Confirmada", CANCELADA: "Cancelada", EN_INSPECCION: "En inspección", COMPLETADA: "Completada",
};

const filtersSchema = z.object({
  desde: optionalDay, hasta: optionalDay,
  estado: z.preprocess((value) => value === "" ? undefined : value, z.enum(statuses).optional()),
  pagina: pageNumber,
}).refine(({ desde, hasta }) => hasta !== "9999-12-31" && !(desde && hasta && desde > hasta));

export function AppointmentsPage({ query }: { query: SearchParams }) {
  return <CitizenPage title="Mis citas" render={async ({ api }) => {
    const parsed = filtersSchema.safeParse(query);
    if (!parsed.success) return <><AlertBanner variant="error">Revisa el rango de fechas o el estado.</AlertBanner>
      <ButtonLink href={path}>Limpiar filtros</ButtonLink></>;
    const { pagina, desde, hasta, estado } = parsed.data;
    const { items } = await sectionData(api, "GET /api/citas", { query: { pagina, tamano: pageSize, desde, hasta, estado } });
    const centers = new Map(await Promise.all([...new Set(items.map(({ centroId }) => centroId))].map(async (id) =>
      [id, await centerInfo(api, id)] as const)));

    return <><ButtonLink href={path + "/nueva"}>Agendar cita</ButtonLink>
      <DataTable caption="Citas del ciudadano" page={pagina} pageHref={(next) => searchHref(path, { desde, hasta, estado, pagina: next })}
        state={{ status: "ready", rows: items, hasNext: items.length === pageSize && pagina < 500000 }}
        filters={<form action={path} className="flex flex-wrap items-end gap-3">
          <LabeledControl label="Desde"><DatePicker name="desde" defaultValue={desde} /></LabeledControl>
          <LabeledControl label="Hasta"><DatePicker name="hasta" defaultValue={hasta} /></LabeledControl>
          <LabeledControl label="Estado"><Select name="estado" defaultValue={estado ?? ""}>
            <option value="">Todos</option>{statuses.map((value) => <option key={value} value={value}>{labels[value]}</option>)}
          </Select></LabeledControl>
          <Button type="submit">Filtrar</Button><ButtonLink href={path}>Limpiar filtros</ButtonLink>
        </form>}
        rowKey={(row) => row.id} columns={[
          { id: "fecha", heading: "Fecha y hora", render: (row) => dominicanDateTime(row.inicioUtc) },
          { id: "centro", heading: "Centro", render: (row) => centers.get(row.centroId)?.centro.nombre ?? "Centro no disponible" },
          { id: "estado", heading: "Estado", render: (row) => labels[row.estado] },
          { id: "detalle", heading: "Detalle", render: (row) => <ButtonLink href={path + "/" + row.id}>Ver cita</ButtonLink> },
        ]} />
    </>;
  }} />;
}

type Api = Awaited<ReturnType<typeof citizenContext>>["api"];

function optionalResource<T>(request: Promise<T>) {
  return request.catch((error: unknown) => {
    if (error instanceof SectionApiError && [403, 404].includes(error.status)) return null;
    throw error;
  });
}

function centerInfo(api: Api, id: string) {
  return optionalResource(sectionData(api, "GET /api/centros/{id}", { params: { id } }));
}

function canCancel(estado: EstadoCita, inicioUtc: string) {
  return estado === "CONFIRMADA" && Date.parse(inicioUtc) > Date.now();
}

export function AppointmentPage({ id }: { id: string }) {
  if (!uuid.safeParse(id).success) notFound();
  return <CitizenPage title="Detalle de la cita" render={async ({ api }) => {
    const appointment = await sectionData(api, "GET /api/citas/{id}", { params: { id } });
    const [center, vehicle] = await Promise.all([
      centerInfo(api, appointment.centroId),
      optionalResource(sectionData(api, "GET /api/vehiculos/{id}", { params: { id: appointment.vehiculoId } })),
    ]);
    const reschedule = searchHref(path + "/nueva", {
      vehiculo: vehicle?.id, inspeccionAnteriorId: vehicle ? appointment.inspeccionAnteriorId ?? undefined : undefined,
    });
    return <Card className="max-w-xl space-y-4 p-5">
      <dl className="space-y-3">
        <div><dt className="font-semibold">Estado</dt><dd>{labels[appointment.estado]}</dd></div>
        <div><dt className="font-semibold">Hora de Santo Domingo</dt><dd>{dominicanDateTime(appointment.inicioUtc)}</dd></div>
        <div><dt className="font-semibold">Centro</dt><dd>{center?.centro.nombre ?? "Centro no disponible"}</dd>
          {center && <dd>{center.centro.direccion}</dd>}</div>
        <div><dt className="font-semibold">Rampa</dt><dd>{center?.rampas.find((ramp) => ramp.id === appointment.rampaId)?.nombre ?? "Rampa no disponible"}</dd></div>
        <div><dt className="font-semibold">Vehículo</dt><dd>{vehicle?.matricula ?? "Vehículo no disponible"}</dd></div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href={path}>Mis citas</ButtonLink>
        {canCancel(appointment.estado, appointment.inicioUtc)
          && <CancelAppointment id={appointment.id} reschedule={reschedule} />}
        {appointment.estado === "CANCELADA" && <ButtonLink href={reschedule}>Reservar otro horario</ButtonLink>}
      </div>
    </Card>;
  }} />;
}
