/**
 * Comprehensive test coverage for FileLogger
 * Focuses on file operations, error handling, and rotation scenarios
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, unlinkSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { FileLogger } from '../../../src/core/file-logger';
import { LogEntry, FileLoggerConfig } from '../../../src/core/logger-types';

describe('FileLogger Coverage Tests', () => {
  let fileLogger: FileLogger;
  let mockConfig: FileLoggerConfig;
  let testLogFile: string;
  let testLogDir: string;

  beforeEach(() => {
    testLogDir = join(process.cwd(), 'test-logs-file-logger');
    testLogFile = join(testLogDir, 'test.log');

    // Ensure test directory exists
    if (!existsSync(testLogDir)) {
      mkdirSync(testLogDir, { recursive: true });
    }

    // Clean up any existing test files
    for (let i = 1; i <= 10; i++) {
      const rotatedFile = `${testLogFile}.${i}`;
      if (existsSync(rotatedFile)) {
        unlinkSync(rotatedFile);
      }
    }
    if (existsSync(testLogFile)) {
      unlinkSync(testLogFile);
    }

    mockConfig = {
      enabled: true,
      logFile: testLogFile,
      maxFileSize: 1024 * 1024, // 1MB
      maxFiles: 3,
    };

    fileLogger = new FileLogger(mockConfig);
  });

  afterEach(() => {
    // Clean up test files after each test
    try {
      for (let i = 1; i <= 10; i++) {
        const rotatedFile = `${testLogFile}.${i}`;
        if (existsSync(rotatedFile)) {
          unlinkSync(rotatedFile);
        }
      }
      if (existsSync(testLogFile)) {
        unlinkSync(testLogFile);
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('TC-FL-100-01 [P0]: Constructor and basic initialization', () => {
    test('should create FileLogger with default config', () => {
      expect(fileLogger).toBeDefined();
    });

    test('should create FileLogger with custom config', () => {
      const customConfig: FileLoggerConfig = {
        enabled: false,
        logFile: 'custom.log',
        maxFileSize: 2048 * 1024,
        maxFiles: 10,
      };
      const customLogger = new FileLogger(customConfig);
      expect(customLogger).toBeDefined();
    });
  });

  describe('TC-FL-101-01 [P0]: initializeFileLogging success scenarios', () => {
    test('should initialize when enabled with log file', () => {
      fileLogger.initializeFileLogging();

      expect(existsSync(testLogFile)).toBe(true);
    });

    test('should create logs directory if not exists', () => {
      const tempDir = join(testLogDir, 'temp-logs');
      const tempLogFile = join(tempDir, 'temp.log');

      const configWithNewDir: FileLoggerConfig = {
        enabled: true,
        logFile: tempLogFile,
        maxFileSize: 1024,
        maxFiles: 3,
      };
      const loggerWithNewDir = new FileLogger(configWithNewDir);

      loggerWithNewDir.initializeFileLogging();

      expect(existsSync(tempDir)).toBe(true);
      expect(existsSync(tempLogFile)).toBe(true);

      // Clean up
      if (existsSync(tempLogFile)) {
        unlinkSync(tempLogFile);
      }
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    test('should create log file if not exists', () => {
      const newLogFile = join(testLogDir, 'new-test.log');

      const configWithNewFile: FileLoggerConfig = {
        enabled: true,
        logFile: newLogFile,
        maxFileSize: 1024,
        maxFiles: 3,
      };
      const loggerWithNewFile = new FileLogger(configWithNewFile);

      loggerWithNewFile.initializeFileLogging();

      expect(existsSync(newLogFile)).toBe(true);

      // Clean up
      if (existsSync(newLogFile)) {
        unlinkSync(newLogFile);
      }
    });

    test('should handle relative file path correctly', () => {
      const configWithPath: FileLoggerConfig = {
        enabled: true,
        logFile: 'relative-test.log',
        maxFileSize: 1024,
        maxFiles: 3,
      };
      const loggerWithPath = new FileLogger(configWithPath);

      loggerWithPath.initializeFileLogging();

      // Should create the file in the logs directory
      const expectedPath = join(process.cwd(), 'logs', 'relative-test.log');
      expect(existsSync(expectedPath)).toBe(true);

      // Clean up
      if (existsSync(expectedPath)) {
        unlinkSync(expectedPath);
      }
    });

    test('should handle absolute file path', () => {
      const configWithAbsPath: FileLoggerConfig = {
        enabled: true,
        logFile: testLogFile, // Already an absolute path
        maxFileSize: 1024,
        maxFiles: 3,
      };
      const loggerWithAbsPath = new FileLogger(configWithAbsPath);

      loggerWithAbsPath.initializeFileLogging();

      expect(existsSync(testLogFile)).toBe(true);
    });
  });

  describe('TC-FL-102-01 [P1]: initializeFileLogging error scenarios', () => {
    test('should handle initialization with invalid path gracefully', () => {
      const invalidConfig: FileLoggerConfig = {
        enabled: true,
        logFile: '/invalid/path/that/does/not/exist/test.log',
        maxFileSize: 1024,
        maxFiles: 3,
      };
      const invalidLogger = new FileLogger(invalidConfig);

      // Should not throw error, but may disable logging
      expect(() => invalidLogger.initializeFileLogging()).not.toThrow();

      const config = invalidLogger.getConfig();
      // FileLogger disables logging on initialization errors
      expect(config.enabled).toBe(false);
    });

    test('should not initialize when disabled', () => {
      const disabledConfig: FileLoggerConfig = {
        enabled: false,
        logFile: testLogFile,
      };
      const disabledLogger = new FileLogger(disabledConfig);

      disabledLogger.initializeFileLogging();

      // File should not be created when disabled
      expect(existsSync(testLogFile)).toBe(false);
    });

    test('should not initialize when no log file', () => {
      const noFileConfig: FileLoggerConfig = {
        enabled: true,
        logFile: '',
      };
      const noFileLogger = new FileLogger(noFileConfig);

      noFileLogger.initializeFileLogging();

      // Should not throw and should not create any files
      expect(() => noFileLogger.initializeFileLogging()).not.toThrow();
    });
  });

  describe('TC-FL-103-01 [P0]: logToFile success scenarios', () => {
    test('should write log entry to file', () => {
      const logEntry: LogEntry = {
        level: 1, // INFO
        message: 'Test message',
        timestamp: '2025-01-01T12:00:00.000Z',
      };

      fileLogger.logToFile(logEntry);

      // Check that the log was written to the file
      expect(existsSync(testLogFile)).toBe(true);
      const logContent = readFileSync(testLogFile, 'utf-8');
      expect(logContent).toContain('Test message');
      expect(logContent).toContain('"level":1');
    });

    test('should not log when disabled', () => {
      const disabledConfig: FileLoggerConfig = {
        enabled: false,
        logFile: testLogFile,
      };
      const disabledLogger = new FileLogger(disabledConfig);

      const logEntry: LogEntry = {
        level: 1,
        message: 'Test message',
        timestamp: '2025-01-01T12:00:00.000Z',
      };

      disabledLogger.logToFile(logEntry);

      // File should not be created or modified when disabled
      expect(existsSync(testLogFile)).toBe(false);
    });

    test('should not log when no log file', () => {
      const noFileConfig: FileLoggerConfig = {
        enabled: true,
        logFile: '',
      };
      const noFileLogger = new FileLogger(noFileConfig);

      const logEntry: LogEntry = {
        level: 1,
        message: 'Test message',
        timestamp: '2025-01-01T12:00:00.000Z',
      };

      noFileLogger.logToFile(logEntry);

      // Should not throw and should not create any files
      expect(() => noFileLogger.logToFile(logEntry)).not.toThrow();
    });
  });

  describe('TC-FL-104-01 [P1]: logToFile rotation scenarios', () => {
    test('should rotate file when size exceeds limit', () => {
      const configWithSmallSize: FileLoggerConfig = {
        enabled: true,
        logFile: testLogFile,
        maxFileSize: 100, // Very small size to trigger rotation
        maxFiles: 3,
      };
      const smallSizeLogger = new FileLogger(configWithSmallSize);

      const largeEntry: LogEntry = {
        level: 1,
        message: 'Test message that is large enough to trigger rotation',
        timestamp: '2025-01-01T12:00:00.000Z',
      };

      // First log to create the file
      smallSizeLogger.logToFile(largeEntry);

      // Then log multiple times to exceed the size limit
      for (let i = 0; i < 5; i++) {
        smallSizeLogger.logToFile({
          ...largeEntry,
          message: `${largeEntry.message} ${i}`,
        });
      }

      // Check that rotation occurred (backup file should exist)
      expect(existsSync(`${testLogFile}.1`)).toBe(true);
    });

    test('should not rotate when file size is within limit', () => {
      const entry: LogEntry = {
        level: 1,
        message: 'Test message',
        timestamp: '2025-01-01T12:00:00.000Z',
      };

      fileLogger.logToFile(entry);

      // Should not create rotated files when within limit
      expect(existsSync(`${testLogFile}.1`)).toBe(false);
      expect(existsSync(testLogFile)).toBe(true);
    });
  });

  describe('TC-FL-105-01 [P1]: logToFile error scenarios', () => {
    test('should handle write errors silently', () => {
      const invalidConfig: FileLoggerConfig = {
        enabled: true,
        logFile: '/invalid/path/test.log', // Invalid path to trigger error
      };
      const invalidLogger = new FileLogger(invalidConfig);

      const logEntry: LogEntry = {
        level: 1,
        message: 'Test message',
        timestamp: '2025-01-01T12:00:00.000Z',
      };

      expect(() => invalidLogger.logToFile(logEntry)).not.toThrow();
    });
  });

  describe('TC-FL-106-01 [P1]: File rotation scenarios', () => {
    test('should rotate multiple log files correctly', () => {
      const configWithSmallSize: FileLoggerConfig = {
        enabled: true,
        logFile: testLogFile,
        maxFileSize: 50, // Very small size
        maxFiles: 3,
      };
      const rotationLogger = new FileLogger(configWithSmallSize);

      const largeEntry: LogEntry = {
        level: 1,
        message: 'Large message that will trigger multiple rotations',
        timestamp: '2025-01-01T12:00:00.000Z',
      };

      // Write enough logs to trigger multiple rotations
      for (let i = 0; i < 10; i++) {
        rotationLogger.logToFile({
          ...largeEntry,
          message: `${largeEntry.message} ${i}`,
        });
      }

      // Should create multiple rotated files
      expect(existsSync(`${testLogFile}.1`)).toBe(true);
      expect(existsSync(`${testLogFile}.2`)).toBe(true);
      expect(existsSync(`${testLogFile}.3`)).toBe(true);
    });

    test('should handle rotation with maxFiles limit', () => {
      const configWithMaxFiles: FileLoggerConfig = {
        enabled: true,
        logFile: testLogFile,
        maxFileSize: 50, // Very small size
        maxFiles: 2,
      };
      const limitLogger = new FileLogger(configWithMaxFiles);

      const largeEntry: LogEntry = {
        level: 1,
        message: 'Large message for maxFiles test',
        timestamp: '2025-01-01T12:00:00.000Z',
      };

      // Write enough logs to exceed maxFiles
      for (let i = 0; i < 8; i++) {
        limitLogger.logToFile({
          ...largeEntry,
          message: `${largeEntry.message} ${i}`,
        });
      }

      // Should not exceed maxFiles
      expect(existsSync(`${testLogFile}.1`)).toBe(true);
      expect(existsSync(`${testLogFile}.2`)).toBe(true);
      expect(existsSync(`${testLogFile}.3`)).toBe(false); // Should not exist
    });
  });

  describe('TC-FL-107-01 [P1]: clearLogs functionality', () => {
    test('should clear all log files including rotated ones', () => {
      // Create some rotated files first
      writeFileSync(`${testLogFile}.1`, 'rotated content 1');
      writeFileSync(`${testLogFile}.2`, 'rotated content 2');
      writeFileSync(`${testLogFile}.3`, 'rotated content 3');
      writeFileSync(testLogFile, 'main content');

      fileLogger.clearLogs();

      // All files should be deleted
      expect(existsSync(testLogFile)).toBe(false);
      expect(existsSync(`${testLogFile}.1`)).toBe(false);
      expect(existsSync(`${testLogFile}.2`)).toBe(false);
      expect(existsSync(`${testLogFile}.3`)).toBe(false);
    });

    test('should not attempt to delete non-existent files', () => {
      expect(() => fileLogger.clearLogs()).not.toThrow();
    });

    test('should handle clear errors when disabled', () => {
      const disabledConfig: FileLoggerConfig = {
        enabled: false,
        logFile: testLogFile,
      };
      const disabledLogger = new FileLogger(disabledConfig);

      expect(() => disabledLogger.clearLogs()).not.toThrow();
    });
  });

  describe('TC-FL-108-01 [P1]: Configuration management', () => {
    test('should update configuration', () => {
      const newConfig = {
        enabled: false,
        maxFileSize: 2048 * 1024,
      };

      fileLogger.updateConfig(newConfig);

      const updatedConfig = fileLogger.getConfig();
      expect(updatedConfig.enabled).toBe(false);
      expect(updatedConfig.maxFileSize).toBe(2048 * 1024);
      expect(updatedConfig.logFile).toBe(testLogFile); // Original value preserved
    });

    test('should return copy of configuration', () => {
      const config = fileLogger.getConfig();

      // Modify returned config
      config.enabled = false;

      // Original should be unchanged
      const originalConfig = fileLogger.getConfig();
      expect(originalConfig.enabled).toBe(true);
    });

    test('should handle configuration update with all fields', () => {
      const fullConfig: Partial<FileLoggerConfig> = {
        enabled: true,
        logFile: 'new-test.log',
        maxFileSize: 4096 * 1024,
        maxFiles: 10,
      };

      fileLogger.updateConfig(fullConfig);

      const updatedConfig = fileLogger.getConfig();
      expect(updatedConfig).toEqual({
        enabled: true,
        logFile: 'new-test.log',
        maxFileSize: 4096 * 1024,
        maxFiles: 10,
      });
    });
  });

  describe('TC-FL-109-01 [P2]: Edge cases and boundary conditions', () => {
    test('should handle log entry with special characters', () => {
      const specialEntry: LogEntry = {
        level: 1,
        message: 'Message with special chars: \n\t\r" and unicode: 世界 🌍',
        timestamp: '2025-01-01T12:00:00.000Z',
        context: { special: 'value with "quotes" and \n newlines' },
      };

      fileLogger.logToFile(specialEntry);

      expect(existsSync(testLogFile)).toBe(true);
      const logContent = readFileSync(testLogFile, 'utf-8');
      expect(logContent).toContain('special chars');
      expect(logContent).toContain('世界');
    });

    test('should handle very large log entry', () => {
      const largeMessage = 'x'.repeat(10000);
      const largeEntry: LogEntry = {
        level: 1,
        message: largeMessage,
        timestamp: '2025-01-01T12:00:00.000Z',
      };

      fileLogger.logToFile(largeEntry);

      expect(existsSync(testLogFile)).toBe(true);
      const logContent = readFileSync(testLogFile, 'utf-8');
      expect(logContent).toContain(largeMessage);
    });

    test('should handle complex log entry with error object', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      const errorEntry: LogEntry = {
        level: 4, // ERROR
        message: 'Error occurred',
        timestamp: '2025-01-01T12:00:00.000Z',
        error,
        stack: error.stack,
        context: { userId: '123', action: 'failed' },
      };

      fileLogger.logToFile(errorEntry);

      expect(existsSync(testLogFile)).toBe(true);
      const logContent = readFileSync(testLogFile, 'utf-8');
      expect(logContent).toContain('Test error');
      expect(logContent).toContain('userId');
    });
  });

  describe('TC-FL-110-01 [P2]: File system interaction edge cases', () => {
    test('should handle getFileStats with non-existent file', () => {
      const noFileConfig: FileLoggerConfig = {
        enabled: true,
        logFile: join(testLogDir, 'non-existent.log'),
      };
      const noFileLogger = new FileLogger(noFileConfig);

      const logEntry: LogEntry = {
        level: 1,
        message: 'Test message',
        timestamp: '2025-01-01T12:00:00.000Z',
      };

      expect(() => noFileLogger.logToFile(logEntry)).not.toThrow();
    });
  });
});
