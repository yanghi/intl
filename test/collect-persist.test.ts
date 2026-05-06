import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadConfiguration } from '@/configuration/load';
import { collect } from '@/features/collect/collect';

const testDir = dirname(fileURLToPath(import.meta.url));
const fixtureRoot = join(testDir, '../test-files/collect-persist-fixture');

describe('collect persist to locale files', () => {
  it('merges, sorts keys, and writes reference locale messages', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'intl-collect-'));
    await cp(fixtureRoot, dir, { recursive: true });

    const configure = loadConfiguration(dir, 'intl.config.json');
    const result = await collect({ cwd: dir }, configure);
    const { usage } = result;
    expect(Object.keys(usage).sort()).toEqual(['added.key', 'parent.child']);

    expect(result.mergeReport?.byFile).toHaveLength(1);
    const zhReport = result.mergeReport!.byFile[0]!;
    expect(zhReport.locale).toBe('zh');
    expect(new Set(zhReport.addedKeys)).toEqual(new Set(['added.key', 'parent.child']));
    expect(Object.keys(zhReport.usagesForAddedKeys).sort()).toEqual(['added.key', 'parent.child']);
    expect(zhReport.usagesForAddedKeys['added.key']?.[0]?.key).toBe('added.key');

    const zhPath = join(dir, 'src/locales/zh.json');
    const messages = JSON.parse(await readFile(zhPath, 'utf-8'));

    expect(Object.keys(messages)).toEqual(['added.key', 'keep', 'parent.child']);
    expect(messages['keep']).toBe('保留');
    expect(messages['added.key']).toBe('added.key');
    expect(messages['parent.child']).toBe('parent.child');
    await rm(dir, { recursive: true, force: true });
  });

  it('uses referenceLocaleKeyAsValue for reference locale', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'intl-collect-'));
    await cp(fixtureRoot, dir, { recursive: true });

    const configPath = join(dir, 'intl.config.json');
    const raw = JSON.parse(await readFile(configPath, 'utf-8'));
    raw.collect = { ...raw.collect, referenceLocaleKeyAsValue: true };
    await writeFile(configPath, JSON.stringify(raw, null, 2), 'utf-8');

    const configure = loadConfiguration(dir, 'intl.config.json');
    await collect({ cwd: dir }, configure);

    const messages = JSON.parse(await readFile(join(dir, 'src/locales/zh.json'), 'utf-8'));
    expect(messages['added.key']).toBe('added.key');
    expect(messages['parent.child']).toBe('parent.child');

    await rm(dir, { recursive: true, force: true });
  });
});
