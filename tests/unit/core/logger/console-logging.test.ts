/**
 * Unit tests for Logger - Console Logging
 * Tests for console logging functionality
 */

import { test, expect, beforeEach, afterEach, describe, spyOn } from 'bun:test';
import { Logger, LogLevel } from '../../../../src/index';

// Helper function to verify console output - moved to outer scope
function verifyConsoleOutput(spyMethod: any, expectedLevel: string, expectedMessage: string) {
  expect(spyMethod).toHaveBeenCalled();
  const callData = spyMethod.mock.calls[0][0];
  expect(callData).toContain(expectedLevel);
  expect(callData).toContain(expectedMessage);
}

describe('Logger - Console Logging', () => {
  let logger: Logger;
  let consoleSpy: any;

  beforeEach(() => {
    // Mock process stdout and stderr since logger uses ConsoleOutputHandler which writes to process streams
    consoleSpy = {
      debug: spyOn(process.stderr, 'write').mockImplementation(() => true),
      info: spyOn(process.stdout, 'write').mockImplementation(() => true),
      warn: spyOn(process.stderr, 'write').mockImplementation(() => true),
      error: spyOn(process.stderr, 'write').mockImplementation(() => true),
      log: spyOn(process.stdout, 'write').mockImplementation(() => true),
    };

    // Create logger with console enabled
    logger = new Logger({
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: false,
    });
  });

  afterEach(() => {
    // Restore process methods
    for (const spy of Object.values(consoleSpy)) {
      (spy as any).mockRestore();
    }
  });

  describe('Basic Console Logging', () => {
    test('should log debug messages to console', () => {
      // Given: Logger at DEBUG level
      const message = 'Debug message';
      const context = { userId: '123', action: 'test' };

      // When: Logging debug message
      logger.debug(message, context);

      // Then: Should call console.debug
      verifyConsoleOutput(consoleSpy.debug, 'DEBUG', message);
    });

    test('should log info messages to console', () => {
      // Given: Logger at INFO level
      const message = 'Info message';
      const context = { operation: 'test' };

      // When: Logging info message
      logger.info(message, context);

      // Then: Should call console.info
      verifyConsoleOutput(consoleSpy.info, 'INFO', message);
    });

    test('should log warning messages to console', () => {
      // Given: Logger at WARN level
      const message = 'Warning message';
      const context = { warning: 'test warning' };

      // When: Logging warning message
      logger.warn(message, context);

      // Then: Should call console.warn
      verifyConsoleOutput(consoleSpy.warn, 'WARN', message);
    });
  });

  describe('Error Console Logging', () => {
    test('should log error messages to console', () => {
      // Given: Logger at ERROR level
      const message = 'Error message';
      const error = new Error('Test error');
      const context = { errorCode: 'TEST_ERR' };

      // When: Logging error message
      logger.error(message, error, context);

      // Then: Should call process.stderr.write with formatted error string
      expect(consoleSpy.error).toHaveBeenCalled();
      // The entire error message is in a single string
      const callData = consoleSpy.error.mock.calls[0][0];
      expect(callData).toContain('ERROR');
      expect(callData).toContain(message);
      expect(callData).toContain('Error: Test error');
      expect(callData).toContain('Stack: Error: Test error');
    });

    test('should log fatal messages to console', () => {
      // Given: Logger at FATAL level
      const message = 'Fatal message';
      const error = new Error('Fatal error');
      const context = { system: 'critical' };

      // When: Logging fatal message
      logger.fatal(message, error, context);

      // Then: Should call process.stderr.write with formatted error string
      expect(consoleSpy.error).toHaveBeenCalled();
      // The entire error message is in a single string
      const callData = consoleSpy.error.mock.calls[0][0];
      expect(callData).toContain('FATAL');
      expect(callData).toContain(message);
      expect(callData).toContain('Error: Fatal error');
      expect(callData).toContain('Stack: Error: Fatal error');
    });
  });

  describe('Console Configuration', () => {
    test('should not log to console when disabled', () => {
      // Given: Logger with console disabled
      const disabledLogger = new Logger({
        level: LogLevel.DEBUG,
        enableConsole: false,
        enableFile: false,
      });

      // When: Logging messages
      disabledLogger.debug('Debug message');
      disabledLogger.info('Info message');
      disabledLogger.warn('Warning message');
      disabledLogger.error('Error message');

      // Then: Should not call any console methods
      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    test('should respect log level for console output', () => {
      // Create single spies for each process stream to avoid interference
      let debugCallCount = 0;
      let infoCallCount = 0;
      let warnCallCount = 0;
      let errorCallCount = 0;

      const stderrSpy = spyOn(process.stderr, 'write').mockImplementation((data: string) => {
        if (data.includes('Debug message')) {
          debugCallCount++;
        } else if (data.includes('Warning message')) {
          warnCallCount++;
        } else if (data.includes('Error message')) {
          errorCallCount++;
        }
        return true;
      });

      const stdoutSpy = spyOn(process.stdout, 'write').mockImplementation((data: string) => {
        if (data.includes('Info message')) {
          infoCallCount++;
        }
        return true;
      });

      // Given: Logger at WARN level
      const warnLogger = new Logger({
        level: LogLevel.WARN,
        enableConsole: true,
        enableFile: false,
      });

      // When: Logging at different levels
      warnLogger.debug('Debug message'); // Should not appear
      warnLogger.info('Info message'); // Should not appear
      warnLogger.warn('Warning message'); // Should appear
      warnLogger.error('Error message'); // Should appear

      // Then: Should only log WARN and above
      expect(debugCallCount).toBe(0);
      expect(infoCallCount).toBe(0);
      expect(warnCallCount).toBe(1);
      expect(errorCallCount).toBe(1);

      // Clean up the spies
      stderrSpy.mockRestore();
      stdoutSpy.mockRestore();
    });
  });

  describe('Console Output Formatting', () => {
    test('should format console output with context', () => {
      // Given: Logger with context
      const message = 'User action';
      const context = {
        userId: '12345',
        action: 'login',
        timestamp: '2023-01-01T12:00:00Z',
        metadata: { ip: '127.0.0.1' }, // Using localhost IP for safety
      };

      // When: Logging with context
      logger.info(message, context);

      // Then: Should include context in output
      expect(consoleSpy.info).toHaveBeenCalled();
      const output = consoleSpy.info.mock.calls[0][0];
      expect(output).toContain(message);
      expect(output).toContain('userId');
      expect(output).toContain('12345');
    });
  });
});
