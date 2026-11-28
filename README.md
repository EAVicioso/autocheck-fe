# AutoCheck Frontend

Next.js App Router, React, TypeScript estricto y Tailwind CSS v4.

## Desarrollo local

Usa la versión de Node de [.nvmrc](.nvmrc) y el lockfile de npm.

```sh
npm ci
npm run dev
```

Copia [.env.example](.env.example) a `.env.local` y ajusta `AUTOCHECK_API_URL` para usar identidad, asistencia y la verificación pública. La API debe poder validar los JWT e identificar la sesión registrada. Si Next está detrás de un proxy que modifica el origen, configura `AUTOCHECK_APP_ORIGIN` con el origen público exacto. Usa HTTPS en producción para las cookies Secure. Las variables públicas de Supabase solo se requieren para Broadcast y deben estar presentes al compilar el frontend. La disponibilidad también se actualiza por REST cada 30 segundos.

## Activación del QR web

En el entorno de **autocheck-api**, configura `Certificates__FrontendBaseUrl` con la base pública HTTPS de `autocheck-fe`. Los PDF nuevos enlazan a `/verificar/[id]?hash=…`. Conserva `Certificates__PublicBaseUrl` con la base pública del API. Se usa para el QR de respaldo que abre el JSON si falta `Certificates__FrontendBaseUrl`. Los PDF ya emitidos conservan sus bytes y el destino original. [PR #18 del API](https://github.com/EAVicioso/autocheck-api/pull/18)

En **autocheck-fe**, `AUTOCHECK_API_URL` indica la base del API que usa el servidor para la consulta anónima con el mismo ID y hash. La activación solo requiere configuración del API y no necesita migraciones.

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

El modo rápido de Playwright ejecuta el build de producción con un doble HTTP. Para regenerar el contrato usa `npm run contract:generate`. Consulta [AGENTS.md](AGENTS.md) para las reglas de trabajo y el estado de Stitch.

## E2E con la API real

El workflow [Frontend CI](.github/workflows/ci.yml) fija el SHA del backend y usa el token de Actions para leer el repositorio público. Si el backend pasa a ser privado, configura el secret `AUTOCHECK_API_READ_TOKEN` con permiso **Contents: Read** sobre `EAVicioso/autocheck-api`. Los proveedores, el certificado TLS del frontend y el firmante académico usan valores de prueba creados en el stack.

| Criterios | Evidencia actual |
| --- | --- |
| PA-01/02/11 | Navegador para registro, login, salida y rechazo de portales. HTTP para bloqueo y permisos de usuarios. |
| PA-03/04/12 | Navegador para crear vehículo, elegir horario, pagar, consultar y cancelar una cita. HTTP para disponibilidad, retención e idempotencia. El doble HTTP controla la pérdida de respuesta, el conflicto de horario y los estados terminales del pago. |
| PA-05/06/07/10 | HTTP para inspección, historial, emisión y PDF. Navegador para QR público. Los recorridos de inspección e historial requieren pantallas conectadas. |
| PA-08/09/11/12/13 | Navegador para reportes, asistencia, usuarios, centros y auditoría. Las pruebas rápidas controlan el reloj y el transporte con datos sintéticos. La suite con .NET verifica las lecturas y el flujo de asistencia. |

Los puertos locales se pueden ajustar con AUTOCHECK_E2E_FRONTEND_PORT y AUTOCHECK_E2E_BACKEND_PORT si ya hay otro entorno en ejecución.

Con Docker activo, coloca el checkout del backend en `.ci/autocheck-api` o ajusta `AUTOCHECK_API_CHECKOUT`. Desde la raíz, en PowerShell:

```powershell
docker compose -f docker-compose.e2e.yml up --build -d
curl.exe --fail --retry 60 --retry-all-errors --retry-delay 2 http://127.0.0.1:3401/health/ready
curl.exe --insecure --fail --retry 60 --retry-all-errors --retry-delay 2 https://127.0.0.1:3400/
npx playwright install chromium webkit
$env:AUTOCHECK_E2E_FULLSTACK = "1"
npx playwright test
Remove-Item Env:AUTOCHECK_E2E_FULLSTACK
docker compose -f docker-compose.e2e.yml down --volumes
```

PostgreSQL recibe migraciones del Dockerfile del backend y un seed local. Los tests de flujo que carecen de UI usan el cliente HTTP de Playwright contra la API real. Los fixtures de SRS identifican los límites faltantes de automatizar con el reloj real del backend.

## Reinspección desde el historial

El historial puede enlazar a `/ciudadano/citas/nueva?inspeccionAnteriorId=<id>`. El asistente consulta el rechazo y selecciona su vehículo activo. Si el historial también envía `vehiculo=<id>`, debe coincidir con el vehículo de la inspección.
