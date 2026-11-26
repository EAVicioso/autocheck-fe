# AutoCheck Frontend

Next.js App Router, React, TypeScript estricto y Tailwind CSS v4.

## Desarrollo local

Usa la versión de Node de [.nvmrc](.nvmrc) y el lockfile de npm.

```sh
npm ci
npm run dev
```

Copia [.env.example](.env.example) a `.env.local` y ajusta `AUTOCHECK_API_URL` para usar identidad, asistencia y la verificación pública. La API debe poder validar los JWT e identificar la sesión registrada. Si Next está detrás de un proxy que modifica el origen, configura `AUTOCHECK_APP_ORIGIN` con el origen público exacto. Usa HTTPS en producción para las cookies Secure. Las variables públicas de Supabase solo se requieren para Broadcast y deben estar presentes al compilar el frontend.

## Verificación

```sh
npm run contract:check
npm run lint
npm run typecheck
npm run build
npm run test:unit
npx playwright install chromium
npm run test:e2e
```

El modo rápido de Playwright utiliza un doble HTTP. Para regenerar el contrato usa `npm run contract:generate`. Consulta [AGENTS.md](AGENTS.md) para las reglas de trabajo y el estado de Stitch.

## E2E con la API real

El workflow [Frontend CI](.github/workflows/ci.yml) fija el SHA del backend y usa el token de Actions para leer el repositorio público. Si el backend pasa a ser privado, configura el secret `AUTOCHECK_API_READ_TOKEN` con permiso **Contents: Read** sobre `EAVicioso/autocheck-api`. Los proveedores y el firmante académico usan valores de prueba creados en el stack.

| Criterios | Evidencia actual |
| --- | --- |
| PA-01/02/11 | Navegador para registro, login, salida y rechazo de portales. HTTP para bloqueo y permisos de usuarios. |
| PA-03/04/12 | HTTP para disponibilidad, pago, idempotencia y confirmación. Los recorridos de cita y pago requieren pantallas conectadas. |
| PA-05/06/07/10 | HTTP para inspección, historial, emisión y PDF. Navegador para QR público. Los recorridos de inspección e historial requieren pantallas conectadas. |
| PA-08/09/13 | Navegador para asistencia. HTTP para métricas y auditoría. Los recorridos de administración requieren pantallas conectadas. |

Con Docker activo, coloca el checkout del backend en `.ci/autocheck-api` o ajusta `AUTOCHECK_API_CHECKOUT`. Desde la raíz, en PowerShell:

```powershell
docker compose -f docker-compose.e2e.yml up --build -d
curl.exe --fail --retry 60 --retry-all-errors --retry-delay 2 http://127.0.0.1:3401/health/ready
curl.exe --fail --retry 60 --retry-all-errors --retry-delay 2 http://127.0.0.1:3400/
npx playwright install chromium webkit
$env:AUTOCHECK_E2E_FULLSTACK = "1"
npx playwright test
Remove-Item Env:AUTOCHECK_E2E_FULLSTACK
docker compose -f docker-compose.e2e.yml down --volumes
```

PostgreSQL recibe migraciones del Dockerfile del backend y un seed local. Los tests de flujo que carecen de UI usan el cliente HTTP de Playwright contra la API real. Los fixtures de SRS identifican los límites faltantes de automatizar con el reloj real del backend.
