/**
 * Unit tests for Types Module - Main Index Types
 * Tests for comprehensive type definitions and interfaces
 */

import { test, expect, describe } from 'bun:test';
import type {
  ConfigValidationResult,
  ConfigMergeOptions,
  DebugInfo,
  DebugOptions,
  DataTransform,
  DataFilter,
  ExtractionOptions,
  ExtractionContext,
  ScrapingConfig,
} from '@/types';

// Helper functions moved to outer scope to fix function scoping
const createCompleteDebugInfo = (): DebugInfo => ({
  url: 'https://example.com',
  timestamp: new Date('2023-01-01T12:00:00Z'),
  userAgent: 'TestBot/1.0',
  responseHeaders: {
    'content-type': 'text/html',
    'content-length': '1024',
  },
  requestHeaders: {
    'User-Agent': 'TestBot/1.0',
    Accept: 'text/html',
  },
  responseTime: 1500,
  status: 200,
  contentLength: 1024,
  contentType: 'text/html; charset=utf-8',
  extractedData: {
    title: 'Test Article',
    content: 'Test content',
  },
  errors: [],
});

const createDebugInfoWithErrors = (): DebugInfo => ({
  url: 'https://example.com',
  timestamp: new Date(),
  userAgent: 'TestBot/1.0',
  responseHeaders: {},
  requestHeaders: {},
  responseTime: 0,
  status: 500,
  contentLength: 0,
  contentType: 'text/html',
  errors: [
    'Network timeout occurred',
    'Failed to parse HTML content',
    'Selector not found: .nonexistent',
  ],
});

const createCompleteDebugOptions = (): DebugOptions => ({
  saveHtml: true,
  saveScreenshots: true,
  saveHeaders: true,
  saveData: true,
  outputPath: './debug-output', // Use relative path instead of publicly writable directory
});

const transform: DataTransform = (value: string, context: ExtractionContext) => {
  return `${context.url}: ${value}`;
};

const filter: DataFilter = (value: string | number | boolean, context: ExtractionContext) => {
  return typeof value === 'string' && value.includes(context.url);
};

const createTransformAndFilter = () => ({ transform, filter });

const createExtractionOptions = (
  transform: DataTransform,
  filter: DataFilter
): ExtractionOptions => ({
  transform,
  filter,
  multiple: true,
  preserveOrder: true,
});

const createExtractionContext = (): ExtractionContext => ({
  url: 'https://example.com',
  selector: 'article',
  timestamp: new Date(),
});

const createComplexConfig = (): ScrapingConfig => ({
  target: {
    url: 'https://example.com',
    selector: 'article',
    waitFor: 1000,
  },
  extraction: {
    fields: {
      title: 'h1',
      content: '.content',
    },
    multiple: true,
  },
  output: {
    format: 'json',
    filename: 'output.json',
  },
  behavior: {
    retryAttempts: 3,
    retryDelay: 1000,
    rateLimit: 50,
    userAgent: 'TestBot/1.0',
    headers: {
      'Accept-Language': 'en-US',
    },
  },
});

