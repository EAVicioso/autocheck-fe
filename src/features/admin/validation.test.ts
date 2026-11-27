import { expect, it } from "vitest";
import { accessForm, parseVersion, ruleForm, scheduleForm } from "./validation";

const center = "00000000-0000-4000-8000-000000000001";

it("exige centro para inspector, quita permisos al revocar Administración y conserva Int64", () => {
  const base = { rol: "Inspector", permisos: ["auditoria.consultar"], activo: true };
  expect(accessForm.safeParse(base).success).toBe(false);
  expect(accessForm.parse({ ...base, centroId: center })).toMatchObject({ permisos: [], centroId: center });
  expect(accessForm.parse({ ...base, rol: "Administrador" }).permisos).toEqual(["auditoria.consultar"]);
  expect(parseVersion("9223372036854775807")).toBe(BigInt("9223372036854775807"));
  expect(parseVersion("9223372036854775808")).toBeNull();
});

it("acepta cierre a las 24:00 y rechaza horarios invertidos o fuera de la cuadrícula", () => {
  const form = new FormData();
  form.set("dia-1", "on");
  form.set("apertura-1", "23:30");
  form.set("cierre-1", "24:00");
  expect(scheduleForm(form)).toEqual([{ dia: 1, aperturaMinutos: 1410, cierreMinutos: 1440 }]);
  form.set("cierre-1", "23:00");
  expect(scheduleForm(form)).toBeNull();
  form.set("cierre-1", "23:59");
  expect(scheduleForm(form)).toBeNull();
  form.delete("dia-1");
  expect(scheduleForm(form)).toEqual([]);
});

it("envía un M entero no negativo y la vigencia dominicana como UTC", () => {
  const vigencia = "2026-11-26T23:50";
  expect(ruleForm.parse({ m: "0", vigencia })).toEqual({ m: 0, vigenciaUtc: "2026-11-27T03:50:00.000Z" });
  for (const m of ["", "-1", "3.5", "2147483648"]) expect(ruleForm.safeParse({ m, vigencia }).success).toBe(false);
});
