# Sesión, RBAC y tiempo

Valida el actor en servidor con `GET /api/usuarios/me`. Las vistas usan roles Ciudadano, Inspector y Administrador del contrato. Autoriza los casos por permiso, propietario, asignación y centro con la API. El contexto React refleja la sesión. Prohíbe confiar en controles ocultos, claims editables o roles contenidos en los diseños. Conserva cookies HttpOnly Secure en producción, comprobación de Origin, refresh deduplicado y revocación. Evita credenciales, JWT, PII y hashes sensibles en logs.

RS-09–11. Ante cinco fallos, maneja el 401 del quinto y el bloqueo de 15 min a partir del servidor. Usa `Retry-After` si existe. Rastrea 60 min de inactividad con acciones reales y cierra sesión. Polling y refresh jamás renuevan el reloj. La sesión de backend sigue autoritativa. Recuperación usa TokenHash una vez y revoca sesiones según contrato.

Usa `src/shared/dates/dominican.ts` y `America/Santo_Domingo` para presentación, día civil y estadísticas. Conserva YYYY-MM-DD para fechas sin hora y UTC para instantes. Evita interpretar un input date como medianoche UTC. El código cliente presenta veredictos, plazos y verificaciones del backend. Prohíbe cálculos autoritativos de defecto/veredicto o SHA-256.
