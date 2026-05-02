import { LintContext } from "../lint/context";
import { DocumentMessage } from "../document/locale/message";

export interface Rule {
    code: string;
    description: string;
    lintMessage(context: LintContext, message: DocumentMessage): void;
}
