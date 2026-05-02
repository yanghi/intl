import type {
  FixInput,
  FixResult,
  IntlEngineContract,
} from '../core/engine/intl-engine-contract';

export async function runFixCommand(
  engine: IntlEngineContract,
  input: FixInput,
): Promise<FixResult> {
  return engine.fix(input);
}
