import type { Operations, Problem } from "@/shared/api/contract.generated";
import type { SessionProfile } from "./profile";

export const refreshRejectedHeader = "x-autocheck-refresh-rejected";

type Actions = {
  perfil: { input: undefined; output: SessionProfile };
  login: { input: Operations["POST /api/auth/login"]["input"]["body"]; output: SessionProfile };
  registro: { input: Operations["POST /api/auth/registro"]["input"]["body"]; output: Operations["POST /api/auth/registro"]["success"]["body"] };
  recuperacion: { input: Operations["POST /api/auth/recuperacion"]["input"]["body"]; output: Operations["POST /api/auth/recuperacion"]["success"]["body"] };
  restablecimiento: { input: Operations["POST /api/auth/restablecimiento"]["input"]["body"]; output: undefined };
  logout: { input: undefined; output: undefined };
  actividad: { input: undefined; output: undefined };
  realtime: { input: undefined; output: { accessToken: string } };
};

export class SessionActionError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: Problem | null,
    public readonly retryAfter: string | null,
  ) {
    super("La solicitud no pudo completarse.");
  }
}

export async function sessionAction<K extends keyof Actions>(
  action: K, body: Actions[K]["input"], signal?: AbortSignal,
): Promise<Actions[K]["output"]> {
  const send = () => fetch("/api/session/" + action, {
    method: "POST", credentials: "same-origin", cache: "no-store", signal,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let response = await send();
  if ((action === "perfil" || action === "actividad") && response.status === 401
    && response.headers.get(refreshRejectedHeader) === "1") {
    await response.body?.cancel();
    response = await send();
  }
  if (!response.ok) {
    const problem = response.headers.get("Content-Type")?.startsWith("application/problem+json")
      ? await response.json().catch(() => null) as Problem | null : null;
    throw new SessionActionError(response.status, problem, response.headers.get("Retry-After"));
  }
  return response.status === 204 ? undefined : response.json();
}
