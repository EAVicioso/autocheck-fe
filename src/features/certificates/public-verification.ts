import "server-only";
import { z } from "zod";
import { autoCheckApi } from "@/shared/api/server";

const publicCertificate = z.object({
  certificadoId: z.guid(),
  emisionUtc: z.iso.datetime({ offset: true }).refine((value) => Number.isFinite(Date.parse(value))),
  centro: z.string(),
  resultado: z.literal("Aprobado"),
});

export async function verifyCertificate(id: string, hash?: string) {
  try {
    const result = await autoCheckApi().request("GET /api/certificados/{id}/verificacion", {
      params: { id }, query: { hash },
    });
    if (result.ok) {
      const certificate = publicCertificate.safeParse(result.body);
      return certificate.success ? { state: "verified", ...certificate.data } as const : { state: "unavailable" } as const;
    }
    if (result.status === 404) return { state: "missing" } as const;
    if (result.status === 409) return { state: "integrity" } as const;
  } catch {
    // Configuration, network and malformed payloads produce the same public state.
  }
  return { state: "unavailable" } as const;
}
