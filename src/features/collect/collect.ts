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
    useage: {
        [key: string]: I18nUsage[]
    };
}


export function collect(options: CollectOptions): CollectResult {
    const { t, include, exclude, cwd } = options;

    const result: CollectResult = {
        useage: {},
    }

    return result
}