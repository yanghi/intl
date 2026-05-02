export type FixOperationType =
  | 'add-key'
  | 'remove-key'
  | 'replace-value'
  | 'normalize-placeholder';

export interface FixOperation {
  type: FixOperationType;
  locale: string;
  key: string;
  filePath: string;
  reason: string;
  nextValue?: string;
}
