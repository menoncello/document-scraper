/**
 * Unit tests for Logger Console Logging
 * Tests for console logging functionality
 */

import { test, expect, beforeEach, afterEach, describe, spyOn } from 'bun:test';
import { Logger, LogLevel } from '../../../../src/index';

describe('Logger - Console Logging', () => {
  let consoleLogger: Logger;
  let consoleSpies: any;

  beforeEach(() => {
    // Mock process stdout and stderr since logger uses these instead of console methods
    consoleSpies = {
      debug: spyOn(process.stderr, 'write'),
      info: spyOn(process.stdout, 'write'),
      warn: spyOn(process.stderr, 'write'),
      error: spyOn(process.stderr, 'write'),
      log: spyOn(console, 'log'),
    };

    consoleLogger = new Logger({
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: false,
      enableColors: false,
      includeTimestamp: false,
      includeContext: true,
    });
  });

  afterEach(() => {
    // Restore spied methods
    for (const spy of Object.values(consoleSpies)) {
      (spy as any).mockRestore();
    }
  });

  describe('Basic Console Output', () => {
    test('should log to console with colors disabled', () => {
      consoleLogger.info('Console message', { test: true });

      expect(consoleSpies.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO   Console message {"test":true}\n')
      );
    });

    test('should log to console with timestamp when enabled', () => {
      consoleLogger.updateConfig({ includeTimestamp: true });
      consoleLogger.debug('Debug message');

      expect(consoleSpies.debug).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*?] DEBUG {2}Debug message\n$/)
      );
    });

    test('should log to console with error details', () => {
      const error = new Error('Console error');
      consoleLogger.error('Error occurred', error);

      expect(consoleSpies.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR  Error occurred\nError: Console error\n')
      );
    });

    test('should not log to console when disabled', () => {
      consoleLogger.setConsoleLogging(false);
      consoleLogger.info('Should not appear');

      expect(consoleSpies.info).not.toHaveBeenCalled();
    });
  });
});
