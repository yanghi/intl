import { LocalePunctuationRegistry, LocalizedPunctuationSet, enPunctuationSet, localePunctuationRegistry } from '@/core/character/punctuation';
import fs from 'node:fs/promises'
import { relative, extname, basename } from 'node:path'

export enum LocaleDocumentType {
    Json = 'json'
}

export interface LocaleDocument {
    type: LocaleDocumentType;
    locale: string;
    filePath: string;
    relativePath: string;
    text: string;
    messages: Record<string, any>;
    punctuation: LocalizedPunctuationSet;
}

export interface JsonLocaleDocument extends LocaleDocument {
    type: LocaleDocumentType.Json;
}


export function inferFlagLang(text: string): string | null {
    const langRegex = /(?:^|[-_])(zh|en|ru|ja|ko)(?:$|[-_])/;
    const match = text.match(langRegex);
    if (match) {
        const langCode = match[1];
        return langCode || null
    }

    return null;
}

export function inferLocaleFromPath(path: string): string | null {
    const stem = basename(path, extname(path))
    return inferFlagLang(stem) ?? inferFlagLang(path)
}

interface ResolveLocaleDocumentOptions {
    path: string
    cwd?: string
    locale?: string;
    punctuationRegistry?: LocalePunctuationRegistry;
}

export async function resolveLocaleDocument(options: ResolveLocaleDocumentOptions): Promise<LocaleDocument> {
    const punctuationRegistry = options.punctuationRegistry || localePunctuationRegistry
    const ext = extname(options.path);
    if (ext !== '.json') {
        throw new Error(`Invalid locale file: ${options.path}, cause not json file`);
    }

    const content = await fs.readFile(options.path, 'utf-8');


    const json = JSON.parse(content);

    const locale = options.locale || inferLocaleFromPath(options.path);

    if (!locale) {
        throw new Error(`Invalid locale file: ${options.path}, cause infer locale failed`);
    }

    const relativePath = relative(options.path, options.cwd || process.cwd())

    return {
        type: LocaleDocumentType.Json,
        locale: locale,
        filePath: options.path,
        relativePath: relativePath,
        text: content,
        messages: json,
        punctuation: punctuationRegistry.getPunctuationSet(locale) || enPunctuationSet,
    }
}


export interface LoadLocaleDocumentOptions {
    localeFilePaths: string[]
    cwd: string
    punctuationRegistry?: LocalePunctuationRegistry
}

export async function loadLocaleDocuments(options: LoadLocaleDocumentOptions): Promise<LocaleDocument[]> {
    const documents: LocaleDocument[] = []
    const punctuationRegistry = options.punctuationRegistry || localePunctuationRegistry
    for (const filePath of options.localeFilePaths) {
        const document = await resolveLocaleDocument({
            path: filePath,
            cwd: options.cwd,
            punctuationRegistry: punctuationRegistry,
        })
        if (document) {
            documents.push(document)
        }
    }

    return documents
}

export interface SortLocaleDocumentKeysOptions {
    document: LocaleDocument
    /**
     * Default `unicode`.
     * - **unicode**: UTF-16 lexicographic order of keys — same as `Object.keys(obj).sort()` with no comparator (handles digits/symbols consistently).
     * - **alphabetical**: `String.localeCompare` (locale-sensitive letters).
     * - **frequency**: by {@link keyFrequency} counts (desc); ties use UTF-16 order like `unicode`.
     */
    sort?: 'unicode' | 'alphabetical' | 'frequency'
    /**
     * The empty value sort direction, Default is 'bottom'
     */
    emptyValueDirection?: 'top' | 'bottom'
    /**
     * When {@link sort} is `frequency`, descending counts (higher first). Lookup uses dotted full path, then the local segment.
     */
    keyFrequency?: Record<string, number>
}

function isPlainObject(value: unknown): value is Record<string, any> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmptyLocaleValue(value: unknown): boolean {
    if (value === null || value === undefined) {
        return true;
    }
    if (typeof value === 'string') {
        return value.trim() === '';
    }
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    if (isPlainObject(value)) {
        return Object.keys(value).length === 0;
    }
    return false;
}

/** Same ordering as `Object.keys(obj).sort()` with no comparator (UTF-16 code units). */
function compareUtf16KeyOrder(keyA: string, keyB: string): number {
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
}

function compareLocaleKeys(
    keyA: string,
    keyB: string,
    pathA: string,
    pathB: string,
    sort: 'unicode' | 'alphabetical' | 'frequency',
    keyFrequency: Record<string, number> | undefined,
): number {
    if (sort === 'frequency' && keyFrequency) {
        const fa = keyFrequency[pathA] ?? keyFrequency[keyA] ?? 0;
        const fb = keyFrequency[pathB] ?? keyFrequency[keyB] ?? 0;
        if (fb !== fa) {
            return fb - fa;
        }
    }
    if (sort === 'alphabetical') {
        return keyA.localeCompare(keyB);
    }
    return compareUtf16KeyOrder(keyA, keyB);
}

function sortMessagesRecord(
    obj: Record<string, any>,
    pathPrefix: string,
    sort: 'unicode' | 'alphabetical' | 'frequency',
    emptyValueDirection: 'top' | 'bottom',
    keyFrequency: Record<string, number> | undefined,
): Record<string, any> {
    const entries = Object.entries(obj).map(([key, raw]) => {
        const path = pathPrefix ? `${pathPrefix}.${key}` : key;
        let value = raw;
        if (isPlainObject(raw) && Object.keys(raw).length > 0) {
            value = sortMessagesRecord(raw, path, sort, emptyValueDirection, keyFrequency);
        }
        return { key, path, value };
    });

    const empty = entries.filter((e) => isEmptyLocaleValue(e.value));
    const nonEmpty = entries.filter((e) => !isEmptyLocaleValue(e.value));

    const cmp = (a: { key: string; path: string; value: unknown }, b: { key: string; path: string; value: unknown }) =>
        compareLocaleKeys(a.key, b.key, a.path, b.path, sort, keyFrequency);

    empty.sort(cmp);
    nonEmpty.sort(cmp);

    const ordered = emptyValueDirection === 'top' ? [...empty, ...nonEmpty] : [...nonEmpty, ...empty];
    return Object.fromEntries(ordered.map((e) => [e.key, e.value]));
}

/**
 * Reorders each object level in {@link SortLocaleDocumentKeysOptions.document} `messages`:
 * keys whose values are empty (null, blank string, empty object/array) are grouped and sorted,
 * then placed at the top or bottom per {@link SortLocaleDocumentKeysOptions.emptyValueDirection}.
 * Updates `document.messages` and `document.text` (pretty-printed JSON).
 */
export function sortLocaleDocumentKeys(options: SortLocaleDocumentKeysOptions): LocaleDocument {
    const { document } = options;
    const sort = options.sort ?? 'unicode';
    const emptyValueDirection = options.emptyValueDirection ?? 'bottom';
    const keyFrequency = options.keyFrequency;

    const sorted = sortMessagesRecord(document.messages, '', sort, emptyValueDirection, keyFrequency);
    document.messages = sorted;
    document.text = `${JSON.stringify(sorted, null, 2)}\n`;
    return document;
}