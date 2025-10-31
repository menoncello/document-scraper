/**
 * Unit tests for Types Module - Result Types
 * Tests for ScrapingResult and related result type definitions
 */

import { test, expect, describe } from 'bun:test';
import type { SelectorResult, ExtractionOptions, ScrapingResult } from '@/types';

// Test factory functions moved to outer scope
const createObjectResult = (): ScrapingResult => ({
  url: 'https://example.com',
  data: {
    title: 'Test Title',
    content: 'Test Content',
    author: 'Test Author',
  },
  success: true,
  metadata: {
    extractedAt: new Date(),
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
    },
    {
      title: 'Article 2',
      content: 'Content 2',
    },
  ],
  success: true,
  metadata: {
    extractedAt: new Date(),
    selector: 'article',
    extractionTime: 2000,
    retryCount: 1,
  },
});

describe('ScrapingResult', () => {
  test('should accept result with object data', () => {
    // Given: A result with object data
    const _result = createObjectResult();

    // Then: Should accept object data
    expect(_result.url).toBe('https://example.com');
    expect(typeof _result.data).toBe('object');
    expect(Array.isArray(_result.data)).toBe(false);
    expect((_result.data as any).title).toBe('Test Title');
  });

  test('should accept result with array data', () => {
    // Given: A result with array data
    const _result = createArrayResult();

    // Then: Should accept array data
    expect(_result.url).toBe('https://example.com');
    expect(Array.isArray(_result.data)).toBe(true);
    expect((_result.data as unknown[]).length).toBe(2);
    expect((_result.data as any[])[0].title).toBe('Article 1');
  });

  test('should support optional selector in metadata', () => {
    // Given: A result without selector
    const _result: ScrapingResult = {
      url: 'https://example.com',
      data: { title: 'Test' },
      success: true,
      metadata: {
        extractedAt: new Date(),
        extractionTime: 1000,
        retryCount: 0,
      },
    };

    // Then: Should accept missing selector
    expect(_result.url).toBe('https://example.com');
    expect((_result.data as any).title).toBe('Test');
    expect(_result.success).toBe(true);
    expect(_result.metadata.extractedAt).toBeInstanceOf(Date);
    expect(_result.metadata.extractionTime).toBe(1000);
    expect(_result.metadata.retryCount).toBe(0);
    expect(_result.metadata.selector).toBeUndefined();
  });

  test('should handle complete metadata', () => {
    // Given: A result with complete metadata
    const now = new Date();
    const _result: ScrapingResult = {
      url: 'https://example.com',
      data: { title: 'Test' },
      success: true,
      metadata: {
        extractedAt: now,
        selector: 'h1',
        extractionTime: 500,
        retryCount: 3,
      },
    };

    // Then: Should preserve all metadata
    expect(_result.url).toBe('https://example.com');
    expect((_result.data as any).title).toBe('Test');
    expect(_result.success).toBe(true);
    expect(_result.metadata.extractedAt).toBe(now);
    expect(_result.metadata.selector).toBe('h1');
    expect(_result.metadata.extractionTime).toBe(500);
    expect(_result.metadata.retryCount).toBe(3);
  });
});

describe('SelectorResult', () => {
  test('should represent selector extraction result', () => {
    // Given: A selector result
    const _result: SelectorResult = {
      elements: [],
      data: 'Page Title',
      found: true,
      count: 1,
      exists: true,
      extractAttribute: () => '',
    };

    // Then: Should have correct structure
    expect(_result.elements).toEqual([]);
    expect(_result.data).toBe('Page Title');
    expect(_result.found).toBe(true);
    expect(_result.count).toBe(1);
    expect(_result.exists).toBe(true);
    expect(typeof _result.extractAttribute).toBe('function');
  });

  test('should handle not found results', () => {
    // Given: A selector result for missing element
    const _result: SelectorResult = {
      elements: [],
      data: null,
      found: false,
      count: 0,
      exists: false,
      extractAttribute: () => '',
    };

    // Then: Should handle not found case
    expect(_result.elements).toEqual([]);
    expect(_result.data).toBeNull();
    expect(_result.found).toBe(false);
    expect(_result.count).toBe(0);
    expect(_result.exists).toBe(false);
    expect(typeof _result.extractAttribute).toBe('function');
  });

  test('should handle multiple elements', () => {
    // Given: A selector result with multiple elements
    const _result: SelectorResult = {
      elements: [],
      data: ['Item 1', 'Item 2', 'Item 3'],
      found: true,
      count: 3,
      exists: true,
      extractAttribute: () => '',
    };

    // Then: Should handle multiple elements
    expect(_result.elements).toEqual([]);
    expect(Array.isArray(_result.data)).toBe(true);
    expect(_result.found).toBe(true);
    expect(_result.count).toBe(3);
    expect(_result.exists).toBe(true);
    expect((_result.data as string[])[0]).toBe('Item 1');
    expect(typeof _result.extractAttribute).toBe('function');
  });
});

describe('ExtractionOptions', () => {
  test('should represent extraction configuration options', () => {
    // Given: Extraction options
    const options: ExtractionOptions = {
      includeEmpty: true,
      trimWhitespace: true,
      convertToNumber: false,
      dateFormat: 'ISO',
      encoding: 'utf-8',
    };

    // Then: Should have correct structure
    expect(options.includeEmpty).toBe(true);
    expect(options.trimWhitespace).toBe(true);
    expect(options.convertToNumber).toBe(false);
    expect(options.dateFormat).toBe('ISO');
    expect(options.encoding).toBe('utf-8');
  });

  test('should handle minimal extraction options', () => {
    // Given: Minimal extraction options
    const options: ExtractionOptions = {
      includeEmpty: false,
      trimWhitespace: false,
    };

    // Then: Should accept minimal options
    expect(options.includeEmpty).toBe(false);
    expect(options.trimWhitespace).toBe(false);
    expect(options.convertToNumber).toBeUndefined();
  });
});
