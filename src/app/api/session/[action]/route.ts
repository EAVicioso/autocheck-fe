import type { NextRequest } from "next/server";
import { loginSchema, recoverySchema, registrationSchema, resetSchema } from "@/features/identity/schemas";
import { backendSession, RefreshRejected } from "@/features/identity/session-server";
import { autoCheckApi } from "@/shared/api/server";
import { bffResponse, boundedJson, isJsonRequest, sameOrigin } from "@/shared/http/bff";

function relay(result: { status: number; headers: Parameters<typeof bffResponse>[2] } & (
  { ok: true; body: unknown } | { ok: false; error: unknown }
)) {
  return bffResponse(result.status, result.ok ? result.body : result.error, result.headers,
    result.ok ? undefined : "application/problem+json");
}

export async function POST(request: NextRequest, context: RouteContext<"/api/session/[action]">) {
  if (!sameOrigin(request)) return bffResponse(403);
  const { action } = await context.params;
  const session = backendSession(request.cookies);
  const { signal } = request;
  const bodyActions = ["login", "registro", "recuperacion", "restablecimiento"];
  let body: unknown;
  if (bodyActions.includes(action)) {
    if (!isJsonRequest(request)) return bffResponse(415);
    try {
      body = await boundedJson(request);
    } catch {
      return bffResponse(400);
    }
  }

  function respondProfile(profile: Awaited<ReturnType<typeof session.profile>>) {
    if (profile.state === "active") return session.commit(bffResponse(200, profile.perfil));
    if ("result" in profile && profile.result) return session.commit(relay(profile.result));
    return session.commit(bffResponse(profile.state === "denied" ? 403 : 401));
  }

  try {
    switch (action) {
      case "perfil":
        // POST at the BFF because cookies may rotate. AutoCheck sees only GET and, if needed, refresh.
        return respondProfile(await session.profile(true, signal));
      case "login": {
        const parsed = loginSchema.safeParse(body);
        if (!parsed.success) return bffResponse(400);
        const result = await autoCheckApi().request("POST /api/auth/login", { body: parsed.data }, { signal });
        if (!result.ok) return relay(result);
        session.establish(result.body);
        return respondProfile(await session.profile(false, signal));
      }
      case "registro": {
        const parsed = registrationSchema.safeParse(body);
        if (!parsed.success) return bffResponse(400);
        return relay(await autoCheckApi().request("POST /api/auth/registro", { body: parsed.data }, { signal }));
      }
      case "recuperacion": {
        const parsed = recoverySchema.safeParse(body);
        if (!parsed.success) return bffResponse(400);
        return relay(await autoCheckApi().request("POST /api/auth/recuperacion", { body: parsed.data }, { signal }));
      }
      case "restablecimiento": {
        const parsed = resetSchema.safeParse(body);
        if (!parsed.success) return bffResponse(400);
        const result = await autoCheckApi().request("POST /api/auth/restablecimiento", { body: parsed.data }, { signal });
        if (result.ok) session.clear();
        return session.commit(relay(result));
      }
      case "logout": {
        try {
          const initialAccess = session.access();
          const profile = await session.profile(true, signal);
          if (!initialAccess && profile.state === "anonymous") {
            session.clear();
            return session.commit(bffResponse(204));
          }
          const result = await autoCheckApi({ token: () => session.access() ?? initialAccess })
            .request("POST /api/auth/logout", {}, { signal, refresh: false });
          session.clear();
          return session.commit(relay(result));
        } catch (error) {
          session.clear();
          throw error;
        }
      }
      case "actividad": {
        if (!session.access()) return bffResponse(401);
        const result = await session.api(false).request("POST /api/auth/actividad", {}, { signal, refresh: false });
        return session.commit(relay(result));
      }
      case "realtime": {
        if (process.env.NEXT_PUBLIC_SUPABASE_REALTIME_PRIVATE !== "true") return bffResponse(404);
        const profile = await session.profile(true, signal);
        if (profile.state !== "active") return respondProfile(profile);
        return session.commit(bffResponse(200, { accessToken: session.access() }));
      }
      default: return bffResponse(404);
    }
  } catch (error) {
    if (error instanceof RefreshRejected) return session.commit(relay(error.result));
    return session.commit(bffResponse(503));
  }
}
