import "server-only";
import { Suspense, type ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import type { Rol } from "@/shared/api/contract.generated";
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
  if (!profile) return <p role="alert">No se pudo validar la sesión.</p>;
  return (
    <main className="min-w-0 wrap-break-word">
      <SessionControls role={role} />
      {children}
    </main>
  );
}

export function ProtectedLayout({ role, children }: { role: Rol; children: ReactNode }) {
  return (
    <Suspense fallback={<p role="status">Validando sesión…</p>}>
      <RoleLayout role={role}>{children}</RoleLayout>
    </Suspense>
  );
}

async function RolePage({ role, title }: { role: Rol; title: string }) {
  const profile = await requireRole(role);
  return profile ? <h1>{title}</h1> : null;
}

export function ProtectedPage({ role, title }: { role: Rol; title: string }) {
  return <Suspense><RolePage role={role} title={title} /></Suspense>;
}
