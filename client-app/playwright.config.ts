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
})
