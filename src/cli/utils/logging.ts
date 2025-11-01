import chalk from 'chalk';

/**
 * A CLI logger utility class that provides color-coded logging methods for process output.
 * This class uses chalk to add color and icons to different log levels for better readability.
 * Uses process.stdout.write and process.stderr.write to comply with ESLint no-console rule.
 */
export class CliLogger {
  /**
   * Logs an informational message with blue color and info icon to stdout.
   *
   * @param {string} message - The message to log
   */
  static info(message: string): void {
    const coloredMessage = chalk.blue(`ℹ ${message}`);
    process.stdout.write(`${coloredMessage}\n`);
  }

  /**
   * Logs a success message with green color and checkmark icon to stdout.
   *
   * @param {string} message - The message to log
   */
  static success(message: string): void {
    const coloredMessage = chalk.green(`✓ ${message}`);
    process.stdout.write(`${coloredMessage}\n`);
  }

  /**
   * Logs a warning message with yellow color and warning icon to stdout.
   *
   * @param {string} message - The message to log
   */
  static warning(message: string): void {
    const coloredMessage = chalk.yellow(`⚠ ${message}`);
    process.stdout.write(`${coloredMessage}\n`);
  }

  /**
   * Logs an error message with red color and error icon to stderr.
   *
   * @param {string} message - The message to log
   */
  static error(message: string): void {
    const coloredMessage = chalk.red(`✗ ${message}`);
    process.stderr.write(`${coloredMessage}\n`);
  }

  /**
   * Logs a debug message with gray color and bug icon to stdout. Only logs when DEBUG environment variable is set.
   *
   * @param {string} message - The message to log
   */
  static debug(message: string): void {
    if (process.env.DEBUG) {
      const coloredMessage = chalk.gray(`🐛 ${message}`);
      process.stdout.write(`${coloredMessage}\n`);
    }
  }
}
