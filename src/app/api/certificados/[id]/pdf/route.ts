import { NextResponse, type NextRequest } from "next/server";
import { backendSession, RefreshRejected } from "@/features/identity/session-server";
import { inspectionIdSchema } from "@/features/inspections/defects";
import { bffResponse } from "@/shared/http/bff";

export async function GET(request: NextRequest, { params }: RouteContext<"/api/certificados/[id]/pdf">) {
  const { id } = await params;
  if (!inspectionIdSchema.safeParse(id).success) return bffResponse(404);
  const session = backendSession(request.cookies);
  if (!session.access()) return bffResponse(401);
  try {
    const result = await session.api(true).request("GET /api/certificados/{id}/pdf", { params: { id } }, { signal: request.signal });
    if (!result.ok) return session.commit(bffResponse(result.status, result.error, undefined, "application/problem+json"));
    return session.commit(new NextResponse(result.body, { headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="certificado-' + id + '.pdf"',
      "X-Content-Type-Options": "nosniff",
    } }));
  } catch (error) {
    if (error instanceof RefreshRejected) {
      return session.commit(bffResponse(error.result.status, error.result.error, undefined, "application/problem+json"));
    }
    return session.commit(bffResponse(503));
  }
}
