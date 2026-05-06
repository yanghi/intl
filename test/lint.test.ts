import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadConfiguration } from "@/configuration/load";
import type { IntlRuleConfiguration, RawIntlRuleConfiguration } from "@/configuration/configuration";
import {
    DEFAULT_LINT_RULES,
    lint,
    mergeLintRuleConfigurations,
    normalizeRawRuleConfiguration,
} from "@/features/lint/lint";

const testDir = dirname(fileURLToPath(import.meta.url));
const lintFixtureRoot = join(testDir, "../test-files/lint-fixture");

describe("mergeLintRuleConfigurations", () => {
    it("shallow-merges user values over defaults per rule id", () => {
        const defaults: Record<string, IntlRuleConfiguration> = {
            "rule-a": { severity: "error", keep: 1 },
            "rule-b": { severity: "warning" },
        };
        const user: Record<string, RawIntlRuleConfiguration> = {
            "rule-a": { keep: 2 },
        };
        expect(mergeLintRuleConfigurations(defaults, user)).toEqual({
            "rule-a": { severity: "error", keep: 2 },
            "rule-b": { severity: "warning" },
        });
    });

    it("accepts severity shorthand string", () => {
        const merged = mergeLintRuleConfigurations(DEFAULT_LINT_RULES, {
            "consistent-script": "off",
        });
        expect(merged["consistent-script"]).toEqual({ severity: "off" });
        expect(merged["no-mixed-punctuation"]).toEqual(DEFAULT_LINT_RULES["no-mixed-punctuation"]);
    });

    it("accepts tuple form [severity, options]", () => {
        const merged = mergeLintRuleConfigurations(
            { r: { severity: "error" } },
            { r: ["warning", { note: "x" }] },
        );
        expect(merged.r).toEqual({ severity: "warning", note: "x" });
    });

    it("includes user-only rule keys with empty default base", () => {
        const merged = mergeLintRuleConfigurations(DEFAULT_LINT_RULES, {
            "custom-rule": "error",
        });
        expect(merged["custom-rule"]).toEqual({ severity: "error" });
    });
});

describe("normalizeRawRuleConfiguration", () => {
    it("normalizes string to severity object", () => {
        expect(normalizeRawRuleConfiguration("warning")).toEqual({ severity: "warning" });
    });
});

describe("lint", () => {
    it("returns issues from enabled built-in rules using merged severities", async () => {
        const configure = loadConfiguration(lintFixtureRoot, "intl.config.json");
        const { issues, rules } = await lint(configure);

        expect(rules["no-mixed-punctuation"]?.severity).toBe("error");
        expect(rules["consistent-script"]?.severity).toBe("warning");

        const codes = [...new Set(issues.map((i) => i.code))].sort();
        expect(codes).toContain("no-mixed-punctuation");
        expect(codes).toContain("consistent-script");

        const punctIssue = issues.find((i) => i.code === "no-mixed-punctuation");
        expect(punctIssue?.severity).toBe("error");
        expect(punctIssue?.key).toBe("mixedPunct");

        const scriptIssue = issues.find((i) => i.code === "consistent-script");
        expect(scriptIssue?.severity).toBe("warning");
        expect(scriptIssue?.key).toBe("mixedScript");
    });

    it("does not run rules configured as off", async () => {
        const configure = loadConfiguration(lintFixtureRoot, "intl.config.json");
        configure.rawConfiguration.rules = {
            ...configure.rawConfiguration.rules,
            "consistent-script": "off",
        };
        const { issues } = await lint(configure);
        expect(issues.some((i) => i.code === "consistent-script")).toBe(false);
        expect(issues.some((i) => i.code === "no-mixed-punctuation")).toBe(true);
    });

    it("applies configured severity override for a rule", async () => {
        const configure = loadConfiguration(lintFixtureRoot, "intl.config.json");
        configure.rawConfiguration.rules = {
            ...configure.rawConfiguration.rules,
            "no-mixed-punctuation": "warning",
        };
        const { issues } = await lint(configure);
        const punctIssue = issues.find((i) => i.code === "no-mixed-punctuation");
        expect(punctIssue?.severity).toBe("warning");
    });
});
