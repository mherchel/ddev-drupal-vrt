// #ddev-generated
import { test as setup, expect, type Page } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import url from 'url';
import { loadConfig, resolveUserCredentials } from '../src/config/load.js';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const authDir = path.join(here, '..', '.auth');

export function authStatePath(role: string): string {
  return path.join(authDir, `${role}.json`);
}

const config = loadConfig();

// Roles actually referenced by at least one page (excluding "anonymous").
const referencedRoles = new Set<string>();
for (const page of config.pages) {
  if (page.auth !== 'anonymous') {
    referencedRoles.add(page.auth);
  }
}

for (const role of referencedRoles) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    const file = authStatePath(role);

    if (role === 'admin') {
      await loginAdmin(page, config.users.admin);
    } else {
      const userEntry = config.users[role];
      if (!userEntry) {
        throw new Error(
          `Page references auth role "${role}" but users.${role} is not defined in drupal-vrt.yaml`,
        );
      }
      const creds = resolveUserCredentials(role, userEntry);
      await loginWithForm(page, creds.username, creds.password);
    }

    await expect(page.locator('body.user-logged-in')).toBeVisible({
      timeout: 10000,
    });
    await page.context().storageState({ path: file });
  });
}

async function loginAdmin(
  page: Page,
  configured?: { username: string; password: string },
): Promise<void> {
  // Highest precedence: explicit creds in users.admin block.
  if (configured) {
    const creds = resolveUserCredentials('admin', configured);
    await loginWithForm(page, creds.username, creds.password);
    return;
  }
  // Next: env vars (preferred for CI).
  if (process.env.DRUPAL_ADMIN_USER && process.env.DRUPAL_ADMIN_PASS) {
    await loginWithForm(
      page,
      process.env.DRUPAL_ADMIN_USER,
      process.env.DRUPAL_ADMIN_PASS,
    );
    return;
  }
  // Default: drush one-time login as uid 1.
  const uli = execSync('drush uli --uid=1', {
    encoding: 'utf-8',
    timeout: 15000,
  }).trim();
  const u = new URL(uli);
  await page.goto(u.pathname + u.search);
  await page.waitForURL('**/user/**');
}

async function loginWithForm(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  await page.goto('/user/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('**/user/**');
}
