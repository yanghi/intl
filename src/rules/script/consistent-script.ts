import { DocumentMessage } from '@/core/document/locale/message';
import { LintContext } from "@/core/lint/context";
import { Rule } from "@/core/rule/rule";

const HAN_REGEX = /[\u4e00-\u9fa5]/;
const LATIN_REGEX = /[a-zA-Z]/;
const KATAKANA_REGEX = /[\u30a0-\u30ff]/;
const HIRAGANA_REGEX = /[\u3040-\u309f]/;

const SCRIPT_NAMES: Record<string, string> = {
    han: 'Han',
    latin: 'Latin',
    katakana: 'Katakana',
    hiragana: 'Hiragana',
};

function detectScript(char: string): string | null {
    if (HAN_REGEX.test(char)) return 'han';
    if (LATIN_REGEX.test(char)) return 'latin';
    if (KATAKANA_REGEX.test(char)) return 'katakana';
    if (HIRAGANA_REGEX.test(char)) return 'hiragana';
    return null;
}

const rule: Rule = {
    code: 'consistent-script',
    description: '保持脚本一致性，避免在主要语言文本中混入其他脚本字符',
    
    lintMessage(context: LintContext, message: DocumentMessage) {
        const { value } = message;
        const locale = context.currentDocument?.locale;
        
        if (!locale) return;
        
        const scriptCounts: Record<string, number> = {};
        let dominantScript: string | null = null;
        let maxCount = 0;
        
        for (const char of value) {
            const script = detectScript(char);
            if (script) {
                scriptCounts[script] = (scriptCounts[script] || 0) + 1;
                if (scriptCounts[script] > maxCount) {
                    maxCount = scriptCounts[script];
                    dominantScript = script;
                }
            }
        }
        
        if (!dominantScript) return;
        
        for (const char of value) {
            const script = detectScript(char);
            if (script && script !== dominantScript) {
                const dominantName = SCRIPT_NAMES[dominantScript] || dominantScript;
                const charName = SCRIPT_NAMES[script] || script;
                
                context.addIssue({
                    code: this.code,
                    severity: 'warning',
                    message: `Unexpected character '${char}' (${charName}) in a ${dominantName} text`,
                    suggestion: `Consider removing or replacing the ${charName} character`,
                });
                break;
            }
        }
    },
};

export default rule;
