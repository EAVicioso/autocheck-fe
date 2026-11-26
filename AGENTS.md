<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AutoCheck frontend

## System Architecture & Tech Stack Overview

App Router, React y TypeScript estricto. Usa Tailwind CSS, React Hook Form + Zod, React Context, Supabase Auth/Realtime, Vitest/RTL y Playwright. Lee [contrato HTTP](API_CONTRACT.md) y [handoff de dominio](BACKEND_CONTEXT_TRANSFER.md); conserva sus diferencias con el SRS y los diseños. Las operaciones `[PENDIENTE_EN_BACKEND]` están indisponibles. Ante divergencia consulta antes de alterar el contrato.

## Ownership & Division of Responsibilities

| Owner | Slices y responsabilidades |
| --- | --- |
| A · Sebastián Tavares | `src/features/{citizen,vehicles,appointments,payments}/`. Registro/perfil, vehículos, citas, Realtime y pago sandbox (CU-01–04). |
| B · Manuel Polo | `src/features/{inspections,certificates,history}/`, `src/app/verificar/`. Inspección táctil, cierre, historial, PDF y QR sin PII (CU-05–07, CU-10). |
| C · Engels Vicioso | `src/components/ui/`, `src/core/`, `src/features/{admin,dashboards,audit,chatbot}/`. Primitivos, Auth/RBAC, centros/rampas/M, métricas, alertas, auditoría y chatbot (CU-08/09/11–13). El bootstrap conserva asistencia en `src/features/assistance/`. |

## Vertical Slice Implementation Standard

Mantén rutas delgadas, Server Components por defecto, fronteras Client explícitas y código/pruebas por caso. Usa exclusivamente los primitivos de `src/components/ui/` para botones, campos, tablas, modales, badges y tarjetas. Si falta capacidad, extiende primero el primitivo con prueba co-localizada. Consulta y registra Stitch antes de cambiar pantallas. La API comprueba roles, propiedad, asignación, centro y permisos. Los secretos quedan en servidor.

## Testing & CI Definition of Done

Por feature o fix, agrega Vitest/RTL y actualiza Playwright para flujos críticos (PA-01–13). Exige `tsc --noEmit`, `eslint --max-warnings=0`, `test:unit` y `build` limpios. Ejecuta generación de tipos de Next antes de TypeScript.

## Git & Pull Request Workflow

Prohíbe editar o hacer push directo a `main`. Usa `feat/{owner}-{slice}`, `fix/{owner}-{issue}` y `chore/{scope}`. Revisa A → B → C → A. Usa la [plantilla de PR](.github/PULL_REQUEST_TEMPLATE.md) con RF, CU y PA.

## Skills Registry Index

1. [UI y Design System](.agents/skills/ui-design-system.md)
2. [Flujo Stitch MCP](.agents/skills/stitch-mcp-workflow.md)
3. [Arquitectura por slice](.agents/skills/feature-slices-architecture.md)
4. [API y contratos Zod](.agents/skills/api-zod-contracts.md)
5. [RBAC, seguridad y zona horaria](.agents/skills/rbac-security-timezone.md)
6. [Pruebas y CI](.agents/skills/testing-e2e-ci.md)
7. [Git y PR](.agents/skills/git-pr-workflow.md)
