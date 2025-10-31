/**
 * Comprehensive test coverage for ConsoleOutputHandler
 * Focuses on edge cases, error conditions, and uncovered code paths
 */

import { describe, test, expect, beforeEach, afterEach, jest } from 'bun:test';
import { ConsoleOutputHandler } from '../../../src/core/console-handler';
import { LogLevel, LogEntry, ConsoleOutputConfig } from '../../../src/core/logger-types';

// Mock process.stdout and process.stderr to capture output
let originalStdoutWrite: typeof process.stdout.write;
let originalStderrWrite: typeof process.stderr.write;
let stdoutOutput: string[] = [];
let stderrOutput: string[] = [];

describe('ConsoleOutputHandler Coverage Tests', () => {
  let handler: ConsoleOutputHandler;
  let defaultConfig: ConsoleOutputConfig;

  beforeEach(() => {
    // Reset output arrays
    stdoutOutput = [];
    stderrOutput = [];

    // Mock process write methods
    originalStdoutWrite = process.stdout.write;
    originalStderrWrite = process.stderr.write;
    process.stdout.write = jest.fn((data: string) => {
      stdoutOutput.push(data);
      return true;
    });
    process.stderr.write = jest.fn((data: string) => {
      stderrOutput.push(data);
      return true;
    });

    defaultConfig = {
      enableColors: false,
      includeTimestamp: false,
      includeContext: false,
    };
    handler = new ConsoleOutputHandler(defaultConfig);
  });

  afterEach(() => {
    // Restore original methods
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
    stdoutOutput = [];
    stderrOutput = [];
  });

  describe('TC-CH-100-01 [P0]: Constructor validation', () => {
    test('should create handler with default config', () => {
      expect(handler).toBeDefined();
    });

    test('should create handler with custom config', () => {
      const customConfig: ConsoleOutputConfig = {
        enableColors: true,
        includeTimestamp: true,
        includeContext: true,
      };
      const customHandler = new ConsoleOutputHandler(customConfig);
      expect(customHandler).toBeDefined();
    });
  });

  describe('TC-CH-101-01 [P0]: writeToOutput with all log levels', () => {
    test('should handle DEBUG level', () => {
      const entry: LogEntry = {
        level: LogLevel.DEBUG,
        message: 'Debug message',
        timestamp: new Date().toISOString(),
      };

      handler.writeToOutput(entry);

      expect(stderrOutput).toHaveLength(1);
      expect(stderrOutput[0]).toContain('DEBUG');
      expect(stderrOutput[0]).toContain('Debug message');
    });

    test('should handle INFO level', () => {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Info message',
        timestamp: new Date().toISOString(),
      };

      handler.writeToOutput(entry);

      expect(stdoutOutput).toHaveLength(1);
      expect(stdoutOutput[0]).toContain('INFO');
      expect(stdoutOutput[0]).toContain('Info message');
    });

    test('should handle WARN level', () => {
      const entry: LogEntry = {
        level: LogLevel.WARN,
        message: 'Warning message',
        timestamp: new Date().toISOString(),
      };

      handler.writeToOutput(entry);

      expect(stderrOutput).toHaveLength(1);
      expect(stderrOutput[0]).toContain('WARN');
      expect(stderrOutput[0]).toContain('Warning message');
    });

    test('should handle ERROR level', () => {
      const entry: LogEntry = {
        level: LogLevel.ERROR,
        message: 'Error message',
        timestamp: new Date().toISOString(),
      };

      handler.writeToOutput(entry);

      expect(stderrOutput).toHaveLength(1);
      expect(stderrOutput[0]).toContain('ERROR');
      expect(stderrOutput[0]).toContain('Error message');
    });

    test('should handle FATAL level', () => {
      const entry: LogEntry = {
        level: LogLevel.FATAL,
        message: 'Fatal message',
        timestamp: new Date().toISOString(),
      };

      handler.writeToOutput(entry);

      expect(stderrOutput).toHaveLength(1);
      expect(stderrOutput[0]).toContain('FATAL');
      expect(stderrOutput[0]).toContain('Fatal message');
    });

    test('should handle unknown log level', () => {
      const entry: LogEntry = {
        level: 999 as LogLevel, // Invalid level
        message: 'Unknown message',
        timestamp: new Date().toISOString(),
      };

      handler.writeToOutput(entry);

      expect(stdoutOutput).toHaveLength(1);
      expect(stdoutOutput[0]).toContain('UNKNOWN');
      expect(stdoutOutput[0]).toContain('Unknown message');
    });
  });

  describe('TC-CH-102-01 [P1]: Error handling with error details', () => {
    test('should handle ERROR with Error object and stack', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      const entry: LogEntry = {
        level: LogLevel.ERROR,
        message: 'Error occurred',
        timestamp: new Date().toISOString(),
        error: { name: error.name, message: error.message },
        stack: error.stack,
      };

      handler.writeToOutput(entry);

      expect(stderrOutput).toHaveLength(1);
      expect(stderrOutput[0]).toContain('ERROR');
      expect(stderrOutput[0]).toContain('Error occurred');
      expect(stderrOutput[0]).toContain('Error: Test error');
      expect(stderrOutput[0]).toContain('Stack: Error: Test error');
    });

    test('should handle ERROR with Error object but no stack', () => {
      const error = new Error('Test error without stack');
      error.stack = undefined;

      const entry: LogEntry = {
        level: LogLevel.ERROR,
        message: 'Error without stack',
        timestamp: new Date().toISOString(),
        error: { name: error.name, message: error.message },
      };

      handler.writeToOutput(entry);

      expect(stderrOutput).toHaveLength(1);
      expect(stderrOutput[0]).toContain('ERROR');
      expect(stderrOutput[0]).toContain('Error without stack');
      expect(stderrOutput[0]).toContain('Error: Test error without stack');
      expect(stderrOutput[0]).not.toContain('Stack:');
    });

    test('should handle ERROR without error object', () => {
      const entry: LogEntry = {
        level: LogLevel.ERROR,
        message: 'Error without object',
        timestamp: new Date().toISOString(),
      };

      handler.writeToOutput(entry);

      expect(stderrOutput).toHaveLength(1);
      expect(stderrOutput[0]).toContain('ERROR');
      expect(stderrOutput[0]).toContain('Error without object');
      expect(stderrOutput[0]).not.toContain('Error:');
    });

    test('should handle FATAL with error details', () => {
      const error = new Error('Fatal error');
      error.stack = 'Fatal stack trace';

      const entry: LogEntry = {
        level: LogLevel.FATAL,
        message: 'Fatal occurred',
        timestamp: new Date().toISOString(),
        error: { name: error.name, message: error.message },
        stack: error.stack,
      };

      handler.writeToOutput(entry);

      expect(stderrOutput).toHaveLength(1);
      expect(stderrOutput[0]).toContain('FATAL');
      expect(stderrOutput[0]).toContain('Fatal occurred');
      expect(stderrOutput[0]).toContain('Error: Fatal error');
      expect(stderrOutput[0]).toContain('Stack: Fatal stack trace');
    });
  });

  describe('TC-CH-103-01 [P1]: Context formatting', () => {
    test('should include context when present', () => {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Message with context',
        timestamp: new Date().toISOString(),
        context: { userId: '123', action: 'login' },
      };

      handler.writeToOutput(entry);

      expect(stdoutOutput).toHaveLength(1);
      expect(stdoutOutput[0]).toContain('INFO');
      expect(stdoutOutput[0]).toContain('Message with context');
      expect(stdoutOutput[0]).toContain('{"userId":"123","action":"login"}');
    });

    test('should handle empty context object', () => {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Message with empty context',
        timestamp: new Date().toISOString(),
        context: {},
      };

      handler.writeToOutput(entry);

      expect(stdoutOutput).toHaveLength(1);
      expect(stdoutOutput[0]).toContain('INFO');
      expect(stdoutOutput[0]).toContain('Message with empty context');
      expect(stdoutOutput[0]).not.toContain('{}');
    });

    test('should handle undefined context', () => {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Message without context',
        timestamp: new Date().toISOString(),
        context: undefined,
      };

      handler.writeToOutput(entry);

      expect(stdoutOutput).toHaveLength(1);
      expect(stdoutOutput[0]).toContain('INFO');
      expect(stdoutOutput[0]).toContain('Message without context');
    });
  });

  describe('TC-CH-104-01 [P1]: Color formatting', () => {
    test('should include colors when enabled', () => {
      const colorfulConfig: ConsoleOutputConfig = {
        enableColors: true,
        includeTimestamp: false,
        includeContext: false,
      };
      const colorfulHandler = new ConsoleOutputHandler(colorfulConfig);

      const entry: LogEntry = {
        level: LogLevel.ERROR,
        message: 'Colored message',
        timestamp: new Date().toISOString(),
      };

      colorfulHandler.writeToOutput(entry);

      expect(stderrOutput).toHaveLength(1);
      expect(stderrOutput[0]).toContain('\x1B[31m'); // Red color for ERROR
      expect(stderrOutput[0]).toContain('\x1B[0m'); // Reset color
    });

    test('should not include colors when disabled', () => {
      const plainConfig: ConsoleOutputConfig = {
        enableColors: false,
        includeTimestamp: false,
        includeContext: false,
      };
      const plainHandler = new ConsoleOutputHandler(plainConfig);

      const entry: LogEntry = {
        level: LogLevel.ERROR,
        message: 'Plain message',
        timestamp: new Date().toISOString(),
      };

      plainHandler.writeToOutput(entry);

      expect(stderrOutput).toHaveLength(1);
      expect(stderrOutput[0]).not.toContain('\x1B[31m');
      expect(stderrOutput[0]).not.toContain('\x1B[0m');
    });
  });

  describe('TC-CH-105-01 [P1]: Timestamp formatting', () => {
    test('should include timestamp when enabled', () => {
      const timestampConfig: ConsoleOutputConfig = {
        enableColors: false,
        includeTimestamp: true,
        includeContext: false,
      };
      const timestampHandler = new ConsoleOutputHandler(timestampConfig);

      const timestamp = '2025-01-01T12:00:00.000Z';
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Timestamped message',
        timestamp,
      };

      timestampHandler.writeToOutput(entry);

      expect(stdoutOutput).toHaveLength(1);
      expect(stdoutOutput[0]).toContain(`[${timestamp}]`);
      expect(stdoutOutput[0]).toContain('Timestamped message');
    });

    test('should not include timestamp when disabled', () => {
      const noTimestampConfig: ConsoleOutputConfig = {
        enableColors: false,
        includeTimestamp: false,
        includeContext: false,
      };
      const noTimestampHandler = new ConsoleOutputHandler(noTimestampConfig);

      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'No timestamp message',
        timestamp: '2025-01-01T12:00:00.000Z',
      };

      noTimestampHandler.writeToOutput(entry);

      expect(stdoutOutput).toHaveLength(1);
      expect(stdoutOutput[0]).not.toContain('[');
      expect(stdoutOutput[0]).toContain('No timestamp message');
    });

    test('should handle null timestamp gracefully', () => {
      const timestampConfig: ConsoleOutputConfig = {
        enableColors: false,
        includeTimestamp: true,
        includeContext: false,
      };
      const timestampHandler = new ConsoleOutputHandler(timestampConfig);

      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Null timestamp message',
        timestamp: undefined,
      };

      timestampHandler.writeToOutput(entry);

      expect(stdoutOutput).toHaveLength(1);
      expect(stdoutOutput[0]).toContain('Null timestamp message');
    });
  });

  describe('TC-CH-106-01 [P2]: Non-error levels with error context', () => {
    test('should include error details for non-error levels', () => {
      const error = new Error('Non-critical error');
      error.stack = 'Non-critical stack';

      const entry: LogEntry = {
        level: LogLevel.WARN,
        message: 'Warning with error',
        timestamp: new Date().toISOString(),
        error: { name: error.name, message: error.message },
        stack: error.stack,
      };

      handler.writeToOutput(entry);

      expect(stderrOutput).toHaveLength(1);
      expect(stderrOutput[0]).toContain('WARN');
      expect(stderrOutput[0]).toContain('Warning with error');
      expect(stderrOutput[0]).toContain('Error: Non-critical error');
      expect(stderrOutput[0]).toContain('Stack: Non-critical stack');
    });

    test('should include error details for INFO level', () => {
      const error = new Error('Info level error');

      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Info with error',
        timestamp: new Date().toISOString(),
        error: { name: error.name, message: error.message },
      };

      handler.writeToOutput(entry);

      expect(stdoutOutput).toHaveLength(1);
      expect(stdoutOutput[0]).toContain('INFO');
      expect(stdoutOutput[0]).toContain('Info with error');
      expect(stdoutOutput[0]).toContain('Error: Info level error');
    });
  });

  describe('TC-CH-107-01 [P2]: Edge cases and boundary conditions', () => {
    test('should handle empty message', () => {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: '',
        timestamp: new Date().toISOString(),
      };

      handler.writeToOutput(entry);

      expect(stdoutOutput).toHaveLength(1);
      expect(stdoutOutput[0]).toContain('INFO');
    });

    test('should handle message with special characters', () => {
      const entry: LogEntry = {
        level: LogLevel.ERROR,
        message: 'Error with special chars: \n\t\r"',
        timestamp: new Date().toISOString(),
      };

      handler.writeToOutput(entry);

      expect(stderrOutput).toHaveLength(1);
      expect(stderrOutput[0]).toContain('ERROR');
      expect(stderrOutput[0]).toContain('Error with special chars:');
    });

    test('should handle error with special characters in message', () => {
      const error = new Error('Error with special chars: \n\t\r"');
      error.stack = 'Stack with special chars: \n\t\r"';

      const entry: LogEntry = {
        level: LogLevel.ERROR,
        message: 'Base message',
        timestamp: new Date().toISOString(),
        error: { name: error.name, message: error.message },
        stack: error.stack,
      };

      handler.writeToOutput(entry);

      expect(stderrOutput).toHaveLength(1);
      expect(stderrOutput[0]).toContain('Base message');
      expect(stderrOutput[0]).toContain('Error with special chars:');
      expect(stderrOutput[0]).toContain('Stack with special chars:');
    });

    test('should handle complex context object', () => {
      const complexContext = {
        user: {
          id: '123',
          name: 'John Doe',
          roles: ['admin', 'user'],
          metadata: { lastLogin: '2025-01-01', preferences: null },
        },
        request: {
          id: 'req-456',
          path: '/api/test',
          method: 'POST',
          headers: { 'content-type': 'application/json' },
        },
      };

      const entry: LogEntry = {
        level: LogLevel.DEBUG,
        message: 'Complex context',
        timestamp: new Date().toISOString(),
        context: complexContext,
      };

      handler.writeToOutput(entry);

      expect(stderrOutput).toHaveLength(1);
      expect(stderrOutput[0]).toContain('DEBUG');
      expect(stderrOutput[0]).toContain('Complex context');
      expect(stderrOutput[0]).toContain(JSON.stringify(complexContext));
    });
  });

  describe('TC-CH-108-01 [P2]: Level formatting edge cases', () => {
    test('should pad level names correctly', () => {
      const shortEntry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date().toISOString(),
      };

      handler.writeToOutput(shortEntry);

      expect(stdoutOutput).toHaveLength(1);
      // INFO should be padded to 6 characters
      expect(stdoutOutput[0]).toContain('INFO  '); // INFO + 2 spaces = 6 chars
    });

    test('should handle unknown level names', () => {
      const unknownEntry: LogEntry = {
        level: 999 as LogLevel,
        message: 'Unknown level',
        timestamp: new Date().toISOString(),
      };

      handler.writeToOutput(unknownEntry);

      expect(stdoutOutput).toHaveLength(1);
      expect(stdoutOutput[0]).toContain('UNKNOWN');
    });
  });
});
