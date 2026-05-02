import { DocumentMessage } from '@/core/document/locale/message';
import { LintContext } from "@/core/lint/context";
import { Rule } from "@/core/rule/rule";
import { prettyStringPartialMid } from '@/utils/string/pretty';

const rule: Rule = {
    code: 'no-mixed-punctuation',
    description: 'No mixed punctuation',

    lintMessage(context: LintContext, message: DocumentMessage) {
        const { value } = message;
        const document = context.currentDocument;
        const punctuation = document?.punctuation;

        if (!punctuation) return;

        for (const punctuationSet of context.localePunctuationRegistry.punctuationSets.values()) {
            if (punctuationSet.locale === document?.locale) continue;
            for (const match of value.matchAll(punctuationSet.charactersRegex)) {
                const character = match[0];
                const start = match.index;
                if (start === undefined) continue;
                if (punctuationSet.characters.includes(character)) {
                    context.addIssue({
                        code: this.code,
                        message: `Mixed punctuation found "${character}" of locale "${punctuationSet.locale}" in message "${prettyStringPartialMid(value, 10)}"`,
                        suggestion: `Replace "${character}" with "${document?.punctuation.characters}"`,
                        messageWavyLine: {
                            start,
                            end: start + character.length,
                        },
                        value: value,
                        severity: 'error',
                    });
                }
            }
        }
    },
};

export default rule;
