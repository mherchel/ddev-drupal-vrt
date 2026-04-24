import { test, expect } from '@playwright/test';
import { themingToolsPages } from '../../page-definitions/theming-tools-pages.js';
import type { AdminPageDefinition } from '../../page-definitions/admin-pages.js';

/**
 * VRT tests for theming_tools contrib module pages.
 *
 * Each test navigates to the page and skips automatically if it returns a
 * 403/404 (meaning the submodule is not enabled). This lets users enable
 * only the submodules they care about without breaking the test suite.
 */

function generateThemingToolsTests(pages: AdminPageDefinition[]) {
  for (const pageDef of pages) {
    test.describe(pageDef.id, () => {
      test('default state', async ({ page }, testInfo) => {
        if (pageDef.testTimeout) {
          test.setTimeout(pageDef.testTimeout);
        }

        const response = await page.goto(pageDef.path);

        // Skip if the route doesn't exist (submodule not enabled).
        if (!response || response.status() >= 400) {
          test.skip(true, `${pageDef.path} returned ${response?.status() ?? 'no response'} — submodule not enabled`);
          return;
        }

        if (testInfo.project.name.startsWith('rtl-')) {
          await page.evaluate(() => {
            document.documentElement.dir = 'rtl';
          });
        }

        if (pageDef.waitFor) {
          await page.locator(pageDef.waitFor).waitFor();
        }

        await page.waitForLoadState('load');

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

            const response = await page.goto(pageDef.path);

            if (!response || response.status() >= 400) {
              test.skip(true, `${pageDef.path} returned ${response?.status() ?? 'no response'} — submodule not enabled`);
              return;
            }

            if (testInfo.project.name.startsWith('rtl-')) {
              await page.evaluate(() => {
                document.documentElement.dir = 'rtl';
              });
            }

            if (pageDef.waitFor) {
              await page.locator(pageDef.waitFor).waitFor();
            }

            await page.waitForLoadState('load');
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

generateThemingToolsTests(themingToolsPages);
