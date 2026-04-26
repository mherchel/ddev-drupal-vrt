// #ddev-generated
import type { Page } from '@playwright/test';

export interface PageInteraction {
  /** Human-readable label used in test names and screenshot filenames */
  label: string;
  /** Function that performs the interaction before screenshotting */
  action: (page: Page) => Promise<void>;
}

export interface AdminPageDefinition {
  /** Unique identifier used in test names and screenshot filenames */
  id: string;
  /** URL path relative to baseURL */
  path: string;
  /** Admin section for grouping (maps to test files) */
  section: 'content' | 'structure' | 'appearance' | 'config' | 'people' | 'reports' | 'theming-tools';
  /** Wait for a specific selector before screenshotting */
  waitFor?: string;
  /** Take a full-page screenshot instead of viewport-only */
  fullPage?: boolean;
  /** Locator selectors to mask (e.g., dynamic content unique to a page) */
  maskSelectors?: string[];
  /** Custom timeout in ms for the screenshot stability check (default: 5000) */
  timeout?: number;
  /** Custom timeout in ms for the overall test (default: Playwright's testTimeout) */
  testTimeout?: number;
  /** Interactions to perform, each producing an additional screenshot */
  interactions?: PageInteraction[];
}

export const adminPages: AdminPageDefinition[] = [
  // --- Content ---
  {
    id: 'content-overview',
    path: '/admin/content',
    section: 'content',
    fullPage: true,
  },
  {
    id: 'node-add-article',
    path: '/node/add/article',
    section: 'content',
    fullPage: true,
  },

  // --- Structure ---
  {
    id: 'structure-overview',
    path: '/admin/structure',
    section: 'structure',
    fullPage: true,
  },
  {
    id: 'structure-content-types',
    path: '/admin/structure/types',
    section: 'structure',
    fullPage: true,
  },
  {
    id: 'structure-content-types-article',
    path: '/admin/structure/types/manage/article',
    section: 'structure',
    fullPage: true,
  },
  {
    id: 'structure-content-types-article-fields',
    path: '/admin/structure/types/manage/article/fields',
    section: 'structure',
    fullPage: true,
  },
  {
    id: 'structure-content-types-article-display',
    path: '/admin/structure/types/manage/article/display',
    section: 'structure',
    fullPage: true,
  },
  {
    id: 'structure-block-layout',
    path: '/admin/structure/block',
    section: 'structure',
    fullPage: true,
  },
  {
    id: 'structure-views',
    path: '/admin/structure/views',
    section: 'structure',
    fullPage: true,
  },
  {
    id: 'structure-views-content',
    path: '/admin/structure/views/view/content',
    section: 'structure',
    fullPage: true,
  },
  {
    id: 'structure-taxonomy',
    path: '/admin/structure/taxonomy',
    section: 'structure',
    fullPage: true,
  },
  {
    id: 'structure-menus',
    path: '/admin/structure/menu',
    section: 'structure',
    fullPage: true,
  },
  {
    id: 'structure-menu-admin',
    path: '/admin/structure/menu/manage/admin',
    section: 'structure',
    fullPage: true,
    timeout: 20000,
  },

  // --- Appearance ---
  {
    id: 'appearance-list',
    path: '/admin/appearance',
    section: 'appearance',
    fullPage: true,
  },

  // --- Config ---
  {
    id: 'config-overview',
    path: '/admin/config',
    section: 'config',
    fullPage: true,
  },
  {
    id: 'config-site-info',
    path: '/admin/config/system/site-information',
    section: 'config',
    fullPage: true,
  },
  {
    id: 'config-performance',
    path: '/admin/config/development/performance',
    section: 'config',
    fullPage: true,
  },
  {
    id: 'config-text-formats',
    path: '/admin/config/content/formats',
    section: 'config',
    fullPage: true,
  },
  {
    id: 'config-text-formats-basic-html',
    path: '/admin/config/content/formats/manage/basic_html',
    section: 'config',
    fullPage: true,
    timeout: 20000,
  },
  {
    id: 'config-media-file-system',
    path: '/admin/config/media/file-system',
    section: 'config',
    fullPage: true,
  },

  // --- People ---
  {
    id: 'people-list',
    path: '/admin/people',
    section: 'people',
    fullPage: true,
  },
  {
    id: 'people-permissions',
    path: '/admin/people/permissions',
    section: 'people',
    // Large page needs extra time for stable screenshot
    timeout: 30000,
    // The permissions page has ongoing network activity that prevents networkidle
    testTimeout: 90000,
  },
  {
    id: 'people-roles',
    path: '/admin/people/roles',
    section: 'people',
    fullPage: true,
  },

  // --- Reports ---
  {
    id: 'reports-status',
    path: '/admin/reports/status',
    section: 'reports',
  },
  {
    id: 'reports-dblog',
    path: '/admin/reports/dblog',
    section: 'reports',
  },
  {
    id: 'reports-updates',
    path: '/admin/reports/updates',
    section: 'reports',
  },
];
