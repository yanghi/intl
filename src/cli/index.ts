import type { IntlEngineContract } from '../core/engine/intl-engine-contract';
import { runCollectCommand } from '../commands/collect';
import { runFixCommand } from '../commands/fix';
import { runLintCommand } from '../commands/lint';
import { runTranslateCommand } from '../commands/translate';

export interface CliCommandRegistry {
  lint: typeof runLintCommand;
  collect: typeof runCollectCommand;
  translate: typeof runTranslateCommand;
  fix: typeof runFixCommand;
}

export function createCliCommandRegistry(
  _engine: IntlEngineContract,
): CliCommandRegistry {
  return {
    lint: runLintCommand,
    collect: runCollectCommand,
    translate: runTranslateCommand,
    fix: runFixCommand,
  };
}
