/**
 * Unit tests for Logger Singleton Pattern
 * Tests for singleton instance management
 */

import { test, expect, describe } from 'bun:test';
import { Logger, LogLevel } from '../../../../src/index';

describe('Logger - Singleton Pattern', () => {
  test('should return same instance with getInstance', () => {
    const instance1 = Logger.getInstance();
    const instance2 = Logger.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should create new instance only on first call', () => {
    // Reset singleton for testing
    (Logger as any).instance = null;

    const instance1 = Logger.getInstance();
    const instance2 = Logger.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should not create new instance when config is provided after first call', () => {
    // Reset singleton for testing
    (Logger as any).instance = null;

    const instance1 = Logger.getInstance({ level: LogLevel.DEBUG });
    const instance2 = Logger.getInstance({ level: LogLevel.ERROR });
    expect(instance1).toBe(instance2);
    expect(instance1.getLevel()).toBe(LogLevel.DEBUG); // First config wins
  });
});
