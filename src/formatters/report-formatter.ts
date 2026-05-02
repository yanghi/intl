import type { OperationSummary } from '../core/models/operation-summary';
import type { LintIssue } from '../core/lint/lint-issue';

export interface ReportFormatter<TOutput> {
  format(output: TOutput, summary: OperationSummary): Promise<string>;
}

export class LintReportFormatter {
  private severityIcons: Record<string, string> = {
    error: '✖',
    warning: '⚠',
    off: '○',
  };

  async format(issues: LintIssue[]): Promise<string> {
    const issuesByFile = this.groupIssuesByFile(issues);
    let output = '';

    for (const [filePath, fileIssues] of issuesByFile) {
      output += `${filePath}\n`;
      
      for (const issue of fileIssues) {
        const icon = this.severityIcons[issue.severity] || '○';
        const location = issue.key ? ` at ${issue.key}` : '';
        output += `   ${icon} ${issue.code}: ${issue.message}${location}\n`;
      }
    }

    return output.trim();
  }

  private groupIssuesByFile(issues: LintIssue[]): Map<string, LintIssue[]> {
    const map = new Map<string, LintIssue[]>();
    
    for (const issue of issues) {
      const filePath = issue.filePath || 'unknown';
      if (!map.has(filePath)) {
        map.set(filePath, []);
      }
      map.get(filePath)!.push(issue);
    }

    return map;
  }
}
