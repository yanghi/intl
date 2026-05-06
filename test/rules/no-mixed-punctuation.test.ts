import { describe, expect, it } from 'vitest';
import noMixedPunctuation from '@/rules/punctuation/no-mixed-punctuation';
import { createRuleTestContext } from './helpers';

function runRule(locale: 'en' | 'zh', value: string) {
  const ctx = createRuleTestContext({ locale, value });
  noMixedPunctuation.lintMessage(ctx, ctx.currentMessage!);
  return ctx.issues.filter((i) => i.code === 'no-mixed-punctuation');
}

describe('no-mixed-punctuation', () => {
  it('does not report when only native punctuation is used', () => {
    expect(runRule('en', 'Hello, world.')).toHaveLength(0);
    expect(runRule('zh', '你好，世界。')).toHaveLength(0);
  });

  it('does not treat symbols shared across locale punctuation sets as mixed', () => {
    expect(runRule('en', 'x ^ y')).toHaveLength(0);
    expect(runRule('zh', '公式 x ^ y')).toHaveLength(0);
  });

  it('reports foreign punctuation in an English message with correct span', () => {
    const value = 'Hello。';
    const issues = runRule('en', value);
    expect(issues).toHaveLength(1);
    expect(issues[0].wavyLine).toEqual({ start: 5, end: 6 });
    expect(issues[0].value).toBe(value);
    expect(issues[0].locale).toBe('en');
    expect(issues[0].key).toBe('greeting');
  });

  it('emits one issue per occurrence when the same foreign mark appears multiple times', () => {
    const value = 'a。b。c';
    const issues = runRule('en', value);
    expect(issues).toHaveLength(2);
    const spans = issues
      .map((i) => i.wavyLine)
      .sort((a, b) => (a?.start ?? 0) - (b?.start ?? 0));
    expect(spans).toEqual([
      { start: 1, end: 2 },
      { start: 3, end: 4 },
    ]);
  });

  it('reports ASCII punctuation mixed into a Chinese message', () => {
    const issues = runRule('zh', '你好.');
    expect(issues.length).toBeGreaterThanOrEqual(1);
    const dot = issues.find(
      (i) => i.wavyLine?.start === 2 && i.wavyLine?.end === 3,
    );
    expect(dot).toBeDefined();
    expect(dot!.value).toBe('你好.');
  });
});
