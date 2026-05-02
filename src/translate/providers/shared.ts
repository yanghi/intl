import type { TranslationRequest } from '../translation';

export function primarySubtag(locale: string): string {
  const tag = locale.trim().toLowerCase();
  const sub = tag.split(/[-_]/)[0];
  return sub && /^[a-z]{2,3}$/.test(sub) ? sub : 'en';
}

export function requestText(request: TranslationRequest): string {
  const { input } = request;
  if (typeof input === 'string') return input;
  try {
    return JSON.stringify(input);
  } catch {
    return String(input);
  }
}
