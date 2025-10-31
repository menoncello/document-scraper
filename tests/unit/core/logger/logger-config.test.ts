/**
 * Unit tests for Logger Configuration Management
 * Tests for configuration updates and management
 */

import { test, expect, beforeEach, afterEach, describe } from 'bun:test';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { Logger, LogLevel } from '../../../../src/index';

describe('Logger - Configuration Management', () => {
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

  describe('Configuration Updates', () => {
    test('should update configuration', () => {
      logger.updateConfig({ level: LogLevel.ERROR, enableColors: true });

      const config = logger.getConfig();
      expect(config.level).toBe(LogLevel.ERROR);
      expect(config.enableColors).toBe(true);
    });

    test('should set log level', () => {
      logger.setLevel(LogLevel.FATAL);
      expect(logger.getLevel()).toBe(LogLevel.FATAL);
    });

    test('should enable/disable console logging', () => {
      logger.setConsoleLogging(true);
      expect(logger.getConfig().enableConsole).toBe(true);

      logger.setConsoleLogging(false);
      expect(logger.getConfig().enableConsole).toBe(false);
    });

    test('should enable/disable file logging', () => {
      logger.setFileLogging(true, 'new-test.log');
      expect(logger.getConfig().enableFile).toBe(true);
      expect(logger.getConfig().logFile).toContain('new-test.log');

      logger.setFileLogging(false);
      expect(logger.getConfig().enableFile).toBe(false);
    });
  });

  describe('Log Management', () => {
    test('should clear all log files', () => {
      // Create some log entries and rotations
      logger.info('Test message 1');
      logger.info('Test message 2');

      // Force rotation by writing large content
      const largeMessage = 'x'.repeat(2000);
      logger.info(largeMessage);

      // Verify files exist
      expect(existsSync(testLogFile)).toBe(true);

      // Clear logs
      logger.clearLogs();

      // Files should be removed
      expect(existsSync(testLogFile)).toBe(false);
    });

    test('should handle clear logs when no files exist', () => {
      expect(() => logger.clearLogs()).not.toThrow();
    });
  });
});
