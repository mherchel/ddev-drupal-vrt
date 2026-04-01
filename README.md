# DDEV Drupal Admin VRT

A DDEV add-on that provides visual regression testing for Drupal's `default_admin` theme using [Playwright](https://playwright.dev/). It screenshots 21 admin pages across 3 viewport sizes and compares them against baseline images, highlighting any visual differences.

## What it does

This add-on:

- **Screenshots admin pages** at three viewport widths (narrow 375px, mid 768px, wide 1280px)
- **Compares screenshots** against committed baseline images using Playwright's built-in `toHaveScreenshot()`
- **Reports visual differences** with an interactive HTML report showing side-by-side diffs
- **Handles authentication** automatically via `drush uli` (no manual login needed)
- **Runs inside the DDEV container** so screenshots are consistent across macOS, Linux, and Windows — no "works on my machine" issues

## Prerequisites

- [DDEV](https://ddev.com/) v1.24.0 or later
- A Drupal project running in DDEV with the `default_admin` theme installed and set as the admin theme
- An installed Drupal site (the add-on uses `drush uli` to authenticate)

## Installation

```bash
# Install the add-on (also installs the Lullabot/ddev-playwright dependency)
ddev add-on install https://github.com/mherchel/ddev-drupal-admin-vrt/tarball/main

# Restart DDEV to pick up the new docker-compose config
ddev restart

# Install Node.js dependencies
ddev exec -d /var/www/html/.ddev/drupal-admin-vrt npm install

# Install Chromium browser (provided by ddev-playwright)
ddev install-playwright
```

## Usage

### Capture baseline screenshots

Run this on your reference branch (usually `main`) to establish the visual baseline:

```bash
git checkout main
ddev vrt-update
```

This creates PNG screenshots in the `__screenshots__/` directory at the project root, organized by viewport:

```
__screenshots__/
├── narrow/    # 375px viewport
├── mid/       # 768px viewport
└── wide/      # 1280px viewport
```

Commit these baselines to git:

```bash
git add __screenshots__/
git commit -m "Update VRT baselines"
```

### Compare against baselines

Switch to your feature branch and run the comparison:

```bash
git checkout feature/my-theme-change
ddev vrt
```

If all screenshots match, you'll see all tests pass. If there are visual differences, the tests will fail and Playwright will generate diff images.

### View the diff report

After a failed comparison, view the interactive HTML report:

```bash
ddev vrt-report
```

This serves the report at **https://\<projectname\>.ddev.site:9324**. The report shows:

- Side-by-side comparison (expected vs actual)
- A diff overlay highlighting changes
- A slider to toggle between versions
- Pass/fail status per test

You can also view raw diff images directly in `test-results/` — for each failure Playwright writes three PNGs:

- `*-expected.png` — the baseline
- `*-actual.png` — what was captured
- `*-diff.png` — differences highlighted

### Update baselines for intentional changes

If your feature branch intentionally changes the UI, update the baselines:

```bash
ddev vrt-update
git add __screenshots__/
git commit -m "Update VRT baselines for theme changes"
```

### Target specific viewports or sections

```bash
# Run only the narrow viewport
ddev vrt --project=narrow

# Run only content section tests
ddev vrt tests/vrt/content.spec.ts

# Combine: wide viewport, structure section only
ddev vrt --project=wide tests/vrt/structure.spec.ts

# Update baselines for a specific section
ddev vrt-update tests/vrt/people.spec.ts
```

## Tested pages

The add-on tests 21 admin pages grouped into 6 sections:

| Section | Pages |
|---|---|
| **Content** | Content overview, Add article, Add page |
| **Structure** | Overview, Content types, Block layout, Views, Taxonomy, Menus |
| **Appearance** | Theme list |
| **Config** | Overview, Site information, Performance, Text formats, File system |
| **People** | User list, Permissions, Roles |
| **Reports** | Status report, Recent log messages, Available updates |

Each page is screenshotted at 3 viewports = **63 total screenshots** per run.

## Adding pages

To add a new admin page to the test suite, edit `.ddev/drupal-admin-vrt/page-definitions/admin-pages.ts` and add an entry to the `adminPages` array:

```typescript
{
  id: 'config-logging',           // Unique ID (used in screenshot filenames)
  path: '/admin/config/development/logging',  // URL path
  section: 'config',              // Section grouping
},
```

Then capture its baseline:

```bash
ddev vrt-update
```

### Page definition options

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Unique identifier for screenshot filenames |
| `path` | Yes | URL path relative to the site root |
| `section` | Yes | Grouping: `content`, `structure`, `appearance`, `config`, `people`, or `reports` |
| `fullPage` | No | Capture the full scrollable page instead of just the viewport |
| `waitFor` | No | CSS selector to wait for before taking the screenshot |
| `maskSelectors` | No | Array of CSS selectors to mask (hide) in the screenshot |
| `timeout` | No | Custom timeout in ms for screenshot stability check (default: 5000) |
| `interactions` | No | Array of actions to perform before taking additional screenshots |

### Adding interactive states

To screenshot a page after an interaction (opening a modal, clicking a button, etc.), use the `interactions` field:

```typescript
{
  id: 'structure-block-layout',
  path: '/admin/structure/block',
  section: 'structure',
  interactions: [
    {
      label: 'place-block-modal',    // Used in screenshot filename
      action: async (page) => {
        await page.getByRole('link', { name: 'Place block' }).first().click();
        await page.locator('#drupal-modal').waitFor({ state: 'visible' });
        await page.waitForTimeout(300);  // Let animation settle
      },
    },
  ],
}
```

Each interaction generates an additional screenshot named `<id>--<label>.png`.

## How it works

1. **Authentication**: Before any tests run, the `auth-setup` project runs `drush uli` inside the container to get a one-time login URL. It navigates to that URL and saves the authenticated session cookies. All subsequent tests reuse this session.

2. **Viewport projects**: Playwright runs three projects in parallel (`narrow`, `mid`, `wide`), each with a different viewport size. All three depend on `auth-setup` completing first.

3. **Screenshot comparison**: Each test navigates to an admin page, waits for the page to load, and calls `toHaveScreenshot()`. Playwright takes two screenshots 100ms apart to ensure stability, then compares against the baseline using pixel diffing.

4. **Dynamic content handling**: A global CSS stylesheet (`fixtures/hide-dynamic.css`) hides elements that change between runs (timestamps, CSRF tokens, etc.) to prevent false positives.

## Project structure

```
.ddev/
├── commands/web/
│   ├── vrt              # ddev vrt command
│   ├── vrt-update       # ddev vrt-update command
│   └── vrt-report       # ddev vrt-report command
├── docker-compose.vrt-report.yaml   # Exposes port 9324 for the report
└── drupal-admin-vrt/
    ├── playwright.config.ts         # Playwright configuration
    ├── package.json
    ├── fixtures/
    │   ├── auth.setup.ts            # Automatic admin login
    │   └── hide-dynamic.css         # Hides timestamps, tokens, etc.
    ├── page-definitions/
    │   └── admin-pages.ts           # Central registry of pages to test
    └── tests/vrt/
        ├── generate-vrt-tests.ts    # Test generator (shared logic)
        ├── content.spec.ts          # Content section tests
        ├── structure.spec.ts        # Structure section tests
        ├── appearance.spec.ts       # Appearance section tests
        ├── config.spec.ts           # Config section tests
        ├── people.spec.ts           # People section tests
        └── reports.spec.ts          # Reports section tests
```

Baselines and test output live in the project root:

```
project-root/
├── __screenshots__/     # Baseline PNGs (commit to git)
└── test-results/        # Diff output (gitignored)
```

## Configuration

### Screenshot thresholds

The default comparison settings in `playwright.config.ts`:

- **`maxDiffPixelRatio: 0.01`** — allows up to 1% of pixels to differ before failing
- **`threshold: 0.2`** — per-pixel color sensitivity (0 = exact match, 1 = any color)
- **`animations: 'disabled'`** — disables CSS animations for stable screenshots
- **`caret: 'hide'`** — hides the text cursor

To adjust these, edit `.ddev/drupal-admin-vrt/playwright.config.ts`.

### Hiding dynamic content

To add more elements that should be hidden during screenshots (to prevent false positives), edit `.ddev/drupal-admin-vrt/fixtures/hide-dynamic.css`:

```css
/* Example: hide a widget that shows random content */
.my-dynamic-widget {
  visibility: hidden !important;
}
```

### CI usage

For CI environments where `drush uli` may not be available, set environment variables for form-based login:

```bash
DRUPAL_ADMIN_USER=admin
DRUPAL_ADMIN_PASS=admin
```

The `BASE_URL` environment variable can override the default `https://localhost` if the Drupal site is at a different address in CI.

## Troubleshooting

### Tests fail on first run after installation

You need to capture baselines before running comparisons. Run `ddev vrt-update` first.

### Flaky failures on pages with dynamic content

Some pages (like the status report) contain content that changes between runs. Options:

1. **Add selectors to `hide-dynamic.css`** to hide the changing elements
2. **Add `maskSelectors`** to the specific page definition in `admin-pages.ts`
3. **Increase `maxDiffPixelRatio`** in the config if small differences are acceptable

### Screenshot stability timeout

Large pages (like Permissions) may need more time for Playwright to confirm the screenshot is stable. Add a `timeout` to the page definition:

```typescript
{
  id: 'people-permissions',
  path: '/admin/people/permissions',
  section: 'people',
  fullPage: true,
  timeout: 30000,
},
```

### Port 9324 not accessible for report

Run `ddev restart` to ensure the docker-compose port mapping is loaded, then try `ddev vrt-report` again.

## Commands reference

| Command | Description |
|---|---|
| `ddev vrt` | Run visual regression tests against baselines |
| `ddev vrt-update` | Capture or update baseline screenshots |
| `ddev vrt-report` | Serve the HTML diff report |
| `ddev vrt --project=narrow` | Run only narrow (375px) viewport |
| `ddev vrt --project=mid` | Run only mid (768px) viewport |
| `ddev vrt --project=wide` | Run only wide (1280px) viewport |
| `ddev vrt tests/vrt/content.spec.ts` | Run only content section |
| `ddev vrt --debug` | Run with Playwright inspector |
