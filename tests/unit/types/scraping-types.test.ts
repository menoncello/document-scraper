/**
 * Unit tests for Types Module - Scraping Types
 * Tests for ScrapingConfig and ScrapingResult type definitions
 */

import { test, expect, describe } from 'bun:test';
import type { ScrapingConfig, ScrapingResult } from '@/types';

// Test factory functions moved to outer scope
const createCompleteConfig = (): ScrapingConfig => ({
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
      date: '.date',
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
    userAgent: 'Mozilla/5.0 (compatible; TestBot/1.0)',
    headers: {
      'Accept-Language': 'en-US,en;q=0.9',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      DNT: '1',
      'Upgrade-Insecure-Requests': '1',
    },
  },
});

const createMinimalConfig = (): ScrapingConfig => ({
  target: { url: 'https://example.com' },
  extraction: { fields: { title: 'h1' } },
  output: { format: 'json' },
  behavior: { retryAttempts: 1, retryDelay: 500, rateLimit: 100 },
});

const createDatabaseConfig = (
  type: 'postgresql' | 'mysql',
  connection: string
): ScrapingConfig => ({
  target: { url: 'https://example.com' },
  extraction: { fields: { title: 'h1' } },
  output: {
    format: 'database',
    database: {
      type,
      connection,
      table: 'data',
    },
  },
  behavior: { retryAttempts: 1, retryDelay: 500, rateLimit: 100 },
});

const createObjectResult = (): ScrapingResult => ({
  url: 'https://example.com',
  data: {
    title: 'Test Article',
    content: 'Test content',
    author: 'Test Author',
    publishedAt: '2023-01-01',
    tags: ['test', 'article'],
  },
  success: true,
  metadata: {
    extractedAt: new Date('2023-01-01T12:00:00Z'),
    selector: 'article',
    extractionTime: 1500,
    retryCount: 0,
  },
});

const createArrayResult = (): ScrapingResult => ({
  url: 'https://example.com',
  data: [
    {
      title: 'Article 1',
      content: 'Content 1',
      author: 'Author 1',
    },
    {
      title: 'Article 2',
      content: 'Content 2',
      author: 'Author 2',
    },
    {
      title: 'Article 3',
      content: 'Content 3',
      author: 'Author 3',
    },
  ],
  success: true,
  metadata: {
    extractedAt: new Date(),
    selector: 'article',
    extractionTime: 3000,
    retryCount: 1,
  },
});

const createMinimalResult = (): ScrapingResult => ({
  url: 'https://example.com',
  data: { title: 'Test' },
  success: true,
  metadata: {
    extractedAt: new Date(),
    extractionTime: 500,
    retryCount: 0,
  },
});

describe('ScrapingConfig', () => {
  test('should accept complete configuration structure', () => {
    // Given: A complete scraping configuration
    const config = createCompleteConfig();

    // Then: Should accept complete configuration
    expect(config.target.url).toBe('https://example.com');
    expect(config.extraction.fields).toBeDefined();
    expect(config.output.format).toBe('json');
    expect(config.behavior.retryAttempts).toBe(3);
  });

  test('should accept minimal configuration structure', () => {
    // Given: A minimal scraping configuration
    const config = createMinimalConfig();

    // Then: Should accept minimal configuration
    expect(config.target.url).toBe('https://example.com');
    expect(config.extraction.fields.title).toBe('h1');
    expect(config.target.selector).toBeUndefined();
    expect(config.extraction.multiple).toBeUndefined();
  });

  test('should accept database output configuration', () => {
    // Given: Configuration with different database types
    const postgresConfig = createDatabaseConfig(
      'postgresql',
      'postgresql://user:pass@localhost/db'
    );
    const mysqlConfig = createDatabaseConfig('mysql', 'mysql://user:pass@localhost/db');

    // Then: Should accept all database types
    expect(postgresConfig.output.database?.type).toBe('postgresql');
    expect(mysqlConfig.output.database?.type).toBe('mysql');
  });

  test('should accept CSV output format', () => {
    // Given: Configuration with CSV output
    const config: ScrapingConfig = {
      target: { url: 'https://example.com' },
      extraction: { fields: { title: 'h1' } },
      output: {
        format: 'csv',
        filename: 'output.csv',
      },
      behavior: { retryAttempts: 1, retryDelay: 500, rateLimit: 100 },
    };

    // Then: Should accept CSV format
    expect(config.target.url).toBe('https://example.com');
    expect(config.extraction.fields.title).toBe('h1');
    expect(config.output.format).toBe('csv');
    expect(config.output.filename).toBe('output.csv');
    expect(config.behavior.retryAttempts).toBe(1);
    expect(config.behavior.retryDelay).toBe(500);
    expect(config.behavior.rateLimit).toBe(100);
  });
});

describe('ScrapingResult', () => {
  test('should accept result with object data', () => {
    // Given: A scraping result with object data
    const _result = createObjectResult();

    // Then: Should accept result structure
    expect(_result.url).toBe('https://example.com');
    expect((_result.data as any).title).toBe('Test Article');
    expect(_result.metadata.extractionTime).toBe(1500);
  });

  test('should accept result with array data', () => {
    // Given: A scraping result with array data
    const _result = createArrayResult();

    // Then: Should accept array data structure
    expect(Array.isArray(_result.data)).toBe(true);
    expect(_result.data).toHaveLength(3);
    expect((_result.data as any)[0].title).toBe('Article 1');
  });

  test('should accept result without selector', () => {
    // Given: A result without selector information
    const _result = createMinimalResult();

    // Then: Should accept result without selector
    expect(_result.metadata.selector).toBeUndefined();
  });
});
