import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3400";
const backendURL = "http://127.0.0.1:3401";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    { command: "node e2e/fixtures/backend.mjs", url: backendURL + "/health" },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3400",
      url: baseURL,
      env: { AUTOCHECK_API_URL: backendURL, AUTOCHECK_APP_ORIGIN: baseURL },
      timeout: 120_000,
    },
  ],
});
