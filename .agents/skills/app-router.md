# Next.js App Router and rendering

1. Before changing Next.js code, read the relevant installed guide under `node_modules/next/dist/docs/01-app/`; follow its version-specific conventions and deprecations.
2. Add routes under `src/app/` using `page.tsx` and shared nested `layout.tsx`; use `(auth)` and `(dashboard)` route groups to separate layouts without changing URLs. Avoid duplicate URL paths across groups.
3. Default to Server Components. Place interactive state, events and browser APIs in the smallest practical `"use client"` boundary; pass serializable props and keep secrets on the server.
4. Put reusable primitives in `src/components/ui/`, cross-feature composition in `src/components/shared/`, and route-specific code near its route. Use `@/` imports for `src/`.
5. Handle loading, error and empty states where relevant. Check installed documentation for async route parameters, caching, navigation and route handlers before use.
