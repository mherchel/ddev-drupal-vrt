// #ddev-generated
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'https://localhost';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 2,

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
      stylePath: path.join(__dirname, 'fixtures/hide-dynamic.css'),
    },
  },

  outputDir: '../../test-results',

  projects: [
    {
      name: 'auth-setup',
      testDir: './fixtures',
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'narrow',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
        storageState: path.join(__dirname, '.auth/admin.json'),
      },
      dependencies: ['auth-setup'],
      testMatch: /.*\.spec\.ts/,
    },
    {
      name: 'mid',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        storageState: path.join(__dirname, '.auth/admin.json'),
      },
      dependencies: ['auth-setup'],
      testMatch: /.*\.spec\.ts/,
    },
    {
      name: 'wide',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        storageState: path.join(__dirname, '.auth/admin.json'),
      },
      dependencies: ['auth-setup'],
      testMatch: /.*\.spec\.ts/,
    },
    {
      name: 'rtl-narrow',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
        storageState: path.join(__dirname, '.auth/admin.json'),
      },
      dependencies: ['auth-setup'],
      testMatch: /.*\.spec\.ts/,
    },
    {
      name: 'rtl-mid',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        storageState: path.join(__dirname, '.auth/admin.json'),
      },
      dependencies: ['auth-setup'],
      testMatch: /.*\.spec\.ts/,
    },
    {
      name: 'rtl-wide',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        storageState: path.join(__dirname, '.auth/admin.json'),
      },
      dependencies: ['auth-setup'],
      testMatch: /.*\.spec\.ts/,
    },
  ],
});
