import "server-only";
import { Suspense, type ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import type { Rol } from "@/shared/api/contract.generated";
import { AppShell, PageHeader, RoleSidebar, Topbar } from "@/components/ui/layout";
import { AlertBanner, LoadingSkeleton } from "@/components/ui/feedback";
import { adminSections, hasAdminAccess } from "@/core/access";
import { roleHome } from "./profile";
import { readServerProfile } from "./session-server";
import { SessionControls } from "./session-controls";

export async function requireRole(role: Rol) {
  const session = await readServerProfile();
  if (session.state === "renew") redirect("/login?renovar=1");
  if (session.state === "anonymous") redirect("/login");
  if (session.state === "denied") notFound();
  if (session.state === "active" && session.perfil.rol !== role) notFound();
  return session.state === "active" ? session.perfil : null;
}

async function RoleLayout({ role, children }: { role: Rol; children: ReactNode }) {
  const profile = await requireRole(role);
  if (!profile) return <AlertBanner variant="error">No se pudo validar la sesión.</AlertBanner>;
  const items = [{ label: role, href: roleHome[role], current: role !== "Administrador" },
    ...adminSections.filter(({ access }) => hasAdminAccess(profile, access))];
  return (
    <AppShell sidebar={<RoleSidebar label="Portal" items={items} />}
      topbar={<Topbar actions={<SessionControls role={role} />}>AutoCheck</Topbar>}>
      {children}
    </AppShell>
  );
}

export function ProtectedLayout({ role, children }: { role: Rol; children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingSkeleton label="Validando sesión…" />}>
      <RoleLayout role={role}>{children}</RoleLayout>
    </Suspense>
  );
}

async function RolePage({ role, title }: { role: Rol; title: string }) {
  const profile = await requireRole(role);
  return profile ? <PageHeader title={title} /> : null;
}

export function ProtectedPage({ role, title }: { role: Rol; title: string }) {
  return <Suspense><RolePage role={role} title={title} /></Suspense>;
}
