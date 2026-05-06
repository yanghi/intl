export type LocaleMergeStrategy = 'incremental' | 'overwrite';

export interface MergeLocaleMessagesOptions {
    /** Default `incremental`. */
    strategy?: LocaleMergeStrategy;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Mirrors locale empty semantics for merge decisions. */
export function isEmptyMergeValue(value: unknown): boolean {
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

function cloneJson<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T;
}

/**
 * Merges `incoming` into a deep clone of `base`.
 * - `incremental` (default): if a key already exists in `base` and its value is not empty, keep `base` (ignore incoming for that leaf).
 * - `overwrite`: for every key present in `incoming`, if the incoming value is not empty, use it; otherwise keep `base`.
 */
export function mergeLocaleMessages(
    base: Record<string, any>,
    incoming: Record<string, any>,
    options?: MergeLocaleMessagesOptions,
): Record<string, any> {
    const strategy = options?.strategy ?? 'incremental';
    return mergeDeep(cloneJson(base), incoming, strategy);
}

function mergeDeep(base: unknown, incoming: unknown, strategy: LocaleMergeStrategy): unknown {
    if (incoming === undefined) {
        return base;
    }

    if (incoming === null) {
        if (strategy === 'overwrite') {
            return null;
        }
        return isEmptyMergeValue(base) ? null : base;
    }

    if (Array.isArray(incoming)) {
        if (strategy === 'overwrite') {
            return incoming.slice();
        }
        return isEmptyMergeValue(base) ? incoming.slice() : base;
    }

    if (!isPlainObject(incoming)) {
        if (strategy === 'overwrite') {
            return !isEmptyMergeValue(incoming) ? incoming : base;
        }
        return isEmptyMergeValue(base) ? incoming : base;
    }

    if (base === undefined || base === null) {
        return mergeDeep({}, incoming, strategy);
    }

    if (Array.isArray(base) || !isPlainObject(base)) {
        if (strategy === 'overwrite' && isPlainObject(incoming)) {
            return mergeDeep({}, incoming, strategy);
        }
        return isEmptyMergeValue(base) ? mergeDeep({}, incoming, strategy) : base;
    }

    const out: Record<string, any> = { ...base };
    for (const key of Object.keys(incoming)) {
        const bv = base[key];
        const iv = incoming[key];
        out[key] = mergeDeep(bv, iv, strategy);
    }
    return out;
}

/**
 * Builds a messages object from collected flat keys. Keys are kept verbatim (e.g. `foo.bar`
 * stays one property), matching typical flat locale JSON files.
 */
export function nestFlatMessageMap(flat: Record<string, string>): Record<string, any> {
    return { ...flat };
}
