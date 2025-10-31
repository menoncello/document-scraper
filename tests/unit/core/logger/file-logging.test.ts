/**
 * Unit tests for Logger - File Logging
 * Tests for file logging functionality
 */

import { test, expect, beforeEach, afterEach, describe } from 'bun:test';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Logger, LogLevel } from '../../../../src/index';

// Helper function to verify log content - moved to outer scope
function verifyLogContent(filePath: string, expectedContent: string[], shouldContain = true) {
  expect(existsSync(filePath)).toBe(true);
  const logContent = readFileSync(filePath, 'utf8');

  for (const content of expectedContent) {
    if (shouldContain) {
      expect(logContent).toContain(content);
    } else {
      expect(logContent).not.toContain(content);
    }
  }

  return logContent;
}

describe('Logger - File Logging', () => {
  let logger: Logger;
  let logDir: string;
  let logFilePath: string;

  beforeEach(() => {
    // Set up test directory
    logDir = 'logs';
    logFilePath = join(logDir, 'test.log');

    // Clean up any existing logs
    if (existsSync(logDir)) {
      rmSync(logDir, { recursive: true, force: true });
    }

    // Create logger with file logging enabled
    logger = new Logger({
      level: LogLevel.DEBUG,
      enableConsole: false, // Disable console for cleaner test output
      enableFile: true,
      logFile: 'test.log',
    });
  });

  afterEach(() => {
    // Clean up test logs
    if (existsSync(logDir)) {
      rmSync(logDir, { recursive: true, force: true });
    }
  });

  describe('File Creation and Basic Logging', () => {
    test('should create log directory if it does not exist', () => {
      // Given: Logger with file logging enabled
      // When: Logging a message
      logger.info('Test message');

      // Then: Log directory should be created
      expect(existsSync(logDir)).toBe(true);
    });

    test('should create log file and write messages', () => {
      // Given: Logger with file logging enabled
      const message = 'Test log message';

      // When: Logging a message
      logger.info(message);

      // Then: Log file should be created and contain message
      // Log level 1 corresponds to INFO
      verifyLogContent(logFilePath, [message, '"level":1']);
    });
  });

  describe('Basic Log Level Messages', () => {
    test('should log debug messages to file', () => {
      // Given: Logger at DEBUG level
      const message = 'Debug message';
      const context = { debug: true, level: 'verbose' };

      // When: Logging debug message
      logger.debug(message, context);

      // Then: File should contain debug message
      // Log level 0 corresponds to DEBUG
      verifyLogContent(logFilePath, [message, '"level":0', 'debug']);
    });

    test('should log info messages to file', () => {
      // Given: Logger at INFO level
      const message = 'Info message';
      const context = { operation: 'test', status: 'success' };

      // When: Logging info message
      logger.info(message, context);

      // Then: File should contain info message
      // Log level 1 corresponds to INFO
      verifyLogContent(logFilePath, [message, '"level":1', 'operation']);
    });

    test('should log warning messages to file', () => {
      // Given: Logger at WARN level
      const message = 'Warning message';
      const context = { warning: 'deprecated', alternative: 'new-method' };

      // When: Logging warning message
      logger.warn(message, context);

      // Then: File should contain warning message
      // Log level 2 corresponds to WARN
      verifyLogContent(logFilePath, [message, '"level":2', 'deprecated']);
    });
  });

  describe('Error and Fatal Messages', () => {
    test('should log error messages to file', () => {
      // Given: Logger at ERROR level
      const message = 'Error message';
      const error = new Error('Test error with stack');
      const context = { errorCode: 'TEST_ERR', userId: '123' };

      // When: Logging error message
      logger.error(message, error, context);

      // Then: File should contain error message and stack
      // Log level 3 corresponds to ERROR, error is stored with proper serialization
      verifyLogContent(logFilePath, [
        message,
        '"level":3',
        '"error":{"name":"Error","message":"Test error with stack"}',
        'Test error with stack',
        'TEST_ERR',
      ]);
    });

    test('should log fatal messages to file', () => {
      // Given: Logger at FATAL level
      const message = 'Fatal system error';
      const error = new Error('Critical failure');
      const context = { system: 'critical', service: 'database' };

      // When: Logging fatal message
      logger.fatal(message, error, context);

      // Then: File should contain fatal message
      // Log level 4 corresponds to FATAL, error is stored with proper serialization
      verifyLogContent(logFilePath, [
        message,
        '"level":4',
        '"error":{"name":"Error","message":"Critical failure"}',
        'Critical failure',
        'database',
      ]);
    });
  });

  describe('Multiple Messages and Appending', () => {
    test('should append multiple messages to file', () => {
      // Given: Multiple log messages
      const messages = [
        { level: 'info', message: 'First message' },
        { level: 'debug', message: 'Second message' },
        { level: 'warn', message: 'Third message' },
      ];

      // When: Logging multiple messages
      logger.info(messages[0].message);
      logger.debug(messages[1].message);
      logger.warn(messages[2].message);

      // Then: All messages should be in file
      const logContent = verifyLogContent(logFilePath, []);
      for (const msg of messages) {
        expect(logContent).toContain(msg.message);
      }
    });
  });

  describe('Log Level Filtering', () => {
    test('should respect log level for file output', () => {
      // Given: Logger at WARN level
      const warnLogger = new Logger({
        level: LogLevel.WARN,
        enableConsole: false,
        enableFile: true,
        logFile: 'warn-test.log',
      });

      // When: Logging at different levels
      warnLogger.debug('Debug message'); // Should not appear
      warnLogger.info('Info message'); // Should not appear
      warnLogger.warn('Warning message'); // Should appear
      warnLogger.error('Error message'); // Should appear

      // Then: Only WARN and above should be in file
      const warnLogPath = join(logDir, 'warn-test.log');
      const logContent = verifyLogContent(warnLogPath, ['Warning message', 'Error message']);
      expect(logContent).not.toContain('Debug message');
      expect(logContent).not.toContain('Info message');
    });

    test('should not log to file when disabled', () => {
      // Given: Logger with file logging disabled and different log file path
      const disabledLogPath = join(logDir, 'disabled.log');
      const disabledLogger = new Logger({
        level: LogLevel.DEBUG,
        enableConsole: false,
        enableFile: false,
        logFile: disabledLogPath,
      });

      // When: Logging messages
      disabledLogger.info('This should not be logged');
      disabledLogger.error('Neither should this');

      // Then: No log file should be created
      expect(existsSync(disabledLogPath)).toBe(false);
    });
  });

  describe('Custom File Paths', () => {
    test('should handle custom log file path', () => {
      // Given: Custom log file path
      const customLogDir = join('custom-logs', 'nested');
      const customLogPath = join(customLogDir, 'custom.log');
      const customLogger = new Logger({
        level: LogLevel.INFO,
        enableConsole: false,
        enableFile: true,
        logFile: customLogPath,
      });

      // When: Logging a message
      customLogger.info('Custom log message');

      // Then: Should create custom path and log file
      verifyLogContent(customLogPath, ['Custom log message']);

      // Clean up custom directory
      rmSync('custom-logs', { recursive: true, force: true });
    });
  });
});
