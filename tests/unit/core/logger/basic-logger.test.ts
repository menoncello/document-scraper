/**
 * Unit tests for Logger - Basic Logger Functionality
 * Tests for basic logger creation and configuration
 */

import { test, expect, describe } from 'bun:test';
import { Logger, LogLevel } from '../../../../src/index';

describe('Logger - Basic Functionality', () => {
  describe('Logger Creation', () => {
    test('should create Logger instance with default configuration', () => {
      // Given: Default logger creation
      const defaultLogger = new Logger();

      // Then: Should have default configuration
      expect(defaultLogger).toBeInstanceOf(Logger);
      expect(defaultLogger.getLevel()).toBe(LogLevel.INFO);
      expect(defaultLogger.getConfig().enableConsole).toBe(true);
      expect(defaultLogger.getConfig().enableFile).toBe(false);
    });

    test('should create Logger instance with custom configuration', () => {
      // Given: Custom logger configuration
      const customLogger = new Logger({
        level: LogLevel.ERROR,
        enableConsole: false,
        enableFile: true,
        logFile: 'custom.log',
      });

      // Then: Should use custom configuration
      expect(customLogger.getLevel()).toBe(LogLevel.ERROR);
      expect(customLogger.getConfig().enableConsole).toBe(false);
      expect(customLogger.getConfig().enableFile).toBe(true);
      expect(customLogger.getConfig().logFile).toBe('custom.log');
    });
  });

  describe('Configuration Management', () => {
    test('should update logger configuration', () => {
      // Given: Logger with initial configuration
      const logger = new Logger({
        level: LogLevel.INFO,
        enableConsole: true,
        enableFile: false,
      });

      // When: Updating configuration
      logger.updateConfig({
        level: LogLevel.DEBUG,
        enableConsole: false,
        enableFile: true,
        logFile: 'updated.log',
      });

      // Then: Should apply new configuration
      expect(logger.getLevel()).toBe(LogLevel.DEBUG);
      expect(logger.getConfig().enableConsole).toBe(false);
      expect(logger.getConfig().enableFile).toBe(true);
      expect(logger.getConfig().logFile).toBe('updated.log');
    });

    test('should get and set log levels', () => {
      // Given: Logger instance
      const logger = new Logger({ level: LogLevel.INFO });

      // When: Setting different log levels
      logger.setLevel(LogLevel.DEBUG);
      expect(logger.getLevel()).toBe(LogLevel.DEBUG);

      logger.setLevel(LogLevel.WARN);
      expect(logger.getLevel()).toBe(LogLevel.WARN);

      logger.setLevel(LogLevel.ERROR);
      expect(logger.getLevel()).toBe(LogLevel.ERROR);

      logger.setLevel(LogLevel.FATAL);
      expect(logger.getLevel()).toBe(LogLevel.FATAL);
    });
  });

  describe('Log Level Checking', () => {
    test('should correctly set and get log levels', () => {
      // Given: Logger with initial level
      const logger = new Logger({ level: LogLevel.INFO });

      // When: Checking different log levels
      expect(logger.getLevel()).toBe(LogLevel.INFO);

      // When: Setting to different levels
      logger.setLevel(LogLevel.DEBUG);
      expect(logger.getLevel()).toBe(LogLevel.DEBUG);

      logger.setLevel(LogLevel.ERROR);
      expect(logger.getLevel()).toBe(LogLevel.ERROR);

      logger.setLevel(LogLevel.FATAL);
      expect(logger.getLevel()).toBe(LogLevel.FATAL);
    });

    test('should respect log level hierarchy', () => {
      // Given: Logger with ERROR level
      const logger = new Logger({ level: LogLevel.ERROR });

      // Then: Should have correct log level set
      expect(logger.getLevel()).toBe(LogLevel.ERROR);
      // DEBUG and INFO are lower than ERROR, so they would be filtered out
      // WARN, ERROR, and FATAL would be logged
    });
  });
});
