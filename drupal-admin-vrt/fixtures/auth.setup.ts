// #ddev-generated
import { test as setup, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  let loginUrl: string;

  if (process.env.DRUPAL_ADMIN_USER && process.env.DRUPAL_ADMIN_PASS) {
    // CI: form-based login
    await page.goto('/user/login');
    await page.getByLabel('Username').fill(process.env.DRUPAL_ADMIN_USER);
    await page.getByLabel('Password').fill(process.env.DRUPAL_ADMIN_PASS);
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForURL('**/user/**');
  } else {
    // Local: drush one-time login
    const uli = execSync('drush uli --uid=1', {
      encoding: 'utf-8',
      timeout: 15000,
    }).trim();

    // drush uli returns a full URL; extract the path
    const url = new URL(uli);
    loginUrl = url.pathname + url.search;

    await page.goto(loginUrl);
    await page.waitForURL('**/user/**');
  }

  await expect(page.locator('body.user-logged-in')).toBeVisible({ timeout: 10000 });
  await page.context().storageState({ path: authFile });
});
