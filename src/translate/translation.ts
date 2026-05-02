export interface TranslationRequest {
    sourceLocale: string;
    targetLocale: string;
    // provider specific options
    providerOptions?: any
    key: string;
    input: any;
    context?: string;
  }
  
  export interface TranslationResult {
    provider: string;
    targetLocale: string;
    key: string;
    output: string;
    confidence?: number;
    raw?: unknown;
  }
  
