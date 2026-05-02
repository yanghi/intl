import { describe, expect, it } from 'vitest';
import consistentScript from '@/rules/script/consistent-script';
import { createRuleTestContext } from './helpers';

function runRule(value: string) {
  const ctx = createRuleTestContext({ locale: 'en', value });
  consistentScript.lintMessage(ctx, ctx.currentMessage!);
  return ctx.issues.filter((i) => i.code === 'consistent-script');
}

describe('consistent-script', () => {
  it('does not report when the string uses a single script', () => {
    expect(runRule('Hello')).toHaveLength(0);
    expect(runRule('你好')).toHaveLength(0);
    expect(runRule('')).toHaveLength(0);
    expect(runRule('Hi 123 !')).toHaveLength(0);
  });

  it('reports when a minority script appears in mostly Latin text', () => {
    const issues = runRule('Hello你好');
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('warning');
    expect(issues[0].message).toContain('Han');
    expect(issues[0].message).toContain('Latin');
  });

  it('reports when a minority script appears in mostly Han text', () => {
    const issues = runRule('你好Hello');
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('Latin');
    expect(issues[0].message).toContain('Han');
  });

  it('stops after the first unexpected script character', () => {
    const issues = runRule('aa你b');
    expect(issues).toHaveLength(1);
  });
});
