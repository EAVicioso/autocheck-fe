import { Input, LabeledControl } from "@/components/ui/controls";
import { DataTable } from "@/components/ui/data-table";
import { Card } from "@/components/ui/layout";
import { sectionAccess } from "@/core/access";
import { pageNumber, pageSize, searchHref, type SearchParams } from "@/core/search";
import { AdminSection, sectionData } from "@/core/section-server";
import type { Regla } from "@/shared/api/contract.generated";
import { dominicanDateTime } from "@/shared/dates/dominican";
import { saveRule } from "./actions";
import { AdminForm } from "./forms";

export function Rules({ search }: { search: Promise<SearchParams> }) {
  return <AdminSection title="Reglas de inspección" access={sectionAccess.rules} render={async ({ api }) => {
    const pagina = pageNumber.parse((await search).pagina);
    const rules = await sectionData(api, "GET /api/configuracion/reglas-inspeccion", { query: { pagina, tamano: pageSize } });
    return <>
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Máximo de defectos leves (M)</h2>
        <p className="text-muted">Cada versión se aplica a las inspecciones que se inicien a partir de su vigencia.</p>
        <AdminForm action={saveRule} label="Registrar versión">
          <LabeledControl label="Nuevo M"><Input name="m" type="number" min={0} step={1} max={2147483647} required /></LabeledControl>
          <LabeledControl label="Vigencia (Santo Domingo)"><Input name="vigencia" type="datetime-local" required /></LabeledControl>
        </AdminForm>
      </Card>
      <Card><DataTable<Regla> caption="Versiones de M" columns={[
        { id: "version", heading: "Versión", render: (rule) => rule.version },
        { id: "max", heading: "M", render: (rule) => rule.m },
        { id: "date", heading: "Vigencia (Santo Domingo)", render: (rule) => <time dateTime={rule.vigenciaUtc}>{dominicanDateTime(rule.vigenciaUtc)}</time> },
      ]} rowKey={(rule) => rule.id} state={{ status: "ready", rows: rules.items, hasNext: pagina < 500000 && rules.items.length === pageSize }}
        page={pagina} pageHref={(value) => searchHref("/admin/reglas", { pagina: value })} /></Card>
    </>;
  }} />;
}
