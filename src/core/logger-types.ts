/**
 * Type definitions for the logger system
 */

/**
 * Log level numeric constants
 */
export const LOG_LEVEL_VALUES = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
} as const;

/**
 * Log levels for controlling verbosity of logging output
 */
export enum LogLevel {
  DEBUG = LOG_LEVEL_VALUES.DEBUG,
  INFO = LOG_LEVEL_VALUES.INFO,
  WARN = LOG_LEVEL_VALUES.WARN,
  ERROR = LOG_LEVEL_VALUES.ERROR,
  FATAL = LOG_LEVEL_VALUES.FATAL,
}

export interface LogEntry {
  timestamp?: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
  };
  stack?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logFile?: string;
  maxFileSize?: number; // bytes
  maxFiles?: number;
  enableColors: boolean;
  includeTimestamp: boolean;
  includeContext: boolean;
}

export interface ConsoleOutputConfig {
  enableColors: boolean;
  includeTimestamp: boolean;
  includeContext: boolean;
}

export interface FileLoggerConfig {
  enabled: boolean;
  logFile?: string;
  maxFileSize?: number; // bytes
  maxFiles?: number;
}
