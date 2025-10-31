/**
 * Unit tests for Result Factory - createEmptyFailureResult Function
 * Tests for empty failure result creation
 */

import { test, expect, beforeEach, afterEach, describe } from 'bun:test';
import { createEmptyFailureResult } from '../../../../../src/core/utils/result-factory';
import type { ScrapingResult } from '../../../../../src/types/index';

// Test data fixtures
const _TEST_URL = 'https://example.com';

let originalNow: () => number;

beforeEach(() => {
  // Store original Date.now
  originalNow = Date.now;

  // Ensure consistent test timing by mocking Date.now
  const mockDate = new Date('2025-01-01T00:00:00.000Z');
  Date.now = () => mockDate.getTime();
});

afterEach(() => {
  // Restore original Date.now
  Date.now = originalNow;
});

// Helper functions for test assertions
function assertBasicEmptyFailureResult(result: ScrapingResult, expectedUrl: string) {
  expect(result.url).toBe(expectedUrl);
  expect(result.data).toEqual([]);
  expect(Array.isArray(result.data)).toBe(true);
  expect((result.data as unknown[]).length).toBe(0);
  expect(result.metadata.extractionTime).toBe(0);
  expect(result.metadata.retryCount).toBe(0);
}

function assertDetailedEmptyFailureResult(result: ScrapingResult, expectedUrl: string) {
  assertBasicEmptyFailureResult(result, expectedUrl);
  expect(result.metadata.extractedAt).toBeInstanceOf(Date);
  expect(result.metadata.selector).toBeUndefined();
}

function assertMetadataStructure(result1: ScrapingResult, result2: ScrapingResult) {
  const metadataKeys = Object.keys(result1.metadata);
  const metadataKeys2 = Object.keys(result2.metadata);

  expect(metadataKeys).toEqual(['extractedAt', 'extractionTime', 'retryCount']);
  expect(metadataKeys2).toEqual(metadataKeys);
  expect(typeof result1.metadata.extractedAt).toBe('object');
  expect(typeof result1.metadata.extractionTime).toBe('number');
  expect(typeof result1.metadata.retryCount).toBe('number');
}

describe('createEmptyFailureResult', () => {
  test('TC-RF-103-01 [P0]: Should create empty failure result for multiple URL extraction', () => {
    // Given: Only URL parameter
    const url = 'https://example.com/page';

    // When: Creating empty failure result
    const result = createEmptyFailureResult(url);

    // Then: Should create result with empty array and default metadata
    assertDetailedEmptyFailureResult(result, url);
  });

  test('TC-RF-103-02 [P1]: Should handle empty URL string', () => {
    // Given: Empty URL string
    const url = '';

    // When: Creating empty failure result with empty URL
    const result = createEmptyFailureResult(url);

    // Then: Should handle empty URL gracefully
    assertBasicEmptyFailureResult(result, url);
  });

  test('TC-RF-103-03 [P1]: Should handle special characters in URL', () => {
    // Given: URL with special characters
    const url = 'https://example.com/path?param=value&other=测试#section';

    // When: Creating empty failure result with special URL
    const result = createEmptyFailureResult(url);

    // Then: Should preserve special characters in URL
    assertBasicEmptyFailureResult(result, url);
  });

  test('TC-RF-103-04 [P2]: Should handle very long URLs', () => {
    // Given: Very long URL
    const longPath = '/a'.repeat(1000);
    const url = `https://example.com${longPath}`;

    // When: Creating empty failure result with long URL
    const result = createEmptyFailureResult(url);

    // Then: Should handle long URL gracefully
    expect(result.url).toBe(url);
    expect(result.url.length).toBeGreaterThan(1000);
    assertBasicEmptyFailureResult(result, url);
  });

  test('TC-RF-103-05 [P2]: Should always return empty array regardless of URL format', () => {
    // Given: Various URL formats - using secure protocols for testing
    const urls = [
      'https://example.com',
      'https://test.org',
      'sftp://files.server.net',
      'file:///path/to/file',
      '/relative/path',
      'just-a-string',
    ];

    // When: Creating empty failure results for each URL
    const results = urls.map(createEmptyFailureResult);

    // Then: All should return empty array data
    for (const [index, result] of results.entries()) {
      assertBasicEmptyFailureResult(result, urls[index]!);
    }
  });

  test('TC-RF-103-06 [P2]: Should have consistent metadata structure', () => {
    // Given: Multiple calls to createEmptyFailureResult
    const result1 = createEmptyFailureResult('https://example1.com');
    const result2 = createEmptyFailureResult('https://example2.com');

    // When: Comparing metadata structures
    // Then: Should have identical metadata structure
    assertMetadataStructure(result1, result2);
  });
});
