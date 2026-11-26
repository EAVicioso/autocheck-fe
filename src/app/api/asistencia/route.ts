import type { NextRequest } from "next/server";
import { assistanceFallback, assistanceReply, assistanceSchema, assistanceTimeoutHeader, assistanceTimeoutMs } from "@/features/assistance/contract";
import { backendSession } from "@/features/identity/session-server";
import { RequestFailure, withinDeadline } from "@/shared/api/deadline";
import { bffResponse, boundedJson, isJsonRequest, sameOrigin } from "@/shared/http/bff";

export async function POST(request: NextRequest) {
  try {
    return await withinDeadline(assistanceTimeoutMs, request.signal, async (signal) => {
      if (!sameOrigin(request)) return bffResponse(403);
      if (!isJsonRequest(request)) return bffResponse(415);
      const session = backendSession(request.cookies);
      if (!session.access()) return bffResponse(401);
      let body: unknown;
      try {
        body = await boundedJson(request, signal);
      } catch {
        signal.throwIfAborted();
        return bffResponse(400);
      }
      const input = assistanceSchema.safeParse(body);
      if (!input.success) return bffResponse(400);
      const result = await session.api(false).request("POST /api/asistencia", { body: input.data }, { signal, refresh: false });
      const reply = assistanceReply.safeParse(result.ok ? result.body : result.error);
      return session.commit(bffResponse(result.status, reply.success ? reply.data : undefined, result.headers));
    });
  } catch (error) {
    if (error instanceof RequestFailure && error.kind === "timeout") {
      const response = bffResponse(503, assistanceFallback);
      response.headers.set(assistanceTimeoutHeader, "1");
      return response;
    }
    return bffResponse(503);
  }
}
