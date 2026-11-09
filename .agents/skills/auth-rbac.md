# Supabase SSR authentication and RBAC

1. Read the installed Next.js authentication and proxy guides and the installed Supabase integration conventions before implementation. Keep browser and server clients separate under `src/lib/` and use `@supabase/ssr` cookie integration appropriate to each environment.
2. Verify identity server-side using a Supabase-supported verified claims/user method; never authorize from unverified cookie data, client context, editable metadata or a decoded but unverified JWT. Keep service-role keys and secrets server-only.
3. Define a typed mapping for `Propietario`, `Inspector`, `AdminTaller` and `AdminINTRANT` based on trusted backend-controlled claims or authoritative server data; deny missing and unknown roles. Confirm exact backend claim names and policies before implementing.
4. Guard protected data access and each server action, route handler or backend operation at the server boundary; the .NET API must independently enforce authorization and resource ownership. Redirect unauthenticated users safely and handle forbidden access separately.
5. Next.js 16 uses `src/proxy.ts`, not `middleware.ts`. A proxy may refresh cookies or perform optimistic redirects when needed, but is not the sole authorization or session-management boundary. Follow current cookie propagation guidance.
6. Client context may reflect session state for UI only; subscribe and clean up appropriately, handle sign-out and expiration, and never treat hidden controls as access control. Test anonymous, allowed, denied and expired sessions.
