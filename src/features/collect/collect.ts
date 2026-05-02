import { readFileSync } from "node:fs";
import { relative, sep } from "node:path";
import { globSync } from "glob";
import { I18nUsage } from "@/core/document/code/i18n-usage/usage";
import { fastMatch } from "@/core/document/code/i18n-usage/fast-match";

export interface ScanOptions {
    cwd?: string
    t: string[];
    /**
     * Files to include in the scan.
     */
    include: string[]
    /**
     * Files to exclude from the scan.
     */
    exclude: string[]
}

export interface CollectOptions extends ScanOptions {

}

export interface CollectResult {
    usage: {
        [key: string]: I18nUsage[]
    };
}

function filePathForUsage(cwd: string, absolutePath: string): string {
    const rel = relative(cwd, absolutePath);
    return rel.split(sep).join("/");
}

export function collect(options: CollectOptions): CollectResult {
    const { t, include, exclude } = options;
    const cwd = options.cwd ?? process.cwd();

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
