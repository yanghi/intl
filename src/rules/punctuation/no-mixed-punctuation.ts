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

        const allowed = punctuation.characters;

        for (const punctuationSet of context.localePunctuationRegistry.punctuationSets.values()) {
            if (punctuationSet.locale === document?.locale) continue;
            for (const match of value.matchAll(punctuationSet.charactersRegex)) {
                const character = match[0];
                const start = match.index;
                if (start === undefined) continue;
                // Only flag glyphs that belong to another locale's set but are not valid for the current locale (shared symbols like '^' are allowed).
                if (
                    punctuationSet.characters.includes(character) &&
                    !allowed.includes(character)
                ) {
                    context.addIssue({
                        code: this.code,
                        message: `Mixed punctuation found "${character}" of locale "${punctuationSet.locale}" in message "${prettyStringPartialMid(value, 10)}"`,
                        suggestion: `Replace "${character}" with punctuation appropriate for locale "${document?.locale}"`,
                        wavyLine: {
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
