/**
 * Unit tests for Result Factory - createFailureResult Function
 * Tests for failure result creation
 */

import { test, expect, beforeEach, afterEach, describe } from 'bun:test';
import { createFailureResult } from '../../../../../src/core/utils/result-factory';
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
interface FailureResultExpectations {
  expectedUrl: string;
  expectedSelector: string | undefined;
  expectedExtractionTime: number;
  expectedRetryCount: number;
}

function assertBasicFailureResult(result: ScrapingResult, expectations: FailureResultExpectations) {
  expect(result.url).toBe(expectations.expectedUrl);
  expect(result.metadata.selector).toBe(expectations.expectedSelector);
  expect(result.metadata.extractionTime).toBe(expectations.expectedExtractionTime);
  expect(result.metadata.retryCount).toBe(expectations.expectedRetryCount);
}

function assertSingleFailureResult(
  result: ScrapingResult,
  expectations: FailureResultExpectations
) {
  assertBasicFailureResult(result, expectations);
  expect(result.data).toEqual({});
  expect(typeof result.data).toBe('object');
  expect(Array.isArray(result.data)).toBe(false);
}

function assertMultipleFailureResult(
  result: ScrapingResult,
  expectations: FailureResultExpectations
) {
  assertBasicFailureResult(result, expectations);
  expect(result.data).toEqual([]);
  expect(Array.isArray(result.data)).toBe(true);
  expect((result.data as unknown[]).length).toBe(0);
}

describe('createFailureResult - Basic Functionality', () => {
  test('TC-RF-102-01 [P0]: Should create failure result for single extraction (isMultiple: false)', () => {
    // Given: Failure parameters for single extraction
    const params = {
      selector: TEST_SELECTOR,
      isMultiple: false,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating failure result
    const result = createFailureResult(TEST_URL, params);

    // Then: Should create result with empty object data
    assertSingleFailureResult(result, {
      expectedUrl: TEST_URL,
      expectedSelector: TEST_SELECTOR,
      expectedExtractionTime: TEST_EXTRACTION_TIME,
      expectedRetryCount: TEST_RETRY_COUNT,
    });
  });

  test('TC-RF-102-02 [P0]: Should create failure result for multiple extraction (isMultiple: true)', () => {
    // Given: Failure parameters for multiple extraction
    const params = {
      selector: TEST_SELECTOR,
      isMultiple: true,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating failure result for multiple extraction
    const result = createFailureResult(TEST_URL, params);

    // Then: Should create result with empty array data
    assertMultipleFailureResult(result, {
      expectedUrl: TEST_URL,
      expectedSelector: TEST_SELECTOR,
      expectedExtractionTime: TEST_EXTRACTION_TIME,
      expectedRetryCount: TEST_RETRY_COUNT,
    });
  });
});

describe('createFailureResult - Edge Cases', () => {
  test('TC-RF-102-03 [P1]: Should create failure result with undefined selector', () => {
    // Given: Failure parameters with undefined selector
    const params = {
      selector: undefined,
      isMultiple: false,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating failure result without selector
    const result = createFailureResult(TEST_URL, params);

    // Then: Should create result with undefined selector
    assertSingleFailureResult(result, {
      expectedUrl: TEST_URL,
      expectedSelector: undefined,
      expectedExtractionTime: TEST_EXTRACTION_TIME,
      expectedRetryCount: TEST_RETRY_COUNT,
    });
  });

  test('TC-RF-102-04 [P1]: Should create failure result with zero extraction time and retry count', () => {
    // Given: Parameters with zero values
    const params = {
      selector: TEST_SELECTOR,
      isMultiple: true,
      extractionTime: 0,
      retryCount: 0,
    };

    // When: Creating failure result with zero values
    const result = createFailureResult(TEST_URL, params);

    // Then: Should preserve zero values and return empty array for multiple extraction
    assertMultipleFailureResult(result, {
      expectedUrl: TEST_URL,
      expectedSelector: TEST_SELECTOR,
      expectedExtractionTime: 0,
      expectedRetryCount: 0,
    });
  });

  test('TC-RF-102-05 [P2]: Should handle high retry counts and extraction times', () => {
    // Given: Parameters with high values
    const params = {
      selector: TEST_SELECTOR,
      isMultiple: false,
      extractionTime: 999999,
      retryCount: 100,
    };

    // When: Creating failure result with high values
    const result = createFailureResult(TEST_URL, params);

    // Then: Should preserve high values
    assertSingleFailureResult(result, {
      expectedUrl: TEST_URL,
      expectedSelector: TEST_SELECTOR,
      expectedExtractionTime: 999999,
      expectedRetryCount: 100,
    });
  });
});
