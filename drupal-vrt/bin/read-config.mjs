#!/usr/bin/env node
// #ddev-generated
// Tiny shell helper for the `vrt` bash command. Reads selected values out of
// drupal-vrt.yaml so the bash script doesn't have to parse YAML itself.
//
// This intentionally does NOT use the full schema/loader (which is TypeScript
// and needs a transformer at runtime). It does a minimal targeted read and
// applies the same defaults the loader would.
//
// Usage:
//   node bin/read-config.mjs bail           -> "5" | "false" | "<int>"
//   node bin/read-config.mjs default-mode   -> "<mode-name>"
//   node bin/read-config.mjs modes          -> "<m1> <m2> ..."  (excludes "default")
import fs from 'fs';
import path from 'path';
import url from 'url';
import yaml from 'js-yaml';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const configPath = path.resolve(here, '..', '..', 'drupal-vrt.yaml');

let raw;
try {
  raw = yaml.load(fs.readFileSync(configPath, 'utf8')) ?? {};
} catch (e) {
  if (e.code === 'ENOENT') {
    console.error(
      `drupal-vrt: ${configPath} not found.\n` +
        `  Copy the default config to get started:\n` +
        `    cp .ddev/drupal-vrt/defaults/drupal-vrt.yaml .ddev/drupal-vrt.yaml`,
    );
  } else {
    console.error(`drupal-vrt: cannot read ${configPath}: ${e.message}`);
  }
  process.exit(2);
}

const what = process.argv[2];
switch (what) {
  case 'bail': {
    const b = raw.bail;
    if (b === false) console.log('false');
    else if (b === undefined || b === true) console.log('5');
    else console.log(String(b));
    break;
  }
  case 'default-mode': {
    const modes = raw.modes ?? {};
    if (typeof modes.default === 'string') {
      console.log(modes.default);
    } else {
      const named = Object.keys(modes).filter((k) => k !== 'default');
      // If user defined exactly one mode, default is that; else fall back to "normal".
      console.log(named.length === 1 ? named[0] : 'normal');
    }
    break;
  }
  case 'modes': {
    const modes = raw.modes ?? { normal: {}, full: {} };
    const named = Object.keys(modes).filter((k) => k !== 'default');
    console.log(named.length ? named.join(' ') : 'normal full');
    break;
  }
  default:
    console.error(`unknown key: ${what}`);
    process.exit(2);
}
