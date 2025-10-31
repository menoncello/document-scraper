/**
 * Unit tests for Result Factory - Integration Tests
 * Tests for result factory integration and consistency
 */

import { test, expect, beforeEach, afterEach, describe } from 'bun:test';
import {
  createSuccessResult,
  createFailureResult,
  createEmptyFailureResult,
} from '../../../../../src/core/utils/result-factory';
import type { ScrapingResult } from '../../../../../src/types/index';

// Test data fixtures
const TEST_URL = 'https://example.com';
const TEST_SELECTOR = '.content';
const TEST_EXTRACTION_TIME = 150;
const TEST_RETRY_COUNT = 2;

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
function assertMetadataConsistency(
  successResult: ScrapingResult,
  failureResult: ScrapingResult,
  emptyFailureResult: ScrapingResult
) {
  const successKeys = Object.keys(successResult.metadata);
  const failureKeys = Object.keys(failureResult.metadata);
  const emptyFailureKeys = Object.keys(emptyFailureResult.metadata);

  // Success and failure results should have the same structure (including selector)
  expect(successKeys).toEqual(failureKeys);

  // All results should contain required base fields
  expect(successKeys).toContain('extractedAt');
  expect(successKeys).toContain('extractionTime');
  expect(successKeys).toContain('retryCount');
  expect(successKeys).toContain('selector');

  // Empty failure result should not have selector (by design)
  expect(emptyFailureKeys).toContain('extractedAt');
  expect(emptyFailureKeys).toContain('extractionTime');
  expect(emptyFailureKeys).toContain('retryCount');
  expect(emptyFailureKeys).not.toContain('selector');
}

function assertEdgeCaseUrlHandling(url: string) {
  const successResult = createSuccessResult(url, {
    selector: undefined,
    data: {},
    extractionTime: 0,
    retryCount: 0,
  });
  const failureResult = createFailureResult(url, {
    selector: undefined,
    isMultiple: false,
    extractionTime: 0,
    retryCount: 0,
  });
  const emptyFailureResult = createEmptyFailureResult(url);

  // Should handle edge cases consistently
  expect(successResult.url).toBe(url);
  expect(failureResult.url).toBe(url);
  expect(emptyFailureResult.url).toBe(url);
}

describe('Result Factory Integration', () => {
  test('TC-RF-104-01 [P2]: Should create consistent metadata across all factory functions', () => {
    // Given: Parameters for all factory functions
    const successParams = {
      selector: TEST_SELECTOR,
      data: { test: 'data' },
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };
    const failureParams = {
      selector: TEST_SELECTOR,
      isMultiple: true,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating results with all factory functions
    const successResult = createSuccessResult(TEST_URL, successParams);
    const failureResult = createFailureResult(TEST_URL, failureParams);
    const emptyFailureResult = createEmptyFailureResult(TEST_URL);

    // Then: Should have consistent base metadata structure
    assertMetadataConsistency(successResult, failureResult, emptyFailureResult);
  });

  test('TC-RF-104-02 [P2]: Should handle edge case URLs consistently', () => {
    // Given: Edge case URLs
    const edgeUrls = [
      '',
      ' ',
      '\n\t',
      'https://example.com/path?query=value#anchor',
      'file:///local/path',
    ];

    // When: Creating results with edge case URLs
    for (const url of edgeUrls) {
      assertEdgeCaseUrlHandling(url);
    }
  });
});
