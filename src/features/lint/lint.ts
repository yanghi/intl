import { resolve } from "node:path";
import type {
    IntlRuleConfiguration,
    RawIntlRuleConfiguration,
    NormalizeConfiguration,
} from "@/configuration/configuration";
import { loadLocaleDocuments } from "@/core/document/locale/locale-document";
import { Linter } from "@/core/lint/linter";
import type { LintIssue } from "@/core/lint/lint-issue";
import type { Rule } from "@/core/rule/rule";
import { rules as registeredRules } from "@/rules";

function resolveProjectRoot(configure: NormalizeConfiguration): string {
    const rel = configure.rawConfiguration.root;
    const segment = rel !== undefined && rel !== "" ? rel : ".";
    return resolve(configure.rootDirPath, segment);
}

/** Built-in default rule settings; shallow-merged with {@link IntlConfiguration.rules}. */
export const DEFAULT_LINT_RULES: Record<string, IntlRuleConfiguration> = {
    "no-mixed-punctuation": { severity: "error" },
    "consistent-script": { severity: "warning" },
    "first-letter-uppercase": { severity: "error" },
    'no-empty-message': { severity: "error" },
    'space-between-cjk-and-latin': { severity: "warning" },
};

const RULES_BY_CODE: Record<string, Rule> = Object.fromEntries(
    registeredRules.map((rule) => [rule.code, rule]),
);

export function normalizeRawRuleConfiguration(raw: RawIntlRuleConfiguration): IntlRuleConfiguration {
    if (typeof raw === "string") {
        return { severity: raw };
    }
    if (Array.isArray(raw)) {
        const [severity, options = {}] = raw;
        return { ...options, severity };
    }
    return { ...raw };
}

/**
 * Shallow-merge per rule id: `{ ...defaults[id], ...normalizedUser[id] }`.
 * Union of keys comes from defaults and user.
 */
export function mergeLintRuleConfigurations(
    defaults: Record<string, IntlRuleConfiguration>,
    user: Record<string, RawIntlRuleConfiguration> | undefined,
): Record<string, IntlRuleConfiguration> {
    const keys = new Set([...Object.keys(defaults), ...Object.keys(user ?? {})]);
    const result: Record<string, IntlRuleConfiguration> = {};
    for (const key of keys) {
        const base = defaults[key] ?? {};
        const raw = user?.[key];
        if (raw === undefined) {
            result[key] = { ...base };
        } else {
            result[key] = { ...base, ...normalizeRawRuleConfiguration(raw) };
        }
    }
    return result;
}

function applyConfiguredSeverities(
    issues: LintIssue[],
    mergedRules: Record<string, IntlRuleConfiguration>,
): LintIssue[] {
    return issues.map((issue) => {
        const cfg = mergedRules[issue.code];
        const sev = cfg?.severity;
        if (sev === "warning" || sev === "error") {
            return { ...issue, severity: sev };
        }
        return issue;
    });
}

export interface LintResult {
    issues: LintIssue[];
    /** Effective rule config after merging defaults with {@link IntlConfiguration.rules}. */
    rules: Record<string, IntlRuleConfiguration>;
}

/**
 * Loads locale documents from {@link NormalizeConfiguration.localeFiles}, runs enabled lint rules,
 * and returns issues with severities taken from the merged rule configuration.
 * Rules with merged severity `off` are not executed.
 */
export async function lint(configure: NormalizeConfiguration): Promise<LintResult> {
    const mergedRules = mergeLintRuleConfigurations(
        DEFAULT_LINT_RULES,
        configure.rawConfiguration.rules,
    );

    const linter = new Linter();
    for (const [code, ruleConfig] of Object.entries(mergedRules)) {
        if (ruleConfig.severity === "off") {
            continue;
        }
        const rule = RULES_BY_CODE[code];
        if (rule) {
            linter.addRule(rule);
        }
    }

    const projectRoot = resolveProjectRoot(configure);
    const documents = await loadLocaleDocuments({
        cwd: projectRoot,
        localeFilePaths: configure.localeFiles,
    });

    const rawIssues = linter.lint(documents);
    return {
        issues: applyConfiguredSeverities(rawIssues, mergedRules),
        rules: mergedRules,
    };
}
