import type { Asistencia } from "@/shared/api/contract.generated";
import { RequestFailure, withinDeadline } from "@/shared/api/deadline";
import { assistanceFallback, assistanceReply, assistanceTimeoutHeader, assistanceTimeoutMs } from "./contract";

export type AssistanceResult = {
  source: "http" | "local-timeout";
  status: number | null;
  reply: Asistencia | null;
};

export async function askAssistance(
  input: { consulta: string }, signal?: AbortSignal, fetcher = fetch,
): Promise<AssistanceResult> {
  try {
    return await withinDeadline(assistanceTimeoutMs, signal, async (deadline) => {
      const response = await fetcher("/api/asistencia", {
        method: "POST", body: JSON.stringify(input), signal: deadline,
        headers: { "Content-Type": "application/json" }, cache: "no-store", credentials: "same-origin",
      });
      const payload: unknown = await response.json().catch(() => null);
      const parsed = assistanceReply.safeParse(payload);
      const source = response.headers.get(assistanceTimeoutHeader) === "1" ? "local-timeout" : "http";
      return { source, status: response.status, reply: parsed.success ? parsed.data : null };
    });
  } catch (error) {
    if (error instanceof RequestFailure && error.kind === "timeout") {
      return { source: "local-timeout", status: null, reply: assistanceFallback };
    }
    throw error;
  }
}
