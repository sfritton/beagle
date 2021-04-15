#!/usr/bin/env node

import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import path from 'path';
import program from 'commander';

clear();
console.log(chalk.red(figlet.textSync('beagle', { horizontalLayout: 'full' })));

program
  .version('0.1.0')
  .description('A CLI tool that sniffs out unused exports in TypeScript and Javascript.');
