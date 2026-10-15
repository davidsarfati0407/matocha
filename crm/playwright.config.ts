import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results",
  fullyParallel: false,
  workers: 1,
  timeout: 240_000,
  expect: { timeout: 60_000 },
  reporter: [["list"]],
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:3000", locale: "fr-FR", timezoneId: "Europe/Paris", viewport: { width: 1440, height: 900 } },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        // WebGL logiciel (SwiftShader) : les tests tournent aussi sans GPU
        launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] },
      },
    },
  ],
  webServer: process.env.BASE_URL ? undefined : { command: "pnpm dev", url: "http://localhost:3000/login", reuseExistingServer: true, timeout: 120_000 },
});
