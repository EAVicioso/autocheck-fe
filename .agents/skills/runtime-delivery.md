# Runtime and delivery

1. Use the Node version in `.nvmrc` (26.13.0) and install dependencies from the lockfile with `npm ci` when appropriate. Check `package.json` scripts before running commands.
2. Maintain strict TypeScript, lint and production build quality. Add CI jobs in `.github/workflows/` only when needed, using the pinned runtime and lockfile; run configured Vitest and Playwright suites and install Playwright browsers in CI.
3. Target Vercel deployment when configured. Document required environment variable names and where they belong; never commit credentials or place private keys in `NEXT_PUBLIC_` variables.
4. Validate deployment and callback URLs for each environment and ensure Supabase and backend configuration agree. Do not assume a GitHub Actions pipeline or Vercel integration already exists.
