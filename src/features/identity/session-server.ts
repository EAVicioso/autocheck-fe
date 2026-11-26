import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { connection, type NextResponse } from "next/server";
import type { ApiResult } from "@/shared/api/client";
import type { Session } from "@/shared/api/contract.generated";
import { autoCheckApi } from "@/shared/api/server";
import { deduplicateRotation } from "./rotation";
import { viewProfile } from "./profile";

const cookieNames = process.env.NODE_ENV === "production"
  ? { access: "__Host-autocheck-access", refresh: "__Host-autocheck-refresh" }
  : { access: "autocheck-access", refresh: "autocheck-refresh" };

type CookieSource = { get(name: string): { value: string } | undefined };

function isSession(body: Session) {
  return body && typeof body.accessToken === "string" && Boolean(body.accessToken)
    && typeof body.refreshToken === "string" && Boolean(body.refreshToken)
    && Number.isFinite(Date.parse(body.expiraUtc));
}

const rotate = deduplicateRotation((refreshToken) => autoCheckApi().request(
  "POST /api/auth/refresh", { body: { refreshToken } },
));

export class RefreshRejected extends Error {
  constructor(public readonly result: Extract<ApiResult<"POST /api/auth/refresh">, { ok: false }>) {
    super("Refresh rechazado.");
  }
}

export function backendSession(source: CookieSource) {
  let access = source.get(cookieNames.access)?.value;
  let refresh = source.get(cookieNames.refresh)?.value;
  let change: Session | null | undefined;

  function clear() {
    access = undefined;
    refresh = undefined;
    change = null;
  }

  function establish(tokens: Session) {
    if (!isSession(tokens)) throw new TypeError("Respuesta de sesión inválida.");
    change = tokens;
    access = tokens.accessToken;
    refresh = tokens.refreshToken;
  }

  async function renew() {
    if (!refresh) return undefined;
    const result = await rotate(refresh);
    if (!result.ok) {
      // A concurrent response may already have installed a newer cookie pair.
      throw new RefreshRejected(result);
    }
    establish(result.body);
    return access;
  }

  function api(allowRefresh: boolean) {
    return autoCheckApi({ token: () => access, onInvalidSession: clear, refresh: allowRefresh ? renew : undefined });
  }

  async function profile(allowRefresh = false, signal?: AbortSignal) {
    if (!access && !refresh) return { state: "anonymous" } as const;
    const result = await api(allowRefresh).request("GET /api/usuarios/me", {}, { signal });
    if (!result.ok) {
      if (result.kind === "transport-401" && !allowRefresh && refresh) return { state: "renew" } as const;
      if (result.status === 401 || result.status === 404) {
        clear();
        return { state: "anonymous", result } as const;
      }
      return { state: result.status === 403 ? "denied" : "unavailable", result } as const;
    }
    const perfil = viewProfile(result.body);
    if (!perfil) {
      clear();
      return { state: "denied" } as const;
    }
    return { state: "active", perfil } as const;
  }

  function commit(response: NextResponse) {
    if (change === undefined) return response;
    const common = { path: "/", httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
    // Keep the access cookie until rotation. The backend then distinguishes a
    // JWT challenge from definitive application-session expiry.
    response.cookies.set(cookieNames.access, change?.accessToken ?? "", change ? common : { ...common, maxAge: 0 });
    response.cookies.set(cookieNames.refresh, change?.refreshToken ?? "", change ? common : { ...common, maxAge: 0 });
    return response;
  }

  return { api, profile, commit, establish, clear, access: () => access };
}

export const readServerProfile = cache(async () => {
  await connection();
  try {
    return await backendSession(await cookies()).profile();
  } catch {
    return { state: "unavailable" } as const;
  }
});
