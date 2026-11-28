import "server-only";
import type { NextRequest } from "next/server";
import {
  assistanceFallback, assistanceInvalid, assistanceReply, assistanceSchema, assistanceTimeoutHeader,
} from "@/features/assistance/contract";
import { backendSession } from "@/features/identity/session-server";
import { RequestFailure, withinDeadline } from "@/shared/api/deadline";
import { bffResponse, boundedJson, isJsonRequest, sameOrigin } from "@/shared/http/bff";

const rejected = { ...assistanceInvalid, respuesta: "No se pudo procesar la solicitud." };
const successCodes = new Set(["OK", "INFORMACION_INSUFICIENTE", "FUERA_DE_ALCANCE"]);
// Reserve time to deliver the 503 before the browser's 3 s deadline.
const serverBudgetMs = 2800;

export async function POST(request: NextRequest) {
  try {
    return await withinDeadline(serverBudgetMs, request.signal, async (signal) => {
      if (!sameOrigin(request)) return bffResponse(403, rejected);
      if (!isJsonRequest(request)) return bffResponse(415, rejected);
      let body: unknown;
      try {
        body = await boundedJson(request, signal);
      } catch {
        signal.throwIfAborted();
        return bffResponse(400, assistanceInvalid);
      }
      const input = assistanceSchema.safeParse(body);
      if (!input.success) return bffResponse(400, assistanceInvalid);
      const session = backendSession(request.cookies);
      if (!session.access()) return bffResponse(401, rejected);
      const result = await session.api(false).request("POST /api/asistencia", { body: input.data }, { signal, refresh: false });
      const reply = assistanceReply.safeParse(result.ok ? result.body : result.error);
      if (result.ok) {
        return reply.success && successCodes.has(reply.data.codigo)
          ? bffResponse(200, reply.data) : bffResponse(503, assistanceFallback);
      }
      if (result.status === 503) return bffResponse(503, assistanceFallback, result.headers);
      const rejection = reply.success && reply.data.categoria === "NO_DETERMINADA" && reply.data.codigo === "SOLICITUD_INVALIDA"
        ? reply.data : rejected;
      return session.commit(bffResponse(result.status, rejection, result.headers));
    });
  } catch (error) {
    const response = bffResponse(503, assistanceFallback);
    if (error instanceof RequestFailure && error.kind === "timeout") response.headers.set(assistanceTimeoutHeader, "1");
    return response;
  }
}
