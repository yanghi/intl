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
        const prefix = `   ${icon} ${issue.code}: `;
        output += `${prefix}${issue.message}${location}\n`;

        if (issue.wavyLine !== undefined && issue.value !== undefined) {
          const { start, end } = issue.wavyLine;
          const waveLen = Math.max(0, end - start);
          const pad = ' '.repeat(prefix.length);
          output += `${pad}${issue.value}\n`;
          if (waveLen > 0) {
            output += `${pad}${' '.repeat(start)}${'~'.repeat(waveLen)}\n`;
          }
        } else if (issue.messageWavyLine) {
          const { start, end } = issue.messageWavyLine;
          const waveLen = Math.max(0, end - start);
          if (waveLen > 0) {
            const leadingSpaces = prefix.length + start;
            output += `${' '.repeat(leadingSpaces)}${'~'.repeat(waveLen)}\n`;
          }
        }
      }
    }

    return output.trim();
  }
  logIssues(issues: LintIssue[]): void {
    const issuesByFile = this.groupIssuesByFile(issues);
    for (const [filePath, fileIssues] of issuesByFile) {
      console.log(`${filePath}:`);
      for (const issue of fileIssues) {
        const issuePrefix = `  ${issue.code}: `;
        console.log(`${issuePrefix}${issue.message}`);
        if (issue.wavyLine !== undefined && issue.value !== undefined) {
          const { start, end } = issue.wavyLine;
          const waveLen = Math.max(0, end - start);
          const pad = ' '.repeat(issuePrefix.length);
          console.log(`${pad}${issue.value}`);
          if (waveLen > 0) {
            console.log(`${pad}${' '.repeat(start)}${'~'.repeat(waveLen)}`);
          }
        } else if (issue.messageWavyLine) {
          const { start, end } = issue.messageWavyLine;
          const waveLen = Math.max(0, end - start);
          if (waveLen > 0) {
            const pad = ' '.repeat(issuePrefix.length);
            console.log(`${pad}${' '.repeat(start)}${'~'.repeat(waveLen)}`);
          }
        }
      }
      console.log('');
    }
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
