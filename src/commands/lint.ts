import type { ExecutionContext } from '../core/context/execution-context';
import type {
  IntlEngineContract,
  LintResult,
} from '../core/engine/intl-engine-contract';

export async function runLintCommand(
  engine: IntlEngineContract,
  context: ExecutionContext,
): Promise<LintResult> {
  return engine.lint(context);
}
