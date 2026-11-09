# Testing and quality

1. Inspect `package.json`, `vitest.config.ts`, `vitest.setup.ts` and `playwright.config.ts` before changing tests. Vitest runs `src/**/*.test.{ts,tsx}` in jsdom; Playwright runs `e2e/` against a local development server.
2. For component and hook behavior, use Vitest with React Testing Library: query accessible roles and labels, simulate user behavior, and cover meaningful success, failure and boundary cases. Mock network and auth at boundaries.
3. For end-to-end flows, use Playwright with isolated test data and accounts; cover navigation, form submission, authentication and role denial without relying on production credentials.
4. Run `npm run lint` and `npm run build` when appropriate. Run `npm run test` for unit tests and `npx playwright test` or `npm run test:e2e` for E2E; install the browser with `npx playwright install chromium` when needed.
5. Keep tests deterministic and independent, and verify responsive and keyboard behavior for significant UI changes.
