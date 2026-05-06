import { loadConfiguration } from "@/configuration/load";
import { lint } from "@/features/lint/lint";
import { LintReportFormatter } from "@/formatters/report-formatter";

export async function runLintCommand(options: { c?: string }): Promise<void> {
    const configurePath = options.c;
    if (!configurePath) {
        throw new Error("Missing configuration file: pass -c <path> to intl.config.json");
    }

    const configure = loadConfiguration(process.cwd(), configurePath);
    const { issues } = await lint(configure);

    const formatter = new LintReportFormatter();

    if (issues.length > 0) {
        formatter.logIssues(issues);
    } else {
        console.log("No issues found.");
    }

    if (issues.some((i) => i.severity === "error")) {
        process.exit(1);
    }
}
