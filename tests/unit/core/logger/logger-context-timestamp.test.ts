/**
 * Unit tests for Logger Context and Timestamp Handling
 * Tests for context and timestamp functionality
 */

import { test, expect, beforeEach, afterEach, describe } from 'bun:test';
import { existsSync, unlinkSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Logger, LogLevel } from '../../../../src/index';

describe('Logger - Context and Timestamp Handling', () => {
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

  describe('Context Handling', () => {
    test('should include context when enabled', () => {
      logger.info('Message with context', { userId: 123, action: 'test' });

      const logContent = readFileSync(testLogFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());

      expect(logEntry.context).toEqual({ userId: 123, action: 'test' });
    });

    test('should not include context when disabled', () => {
      logger.updateConfig({ includeContext: false });
      logger.info('Message without context', { userId: 123 });

      const logContent = readFileSync(testLogFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());

      expect(logEntry.context).toBeUndefined();
    });

    test('should handle null and undefined context', () => {
      logger.info('Message with null context', null as any);
      logger.info('Message with undefined context', undefined as any);

      const logContent = readFileSync(testLogFile, 'utf-8');
      const logLines = logContent.trim().split('\n');

      expect(logLines.length).toBe(2);

      const firstEntry = JSON.parse(logLines[0]);
      const secondEntry = JSON.parse(logLines[1]);

      expect(firstEntry.context).toBeNull();
      expect(secondEntry.context).toBeUndefined();
    });
  });

  describe('Timestamp Handling', () => {
    test('should include timestamp when enabled', () => {
      logger.info('Message with timestamp');

      const logContent = readFileSync(testLogFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());

      expect(logEntry.timestamp).toBeDefined();
      expect(new Date(logEntry.timestamp)).toBeInstanceOf(Date);
    });

    test('should not include timestamp when disabled', () => {
      logger.updateConfig({ includeTimestamp: false });
      logger.info('Message without timestamp');

      const logContent = readFileSync(testLogFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());

      expect(logEntry.timestamp).toBeUndefined();
    });
  });
});
