/**
 * Unit tests for config-validator.ts - Database Configuration Validation
 * Tests for database output configuration validation rules
 */

import { test, expect } from 'bun:test';
import { validateConfig } from '../../../../src/index';
import type { ScrapingConfig } from '../../../../src/types';

test('validateConfig should return errors for missing database configuration', () => {
  // Given: A config with database format but no database config
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'database' as const,
      // Missing database property
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect missing database configuration
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain(
    'Database configuration is required when output format is "database"'
  );
});

test('validateConfig should return errors for missing database type', () => {
  // Given: A config with database config but missing type
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'database' as const,
      database: {
        // Missing type
        connection: 'sqlite:///test.db',
        table: 'scraped_data',
      } as any,
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect missing database type
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Database type is required');
});

test('validateConfig should return errors for invalid database type', () => {
  // Given: A config with invalid database type
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'database' as const,
      database: {
        type: 'mongodb' as any, // Invalid type
        connection: 'mongodb://localhost:27017/test',
        table: 'scraped_data',
      },
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect invalid database type
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Database type must be one of: sqlite, postgresql, mysql');
});

test('validateConfig should return errors for missing database connection', () => {
  // Given: A config with database config but missing connection
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'database' as const,
      database: {
        type: 'sqlite',
        // Missing connection
        table: 'scraped_data',
      } as any,
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect missing database connection
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Database connection string is required');
});

test('validateConfig should return errors for missing database table', () => {
  // Given: A config with database config but missing table
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'database' as const,
      database: {
        type: 'sqlite',
        connection: 'sqlite:///test.db',
        // Missing table
      } as any,
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect missing database table
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Database table name is required');
});

test('validateConfig should validate complete database configuration', () => {
  // Given: A config with valid database configuration
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'database',
      database: {
        type: 'postgresql',
        connection: 'postgresql://user:pass@localhost:5432/testdb',
        table: 'scraped_data',
      },
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should be valid with no errors
  expect(_result.valid).toBe(true);
  expect(_result.errors).toHaveLength(0);
});
