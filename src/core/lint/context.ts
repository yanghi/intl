import { LocalePunctuationRegistry, localePunctuationRegistry } from "../character/punctuation";
import { LocaleDocument } from "../document/locale/locale-document";
import { DocumentMessage } from "../document/locale/message";
import { LintIssue } from "./lint-issue";

export interface LintContext {
    documents: LocaleDocument[];
    currentDocument?: LocaleDocument;
    currentMessage?: DocumentMessage;
    issues: LintIssue[];
    addIssue(issue: Omit<LintIssue, 'locale' | 'key' | 'filePath'>): void;
    localePunctuationRegistry: LocalePunctuationRegistry;
}

export class LintContextImpl implements LintContext {
    documents: LocaleDocument[];
    currentDocument?: LocaleDocument;
    currentMessage?: DocumentMessage;
    issues: LintIssue[] = [];
    localePunctuationRegistry: LocalePunctuationRegistry;
    constructor(documents: LocaleDocument[], punctuationRegistry: LocalePunctuationRegistry = localePunctuationRegistry) {
        this.documents = documents;
        this.localePunctuationRegistry = punctuationRegistry;
    }

    addIssue(issue: Omit<LintIssue, 'locale' | 'key' | 'filePath'>): void {
        if(!this.currentDocument || !this.currentMessage) {
            throw new Error('Current document or message is not set,Do not call addIssue before lintMessage');
        }

        this.issues.push({
            ...issue,
            locale: this.currentDocument.locale,
            key: this.currentMessage.key,
            filePath: this.currentDocument.relativePath,
        });
    }
}
