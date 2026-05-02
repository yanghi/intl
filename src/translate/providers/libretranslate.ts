import type { TranslationRequest, TranslationResult } from '../translation';
import type { TranslationProvider } from '../translation-provider';
import { primarySubtag, requestText } from './shared';

const PUBLIC_BASE = 'https://libretranslate.com';

export const libreTranslateTranslationProvider = {
  name: 'libretranslate',

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const source = primarySubtag(request.sourceLocale);
    const target = primarySubtag(request.targetLocale);
    const q = requestText(request);
    const url = `${PUBLIC_BASE}/translate`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q,
        source,
        target,
        format: 'text',
        api_key: '',
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`LibreTranslate HTTP ${res.status}: ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ''}`);
    }
    const data = (await res.json()) as { translatedText?: string };
    if (typeof data.translatedText !== 'string') {
      throw new Error('LibreTranslate: missing translatedText in response');
    }
    return {
      provider: 'libretranslate',
      targetLocale: request.targetLocale,
      key: request.key,
      output: data.translatedText,
      raw: data,
    };
  },
} satisfies TranslationProvider;
