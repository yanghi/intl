export interface ExecutionContext {
  cwd: string;
  dryRun: boolean;
  referenceLocale: string;
  locales: string[];
  include?: string[];
  exclude?: string[];
}
