"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/features/identity/guards";
import { portalError, portalRequest } from "@/features/inspections/backend";
import { inspectionIdSchema } from "@/features/inspections/defects";

export async function requestCertificate(id: string): Promise<{ message: string }> {
  if (!inspectionIdSchema.safeParse(id).success) return { message: "La inspección no es válida." };
  if (!await requireRole("Ciudadano")) return { message: "No se pudo validar la sesión." };
  const response = await portalRequest("POST /api/inspecciones/{id}/certificado", {
    params: { id }, headers: { "Idempotency-Key": "certificate:" + id },
  });
  if (!response?.ok) return { message: portalError(response) };
  redirect("/ciudadano/certificados/" + response.body.id);
}
