import { describe, expect, it } from 'vitest';
import spaceBetweenCjkAndLatin from '@/rules/letter/space-between-cjk-and-latin';
import { createRuleTestContext } from './helpers';

function runRule(locale: 'en' | 'zh', value: string) {
  const ctx = createRuleTestContext({ locale, value });
  spaceBetweenCjkAndLatin.lintMessage(ctx, ctx.currentMessage!);
  return ctx.issues.filter((i) => i.code === 'space-between-cjk-and-latin');
}

describe('space-between-cjk-and-latin', () => {
  it('does not report when CJK and Latin are separated by space', () => {
    expect(runRule('zh', 'hello 世界')).toHaveLength(0);
    expect(runRule('zh', '你好 world')).toHaveLength(0);
  });

  it('does not report when only one script is present', () => {
    expect(runRule('en', 'hello')).toHaveLength(0);
    expect(runRule('zh', '你好')).toHaveLength(0);
  });

  it('reports adjacent Latin then CJK without space', () => {
    const value = 'hello世界';
    const issues = runRule('en', value);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.(value)).toBe('hello 世界');
  });

  it('reports adjacent CJK then Latin without space', () => {
    const value = '你好world';
    const issues = runRule('zh', value);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.(value)).toBe('你好 world');
  });
});
