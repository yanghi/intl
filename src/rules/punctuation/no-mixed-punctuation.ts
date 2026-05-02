import { DocumentMessage } from '@/core/document/locale/message';
import { LintContext } from "@/core/lint/context";
import { Rule } from "@/core/rule/rule";

const EN_PUNCTUATION = /[.!?;:,\-\(\)\[\]\{\}<>'"`~]/g;
const ZH_PUNCTUATION_MAP: Record<string, string> = {
    '.': '。',
    '!': '！',
    '?': '？',
    ';': '；',
    ':': '：',
    ',': '，',
    '-': '－',
    '(': '（',
    ')': '）',
    '[': '［',
    ']': '］',
    '{': '｛',
    '}': '｝',
    '<': '＜',
    '>': '＞',
    '"': '“',
    "'": '‘',
    '`': '‘',
    '~': '～',
};

const rule: Rule = {
    code: 'no-mixed-punctuation',
    description: '禁止混合使用中英文标点',
    
    lintMessage(context: LintContext, message: DocumentMessage) {
        const { value } = message;
        const locale = context.currentDocument?.locale;
        
        if (!locale) return;
        
        if (locale === 'zh') {
            const matches = value.match(EN_PUNCTUATION);
            if (matches) {
                const uniquePunctuation = [...new Set(matches)];
                for (const enPunct of uniquePunctuation) {
                    const zhPunct = ZH_PUNCTUATION_MAP[enPunct];
                    if (zhPunct) {
                        context.addIssue({
                            code: this.code,
                            severity: 'error',
                            message: `Mixed punctuation found "${enPunct}" (use "${zhPunct}" instead)`,
                            suggestion: `Replace "${enPunct}" with "${zhPunct}"`,
                        });
                    }
                }
            }
        }
    },
};

export default rule;
