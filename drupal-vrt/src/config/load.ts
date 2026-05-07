// #ddev-generated
import fs from 'fs';
import path from 'path';
import url from 'url';
import yaml from 'js-yaml';
import {
  Mode,
  VrtConfigInput,
  type Defaults,
  type ResolvedPage,
  type User,
  type VrtConfig,
} from './schema.js';

const HARDCODED_DEFAULTS: Required<Pick<Defaults, 'auth' | 'viewports' | 'directions' | 'fullPage' | 'timeout' | 'maskSelectors'>> = {
  auth: 'admin',
  viewports: ['narrow', 'mid', 'wide'],
  directions: ['ltr'],
  fullPage: true,
  timeout: 5000,
  maskSelectors: [],
};

const HARDCODED_MODES: Record<string, Mode> = {
  normal: { viewports: ['narrow', 'wide'], directions: ['ltr'] },
  full: { viewports: ['narrow', 'mid', 'wide'], directions: ['ltr'] },
};

export class ConfigError extends Error {}

export function defaultConfigPath(): string {
  // load.ts → drupal-vrt/src/config/load.ts → ../../../drupal-vrt.yaml lands at .ddev/drupal-vrt.yaml
  const here = path.dirname(url.fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..', '..', 'drupal-vrt.yaml');
}

export interface LoadOptions {
  /** Override the path to drupal-vrt.yaml. */
  path?: string;
  /** In-memory yaml source — used by tests. Takes precedence over `path`. */
  source?: string;
}

export function loadConfig(opts: LoadOptions = {}): VrtConfig {
  const source =
    opts.source ?? fs.readFileSync(opts.path ?? defaultConfigPath(), 'utf8');

  let raw: unknown;
  try {
    raw = yaml.load(source);
  } catch (e) {
    throw new ConfigError(`failed to parse YAML: ${(e as Error).message}`);
  }

  const parsed = VrtConfigInput.safeParse(raw);
  if (!parsed.success) {
    throw new ConfigError(`invalid config: ${formatZodError(parsed.error)}`);
  }
  const input = parsed.data;

  const { modes, defaultMode } = parseModes(input.modes);
  const defaults = { ...HARDCODED_DEFAULTS, ...(input.defaults ?? {}) };
  const pages = input.pages.map((p): ResolvedPage => resolvePage(p, defaults));
  assertUniqueIds(pages);

  const bail = input.bail === undefined ? 5 : input.bail === true ? 5 : input.bail;
  const workers = input.workers ?? 2;

  return {
    version: 1,
    bail: bail === false ? false : (bail as number),
    workers,
    modes,
    defaultMode,
    users: input.users ?? {},
    pages,
  };
}

function parseModes(rawModes: Record<string, unknown> | undefined): {
  modes: Record<string, Mode>;
  defaultMode: string;
} {
  if (rawModes === undefined) {
    return { modes: HARDCODED_MODES, defaultMode: 'normal' };
  }

  const out: Record<string, Mode> = {};
  let defaultMode: string | undefined;

  for (const [name, value] of Object.entries(rawModes)) {
    if (name === 'default') {
      if (typeof value !== 'string') {
        throw new ConfigError(
          `modes.default must be a string referencing a mode name, got ${typeof value}`,
        );
      }
      defaultMode = value;
      continue;
    }
    const result = Mode.safeParse(value);
    if (!result.success) {
      throw new ConfigError(
        `invalid modes.${name}: ${formatZodError(result.error)}`,
      );
    }
    out[name] = result.data;
  }

  if (Object.keys(out).length === 0) {
    throw new ConfigError('modes must define at least one named mode');
  }

  if (defaultMode === undefined) {
    // If only one mode is defined, use it. Otherwise require explicit default.
    const names = Object.keys(out);
    if (names.length === 1) {
      defaultMode = names[0];
    } else {
      throw new ConfigError(
        `modes must include a "default:" key when more than one mode is defined`,
      );
    }
  }

  if (!out[defaultMode]) {
    throw new ConfigError(
      `modes.default refers to unknown mode "${defaultMode}"`,
    );
  }

  return { modes: out, defaultMode };
}

function resolvePage(
  p: VrtConfigInput['pages'][number],
  defaults: typeof HARDCODED_DEFAULTS & Defaults,
): ResolvedPage {
  return {
    id: p.id,
    path: p.path,
    auth: p.auth ?? defaults.auth,
    viewports: p.viewports ?? defaults.viewports,
    directions: p.directions ?? defaults.directions,
    fullPage: p.fullPage ?? defaults.fullPage,
    timeout: p.timeout ?? defaults.timeout,
    testTimeout: p.testTimeout,
    waitFor: p.waitFor,
    maskSelectors: [...defaults.maskSelectors, ...(p.maskSelectors ?? [])],
    css: p.css ?? defaults.css,
    skipIfStatus: p.skipIfStatus,
    interactions: p.interactions,
  };
}

function assertUniqueIds(pages: ResolvedPage[]): void {
  const seen = new Set<string>();
  for (const p of pages) {
    if (seen.has(p.id)) {
      throw new ConfigError(`duplicate page id: "${p.id}"`);
    }
    seen.add(p.id);
  }
}

function formatZodError(err: import('zod').ZodError): string {
  return err.issues
    .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
    .join('; ');
}

const ENV_REF = /^\$\{([A-Z_][A-Z0-9_]*)\}$/;

/**
 * Resolve `${VAR}` env-var refs in a user record's username/password.
 * Throws if a referenced env var is unset. Lazy: callers only resolve
 * users they actually use, so unreferenced roles don't need creds set.
 */
export function resolveUserCredentials(role: string, user: User): User {
  return {
    username: expandRef(`users.${role}.username`, user.username),
    password: expandRef(`users.${role}.password`, user.password),
  };
}

function expandRef(field: string, value: string): string {
  const m = value.match(ENV_REF);
  if (!m) return value;
  const envName = m[1];
  const env = process.env[envName];
  if (env === undefined || env === '') {
    throw new ConfigError(
      `${field} references env var ${envName} but it is not set`,
    );
  }
  return env;
}
