"use server";

import { notFound } from "next/navigation";
import { hasAdminAccess, sectionAccess } from "@/core/access";
import { uuid } from "@/core/search";
import { requireAdminAccess, sectionData } from "@/core/section-server";
import { RequestFailure } from "@/shared/api/deadline";
import type { AdminFeedback } from "./forms";
import { adminMutation, invalid } from "./mutation";
import { accessForm, centerForm, parseVersion, rampForm, ruleForm, scheduleForm } from "./validation";

const accessUnavailable = invalid("No se pudo validar el acceso. Vuelve a intentar.");

async function readMutationAccess(...args: Parameters<typeof requireAdminAccess>) {
  try {
    return await requireAdminAccess(...args);
  } catch (error) {
    if (error instanceof RequestFailure) return null;
    throw error;
  }
}

function routeId(value: string) {
  const parsed = uuid.safeParse(value);
  if (!parsed.success) notFound();
  return parsed.data;
}

export async function saveUserAccess(id: string, version: string, _previous: AdminFeedback, data: FormData) {
  const access = await readMutationAccess(sectionAccess.users);
  if (!access) return accessUnavailable;
  const { api, profile } = access;
  const userId = routeId(id);
  if (userId === profile.id) return invalid("Tu propio acceso requiere otro administrador autorizado.");
  const parsed = accessForm.safeParse({
    rol: data.get("rol"),
    centroId: profile.centroId ?? data.get("centroId") ?? undefined,
    permisos: data.getAll("permisos"),
    activo: data.has("activo"),
  });
  const revision = parseVersion(version);
  if (!parsed.success || revision === null) return invalid("Revisa el rol, el centro y los permisos.");
  if (profile.centroId !== null && parsed.data.rol === "Administrador") return invalid("Ese rol requiere un administrador global.");
  return adminMutation(() => sectionData(api, "PATCH /api/usuarios/{id}/acceso", {
    params: { id: userId }, body: { ...parsed.data, version: revision },
  }), "/admin/usuarios/" + userId, "Acceso actualizado.");
}

export async function saveCenter(id: string | null, _previous: AdminFeedback, data: FormData) {
  const centerId = id === null ? null : routeId(id);
  const access = await readMutationAccess(sectionAccess.centers, centerId ?? undefined);
  if (!access) return accessUnavailable;
  const { api, profile } = access;
  if (centerId === null && !hasAdminAccess(profile, { ...sectionAccess.centers, global: true })) notFound();
  const parsed = centerForm.safeParse({ nombre: data.get("nombre"), direccion: data.get("direccion"), activo: data.has("activo") });
  if (!parsed.success) return invalid("Introduce un nombre y una dirección válidos.");
  const body = parsed.data;
  return centerId === null
    ? adminMutation(() => sectionData(api, "POST /api/centros", { body }), "/admin/centros",
      "Centro creado.", (center) => "/admin/centros/" + center.id)
    : adminMutation(() => sectionData(api, "PATCH /api/centros/{id}", { params: { id: centerId }, body }),
      "/admin/centros/" + centerId, "Centro actualizado.");
}

export async function saveRamp(id: string, ramp: string | null, _previous: AdminFeedback, data: FormData) {
  const centerId = routeId(id);
  const access = await readMutationAccess(sectionAccess.centers, centerId);
  if (!access) return accessUnavailable;
  const parsed = rampForm.safeParse({ nombre: data.get("nombre"), activa: data.has("activa") });
  if (!parsed.success) return invalid("Introduce un nombre válido para la rampa.");
  const body = parsed.data;
  return adminMutation(() => ramp === null
    ? sectionData(access.api, "POST /api/centros/{id}/rampas", { params: { id: centerId }, body })
    : sectionData(access.api, "PATCH /api/centros/{id}/rampas/{rampaId}", { params: { id: centerId, rampaId: routeId(ramp) }, body }),
  "/admin/centros/" + centerId, ramp === null ? "Rampa agregada." : "Rampa actualizada.");
}

export async function saveSchedule(id: string, _previous: AdminFeedback, data: FormData) {
  const centerId = routeId(id);
  const access = await readMutationAccess(sectionAccess.centers, centerId);
  if (!access) return accessUnavailable;
  const horarios = scheduleForm(data);
  if (!horarios) return invalid("Usa intervalos de 30 minutos con el cierre después de la apertura.");
  return adminMutation(() => sectionData(access.api, "PUT /api/centros/{id}/horarios", {
    params: { id: centerId }, body: { horarios },
  }), "/admin/centros/" + centerId, "Horarios actualizados.");
}

export async function saveRule(_previous: AdminFeedback, data: FormData) {
  const access = await readMutationAccess(sectionAccess.rules);
  if (!access) return accessUnavailable;
  const parsed = ruleForm.safeParse({ m: data.get("m"), vigencia: data.get("vigencia") });
  if (!parsed.success) return invalid("Introduce un M entero mayor o igual a cero y una fecha de vigencia válida.");
  return adminMutation(() => sectionData(access.api, "POST /api/configuracion/reglas-inspeccion", { body: parsed.data }),
    "/admin/reglas", "Nueva versión de M registrada.");
}
