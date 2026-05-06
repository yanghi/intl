#!/usr/bin/env node

import { program } from 'commander';
import { runCollectCommand } from '@/commands/collect';
import { runLintCommand } from '@/commands/lint';

program
  .command('collect')
  .option('-c <path>', 'configure file paths')
  .description('Collect all keys from code files')
  .action(async (options) => {
    try {
      await runCollectCommand(options);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('lint')
  .option('-c <path>', 'path to intl configuration file')
  .description('Lint locale message files')
  .action(async (options) => {
    try {
      await runLintCommand(options);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

program.parse(process.argv);