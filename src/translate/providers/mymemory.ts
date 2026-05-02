import type { TranslationRequest, TranslationResult } from '../translation';
import type { TranslationProvider } from '../translation-provider';
import { primarySubtag, requestText } from './shared';

const MYMEMORY_GET = 'https://api.mymemory.translated.net/get';

export const myMemoryTranslationProvider = {
  name: 'mymemory',

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const source = primarySubtag(request.sourceLocale);
    const target = primarySubtag(request.targetLocale);
    const q = requestText(request);
    const url = new URL(MYMEMORY_GET);
    url.searchParams.set('q', q);
    url.searchParams.set('langpair', `${source}|${target}`);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`MyMemory HTTP ${res.status}: ${res.statusText}`);
    }
    const data = (await res.json()) as {
      responseStatus?: number;
      responseData?: { translatedText?: string; match?: number };
      responseDetails?: string;
    };
    if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
      const detail = data.responseDetails ?? 'unknown error';
      throw new Error(`MyMemory: ${detail} (status ${data.responseStatus ?? 'n/a'})`);
    }
    const result: TranslationResult = {
      provider: 'mymemory',
      targetLocale: request.targetLocale,
      key: request.key,
      output: data.responseData.translatedText,
      raw: data,
    };
    if (typeof data.responseData.match === 'number') {
      result.confidence = data.responseData.match;
    }
    return result;
  },
} satisfies TranslationProvider;
