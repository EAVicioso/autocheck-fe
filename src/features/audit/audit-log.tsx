import { Button, DatePicker, Input, LabeledControl } from "@/components/ui/controls";
import { DataTable } from "@/components/ui/data-table";
import { AlertBanner } from "@/components/ui/feedback";
import { Card } from "@/components/ui/layout";
import { sectionAccess } from "@/core/access";
import { pageSize, searchHref, type SearchParams } from "@/core/search";
import { AdminSection, sectionData } from "@/core/section-server";
import type { Auditoria } from "@/shared/api/contract.generated";
import { dominicanDateTime } from "@/shared/dates/dominican";
import { auditDateBounds, auditFilters } from "./audit-filters";

const path = "/admin/auditoria";
type AuditRow = Pick<Auditoria, "id" | "actorId" | "fechaUtc" | "operacion" | "entidad" | "resultado" | "correlacion">;

export function AuditLog({ search }: { search: Promise<SearchParams> }) {
  return <AdminSection title="Auditoría" access={sectionAccess.audit} render={async ({ api }) => {
    const parsed = auditFilters.safeParse(await search);
    const { pagina, ...filters } = parsed.data ?? auditFilters.parse({});
    const { desde, hasta, operacion, entidad, actorId } = filters;
    const fields = <form action={path} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <LabeledControl label="Desde (Santo Domingo)"><DatePicker name="desde" defaultValue={desde} /></LabeledControl>
      <LabeledControl label="Hasta (Santo Domingo)"><DatePicker name="hasta" defaultValue={hasta} /></LabeledControl>
      <LabeledControl label="ID del actor"><Input name="actorId" maxLength={36} defaultValue={actorId} /></LabeledControl>
      <LabeledControl label="Operación"><Input name="operacion" maxLength={128} defaultValue={operacion} /></LabeledControl>
      <LabeledControl label="Entidad"><Input name="entidad" maxLength={256} defaultValue={entidad} /></LabeledControl>
      <Button type="submit" size="touch" className="self-end">Filtrar auditoría</Button>
    </form>;
    if (!parsed.success) return <Card>{fields}<AlertBanner variant="error">Revisa los identificadores y el rango de fechas.</AlertBanner></Card>;
    const log = await sectionData(api, "GET /api/auditorias", { query: {
      ...auditDateBounds(filters), operacion: operacion || undefined, entidad: entidad || undefined, actorId,
      pagina, tamano: pageSize, orden: "fechaUtc", direccion: "desc",
    } });
    const rows = log.items.map(({ id, actorId, fechaUtc, operacion, entidad, resultado, correlacion }) =>
      ({ id, actorId, fechaUtc, operacion, entidad, resultado, correlacion }));

    return <Card><DataTable<AuditRow> caption="Registro de auditoría" filters={fields} columns={[
      { id: "actor", heading: "Actor o proceso", render: (row) => row.actorId ?? "Proceso del sistema" },
      { id: "date", heading: "Fecha del servidor (Santo Domingo)", render: (row) => <time dateTime={row.fechaUtc}>{dominicanDateTime(row.fechaUtc)}</time> },
      { id: "operation", heading: "Operación", render: (row) => row.operacion },
      { id: "entity", heading: "Entidad", render: (row) => row.entidad },
      { id: "result", heading: "Resultado", render: (row) => row.resultado },
      { id: "correlation", heading: "Correlación", render: (row) => row.correlacion },
    ]} rowKey={(row) => row.id} state={{ status: "ready", rows,
      hasNext: pagina < 500000 && (log.siguienteCursor !== null || rows.length === pageSize) }}
      page={pagina} pageHref={(target) => searchHref(path, { ...filters, pagina: target })} /></Card>;
  }} />;
}
