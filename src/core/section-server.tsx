import "server-only";
import { Suspense, type ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AlertBanner, LoadingSkeleton } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/layout";
import { requireRole } from "@/features/identity/guards";
import { backendSession } from "@/features/identity/session-server";
import type { SessionProfile } from "@/features/identity/profile";
import type { Operations } from "@/shared/api/contract.generated";
import { RequestFailure } from "@/shared/api/deadline";
import { hasAdminAccess } from "./access";

export async function requireAdminAccess(access: Parameters<typeof hasAdminAccess>[1], center?: string) {
  const profile = await requireRole("Administrador");
  if (!profile) throw new RequestFailure("network");
  if (!hasAdminAccess(profile, access, center)) notFound();
  return { profile, api: backendSession(await cookies()).api(false) };
}

type SectionApi = Awaited<ReturnType<typeof requireAdminAccess>>["api"];
type SectionOperation = Exclude<keyof Operations, "POST /api/asistencia" | "POST /api/pagos/webhook">;

export class SectionApiError extends Error {
  constructor(readonly status: number, readonly code?: string, readonly detail?: string) {
    super("La API rechazó la operación.");
  }
}

export async function sectionData<K extends SectionOperation>(api: SectionApi, operation: K, input: Operations[K]["input"]):
Promise<Operations[K]["success"]["body"]> {
  const result = await api.request<K>(operation, input);
  if (!result.ok) {
    const detail = typeof result.error?.detail === "string" ? result.error.detail : undefined;
    throw new SectionApiError(result.status, result.error?.codigo, detail);
  }
  return result.body;
}

type SectionProps = {
  title: string;
  access: Parameters<typeof hasAdminAccess>[1];
  render(context: { api: SectionApi; profile: SessionProfile }): Promise<ReactNode>;
};

async function SectionContent({ access, render }: SectionProps) {
  try {
    return await render(await requireAdminAccess(access));
  } catch (error) {
    if (error instanceof SectionApiError) {
      if (error.status === 403 || error.status === 404) notFound();
      if (error.status === 401) redirect("/login?renovar=1");
      if (error.status === 400) return <AlertBanner variant="error">Revisa los filtros y vuelve a intentar.</AlertBanner>;
    } else if (!(error instanceof RequestFailure)) {
      throw error;
    }
    return <AlertBanner variant="error">No se pudo cargar la información. Vuelve a intentarlo.</AlertBanner>;
  }
}

export function AdminSection(props: SectionProps) {
  return <>
    <PageHeader title={props.title} />
    <Suspense fallback={<LoadingSkeleton />}>
      <SectionContent {...props} />
    </Suspense>
  </>;
}
