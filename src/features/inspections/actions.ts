"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/features/identity/guards";
import { portalError, portalRequest } from "./backend";
import { defectListSchema, inspectionIdSchema, versionSchema } from "./defects";
import type { Inspeccion } from "@/shared/api/contract.generated";

type ActionFailure = { message: string; conflict?: boolean; fields?: Record<string, string[]> };
export type InspectionActionResult = { inspection: Inspeccion } | ActionFailure;

export async function startInspection(id: string): Promise<ActionFailure> {
  if (!inspectionIdSchema.safeParse(id).success) return { message: "La cita no es válida." };
  if (!await requireRole("Inspector")) return { message: "No se pudo validar la sesión." };
  const result = await portalRequest("POST /api/inspecciones", {
    headers: { "Idempotency-Key": "inspection-start:" + id },
    body: { citaId: id },
  });
  if (!result?.ok) return { message: portalError(result) };
  redirect("/inspector/inspecciones/" + result.body.id);
}

export async function saveDefects(id: string, version: number, input: unknown): Promise<InspectionActionResult> {
  const parsed = defectListSchema.safeParse(input);
  if (!inspectionIdSchema.safeParse(id).success || !versionSchema.safeParse(version).success || !parsed.success) {
    return { message: "Revisa los datos del registro." };
  }
  if (!await requireRole("Inspector")) return { message: "No se pudo validar la sesión." };
  const result = await portalRequest("PUT /api/inspecciones/{id}/registro", {
    params: { id },
    body: { versionEsperada: version, defectos: parsed.data.defectos },
  });
  if (result?.ok) return { inspection: result.body };
  return { message: portalError(result), conflict: result?.status === 409, fields: result?.error?.errors };
}

export async function closeInspection(id: string, version: number): Promise<InspectionActionResult> {
  if (!inspectionIdSchema.safeParse(id).success || !versionSchema.safeParse(version).success) {
    return { message: "La versión del registro no es válida." };
  }
  if (!await requireRole("Inspector")) return { message: "No se pudo validar la sesión." };
  const result = await portalRequest("POST /api/inspecciones/{id}/cierre", {
    params: { id },
    headers: { "Idempotency-Key": "inspection-close:" + id + ":" + version },
    body: { versionEsperada: version },
  });
  return result?.ok ? { inspection: result.body } : { message: portalError(result), conflict: result?.status === 409 };
}
