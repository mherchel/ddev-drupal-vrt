// #ddev-generated
import { loadConfig } from '../../src/config/load.js';
import { generateVrtTests } from './generate-vrt-tests.js';

generateVrtTests(loadConfig().pages);
