import { z } from "zod";

export const severities = ["Leve", "Mediano", "Grave"] as const;
export const defectSchema = z.object({
  categoria: z.string().min(1, "Selecciona una categoría."),
  subcategoria: z.string().min(1, "Selecciona una subcategoría."),
  descripcion: z.string().trim().min(1, "Describe el defecto.").max(300, "Usa hasta 300 caracteres."),
  severidad: z.enum(severities),
  cantidad: z.number().int().min(1, "Indica al menos un defecto.").max(100, "El máximo es 100."),
});

export const inspectionIdSchema = z.guid();
export const versionSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const defectListSchema = z.object({ defectos: z.array(defectSchema).max(100) });
export type DefectForm = z.input<typeof defectListSchema>;
