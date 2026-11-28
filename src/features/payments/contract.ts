import { z } from "zod";
import { uuid } from "@/core/search";

export const bookingInput = z.strictObject({
  vehiculoId: uuid,
  centroId: uuid,
  rampaId: uuid,
  inicioUtc: z.iso.datetime({ offset: true }),
  inspeccionAnteriorId: uuid.optional(),
});

const key = uuid;

export const citizenCommand = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("start"), key, body: bookingInput }),
  z.strictObject({ action: z.literal("payment"), id: uuid }),
  z.strictObject({ action: z.literal("abandon"), id: uuid }),
  z.strictObject({ action: z.literal("appointment"), id: uuid }),
  z.strictObject({ action: z.literal("cancel"), id: uuid, key, motivo: z.string().trim().min(1).max(300) }),
]);

export type CitizenCommand = z.infer<typeof citizenCommand>;
export type StartCommand = Extract<CitizenCommand, { action: "start" }>;
export const startCommand = citizenCommand.options[0];
