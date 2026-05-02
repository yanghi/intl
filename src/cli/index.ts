#!/usr/bin/env node

import { program } from 'commander';
import { runCollectCommand } from '@/commands/collect';
program
  .command('collect')
  .option('-c', 'configure file paths')
  .description('Collect all keys from code files')
  .action(async (options) => {
    await runCollectCommand(options);
  });

program.parse(process.argv);