import type { ExecutionContext } from '../core/context/execution-context';
import type {
  CollectResult,
  IntlEngineContract,
} from '../core/engine/intl-engine-contract';

export async function runCollectCommand(
  engine: IntlEngineContract,
  context: ExecutionContext,
): Promise<CollectResult> {
  return engine.collect(context);
}
