import { z } from "zod";
import { dominicanLocalToUtc } from "@/core/dominican-range";
import { optionalId } from "@/core/search";
import type { Horario, Permiso, Rol, Version } from "@/shared/api/contract.generated";

export const roles = ["Ciudadano", "Inspector", "Administrador"] as const satisfies readonly Rol[];
export const permissionLabels = {
  "usuarios.gestionar": "Gestionar usuarios",
  "centros.gestionar": "Gestionar centros",
  "reglas.gestionar": "Gestionar reglas",
  "auditoria.consultar": "Consultar auditoría",
} as const satisfies Record<Permiso, string>;

export const accessForm = z.object({
  rol: z.enum(roles),
  centroId: optionalId.transform((value) => value ?? null),
  permisos: z.array(z.enum(permissionLabelsKeys())).transform((values) => [...new Set(values)]),
  activo: z.boolean(),
}).refine(({ rol, centroId }) => rol !== "Inspector" || centroId !== null)
  .transform((data) => ({ ...data, permisos: data.rol === "Administrador" ? data.permisos : [] }));

function permissionLabelsKeys() {
  return Object.keys(permissionLabels) as Permiso[];
}

export function parseVersion(version: string): Version | null {
  if (!/^[1-9][0-9]{0,18}$/.test(version)) return null;
  const value = BigInt(version);
  if (value > BigInt("9223372036854775807")) return null;
  return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : value;
}

export const centerForm = z.object({
  nombre: z.string().trim().min(1).max(120),
  direccion: z.string().trim().min(1).max(300),
  activo: z.boolean(),
});

export const rampForm = z.object({
  nombre: z.string().trim().min(1).max(80),
  activa: z.boolean(),
});

export const weekdays = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;

function minutes(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^(?:(?:[01]\d|2[0-3]):(?:00|30)|24:00)$/.test(value)) return NaN;
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function clockLabel(minutes: number) {
  return [Math.floor(minutes / 60), minutes % 60].map((part) => String(part).padStart(2, "0")).join(":");
}

export function scheduleForm(data: FormData): Horario[] | null {
  const schedule: Horario[] = [];
  for (let dia = 0; dia < weekdays.length; dia++) {
    if (!data.has("dia-" + dia)) continue;
    const aperturaMinutos = minutes(data.get("apertura-" + dia));
    const cierreMinutos = minutes(data.get("cierre-" + dia));
    if (!(aperturaMinutos < cierreMinutos)) return null;
    schedule.push({ dia, aperturaMinutos, cierreMinutos });
  }
  return schedule;
}

export const ruleForm = z.object({
  m: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(2_147_483_647)),
  vigencia: z.iso.datetime({ local: true }).refine((value) => /^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value)),
}).transform(({ m, vigencia }) => ({ m, vigenciaUtc: dominicanLocalToUtc(vigencia) }));
