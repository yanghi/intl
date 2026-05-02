import { expect, vi } from 'vitest';

/** Captures each `console.log` line (multi-arg joins with a single space). */
export function captureConsoleLogs(run: () => void): string[] {
  const lines: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  });
  try {
    run();
  } finally {
    spy.mockRestore();
  }
  return lines;
}

/** Captures each `console.warn` line (multi-arg joins with a single space). */
export function captureConsoleWarns(run: () => void): string[] {
  const lines: string[] = [];
  const spy = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  });
  try {
    run();
  } finally {
    spy.mockRestore();
  }
  return lines;
}

interface CustomMatchers<R = unknown> {
  /** Asserts the captured `console.log` sequence (e.g. from {@link captureConsoleLogs}). */
  toBeLogged(expected: readonly string[]): R;
  /** Asserts the captured `console.warn` sequence (e.g. from {@link captureConsoleWarns}). */
  toBeWarned(expected: readonly string[]): R;
  /** Asserts at least one captured log line equals `line`. */
  toHaveLoggedLine(line: string): R;
  /** Asserts at least one captured warn line equals `line`. */
  toHaveWarnedLine(line: string): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
  toBeLogged(received: unknown, expected: readonly string[]) {
    const exp = [...expected];
    const actual = Array.isArray(received) ? received : [];
    const pass = this.equals(actual, exp);
    return {
      pass,
      actual,
      expected: exp,
      message: () =>
        pass
          ? `expected console.log sequence not to equal ${this.utils.printExpected(exp)}`
          : `expected console.log sequence to equal ${this.utils.printExpected(exp)}\nreceived: ${this.utils.printReceived(actual)}`,
    };
  },
  toBeWarned(received: unknown, expected: readonly string[]) {
    const exp = [...expected];
    const actual = Array.isArray(received) ? received : [];
    const pass = this.equals(actual, exp);
    return {
      pass,
      actual,
      expected: exp,
      message: () =>
        pass
          ? `expected console.warn sequence not to equal ${this.utils.printExpected(exp)}`
          : `expected console.warn sequence to equal ${this.utils.printExpected(exp)}\nreceived: ${this.utils.printReceived(actual)}`,
    };
  },
  toHaveLoggedLine(received: unknown, line: string) {
    const lines = Array.isArray(received) ? (received as string[]) : [];
    const pass = lines.includes(line);
    return {
      pass,
      actual: lines,
      expected: line,
      message: () =>
        pass
          ? `expected console.log lines not to include ${this.utils.printExpected(line)}`
          : `expected console.log lines to include line ${this.utils.printExpected(line)}\nreceived:\n${this.utils.printReceived(lines)}`,
    };
  },
  toHaveWarnedLine(received: unknown, line: string) {
    const lines = Array.isArray(received) ? (received as string[]) : [];
    const pass = lines.includes(line);
    return {
      pass,
      actual: lines,
      expected: line,
      message: () =>
        pass
          ? `expected console.warn lines not to include ${this.utils.printExpected(line)}`
          : `expected console.warn lines to include line ${this.utils.printExpected(line)}\nreceived:\n${this.utils.printReceived(lines)}`,
    };
  },
});
