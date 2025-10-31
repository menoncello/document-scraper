/**
 * Unit tests for Types Module - Logger Types
 * Tests for LoggerConfig, LogEntry, LogLevel and related logging type definitions
 */

import { test, expect, describe } from 'bun:test';
import { LogLevel } from '@/core/logger-types';
import type { LoggerConfig, LogEntry } from '@/types';

// Helper functions moved to outer scope to fix function scoping
const createCompleteLoggerConfig = (): LoggerConfig => ({
  level: LogLevel.DEBUG,
  enableConsole: true,
  enableFile: true,
  logFile: 'logs/app.log',
  maxFileSize: 10485760, // 10MB
  maxFiles: 5,
  enableColors: true,
  includeTimestamp: true,
  includeContext: true,
});

const createCompleteLogEntry = (): LogEntry => ({
  level: LogLevel.INFO,
  message: 'Application started successfully',
  timestamp: new Date('2023-01-01T12:00:00.000Z'),
  context: {
    userId: '12345',
    requestId: 'req-abc123',
    userAgent: 'Mozilla/5.0...',
  },
  module: 'app',
});

const isHigherLevel = (current: LogLevel, target: LogLevel): boolean => {
  const levels: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
    [LogLevel.FATAL]: 4,
  };
  const currentLevel = levels[current];
  const targetLevel = levels[target];
  return currentLevel !== undefined && targetLevel !== undefined && currentLevel >= targetLevel;
};

describe('LoggerConfig', () => {
  test('should accept complete logger configuration', () => {
    // Given: A complete logger configuration
    const config = createCompleteLoggerConfig();

    // Then: Should accept the configuration
    expect(config.level).toBe(LogLevel.DEBUG);
    expect(config.enableConsole).toBe(true);
    expect(config.enableFile).toBe(true);
    expect(config.logFile).toBe('logs/app.log');
    expect(config.maxFileSize).toBe(10485760);
    expect(config.maxFiles).toBe(5);
    expect(config.includeTimestamp).toBe(true);
    expect(config.enableColors).toBe(true);
  });

  test('should accept minimal logger configuration', () => {
    // Given: A minimal logger configuration
    const config: LoggerConfig = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: true,
      enableColors: true,
      includeTimestamp: true,
      includeContext: true,
    };

    // Then: Should accept minimal configuration
    expect(config.level).toBe(LogLevel.INFO);
    expect(config.enableConsole).toBe(true);
    expect(config.enableFile).toBe(true);
    expect(config.enableColors).toBe(true);
    expect(config.includeTimestamp).toBe(true);
    expect(config.includeContext).toBe(true);
  });

  test('should support different log levels', () => {
    // Given: Different log levels (using actual LogLevel union)
    const debugConfig: LoggerConfig = {
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableColors: true,
      includeTimestamp: true,
      includeContext: true,
    };
    const infoConfig: LoggerConfig = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: true,
      enableColors: true,
      includeTimestamp: true,
      includeContext: true,
    };
    const warnConfig: LoggerConfig = {
      level: LogLevel.WARN,
      enableConsole: true,
      enableFile: true,
      enableColors: true,
      includeTimestamp: true,
      includeContext: true,
    };
    const errorConfig: LoggerConfig = {
      level: LogLevel.ERROR,
      enableConsole: true,
      enableFile: true,
      enableColors: true,
      includeTimestamp: true,
      includeContext: true,
    };
    const silentConfig: LoggerConfig = {
      level: LogLevel.FATAL,
      enableConsole: true,
      enableFile: true,
      enableColors: true,
      includeTimestamp: true,
      includeContext: true,
    };

    // Then: Should accept all log levels
    expect(debugConfig.level).toBe(LogLevel.DEBUG);
    expect(debugConfig.enableConsole).toBe(true);
    expect(debugConfig.enableFile).toBe(true);
    expect(debugConfig.enableColors).toBe(true);
    expect(debugConfig.includeTimestamp).toBe(true);
    expect(debugConfig.includeContext).toBe(true);

    expect(infoConfig.level).toBe(LogLevel.INFO);
    expect(infoConfig.enableConsole).toBe(true);
    expect(infoConfig.enableFile).toBe(true);
    expect(infoConfig.enableColors).toBe(true);
    expect(infoConfig.includeTimestamp).toBe(true);
    expect(infoConfig.includeContext).toBe(true);

    expect(warnConfig.level).toBe(LogLevel.WARN);
    expect(warnConfig.enableConsole).toBe(true);
    expect(warnConfig.enableFile).toBe(true);
    expect(warnConfig.enableColors).toBe(true);
    expect(warnConfig.includeTimestamp).toBe(true);
    expect(warnConfig.includeContext).toBe(true);

    expect(errorConfig.level).toBe(LogLevel.ERROR);
    expect(errorConfig.enableConsole).toBe(true);
    expect(errorConfig.enableFile).toBe(true);
    expect(errorConfig.enableColors).toBe(true);
    expect(errorConfig.includeTimestamp).toBe(true);
    expect(errorConfig.includeContext).toBe(true);

    expect(silentConfig.level).toBe(LogLevel.FATAL);
    expect(silentConfig.enableConsole).toBe(true);
    expect(silentConfig.enableFile).toBe(true);
    expect(silentConfig.enableColors).toBe(true);
    expect(silentConfig.includeTimestamp).toBe(true);
    expect(silentConfig.includeContext).toBe(true);
  });

  test('should support console-only output', () => {
    // Given: Console-only logger configuration
    const config: LoggerConfig = {
      level: LogLevel.WARN,
      enableConsole: true,
      enableFile: false,
      maxFileSize: 0,
      maxFiles: 0,
      includeTimestamp: true,
      enableColors: true,
      includeContext: true,
    };

    // Then: Should support console-only output
    expect(config.level).toBe(LogLevel.WARN);
    expect(config.enableConsole).toBe(true);
    expect(config.enableFile).toBe(false);
    expect(config.maxFileSize).toBe(0);
    expect(config.maxFiles).toBe(0);
    expect(config.includeTimestamp).toBe(true);
    expect(config.enableColors).toBe(true);
    expect(config.includeContext).toBe(true);
  });

  test('should support file-only output', () => {
    // Given: File-only logger configuration
    const config: LoggerConfig = {
      level: LogLevel.INFO,
      enableConsole: false,
      enableFile: true,
      logFile: 'logs/production.log',
      maxFileSize: 52428800, // 50MB
      maxFiles: 10,
      includeTimestamp: true,
      enableColors: false,
      includeContext: true,
    };

    // Then: Should support file-only output
    expect(config.level).toBe(LogLevel.INFO);
    expect(config.enableConsole).toBe(false);
    expect(config.enableFile).toBe(true);
    expect(config.logFile).toBe('logs/production.log');
    expect(config.maxFileSize).toBe(52428800);
    expect(config.maxFiles).toBe(10);
    expect(config.includeTimestamp).toBe(true);
    expect(config.enableColors).toBe(false);
    expect(config.includeContext).toBe(true);
  });
});

