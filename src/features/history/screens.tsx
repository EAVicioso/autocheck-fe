import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertBanner, EmptyState } from "@/components/ui/feedback";
import { Card, PageHeader, PortalNavigation } from "@/components/ui/layout";
import { requireRole } from "@/features/identity/guards";
import { portalError, portalRequest } from "@/features/inspections/backend";
import { inspectionIdSchema } from "@/features/inspections/defects";
import { InspectionCounts } from "@/features/inspections/summary";
import { CertificateRequestForm } from "@/features/certificates/request-form";
import { dominicanDateTime } from "@/shared/dates/dominican";

const historyPath = "/ciudadano/historial";
const inspectionPath = "/ciudadano/inspecciones/";
const pageSize = 20;
const linkStyle = "inline-flex min-h-11 items-center underline";

function pageNumber(value: string | string[] | undefined) {
  return typeof value === "string" && /^[1-9]\d{0,5}$/.test(value) ? Math.min(Number(value), 500_000) : 1;
}

export async function VehicleHistoryIndex({ searchParams }: Pick<PageProps<"/ciudadano/historial">, "searchParams">) {
  if (!await requireRole("Ciudadano")) return <AlertBanner variant="error">No se pudo validar la sesión.</AlertBanner>;
  const page = pageNumber((await searchParams).pagina);
  const response = await portalRequest("GET /api/vehiculos", {
    query: { pagina: page, tamano: pageSize, orden: "matricula", incluirArchivados: true },
  });
  if (!response?.ok) return <AlertBanner variant="error">{portalError(response)}</AlertBanner>;
  const { items } = response.body;
  return <>
    <PageHeader title="Historial vehicular" description="Selecciona un vehículo para consultar sus inspecciones." />
    {items.length ? <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((vehicle) => <li key={vehicle.id}><Card>
        <Link className={linkStyle} href={historyPath + "/" + vehicle.id}>{vehicle.matricula}</Link>
        {vehicle.archivadoUtc && <p className="text-sm text-muted">Vehículo archivado</p>}
      </Card></li>)}
    </ul> : <EmptyState message="No hay vehículos en esta página." />}
    <nav aria-label="Páginas de vehículos" className="flex gap-4">
      {page > 1 && <Link href={historyPath + "?pagina=" + (page - 1)}>Anterior</Link>}
      {items.length === pageSize && page < 500_000 && <Link href={historyPath + "?pagina=" + (page + 1)}>Siguiente</Link>}
    </nav>
  </>;
}

export async function VehicleHistory({ params, searchParams }: PageProps<"/ciudadano/historial/[id]">) {
  const [{ id }, { cursor, resultado }] = await Promise.all([params, searchParams]);
  if (!inspectionIdSchema.safeParse(id).success) notFound();
  if (!await requireRole("Ciudadano")) return <AlertBanner variant="error">No se pudo validar la sesión.</AlertBanner>;
  const filter = resultado === "Aprobado" || resultado === "Rechazado" ? resultado : undefined;
  const marker = typeof cursor === "string" && cursor.length <= 1024 ? cursor : undefined;
  const path = historyPath + "/" + id;
  const response = await portalRequest("GET /api/vehiculos/{id}/historial", {
    params: { id },
    query: { cursor: marker, resultado: filter, tamano: pageSize },
  });
  return <>
    <Link className={linkStyle} href={historyPath}>Volver a vehículos</Link>
    <PageHeader title="Inspecciones del vehículo" />
    <PortalNavigation horizontal label="Resultado de inspección" items={[
      { href: path, label: "Todas", current: !filter },
      { href: path + "?resultado=Aprobado", label: "Aprobadas", current: filter === "Aprobado" },
      { href: path + "?resultado=Rechazado", label: "Rechazadas", current: filter === "Rechazado" },
    ]} />
    {response?.ok ? <>
      {response.body.items.length === 0 && <EmptyState message="No hay inspecciones cerradas para este filtro." />}
      <ul className="grid gap-4 sm:grid-cols-2">{response.body.items.map((inspection) => <li key={inspection.id}>
        <Card className="space-y-2">
          <h2 className="font-semibold">{inspection.resultado ?? "Resultado pendiente"}</h2>
          <p>{inspection.cierreUtc ? dominicanDateTime(inspection.cierreUtc) : "Fecha de cierre no disponible"}</p>
          <InspectionCounts {...inspection} />
          <Link className={linkStyle} href={inspectionPath + inspection.id}>Ver detalle</Link>
        </Card>
      </li>)}</ul>
      {response.body.siguienteCursor && <Link className={linkStyle} href={{
        pathname: path, query: { cursor: response.body.siguienteCursor, resultado: filter },
      }}>Siguiente página</Link>}
    </> : <AlertBanner variant="error">{portalError(response)}</AlertBanner>}
  </>;
}

