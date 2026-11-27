import type { Permiso } from "@/shared/api/contract.generated";
import type { SessionProfile } from "@/features/identity/profile";

type AdminAccess = { permission: Permiso; global?: boolean };

export const sectionAccess = {
  reports: { permission: "auditoria.consultar" },
  audit: { permission: "auditoria.consultar", global: true },
  users: { permission: "usuarios.gestionar" },
  centers: { permission: "centros.gestionar" },
  rules: { permission: "reglas.gestionar", global: true },
} as const satisfies Record<string, AdminAccess>;

export function hasAdminAccess(profile: SessionProfile, { permission, global }: AdminAccess, center?: string) {
  return profile.rol === "Administrador" && profile.permisos.includes(permission)
    && (profile.centroId === null || (!global && (center === undefined || center === profile.centroId)));
}

export const adminSections = [
  { href: "/admin/reportes", label: "Reportes", access: sectionAccess.reports },
  { href: "/admin/usuarios", label: "Usuarios y roles", access: sectionAccess.users },
  { href: "/admin/centros", label: "Centros y rampas", access: sectionAccess.centers },
  { href: "/admin/reglas", label: "Reglas de inspección", access: sectionAccess.rules },
  { href: "/admin/auditoria", label: "Auditoría", access: sectionAccess.audit },
] as const;
