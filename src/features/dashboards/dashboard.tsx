import { Badge } from "@/components/ui/badge";
import { Button, DatePicker, Input, LabeledControl } from "@/components/ui/controls";
import { DataTable } from "@/components/ui/data-table";
import { AlertBanner } from "@/components/ui/feedback";
import { Card } from "@/components/ui/layout";
import { StatCard } from "@/components/ui/statistics";
import { sectionAccess } from "@/core/access";
import { pageSize, searchHref, type SearchParams } from "@/core/search";
import { sectionData, AdminSection } from "@/core/section-server";
import type { Alerta, FilaMetrica } from "@/shared/api/contract.generated";
import { dominicanDateTime } from "@/shared/dates/dominican";
import { parseReportFilters, reportFilters } from "./report-filters";
import { distinctAlertWindows, percentageLabel, rejectionLabel } from "./report-view-model";

const path = "/admin/reportes";

export function Dashboard({ search }: { search: Promise<SearchParams> }) {
  return <AdminSection title="Reportes de inspección" access={sectionAccess.reports} render={async ({ api, profile }) => {
    const parsed = parseReportFilters(await search, profile.centroId);
    const { pagina, paginaAlertas, ...filters } = parsed.data ?? reportFilters.parse({ centroId: profile.centroId ?? undefined });

    const fields = <Card>
      <form action={path} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <LabeledControl label="Desde"><DatePicker name="desde" defaultValue={filters.desde} required /></LabeledControl>
        <LabeledControl label="Hasta"><DatePicker name="hasta" defaultValue={filters.hasta} required /></LabeledControl>
        <LabeledControl label="ID del centro"><Input name="centroId" defaultValue={filters.centroId} maxLength={36}
          readOnly={profile.centroId !== null} /></LabeledControl>
        <LabeledControl label="ID de la rampa"><Input name="rampaId" defaultValue={filters.rampaId} maxLength={36} /></LabeledControl>
        <LabeledControl label="ID del inspector"><Input name="inspectorId" defaultValue={filters.inspectorId} maxLength={36} /></LabeledControl>
        <Button type="submit" size="touch" className="self-end">Aplicar filtros</Button>
      </form>
    </Card>;

    if (!parsed.success) return <>{fields}<AlertBanner variant="error">
      Usa identificadores válidos y un rango de hasta 366 días de diferencia.
    </AlertBanner></>;
    const query = { ...filters, tamano: pageSize };
    const [metrics, alerts] = await Promise.all([
      sectionData(api, "GET /api/reportes/inspecciones", { query: { ...query, pagina } }),
      sectionData(api, "GET /api/reportes/alertas", { query: { ...query, pagina: paginaAlertas } }),
    ]);

    return <>
      {fields}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Cerradas" closed={metrics.cerradas} value={metrics.cerradas} updatedAt={metrics.ultimaActualizacionUtc} />
        <StatCard title="Aprobadas" closed={metrics.cerradas} value={metrics.aprobadas} updatedAt={metrics.ultimaActualizacionUtc} />
        <StatCard title="Rechazadas" closed={metrics.cerradas} value={metrics.rechazadas} updatedAt={metrics.ultimaActualizacionUtc} />
        <StatCard title="Porcentaje de rechazo" closed={metrics.cerradas}
          value={rejectionLabel(metrics.cerradas, metrics.porcentajeRechazo)} updatedAt={metrics.ultimaActualizacionUtc} />
      </div>
      <Card>
        <h2 className="mb-3 text-lg font-semibold">Detalle diario</h2>
        <DataTable<FilaMetrica> caption="Detalle diario" columns={[
          { id: "day", heading: "Día", render: (row) => row.dia },
          { id: "center", heading: "Centro", render: (row) => row.centroId },
          { id: "ramp", heading: "Rampa", render: (row) => row.rampaId },
          { id: "inspector", heading: "Inspector", render: (row) => row.inspectorId },
          { id: "closed", heading: "Cerradas", render: (row) => row.cerradas },
          { id: "approved", heading: "Aprobadas", render: (row) => row.aprobadas },
          { id: "rejected", heading: "Rechazadas", render: (row) => row.rechazadas },
          { id: "percentage", heading: "Rechazo", render: (row) => rejectionLabel(row.cerradas, row.porcentajeRechazo) },
        ]} rowKey={(row) => [row.dia, row.centroId, row.rampaId, row.inspectorId].join(":")}
          state={{ status: "ready", rows: metrics.items, hasNext: pagina < 500000 && metrics.items.length === pageSize }}
          page={pagina} pageHref={(target) => searchHref(path, { ...filters, pagina: target, paginaAlertas })} />
      </Card>
      <Card>
        <h2 className="mb-3 text-lg font-semibold">Alertas preventivas</h2>
        <DataTable<Alerta> caption="Alertas preventivas" columns={[
          { id: "day", heading: "Día", render: (row) => row.fecha },
          { id: "center", heading: "Centro", render: (row) => row.centroId },
          { id: "inspector", heading: "Inspector", render: (row) => row.inspectorId },
          { id: "window", heading: "Período (Santo Domingo)", render: (row) => <>
            <time dateTime={row.desdeUtc}>{dominicanDateTime(row.desdeUtc)}</time>{" al "}
            <time dateTime={row.hastaUtc}>{dominicanDateTime(row.hastaUtc)}</time>
          </> },
          { id: "approved", heading: "Aprobadas", render: (row) => <div className="space-y-1">
            <p>{row.aprobadas} de {row.total}</p>
            <p>{percentageLabel(row.porcentaje)}</p>
            <Badge status="Anomalía preventiva" />
          </div> },
        ]} rowKey={(row) => row.id} updatedAt={alerts.ultimaActualizacionUtc}
          state={{ status: "ready", rows: distinctAlertWindows(alerts.items), hasNext: paginaAlertas < 500000 && alerts.items.length === pageSize }}
          page={paginaAlertas} pageHref={(target) => searchHref(path, { ...filters, pagina, paginaAlertas: target })} />
      </Card>
    </>;
  }} />;
}