describe('Core Types - Interfaces and Type Definitions', () => {
  // Scraping and Parsing-related tests have been moved to separate files
  // HTTP-related tests have been moved to http-types.test.ts
  // Logger-related tests have been moved to logger-types.test.ts

  describe('ConfigValidationResult', () => {
    test('should accept validation result with errors and warnings', () => {
      // Given: A validation result with issues
      const _result: ConfigValidationResult = {
        valid: false,
        errors: ['Target URL is required', 'At least one extraction field must be specified'],
        warnings: [
          'High retry count may indicate issues with target website',
          'Consider setting a user agent for better compatibility',
        ],
      };

      // Then: Should accept validation result
      expect(_result.valid).toBe(false);
      expect(_result.errors).toHaveLength(2);
      expect(_result.warnings).toHaveLength(2);
    });

    test('should accept validation result without issues', () => {
      // Given: A perfect validation result
      const _result: ConfigValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
      };

      // Then: Should accept clean result
      expect(_result.valid).toBe(true);
      expect(_result.errors).toHaveLength(0);
      expect(_result.warnings).toHaveLength(0);
    });
  });

  describe('ConfigMergeOptions', () => {
    test('should accept complete merge options', () => {
      // Given: Complete merge options
      const options: ConfigMergeOptions = {
        deep: true,
        overwrite: true,
      };

      // Then: Should accept complete options
      expect(options.deep).toBe(true);
      expect(options.overwrite).toBe(true);
    });

    test('should accept minimal merge options', () => {
      // Given: Minimal merge options
      const options: ConfigMergeOptions = {};

      // Then: Should accept empty options
      expect(options.deep).toBeUndefined();
      expect(options.overwrite).toBeUndefined();
    });
  });

  // Logger-related tests have been moved to logger-types.test.ts

  describe('DebugInfo and DebugOptions', () => {
    test('should accept complete debug information', () => {
      // Given: Complete debug information
      const debugInfo = createCompleteDebugInfo();

      // Then: Should accept complete debug info
      expect(debugInfo.url).toBe('https://example.com');
      expect(debugInfo.responseTime).toBe(1500);
      expect(debugInfo.extractedData?.title).toBe('Test Article');
    });

    test('should accept debug information with errors', () => {
      // Given: Debug information with errors
      const debugInfo = createDebugInfoWithErrors();

      // Then: Should accept debug info with errors
      expect(debugInfo.status).toBe(500);
      expect(debugInfo.errors).toHaveLength(3);
      expect(debugInfo.errors![0]).toContain('timeout');
    });

    test('should accept complete debug options', () => {
      // Given: Complete debug options
      const options = createCompleteDebugOptions();

      // Then: Should accept complete options
      expect(options.saveHtml).toBe(true);
      expect(options.saveScreenshots).toBe(true);
      expect(options.outputPath).toBe('./debug-output');
    });

    test('should accept minimal debug options', () => {
      // Given: Minimal debug options
      const options: DebugOptions = {};

      // Then: Should accept empty options
      expect(options.saveHtml).toBeUndefined();
      expect(options.outputPath).toBeUndefined();
    });
  });

  describe('Type Compatibility and Integration', () => {
    test('should handle type relationships correctly', () => {
      // Given: Related types working together
      const { transform, filter } = createTransformAndFilter();
      const extractionOptions = createExtractionOptions(transform, filter);
      const context = createExtractionContext();

      // When: Using the types together
      const testValue = 'Test content';
      const transformed = transform(testValue, context);
      const passesFilter = filter(transformed, context);

      // Then: Should work together correctly
      expect(transformed).toBe('https://example.com: Test content');
      expect(passesFilter).toBe(true);
      expect(extractionOptions.transform).toBe(transform);
      expect(extractionOptions.filter).toBe(filter);
      expect(extractionOptions.multiple).toBe(true);
      expect(extractionOptions.preserveOrder).toBe(true);
    });

    test('should handle complex configuration relationships', () => {
      // Given: Complex configuration with related types
      const config = createComplexConfig();
      const validation: ConfigValidationResult = {
        valid: true,
        errors: [],
        warnings: ['High rate limit may result in slow scraping'],
      };

      const mergeOptions: ConfigMergeOptions = {
        deep: true,
        overwrite: false,
      };

      // Then: Should handle complex relationships
      expect(config.target.url).toBe('https://example.com');
      expect(config.target.selector).toBe('article');
      expect(config.extraction.fields.title).toBe('h1');
      expect(config.extraction.fields.content).toBe('.content');
      expect(config.extraction.multiple).toBe(true);
      expect(config.output.format).toBe('json');
      expect(config.output.filename).toBe('output.json');
      expect(config.behavior.retryAttempts).toBe(3);
      expect(config.behavior.retryDelay).toBe(1000);
      expect(config.behavior.rateLimit).toBe(50);
      expect(config.behavior.userAgent).toBe('TestBot/1.0');
      expect(config.behavior.headers?.['Accept-Language']).toBe('en-US');
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
      expect(validation.warnings).toEqual(['High rate limit may result in slow scraping']);
      expect(mergeOptions.deep).toBe(true);
      expect(mergeOptions.overwrite).toBe(false);
    });
  });
});
