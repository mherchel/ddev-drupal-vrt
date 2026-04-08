import { test, expect } from '@playwright/test';
import type { AdminPageDefinition } from '../../page-definitions/admin-pages.js';

export function generateVrtTests(pages: AdminPageDefinition[]) {
  for (const pageDef of pages) {
    test.describe(pageDef.id, () => {
      test('default state', async ({ page }, testInfo) => {
        if (pageDef.testTimeout) {
          test.setTimeout(pageDef.testTimeout);
        }

        await page.goto(pageDef.path);

        if (testInfo.project.name.startsWith('rtl-')) {
          await page.evaluate(() => {
            document.documentElement.dir = 'rtl';
          });
        }

        if (pageDef.waitFor) {
          await page.locator(pageDef.waitFor).waitFor();
        }

        // Wait for network to settle (images, AJAX, etc.)
        // Use 'load' for pages with custom testTimeout as they may have
        // ongoing network activity that prevents networkidle from resolving.
        await page.waitForLoadState(pageDef.testTimeout ? 'load' : 'networkidle');

        const mask = (pageDef.maskSelectors || []).map((s) => page.locator(s));

        await expect(page).toHaveScreenshot(`${pageDef.id}.png`, {
          fullPage: pageDef.fullPage ?? false,
          mask,
          ...(pageDef.timeout ? { timeout: pageDef.timeout } : {}),
        });
      });

      if (pageDef.interactions) {
        for (const interaction of pageDef.interactions) {
          test(`interaction: ${interaction.label}`, async ({ page }, testInfo) => {
            if (pageDef.testTimeout) {
              test.setTimeout(pageDef.testTimeout);
            }

            await page.goto(pageDef.path);

            if (testInfo.project.name.startsWith('rtl-')) {
              await page.evaluate(() => {
                document.documentElement.dir = 'rtl';
              });
            }

            if (pageDef.waitFor) {
              await page.locator(pageDef.waitFor).waitFor();
            }

            await page.waitForLoadState(pageDef.testTimeout ? 'load' : 'networkidle');
            await interaction.action(page);

            const mask = (pageDef.maskSelectors || []).map((s) => page.locator(s));

            await expect(page).toHaveScreenshot(
              `${pageDef.id}--${interaction.label}.png`,
              {
                fullPage: pageDef.fullPage ?? false,
                mask,
                ...(pageDef.timeout ? { timeout: pageDef.timeout } : {}),
              }
            );
          });
        }
      }
    });
  }
}
