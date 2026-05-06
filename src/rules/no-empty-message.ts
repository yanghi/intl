import { DocumentMessage } from "@/core/document/locale/message";
import { LintContext } from "@/core/lint/context";
import { Rule } from "@/core/rule/rule";

const rule: Rule = {
    code: 'no-empty-message',
    description: 'No empty message',
    lintMessage(context: LintContext, message: DocumentMessage) {
        const { value } = message;
        if (value.length === 0) {
            context.addIssue({
                code: this.code,
                message: `empty message at key "${message.key}"`,
                severity: 'error',
                value: value,
            });
        }
    }
}       

export default rule;