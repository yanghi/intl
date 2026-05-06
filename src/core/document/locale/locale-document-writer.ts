import fs from 'node:fs/promises';
import { dirname } from 'node:path';

import type { LocaleDocument } from './locale-document';

/**
 * Options for persisting a locale document. Designed for a functional API and
 * forward-compatible fields (e.g. version history) without breaking callers.
 */
export interface WriteLocaleDocumentOptions {
    document: LocaleDocument;
    /** Serialized payload; defaults to {@link LocaleDocument.messages}. */
    messages?: Record<string, any>;
    /** Target file; defaults to {@link LocaleDocument.filePath}. */
    filePath?: string;
    /** `JSON.stringify` third argument; default `2` with trailing newline. */
    space?: number | string;
    /**
     * Reserved for future use (audit trail, revision ids, etc.).
     * Passing values is allowed today for forward compatibility; behavior is undefined until implemented.
     */
    meta?: Record<string, unknown>;
}

export interface WriteLocaleDocumentResult {
    document: LocaleDocument;
    filePath: string;
    bytesWritten: number;
}

const defaultSpace = 2;

function formatLocaleJson(messages: Record<string, any>, space: number | string): string {
    return `${JSON.stringify(messages, null, space)}\n`;
}

/**
 * Writes locale messages as JSON and syncs {@link LocaleDocument.messages},
 * {@link LocaleDocument.text}, and optionally {@link LocaleDocument.filePath}.
 */
export async function writeLocaleDocument(
    options: WriteLocaleDocumentOptions,
): Promise<WriteLocaleDocumentResult> {
    const { document } = options;
    void options.meta;

    const messages = options.messages ?? document.messages;
    const filePath = options.filePath ?? document.filePath;
    const space = options.space ?? defaultSpace;

    const text = formatLocaleJson(messages, space);

    await fs.mkdir(dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, text, 'utf-8');

    document.messages = messages;
    document.text = text;
    if (options.filePath !== undefined && options.filePath !== document.filePath) {
        document.filePath = filePath;
    }

    const bytesWritten = Buffer.byteLength(text, 'utf-8');

    return { document, filePath, bytesWritten };
}

/** Curried helper: merge fixed defaults into each {@link writeLocaleDocument} call. */
export function createLocaleDocumentWriter(defaults: Partial<Omit<WriteLocaleDocumentOptions, 'document'>>) {
    return (options: WriteLocaleDocumentOptions) => writeLocaleDocument({ ...defaults, ...options });
}
