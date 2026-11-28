import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, PageHeader, PortalNavigation } from "@/components/ui/layout";
import { AlertBanner, EmptyState } from "@/components/ui/feedback";
import { requireRole } from "@/features/identity/guards";
import { dominicanDateTime } from "@/shared/dates/dominican";
import { portalError, portalRequest } from "./backend";
import { StartInspectionForm } from "./start-form";

const size = 20;
const queue = "/inspector";

function PageLinks({ page, next, tab }: { page: number; next: boolean; tab: string }) {
  return <nav aria-label="Páginas de inspección" className="flex flex-wrap gap-4">
    {page > 1 && <Link href={{ pathname: queue, query: { vista: tab, pagina: page - 1 } }}>Anterior</Link>}
    {next && page < 500_000 && <Link href={{ pathname: queue, query: { vista: tab, pagina: page + 1 } }}>Siguiente</Link>}
  </nav>;
}

export async function InspectionQueue({ searchParams }: Pick<PageProps<"/inspector">, "searchParams">) {
  const profile = await requireRole("Inspector");
  if (!profile) return <AlertBanner variant="error">No se pudo validar la sesión.</AlertBanner>;
  const { vista, pagina } = await searchParams;
  const tab = vista === "abiertas" ? "abiertas" : vista === "cerradas" ? "cerradas" : "citas";
  const page = typeof pagina === "string" && /^[1-9]\d{0,5}$/.test(pagina) ? Math.min(Number(pagina), 500_000) : 1;
  const paging = { pagina: page, tamano: size };

  return <>
    <PageHeader title="Área de inspección" description="Consulta tus citas asignadas y revisa las inspecciones." />
    <PortalNavigation horizontal label="Estado de trabajo" items={[
      { href: queue, label: "Citas confirmadas", current: tab === "citas" },
      { href: queue + "?vista=abiertas", label: "Abiertas", current: tab === "abiertas" },
      { href: queue + "?vista=cerradas", label: "Cerradas", current: tab === "cerradas" },
    ]} />
    {tab === "citas" ? <AssignedAppointments paging={paging} /> : <InspectionList paging={paging} tab={tab} />}
  </>;
}

type Paging = { pagina: number; tamano: number };

async function AssignedAppointments({ paging }: { paging: Paging }) {
  const result = await portalRequest("GET /api/citas", { query: { ...paging, estado: "CONFIRMADA" } });
  if (!result?.ok) return <AlertBanner variant="error">{portalError(result)}</AlertBanner>;
  const { items } = result.body;
  return <>
    {items.length === 0 && <EmptyState message="No hay citas confirmadas en esta página." />}
    <ul className="grid gap-4 sm:grid-cols-2">{items.map((appointment) => <li key={appointment.id}><Card className="h-full space-y-4 border-s-4 border-s-brand-accent">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="font-semibold"><time dateTime={appointment.inicioUtc}>{dominicanDateTime(appointment.inicioUtc)}</time></h2>
        <Badge status="CONFIRMADO" />
      </div>
      <p className="text-sm text-muted">Cita {appointment.id}</p>
      <StartInspectionForm appointmentId={appointment.id} />
    </Card></li>)}</ul>
    <PageLinks page={paging.pagina} next={items.length === size} tab="citas" />
  </>;
}

async function InspectionList({ paging, tab }: { paging: Paging; tab: "abiertas" | "cerradas" }) {
  const result = await portalRequest("GET /api/inspecciones", {
    query: { ...paging, estado: tab === "abiertas" ? "ABIERTA" : "CERRADA" },
  });
  if (!result?.ok) return <AlertBanner variant="error">{portalError(result)}</AlertBanner>;
  const { items } = result.body;
  return <>
    {items.length === 0 && <EmptyState message="No hay inspecciones en esta página." />}
    <ul className="grid gap-4 sm:grid-cols-2">{items.map((inspection) => <li key={inspection.id}><Card className="space-y-2">
      <h2 className="font-semibold">{dominicanDateTime(inspection.inicioUtc)}</h2>
      {inspection.resultado ? <Badge status={inspection.resultado} /> : <p>En curso</p>}
      <Link className="inline-flex min-h-11 items-center underline" href={"/inspector/inspecciones/" + inspection.id}>
        {inspection.estado === "ABIERTA" ? "Continuar inspección" : "Ver resultado"}
      </Link>
    </Card></li>)}</ul>
    <PageLinks page={paging.pagina} next={items.length === size} tab={tab} />
  </>;
}
