/**
 * Factory functions for generating test data with parallel-safe defaults
 */

import { faker } from '@faker-js/faker';
import type {
  ScrapingConfig,
  HttpClientConfig,
  ScrapingResult,
  RetryConfig,
  RateLimiter,
} from '../../../src/types';

const fakerAny = faker as any;

/**
 * Creates a basic scraping configuration with sensible defaults
 */
export const createScrapingConfig = (overrides: Partial<ScrapingConfig> = {}): ScrapingConfig => ({
  target: {
    url: faker.internet.url(),
    selector: 'article',
    waitFor: 1000,
    ...overrides.target,
  },
  extraction: {
    fields: {
      title: 'h1',
      content: '.content',
    },
    multiple: true,
    ...overrides.extraction,
  },
  output: {
    format: 'json',
    filename: 'output.json',
    ...overrides.output,
  },
  behavior: {
    retryAttempts: 3,
    retryDelay: 1000,
    rateLimit: 1,
    userAgent: 'DocumentScrape/1.0',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    ...overrides.behavior,
  },
});

/**
 * Creates a minimal scraping configuration for basic tests
 */
export const createMinimalScrapingConfig = (
  overrides: Partial<ScrapingConfig> = {}
): ScrapingConfig => ({
  target: {
    url: faker.internet.url(),
    ...overrides.target,
  },
  extraction: {
    fields: {
      title: 'h1',
    },
    ...overrides.extraction,
  },
  output: {
    format: 'json',
    ...overrides.output,
  },
  behavior: {
    retryAttempts: 1,
    retryDelay: 500,
    rateLimit: 1,
    ...overrides.behavior,
  },
  ...overrides,
});

/**
 * Creates a complex scraping configuration with multiple fields and options
 */
export const createComplexScrapingConfig = (
  overrides: Partial<ScrapingConfig> = {}
): ScrapingConfig => ({
  target: {
    url: faker.internet.url(),
    selector: 'article.post',
    waitFor: 2000,
    ...overrides.target,
  },
  extraction: {
    fields: {
      title: 'h2',
      author: '.author',
      date: '.date',
      content: '.content',
      tags: '.tags',
    },
    multiple: true,
    ...overrides.extraction,
  },
  output: {
    format: 'json',
    filename: 'posts.json',
    ...overrides.output,
  },
  behavior: {
    retryAttempts: 5,
    retryDelay: 2000,
    rateLimit: 2,
    userAgent: 'AdvancedDocumentScraper/2.0',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache',
    },
    ...overrides.behavior,
  },
  ...overrides,
});

/**
 * Creates an HTTP client configuration
 */
export const createHttpClientConfig = (
  overrides: Partial<HttpClientConfig> = {}
): HttpClientConfig => ({
  retryAttempts: 3,
  retryDelay: 1000,
  rateLimit: 1,
  userAgent: 'TestAgent/1.0',
  timeout: 10000,
  headers: {
    Accept: 'text/html',
  },
  ...overrides,
});

/**
 * Creates a retry configuration
 */
export const createRetryConfig = (overrides: Partial<RetryConfig> = {}): RetryConfig => ({
  attempts: 3,
  delay: 1000,
  backoff: 'exponential',
  maxDelay: 10000,
  ...overrides,
});

/**
 * Creates a rate limiter configuration
 */
export const createRateLimiter = (overrides: Partial<RateLimiter> = {}): RateLimiter => ({
  maxRequests: 10,
  windowMs: 60000,
  ...overrides,
});

/**
 * Creates a scraping result for testing
 */
export const createScrapingResult = (overrides: Partial<ScrapingResult> = {}): ScrapingResult => ({
  url: faker.internet.url(),
  data: {
    title: faker.lorem.sentences(),
    content: Array.from({ length: 3 }, () => faker.lorem.paragraph()).join('\n\n'),
  },
  success: true,
  metadata: {
    extractedAt: fakerAny.date.recent({ days: 1 }),
    selector: 'article',
    extractionTime: fakerAny.number.int({ min: 100, max: 5000 }),
    retryCount: fakerAny.number.int({ min: 0, max: 3 }),
  },
  ...overrides,
});

/**
 * Creates a scraping result with array data
 */
export const createArrayScrapingResult = (
  count = 3,
  overrides: Partial<ScrapingResult> = {}
): ScrapingResult => ({
  url: faker.internet.url(),
  data: Array.from({ length: count }, () => ({
    title: faker.lorem.sentences(),
    content: faker.lorem.paragraph(),
    author: `${fakerAny.person.firstName()} ${fakerAny.person.lastName()}`,
    date: fakerAny.date.recent().toISOString(),
  })),
  success: true,
  metadata: {
    extractedAt: fakerAny.date.recent({ days: 1 }),
    selector: 'article.post',
    extractionTime: faker.number.int({ min: 200, max: 8000 }),
    retryCount: faker.number.int({ min: 0, max: 5 }),
  },
  ...overrides,
});

/**
 * Creates a configuration with CSV output
 */
export const createCsvScrapingConfig = (
  overrides: Partial<ScrapingConfig> = {}
): ScrapingConfig => ({
  ...createScrapingConfig(),
  output: {
    format: 'csv',
    filename: 'output.csv',
    ...overrides.output,
  },
  ...overrides,
});

/**
 * Creates a configuration with database output
 */
export const createDatabaseScrapingConfig = (
  overrides: Partial<ScrapingConfig> = {}
): ScrapingConfig => ({
  ...createScrapingConfig(),
  output: {
    format: 'database',
    database: {
      type: 'sqlite',
      connection: 'test.db',
      table: 'scraped_data',
    },
    ...overrides.output,
  },
  ...overrides,
});

/**
 * Creates a scraping configuration for error scenarios
 */
export const createErrorScrapingConfig = (
  overrides: Partial<ScrapingConfig> = {}
): ScrapingConfig => ({
  target: {
    url: 'https://nonexistent-domain-12345.com',
    selector: 'nonexistent-selector',
    waitFor: 100,
    ...overrides.target,
  },
  extraction: {
    fields: {
      title: 'h1',
    },
    multiple: false,
    ...overrides.extraction,
  },
  output: {
    format: 'json',
    ...overrides.output,
  },
  behavior: {
    retryAttempts: 1,
    retryDelay: 100,
    rateLimit: 1,
    ...overrides.behavior,
  },
  ...overrides,
});

/**
 * Helper to generate unique URLs for parallel test execution
 * Uses crypto.randomUUID() for better randomness security
 */
export const createUniqueUrl = (path = ''): string => {
  const timestamp = Date.now();
  const uniqueId = crypto.randomUUID().substring(0, 8);
  return `https://test-${timestamp}-${uniqueId}.example.com${path}`;
};

/**
 * Helper to generate unique filenames for parallel test execution
 * Uses crypto.randomUUID() for better randomness security
 */
export const createUniqueFilename = (extension = 'json'): string => {
  const timestamp = Date.now();
  const uniqueId = crypto.randomUUID().substring(0, 8);
  return `test-${timestamp}-${uniqueId}.${extension}`;
};
