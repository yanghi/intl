import type { ExecutionContext } from '../context/execution-context';
import type { LocaleDocument } from '../models/locale-document';

export interface LocaleRepository {
  loadAll(context: ExecutionContext): Promise<LocaleDocument[]>;
  save(document: LocaleDocument): Promise<void>;
}
