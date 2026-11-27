import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, Button, Checkbox, Input, LabeledControl } from "@/components/ui/controls";
import { DataTable } from "@/components/ui/data-table";
import { AlertBanner } from "@/components/ui/feedback";
import { Card } from "@/components/ui/layout";
import { hasAdminAccess, sectionAccess } from "@/core/access";
import { optionalId, pageNumber, pageSize, searchHref, uuid, type SearchParams } from "@/core/search";
import { AdminSection, sectionData } from "@/core/section-server";
import type { Centro, Horario, Rampa } from "@/shared/api/contract.generated";
import { saveCenter, saveRamp, saveSchedule } from "./actions";
import { AdminForm } from "./forms";
import { clockLabel, weekdays } from "./validation";

const path = "/admin/centros";
const createAccess = { ...sectionAccess.centers, global: true };

export function Centers({ search }: { search: Promise<SearchParams> }) {
  return <AdminSection title="Centros y rampas" access={sectionAccess.centers} render={async ({ api, profile }) => {
    if (profile.centroId !== null) return <ButtonLink href={path + "/" + profile.centroId}>Gestionar mi centro</ButtonLink>;
    const query = await search;
    const id = optionalId.safeParse(query.centroId);
    const pagina = pageNumber.parse(query.pagina);
    const centers = id.success && id.data
      ? { items: [(await sectionData(api, "GET /api/centros/{id}", { params: { id: id.data } })).centro] }
      : await sectionData(api, "GET /api/centros", { query: { pagina, tamano: pageSize } });
    return <>
      <ButtonLink href={path + "/nuevo"}>Crear centro</ButtonLink>
      <Card>
        <form action={path} className="mb-3 flex flex-wrap items-end gap-3">
          <LabeledControl label="ID del centro"><Input name="centroId" maxLength={36} defaultValue={id.data} /></LabeledControl>
          <Button type="submit" size="touch">Buscar centro</Button>
        </form>
        {!id.success && <AlertBanner variant="error">Introduce un identificador de centro válido.</AlertBanner>}
        <DataTable<Centro> caption="Centros" columns={[
          { id: "name", heading: "Centro", render: (center) => <ButtonLink href={path + "/" + center.id} prefetch={false}>{center.nombre}</ButtonLink> },
          { id: "address", heading: "Dirección", render: (center) => center.direccion },
          { id: "status", heading: "Estado", render: (center) => <Badge status={center.activo ? "Activo" : "Inactivo"} /> },
        ]} rowKey={(center) => center.id}
          state={{ status: "ready", rows: centers.items, hasNext: !id.data && pagina < 500000 && centers.items.length === pageSize }}
          page={pagina} pageHref={(page) => searchHref(path, { pagina: page })} />
      </Card>
    </>;
  }} />;
}

function CenterForm({ center }: { center?: Centro }) {
  return <AdminForm action={saveCenter.bind(null, center?.id ?? null)} label={center ? "Guardar centro" : "Registrar centro"}>
    <LabeledControl label="Nombre del centro"><Input name="nombre" required maxLength={120} defaultValue={center?.nombre} /></LabeledControl>
    <LabeledControl label="Dirección"><Input name="direccion" required maxLength={300} defaultValue={center?.direccion} /></LabeledControl>
    <Checkbox name="activo" defaultChecked={center?.activo ?? true} label="Centro activo" />
  </AdminForm>;
}

function RampForm({ centerId, ramp }: { centerId: string; ramp?: Rampa }) {
  return <AdminForm action={saveRamp.bind(null, centerId, ramp?.id ?? null)} label={ramp ? "Guardar rampa" : "Agregar rampa"}>
    <LabeledControl label="Nombre de la rampa"><Input name="nombre" required maxLength={80} defaultValue={ramp?.nombre} /></LabeledControl>
    <Checkbox name="activa" defaultChecked={ramp?.activa ?? true} label="Rampa activa" />
  </AdminForm>;
}

function Schedule({ centerId, schedule }: { centerId: string; schedule: readonly Horario[] }) {
  return <AdminForm action={saveSchedule.bind(null, centerId)} label="Guardar horarios">
    <p className="text-sm text-muted">Marca los días de servicio y usa intervalos de 30 minutos en Santo Domingo. El último cierre permitido es 24:00.</p>
    {weekdays.map((weekday, day) => {
      const current = schedule.find((row) => row.dia === day);
      return <fieldset key={weekday} className="grid gap-2 border-b border-subtle pb-3 sm:grid-cols-3">
        <legend className="font-semibold">{weekday}</legend>
        <Checkbox name={"dia-" + day} defaultChecked={Boolean(current)} label={"Abrir el " + weekday.toLowerCase()} />
        <LabeledControl label={"Apertura " + weekday}><Input name={"apertura-" + day} maxLength={5}
          defaultValue={current ? clockLabel(current.aperturaMinutos) : "08:00"} /></LabeledControl>
        <LabeledControl label={"Cierre " + weekday}><Input name={"cierre-" + day} maxLength={5}
          defaultValue={current ? clockLabel(current.cierreMinutos) : "17:00"} /></LabeledControl>
      </fieldset>;
    })}
  </AdminForm>;
}

export function NewCenter() {
  return <AdminSection title="Crear centro" access={createAccess} render={async () => <>
    <ButtonLink href={path}>Volver a centros</ButtonLink><Card><CenterForm /></Card>
  </>} />;
}

export function CenterDetails({ params }: { params: Promise<{ id: string }> }) {
  return <AdminSection title="Operación del centro" access={sectionAccess.centers} render={async ({ api, profile }) => {
    const parsed = uuid.safeParse((await params).id);
    if (!parsed.success || !hasAdminAccess(profile, sectionAccess.centers, parsed.data)) notFound();
    const id = parsed.data;
    const detail = await sectionData(api, "GET /api/centros/{id}", { params: { id } });
    const activeRamps = detail.rampas.filter((ramp) => ramp.activa).length;
    return <>
      <ButtonLink href={path}>Volver a centros</ButtonLink>
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">{detail.centro.nombre}</h2>
        <p className="text-sm text-muted">ID {detail.centro.id}</p>
        <p>Capacidad simultánea: <strong>{detail.centro.activo ? activeRamps : 0}</strong></p>
        <CenterForm center={detail.centro} />
      </Card>
      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">Rampas</h2>
        {detail.rampas.map((ramp) => <section aria-label={ramp.nombre} key={ramp.id} className="space-y-3 border-b border-subtle pb-4">
          <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{ramp.nombre}</h3>
            <Badge status={ramp.activa ? "Activo" : "Inactivo"} /></div>
          <p className="text-sm text-muted">ID {ramp.id}</p>
          <RampForm centerId={id} ramp={ramp} />
        </section>)}
        <h3 className="font-semibold">Nueva rampa</h3>
        <RampForm centerId={id} />
      </Card>
      <Card className="space-y-3"><h2 className="text-lg font-semibold">Horarios</h2>
        <Schedule centerId={id} schedule={detail.horarios} />
      </Card>
    </>;
  }} />;
}
