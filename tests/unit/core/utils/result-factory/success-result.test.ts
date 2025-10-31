/**
 * Unit tests for Result Factory - createSuccessResult Function
 * Tests for successful result creation
 */

import { test, expect, beforeEach, afterEach, describe } from 'bun:test';
import { createSuccessResult } from '../../../../../src/core/utils/result-factory';
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
interface SuccessResultExpectations {
  expectedUrl: string;
  expectedData: Record<string, unknown> | unknown[];
  expectedSelector: string | undefined;
  expectedExtractionTime: number;
  expectedRetryCount: number;
}

function assertBasicSuccessResult(result: ScrapingResult, expectations: SuccessResultExpectations) {
  expect(result.url).toBe(expectations.expectedUrl);
  expect(result.data).toEqual(expectations.expectedData);
  expect(result.metadata.selector).toBe(expectations.expectedSelector);
  expect(result.metadata.extractionTime).toBe(expectations.expectedExtractionTime);
  expect(result.metadata.retryCount).toBe(expectations.expectedRetryCount);
}

function assertDetailedSuccessResult(
  result: ScrapingResult,
  expectations: SuccessResultExpectations
) {
  assertBasicSuccessResult(result, expectations);
  expect(result.metadata.extractedAt).toBeInstanceOf(Date);
}

function assertArrayDataResult(result: ScrapingResult) {
  expect(Array.isArray(result.data)).toBe(true);
}

function assertObjectDataResult(result: ScrapingResult) {
  expect(typeof result.data).toBe('object');
  expect(Array.isArray(result.data)).toBe(false);
}

describe('createSuccessResult - Basic Functionality', () => {
  test('TC-RF-101-01 [P0]: Should create success result with object data', () => {
    // Given: Test data for successful extraction
    const testData = { title: 'Test Title', content: 'Test content' };
    const params = {
      selector: TEST_SELECTOR,
      data: testData,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating a success result
    const result = createSuccessResult(TEST_URL, params);

    // Then: Should create properly structured result
    assertDetailedSuccessResult(result, {
      expectedUrl: TEST_URL,
      expectedData: testData,
      expectedSelector: TEST_SELECTOR,
      expectedExtractionTime: TEST_EXTRACTION_TIME,
      expectedRetryCount: TEST_RETRY_COUNT,
    });
  });

  test('TC-RF-101-02 [P0]: Should create success result with array data', () => {
    // Given: Test array data for multiple extraction
    const testData = [
      { title: 'Item 1', content: 'Content 1' },
      { title: 'Item 2', content: 'Content 2' },
    ];
    const params = {
      selector: TEST_SELECTOR,
      data: testData,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating a success result with array data
    const result = createSuccessResult(TEST_URL, params);

    // Then: Should create result with array data
    assertBasicSuccessResult(result, {
      expectedUrl: TEST_URL,
      expectedData: testData,
      expectedSelector: TEST_SELECTOR,
      expectedExtractionTime: TEST_EXTRACTION_TIME,
      expectedRetryCount: TEST_RETRY_COUNT,
    });
    assertArrayDataResult(result);
  });
});

describe('createSuccessResult - Edge Cases', () => {
  test('TC-RF-101-03 [P1]: Should create success result with undefined selector', () => {
    // Given: Parameters with undefined selector
    const testData = { title: 'Test' };
    const params = {
      selector: undefined,
      data: testData,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating success result without selector
    const result = createSuccessResult(TEST_URL, params);

    // Then: Should create result with undefined selector
    assertBasicSuccessResult(result, {
      expectedUrl: TEST_URL,
      expectedData: testData,
      expectedSelector: undefined,
      expectedExtractionTime: TEST_EXTRACTION_TIME,
      expectedRetryCount: TEST_RETRY_COUNT,
    });
  });

  test('TC-RF-101-04 [P1]: Should create success result with zero extraction time and retry count', () => {
    // Given: Parameters with zero values
    const params = {
      selector: TEST_SELECTOR,
      data: { test: 'data' },
      extractionTime: 0,
      retryCount: 0,
    };

    // When: Creating success result with zero values
    const result = createSuccessResult(TEST_URL, params);

    // Then: Should preserve zero values
    expect(result.metadata.extractionTime).toBe(0);
    expect(result.metadata.retryCount).toBe(0);
  });

  test('TC-RF-101-05 [P2]: Should handle empty object data', () => {
    // Given: Empty object data
    const params = {
      selector: TEST_SELECTOR,
      data: {},
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating success result with empty data
    const result = createSuccessResult(TEST_URL, params);

    // Then: Should handle empty object gracefully
    expect(result.data).toEqual({});
    assertObjectDataResult(result);
  });

  test('TC-RF-101-06 [P2]: Should handle empty array data', () => {
    // Given: Empty array data
    const params = {
      selector: TEST_SELECTOR,
      data: [],
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating success result with empty array
    const result = createSuccessResult(TEST_URL, params);

    // Then: Should handle empty array gracefully
    expect(result.data).toEqual([]);
    assertArrayDataResult(result);
    expect((result.data as unknown[]).length).toBe(0);
  });
});
