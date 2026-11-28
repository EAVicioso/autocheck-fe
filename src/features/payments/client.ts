import type { Cita, Operations, Pago, Problem } from "@/shared/api/contract.generated";
import type { CitizenCommand } from "./contract";

type Responses = {
  start: Operations["POST /api/pagos/intentos"]["success"]["body"];
  payment: Pago;
  appointment: Cita;
  abandon: undefined;
  cancel: Operations["POST /api/citas/{id}/cancelacion"]["success"]["body"];
};

export class CitizenRequestError extends Error {
  constructor(readonly status: number, readonly problem: Problem | null, readonly retryAfter: string | null) {
    super("La solicitud no se pudo completar.");
  }
}

export async function citizenRequest<T extends CitizenCommand>(
  command: T, signal?: AbortSignal,
): Promise<Responses[T["action"]]> {
  const response = await fetch("/api/ciudadano", {
    method: "POST", credentials: "same-origin", cache: "no-store",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(command), signal,
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => null) as Problem | null;
    throw new CitizenRequestError(response.status, problem, response.headers.get("Retry-After"));
  }
  return response.status === 204 ? undefined as Responses[T["action"]] : response.json();
}
