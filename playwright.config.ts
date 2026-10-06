import { defineConfig } from "@playwright/test";

/**
 * Two servers:
 *  - "prod": the production build (`next start`), with NO storage or e-mail —
 *    exactly the pre-launch state of the live site.
 *  - "dev": `next dev` with the in-memory store, console e-mail and the admin
 *    dev login, to exercise the waitlist success path and the back-office.
 * Run `npm run build` first.
 */
const DEV_ENV = {
  MATOCHA_STORE: "memory",
  MATOCHA_EMAIL: "console",
  ADMIN_DEV_LOGIN: "true",
  ADMIN_EMAILS: "david@example.test,gaspard@example.test",
  ADMIN_SESSION_SECRET: "e2e-only-secret-0123456789abcdef-0123456789",
  IP_HASH_SALT: "e2e-salt",
  SITE_URL: "http://localhost:3200",
};

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  workers: 3,
  reporter: [["list"], ["json", { outputFile: "docs/tests/e2e-results.json" }]],
  use: { trace: "off" },
  projects: [
    { name: "prod", testMatch: /(screens|home|slow|links)\.spec\.ts/, use: { baseURL: "http://localhost:3100" } },
    { name: "dev", testMatch: /(waitlist|admin)\.spec\.ts/, use: { baseURL: "http://localhost:3200" } },
  ],
  webServer: [
    { command: "npx next start -p 3100", port: 3100, reuseExistingServer: true, timeout: 120_000 },
    { command: "npx next dev -p 3200", port: 3200, reuseExistingServer: true, timeout: 180_000, env: DEV_ENV },
  ],
});