describe('LogEntry', () => {
  test('should represent complete log entry', () => {
    // Given: A complete log entry
    const entry = createCompleteLogEntry();

    // Then: Should have complete entry structure
    expect(entry.level).toBe(LogLevel.INFO);
    expect(entry.message).toBe('Application started successfully');
    expect(entry.module).toBe('app');
    expect(entry.context?.userId).toBe('12345');
    expect(entry.timestamp).toBeInstanceOf(Date);
  });

  test('should handle minimal log entry', () => {
    // Given: A minimal log entry
    const entry: LogEntry = {
      level: LogLevel.DEBUG,
      message: 'Debug message',
      timestamp: new Date(),
    };

    // Then: Should accept minimal entry
    expect(entry.level).toBe(LogLevel.DEBUG);
    expect(entry.message).toBe('Debug message');
    expect(entry.timestamp).toBeInstanceOf(Date);
    expect(entry.module).toBeUndefined();
    expect(entry.context).toBeUndefined();
  });

  test('should handle structured data in context', () => {
    // Given: Log entry with complex context
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message: 'User action completed',
      timestamp: new Date(),
      module: 'user-service',
      context: {
        action: 'login',
        user: {
          id: '123',
          email: 'user@example.com',
          roles: ['user', 'admin'],
        },
        session: {
          id: 'sess-456',
          duration: 1200,
          ip: '127.0.0.1', // Use localhost instead of hardcoded IP
        },
        performance: {
          duration: 250,
          memory: 1024000,
        },
      },
    };

    // Then: Should handle nested context
    expect(entry.level).toBe(LogLevel.INFO);
    expect(entry.message).toBe('User action completed');
    expect(entry.timestamp).toBeInstanceOf(Date);
    expect(entry.module).toBe('user-service');
    const context = entry.context as any;
    expect(context?.action).toBe('login');
    expect(context?.user.id).toBe('123');
    expect(context?.user.email).toBe('user@example.com');
    expect(context?.user.roles).toEqual(['user', 'admin']);
    expect(context?.session.id).toBe('sess-456');
    expect(context?.session.duration).toBe(1200);
    expect(context?.session.ip).toBe('127.0.0.1');
    expect(context?.performance.duration).toBe(250);
    expect(context?.performance.memory).toBe(1024000);
  });

  test('should handle error context', () => {
    // Given: Log entry with error context
    const error = new Error('Database connection failed');
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message: 'Failed to connect to database',
      timestamp: new Date(),
      module: 'database',
      context: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        host: 'localhost',
        port: 5432,
        database: 'testdb',
      },
    };

    // Then: Should handle error context
    expect(entry.level).toBe(LogLevel.ERROR);
    expect(entry.message).toBe('Failed to connect to database');
    expect(entry.timestamp).toBeInstanceOf(Date);
    expect(entry.module).toBe('database');
    const errorContext = entry.context as any;
    expect(errorContext?.error?.name).toBe('Error');
    expect(errorContext?.error?.message).toBe('Database connection failed');
    expect(errorContext?.host).toBe('localhost');
    expect(errorContext?.port).toBe(5432);
    expect(errorContext?.database).toBe('testdb');
  });
});

describe('LogLevel', () => {
  test('should support all log levels as union type', () => {
    // Given: Different log levels (matching actual LogLevel union)
    const levels: LogLevel[] = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.FATAL,
    ];

    // Then: All should be valid log levels
    for (const level of levels) {
      expect([
        LogLevel.DEBUG,
        LogLevel.INFO,
        LogLevel.WARN,
        LogLevel.ERROR,
        LogLevel.FATAL,
      ]).toContain(level);
    }
  });

  test('should allow type-safe level comparisons', () => {
    // Then: Should compare levels correctly
    expect(isHigherLevel(LogLevel.ERROR, LogLevel.INFO)).toBe(true);
    expect(isHigherLevel(LogLevel.DEBUG, LogLevel.ERROR)).toBe(false);
    expect(isHigherLevel(LogLevel.WARN, LogLevel.WARN)).toBe(true);
    expect(isHigherLevel(LogLevel.FATAL, LogLevel.DEBUG)).toBe(true);
  });
});
