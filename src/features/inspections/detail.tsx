import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertBanner } from "@/components/ui/feedback";
import { Card, PageHeader } from "@/components/ui/layout";
import { requireRole } from "@/features/identity/guards";
import type { CatalogoItem, CatalogoTipo } from "@/shared/api/contract.generated";
import { portalError, portalRequest } from "./backend";
import { inspectionIdSchema } from "./defects";
import { InspectionEditor } from "./editor";
import { InspectionCounts } from "./summary";

async function loadCatalog(tipo: CatalogoTipo) {
  const items: CatalogoItem[] = [];
  for (let pagina = 1; ; pagina++) {
    const result = await portalRequest("GET /api/catalogos/{tipo}", { params: { tipo }, query: { pagina, tamano: 20 } });
    if (!result?.ok) return { message: portalError(result) };
    items.push(...result.body.items);
    if (result.body.items.length < 20) return { items };
  }
}

export async function InspectionDetail({ params }: Pick<PageProps<"/inspector/inspecciones/[id]">, "params">) {
  const { id } = await params;
  if (!inspectionIdSchema.safeParse(id).success) notFound();
  if (!await requireRole("Inspector")) return <AlertBanner variant="error">No se pudo validar la sesión.</AlertBanner>;
  const result = await portalRequest("GET /api/inspecciones/{id}", { params: { id } });
  if (!result?.ok) return <AlertBanner variant="error">{portalError(result)}</AlertBanner>;
  const inspection = result.body;
  const header = <>
    <Link className="inline-flex min-h-11 items-center underline" href="/inspector">Volver a inspecciones</Link>
    <PageHeader title="Detalle de inspección" />
  </>;
  if (inspection.estado === "CERRADA") return <>{header}<Card className="space-y-3">
    <h2 className="text-xl font-semibold">{inspection.resultado}</h2>
    <p>Reglas {inspection.versionReglas}</p>
    <InspectionCounts {...inspection} />
    {inspection.defectos?.length ? <ul className="list-disc space-y-1 pl-5">{inspection.defectos.map((defect, index) =>
      <li key={index}>{defect.descripcion} · {defect.severidad} · {defect.cantidad}</li>,
    )}</ul> : <p>Sin defectos registrados.</p>}
  </Card></>;
  const [categories, subcategories] = await Promise.all([
    loadCatalog("defectos-categorias-v1"), loadCatalog("defectos-subcategorias-v1"),
  ]);
  if ("message" in categories || "message" in subcategories) return <>{header}
    <AlertBanner variant="error">No se pudo cargar el catálogo de defectos. Actualiza la página e inténtalo de nuevo.</AlertBanner>
  </>;
  return <>{header}
    <InspectionEditor key={inspection.id + ":" + inspection.version} initial={inspection}
      categories={categories.items} subcategories={subcategories.items} />
  </>;
}
