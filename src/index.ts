#!/usr/bin/env node

import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import { Command } from 'commander';
import { BeagleOptions } from './types';
import { beagle } from './beagle';

clear();
console.log(chalk.red(figlet.textSync('beagle', { horizontalLayout: 'full' })));

const program = new Command('beagle');
program
  .version('0.1.0')
  .arguments('<project_root>')
  .description('A CLI tool that sniffs out unused exports in TypeScript and Javascript projects.')
  .option('-v, --verbose', 'Enables extra console output', false)
  .parse(process.argv);

// the first argument passed should be the project root
beagle(process.argv[2], program, program.opts() as BeagleOptions);
