import { DocumentMessage } from "@/core/document/locale/message";
import { LintContext } from "@/core/lint/context";
import { Rule } from "@/core/rule/rule";
import { prettyString } from "@/utils/string/pretty";

const rule: Rule = {
    code: 'first-letter-uppercase',
    description: 'First letter of the message should be uppercase',
    lintMessage(context: LintContext, message: DocumentMessage) {
        const { value } = message;
        if (value.length === 0) return;
        if (value[0]!.toUpperCase() !== value[0]) {
            const message = `First letter of the message "${prettyString(value, 10)}" should be uppercase`;
            let start = message.indexOf('"');
            context.addIssue({
                code: this.code,
                severity: 'error',
                message: message,
                messageWavyLine: {
                    start,
                    end: start + 1,
                },
                wavyLine: {
                    start: 0,
                    end: 1,
                },
                suggestion: `${value[0]!.toUpperCase()}${value.slice(1)}`,
                value: value,
                fix: (value: string) => {
                    return value[0]!.toUpperCase() + value.slice(1);
                },
            });
        }
    }
}

export default rule
