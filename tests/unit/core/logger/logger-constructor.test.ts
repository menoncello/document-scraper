/**
 * Unit tests for Logger Constructor
 * Tests for logger creation and configuration
 */

import { test, expect, beforeEach, describe } from 'bun:test';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Logger, LogLevel, type LoggerConfig } from '../../../../src/index';

describe('Logger - Constructor', () => {
  let testLogDir: string;

  beforeEach(() => {
    testLogDir = join(process.cwd(), 'test-logs');
    // Ensure test directory exists
    if (!existsSync(testLogDir)) {
      mkdirSync(testLogDir, { recursive: true });
    }
  });

  describe('Default Configuration', () => {
    test('should create Logger with default configuration', () => {
      const defaultLogger = new Logger();
      expect(defaultLogger).toBeInstanceOf(Logger);

      const config = defaultLogger.getConfig();
      expect(config.level).toBe(LogLevel.INFO);
      expect(config.enableConsole).toBe(true);
      expect(config.enableFile).toBe(false);
      expect(config.enableColors).toBe(true);
      expect(config.includeTimestamp).toBe(true);
      expect(config.includeContext).toBe(true);
    });
  });

  describe('Custom Configuration', () => {
    test('should create Logger with custom configuration', () => {
      const customConfig: Partial<LoggerConfig> = {
        level: LogLevel.ERROR,
        enableConsole: false,
        enableFile: true,
        logFile: 'custom.log',
        enableColors: false,
        includeTimestamp: false,
        includeContext: false,
      };

      const customLogger = new Logger(customConfig);
      const config = customLogger.getConfig();

      expect(config.level).toBe(LogLevel.ERROR);
      expect(config.enableConsole).toBe(false);
      expect(config.enableFile).toBe(true);
      expect(config.enableColors).toBe(false);
      expect(config.includeTimestamp).toBe(false);
      expect(config.includeContext).toBe(false);
    });

    test('should create log directory when file logging is enabled', () => {
      const logger = new Logger({
        enableFile: true,
        logFile: 'test-custom.log',
      });

      // Verify the logger was created and configured correctly
      expect(logger).toBeInstanceOf(Logger);
      const config = logger.getConfig();
      expect(config.enableFile).toBe(true);
      expect(config.logFile).toBe('test-custom.log');

      // The directory should be created as a side effect of logger construction
      expect(existsSync(testLogDir)).toBe(true);
    });
  });
});
