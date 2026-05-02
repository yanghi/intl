import type { ExecutionContext } from '../context/execution-context';
import type { CollectedKey } from '../models/collected-key';

export interface KeyCollector {
  collect(context: ExecutionContext): Promise<CollectedKey[]>;
}
