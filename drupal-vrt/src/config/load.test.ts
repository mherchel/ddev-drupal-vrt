// #ddev-generated
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigError, loadConfig, resolveUserCredentials } from './load.js';

const minimal = `
version: 1
pages:
  - id: front
    path: /
`;

describe('loadConfig', () => {
  it('accepts a minimal config and applies defaults', () => {
    const c = loadConfig({ source: minimal });
    expect(c.version).toBe(1);
    expect(c.bail).toBe(5);
    expect(c.defaultMode).toBe('normal');
    expect(c.modes.normal.viewports).toEqual(['narrow', 'wide']);
    expect(c.modes.full.viewports).toEqual(['narrow', 'mid', 'wide']);
    expect(c.pages).toHaveLength(1);
    const page = c.pages[0];
    expect(page.auth).toBe('admin');
    expect(page.viewports).toEqual(['narrow', 'mid', 'wide']);
    expect(page.directions).toEqual(['ltr']);
    expect(page.fullPage).toBe(true);
    expect(page.timeout).toBe(5000);
    expect(page.maskSelectors).toEqual([]);
  });

  it('per-page values override defaults', () => {
    const c = loadConfig({
      source: `
version: 1
defaults:
  auth: anonymous
  fullPage: false
pages:
  - id: a
    path: /a
  - id: b
    path: /b
    auth: admin
    fullPage: true
`,
    });
    expect(c.pages[0].auth).toBe('anonymous');
    expect(c.pages[0].fullPage).toBe(false);
    expect(c.pages[1].auth).toBe('admin');
    expect(c.pages[1].fullPage).toBe(true);
  });

  it('merges global maskSelectors with per-page maskSelectors', () => {
    const c = loadConfig({
      source: `
version: 1
defaults:
  maskSelectors:
    - .global-1
    - .global-2
pages:
  - id: a
    path: /a
    maskSelectors:
      - .page-1
`,
    });
    expect(c.pages[0].maskSelectors).toEqual(['.global-1', '.global-2', '.page-1']);
  });

  it('parses modes block and defaultMode', () => {
    const c = loadConfig({
      source: `
version: 1
modes:
  fast:
    viewports: [wide]
    directions: [ltr]
  thorough:
    viewports: [narrow, mid, wide]
    directions: [ltr, rtl]
  default: thorough
pages:
  - id: a
    path: /a
`,
    });
    expect(c.defaultMode).toBe('thorough');
    expect(Object.keys(c.modes).sort()).toEqual(['fast', 'thorough']);
    expect(c.modes.thorough.directions).toEqual(['ltr', 'rtl']);
  });

  it('infers defaultMode when only one mode is defined', () => {
    const c = loadConfig({
      source: `
version: 1
modes:
  only:
    viewports: [wide]
    directions: [ltr]
pages:
  - id: a
    path: /a
`,
    });
    expect(c.defaultMode).toBe('only');
  });

  it('defaults workers to 2 when omitted; respects an override', () => {
    expect(loadConfig({ source: minimal }).workers).toBe(2);
    expect(
      loadConfig({
        source: `
version: 1
workers: 4
pages:
  - id: a
    path: /a
`,
      }).workers,
    ).toBe(4);
  });

  it('rejects a non-positive workers value', () => {
    expect(() =>
      loadConfig({
        source: `
version: 1
workers: 0
pages:
  - id: a
    path: /a
`,
      }),
    ).toThrow(ConfigError);
  });

  it('parses bail variants: number, false, true, omitted', () => {
    const make = (bail: string | undefined) =>
      loadConfig({
        source: `
version: 1
${bail !== undefined ? `bail: ${bail}` : ''}
pages:
  - id: a
    path: /a
`,
      });
    expect(make(undefined).bail).toBe(5);
    expect(make('10').bail).toBe(10);
    expect(make('0').bail).toBe(0);
    expect(make('false').bail).toBe(false);
    expect(make('true').bail).toBe(5);
  });

  it('rejects duplicate page ids', () => {
    expect(() =>
      loadConfig({
        source: `
version: 1
pages:
  - id: dup
    path: /a
  - id: dup
    path: /b
`,
      }),
    ).toThrow(/duplicate page id/);
  });

  it('rejects an unknown viewport name', () => {
    expect(() =>
      loadConfig({
        source: `
version: 1
pages:
  - id: a
    path: /a
    viewports: [huge]
`,
      }),
    ).toThrow(ConfigError);
  });

  it('rejects modes.default pointing at an unknown mode', () => {
    expect(() =>
      loadConfig({
        source: `
version: 1
modes:
  fast:
    viewports: [wide]
    directions: [ltr]
  default: missing
pages:
  - id: a
    path: /a
`,
      }),
    ).toThrow(/unknown mode "missing"/);
  });

  it('rejects a wrong version', () => {
    expect(() =>
      loadConfig({
        source: `
version: 2
pages:
  - id: a
    path: /a
`,
      }),
    ).toThrow(ConfigError);
  });

  it('rejects unknown top-level keys', () => {
    expect(() =>
      loadConfig({
        source: `
version: 1
bogus: 1
pages:
  - id: a
    path: /a
`,
      }),
    ).toThrow(ConfigError);
  });

  it('rejects a step with two primitives', () => {
    expect(() =>
      loadConfig({
        source: `
version: 1
pages:
  - id: a
    path: /a
    interactions:
      - label: x
        steps:
          - click: '#a'
            fill: { selector: '#b', value: 'c' }
`,
      }),
    ).toThrow(/exactly one primitive/);
  });

  it('accepts well-formed steps', () => {
    const c = loadConfig({
      source: `
version: 1
pages:
  - id: a
    path: /a
    interactions:
      - label: filled
        steps:
          - fill: { selector: '#title', value: 'hello' }
          - waitFor: '.ready'
          - click: '#submit'
`,
    });
    const steps = c.pages[0].interactions![0].steps;
    expect(steps).toHaveLength(3);
    expect(steps[0].fill).toEqual({ selector: '#title', value: 'hello' });
    expect(steps[1].waitFor).toBe('.ready');
    expect(steps[2].click).toBe('#submit');
  });
});

describe('resolveUserCredentials', () => {
  const ENV = process.env;
  beforeEach(() => {
    process.env = { ...ENV };
  });
  afterEach(() => {
    process.env = ENV;
  });

  it('passes through literal values unchanged', () => {
    const u = resolveUserCredentials('editor', { username: 'jane', password: 'secret' });
    expect(u).toEqual({ username: 'jane', password: 'secret' });
  });

  it('expands ${VAR} refs', () => {
    process.env.VRT_TEST_USER = 'alice';
    process.env.VRT_TEST_PASS = 'p4ss';
    const u = resolveUserCredentials('editor', {
      username: '${VRT_TEST_USER}',
      password: '${VRT_TEST_PASS}',
    });
    expect(u).toEqual({ username: 'alice', password: 'p4ss' });
  });

  it('throws on missing env var', () => {
    delete process.env.VRT_MISSING;
    expect(() =>
      resolveUserCredentials('editor', {
        username: '${VRT_MISSING}',
        password: 'literal',
      }),
    ).toThrow(/VRT_MISSING/);
  });
});
