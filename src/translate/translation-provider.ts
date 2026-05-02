import type { TranslationRequest, TranslationResult } from './translation';

type TranslationFormat = 'json' | 'text';

export interface TranslationProvider {
  readonly name: string;
  supportedFormats?: TranslationFormat[];
  translate(request: TranslationRequest): Promise<TranslationResult>;
}

export interface TranslationOptions {
  provider: TranslationProvider;
  [key: string]: any;
}
