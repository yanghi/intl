export type Severity = 'error' | 'warning' | 'off';

export interface LintIssue {
  code: string;
  severity: Severity;
  message: string;
  locale?: string;
  key: string;
  value: string
  filePath?: string;
  suggestion?: string;
  details?: Record<string, unknown>;
  /**
   * based on the issue value, provide the location of the issue in the value
   */
  wavyLine?: {
    start: number;
    end: number;
  };
  /**
   * based on the issue message, provide the location of the issue in the message
   */
  messageWavyLine?: {
    start: number;
    end: number;
  };
  /**
   * fix the issue, return the fixed value or null if the issue cannot be fixed
   */
  fix?: (value:string,issue: LintIssue) => string | null
}
