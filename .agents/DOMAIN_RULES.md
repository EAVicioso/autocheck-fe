# Reglas de dominio y trazabilidad

Fuente [BACKEND_CONTEXT_TRANSFER.md](../BACKEND_CONTEXT_TRANSFER.md). Consulta cada ficha del [contrato](../API_CONTRACT.md) al implementar su caso.

| Área | Invariantes y flujo |
| --- | --- |
| Identidad · CU-01/02/11, PA-01/02/11, RS-09/10/11 | Roles Ciudadano, Inspector, Administrador. Perfil funcional desde `GET /api/usuarios/me`. Admin global tiene centro null. Los permisos y el centro limitan al admin local. La sesión vence a los 60 min exactos sin actividad. Cuenta 15 min de bloqueo desde el quinto fallo de login, que aún devuelve 401. La recuperación consume TokenHash una vez y revoca sesiones según el resultado descrito en el handoff. |
| Reserva y pago · RF-CIT-01–03, CU-03/04, PA-03/04 | Bloques de 30 min. Retención exclusiva de 300 s según `expiraUtc`. El intento de pago simulado crea la retención. GET del intento confirma estado. Una aprobación a partir del límite revierte una sola vez. Cancelar antes del inicio requiere titular y cita confirmada sin inspección iniciada. El cambio de horario es cancelar y volver a reservar y pagar. |
| Inspección · RF-INS-01, CU-05/08/10, PA-05/10 | Cita confirmada y pagada. Inspector asignado en su centro. Se congelan versión de reglas y M. Rechazo si G ≥ 1, Md ≥ 2 o L > M, sumando cantidades. Un registro vacío equivale a cero defectos. Cierre con ausencia de registro o revisión desactualizada se rechaza. Una reinspección parte de un rechazo previo del mismo vehículo y titular, con cita e inspección nuevas. |
| Certificado · RF-CER-01/02, CU-06/07, PA-06/07 | Solo inspección cerrada y aprobada. ID estable. 202 `PENDIENTE` o 200 `EMITIDO`. Polling por GET del certificado aunque el replay conserve 202. PDF privado al titular. El estado público de integridad usa el hash y solo puede mostrar certificadoId, emisionUtc, centro, resultado. |
| Reportes · RF-DAS-01–03, PA-08 | Día del cierre en America/Santo_Domingo. Porcentaje de rechazo null sin datos. Alerta de 20 o 21 aprobadas en 21 cierres consecutivos por inspector y centro. `ultimaActualizacionUtc` indica la vigencia de la consolidación eventual. Auditoría global exige permiso y centro null. |
| Asistencia · RF-CHAT-01/02, CU-09, PA-09, IS-05 | Actor registrado. Consulta tras trim de 1 a 2000 caracteres. FAQ o IA informativa. Evita tokens y PII innecesaria. Sin acciones de negocio. |

Usa UTC para instantes y YYYY-MM-DD para días dominicanos. Las etiquetas del SRS identifican la intención y la prueba asociada. El comportamiento actual conserva las diferencias documentadas, incluidas reserva por intento de pago, QR que abre JSON, bandeja HTTP de notificaciones, exportación, pasarela real y edición libre RBAC pendientes. La configuración Realtime desplegada y el SRS externo quedan sin verificar.
