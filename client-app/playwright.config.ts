import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'chrome',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: 'node ./node_modules/vite/bin/vite.js --mode e2e --host 127.0.0.1 --port 4173',
    reuseExistingServer: false,
    timeout: 120_000,
    url: 'http://127.0.0.1:4173',
  },
})
