import { defineConfig, devices } from "@playwright/test";

const fullStack = process.env.AUTOCHECK_E2E_FULLSTACK === "1";
const baseURL = (fullStack ? "https" : "http") + "://127.0.0.1:3400";
const backendURL = "http://127.0.0.1:3401";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL, ignoreHTTPSErrors: fullStack, trace: "on-first-retry" },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] },
      ...(fullStack ? { testIgnore: ["**/autocheck.spec.ts", "**/section-c.spec.ts"] }
        : { testMatch: ["**/autocheck.spec.ts", "**/section-c.spec.ts"] }) },
    ...(fullStack ? [
      { name: "mobile-webkit", testMatch: "**/auth-rbac.spec.ts", use: { ...devices["iPhone 13"] } },
      { name: "inspector-tablet-touch", testMatch: "**/auth-rbac.spec.ts",
        use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 768 }, hasTouch: true } },
    ] : []),
  ],
  webServer: fullStack ? undefined : [
    { command: "node e2e/fixtures/backend.mjs", url: backendURL + "/health" },
    {
      command: "npm run build && npm run start -- --hostname 127.0.0.1 --port 3400",
      url: baseURL,
      env: { AUTOCHECK_API_URL: backendURL, AUTOCHECK_APP_ORIGIN: baseURL },
      timeout: 120_000,
    },
  ],
});
