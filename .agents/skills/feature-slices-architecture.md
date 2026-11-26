# Vertical slices y reglas de dominio

Co-localiza vista, esquema Zod, adaptador y pruebas de cada caso bajo `src/features/{slice}/`. Mantén `src/app/` delgado. Usa Server Components por defecto y Client Components para estado e interacción. Conserva infraestructura existente en `src/shared/`; `src/core/` queda bajo responsabilidad C si incorpora infraestructura transversal nueva. Conserva las diferencias entre Stitch, SRS y el contrato desplegado.

- RF-CIT-01–03, PA-03/04/12. Seleccionar un bloque de 30 min consulta disponibilidad. La llamada de pago sandbox inicia la retención de 300 s. Renderiza `CountdownTimer expiresAtUtc={expiraUtc}` y confirma por GET. Una aprobación tardía revierte una vez. Cancelación exige titular, cita confirmada y sin inspección iniciada. Reagendar es cancelar, reservar y pagar nuevamente.
- PA-05/10. Inspector asignado y en centro. El backend congela M y reglas. El registro vacío representa cero defectos. La ausencia de registro impide cerrar. El cliente muestra el veredicto del backend, sin repetir cálculo autoritativo. Una reinspección crea nueva cita e inspección a partir de un rechazo del mismo vehículo y titular.
- PA-06/07. Una inspección cerrada y aprobada puede reservar certificado. Consulta el estado por GET, porque un replay puede conservar 202. El PDF firmado requiere titular. Los QR emitidos abren el JSON de la API. La ruta web conserva `hash`.
- PA-08/13. Consume métricas de servidor y `ultimaActualizacionUtc`. El filtro por rampa preserva el denominador de la ventana. Auditoría global exige permiso y centro nulo.
- Disponibilidad Realtime. Su evento invalida y vuelve a consultar REST. Limpia con `unsubscribe`/removeChannel y aborta al desmontar, cambiar de centro o salir. Revalida tras reconexión y vencimiento.

[Invariantes y handoff](../../BACKEND_CONTEXT_TRANSFER.md)
