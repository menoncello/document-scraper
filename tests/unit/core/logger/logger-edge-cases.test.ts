/**
 * Unit tests for Logger Edge Cases
 * Tests for edge cases and error handling
 */

import { test, expect, beforeEach, afterEach, describe } from 'bun:test';
import { existsSync, unlinkSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Logger, LogLevel } from '../../../../src/index';

describe('Logger - Edge Cases', () => {
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

  describe('Message Handling Edge Cases', () => {
    test('should handle empty messages', () => {
      expect(() => logger.info('')).not.toThrow();
      expect(() => logger.debug('')).not.toThrow();
      expect(() => logger.warn('')).not.toThrow();
      expect(() => logger.error('')).not.toThrow();
    });

    test('should handle very long messages', () => {
      const longMessage = 'x'.repeat(10000);
      expect(() => logger.info(longMessage)).not.toThrow();

      const logContent = readFileSync(testLogFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());
      expect(logEntry.message).toBe(longMessage);
    });

    test('should handle special characters in messages', () => {
      const specialMessage = 'Special chars: \n\t\r"\'\\=\u0000';
      expect(() => logger.info(specialMessage)).not.toThrow();

      const logContent = readFileSync(testLogFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());
      expect(logEntry.message).toBe(specialMessage);
    });

    test('should handle circular references in context', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      expect(() => logger.info('Message with circular ref', circular)).not.toThrow();
    });
  });
});
