import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const pkgJson = JSON.parse(readFileSync(resolve(pkgDir, 'package.json'), 'utf8')) as {
  main?: string;
  module: string;
  types: string;
  exports: Record<string, string | { import?: { types: string; default: string }; require?: unknown }>;
};

describe('package exports', () => {
  it('only points to ESM outputs matching vite build config', () => {
    expect(pkgJson.main).toBeUndefined();
    expect(pkgJson.module).toBe('dist/esm/index.js');
    expect(pkgJson.types).toBe('dist/esm/index.d.ts');

    const distBuilt = existsSync(resolve(pkgDir, 'dist'));

    for (const [subpath, target] of Object.entries(pkgJson.exports)) {
      if (subpath === './package.json') {
        expect(target).toBe('./package.json');
        continue;
      }

      expect(typeof target).toBe('object');
      if (typeof target !== 'object' || target === null) continue;

      expect(target.require).toBeUndefined();
      expect(target.import).toBeDefined();
      expect(target.import?.types).toMatch(/^\.\/dist\/esm\/.+\.d\.ts$/);
      expect(target.import?.default).toMatch(/^\.\/dist\/esm\/.+\.js$/);

      const entryBase = target.import!.default.replace(/^\.\/dist\/esm\//, '').replace(/\.js$/, '');
      expect(existsSync(resolve(pkgDir, 'src', `${entryBase}.ts`))).toBe(true);

      if (distBuilt) {
        expect(existsSync(resolve(pkgDir, target.import!.types))).toBe(true);
        expect(existsSync(resolve(pkgDir, target.import!.default))).toBe(true);
      }
    }
  });
});
