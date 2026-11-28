import { notFound } from "next/navigation";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink, Input, LabeledControl, Select } from "@/components/ui/controls";
import { DataTable } from "@/components/ui/data-table";
import { AlertBanner } from "@/components/ui/feedback";
import { Card } from "@/components/ui/layout";
import { sectionAccess } from "@/core/access";
import { pageSize, pageNumber, searchHref, uuid, type SearchParams } from "@/core/search";
import { AdminSection, sectionData } from "@/core/section-server";
import type { Usuario } from "@/shared/api/contract.generated";
import { saveUserAccess } from "./actions";
import { AdminForm } from "./forms";
import { UserAccessFields } from "./user-access-fields";
import { roles } from "./validation";

const path = "/admin/usuarios";
const filters = z.object({ nombre: z.string().trim().max(120).optional(), rol: z.enum(["", ...roles]).optional(), pagina: pageNumber });

export function Users({ search }: { search: Promise<SearchParams> }) {
  return <AdminSection title="Usuarios y roles" access={sectionAccess.users} render={async ({ api }) => {
    const parsed = filters.safeParse(await search);
    const { nombre, rol, pagina } = parsed.data ?? filters.parse({});
    const controls = <form action={path} className="grid gap-3 sm:grid-cols-3">
      <LabeledControl label="Nombre"><Input name="nombre" defaultValue={nombre} maxLength={120} /></LabeledControl>
      <LabeledControl label="Rol"><Select name="rol" defaultValue={rol ?? ""}>
        <option value="">Todos</option>{roles.map((role) => <option key={role}>{role}</option>)}
      </Select></LabeledControl>
      <Button type="submit" size="touch" className="self-end">Buscar usuarios</Button>
    </form>;
    if (!parsed.success) return <Card>{controls}<AlertBanner variant="error">Revisa los filtros.</AlertBanner></Card>;
    const users = await sectionData(api, "GET /api/usuarios", { query: { nombre, rol: rol || undefined, pagina, tamano: pageSize, orden: "nombre" } });
    return <Card><DataTable<Usuario> caption="Usuarios" filters={controls} columns={[
      { id: "name", heading: "Nombre", render: (row) => <ButtonLink href={path + "/" + row.id} prefetch={false}>{row.nombre}</ButtonLink> },
      { id: "email", heading: "Correo", render: (row) => row.correo },
      { id: "role", heading: "Rol", render: (row) => row.rol },
      { id: "active", heading: "Estado", render: (row) => <Badge status={row.activo ? "Activo" : "Inactivo"} /> },
    ]} rowKey={(row) => row.id} state={{ status: "ready", rows: users.items, hasNext: pagina < 500000 && users.items.length === pageSize }}
      page={pagina} pageHref={(target) => searchHref(path, { nombre, rol, pagina: target })} /></Card>;
  }} />;
}

export function UserAccess({ params }: { params: Promise<{ id: string }> }) {
  return <AdminSection title="Acceso del usuario" access={sectionAccess.users} render={async ({ api, profile }) => {
    const parsed = uuid.safeParse((await params).id);
    if (!parsed.success) notFound();
    const id = parsed.data;
    const [user, access] = await Promise.all([
      sectionData(api, "GET /api/usuarios/{id}", { params: { id } }),
      sectionData(api, "GET /api/usuarios/{id}/acceso", { params: { id } }),
    ]);
    const scoped = profile.centroId !== null;
    return <>
      <ButtonLink href={path}>Volver a usuarios</ButtonLink>
      <Card className="space-y-4">
        <div><h2 className="text-lg font-semibold">{user.nombre}</h2><p className="text-muted">{user.correo}</p></div>
        {id === profile.id ? <AlertBanner>Otro administrador autorizado puede actualizar tu acceso.</AlertBanner> :
          <AdminForm action={saveUserAccess.bind(null, id, String(access.version))} label="Guardar acceso">
              <UserAccessFields key={String(access.version)} initialRole={access.rol} initialPermissions={access.permisos}
                active={access.activo} scoped={scoped} center={profile.centroId ?? access.centroId ?? ""} />
          </AdminForm>}
      </Card>
    </>;
  }} />;
}
