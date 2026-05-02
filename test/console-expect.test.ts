import { describe, expect, it } from 'vitest';
import { captureConsoleLogs, captureConsoleWarns } from './helpers/console-expect';

describe('console-expect helpers', () => {
  it('captureConsoleLogs collects console.log lines in order', () => {
    const lines = captureConsoleLogs(() => {
      console.log('one');
      console.log('two', 'parts');
    });
    expect(lines).toBeLogged(['one', 'two parts']);
  });

  it('captureConsoleWarns collects console.warn lines in order', () => {
    const lines = captureConsoleWarns(() => {
      console.warn('warn-a');
      console.warn('warn-b');
    });
    expect(lines).toBeWarned(['warn-a', 'warn-b']);
  });

  it('toHaveLoggedLine matches a single line', () => {
    const lines = captureConsoleLogs(() => {
      console.log('alpha');
      console.log('beta');
    });
    expect(lines).toHaveLoggedLine('beta');
  });

  it('toHaveWarnedLine matches a single line', () => {
    const lines = captureConsoleWarns(() => {
      console.warn('x');
    });
    expect(lines).toHaveWarnedLine('x');
  });
});
