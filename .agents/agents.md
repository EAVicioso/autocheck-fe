<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:autocheck-frontend-rules -->
# AutoCheck frontend project rules

## System Architecture & Tech Stack Overview

AutoCheck uses React and Next.js App Router in `src/app/`, strict TypeScript (`@/*` maps to `src/*`), Tailwind CSS v4, React Hook Form with Zod, and Supabase Auth via `@supabase/ssr` and `@supabase/supabase-js`. The intended backend is a C# .NET 10 Minimal API accessed over REST. Use typed, validated boundary models, protect secrets on the server, and inject Supabase JWT Bearer tokens only for trusted backend requests. The existing repository is an initial scaffold: proposed architecture and integrations must not be described as already implemented.

## Next.js App Router & Folder Conventions

Read relevant installed Next.js guides before code changes. Keep routes and nested layouts in `src/app/`; use `(auth)` and `(dashboard)` route groups for layout isolation without URL segments, avoiding path collisions. Pages and layouts are Server Components by default; use `"use client"` only at interactive boundaries and pass serializable props. Place reusable primitives in `src/components/ui/`, shared compositions in `src/components/shared/`, and feature-specific code close to its feature. Introduce directories when needed.

## Form & Validation Protocol

Define Zod schemas near features or in shared validation modules, derive types with `z.infer` (and input/output types for transforms), and connect React Hook Form via `zodResolver` from `@hookform/resolvers/zod`. Provide accessible labels and errors, explicit defaults, pending states and server-error handling. The API must validate independently.

## Auth & RBAC Middleware Rules

Use Supabase SSR clients with appropriate cookie handling and verify identity on the server. Obtain authorization from trusted backend-controlled roles or authoritative server data for `Propietario`, `Inspector`, `AdminTaller` and `AdminINTRANT`; deny missing or unknown roles. Protect server data access, actions and route handlers, and require independent .NET API authorization. Client session context is for UI state only. Next.js 16 calls middleware `proxy.ts` (`src/proxy.ts`); use it only for appropriate cookie refresh or optimistic redirects, never as the sole authorization boundary.

## Styling & UI Design Tokens

Map approved Stitch UI specifications to semantic Tailwind v4 theme tokens and existing CSS variables in `src/app/globals.css`. Build responsive, accessible, reusable UI primitives with keyboard support and visible focus. Use `clsx` and `tailwind-merge` for conditional/overrideable classes where useful; avoid inventing design specifications.

## Build, Test & Lint Commands

- `npm run dev` — development server.
- `npm run build` — production build.
- `npm run lint` — ESLint.
- `npm run test` — run Vitest and React Testing Library tests; `npm run test:watch` runs watch mode.
- `npx playwright test` or `npm run test:e2e` — run Playwright E2E tests. Install Chromium first with `npx playwright install chromium`.

Use Node `26.13.0` from `.nvmrc` (the package engine minimum is `22.23.4`). Vercel and GitHub Actions are intended deployment/CI targets; check existing configuration before assuming they are set up.

## Skills Registry Index

1. [`app-router.md`](skills/app-router.md)
2. [`design-system.md`](skills/design-system.md)
3. [`forms-validation.md`](skills/forms-validation.md)
4. [`auth-rbac.md`](skills/auth-rbac.md)
5. [`rest-api.md`](skills/rest-api.md)
6. [`state-hooks.md`](skills/state-hooks.md)
7. [`testing-quality.md`](skills/testing-quality.md)
8. [`runtime-delivery.md`](skills/runtime-delivery.md)
9. [`design-system-compliance.md`](skills/design-system-compliance.md)

<!-- END:autocheck-frontend-rules -->

## UI Design System Rules (DESIGN.md Compliance)

Follow the root `DESIGN.md` for all visual tokens and Tailwind CSS styling: dominant `#FFFFFF`, secondary `#0052CC`, accent `#CF6625`, dark neutral `#001E4D`, and light neutral `#D8E8FF`. Translate these into reusable semantic tokens.

Use interconnected node steppers for authentication, appointment scheduling and payment progress; solid or gradient progress bars are prohibited. Follow the specified node and connector states in `DESIGN.md`.

Sidebar buttons use an 8px radius and 10px vertical / 16px horizontal padding. Main cards use a 12px radius, main sections use 24px container padding, and grids use a 16px gap. Apply the specified card shadow and navigation states.
