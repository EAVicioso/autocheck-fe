import { describe, expect, it } from "vitest";
import type { SessionProfile } from "@/features/identity/profile";
import { hasAdminAccess, sectionAccess } from "./access";

const admin: SessionProfile = { id: "admin", rol: "Administrador", permisos: ["auditoria.consultar"], centroId: null };

describe("autorización granular", () => {
  it("exige rol, permiso y alcance en cada caso", () => {
    const local = { ...admin, centroId: "centro-1" };
    expect(hasAdminAccess(admin, sectionAccess.audit)).toBe(true);
    expect(hasAdminAccess(local, sectionAccess.audit)).toBe(false);
    expect(hasAdminAccess(local, sectionAccess.reports, "centro-1")).toBe(true);
    expect(hasAdminAccess(local, sectionAccess.reports, "centro-2")).toBe(false);
    expect(hasAdminAccess(admin, sectionAccess.users)).toBe(false);
    expect(hasAdminAccess({ ...admin, rol: "Inspector" }, sectionAccess.audit)).toBe(false);
  });
});
