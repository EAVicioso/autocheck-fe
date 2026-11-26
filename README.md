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
npm test
npx playwright install chromium
npm run test:e2e
```

El navegador de Playwright usa un backend local aislado. Para regenerar el contrato usa `npm run contract:generate`. Consulta [AGENTS.md](AGENTS.md) para las reglas de trabajo y el estado de Stitch.
