import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { globSync } from "glob";
import { enPunctuationSet, localePunctuationRegistry } from "@/core/character/punctuation";
import { NormalizeConfiguration } from "@/configuration/configuration";
import { fastMatch } from "@/core/document/code/i18n-usage/fast-match";
import { I18nUsage } from "@/core/document/code/i18n-usage/usage";
import {
    LocaleDocumentType,
    inferLocaleFromPath,
    resolveLocaleDocument,
    sortLocaleDocumentKeys,
    type LocaleDocument,
} from "@/core/document/locale/locale-document";
import { writeLocaleDocument } from "@/core/document/locale/locale-document-writer";
import { mergeLocaleMessages, nestFlatMessageMap } from "@/core/document/locale/message-merger";

export interface ScanOptions {
    cwd?: string;
    t: string[];
    /**
     * Files to include in the scan.
     */
    include: string[];
    /**
     * Files to exclude from the scan.
     */
    exclude: string[];
}

export interface CollectOptions extends Partial<ScanOptions> {}

/** Per locale file: keys newly introduced into that JSON (top-level own keys missing before merge). */
export interface LocaleMergeReport {
    filePath: string;
    locale: string;
    addedKeys: string[];
    /** Scan usages for each {@link addedKeys} entry (same as collect scan). */
    usagesForAddedKeys: Record<string, I18nUsage[]>;
}

/** Result of merging collected keys into locale files; omitted when collect runs without config / persist. */
export interface CollectMergeReport {
    byFile: LocaleMergeReport[];
}

export interface CollectResult {
    usage: {
        [key: string]: I18nUsage[];
    };
    mergeReport?: CollectMergeReport;
}

function filePathForUsage(cwd: string, absolutePath: string): string {
    const rel = relative(cwd, absolutePath);
    return rel.split(/[/\\]/).join("/");
}

const DEFAULT_T = ["t", "$t", "this.t"] as const;
const DEFAULT_INCLUDE = ["src", "lib", "packages"].map(
    (dir) => `${dir}/**/*.{js,ts,jsx,tsx,vue}`,
);
const DEFAULT_EXCLUDE = [
    "node_modules",
    "dist",
    "build",
    "coverage",
    "logs",
    "temp",
    "cache",
    "test",
    "output",
];

export function resolveProjectRoot(configure: NormalizeConfiguration): string {
    const rel = configure.rawConfiguration.root;
    const segment = rel !== undefined && rel !== "" ? rel : ".";
    return resolve(configure.rootDirPath, segment);
}

function collectScan(options: CollectOptions, configure?: NormalizeConfiguration): CollectResult {
    const t = options.t ?? configure?.i18n.t ?? [...DEFAULT_T];
    const include = options.include ?? configure?.include ?? DEFAULT_INCLUDE;
    const exclude = options.exclude ?? configure?.exclude ?? DEFAULT_EXCLUDE;
    const cwd =
        options.cwd ?? (configure ? resolveProjectRoot(configure) : undefined) ?? process.cwd();

    const result: CollectResult = {
        usage: {},
    };

    if (include.length === 0 || t.length === 0) {
        return result;
    }
    const paths = globSync(include, {
        cwd,
        ignore: exclude,
        nodir: true,
        absolute: true,
    });
    paths.sort((a, b) => a.localeCompare(b));

    for (const absolutePath of paths) {
        let code: string;
        try {
            code = readFileSync(absolutePath, "utf8");
        } catch {
            continue;
        }

        const displayPath = filePathForUsage(cwd, absolutePath);
        const usages = fastMatch({ filePath: displayPath, code, t });

        for (const u of usages) {
            const key = u.key;
            const bucket = result.usage[key];
            if (bucket) {
                bucket.push(u);
            } else {
                result.usage[key] = [u];
            }
        }
    }

    return result;
}

/** Incoming slice from scan: reference locale uses source literals; others use empty placeholders. */
function buildFlatCollected(
    usage: CollectResult["usage"],
    locale: string,
    configure: NormalizeConfiguration,
): Record<string, string> {
    const flat: Record<string, string> = {};
    const keys = Object.keys(usage).sort((a, b) => a.localeCompare(b));
    const isRef = locale === configure.referenceLocale;
    for (const key of keys) {
        const bucket = usage[key];
        if (!bucket?.length) continue;
        if (isRef) {
            flat[key] = bucket[0]!.value;
        } else {
            flat[key] = "";
        }
    }
    return flat;
}

