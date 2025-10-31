/**
 * Console output handler for structured logging without direct console statements
 */

import { LogLevel, LogEntry, ConsoleOutputConfig } from './logger-types';

// ANSI color codes for console output
const ANSI_COLORS = {
  DEBUG: '\x1B[36m', // Cyan
  INFO: '\x1B[32m', // Green
  WARN: '\x1B[33m', // Yellow
  ERROR: '\x1B[31m', // Red
  FATAL: '\x1B[35m', // Magenta
  RESET: '\x1B[0m',
} as const;

const DEFAULT_LOG_LEVEL_PADDING = 6;

/**
 * Console output handler that avoids direct console statements
 */
export class ConsoleOutputHandler {
  private config: ConsoleOutputConfig;

  /**
   * Creates a new console output handler
   * @param {ConsoleOutputConfig} config - Console output configuration
   */
  constructor(config: ConsoleOutputConfig) {
    this.config = config;
  }

  /**
   * Write log entry to appropriate output stream based on log level
   * @param {LogEntry} entry - The log entry to write
   */
  writeToOutput(entry: LogEntry): void {
    const formattedOutput = this.formatConsoleOutput(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        this.writeDebug(formattedOutput);
        break;
      case LogLevel.INFO:
        this.writeInfo(formattedOutput);
        break;
      case LogLevel.WARN:
        this.writeWarning(formattedOutput);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        this.writeError(entry, formattedOutput);
        break;
      default:
        this.writeLog(formattedOutput);
        break;
    }
  }

  /**
   * Write debug output
   * @param {string} message - Formatted message to write
   * @private
   */
  private writeDebug(message: string): void {
    process.stderr.write(`${message}\n`);
  }

  /**
   * Write info output
   * @param {string} message - Formatted message to write
   * @private
   */
  private writeInfo(message: string): void {
    process.stdout.write(`${message}\n`);
  }

  /**
   * Write warning output
   * @param {string} message - Formatted message to write
   * @private
   */
  private writeWarning(message: string): void {
    process.stderr.write(`${message}\n`);
  }

  /**
   * Write error output with error details
   * @param {LogEntry} entry - The original log entry
   * @param {string} _formattedOutput - Base formatted output (unused, error details handled separately)
   * @private
   */
  private writeError(entry: LogEntry, _formattedOutput: string): void {
    // For errors, format base output without error details, then add error details
    const baseEntry = { ...entry, error: undefined, stack: undefined };
    const baseOutput = this.formatConsoleOutput(baseEntry);

    if (entry.error) {
      // Format error details with newlines to match expected test output
      if (entry.stack) {
        const errorMessage = `${baseOutput}\nError: ${entry.error.message}\nStack: ${entry.stack}`;
        process.stderr.write(`${errorMessage}\n`);
      } else {
        const errorMessage = `${baseOutput}\nError: ${entry.error.message}`;
        process.stderr.write(`${errorMessage}\n`);
      }
    } else {
      process.stderr.write(`${baseOutput}\n`);
    }
  }

  /**
   * Write standard log output
   * @param {string} message - Formatted message to write
   * @private
   */
  private writeLog(message: string): void {
    process.stdout.write(`${message}\n`);
  }

  /**
   * Format log entry for console output
   * @param {LogEntry} entry - The log entry to format
   * @returns {string} Formatted output string
   * @private
   */
  private formatConsoleOutput(entry: LogEntry): string {
    const { levelName, colorCode, resetCode } = this.getLevelFormatting(entry.level);
    let output = '';

    if (this.config.includeTimestamp && entry.timestamp) {
      output += `[${entry.timestamp}] `;
    }

    output += `${colorCode}${levelName}${resetCode} ${entry.message}`;

    output += this.formatContextAndError(entry);

    return output;
  }

  /**
   * Get level formatting information
   * @param {LogLevel} level - The log level
   * @returns {object} Level formatting information
   * @private
   */
  private getLevelFormatting(level: LogLevel): {
    levelName: string;
    colorCode: string;
    resetCode: string;
  } {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    const rawLevelName = levelNames[level] || 'UNKNOWN';
    const levelName = rawLevelName.padEnd(DEFAULT_LOG_LEVEL_PADDING);
    const colorCode = this.config.enableColors
      ? ANSI_COLORS[levelNames[level] as keyof typeof ANSI_COLORS]
      : '';
    const resetCode = this.config.enableColors ? ANSI_COLORS.RESET : '';

    return { levelName, colorCode, resetCode };
  }

  /**
   * Format context and error information
   * @param {LogEntry} entry - The log entry
   * @returns {string} Formatted context and error string
   * @private
   */
  private formatContextAndError(entry: LogEntry): string {
    let output = '';

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += ` ${JSON.stringify(entry.context)}`;
    }

    // Note: Error details are handled in writeError method to avoid duplication
    if (entry.error && !this.isErrorOrFatal(entry.level)) {
      output += `\nError: ${entry.error.message}`;
      if (entry.stack) {
        output += `\nStack: ${entry.stack}`;
      }
    }

    return output;
  }

  /**
   * Check if the log level is ERROR or FATAL
   * @param {LogLevel} level - The log level to check
   * @returns {boolean} True if level is ERROR or FATAL
   * @private
   */
  private isErrorOrFatal(level: LogLevel): boolean {
    return level === LogLevel.ERROR || level === LogLevel.FATAL;
  }
}
