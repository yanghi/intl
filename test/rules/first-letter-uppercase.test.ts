import { describe, expect, it } from 'vitest';
import firstLetterUppercase from '@/rules/letter/first-letter-uppercase';
import { createRuleTestContext } from './helpers';

function runRule(value: string) {
  const ctx = createRuleTestContext({ locale: 'en', value });
  firstLetterUppercase.lintMessage(ctx, ctx.currentMessage!);
  return ctx.issues.filter((i) => i.code === 'first-letter-uppercase');
}

describe('first-letter-uppercase', () => {
  it('does nothing on empty string', () => {
    expect(runRule('')).toHaveLength(0);
  });

  it('does not report when the first character is already uppercase', () => {
    expect(runRule('Hello')).toHaveLength(0);
    expect(runRule('你好')).toHaveLength(0);
  });

  it('reports when the first letter is lowercase Latin', () => {
    const value = 'hello';
    const issues = runRule(value);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('error');
    expect(issues[0].suggestion).toBe('Hello');
    expect(issues[0].wavyLine).toEqual({ start: 0, end: 1 });
    expect(issues[0].fix?.(value)).toBe('Hello');
  });
});
