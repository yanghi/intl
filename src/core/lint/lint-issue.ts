export type Severity = 'error' | 'warning' | 'off';

export interface LintIssue {
  code: string;
  severity: Severity;
  message: string;
  locale?: string;
  key?: string;
  filePath?: string;
  suggestion?: string;
  details?: Record<string, unknown>;
}
