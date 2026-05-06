import { mkdir, readFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { enPunctuationSet } from '@/core/character/punctuation';
import {
  LocaleDocumentType,
  type LocaleDocument,
} from '@/core/document/locale/locale-document';
import {
  createLocaleDocumentWriter,
  writeLocaleDocument,
} from '@/core/document/locale/locale-document-writer';

const testDir = dirname(fileURLToPath(import.meta.url));
const OUTPUT_ROOT = join(testDir, '../test-files/locale-document-writer-output');

function makeDoc(overrides: Partial<LocaleDocument> & { messages: Record<string, unknown> }): LocaleDocument {
  const { messages, ...rest } = overrides;
  const text = JSON.stringify(messages);
  return {
    type: LocaleDocumentType.Json,
    locale: 'en',
    filePath: join(OUTPUT_ROOT, 'default-en.json'),
    relativePath: 'default-en.json',
    text,
    messages: messages as Record<string, any>,
    punctuation: enPunctuationSet,
    ...rest,
  };
}

beforeAll(async () => {
  await mkdir(OUTPUT_ROOT, { recursive: true });
});

afterAll(async () => {
  await rm(OUTPUT_ROOT, { recursive: true, force: true });
});

describe('writeLocaleDocument', () => {
  it('writes document.messages to document.filePath by default', async () => {
    const path = join(OUTPUT_ROOT, `case-default-${Date.now()}.json`);
    const document = makeDoc({
      filePath: path,
      messages: { hello: 'world', nested: { a: 1 } },
    });

    const result = await writeLocaleDocument({ document });

    expect(result.filePath).toBe(path);
    const raw = await readFile(path, 'utf-8');
    expect(JSON.parse(raw)).toEqual(document.messages);
    expect(document.text).toBe(`${JSON.stringify(document.messages, null, 2)}\n`);
    expect(result.bytesWritten).toBe(Buffer.byteLength(document.text, 'utf-8'));
  });

  it('writes overridden messages and syncs document.messages and document.text', async () => {
    const path = join(OUTPUT_ROOT, `case-override-msg-${Date.now()}.json`);
    const document = makeDoc({
      filePath: path,
      messages: { old: true },
    });

    await writeLocaleDocument({
      document,
      messages: { newKey: 'x' },
    });

    expect(document.messages).toEqual({ newKey: 'x' });
    const raw = await readFile(path, 'utf-8');
    expect(JSON.parse(raw)).toEqual({ newKey: 'x' });
  });

  it('writes to an alternate filePath and updates document.filePath', async () => {
    const primary = join(OUTPUT_ROOT, `case-alt-primary-${Date.now()}.json`);
    const alternate = join(OUTPUT_ROOT, `nested`, `case-alt-${Date.now()}.json`);
    const document = makeDoc({
      filePath: primary,
      messages: { only: 'here' },
    });

    await writeLocaleDocument({ document, filePath: alternate });

    expect(document.filePath).toBe(alternate);
    await expect(readFile(alternate, 'utf-8')).resolves.toBeTruthy();
  });

  it('respects custom JSON space', async () => {
    const path = join(OUTPUT_ROOT, `case-space-${Date.now()}.json`);
    const document = makeDoc({ filePath: path, messages: { a: 1 } });

    await writeLocaleDocument({ document, space: 4 });

    const raw = await readFile(path, 'utf-8');
    expect(raw).toContain('    ');
    expect(JSON.parse(raw)).toEqual({ a: 1 });
  });
});

describe('createLocaleDocumentWriter', () => {
  it('merges defaults into writeLocaleDocument', async () => {
    const path = join(OUTPUT_ROOT, `case-writer-fn-${Date.now()}.json`);
    const write = createLocaleDocumentWriter({ space: '\t', filePath: path });
    const document = makeDoc({
      filePath: join(OUTPUT_ROOT, 'ignored-default.json'),
      messages: { x: 1 },
    });

    await write({ document });

    const raw = await readFile(path, 'utf-8');
    expect(raw.startsWith('{\n\t')).toBe(true);
    expect(JSON.parse(raw)).toEqual({ x: 1 });
  });
});
