import { DocumentMessage } from '@/core/document/locale/message';
import { LintContext } from '@/core/lint/context';
import { Rule } from '@/core/rule/rule';

const LATIN_THEN_CJK = /[a-zA-Z][\u4e00-\u9fa5]/;
const CJK_THEN_LATIN = /[\u4e00-\u9fa5][a-zA-Z]/;

const rule: Rule = {
  code: 'space-between-cjk-and-latin',
  description: 'Space between CJK and Latin',
  lintMessage(context: LintContext, message: DocumentMessage) {
    const { value } = message;
    const document = context.currentDocument;

    const punctuation = document?.punctuation;

    if (!punctuation) return;

    if (value.length === 0) return;

    if (LATIN_THEN_CJK.test(value) || CJK_THEN_LATIN.test(value)) {
      context.addIssue({
        code: this.code,
        severity: 'error',
        message: 'Space between CJK and Latin',
        suggestion: 'Add space between CJK and Latin',
        value: value,
        fix: (value: string) => {
          return value
            .replace(/([a-zA-Z])([\u4e00-\u9fa5])/g, '$1 $2')
            .replace(/([\u4e00-\u9fa5])([a-zA-Z])/g, '$1 $2');
        },
      });
    }
  },
};

export default rule;