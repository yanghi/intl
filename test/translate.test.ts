import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TranslationProvider } from '@/translate/translation-provider';
import { translate } from '@/translate/translate';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function createProvider(
  impl: (key: string, input: unknown) => Promise<string>,
): TranslationProvider {
  return {
    name: 'mock',
    async translate(request) {
      const output = await impl(request.key, request.input);
      return {
        provider: 'mock',
        targetLocale: request.targetLocale,
        key: request.key,
        output,
      };
    },
  };
}

describe('translate', () => {
  it('translates all keys and preserves order', async () => {
    const provider = createProvider(async (key) => `_${key}_`);
    const out = await translate(
      { provider, concurrency: 2 },
      {
        sourceLocale: 'en',
        targetLocale: 'de',
        messages: { a: '1', b: '2', c: '3' },
      },
    );
    expect(out.translatedMessages.map((m) => m.key)).toEqual(['a', 'b', 'c']);
    expect(out.translatedMessages.map((m) => m.value)).toEqual(['_a_', '_b_', '_c_']);
    expect(out.sourceLocale).toBe('en');
    expect(out.targetLocale).toBe('de');
  });

  it('parses JSON values when provider supports json', async () => {
    const seen: unknown[] = [];
    const provider = createProvider(async (_key, input) => {
      seen.push(input);
      return 'ok';
    });
    provider.supportedFormats = ['json'];

    await translate({ provider }, {
      sourceLocale: 'en',
      targetLocale: 'fr',
      messages: { k: '{"x":1}' },
    });

    expect(seen).toEqual([{ x: 1 }]);
  });

  it('retries then succeeds', async () => {
    vi.useFakeTimers();
    let n = 0;
    const provider = createProvider(async () => {
      n++;
      if (n < 2) throw new Error('fail');
      return 'ok';
    });

    const p = translate(
      { provider, retries: 2, retryInterval: 100 },
      { sourceLocale: 'en', targetLocale: 'es', messages: { x: 'a' } },
    );

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(100);
    const out = await p;

    expect(out.translatedMessages[0]?.value).toBe('ok');
    expect(n).toBe(2);
  });

  it('respects retryMaxAttempts', async () => {
    const provider = createProvider(async () => {
      throw new Error('always');
    });

    await expect(
      translate(
        { provider, retryMaxAttempts: 2, retryInterval: 0 },
        { sourceLocale: 'en', targetLocale: 'es', messages: { x: 'a' } },
      ),
    ).rejects.toThrow('always');
  });
});
