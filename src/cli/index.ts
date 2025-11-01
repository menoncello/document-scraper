#!/usr/bin/env bun

import chalk from 'chalk';
import { Command } from 'commander';
import { configCommand } from './commands/config.js';
import { scrapeCommand } from './commands/scrape.js';
import { validateCommand } from './commands/validate.js';

// Constants
const CLI_ARGS_OFFSET = 2;
const EXIT_SUCCESS = 0;
const EXIT_ERROR = 1;

// CLI logger helper to avoid console usage
const cliLogger = {
  error: (message: string) => process.stderr.write(chalk.red(`Error: ${message}\n`)),
  warn: (message: string) => process.stdout.write(chalk.yellow(`${message}\n`)),
  info: (message: string) => process.stdout.write(`${message}\n`),
};

const program = new Command();

program
  .name('docs-scrape')
  .description('CLI tool for web scraping and data export')
  .version('1.0.0');

// Register commands
program.addCommand(scrapeCommand);
program.addCommand(configCommand);
program.addCommand(validateCommand);

// Global error handler
program.exitOverride(err => {
  if (err.code === 'commander.help') {
    process.exit(EXIT_SUCCESS);
  }
  cliLogger.error(err.message);
  process.exit(EXIT_ERROR);
});

// Parse command line arguments
program.parse();

// Handle no command provided
if (process.argv.slice(CLI_ARGS_OFFSET).length === 0) {
  cliLogger.warn('No command provided. Use --help for available commands.');
  program.outputHelp();
}
