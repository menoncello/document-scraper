import { existsSync } from 'node:fs';
import { Command } from 'commander';
import { CliLogger } from '../utils/logging.js';
import { validateUrl } from '../utils/validation.js';

export const validateCommand = new Command('validate')
  .description('Validate inputs and configurations')
  .addCommand(
    new Command('url')
      .description('Validate a URL')
      .argument('<url>', 'URL to validate')
      .action(async (url: string) => {
        try {
          if (validateUrl(url)) {
            CliLogger.success(`Valid URL: ${url}`);
          } else {
            CliLogger.error(`Invalid URL: ${url}`);
            process.exit(1);
          }
        } catch (error) {
          CliLogger.error(
            `Error validating URL: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('file')
      .description('Validate a file exists')
      .argument('<file>', 'File path to validate')
      .action(async (file: string) => {
        try {
          if (existsSync(file)) {
            CliLogger.success(`File exists: ${file}`);
          } else {
            CliLogger.error(`File not found: ${file}`);
            process.exit(1);
          }
        } catch (error) {
          CliLogger.error(
            `Error validating file: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          process.exit(1);
        }
      })
  );
