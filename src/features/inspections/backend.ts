import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendSession } from "@/features/identity/session-server";
import type { Operation, Operations, Problem } from "@/shared/api/contract.generated";

type PortalOperation = Exclude<Operation, "POST /api/pagos/webhook">;

export async function portalRequest<K extends PortalOperation>(operation: K, input: Operations[K]["input"], signal?: AbortSignal) {
  const session = backendSession(await cookies());
  try {
    return await session.api(false).request(operation, input, { signal });
  } catch {
    return null;
  }
}

export function portalError(result: { status: number; error: Problem | null } | null) {
  if (result?.status === 401) redirect("/login?renovar=1");
  if (result?.status === 403 || result?.status === 404) return "El recurso no existe o no está disponible para tu cuenta.";
  if (result?.status === 429) return "Hay demasiadas solicitudes. Espera un momento e inténtalo de nuevo.";
  if (result?.status === 409) return "El estado cambió. Revisa la información actual antes de continuar.";
  if (result?.status === 400) return "Revisa los datos enviados.";
  return "No se pudo completar la solicitud. Inténtalo de nuevo.";
}
