import type { NextRequest } from "next/server";
import { z } from "zod";
import { backendSession, RefreshRejected } from "@/features/identity/session-server";
import { bffResponse, sameOrigin } from "@/shared/http/bff";

const availabilityInput = z.object({ centroId: z.guid(), fecha: z.iso.date() });

export async function POST(request: NextRequest, { params }: RouteContext<"/api/availability/[centroId]">) {
  if (!sameOrigin(request)) return bffResponse(403);
  const { centroId } = await params;
  const parsed = availabilityInput.safeParse({ centroId, fecha: request.nextUrl.searchParams.get("fecha") });
  if (!parsed.success) return bffResponse(400);
  const session = backendSession(request.cookies);
  if (!session.access()) return bffResponse(401);

  try {
    const result = await session.api(true).request("GET /api/centros/{id}/disponibilidad", {
      params: { id: parsed.data.centroId }, query: { fecha: parsed.data.fecha },
    }, { signal: request.signal });
    return session.commit(bffResponse(
      result.status, result.ok ? result.body : result.error, result.headers,
      result.ok ? undefined : "application/problem+json",
    ));
  } catch (error) {
    if (error instanceof RefreshRejected) {
      return session.commit(bffResponse(error.result.status, error.result.error, error.result.headers, "application/problem+json"));
    }
    return session.commit(bffResponse(503));
  }
}
