import { describe, expect, it } from 'vitest';
import type { LintIssue } from '@/core/lint/lint-issue';
import { LintReportFormatter } from '@/formatters/report-formatter';
import { captureConsoleLogs } from './helpers/console-expect';

function baseIssue(overrides: Partial<LintIssue> & Pick<LintIssue, 'message'>): LintIssue {
  return {
    code: 'rule-code',
    severity: 'error',
    key: 'some.key',
    value: 'value',
    ...overrides,
  };
}

describe('LintReportFormatter', () => {
  const formatter = new LintReportFormatter();

  it('prints file path and issue line without messageWavyLine', async () => {
    const issues = [
      baseIssue({
        filePath: 'locales/en.json',
        code: 'my-rule',
        message: 'Something is wrong',
      }),
    ];
    const result = await formatter.format(issues);
    expect(result).toBe(
      ['locales/en.json', '   ✖ my-rule: Something is wrong at some.key'].join('\n'),
    );
  });

  it('draws message wavy line under the marked span of issue.message (prefix + start offset)', async () => {
    const message = 'hello world';
    const issues = [
      baseIssue({
        filePath: 'a.json',
        code: 'x',
        message,
        messageWavyLine: { start: 6, end: 11 },
      }),
    ];
    const result = await formatter.format(issues);
    // prefix `   ✖ x: ` has length 8; span starts at index 6 ("world")
    expect(result).toBe(
      [
        'a.json',
        '   ✖ x: hello world at some.key',
        `${' '.repeat(8 + 6)}~~~~~`,
      ].join('\n'),
    );
  });

  it('does not shift the wavy line when appending at key (indices are message-only)', async () => {
    const message = 'abcdef';
    const shortKeyIssue = baseIssue({
      filePath: 'f.json',
      code: 'rule',
      message,
      key: 'k',
      messageWavyLine: { start: 1, end: 3 },
    });
    const longKeyIssue = baseIssue({
      ...shortKeyIssue,
      key: 'very.long.locale.key.name',
    });

    const shortOut = await formatter.format([shortKeyIssue]);
    const longOut = await formatter.format([longKeyIssue]);

    const waveLineShort = shortOut.split('\n')[2];
    const waveLineLong = longOut.split('\n')[2];
    expect(waveLineShort).toBe(waveLineLong);
  });

  it('omits the wavy row when end equals start', async () => {
    const issues = [
      baseIssue({
        filePath: 'g.json',
        message: 'noop',
        messageWavyLine: { start: 2, end: 2 },
      }),
    ];
    const result = await formatter.format(issues);
    expect(result.split('\n').length).toBe(2);
  });

  it('uses warning and off icons for severity', async () => {
    const warn = baseIssue({
      filePath: 'w.json',
      severity: 'warning',
      message: 'm',
      messageWavyLine: { start: 0, end: 1 },
    });
    const off = baseIssue({
      filePath: 'w.json',
      severity: 'off',
      message: 'm',
      messageWavyLine: { start: 0, end: 1 },
    });

    // prefix `   ⚠ rule-code: ` / `   ○ rule-code: ` length 16
    expect(await formatter.format([warn])).toBe(
      ['w.json', '   ⚠ rule-code: m at some.key', `${' '.repeat(16)}~`].join('\n'),
    );
    expect(await formatter.format([off])).toBe(
      ['w.json', '   ○ rule-code: m at some.key', `${' '.repeat(16)}~`].join('\n'),
    );
  });
});

describe('LintReportFormatter.logIssues', () => {
  const formatter = new LintReportFormatter();

  it('logs file header, issue line, and trailing blank line (no messageWavyLine)', () => {
    const lines = captureConsoleLogs(() =>
      formatter.logIssues([
        baseIssue({
          filePath: 'locales/en.json',
          code: 'my-rule',
          message: 'Something is wrong',
        }),
      ]),
    );
    expect(lines).toBeLogged([
      'locales/en.json:',
      '  my-rule: Something is wrong',
      '',
    ]);
  });

  it('logs message wave row with indent based on issue.message indices only', () => {
    const lines = captureConsoleLogs(() =>
      formatter.logIssues([
        baseIssue({
          filePath: 'a.json',
          code: 'x',
          message: 'hello world',
          messageWavyLine: { start: 6, end: 11 },
        }),
      ]),
    );
    const waveLine = `    ${' '.repeat(6)}~~~~~`;
    expect(lines).toHaveLoggedLine(waveLine);
    expect(lines).toBeLogged(['a.json:', '  x: hello world', waveLine, '']);
  });

  it('logs multiple files in issue order with blank line after each file block', () => {
    const lines = captureConsoleLogs(() =>
      formatter.logIssues([
        baseIssue({ filePath: 'first.json', message: 'one' }),
        baseIssue({ filePath: 'second.json', message: 'two' }),
      ]),
    );
    expect(lines).toBeLogged([
      'first.json:',
      '  rule-code: one',
      '',
      'second.json:',
      '  rule-code: two',
      '',
    ]);
  });

  it('does not log a wave row when end equals start', () => {
    const lines = captureConsoleLogs(() =>
      formatter.logIssues([
        baseIssue({
          filePath: 'g.json',
          message: 'noop',
          messageWavyLine: { start: 2, end: 2 },
        }),
      ]),
    );
    expect(lines.filter((l) => l.includes('~'))).toHaveLength(0);
    expect(lines).toBeLogged(['g.json:', '  rule-code: noop', '']);
  });
});
