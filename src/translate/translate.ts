import type { TranslationRequest, TranslationResult } from './translation';
import type { TranslationProvider } from './translation-provider';

export interface TranslateOptions {
  provider: TranslationProvider;
  providerOptions?: Record<string, unknown>;
  /** Max parallel provider calls. Default 4. */
  concurrency?: number;
  /** Retries after the first failure (total attempts = 1 + retries). Ignored if `retryMaxAttempts` is set. */
  retries?: number;
  /** Milliseconds between retry attempts. Default 1000. */
  retryInterval?: number;
  /** Stop retrying a single key after this many milliseconds from the first attempt. */
  retryMaxDuration?: number;
  /** Hard cap on attempts per key (including the first). Default 3. */
  retryMaxAttempts?: number;
}

export interface TranslateMessages {
  sourceLocale: string;
  targetLocale: string;
  messages: Record<string, string>;
}

export interface TranslatedMessage {
  key: string;
  value: string;
  confidence?: number;
  raw?: unknown;
}

export interface TranslateResult {
  sourceLocale: string;
  targetLocale: string;
  translatedMessages: TranslatedMessage[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function resolveInput(raw: string, asJson: boolean): unknown {
  if (!asJson) return raw;
  const trimmed = raw.trim();
  if (!trimmed) return raw;
  const looksLikeJson =
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'));
  if (!looksLikeJson) return raw;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

function toTranslatedMessage(r: TranslationResult): TranslatedMessage {
  const m: TranslatedMessage = { key: r.key, value: r.output };
  if (typeof r.confidence === 'number') {
    m.confidence = r.confidence;
  }
  if (r.raw !== undefined) {
    m.raw = r.raw;
  }
  return m;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  intervalMs: number,
  maxDurationMs: number | undefined,
): Promise<T> {
  const started = Date.now();
  let lastError: unknown;
  const attempts = Math.max(1, maxAttempts);

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt === attempts) break;
      if (maxDurationMs !== undefined && Date.now() - started >= maxDurationMs) {
        break;
      }
      await sleep(intervalMs);
    }
  }
  throw lastError;
}

async function mapPool<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const n = Math.min(Math.max(1, concurrency), Math.max(1, items.length));

  async function run(): Promise<void> {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      const item = items[i];
      if (item === undefined) return;
      results[i] = await worker(item, i);
    }
  }

  await Promise.all(Array.from({ length: n }, () => run()));
  return results;
}

export async function translate(
  options: TranslateOptions,
  messages: TranslateMessages,
): Promise<TranslateResult> {
  const entries = Object.entries(messages.messages);
  const supportsJson = options.provider.supportedFormats?.includes('json') ?? false;

  const maxAttempts =
    options.retryMaxAttempts ??
    (options.retries !== undefined ? Math.max(1, 1 + Math.max(0, options.retries)) : 3);
  const intervalMs = options.retryInterval ?? 1000;
  const maxDurationMs = options.retryMaxDuration;
  const concurrency = options.concurrency ?? 4;

  const translatedMessages = await mapPool(entries, concurrency, async ([key, rawValue]) => {
    const input = resolveInput(rawValue, supportsJson);
    const request: TranslationRequest = {
      sourceLocale: messages.sourceLocale,
      targetLocale: messages.targetLocale,
      providerOptions: options.providerOptions,
      key,
      input,
    };

    const result = await withRetry(
      () => options.provider.translate(request),
      maxAttempts,
      intervalMs,
      maxDurationMs,
    );
    return toTranslatedMessage(result);
  });

  return {
    sourceLocale: messages.sourceLocale,
    targetLocale: messages.targetLocale,
    translatedMessages,
  };
}
