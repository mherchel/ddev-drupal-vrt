// #ddev-generated
import { describe, it, expect } from 'vitest';
import { runSteps } from './run-steps.js';
import type { Step } from '../config/schema.js';

interface Call {
  on: 'locator' | 'keyboard' | 'page';
  selector?: string;
  method: string;
  args?: unknown[];
}

function makeMockPage() {
  const calls: Call[] = [];
  const makeLocator = (selector: string) =>
    new Proxy(
      {},
      {
        get(_t, method) {
          return (...args: unknown[]) => {
            calls.push({
              on: 'locator',
              selector,
              method: String(method),
              args,
            });
            return Promise.resolve();
          };
        },
      },
    );
  const page = {
    locator: (selector: string) => makeLocator(selector),
    keyboard: {
      press: (key: string) => {
        calls.push({ on: 'keyboard', method: 'press', args: [key] });
        return Promise.resolve();
      },
    },
    evaluate: (_fn: (arg: unknown) => unknown, arg: unknown) => {
      // Mock does not execute the fn (it would run in the browser context).
      calls.push({ on: 'page', method: 'evaluate', args: [arg] });
      return Promise.resolve();
    },
  };
  return { page: page as unknown as import('@playwright/test').Page, calls };
}

describe('runSteps', () => {
  it('click with a string selector calls locator(...).click()', async () => {
    const { page, calls } = makeMockPage();
    await runSteps(page, [{ click: '#submit' } as Step]);
    expect(calls).toEqual([
      { on: 'locator', selector: '#submit', method: 'click', args: [] },
    ]);
  });

  it('click with options forwards button and clickCount', async () => {
    const { page, calls } = makeMockPage();
    await runSteps(page, [
      { click: { selector: '#a', button: 'right', count: 2 } } as Step,
    ]);
    expect(calls[0]).toMatchObject({
      method: 'click',
      args: [{ button: 'right', clickCount: 2 }],
    });
  });

  it('fill calls locator(selector).fill(value)', async () => {
    const { page, calls } = makeMockPage();
    await runSteps(page, [
      { fill: { selector: '#name', value: 'Jane' } } as Step,
    ]);
    expect(calls[0]).toEqual({
      on: 'locator',
      selector: '#name',
      method: 'fill',
      args: ['Jane'],
    });
  });

  it('press without a selector uses page.keyboard', async () => {
    const { page, calls } = makeMockPage();
    await runSteps(page, [{ press: { key: 'Enter' } } as Step]);
    expect(calls).toEqual([
      { on: 'keyboard', method: 'press', args: ['Enter'] },
    ]);
  });

  it('press with a selector targets that locator', async () => {
    const { page, calls } = makeMockPage();
    await runSteps(page, [
      { press: { selector: '#input', key: 'Tab' } } as Step,
    ]);
    expect(calls[0]).toEqual({
      on: 'locator',
      selector: '#input',
      method: 'press',
      args: ['Tab'],
    });
  });

  it('hover/select/check/uncheck dispatch correctly', async () => {
    const { page, calls } = makeMockPage();
    await runSteps(page, [
      { hover: '#h' } as Step,
      { select: { selector: '#s', value: 'two' } } as Step,
      { check: '#c' } as Step,
      { uncheck: '#u' } as Step,
    ]);
    expect(calls.map((c) => c.method)).toEqual([
      'hover',
      'selectOption',
      'check',
      'uncheck',
    ]);
    expect(calls[1].args).toEqual(['two']);
  });

  it('waitFor with a string calls locator(...).waitFor()', async () => {
    const { page, calls } = makeMockPage();
    await runSteps(page, [{ waitFor: '.ready' } as Step]);
    expect(calls[0]).toEqual({
      on: 'locator',
      selector: '.ready',
      method: 'waitFor',
      args: [],
    });
  });

  it('waitFor with state passes the state option', async () => {
    const { page, calls } = makeMockPage();
    await runSteps(page, [
      { waitFor: { selector: '.x', state: 'hidden' } } as Step,
    ]);
    expect(calls[0]).toEqual({
      on: 'locator',
      selector: '.x',
      method: 'waitFor',
      args: [{ state: 'hidden' }],
    });
  });

  it('scroll with a selector calls scrollIntoViewIfNeeded', async () => {
    const { page, calls } = makeMockPage();
    await runSteps(page, [{ scroll: { selector: '#footer' } } as Step]);
    expect(calls[0].method).toBe('scrollIntoViewIfNeeded');
  });

  it('scroll with x/y calls page.evaluate', async () => {
    const { page, calls } = makeMockPage();
    await runSteps(page, [{ scroll: { x: 0, y: 800 } } as Step]);
    expect(calls).toEqual([
      { on: 'page', method: 'evaluate', args: [{ x: 0, y: 800 }] },
    ]);
  });

  it('runs steps in order', async () => {
    const { page, calls } = makeMockPage();
    await runSteps(page, [
      { fill: { selector: '#a', value: 'x' } } as Step,
      { click: '#b' } as Step,
      { waitFor: '.done' } as Step,
    ]);
    expect(calls.map((c) => c.method)).toEqual(['fill', 'click', 'waitFor']);
  });
});
