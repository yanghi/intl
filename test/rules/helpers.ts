import { LocalePunctuationRegistry } from '@/core/character/punctuation';
import {
  LocaleDocumentType,
} from '@/core/document/locale/locale-document';
import { LintContextImpl } from '@/core/lint/context';

export type RuleTestLocale = 'en' | 'zh';

export function createRuleTestContext(options: {
  locale: RuleTestLocale;
  key?: string;
  value: string;
}): LintContextImpl {
  const registry = new LocalePunctuationRegistry('en');
  const punctuation = registry.getPunctuationSet(options.locale)!;
  const doc: LocaleDocument = {
    type: LocaleDocumentType.Json,
    locale: options.locale,
    filePath: `/fixture/${options.locale}.json`,
    relativePath: `fixture/${options.locale}.json`,
    text: '{}',
    messages: {},
    punctuation,
  };
  const ctx = new LintContextImpl([doc], registry);
  ctx.currentDocument = doc;
  ctx.currentMessage = {
    key: options.key ?? 'greeting',
    value: options.value,
  };
  return ctx;
}
