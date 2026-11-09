# Typed REST API communication

1. Inspect the actual .NET API contract, environment configuration and existing helpers before changing an endpoint. Place shared transport in `src/lib/apiFetch.ts` when introduced, and feature services/types close to their feature or under `src/lib/`.
2. Use strict TypeScript and validate untrusted responses with Zod where practical; model success, empty responses and structured errors explicitly. Never assume an HTTP error rejects `fetch` automatically.
3. Obtain an appropriate Supabase access token in the current execution context and send it as a Bearer token only to the configured trusted backend. Keep secrets and server-only imports out of client bundles.
4. Handle network errors, non-2xx status, cancellation and loading states; avoid exposing tokens or sensitive response bodies in logs. Choose caching deliberately for user-specific data.
5. If refresh is necessary, use supported Supabase session APIs, coordinate concurrent refreshes and limit retries. Never automatically replay non-idempotent mutations without an explicit safe retry or idempotency contract.
6. Test success, authorization failure, malformed responses and retry behavior at the transport boundary; avoid real external services in unit tests.
