# CLAUDE.md

## Project overview

DDEV add-on for visual regression testing of any Drupal site using Playwright.
Pages to screenshot are declared in a YAML config (`.ddev/drupal-vrt.yaml`),
loaded and validated at runtime via zod. Supports multiple viewports, LTR + RTL,
authenticated and anonymous sessions, and a small DSL for interactive states.

## Key files

- `install.yaml` — DDEV add-on manifest. `project_files` entries are flat
  strings. `post_install_actions` copies `drupal-vrt/defaults/drupal-vrt.yaml`
  → `.ddev/drupal-vrt.yaml` on first install (only if not already present).
- `drupal-vrt/playwright.config.ts` — generates the Playwright `projects` array
  dynamically from `config.modes[VRT_MODE]`. Project names are
  `<viewport>-<direction>` (e.g. `narrow-ltr`, `wide-rtl`). Reads `VRT_MODE`
  from env (set by the `vrt` shell command).
- `drupal-vrt/src/config/schema.ts` — zod schemas + TypeScript types for the
  yaml config.
- `drupal-vrt/src/config/load.ts` — loads, validates, and resolves
  `drupal-vrt.yaml` (applies defaults, parses `modes:` block including the
  special `default:` key). `resolveUserCredentials()` lazily expands
  `${ENV_VAR}` refs in `users.*` only when a role is actually used.
- `drupal-vrt/src/dsl/run-steps.ts` — interpreter for the `steps:` DSL
  (click/fill/press/hover/select/check/uncheck/waitFor/scroll).
- `drupal-vrt/fixtures/auth.setup.ts` — generates a setup test per referenced
  role; admin uses `drush uli` by default, others use form login. Writes per-role
  storage state to `.auth/<role>.json`.
- `drupal-vrt/tests/vrt/generate-vrt-tests.ts` — single shared test generator.
  Per-page filter on viewport/direction (skip when project doesn't match),
  per-page `auth` selects the right storageState via `test.use()`,
  `skipIfStatus` skips when the route returns a configured status.
- `drupal-vrt/tests/vrt/all.spec.ts` — calls
  `generateVrtTests(loadConfig().pages)`. Single spec; sections are not used.
- `drupal-vrt/defaults/drupal-vrt.yaml` — shipped default config. Translation
  of the original admin-pages + theming-tools-pages content.
- `drupal-vrt/defaults/drupal-vrt.example.yaml` — schema + DSL reference, fully
  commented. Used as documentation, not loaded.
- `drupal-vrt/defaults/drupal-vrt.css` — starter project-level stylesheet,
  copied to `.ddev/drupal-vrt.css` on first install. Layered with the bundled
  `fixtures/hide-dynamic.css` via `expect.toHaveScreenshot.stylePath` (an
  array). The user file is optional; playwright.config detects via
  `fs.existsSync` and only includes it if present.
- `drupal-vrt/bin/read-config.mjs` — tiny shell helper. Bash commands invoke it
  to read `bail`, `default-mode`, `modes` from yaml without needing a yaml
  parser in shell. Parses with `js-yaml` directly (does NOT import the TS
  loader, since it'd need a runtime transformer).
- `commands/web/vrt`, `commands/web/vrt-update`, `commands/web/vrt-report` —
  DDEV custom commands. `vrt` and `vrt-update` resolve modes/bail from yaml
  via `read-config.mjs` and pass `VRT_MODE=<mode>` to `npx playwright test`.

## Testing

Unit tests use vitest. Run from `drupal-vrt/`:

```bash
npx vitest run
```

Tests live in `src/**/*.test.ts`. The vitest config (`vitest.config.ts`)
restricts the include glob so it doesn't pick up Playwright `.spec.ts` files.

Typecheck:

```bash
npx tsc --noEmit
```

## Local development

The add-on files live in `ddev-drupal-vrt/` but need to be present in a
Drupal project's `.ddev/` directory to actually run. The repo-root
`drupal-vrt.yaml` (gitignored) is a dev-time convenience for the loader
when running unit tests or smoke-testing the helper outside of a real
DDEV install.

```bash
# Copy into a Drupal test site
cp -r commands/web/* /path/to/drupal/.ddev/commands/web/
cp -r drupal-vrt /path/to/drupal/.ddev/drupal-vrt
cp docker-compose.vrt-report.yaml /path/to/drupal/.ddev/

# Or install from local path
ddev add-on install /path/to/ddev-drupal-vrt
```

## Common pitfalls

- `install.yaml` `project_files` entries must be plain strings, not
  source/destination objects.
- The `vrt-report` command must point to `../../playwright-report`, since
  that's where playwright.config writes it.
- Playwright runs inside the DDEV web container; the base URL is
  `https://localhost` (not the `.ddev.site` hostname).
- The DDEV commands run in the web container (`commands/web/`), not on the host.
- Project naming convention is `<viewport>-<direction>` (e.g. `narrow-ltr`).
  When users reference `--project=...`, it must use the new naming. The old
  `narrow` / `rtl-narrow` form was abandoned during the YAML refactor.
- `read-config.mjs` deliberately does NOT import the TypeScript loader. It
  parses yaml directly so it can run with bare `node` without a transformer.
  If you add new config keys the helper needs, update the helper too.
- The loader's `resolveUserCredentials()` is **lazy**: don't call it for roles
  that aren't referenced by any page (it would throw on missing env vars even
  when the role isn't used).
- `vrt-update` passes `--update-snapshots=all`, not the bare flag. Playwright
  1.50+ defaults the bare flag to `changed` mode, which only rewrites snapshots
  whose new screenshot fails comparison. Sub-threshold diffs (e.g. a newly
  added CSS hide-rule that hides only a small element) would silently leave
  baselines stale.
- **Never leave `drupal-vrt/node_modules/` in the source tree before
  `ddev add-on install /local/path`**. DDEV recursively copies the directory
  and crashes on symlinks inside `node_modules/.bin/`. Run
  `rm -rf drupal-vrt/node_modules` before any local-path install. Tarball
  installs from GitHub are unaffected (git doesn't track node_modules).

## Publishing

Install URL: `ddev add-on install https://github.com/mherchel/ddev-drupal-vrt/tarball/main`

The bare repo URL does not work with `ddev add-on install` — the
`/tarball/main` suffix is required.
