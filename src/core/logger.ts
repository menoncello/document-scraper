/**
 * Structured logging system for debugging and monitoring
 * Refactored to use modular components and stay within line limits
 */

import { ConsoleOutputHandler } from './console-handler';
import { FileLogger } from './file-logger';
import {
  LogLevel,
  LogEntry,
  LoggerConfig,
  ConsoleOutputConfig,
  FileLoggerConfig,
} from './logger-types';

// Re-export LogLevel for convenience
export { LogLevel };

// Constants for default configuration
const DEFAULT_MAX_FILE_SIZE_MB = 10;
const BYTES_PER_KB = 1024;
const BYTES_PER_MB = 1024;
const DEFAULT_MAX_FILE_SIZE_BYTES = DEFAULT_MAX_FILE_SIZE_MB * BYTES_PER_KB * BYTES_PER_MB;

/**
 * Logger class for structured logging with console and file output support
 */
export class Logger {
  private config: LoggerConfig;
  private consoleHandler: ConsoleOutputHandler;
  private fileLogger: FileLogger;
  private static instance: Logger | null = null;

  /**
   * Creates a new Logger instance with the specified configuration
   * @param {Partial<LoggerConfig>} config - Partial configuration object to override defaults
   */
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      enableColors: true,
      includeTimestamp: true,
      includeContext: true,
      maxFileSize: DEFAULT_MAX_FILE_SIZE_BYTES, // 10MB
      maxFiles: 5,
      ...config,
    };

    // Initialize console handler
    const consoleConfig: ConsoleOutputConfig = {
      enableColors: this.config.enableColors,
      includeTimestamp: this.config.includeTimestamp,
      includeContext: this.config.includeContext,
    };
    this.consoleHandler = new ConsoleOutputHandler(consoleConfig);

    // Initialize file logger
    const fileConfig: FileLoggerConfig = {
      enabled: this.config.enableFile,
      logFile: this.config.logFile,
      maxFileSize: this.config.maxFileSize,
      maxFiles: this.config.maxFiles,
    };
    this.fileLogger = new FileLogger(fileConfig);
    this.fileLogger.initializeFileLogging();
  }

  /**
   * Get singleton logger instance
   * @param {Partial<LoggerConfig>} config - Optional configuration object to use when creating the instance
   * @returns {Logger} The singleton Logger instance
   */
  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  /**
   * Log debug message
   * @param {string} message - The debug message to log
   * @param {Record<string, unknown>} context - Additional context information to include with the log
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   * @param {string} message - The info message to log
   * @param {Record<string, unknown>} context - Additional context information to include with the log
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   * @param {string} message - The warning message to log
   * @param {Record<string, unknown>} context - Additional context information to include with the log
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   * @param {string} message - The error message to log
   * @param {Error} error - Optional Error object to include with the log
   * @param {Record<string, unknown>} context - Additional context information to include with the log
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log fatal error message
   * @param {string} message - The fatal error message to log
   * @param {Error} error - Optional Error object to include with the log
   * @param {Record<string, unknown>} context - Additional context information to include with the log
   */
  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  /**
   * Log message with specified level
   * @param {LogLevel} level - The log level for this message
   * @param {string} message - The message to log
   * @param {Record<string, unknown>} context - Additional context information to include with the log
   * @param {Error} error - Optional Error object to include with the log
   * @private
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      ...(this.config.includeTimestamp && { timestamp: new Date().toISOString() }),
      level,
      message,
      context: this.config.includeContext ? context : undefined,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
        },
        stack: error.stack,
      }),
    };

    // Log to console
    if (this.config.enableConsole) {
      this.consoleHandler.writeToOutput(entry);
    }

    // Log to file
    if (this.config.enableFile) {
      this.fileLogger.logToFile(entry);
    }
  }

  /**
   * Update logger configuration with new values
   * @param {Partial<LoggerConfig>} config - Partial configuration object to merge with existing config
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };

    // Update console handler config
    const consoleConfig: ConsoleOutputConfig = {
      enableColors: this.config.enableColors,
      includeTimestamp: this.config.includeTimestamp,
      includeContext: this.config.includeContext,
    };
    this.consoleHandler = new ConsoleOutputHandler(consoleConfig);

    // Update file logger config
    const fileConfig: FileLoggerConfig = {
      enabled: this.config.enableFile,
      logFile: this.config.logFile,
      maxFileSize: this.config.maxFileSize,
      maxFiles: this.config.maxFiles,
    };
    this.fileLogger.updateConfig(fileConfig);
  }

  /**
   * Get current logger configuration
   * @returns {LoggerConfig} Current configuration object
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Set log level for filtering messages
   * @param {LogLevel} level - The minimum log level to output
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get current log level
   * @returns {LogLevel} Current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Enable/disable console logging
   * @param {boolean} enabled - Whether to enable console logging
   */
  setConsoleLogging(enabled: boolean): void {
    this.config.enableConsole = enabled;
  }

  /**
   * Enable/disable file logging
   * @param {boolean} enabled - Whether to enable file logging
   * @param {string} logFile - Optional log file path to set
   */
  setFileLogging(enabled: boolean, logFile?: string): void {
    this.config.enableFile = enabled;
    if (logFile) {
      this.config.logFile = logFile;
    }

    // Reinitialize file logger if needed
    const fileConfig: FileLoggerConfig = {
      enabled: this.config.enableFile,
      logFile: this.config.logFile,
      maxFileSize: this.config.maxFileSize,
      maxFiles: this.config.maxFiles,
    };
    this.fileLogger.updateConfig(fileConfig);
    this.fileLogger.initializeFileLogging();
  }

  /**
   * Clear all log files including rotated versions
   */
  clearLogs(): void {
    this.fileLogger.clearLogs();
  }
}