export async function CitizenInspection({ params, searchParams }: PageProps<"/ciudadano/inspecciones/[id]">) {
  const [{ id }, { pagina }] = await Promise.all([params, searchParams]);
  if (!inspectionIdSchema.safeParse(id).success) notFound();
  if (!await requireRole("Ciudadano")) return <AlertBanner variant="error">No se pudo validar la sesión.</AlertBanner>;
  const response = await portalRequest("GET /api/inspecciones/{id}", { params: { id } });
  if (!response?.ok) return <AlertBanner variant="error">{portalError(response)}</AlertBanner>;
  const inspection = response.body;
  const page = pageNumber(pagina);
  const related = await portalRequest("GET /api/inspecciones/{id}/reinspecciones", {
    params: { id }, query: { pagina: page, tamano: pageSize },
  });
  return <>
    <Link className={linkStyle} href={historyPath + "/" + inspection.vehiculoId}>Volver al historial</Link>
    <PageHeader title="Resultado de inspección" />
    <Card className="space-y-3">
      <h2 className="text-xl font-semibold">{inspection.resultado ?? "En curso"}</h2>
      {inspection.cierreUtc && <p>Cierre {dominicanDateTime(inspection.cierreUtc)}</p>}
      <p>Reglas de inspección {inspection.versionReglas}</p>
      <InspectionCounts {...inspection} />
      {inspection.defectos?.length ? <ul className="list-disc space-y-1 pl-5">{inspection.defectos.map((defect, index) =>
        <li key={index}>{defect.descripcion} · {defect.severidad} · {defect.cantidad}</li>,
      )}</ul> : inspection.defectos && <p>Sin defectos registrados.</p>}
      {inspection.estado === "CERRADA" && inspection.resultado === "Aprobado" && <CertificateRequestForm inspectionId={id} />}
      {inspection.inspeccionAnteriorId && <Link className={linkStyle} href={inspectionPath + inspection.inspeccionAnteriorId}>
        Ver inspección anterior
      </Link>}
    </Card>
    <Card className="space-y-2">
      <h2 className="font-semibold">Reinspecciones vinculadas</h2>
      {related?.ok ? <>
        {related.body.items.length ? <ul>{related.body.items.map((item) => <li key={item.id}>
          <Link className={linkStyle} href={inspectionPath + item.id}>
            {dominicanDateTime(item.inicioUtc)} · {item.resultado ?? "En curso"}
          </Link>
        </li>)}</ul> : <EmptyState message="No hay reinspecciones vinculadas en esta página." />}
        <nav aria-label="Páginas de reinspecciones" className="flex flex-wrap gap-4">
          {page > 1 && <Link href={inspectionPath + id + "?pagina=" + (page - 1)}>Anterior</Link>}
          {related.body.items.length === pageSize && page < 500_000 &&
            <Link href={inspectionPath + id + "?pagina=" + (page + 1)}>Siguiente</Link>}
        </nav>
      </> : <AlertBanner variant="error">{portalError(related)}</AlertBanner>}
    </Card>
  </>;
}
