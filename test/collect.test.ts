import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { fastMatch } from '@/core/document/code/i18n-usage/fast-match';
import { collect } from '@/features/collect/collect';

const testDir = dirname(fileURLToPath(import.meta.url));
const codeRoot = join(testDir, '../test-files/code');

describe('collect', () => {
  it('returns empty usage when t names are empty', async () => {
    expect(
      (
        await collect({
          cwd: codeRoot,
          t: [],
          include: ['**/*.ts'],
          exclude: [],
        })
      ).usage,
    ).toEqual({});
  });

  it('returns empty usage when include is empty', async () => {
    expect(
      (
        await collect({
          cwd: codeRoot,
          t: ['t'],
          include: [],
          exclude: [],
        })
      ).usage,
    ).toEqual({});
  });

  it('merges i18n usages from vanilla, React, Vue, and Nest fixtures', async () => {
    const { usage } = await collect({
      cwd: codeRoot,
      t: ['t', '$t', 'this.t'],
      include: ['**/*.{ts,tsx,vue,js,jsx}'],
      exclude: ['**/ignored/**', '**/node_modules/**', '**/full-**/**'],
    });

    expect(usage['vanilla.key']).toEqual([
      expect.objectContaining({
        key: 'vanilla.key',
        filePath: 'vanilla/util.ts',
        line: 2,
      }),
    ]);

    expect(usage['react.key']).toEqual([
      expect.objectContaining({
        key: 'react.key',
        filePath: 'react/components/X.tsx',
        line: 2,
      }),
    ]);

    expect(usage['vue.template.key']?.length).toBe(1);
    expect(usage['vue.script.key']?.length).toBe(1);
    expect(usage['vue.template.key']?.[0]?.filePath).toBe('vue-app/src/App.vue');
    expect(usage['vue.script.key']?.[0]?.filePath).toBe('vue-app/src/App.vue');

    expect(usage['nest.key']).toEqual([
      expect.objectContaining({
        key: 'nest.key',
        filePath: 'nest/src/m.service.ts',
        line: 3,
      }),
    ]);
  });

  it('does not scan paths matched by exclude (e.g. ignored/)', async () => {
    const { usage } = await collect({
      cwd: codeRoot,
      t: ['t', '$t', 'this.t'],
      include: ['**/*.{ts,tsx,vue,js,jsx}'],
      exclude: ['**/ignored/**', '**/node_modules/**'],
    });

    expect(usage['ignored.skip.key']).toBeUndefined();
  });

  it('does not match dynamic import() as callee t (fastMatch)', () => {
    const code = `import('@fingerprintjs/fingerprintjs');\nconst x = t('only.real');`;
    const usages = fastMatch({ filePath: 'x.ts', code, t: ['t', '$t', 'this.t'] });
    expect(usages.map((u) => u.key)).toEqual(['only.real']);
  });

  it('still matches obj.t(), $t(), and this.t() after import boundary fix', () => {
    const code = `
import('m');
foo.$t('dollar');
bar.t('dot');
this.t('self');`;
    const usages = fastMatch({ filePath: 'x.ts', code, t: ['t', '$t', 'this.t'] });
    expect(usages.map((u) => u.key)).toEqual(['dollar', 'dot', 'self']);
  });
});
