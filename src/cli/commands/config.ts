import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Command } from 'commander';
import { ConfigManager } from '../../core/config.js';
import { loadConfig } from '../../index.js';

// Constants to replace magic numbers
const JSON_INDENTATION = 2;

// ANSI color codes for CLI output
const CLI_COLORS = {
  RED: '\x1B[31m',
  GREEN: '\x1B[32m',
  BLUE: '\x1B[34m',
  RESET: '\x1B[0m',
} as const;

/**
 * CLI output handler that avoids console statements and complies with ESLint rules
 */
class CliOutputHandler {
  /**
   * Write error message to stderr
   * @param {string} message - Error message to display
   */
  static writeError(message: string): void {
    process.stderr.write(`${CLI_COLORS.RED}${message}${CLI_COLORS.RESET}\n`);
  }

  /**
   * Write info message to stdout
   * @param {string} message - Info message to display
   */
  static writeInfo(message: string): void {
    process.stdout.write(`${CLI_COLORS.BLUE}${message}${CLI_COLORS.RESET}\n`);
  }

  /**
   * Write success message to stdout
   * @param {string} message - Success message to display
   */
  static writeSuccess(message: string): void {
    process.stdout.write(`${CLI_COLORS.GREEN}${message}${CLI_COLORS.RESET}\n`);
  }

  /**
   * Write validation errors to stderr
   * @param {string[]} errors - Array of validation error messages
   */
  static writeValidationErrors(errors: string[]): void {
    process.stdout.write(`${CLI_COLORS.RED}✗ Configuration validation failed${CLI_COLORS.RESET}\n`);
    for (const error of errors) {
      process.stderr.write(`${CLI_COLORS.RED}  - ${error}${CLI_COLORS.RESET}\n`);
    }
  }

  /**
   * Write JSON output to stdout
   * @param {unknown} data - Data to stringify and display
   * @param {number} indent - Number of spaces for indentation
   */
  static writeJson(data: unknown, indent: number = JSON_INDENTATION): void {
    process.stdout.write(JSON.stringify(data, null, indent));
    process.stdout.write('\n');
  }
}

/**
 * Handle configuration errors consistently
 * @param {string} message - Error context message
 * @param {unknown} error - The error object
 * @returns {never} Exits the process with error code
 */
function handleConfigError(message: string, error: unknown): never {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  CliOutputHandler.writeError(`${message}: ${errorMessage}`);
  process.exit(1);
}

/**
 * Validate configuration file existence
 * @param {string} file - Configuration file path
 */
function validateConfigFile(file: string): void {
  if (!existsSync(resolve(file))) {
    CliOutputHandler.writeError(`Configuration file not found: ${file}`);
    process.exit(1);
  }
}

/**
 * Process and display validation results
 * @param {ReturnType<typeof ConfigManager.validate>} validation - Validation result object
 */
function processValidationResults(validation: ReturnType<typeof ConfigManager.validate>): void {
  if (validation.valid) {
    CliOutputHandler.writeSuccess('✓ Configuration is valid');
    return;
  }

  if (validation.errors) {
    CliOutputHandler.writeValidationErrors(validation.errors);
  }
  process.exit(1);
}

export const configCommand = new Command('config')
  .description('Manage configuration files')
  .addCommand(
    new Command('validate')
      .description('Validate a configuration file')
      .argument('<file>', 'Configuration file path')
      .action(async (file: string) => {
        try {
          validateConfigFile(file);
          CliOutputHandler.writeInfo(`Validating configuration: ${file}`);

          const validation = ConfigManager.validate(loadConfig(file));
          processValidationResults(validation);
        } catch (error) {
          handleConfigError('Error validating config', error);
        }
      })
  )
  .addCommand(
    new Command('show')
      .description('Show configuration file content')
      .argument('<file>', 'Configuration file path')
      .action(async (file: string) => {
        try {
          validateConfigFile(file);
          const config = loadConfig(file);
          CliOutputHandler.writeInfo(`Configuration: ${file}`);
          CliOutputHandler.writeJson(config);
        } catch (error) {
          handleConfigError('Error loading config', error);
        }
      })
  );
