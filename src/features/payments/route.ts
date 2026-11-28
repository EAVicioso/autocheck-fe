import "server-only";
import type { NextRequest } from "next/server";
import { backendSession, RefreshRejected } from "@/features/identity/session-server";
import { boundedJson, bffResponse, isJsonRequest, sameOrigin } from "@/shared/http/bff";
import { citizenCommand, type CitizenCommand } from "./contract";

type Api = ReturnType<ReturnType<typeof backendSession>["api"]>;

function execute(api: Api, command: CitizenCommand, signal: AbortSignal) {
  const options = { signal };
  switch (command.action) {
    case "start": return api.request("POST /api/pagos/intentos", { body: command.body, headers: { "Idempotency-Key": command.key } }, options);
    case "payment": return api.request("GET /api/pagos/intentos/{id}", { params: { id: command.id } }, options);
    case "abandon": return api.request("DELETE /api/citas/retenciones/{id}", { params: { id: command.id } }, options);
    case "appointment": return api.request("GET /api/citas/{id}", { params: { id: command.id } }, options);
    case "cancel": return api.request("POST /api/citas/{id}/cancelacion", {
      params: { id: command.id }, body: { motivo: command.motivo }, headers: { "Idempotency-Key": command.key },
    }, options);
  }
}

export async function citizenPost(request: NextRequest) {
  if (!sameOrigin(request)) return bffResponse(403);
  if (!isJsonRequest(request)) return bffResponse(415);

  const command = citizenCommand.safeParse(await boundedJson(request).catch(() => null));
  if (!command.success) return bffResponse(400);

  const session = backendSession(request.cookies);
  try {
    const actor = await session.profile(true, request.signal);
    if (actor.state !== "active") {
      const status = actor.state === "denied" ? 403 : actor.state === "unavailable" ? 503 : 401;
      return session.commit(bffResponse(status));
    }
    if (actor.perfil.rol !== "Ciudadano") return session.commit(bffResponse(403));
    const result = await execute(session.api(true), command.data, request.signal);
    return session.commit(bffResponse(result.status, result.ok ? result.body : result.error, result.headers,
      result.ok ? undefined : "application/problem+json"));
  } catch (error) {
    if (error instanceof RefreshRejected) {
      return session.commit(bffResponse(error.result.status, error.result.error, error.result.headers, "application/problem+json"));
    }
    return session.commit(bffResponse(503));
  }
}
