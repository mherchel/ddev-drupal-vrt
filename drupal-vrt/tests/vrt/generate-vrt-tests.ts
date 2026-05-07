// #ddev-generated
import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import { runSteps } from '../../src/dsl/run-steps.js';
import type { Direction, ResolvedPage, ViewportName } from '../../src/config/schema.js';
import { authStatePath } from '../../fixtures/auth.setup.js';

interface ProjectMeta {
  viewport: ViewportName;
  direction: Direction;
}

function projectMeta(name: string): ProjectMeta | null {
  // Project names are "<viewport>-<direction>", e.g. "narrow-ltr".
  const m = name.match(/^(narrow|mid|wide)-(ltr|rtl)$/);
  if (!m) return null;
  return { viewport: m[1] as ViewportName, direction: m[2] as Direction };
}

export function generateVrtTests(pages: ResolvedPage[]): void {
  for (const pageDef of pages) {
    test.describe(pageDef.id, () => {
      // Per-page auth: pick the matching storage state, or none for anonymous.
      if (pageDef.auth === 'anonymous') {
        test.use({ storageState: { cookies: [], origins: [] } });
      } else {
        test.use({ storageState: authStatePath(pageDef.auth) });
      }

      test('default state', async ({ page }, testInfo) => {
        const meta = projectMeta(testInfo.project.name);
        if (!matchesProject(pageDef, meta)) {
          test.skip(true, skipReason(pageDef, meta));
          return;
        }
        if (pageDef.testTimeout) test.setTimeout(pageDef.testTimeout);

        const reachable = await navigateAndCheck(page, pageDef);
        if (!reachable) return;

        if (meta?.direction === 'rtl') {
          await page.evaluate(() => {
            document.documentElement.dir = 'rtl';
          });
        }

        await prepare(page, pageDef);
        await screenshot(page, pageDef, testInfo, `${pageDef.id}.png`);
      });

      if (pageDef.interactions) {
        for (const interaction of pageDef.interactions) {
          test(`interaction: ${interaction.label}`, async ({ page }, testInfo) => {
            const meta = projectMeta(testInfo.project.name);
            if (!matchesProject(pageDef, meta)) {
              test.skip(true, skipReason(pageDef, meta));
              return;
            }
            if (pageDef.testTimeout) test.setTimeout(pageDef.testTimeout);

            const reachable = await navigateAndCheck(page, pageDef);
            if (!reachable) return;

            if (meta?.direction === 'rtl') {
              await page.evaluate(() => {
                document.documentElement.dir = 'rtl';
              });
            }

            await prepare(page, pageDef);
            await runSteps(page, interaction.steps);
            await screenshot(
              page,
              pageDef,
              testInfo,
              `${pageDef.id}--${interaction.label}.png`,
            );
          });
        }
      }
    });
  }
}

function matchesProject(p: ResolvedPage, meta: ProjectMeta | null): boolean {
  if (!meta) return true;
  return (
    p.viewports.includes(meta.viewport) &&
    p.directions.includes(meta.direction)
  );
}

function skipReason(p: ResolvedPage, meta: ProjectMeta | null): string {
  if (!meta) return 'unknown project';
  return `page "${p.id}" not enabled for ${meta.viewport}/${meta.direction}`;
}

async function navigateAndCheck(
  page: Page,
  pageDef: ResolvedPage,
): Promise<boolean> {
  const response = await page.goto(pageDef.path);
  if (pageDef.skipIfStatus !== undefined) {
    const status = response?.status() ?? 0;
    const wanted = Array.isArray(pageDef.skipIfStatus)
      ? pageDef.skipIfStatus
      : [pageDef.skipIfStatus];
    if (wanted.includes(status)) {
      test.skip(
        true,
        `${pageDef.path} returned ${status} — skipping per skipIfStatus`,
      );
      return false;
    }
  }
  return true;
}

async function prepare(page: Page, pageDef: ResolvedPage): Promise<void> {
  if (pageDef.css) {
    await page.addStyleTag({ content: pageDef.css });
  }
  if (pageDef.waitFor) {
    await page.locator(pageDef.waitFor).waitFor();
  }
  await page.waitForLoadState('load');
}

async function screenshot(
  page: Page,
  pageDef: ResolvedPage,
  testInfo: import('@playwright/test').TestInfo,
  filename: string,
): Promise<void> {
  const mask = pageDef.maskSelectors.map((s) => page.locator(s));
  await expect(page).toHaveScreenshot(filename, {
    fullPage: pageDef.fullPage,
    mask,
    ...(pageDef.timeout ? { timeout: pageDef.timeout } : {}),
  });
  const snapshotPath = testInfo.snapshotPath(filename);
  if (fs.existsSync(snapshotPath)) {
    await testInfo.attach('screenshot', {
      body: fs.readFileSync(snapshotPath),
      contentType: 'image/png',
    });
  }
}