/** After merge: for reference locale + flag, set message value to the key string for every collected key. */
function applyReferenceLocaleKeyAsValue(
    messages: Record<string, any>,
    usage: CollectResult["usage"],
): Record<string, any> {
    const next = { ...messages };
    for (const key of Object.keys(usage)) {
        next[key] = key;
    }
    return next;
}

async function loadLocaleDocumentOrEmpty(
    filePath: string,
    projectRoot: string,
    locale: string,
): Promise<LocaleDocument> {
    try {
        return await resolveLocaleDocument({
            path: filePath,
            cwd: projectRoot,
            punctuationRegistry: localePunctuationRegistry,
        });
    } catch (e: unknown) {
        if ((e as NodeJS.ErrnoException)?.code !== "ENOENT") {
            throw e;
        }
        return {
            type: LocaleDocumentType.Json,
            locale,
            filePath,
            relativePath: relative(projectRoot, filePath),
            text: "{}\n",
            messages: {},
            punctuation: localePunctuationRegistry.getPunctuationSet(locale) || enPunctuationSet,
        };
    }
}

/**
 * Per locale file: merge collected keys → apply {@link IntlCollectConfiguration.referenceLocaleKeyAsValue}
 * on reference locale (after merge) → {@link sortLocaleDocumentKeys} → {@link writeLocaleDocument}.
 */
async function persistCollectResults(
    configure: NormalizeConfiguration,
    usage: CollectResult["usage"],
): Promise<CollectMergeReport> {
    const projectRoot = resolveProjectRoot(configure);
    const strategy = configure.collect.mergeStrategy ?? "incremental";
    const byFile: LocaleMergeReport[] = [];

    for (const filePath of configure.localeFiles) {
        const locale = inferLocaleFromPath(filePath);
        if (!locale) {
            continue;
        }

        const document = await loadLocaleDocumentOrEmpty(filePath, projectRoot, locale);
        const keysBefore = new Set(Object.keys(document.messages));
        const addedKeys = Object.keys(usage).filter((k) => usage[k]?.length && !keysBefore.has(k));

        const usagesForAddedKeys: Record<string, I18nUsage[]> = {};
        for (const k of addedKeys) {
            usagesForAddedKeys[k] = usage[k] ?? [];
        }

        const flat = buildFlatCollected(usage, locale, configure);
        const incomingNested = nestFlatMessageMap(flat);
        let merged = mergeLocaleMessages(document.messages, incomingNested, { strategy });
        if (locale === configure.referenceLocale && configure.collect.referenceLocaleKeyAsValue === true) {
            merged = applyReferenceLocaleKeyAsValue(merged, usage);
        }
        document.messages = merged;
        sortLocaleDocumentKeys({ document, emptyValueDirection: "bottom" });
        await writeLocaleDocument({ document });

        byFile.push({
            filePath,
            locale,
            addedKeys,
            usagesForAddedKeys,
        });
    }

    return { byFile };
}

/**
 * Scans source files for i18n keys. When `configure` is set, merges results into each locale file,
 * sorts keys, and writes JSON back to disk.
 */
export async function collect(
    options: CollectOptions,
    configure?: NormalizeConfiguration,
): Promise<CollectResult> {
    const result = collectScan(options, configure);
    if (configure) {
        result.mergeReport = await persistCollectResults(configure, result.usage);
    }
    return result;
}

/** Stdout summary: unique new keys, total per-file slots; “涉及文件” = deduped usage source paths for added keys. */
export function printCollectMergeSummary(report: CollectMergeReport, usage: CollectResult["usage"]): void {
    const unionKeys = new Set<string>();
    let totalSlots = 0;

    for (const row of report.byFile) {
        totalSlots += row.addedKeys.length;
        for (const k of row.addedKeys) {
            unionKeys.add(k);
        }
    }

    if (totalSlots === 0) {
        console.log(`Collect completed: no new keys found;`);
        return;
    }

    const usageSourcePaths = new Set<string>();
    for (const key of unionKeys) {
        const bucket = usage[key];
        if (!bucket?.length) continue;
        for (const u of bucket) {
            usageSourcePaths.add(u.filePath);
        }
    }
    const sortedUsagePaths = [...usageSourcePaths].sort((a, b) => a.localeCompare(b));

    console.log(`Collect completed: added ${unionKeys.size} new keys; total ${totalSlots} slots in ${report.byFile.length} locale files`);
    console.log(`${sortedUsagePaths.length} source code files (usage deduped):`);
    for (const p of sortedUsagePaths) {
        console.log(`  ${p}`);
    }
}
