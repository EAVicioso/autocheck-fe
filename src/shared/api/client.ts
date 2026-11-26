import { operations, type Operation, type Operations, type Problem } from "./contract.generated";
import { RequestFailure, withinDeadline } from "./deadline";
import { parseWireJson, serializeWireJson } from "./wire-json";

type BrowserOperation = Exclude<Operation, "POST /api/pagos/webhook">;
type Input<K extends BrowserOperation> = Operations[K]["input"];
export type ContractHeaders = {
  location: string | null;
  retryAfter: string | null;
  contentDisposition: string | null;
};
type FailureKind = "transport-401" | "application-session" | "unauthorized" | "forbidden" | "conflict" | "rate-limit" | "http";
export type ApiResult<K extends BrowserOperation> =
  | ({ ok: true } & Operations[K]["success"] & { headers: ContractHeaders })
  | { ok: false; kind: FailureKind; status: number; error: Operations[K]["errors"] | null; headers: ContractHeaders };

type RequestOptions = { signal?: AbortSignal; refresh?: false };
type Options = {
  baseUrl: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
  token?: () => string | undefined;
  refresh?: () => Promise<string | undefined>;
  onInvalidSession?: () => void;
};

export function failureKind(status: number, problem: Problem | null): FailureKind {
  switch (status) {
    case 401:
      if (problem?.codigo === "SESION_INVALIDA" || problem?.codigo === "SESION_EXPIRADA") return "application-session";
      return !problem || problem.codigo === "SOLICITUD_RECHAZADA" ? "transport-401" : "unauthorized";
    case 403: return "forbidden";
    case 409: return "conflict";
    case 429: return "rate-limit";
    default: return "http";
  }
}

function isProblem(value: unknown): value is Problem {
  return typeof value === "object" && value !== null
    && "codigo" in value && typeof value.codigo === "string"
    && "traceId" in value && typeof value.traceId === "string"
    && "status" in value && typeof value.status === "number";
}

type Bindings = { params?: Record<string, string>; query?: Record<string, string | number | bigint | boolean>; headers?: HeadersInit; body?: unknown };

export function createApiClient(options: Options) {
  const base = new URL(options.baseUrl);
  const timeoutMs = options.timeoutMs ?? 10_000;
  if (!["https:", "http:"].includes(base.protocol) || base.username || base.password
    || base.pathname !== "/" || base.search || base.hash || !Number.isInteger(timeoutMs)
    || timeoutMs < 1 || timeoutMs > 2_147_483_647) {
    throw new RequestFailure("configuration");
  }
  const fetcher = options.fetch ?? fetch;
  let refreshing: Promise<string | undefined> | undefined;

  function refreshOnce() {
    refreshing ??= Promise.resolve().then(() => options.refresh?.()).finally(() => { refreshing = undefined; });
    return refreshing;
  }

  function prepare<K extends BrowserOperation>(operation: K, input: Input<K>) {
    const metadata = operations[operation];
    const { params, query, headers, body } = input as Bindings;
    const path = metadata.path.replace(/\{(\w+)\}/g, (_, name: string) => {
      const value = params?.[name];
      if (!value || value === "." || value === "..") throw new TypeError("Parámetro de ruta inválido.");
      return encodeURIComponent(value);
    });
    const url = new URL(path, base);
    for (const [name, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(name, String(value));
    }
    const baseHeaders = new Headers(headers);
    baseHeaders.delete("Authorization");
    const key = baseHeaders.get("Idempotency-Key");
    if (metadata.idempotent && (!key?.trim() || key.length > 128)) throw new TypeError("Idempotency-Key inválida.");
    const payload = body === undefined ? undefined : serializeWireJson(body);
    if (payload !== undefined) baseHeaders.set("Content-Type", "application/json");

    async function send(signal: AbortSignal, token?: string): Promise<ApiResult<K>> {
      const requestHeaders = new Headers(baseHeaders);
      if (metadata.auth === "bearer" && token) requestHeaders.set("Authorization", "Bearer " + token);
      let response: Response;
      try {
        response = await fetcher(url, {
          method: metadata.method, headers: requestHeaders, body: payload,
          signal, cache: "no-store", redirect: "error",
        });
      } catch (error) {
        signal.throwIfAborted();
        throw new RequestFailure("network", { cause: error });
      }
      const responseHeaders = {
        location: response.headers.get("Location"),
        retryAfter: response.headers.get("Retry-After"),
        contentDisposition: response.headers.get("Content-Disposition"),
      };
      const media = response.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase();
      const format = (metadata.success as Record<number, "json" | "empty" | "pdf">)[response.status];
      if (response.ok && !format) throw new RequestFailure("protocol");
      try {
        if (format) {
          if ((format === "pdf" && media !== "application/pdf")
            || (format === "json" && media !== "application/json")) throw new RequestFailure("protocol");
          const data = format === "empty" ? undefined : format === "pdf" ? await response.blob()
            : parseWireJson(await response.text());
          return { ok: true, status: response.status, body: data, headers: responseHeaders } as ApiResult<K>;
        }

        const expectedMedia = metadata.assistance ? "application/json" : "application/problem+json";
        let raw: unknown = null;
        if (media === expectedMedia) {
          const text = await response.text();
          try {
            raw = parseWireJson(text);
          } catch {
            // Keep HTTP status and headers when a proxy or upstream response is malformed.
          }
        } else {
          await response.body?.cancel();
        }
        const problem = isProblem(raw) ? raw : null;
        return {
          ok: false, status: response.status, kind: failureKind(response.status, problem),
          error: metadata.assistance ? raw : problem, headers: responseHeaders,
        } as ApiResult<K>;
      } catch (error) {
        signal.throwIfAborted();
        if (error instanceof RequestFailure) throw error;
        throw new RequestFailure(error instanceof SyntaxError ? "protocol" : "network", { cause: error });
      }
    }

    return ({ signal, refresh }: RequestOptions = {}): Promise<ApiResult<K>> => withinDeadline(timeoutMs, signal, async (deadline) => {
      const originalToken = options.token?.();
      const first = await send(deadline, originalToken);
      if (first.ok || metadata.auth !== "bearer") return first;
      if (first.kind === "application-session") options.onInvalidSession?.();
      // A transport challenge rejects the request before recording activity.
      const canReplay = metadata.method === "GET" || metadata.idempotent || operation === "POST /api/auth/actividad";
      if (first.kind !== "transport-401" || !canReplay || metadata.assistance || refresh === false || !options.refresh) return first;

      const currentToken = options.token?.();
      const token = currentToken && currentToken !== originalToken ? currentToken : await refreshOnce();
      deadline.throwIfAborted();
      if (!token) return first;
      const retried = await send(deadline, token);
      if (!retried.ok && retried.kind === "application-session") options.onInvalidSession?.();
      return retried;
    });
  }

  return {
    prepare,
    request<K extends BrowserOperation>(operation: K, input: Input<K>, requestOptions?: RequestOptions) {
      return prepare(operation, input)(requestOptions);
    },
  };
}
