import "server-only";
import { autoCheckApi } from "@/shared/api/server";

export async function verifyCertificate(id: string, hash?: string) {
  try {
    const result = await autoCheckApi().request("GET /api/certificados/{id}/verificacion", {
      params: { id }, query: { hash },
    });
    if (result.ok) {
      const { certificadoId, emisionUtc, centro, resultado } = result.body;
      return { state: "verified", certificadoId, emisionUtc, centro, resultado } as const;
    }
    if (result.status === 404) return { state: "missing" } as const;
    if (result.status === 409) return { state: "integrity" } as const;
  } catch {
    // Configuration, network and malformed payloads produce the same public state.
  }
  return { state: "unavailable" } as const;
}
