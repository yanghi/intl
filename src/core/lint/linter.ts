import { LocaleDocument } from "../document/locale/locale-document";
import { DocumentMessage } from "../document/locale/message";
import { Rule } from "../rule/rule";
import { LintContext, LintContextImpl } from "./context";
import { LintIssue } from "./lint-issue";

export class Linter {
    private rules: Rule[] = [];

    addRule(rule: Rule): void {
        this.rules.push(rule);
    }

    addRules(rules: Rule[]): void {
        this.rules.push(...rules);
    }

    lint(documents: LocaleDocument[]): LintIssue[] {
        const context = new LintContextImpl(documents);

        for (const document of documents) {
            context.currentDocument = document;
            
            const messages = this.extractMessages(document.messages);
            
            for (const message of messages) {
                context.currentMessage = message;
                
                for (const rule of this.rules) {
                    rule.lintMessage(context, message);
                }
            }
        }

        return context.issues;
    }

    private extractMessages(obj: Record<string, any>, parentKey: string = ''): DocumentMessage[] {
        const messages: DocumentMessage[] = [];
        
        for (const [key, value] of Object.entries(obj)) {
            const fullKey = parentKey ? `${parentKey}.${key}` : key;
            
            if (typeof value === 'string') {
                messages.push({ key: fullKey, value });
            } else if (typeof value === 'object' && value !== null) {
                messages.push(...this.extractMessages(value, fullKey));
            }
        }
        
        return messages;
    }
}
