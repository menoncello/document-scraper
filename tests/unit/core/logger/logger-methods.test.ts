/**
 * Unit tests for Logger Methods
 * Tests for logging methods and log levels
 */

import { test, expect, beforeEach, afterEach, describe } from 'bun:test';
import { existsSync, unlinkSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Logger, LogLevel } from '../../../../src/index';

// Helper function to verify log entry
function verifyLogEntry(
  logContent: string,
  expectedLevel: LogLevel,
  expectedMessage: string,
  expectedContext?: any
) {
  const logEntry = JSON.parse(logContent.trim());
  expect(logEntry.level).toBe(expectedLevel);
  expect(logEntry.message).toBe(expectedMessage);
  if (expectedContext) {
    expect(logEntry.context).toEqual(expectedContext);
  }
  expect(logEntry.timestamp).toBeDefined();
}

describe('Logger - Logging Methods', () => {
  let logger: Logger;
  let testLogFile: string;
  let testLogDir: string;

  beforeEach(() => {
    testLogDir = join(process.cwd(), 'test-logs');
    testLogFile = join(testLogDir, 'test.log');

    // Ensure test directory exists
    if (!existsSync(testLogDir)) {
      mkdirSync(testLogDir, { recursive: true });
    }

    // Create logger with test configuration
    logger = new Logger({
      level: LogLevel.DEBUG,
      enableConsole: false, // Disable console for most tests
      enableFile: true,
      logFile: testLogFile,
      enableColors: false, // Disable colors for consistent testing
      includeTimestamp: true,
      includeContext: true,
      maxFileSize: 1024, // Small size for testing rotation
      maxFiles: 3,
    });
  });

  afterEach(() => {
    // Remove test log files
    try {
      if (existsSync(testLogFile)) {
        unlinkSync(testLogFile);
      }
      for (let i = 1; i <= 5; i++) {
        const rotatedFile = `${testLogFile}.${i}`;
        if (existsSync(rotatedFile)) {
          unlinkSync(rotatedFile);
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Basic Logging Methods', () => {
    test('should log debug messages', () => {
      logger.debug('Debug message', { key: 'value' });

      const logContent = readFileSync(testLogFile, 'utf-8');
      verifyLogEntry(logContent, LogLevel.DEBUG, 'Debug message', { key: 'value' });
    });

    test('should log info messages', () => {
      logger.info('Info message', { count: 42 });

      const logContent = readFileSync(testLogFile, 'utf-8');
      verifyLogEntry(logContent, LogLevel.INFO, 'Info message', { count: 42 });
    });

    test('should log warning messages', () => {
      logger.warn('Warning message', { warning: 'test' });

      const logContent = readFileSync(testLogFile, 'utf-8');
      verifyLogEntry(logContent, LogLevel.WARN, 'Warning message', { warning: 'test' });
    });

    test('should log error messages with Error object', () => {
      const error = new Error('Test error');
      logger.error('Error message', error, { errorCode: 500 });

      const logContent = readFileSync(testLogFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());

      expect(logEntry.level).toBe(LogLevel.ERROR);
      expect(logEntry.message).toBe('Error message');
      expect(logEntry.error?.message).toBe('Test error');
      expect(logEntry.stack).toBeDefined();
      expect(logEntry.context).toEqual({ errorCode: 500 });
    });

    test('should log fatal messages', () => {
      const error = new Error('Fatal error');
      logger.fatal('Fatal message', error);

      const logContent = readFileSync(testLogFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());

      expect(logEntry.level).toBe(LogLevel.FATAL);
      expect(logEntry.message).toBe('Fatal message');
      expect(logEntry.error?.message).toBe('Fatal error');
      expect(logEntry.stack).toBeDefined();
    });
  });

  describe('Log Level Filtering', () => {
    test('should not log messages below configured level', () => {
      logger.setLevel(LogLevel.WARN);

      logger.debug('Debug message'); // Should not log
      logger.info('Info message'); // Should not log
      logger.warn('Warning message'); // Should log
      logger.error('Error message'); // Should log

      const logContent = readFileSync(testLogFile, 'utf-8');
      const logLines = logContent.trim().split('\n');

      expect(logLines.length).toBe(2);

      const warnEntry = JSON.parse(logLines[0]);
      const errorEntry = JSON.parse(logLines[1]);

      expect(warnEntry.level).toBe(LogLevel.WARN);
      expect(errorEntry.level).toBe(LogLevel.ERROR);
    });
  });
});
