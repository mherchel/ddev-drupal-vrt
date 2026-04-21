import type { AdminPageDefinition } from './admin-pages.js';

/**
 * Page definitions for the theming_tools contrib module.
 * https://www.drupal.org/project/theming_tools
 *
 * These tests are automatically skipped when theming_tools is not installed.
 * Each entry corresponds to a submodule route — only routes whose submodule
 * is enabled will be reachable.
 */
export const themingToolsPages: AdminPageDefinition[] = [
  // --- Action Link ---
  {
    id: 'tt-actionlink',
    path: '/action-link',
    section: 'theming-tools',
    fullPage: true,
  },

  // --- Autocomplete ---
  {
    id: 'tt-autocomplete',
    path: '/autocomplete',
    section: 'theming-tools',
    fullPage: true,
  },

  // --- Buttons ---
  {
    id: 'tt-buttons',
    path: '/buttons',
    section: 'theming-tools',
    fullPage: true,
  },
  {
    id: 'tt-buttons-disabled',
    path: '/buttons/disabled',
    section: 'theming-tools',
    fullPage: true,
  },

  // --- Checkbox & Radio ---
  {
    id: 'tt-checkboxradio',
    path: '/contact/checkbox_radio',
    section: 'theming-tools',
    fullPage: true,
    timeout: 10000,
  },

  // --- Dialog ---
  {
    id: 'tt-dialog',
    path: '/dialog',
    section: 'theming-tools',
    fullPage: true,
    interactions: [
      {
        label: 'modal-open',
        action: async (page) => {
          await page.getByRole('link', { name: 'Modal dialog' }).first().click();
          await page.locator('#drupal-modal').waitFor({ state: 'visible' });
          await page.waitForTimeout(500);
        },
      },
    ],
  },

  // --- Dropbutton ---
  {
    id: 'tt-dropbutton',
    path: '/dropbutton/dropbutton',
    section: 'theming-tools',
    fullPage: true,
  },
  {
    id: 'tt-dropbutton-operations',
    path: '/dropbutton/operations',
    section: 'theming-tools',
    fullPage: true,
  },
  {
    id: 'tt-dropbutton-views',
    path: '/dropbutton-views',
    section: 'theming-tools',
    fullPage: true,
  },

  // --- Field Cardinality ---
  {
    id: 'tt-fieldcardinality',
    path: '/contact/field_cardinality_test',
    section: 'theming-tools',
    fullPage: true,
    timeout: 15000,
  },

  // --- Fieldset ---
  {
    id: 'tt-fieldset',
    path: '/fieldset',
    section: 'theming-tools',
    fullPage: true,
    timeout: 15000,
  },

  // --- Image & File ---
  {
    id: 'tt-imagefile-file',
    path: '/contact/imagefile_file',
    section: 'theming-tools',
    fullPage: true,
  },
  {
    id: 'tt-imagefile-image',
    path: '/contact/imagefile_image',
    section: 'theming-tools',
    fullPage: true,
  },

  // --- Message ---
  {
    id: 'tt-message-short',
    path: '/message/short',
    section: 'theming-tools',
    fullPage: true,
  },
  {
    id: 'tt-message-long',
    path: '/message/long',
    section: 'theming-tools',
    fullPage: true,
  },

  // --- Pager ---
  {
    id: 'tt-pager',
    path: '/pager',
    section: 'theming-tools',
    fullPage: true,
  },

  // --- Password ---
  {
    id: 'tt-password',
    path: '/password',
    section: 'theming-tools',
    fullPage: true,
  },

  // --- Prefix / Suffix ---
  {
    id: 'tt-presuf-text',
    path: '/contact/presuf_text',
    section: 'theming-tools',
    fullPage: true,
    timeout: 15000,
    testTimeout: 60000,
  },
  {
    id: 'tt-presuf-number',
    path: '/contact/presuf_number',
    section: 'theming-tools',
    fullPage: true,
    timeout: 15000,
    testTimeout: 60000,
  },

  // --- Progress ---
  {
    id: 'tt-progress',
    path: '/progress/all',
    section: 'theming-tools',
    maskSelectors: ['.ajax-progress'],
    fullPage: true,
  },

  // --- Select ---
  {
    id: 'tt-select',
    path: '/contact/select',
    section: 'theming-tools',
    fullPage: true,
    timeout: 15000,
  },

  // --- Tab ---
  {
    id: 'tt-tabs',
    path: '/tabs',
    section: 'theming-tools',
    fullPage: true,
  },

  // --- Table ---
  {
    id: 'tt-table',
    path: '/table',
    section: 'theming-tools',
    fullPage: true,
    timeout: 15000,
  },

  // --- Tabledrag ---
  {
    id: 'tt-tabledrag',
    path: '/tabledrag',
    section: 'theming-tools',
    fullPage: true,
  },
  {
    id: 'tt-tabledrag-nested',
    path: '/tabledrag/nested',
    section: 'theming-tools',
    fullPage: true,
  },

  // --- Textarea ---
  {
    id: 'tt-textarea',
    path: '/contact/textarea',
    section: 'theming-tools',
    fullPage: true,
    timeout: 15000,
    testTimeout: 60000,
  },

  // --- Textform ---
  {
    id: 'tt-textform',
    path: '/contact/textform',
    section: 'theming-tools',
    fullPage: true,
  },
];
