import { LocaleDocument } from "../document/locale/locale-document";
import { DocumentMessage } from "../document/locale/message";
import { LintIssue } from "./lint-issue";

export interface LintContext {
    documents: LocaleDocument[];
    currentDocument?: LocaleDocument;
    currentMessage?: DocumentMessage;
    issues: LintIssue[];
    addIssue(issue: Omit<LintIssue, 'locale' | 'key' | 'filePath'>): void;
}

export class LintContextImpl implements LintContext {
    documents: LocaleDocument[];
    currentDocument?: LocaleDocument;
    currentMessage?: DocumentMessage;
    issues: LintIssue[] = [];

    constructor(documents: LocaleDocument[]) {
        this.documents = documents;
    }

    addIssue(issue: Omit<LintIssue, 'locale' | 'key' | 'filePath'>): void {
        this.issues.push({
            ...issue,
            locale: this.currentDocument?.locale,
            key: this.currentMessage?.key,
            filePath: this.currentDocument?.relativePath,
        });
    }
}
