import { describe, expect, it } from 'vitest';
import {
  isEmptyMergeValue,
  mergeLocaleMessages,
  nestFlatMessageMap,
} from '@/core/document/locale/message-merger';

describe('mergeLocaleMessages incremental', () => {
  it('does not overwrite existing non-empty leaf values', () => {
    const base = { a: 'old', b: '' };
    const incoming = { a: 'new', b: 'filled' };
    expect(mergeLocaleMessages(base, incoming)).toEqual({ a: 'old', b: 'filled' });
  });

  it('fills empty slots from incoming', () => {
    const base = { x: '' };
    const incoming = { x: 'now' };
    expect(mergeLocaleMessages(base, incoming)).toEqual({ x: 'now' });
  });

  it('merges nested objects', () => {
    const base = { root: { kept: 'v', empty: '' } };
    const incoming = { root: { empty: 'in', onlyIncoming: 'z' } };
    expect(mergeLocaleMessages(base, incoming)).toEqual({
      root: { kept: 'v', empty: 'in', onlyIncoming: 'z' },
    });
  });
});

describe('mergeLocaleMessages overwrite', () => {
  it('replaces non-empty leaves when incoming has a value', () => {
    const base = { a: 'old' };
    const incoming = { a: 'new' };
    expect(mergeLocaleMessages(base, incoming, { strategy: 'overwrite' })).toEqual({ a: 'new' });
  });

  it('keeps base when incoming leaf is empty', () => {
    const base = { a: 'keep' };
    const incoming = { a: '' };
    expect(mergeLocaleMessages(base, incoming, { strategy: 'overwrite' })).toEqual({ a: 'keep' });
  });
});

describe('nestFlatMessageMap', () => {
  it('preserves literal key strings including dots', () => {
    expect(nestFlatMessageMap({ 'a.b.c': 'x', z: 'y' })).toEqual({
      'a.b.c': 'x',
      z: 'y',
    });
  });
});

describe('isEmptyMergeValue', () => {
  it('treats whitespace-only strings as empty', () => {
    expect(isEmptyMergeValue('  ')).toBe(true);
  });
});
