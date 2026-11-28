import { z } from "zod";
import { uuid } from "@/core/search";

export const vehicleForm = z.object({
  matricula: z.string().trim().regex(/^[a-z0-9-]{1,20}$/i, "Usa hasta 20 letras, números o guiones."),
  vin: z.string().trim().regex(/^[A-HJ-NPR-Z0-9]{17}$/i, "El VIN debe tener 17 caracteres y omitir I, O y Q."),
  anio: z.string().regex(/^[0-9]{4}$/).refine((year) => Number(year) >= 1900 && Number(year) <= 2100, "Ingresa un año entre 1900 y 2100."),
  modeloId: uuid,
  colorId: uuid,
});

export type VehicleValues = z.infer<typeof vehicleForm>;

