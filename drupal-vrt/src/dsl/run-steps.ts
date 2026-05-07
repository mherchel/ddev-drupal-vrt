// #ddev-generated
import type { Page } from '@playwright/test';
import type { Step } from '../config/schema.js';

export async function runSteps(page: Page, steps: Step[]): Promise<void> {
  for (const step of steps) {
    await runStep(page, step);
  }
}

async function runStep(page: Page, step: Step): Promise<void> {
  if (step.click !== undefined) {
    if (typeof step.click === 'string') {
      await page.locator(step.click).click();
    } else {
      const { selector, button, count } = step.click;
      await page.locator(selector).click({ button, clickCount: count });
    }
    return;
  }
  if (step.fill !== undefined) {
    await page.locator(step.fill.selector).fill(step.fill.value);
    return;
  }
  if (step.press !== undefined) {
    if (step.press.selector !== undefined) {
      await page.locator(step.press.selector).press(step.press.key);
    } else {
      await page.keyboard.press(step.press.key);
    }
    return;
  }
  if (step.hover !== undefined) {
    await page.locator(step.hover).hover();
    return;
  }
  if (step.select !== undefined) {
    await page
      .locator(step.select.selector)
      .selectOption(step.select.value);
    return;
  }
  if (step.check !== undefined) {
    await page.locator(step.check).check();
    return;
  }
  if (step.uncheck !== undefined) {
    await page.locator(step.uncheck).uncheck();
    return;
  }
  if (step.waitFor !== undefined) {
    if (typeof step.waitFor === 'string') {
      await page.locator(step.waitFor).waitFor();
    } else {
      await page
        .locator(step.waitFor.selector)
        .waitFor({ state: step.waitFor.state });
    }
    return;
  }
  if (step.scroll !== undefined) {
    if ('selector' in step.scroll) {
      await page.locator(step.scroll.selector).scrollIntoViewIfNeeded();
    } else {
      await page.evaluate(
        ({ x, y }) => window.scrollTo(x, y),
        step.scroll,
      );
    }
    return;
  }
  // Schema validation guarantees exactly one primitive — defensive only.
  throw new Error(`unknown step shape: ${JSON.stringify(step)}`);
}
