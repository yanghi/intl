import { afterEach, describe, expect, it, vi } from 'vitest';
import { libreTranslateTranslationProvider } from '@/translate/providers/libretranslate';
import { myMemoryTranslationProvider } from '@/translate/providers/mymemory';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('myMemoryTranslationProvider', () => {
  it('maps locales and parses success JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          responseStatus: 200,
          responseData: { translatedText: 'Hola', match: 0.9 },
        }),
      })) as unknown as typeof fetch,
    );

    const out = await myMemoryTranslationProvider.translate({
      sourceLocale: 'en-US',
      targetLocale: 'es-ES',
      key: 'greeting',
      input: 'Hello',
    });

    expect(out.provider).toBe('mymemory');
    expect(out.key).toBe('greeting');
    expect(out.output).toBe('Hola');
    expect(out.confidence).toBe(0.9);

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const called = String(fetchMock.mock.calls[0][0]);
    expect(called).toContain('langpair=en%7Ces');
    expect(called).toContain('q=Hello');
  });

  it('throws on API error payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          responseStatus: 403,
          responseDetails: 'INVALID LANGUAGE PAIR',
        }),
      })) as unknown as typeof fetch,
    );

    await expect(
      myMemoryTranslationProvider.translate({
        sourceLocale: 'en',
        targetLocale: 'xx',
        key: 'k',
        input: 'x',
      }),
    ).rejects.toThrow(/MyMemory/);
  });
});

describe('libreTranslateTranslationProvider', () => {
  it('POSTs JSON body and returns translatedText', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ translatedText: 'Bonjour' }),
      })) as unknown as typeof fetch,
    );

    const out = await libreTranslateTranslationProvider.translate({
      sourceLocale: 'en',
      targetLocale: 'fr',
      key: 'hi',
      input: 'Hello',
    });

    expect(out.output).toBe('Bonjour');
    expect(out.provider).toBe('libretranslate');

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledWith('https://libretranslate.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: 'Hello',
        source: 'en',
        target: 'fr',
        format: 'text',
        api_key: '',
      }),
    });
  });

  it('stringifies non-string input', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ translatedText: '{}' }),
      })) as unknown as typeof fetch,
    );

    await libreTranslateTranslationProvider.translate({
      sourceLocale: 'en',
      targetLocale: 'de',
      key: 'obj',
      input: { a: 1 },
    });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.q).toBe('{"a":1}');
  });
});
