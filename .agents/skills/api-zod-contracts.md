# API, contratos y Zod

Lee [API_CONTRACT.md](../../API_CONTRACT.md). Genera `src/shared/api/contract.generated.ts` con `npm run contract:generate` y verifica invariancia con `npm run contract:check`. Las 57 operaciones mantienen casing, estados, headers e Int64. Una marca `[PENDIENTE_EN_BACKEND]` indica operación indisponible. Prohíbe endpoints inventados y CORS mediante acceso directo a proveedores.

Usa `src/shared/api/client.ts`, la frontera server/BFF, Bearer solo para el backend y cancelación. Diferencia auth de transporte, auth de aplicación, 403, 409, 429 y red. Mantén `Problem Details`, campos, `Retry-After` y cursores opacos. Usa `Idempotency-Key` en los endpoints documentados de retención/pago y mutaciones anexas. Conserva bytes, ruta y clave en resultado incierto. El webhook HMAC queda entre servicios. Maneja 204 sin cuerpo y PDF como bytes.

Co-localiza validaciones Zod y conecta RHF con `zodResolver` y `FormField`. Para registro y cambio de contraseña aplica de 8 a 256 caracteres con al menos una letra y un número Unicode, según el contrato. Mantén separado el esquema de login. Remapea PascalCase e índices de validación del servidor.

PA-09. `POST /api/asistencia` requiere sesión, trim y 1–2000 caracteres. Valida los enums cerrados en `src/features/assistance/contract.ts`. Conserva el deadline contractual de 3 s (dentro del máximo de 3,5 s), señal AbortController durante la solicitud y reintento explícito. Ante timeout o HTTP 503 muestra «El servicio de asistencia no está disponible temporalmente. Intenta de nuevo.».
