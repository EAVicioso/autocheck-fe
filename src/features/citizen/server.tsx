import "server-only";
import { Suspense, type ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AlertBanner, LoadingSkeleton } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/layout";
import { requireRole } from "@/features/identity/guards";
import { backendSession } from "@/features/identity/session-server";
import { RequestFailure } from "@/shared/api/deadline";
import { SectionApiError } from "@/core/section-server";

export async function citizenContext() {
  const profile = await requireRole("Ciudadano");
  if (!profile) throw new RequestFailure("network");
  return { profile, api: backendSession(await cookies()).api(false) };
}

type Render = (context: Awaited<ReturnType<typeof citizenContext>>) => Promise<ReactNode>;

async function CitizenContent({ render }: { render: Render }) {
  try {
    return await render(await citizenContext());
  } catch (error) {
    if (error instanceof SectionApiError) {
      if (error.status === 403 || error.status === 404) notFound();
      if (error.status === 401) redirect("/login?renovar=1");
    } else if (!(error instanceof RequestFailure)) throw error;
    return <AlertBanner variant="error">No se pudo cargar la información. Vuelve a intentarlo.</AlertBanner>;
  }
}

export function CitizenPage({ title, render }: { title: string; render: Render }) {
  return <><PageHeader title={title} /><Suspense fallback={<LoadingSkeleton />}>
    <CitizenContent render={render} />
  </Suspense></>;
}

