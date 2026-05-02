import type {
  IntlEngineContract,
  TranslateInput,
  TranslateResult,
} from '../core/engine/intl-engine-contract';

export async function runTranslateCommand(
  engine: IntlEngineContract,
  input: TranslateInput,
): Promise<TranslateResult> {
  return engine.translate(input);
}
