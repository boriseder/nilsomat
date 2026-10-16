import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export default defineConfig({
  testDir: './',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'iPad-portrait',
      use: {
        ...devices['iPad (gen 7)'],
        browserName: 'webkit',
        viewport: { width: 820, height: 1180 },
        deviceScaleFactor: 2,
        isMobile: true
      }
    },
    {
      name: 'iPad-landscape',
      use: {
        ...devices['iPad (gen 7) landscape'],
        browserName: 'webkit',
        viewport: { width: 1180, height: 820 },
        deviceScaleFactor: 2,
        isMobile: true
      }
    }
  ],
  webServer: {
    command: 'pnpm --filter client dev --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
    cwd: rootDir
  }
});
