import type { Rol, Usuario } from "@/shared/api/contract.generated";

export type SessionProfile = Pick<Usuario, "id" | "rol" | "permisos" | "centroId">;

export const roleHome = {
  Ciudadano: "/ciudadano",
  Inspector: "/inspector",
  Administrador: "/admin",
} as const satisfies Record<Rol, string>;

export function viewProfile(user: Usuario): SessionProfile | null {
  if (user?.activo !== true || user.archivadoUtc !== null || !Object.hasOwn(roleHome, user.rol)
    || typeof user.id !== "string" || !Array.isArray(user.permisos)
    || !(user.centroId === null || typeof user.centroId === "string")) return null;
  const { id, rol, permisos, centroId } = user;
  return { id, rol, permisos, centroId };
}
