import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  webServer: { command: 'npm run build && npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: true, timeout: 120_000 },
  use: { baseURL: 'http://localhost:4173' },
  // PW_CHROMIUM: path to an already installed Chromium, when `playwright install` is not possible
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'], launchOptions: { executablePath: process.env.PW_CHROMIUM } } }],
})
