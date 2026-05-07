// #ddev-generated
import path from 'path';
import url from 'url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const authDir = path.join(here, '..', '.auth');

export function authStatePath(role: string): string {
  return path.join(authDir, `${role}.json`);
}
