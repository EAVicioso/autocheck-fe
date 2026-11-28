import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RequestFailure } from "@/shared/api/deadline";
import { SectionApiError } from "@/core/section-server";
import type { AdminFeedback } from "./forms";

const capacityConflicts = new Map([
  ["CENTRO_CON_COMPROMISOS", "El centro tiene citas confirmadas o retenciones vigentes."],
  ["RAMPA_CON_COMPROMISOS", "La rampa tiene citas confirmadas o retenciones vigentes."],
  ["HORARIO_CON_COMPROMISOS", "El horario propuesto afecta citas confirmadas o retenciones vigentes."],
]);

const messages: Record<string, string> = {
  VERSION_DESACTUALIZADA: "El registro cambió. Recarga la página para revisar la versión vigente.",
  CAMBIO_PROPIO_NO_PERMITIDO: "Tu propio acceso requiere otro administrador autorizado.",
  ULTIMO_ADMINISTRADOR: "Debe conservarse un administrador global activo con gestión de usuarios.",
  ASIGNACIONES_PENDIENTES: "El usuario tiene asignaciones pendientes.",
  REGISTRO_DUPLICADO: "Ya existe un registro con esos datos.",
};

export function invalid(message: string): AdminFeedback {
  return { kind: "error", message };
}

export async function adminMutation<T>(execute: () => Promise<T>, path: string, message: string,
  redirectTo?: (result: T) => string): Promise<AdminFeedback> {
  let result: T;
  try {
    result = await execute();
  } catch (error) {
    if (error instanceof SectionApiError) {
      if (error.status === 401) redirect("/login?renovar=1");
      if (error.status === 403) return invalid("El servidor denegó el cambio.");
      if (error.status === 404) return invalid("El recurso no está disponible en tu alcance.");
      if (error.status === 400) return invalid("El servidor rechazó los datos. Revisa los valores y la vigencia.");
      if (error.status === 409) {
        const code = error.code ?? "";
        const capacityMessage = capacityConflicts.get(code);
        if (capacityMessage) return invalid(error.detail?.trim() || capacityMessage);
        return invalid(Object.hasOwn(messages, code) ? messages[code] : "El cambio entra en conflicto con el estado vigente.");
      }
    } else if (!(error instanceof RequestFailure)) {
      throw error;
    }
    return invalid("No se pudo confirmar el resultado. Consulta el estado vigente antes de volver a guardar.");
  }
  revalidatePath(path);
  if (redirectTo) redirect(redirectTo(result));
  return { kind: "notice", message };
}
