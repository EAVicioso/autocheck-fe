export const pendingBackendOperations = {
  bandejaNotificaciones: "PENDIENTE_EN_BACKEND",
  exportarReportes: "PENDIENTE_EN_BACKEND",
  pasarelaReal: "PENDIENTE_EN_BACKEND",
  editarCatalogosRbac: "PENDIENTE_EN_BACKEND",
  crearCitaSeparada: "PENDIENTE_EN_BACKEND",
  confirmarCitaSeparada: "PENDIENTE_EN_BACKEND",
  reagendarCita: "PENDIENTE_EN_BACKEND",
} as const;

export function backendCapability(operation: keyof typeof pendingBackendOperations) {
  return { available: false, reason: pendingBackendOperations[operation] } as const;
}
