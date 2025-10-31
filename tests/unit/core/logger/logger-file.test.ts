/**
 * Unit tests for Logger File Logging
 * Tests for file logging functionality
 */

import { test, expect, beforeEach, afterEach, describe } from 'bun:test';
import { existsSync, unlinkSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Logger, LogLevel } from '../../../../src/index';

describe('Logger - File Logging', () => {
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
      enableConsole: false,
      enableFile: true,
      logFile: testLogFile,
      enableColors: false,
      includeTimestamp: true,
      includeContext: true,
      maxFileSize: 1024,
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

  describe('Basic File Operations', () => {
    test('should create log file when enabled', () => {
      expect(existsSync(testLogFile)).toBe(true);
    });

    test('should write multiple log entries to file', () => {
      logger.info('First message');
      logger.warn('Second message');
      logger.error('Third message');

      const logContent = readFileSync(testLogFile, 'utf-8');
      const logLines = logContent.trim().split('\n');

      expect(logLines.length).toBe(3);

      const firstEntry = JSON.parse(logLines[0]);
      const secondEntry = JSON.parse(logLines[1]);
      const thirdEntry = JSON.parse(logLines[2]);

      expect(firstEntry.message).toBe('First message');
      expect(secondEntry.message).toBe('Second message');
      expect(thirdEntry.message).toBe('Third message');
    });

    test('should handle file write errors gracefully', () => {
      // Create logger with invalid file path
      const invalidLogger = new Logger({
        enableFile: true,
        logFile: '/invalid/path/test.log',
        enableConsole: false,
      });

      // Should not throw error
      expect(() => invalidLogger.info('Test message')).not.toThrow();
    });
  });

  describe('Log Rotation', () => {
    test('should respect max file size and rotate logs', async () => {
      // Fill log file beyond max size
      const largeMessage = 'x'.repeat(200);
      for (let i = 0; i < 10; i++) {
        logger.info(`${largeMessage} ${i}`);
      }

      // Should create rotated file
      expect(existsSync(`${testLogFile}.1`)).toBe(true);
    });

    test('should limit number of rotated files', async () => {
      // Create logger with max 2 files
      const rotationLogger = new Logger({
        enableFile: true,
        logFile: join(testLogDir, 'rotation-test.log'),
        maxFileSize: 100,
        maxFiles: 2,
        enableConsole: false,
      });

      // Generate enough logs to create multiple rotations
      const message = 'x'.repeat(50);
      for (let i = 0; i < 10; i++) {
        rotationLogger.info(`${message} ${i}`);
      }

      // Should not exceed max files
      expect(existsSync(join(testLogDir, 'rotation-test.log.3'))).toBe(false);

      // Clean up
      for (let i = 1; i <= 5; i++) {
        const file = join(testLogDir, `rotation-test.log.${i}`);
        if (existsSync(file)) {
          unlinkSync(file);
        }
      }
    });
  });
});
