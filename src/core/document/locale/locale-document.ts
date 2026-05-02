import fs from 'node:fs/promises'
import { relative, extname } from 'node:path'

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
    const langCode = inferFlagLang(path);
    if (langCode) {
        return langCode;
    }
    return null;
}

interface ResolveLocaleDocumentOptions {
    path: string
    cwd?: string
    locale?: string;
}

export async function resolveLocaleDocument(options: ResolveLocaleDocumentOptions): Promise<LocaleDocument | null> {

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
    }
}