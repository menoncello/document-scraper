/**
 * Unit tests for Types Module - Configuration Types
 * Tests for ScrapingConfig and related configuration type definitions
 */

import { test, expect, describe } from 'bun:test';
import type { ScrapingConfig, ConfigValidationResult, ConfigMergeOptions } from '@/types';

// Helper function moved to outer scope to fix function scoping
const createValidConfig = (): ScrapingConfig => ({
  target: {
    url: 'https://example.com',
    selector: 'article',
    waitFor: 1000,
  },
  extraction: {
    fields: {
      title: 'h1',
      content: '.content',
      author: '.author',
    },
    multiple: true,
  },
  output: {
    format: 'json',
    filename: 'output.json',
    database: {
      type: 'sqlite',
      connection: 'data.db',
      table: 'scraped_data',
    },
  },
  behavior: {
    retryAttempts: 3,
    retryDelay: 1000,
    rateLimit: 50,
    userAgent: 'Test-Agent/1.0',
    headers: {
      'Accept-Language': 'en-US',
      Accept: 'text/html',
    },
  },
});

// Helper function moved to outer scope to fix function scoping
const createDatabaseConfig = (
  type: 'sqlite' | 'postgresql' | 'mysql',
  connection: string
): ScrapingConfig => ({
  target: { url: 'https://example.com' },
  extraction: { fields: { title: 'h1' } },
  output: {
    format: 'database',
    database: {
      type,
      connection,
      table: 'scraped_data',
    },
  },
  behavior: { retryAttempts: 1, retryDelay: 500, rateLimit: 100 },
});

describe('ScrapingConfig', () => {
  test('should accept valid configuration structure', () => {
    // Given: A valid scraping configuration
    const config = createValidConfig();

    // Then: Should accept the configuration without type errors
    expect(config.target.url).toBe('https://example.com');
    expect(config.extraction.fields.title).toBe('h1');
    expect(config.output.format).toBe('json');
    expect(config.behavior.retryAttempts).toBe(3);
  });

  test('should accept minimal configuration', () => {
    // Given: A minimal scraping configuration
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
        format: 'json',
      },
      behavior: {
        retryAttempts: 1,
        retryDelay: 500,
        rateLimit: 100,
      },
    };

    // Then: Should accept minimal configuration
    expect(config.target.url).toBe('https://example.com');
    expect(config.extraction.fields.title).toBe('h1');
    expect(config.output.format).toBe('json');
    expect(config.behavior.retryAttempts).toBe(1);
    expect(config.behavior.retryDelay).toBe(500);
    expect(config.behavior.rateLimit).toBe(100);
  });

  test('should support all output formats', () => {
    // Given: Different output formats
    const jsonConfig: ScrapingConfig = {
      target: { url: 'https://example.com' },
      extraction: { fields: { title: 'h1' } },
      output: { format: 'json' },
      behavior: { retryAttempts: 1, retryDelay: 500, rateLimit: 100 },
    };

    const csvConfig: ScrapingConfig = {
      target: { url: 'https://example.com' },
      extraction: { fields: { title: 'h1' } },
      output: { format: 'csv' },
      behavior: { retryAttempts: 1, retryDelay: 500, rateLimit: 100 },
    };

    const databaseConfig: ScrapingConfig = {
      target: { url: 'https://example.com' },
      extraction: { fields: { title: 'h1' } },
      output: { format: 'database' },
      behavior: { retryAttempts: 1, retryDelay: 500, rateLimit: 100 },
    };

    // Then: Should accept all formats
    expect(jsonConfig.output.format).toBe('json');
    expect(jsonConfig.target.url).toBe('https://example.com');
    expect(jsonConfig.extraction.fields.title).toBe('h1');
    expect(jsonConfig.behavior.retryAttempts).toBe(1);
    expect(jsonConfig.behavior.retryDelay).toBe(500);
    expect(jsonConfig.behavior.rateLimit).toBe(100);

    expect(csvConfig.output.format).toBe('csv');
    expect(csvConfig.target.url).toBe('https://example.com');
    expect(csvConfig.extraction.fields.title).toBe('h1');
    expect(csvConfig.behavior.retryAttempts).toBe(1);
    expect(csvConfig.behavior.retryDelay).toBe(500);
    expect(csvConfig.behavior.rateLimit).toBe(100);

    expect(databaseConfig.output.format).toBe('database');
    expect(databaseConfig.target.url).toBe('https://example.com');
    expect(databaseConfig.extraction.fields.title).toBe('h1');
    expect(databaseConfig.behavior.retryAttempts).toBe(1);
    expect(databaseConfig.behavior.retryDelay).toBe(500);
    expect(databaseConfig.behavior.rateLimit).toBe(100);
  });

  test('should support all database types', () => {
    // Given: Different database types
    const sqliteConfig = createDatabaseConfig('sqlite', 'data.db');
    const postgresConfig = createDatabaseConfig(
      'postgresql',
      'postgresql://user:pass@localhost/db'
    );
    const mysqlConfig = createDatabaseConfig('mysql', 'mysql://user:pass@localhost/db');

    // Then: Should accept all database types
    expect(sqliteConfig.output.database?.type).toBe('sqlite');
    expect(postgresConfig.output.database?.type).toBe('postgresql');
    expect(mysqlConfig.output.database?.type).toBe('mysql');
  });
});

describe('ConfigValidationResult', () => {
  test('should represent validation result structure', () => {
    // Given: A validation result
    const _result: ConfigValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    // Then: Should have correct structure
    expect(_result.valid).toBe(true);
    expect(Array.isArray(_result.errors)).toBe(true);
    expect(Array.isArray(_result.warnings)).toBe(true);
  });

  test('should handle validation errors', () => {
    // Given: A validation result with errors
    const _result: ConfigValidationResult = {
      valid: false,
      errors: ['Target URL is required', 'Extraction fields must be specified'],
      warnings: [],
    };

    // Then: Should contain errors
    expect(_result.valid).toBe(false);
    expect(_result.errors).toHaveLength(2);
    expect(_result.errors[0]).toBe('Target URL is required');
    expect(Array.isArray(_result.warnings)).toBe(true);
  });
});

describe('ConfigMergeOptions', () => {
  test('should represent merge configuration options', () => {
    // Given: Merge options
    const options: ConfigMergeOptions = {
      deep: true,
      overwrite: false,
    };

    // Then: Should have correct structure
    expect(options.deep).toBe(true);
    expect(options.overwrite).toBe(false);
  });
});
