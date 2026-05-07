// #ddev-generated
import { defineConfig, devices, type Project } from '@playwright/test';
import path from 'path';
import url from 'url';
import { loadConfig } from './src/config/load.js';
import type { ViewportName } from './src/config/schema.js';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'https://localhost';

const VIEWPORT_SIZES: Record<ViewportName, { width: number; height: number }> = {
  narrow: { width: 375, height: 812 },
  mid: { width: 768, height: 1024 },
  wide: { width: 1280, height: 900 },
};

const config = loadConfig();
const modeName = process.env.VRT_MODE ?? config.defaultMode;
const mode = config.modes[modeName];
if (!mode) {
  const known = Object.keys(config.modes).join(', ');
  throw new Error(
    `VRT_MODE=${modeName} not defined in drupal-vrt.yaml (known: ${known})`,
  );
}

const projects: Project[] = [
  {
    name: 'auth-setup',
    testDir: './fixtures',
    testMatch: /auth\.setup\.ts/,
    use: { ...devices['Desktop Chrome'] },
  },
];

for (const viewport of mode.viewports) {
  for (const direction of mode.directions) {
    projects.push({
      name: `${viewport}-${direction}`,
      use: {
        ...devices['Desktop Chrome'],
        viewport: VIEWPORT_SIZES[viewport],
      },
      dependencies: ['auth-setup'],
      testMatch: /.*\.spec\.ts/,
    });
  }
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: config.workers,

  reporter: [
    ['html', { outputFolder: '../../playwright-report', open: 'never' }],
    ['list'],
  ],

  snapshotPathTemplate: '../../__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',

  use: {
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'off',
  },

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
      stylePath: path.join(here, 'fixtures/hide-dynamic.css'),
    },
  },

  outputDir: '../../test-results',

  projects,
});
