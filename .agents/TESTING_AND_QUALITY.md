# Pruebas y calidad

Usa Node de `.nvmrc` y el lockfile de npm. En CI, ejecuta con permisos mínimos y servicios de prueba aislados.

| Comando | Evidencia |
| --- | --- |
| `npm ci` | Instalación reproducible, estado del lockfile y resultado de auditoría. |
| `npm run contract:check` | Valida generación determinista y 57 operaciones. |
| `npm run lint` | ESLint del proyecto. |
| `npm run typecheck` | Generación de tipos de rutas App Router y TypeScript estricto. |
| `npm run build` | Compilación y prerender con Cache Components. |
| `npm test` | Vitest y React Testing Library. |
| `npx playwright install chromium` y `npm run test:e2e` | Navegador Chromium, Next y backend local con fixtures. |

- Identidad · CU-01/02/11, RS-09/10/11. Comprueba alta, login, recuperación, perfiles, centro, permisos, cookie HttpOnly, CSRF, refresh deduplicado, expiración y acceso directo sin permiso. Usa reloj controlado para la inactividad y comprueba que polling y refresh preservan el reloj.
- Disponibilidad, pago e inspección · RF-CIT-01–03, RF-INS-01, PA-03–05. Verifica ID y filtros preservados al invalidar, relectura de REST tras Broadcast y reconexión, cancelación de lecturas obsoletas, idempotencia, reversiones y límites temporales. Añade pruebas de cierre y propiedad al construir flujos completos.
- Certificados · RF-CER-01/02, PA-06/07. Casos de PDF original, 204, emisión 202, GET de estado y QR con 200/404/409. Afirma ausencia de datos privados en la vista pública.
- Asistencia · RF-CHAT-01/02, PA-09. Comprueba formulario en sesión validada, esquema estricto, deadline con cancelación, contingencia, cancelaciones del usuario y ausencia de refresh o replay.
- Diseño. Tras consultar Stitch, registra revisión y pruebas de teclado, foco, contraste, objetivos táctiles y vista de móvil y tableta.
- Usa identificadores sintéticos, fixtures y servicios aislados. Mantén trazabilidad RF, RS, CU, PA o DT en cada cambio. Registra comandos y evidencia de revisión. La disponibilidad del upstream, proveedores del backend, políticas Supabase, navegador real de Inspector y ajustes de enrutamiento QR requieren evidencia independiente.

El restore, build y test del backend quedaron bloqueados por NU1900 al consultar NuGet según el handoff. Conserva el estado de esa evidencia al informar la ejecución del frontend.
