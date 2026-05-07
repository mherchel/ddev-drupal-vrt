# DDEV Drupal VRT

A DDEV add-on for visual regression testing of any Drupal site using
[Playwright](https://playwright.dev/). Define which pages to screenshot in a
YAML config file, capture baselines on `main`, and compare against your feature
branch. Supports multiple viewports, LTR + RTL, authenticated and anonymous
sessions, and a small DSL for interactive states (form fills, modal opens,
etc.).

## Quick start

```bash
# Install
ddev add-on install https://github.com/mherchel/ddev-drupal-vrt/tarball/main
ddev restart
ddev exec -d /var/www/html/.ddev/drupal-vrt npm install
ddev exec -d /var/www/html/.ddev/drupal-vrt npx playwright install --with-deps chromium

# Capture baselines on main, then test your feature branch
git checkout main
ddev vrt-update
git checkout my-feature
ddev vrt
```

Configuration lives at `.ddev/drupal-vrt.yaml` (created automatically from
sensible defaults on first install). Edit it, commit it.

## Commands

| Command | Description |
|---|---|
| `ddev vrt` | Run VRT against baselines. Prompts for a mode unless `--<mode>` or `--project=<name>` is passed. |
| `ddev vrt-update` | Capture or update baseline screenshots. |
| `ddev vrt-report` | Serve the HTML diff report at `https://<project>.ddev.site:9324`. |

Common flags for `ddev vrt`:

- `--<mode>` — run a mode defined in `drupal-vrt.yaml` (e.g. `--normal`, `--full`).
- `--project=<viewport>-<direction>` — single project, e.g. `--project=narrow-ltr`.
- `--bail=N` — stop after N failures (default comes from `bail:` in yaml).
- `--no-bail` — run every test regardless of failures.
- `--debug` — open the Playwright inspector.
- Any other flag passes straight through to `playwright test`.

## Configuration

Everything is driven by `.ddev/drupal-vrt.yaml`. The default looks roughly like:

```yaml
version: 1

defaults:
  auth: admin            # admin | anonymous | <named-role>
  viewports: [narrow, mid, wide]
  directions: [ltr]      # add rtl to capture RTL too
  fullPage: true
  timeout: 5000

modes:
  normal:
    viewports: [narrow, wide]
    directions: [ltr]
  full:
    viewports: [narrow, mid, wide]
    directions: [ltr, rtl]
  default: normal

bail: 5

pages:
  - id: front
    path: /
    auth: anonymous

  - id: content-overview
    path: /admin/content

  - id: node-add-article
    path: /node/add/article
    interactions:
      - label: filled
        steps:
          - fill: { selector: '#edit-title-0-value', value: 'Test article' }
          - fill: { selector: '#edit-body-0-value', value: 'Body copy' }
```

For the full schema with every option and DSL primitive documented inline, see
[`drupal-vrt/defaults/drupal-vrt.example.yaml`](drupal-vrt/defaults/drupal-vrt.example.yaml).

### Authentication

Each page declares an `auth:` value:

- **`admin`** (default) — logs in as uid 1 via `drush uli`. Override for CI by
  setting `DRUPAL_ADMIN_USER` / `DRUPAL_ADMIN_PASS`, or by adding a
  `users.admin: { username, password }` block.
- **`anonymous`** — no login.
- **`<role-name>`** — logs in via the standard form using credentials in
  `users.<role-name>`. Use `${ENV_VAR}` refs for passwords:

```yaml
users:
  editor:
    username: editor
    password: ${VRT_EDITOR_PASS}
```

Roles not referenced by any page are skipped — you only need creds for the
roles you actually test.

### Modes

Modes are named presets of viewport × direction combinations. The default
config ships with `normal` (narrow + wide, LTR) for fast iteration and `full`
(all viewports, LTR + RTL) for thorough runs. Add your own:

```yaml
modes:
  smoke:
    viewports: [wide]
    directions: [ltr]
  default: smoke
```

Then `ddev vrt --smoke` runs that profile.

### Per-page overrides

Anything in `defaults:` can be overridden inline on a page:

```yaml
pages:
  - id: people-permissions
    path: /admin/people/permissions
    timeout: 30000          # large page needs more stability time
    testTimeout: 90000      # and more total time
    fullPage: false

  - id: code-editor
    path: /admin/some/editor
    directions: [ltr]       # skip RTL for this page

  - id: optional-feature
    path: /admin/maybe-not-installed
    skipIfStatus: [403, 404]   # auto-skip when route is unavailable
```

### Interactions DSL

To screenshot a state that requires interaction (modal open, filled form),
declare an `interactions:` list. Each interaction generates an additional
screenshot named `<id>--<label>.png`. The supported step primitives:

| Step | Form | Notes |
|---|---|---|
| `click` | `'<sel>'` or `{ selector, button?, count? }` | |
| `fill` | `{ selector, value }` | |
| `press` | `{ selector?, key }` | Without selector, presses on the page |
| `hover` | `'<sel>'` | |
| `select` | `{ selector, value }` | `<select>` elements |
| `check` / `uncheck` | `'<sel>'` | Checkboxes/radios |
| `waitFor` | `'<sel>'` or `{ selector, state? }` | states: visible / hidden / attached / detached |
| `scroll` | `{ selector }` or `{ x, y }` | |

Anything more complex than the DSL covers — open an issue.

## How it works

1. On the first invocation per session, an `auth-setup` project logs in for
   each role referenced by any page and stashes session state in
   `.auth/<role>.json`.
2. Each test navigates to the configured `path`, applies optional CSS
   overrides, optionally injects `dir="rtl"` for RTL projects, runs
   interaction steps if any, and calls `toHaveScreenshot()` to compare.
3. A bundled stylesheet (`fixtures/hide-dynamic.css`) hides timestamps, CSRF
   tokens, and other content that changes between runs.

## Project structure

```
.ddev/
├── commands/web/
│   ├── vrt
│   ├── vrt-update
│   └── vrt-report
├── docker-compose.vrt-report.yaml
├── drupal-vrt.yaml          ← user config (commit this)
└── drupal-vrt/
    ├── playwright.config.ts
    ├── fixtures/
    │   ├── auth.setup.ts
    │   └── hide-dynamic.css
    ├── src/
    │   ├── config/          ← yaml loader
    │   └── dsl/             ← step interpreter
    ├── tests/vrt/
    │   ├── all.spec.ts      ← single generated spec
    │   └── generate-vrt-tests.ts
    └── defaults/
        ├── drupal-vrt.yaml          ← shipped default config
        └── drupal-vrt.example.yaml  ← schema + DSL reference
```

Baselines and test output land in the project root:

```
project-root/
├── __screenshots__/    # baseline PNGs
└── test-results/       # diff output (gitignored)
```

## Troubleshooting

**"drush uli was not found" or login fails** — Drupal isn't installed yet. Run
`ddev drush site:install` first.

**Tests fail on first run** — capture baselines first with `ddev vrt-update`.

**Flaky pages with dynamic content** — add the unstable selector to
`maskSelectors:` (per-page or in `defaults:`), or to the bundled
`fixtures/hide-dynamic.css`. Or bump `timeout:` on the page if the issue is
stability rather than dynamic data.

**`drupal-vrt.yaml not found`** — copy from defaults:
`cp .ddev/drupal-vrt/defaults/drupal-vrt.yaml .ddev/drupal-vrt.yaml`.

**Port 9324 not accessible for the report** — `ddev restart` to load the
docker-compose port mapping.

## CI

Set form-login credentials in env (skips the `drush uli` path):

```bash
DRUPAL_ADMIN_USER=admin
DRUPAL_ADMIN_PASS=admin
```

`BASE_URL` overrides the default `https://localhost` if the site lives
elsewhere in CI.
