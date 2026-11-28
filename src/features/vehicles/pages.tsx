import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/controls";
import { DataTable } from "@/components/ui/data-table";
import { Card } from "@/components/ui/layout";
import { pageNumber, pageSize, searchHref, uuid } from "@/core/search";
import { sectionData } from "@/core/section-server";
import { CitizenPage } from "@/features/citizen/server";
import type { CatalogoItem, CatalogoTipo } from "@/shared/api/contract.generated";
import type { citizenContext } from "@/features/citizen/server";
import { archiveVehicle, saveVehicle } from "./actions";
import { ArchiveVehicle, VehicleForm } from "./form";

const path = "/ciudadano/vehiculos";

async function catalog(api: Awaited<ReturnType<typeof citizenContext>>["api"], tipo: CatalogoTipo) {
  const entries: CatalogoItem[] = [];
  for (let pagina = 1; pagina <= 500000; pagina++) {
    const { items } = await sectionData(api, "GET /api/catalogos/{tipo}", { params: { tipo }, query: { pagina, tamano: pageSize } });
    entries.push(...items);
    if (items.length < pageSize) break;
  }
  return entries;
}

export function VehiclesPage({ page }: { page: unknown }) {
  const pagina = pageNumber.parse(page);
  return <CitizenPage title="Mis vehículos" render={async ({ api }) => {
    const { items } = await sectionData(api, "GET /api/vehiculos", { query: { pagina, tamano: pageSize } });
    return <><ButtonLink href={path + "/nuevo"}>Registrar vehículo</ButtonLink>
      <DataTable caption="Vehículos activos" page={pagina} pageHref={(next) => searchHref(path, { pagina: next })}
        state={{ status: "ready", rows: items, hasNext: items.length === pageSize && pagina < 500000 }}
        rowKey={(row) => row.id} columns={[
          { id: "matricula", heading: "Matrícula", render: (row) => row.matricula },
          { id: "vin", heading: "VIN", render: (row) => row.vin },
          { id: "anio", heading: "Año", render: (row) => row.anio },
          { id: "acciones", heading: "Acciones", render: (row) => <ButtonLink href={path + "/" + row.id}>Editar {row.matricula}</ButtonLink> },
        ]} />
    </>;
  }} />;
}

export function VehicleEditor({ id, booking = false }: { id?: string; booking?: boolean }) {
  if (id !== undefined && !uuid.safeParse(id).success) notFound();

  return <CitizenPage title={id ? "Editar vehículo" : "Registrar vehículo"} render={async ({ api }) => {
    const [vehicle, brands, models, colors] = await Promise.all([
      id ? sectionData(api, "GET /api/vehiculos/{id}", { params: { id } }) : null,
      catalog(api, "marcas"), catalog(api, "modelos"), catalog(api, "colores"),
    ]);
    const edit = vehicle ? { id: vehicle.id, version: vehicle.version } : null;
    const values = vehicle
      ? { matricula: vehicle.matricula, vin: vehicle.vin, anio: String(vehicle.anio), modeloId: vehicle.modeloId, colorId: vehicle.colorId }
      : { matricula: "", vin: "", anio: "", modeloId: "", colorId: "" };

    return <Card className="max-w-xl space-y-4 p-5">
      <VehicleForm values={values} brands={brands} models={models} colors={colors} save={saveVehicle.bind(null, edit, booking)} />
      {edit && <ArchiveVehicle archive={archiveVehicle.bind(null, edit)} />}
      <ButtonLink href={booking ? "/ciudadano/citas/nueva" : path}>Volver</ButtonLink>
    </Card>;
  }} />;
}

