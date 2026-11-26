import { NextResponse, type NextRequest } from "next/server";
import type { ContractHeaders } from "@/shared/api/client";

const noStore = { "Cache-Control": "no-store" };

export function sameOrigin(request: NextRequest) {
  return request.headers.get("Origin") === (process.env.AUTOCHECK_APP_ORIGIN || request.nextUrl.origin);
}

export function isJsonRequest(request: Request) {
  return request.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase() === "application/json";
}

export async function boundedJson(request: Request, signal = request.signal): Promise<unknown> {
  signal.throwIfAborted();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("Falta el cuerpo JSON.");
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", cancel, { once: true });
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let body = "";
  try {
    for (;;) {
      const part = await reader.read();
      signal.throwIfAborted();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 128 * 1024) throw new SyntaxError("Cuerpo mayor a 128 KiB.");
      body += decoder.decode(part.value, { stream: true });
    }
    return JSON.parse(body + decoder.decode());
  } finally {
    signal.removeEventListener("abort", cancel);
    cancel();
    reader.releaseLock();
  }
}

export function bffResponse(status: number, body?: unknown, upstream?: ContractHeaders, media?: string) {
  const headers = new Headers(noStore);
  if (upstream?.retryAfter) headers.set("Retry-After", upstream.retryAfter);
  if (upstream?.location) headers.set("Location", upstream.location);
  if (upstream?.contentDisposition) headers.set("Content-Disposition", upstream.contentDisposition);
  if (media && body != null) headers.set("Content-Type", media);
  return status === 204 || body == null ? new NextResponse(null, { status, headers })
    : NextResponse.json(body, { status, headers });
}
