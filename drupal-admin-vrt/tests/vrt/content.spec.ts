// #ddev-generated
import { adminPages } from '../../page-definitions/admin-pages.js';
import { generateVrtTests } from './generate-vrt-tests.js';

const pages = adminPages.filter((p) => p.section === 'content');
generateVrtTests(pages);
