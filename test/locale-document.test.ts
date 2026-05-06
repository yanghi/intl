import { describe, expect, it } from 'vitest';
import { enPunctuationSet } from '@/core/character/punctuation';
import {
  LocaleDocumentType,
  inferLocaleFromPath,
  sortLocaleDocumentKeys,
  type LocaleDocument,
} from '@/core/document/locale/locale-document';

function makeDoc(messages: Record<string, unknown>): LocaleDocument {
  return {
    type: LocaleDocumentType.Json,
    locale: 'en',
    filePath: '/fixture/en.json',
    relativePath: 'fixture/en.json',
    text: JSON.stringify(messages),
    messages: messages as Record<string, any>,
    punctuation: enPunctuationSet,
  };
}

describe('sortLocaleDocumentKeys', () => {
  it('groups empty string values at bottom and sorts alphabetically within each group', () => {
    const document = makeDoc({ z: '1', a: '', c: '2' });
    sortLocaleDocumentKeys({ document, sort: 'alphabetical', emptyValueDirection: 'bottom' });
    expect(Object.keys(document.messages)).toEqual(['c', 'z', 'a']);
    expect(document.messages).toEqual({ c: '2', z: '1', a: '' });
  });

  it('places empty keys at top when emptyValueDirection is top', () => {
    const document = makeDoc({ z: '1', a: '', c: '2' });
    sortLocaleDocumentKeys({ document, sort: 'alphabetical', emptyValueDirection: 'top' });
    expect(Object.keys(document.messages)).toEqual(['a', 'c', 'z']);
  });

  it('default unicode sort matches Object.keys().sort() (UTF-16 key order)', () => {
    const raw = { b2: '2', b10: '10', a: '1' };
    const document = makeDoc(raw);
    sortLocaleDocumentKeys({ document, emptyValueDirection: 'bottom' });
    expect(Object.keys(document.messages)).toEqual(Object.keys(raw).sort());
  });

  it('treats null and empty objects as empty and updates document.text', () => {
    const document = makeDoc({ filled: 'x', emptyObj: {}, nil: null as unknown as string });
    sortLocaleDocumentKeys({ document, emptyValueDirection: 'bottom' });
    expect(Object.keys(document.messages)).toEqual(['filled', 'emptyObj', 'nil']);
    expect(document.text.startsWith('{')).toBe(true);
    expect(JSON.parse(document.text)).toEqual(document.messages);
  });

  it('sorts by keyFrequency descending when sort is frequency', () => {
    const document = makeDoc({ z: '', y: '', a: '' });
    sortLocaleDocumentKeys({
      document,
      sort: 'frequency',
      emptyValueDirection: 'bottom',
      keyFrequency: { a: 3, y: 10, z: 5 },
    });
    expect(Object.keys(document.messages)).toEqual(['y', 'z', 'a']);
  });

  it('applies empty placement and sort recursively for nested objects', () => {
    const document = makeDoc({
      m: { y: 'y', x: '' },
      b: '',
      a: 'A',
    });
    sortLocaleDocumentKeys({ document, sort: 'alphabetical', emptyValueDirection: 'bottom' });
    expect(Object.keys(document.messages)).toEqual(['a', 'm', 'b']);
    expect(Object.keys(document.messages.m)).toEqual(['y', 'x']);
  });

  it('uses dotted path in keyFrequency for nested keys', () => {
    const document = makeDoc({
      n: { z: '', a: '' },
    });
    sortLocaleDocumentKeys({
      document,
      sort: 'frequency',
      emptyValueDirection: 'bottom',
      keyFrequency: { 'n.z': 2, 'n.a': 9 },
    });
    expect(Object.keys(document.messages.n)).toEqual(['a', 'z']);
  });
});

describe('inferLocaleFromPath', () => {
  it('reads locale from file stem (Windows-style path)', () => {
    expect(inferLocaleFromPath('e:\\repo\\src\\locales\\zh.json')).toBe('zh');
    expect(inferLocaleFromPath('/repo/src/locales/zh.json')).toBe('zh');
  });
});
