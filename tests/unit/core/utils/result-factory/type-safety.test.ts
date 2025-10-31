/**
 * Unit tests for Result Factory - Type Safety and Validation
 * Tests for type safety, interface compliance, and validation scenarios
 */

import { test, expect, beforeEach, afterEach, describe } from 'bun:test';
import {
  createSuccessResult,
  createFailureResult,
  createEmptyFailureResult,
} from '../../../../../src/core/utils/result-factory';

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

describe('Result Factory - Type Safety and Interface Compliance', () => {
  test('TC-RF-110-01 [P2]: Should create ScrapingResult that implements required interface', () => {
    // Given: Standard parameters
    const params = {
      selector: TEST_SELECTOR,
      data: { test: 'data' },
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating success result
    const _result = createSuccessResult(TEST_URL, params);

    // Then: Should implement ScrapingResult interface correctly
    expect(_result).toHaveProperty('url');
    expect(_result).toHaveProperty('data');
    expect(_result).toHaveProperty('success');
    expect(_result).toHaveProperty('metadata');
    expect(typeof _result.url).toBe('string');
    expect(typeof _result.success).toBe('boolean');
    expect(typeof _result.metadata).toBe('object');
    expect(_result.metadata).toHaveProperty('extractedAt');
    expect(_result.metadata).toHaveProperty('extractionTime');
    expect(_result.metadata).toHaveProperty('retryCount');
  });

  test('TC-RF-110-02 [P2]: Should maintain type safety for success results', () => {
    // Given: Various data types that conform to the interface
    const testCases = [
      { data: { value: 'string' }, expectedType: 'object' },
      { data: { value: 42 }, expectedType: 'object' },
      { data: { value: true }, expectedType: 'object' },
      { data: { value: null }, expectedType: 'object' }, // typeof null === 'object'
      { data: [], expectedType: 'object' }, // Array is object
      { data: {}, expectedType: 'object' },
      { data: { date: new Date() }, expectedType: 'object' },
      { data: ['string', 42, true], expectedType: 'object' }, // Array with mixed types
    ];

    // When: Creating results with different data types
    for (const { data, expectedType } of testCases) {
      const params = {
        selector: TEST_SELECTOR,
        data,
        extractionTime: TEST_EXTRACTION_TIME,
        retryCount: TEST_RETRY_COUNT,
      };

      const result = createSuccessResult(TEST_URL, params);

      // Then: Should preserve data types correctly
      expect(typeof result.data).toBe(
        expectedType as
          | 'string'
          | 'number'
          | 'bigint'
          | 'boolean'
          | 'symbol'
          | 'undefined'
          | 'object'
          | 'function'
      );
      expect(result.data).toEqual(data);
    }
  });

  test('TC-RF-110-03 [P2]: Should ensure failure results have correct error structure', () => {
    // Given: Failure parameters
    const params = {
      selector: TEST_SELECTOR,
      isMultiple: false,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating failure result
    const _result = createFailureResult(TEST_URL, params);

    // Then: Should have correct error structure
    expect(_result.success).toBe(false);
    expect(_result).toHaveProperty('error');
    expect(typeof _result.error).toBe('string');
    expect(_result.error).toBe('Extraction failed');
    expect(typeof _result.data).toBe('object');
    expect(Array.isArray(_result.data)).toBe(false);
    expect(Object.keys(_result.data as any)).toHaveLength(0);
  });

  test('TC-RF-110-04 [P2]: Should ensure empty failure results have correct structure', () => {
    // When: Creating empty failure result
    const _result = createEmptyFailureResult(TEST_URL);

    // Then: Should have correct empty failure structure
    expect(_result.success).toBe(false);
    expect(_result).toHaveProperty('error');
    expect(typeof _result.error).toBe('string');
    expect(_result.error).toBe('Empty result');
    expect(Array.isArray(_result.data)).toBe(true);
    expect((_result.data as any[]).length).toBe(0);
    expect(_result.metadata).not.toHaveProperty('selector');
  });

  test('TC-RF-110-05 [P2]: Should handle type coercion edge cases', () => {
    // Given: Values that might cause type coercion issues
    const edgeCases = [
      { selector: '123', description: 'string that looks like number' },
      { selector: '', description: 'empty string' },
      { selector: '0', description: 'string zero' },
      { selector: 'false', description: 'string false' },
      { selector: 'null', description: 'string null' },
      { selector: 'undefined', description: 'string undefined' },
    ];

    // When: Creating results with edge case selectors
    for (const { selector, description } of edgeCases) {
      const successResult = createSuccessResult(TEST_URL, {
        selector,
        data: { test: description },
        extractionTime: TEST_EXTRACTION_TIME,
        retryCount: TEST_RETRY_COUNT,
      });

      const failureResult = createFailureResult(TEST_URL, {
        selector,
        isMultiple: true,
        extractionTime: TEST_EXTRACTION_TIME,
        retryCount: TEST_RETRY_COUNT,
      });

      // Then: Should preserve selector as string without coercion
      expect(typeof successResult.metadata.selector).toBe('string');
      expect(typeof failureResult.metadata.selector).toBe('string');
      expect(successResult.metadata.selector).toBe(selector);
      expect(failureResult.metadata.selector).toBe(selector);
    }
  });
});

describe('Result Factory - Parameter Validation', () => {
  test('TC-RF-111-01 [P2]: Should handle malformed URL strings gracefully', () => {
    // Given: Various malformed URLs - testing security edge cases in controlled environment
    const malformedUrls = [
      '',
      'not-a-url',
      '://missing-protocol',
      'http://',
      'https://',
      'ftp://',
      'file://',
      'javascript-disabled-alert', // Using safe string variant instead of executable protocol
      'data-text-html-safe-variant', // Using safe string variant instead of executable protocol
    ];

    // When: Creating results with malformed URLs
    for (const url of malformedUrls) {
      const successResult = createSuccessResult(url, {
        selector: TEST_SELECTOR,
        data: { url },
        extractionTime: TEST_EXTRACTION_TIME,
        retryCount: TEST_RETRY_COUNT,
      });

      const failureResult = createFailureResult(url, {
        selector: TEST_SELECTOR,
        isMultiple: false,
        extractionTime: TEST_EXTRACTION_TIME,
        retryCount: TEST_RETRY_COUNT,
      });

      const emptyFailureResult = createEmptyFailureResult(url);

      // Then: Should handle malformed URLs without throwing
      expect(successResult.url).toBe(url);
      expect(failureResult.url).toBe(url);
      expect(emptyFailureResult.url).toBe(url);
      expect(successResult.success).toBe(true);
      expect(failureResult.success).toBe(false);
      expect(emptyFailureResult.success).toBe(false);
    }
  });

  test('TC-RF-111-02 [P2]: Should handle non-standard selector values', () => {
    // Given: Non-standard selector values
    const nonStandardSelectors = [
      123,
      true,
      false,
      null,
      undefined,
      {},
      [],
      new Date(),
      /regex/,
      function () {
        // Empty function for testing type safety with function values
      },
    ];

    // When: Creating results with non-standard selectors
    for (const selector of nonStandardSelectors) {
      // Extract nested ternary into independent statements for better readability
      let processedSelector: string | undefined;
      if (selector === null) {
        processedSelector = undefined;
      } else if (selector === undefined) {
        processedSelector = undefined;
      } else {
        processedSelector = String(selector);
      }

      const params = {
        selector: processedSelector,
        data: { selectorType: typeof selector },
        extractionTime: TEST_EXTRACTION_TIME,
        retryCount: TEST_RETRY_COUNT,
      };

      // Should not throw with proper selector types
      expect(() => {
        const _result = createSuccessResult(TEST_URL, params);
        // The factory function preserves the selector value as string or undefined
        const expectedValue =
          selector === null || selector === undefined ? undefined : String(selector);
        expect(_result.metadata.selector).toBe(expectedValue);
      }).not.toThrow();
    }
  });

  test('TC-RF-111-03 [P2]: Should handle extreme numeric values', () => {
    // Given: Extreme numeric values for extraction time and retry count
    const extremeValues = [
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.MAX_VALUE,
      Number.MIN_VALUE,
      Number.NaN,
      Number.MAX_SAFE_INTEGER,
      Number.MIN_SAFE_INTEGER,
    ];

    // When: Creating results with extreme values
    for (const value of extremeValues) {
      const successResult = createSuccessResult(TEST_URL, {
        selector: TEST_SELECTOR,
        data: { value },
        extractionTime: value as number,
        retryCount: TEST_RETRY_COUNT,
      });

      const failureResult = createFailureResult(TEST_URL, {
        selector: TEST_SELECTOR,
        isMultiple: false,
        extractionTime: TEST_EXTRACTION_TIME,
        retryCount: value as number,
      });

      // Then: Should handle extreme values
      expect(successResult.metadata.extractionTime).toBe(value);
      expect(failureResult.metadata.retryCount).toBe(value);
    }
  });

  test('TC-RF-111-04 [P2]: Should validate boolean isMultiple parameter behavior', () => {
    // Given: Various values for isMultiple parameter
    const isMultipleValues = [
      { value: true, shouldBeArray: true },
      { value: false, shouldBeArray: false },
      { value: 'true', shouldBeArray: true }, // Truthy string
      { value: 'false', shouldBeArray: true }, // Non-empty string is truthy
      { value: 1, shouldBeArray: true }, // Truthy number
      { value: 0, shouldBeArray: false }, // Falsy number
      { value: {}, shouldBeArray: true }, // Truthy object
      { value: [], shouldBeArray: true }, // Truthy array (arrays are truthy)
      { value: null, shouldBeArray: false }, // Falsy
      { value: undefined, shouldBeArray: false }, // Falsy
    ];

    // When: Creating failure results with different isMultiple values
    for (const test of isMultipleValues) {
      const _result = createFailureResult(TEST_URL, {
        selector: TEST_SELECTOR,
        isMultiple: test.value as boolean,
        extractionTime: TEST_EXTRACTION_TIME,
        retryCount: TEST_RETRY_COUNT,
      });

      // Then: Should handle isMultiple values correctly based on expected behavior
      if (test.shouldBeArray) {
        expect(Array.isArray(_result.data)).toBe(true);
        expect((_result.data as any[]).length).toBe(0);
      } else {
        expect(typeof _result.data).toBe('object');
        expect(Array.isArray(_result.data)).toBe(false);
        expect(Object.keys(_result.data as any)).toHaveLength(0);
      }
    }
  });
});

describe('Result Factory - Interface Contract Compliance', () => {
  test('TC-RF-112-01 [P2]: Should maintain consistent interface across all factory functions', () => {
    // Given: Results from all factory functions
    const successResult = createSuccessResult(TEST_URL, {
      selector: TEST_SELECTOR,
      data: { type: 'success' },
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    });

    const failureResult = createFailureResult(TEST_URL, {
      selector: TEST_SELECTOR,
      isMultiple: true,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    });

    const emptyFailureResult = createEmptyFailureResult(TEST_URL);

    // When: Checking interface compliance
    const results = [successResult, failureResult, emptyFailureResult];

    // Then: All should comply with ScrapingResult interface
    for (const _result of results) {
      // Required properties
      expect(_result).toHaveProperty('url');
      expect(_result).toHaveProperty('data');
      expect(_result).toHaveProperty('success');
      expect(_result).toHaveProperty('metadata');

      // Property types
      expect(typeof _result.url).toBe('string');
      expect(typeof _result.success).toBe('boolean');
      expect(typeof _result.metadata).toBe('object');

      // Metadata properties
      expect(_result.metadata).toHaveProperty('extractedAt');
      expect(_result.metadata).toHaveProperty('extractionTime');
      expect(_result.metadata).toHaveProperty('retryCount');

      // Metadata property types
      expect(_result.metadata.extractedAt).toBeInstanceOf(Date);
      expect(typeof _result.metadata.extractionTime).toBe('number');
      expect(typeof _result.metadata.retryCount).toBe('number');
    }
  });

  test('TC-RF-112-02 [P2]: Should ensure error property exists only on failure results', () => {
    // Given: Success and failure results
    const successResult = createSuccessResult(TEST_URL, {
      selector: TEST_SELECTOR,
      data: { test: 'data' },
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    });

    const failureResult = createFailureResult(TEST_URL, {
      selector: TEST_SELECTOR,
      isMultiple: false,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    });

    const emptyFailureResult = createEmptyFailureResult(TEST_URL);

    // When: Checking error property
    // Then: Error should only exist on failure results
    expect(successResult).not.toHaveProperty('error');
    expect(failureResult).toHaveProperty('error');
    expect(emptyFailureResult).toHaveProperty('error');

    expect(typeof failureResult.error).toBe('string');
    expect(typeof emptyFailureResult.error).toBe('string');
  });

  test('TC-RF-112-03 [P2]: Should ensure selector property behavior consistency', () => {
    // Given: Results with and without selectors
    const withSelector = createSuccessResult(TEST_URL, {
      selector: TEST_SELECTOR,
      data: { test: 'data' },
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    });

    const withoutSelector = createSuccessResult(TEST_URL, {
      selector: undefined,
      data: { test: 'data' },
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    });

    const emptyFailure = createEmptyFailureResult(TEST_URL);

    // When: Checking selector property behavior
    // Then: Selector behavior should be consistent
    expect(withSelector.metadata).toHaveProperty('selector');
    expect(withSelector.metadata.selector).toBe(TEST_SELECTOR);

    expect(withoutSelector.metadata).toHaveProperty('selector');
    expect(withoutSelector.metadata.selector).toBeUndefined();

    expect(emptyFailure.metadata).not.toHaveProperty('selector');
  });

  test('TC-RF-112-04 [P2]: Should maintain data type consistency based on operation type', () => {
    // Given: Different operation types
    const successWithObject = createSuccessResult(TEST_URL, {
      selector: TEST_SELECTOR,
      data: { type: 'object' },
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    });

    const successWithArray = createSuccessResult(TEST_URL, {
      selector: TEST_SELECTOR,
      data: [{ type: 'array' }],
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    });

    const failureSingle = createFailureResult(TEST_URL, {
      selector: TEST_SELECTOR,
      isMultiple: false,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    });

    const failureMultiple = createFailureResult(TEST_URL, {
      selector: TEST_SELECTOR,
      isMultiple: true,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    });

    // When: Checking data type consistency
    // Then: Data types should be consistent with operation
    expect(typeof successWithObject.data).toBe('object');
    expect(Array.isArray(successWithObject.data)).toBe(false);

    expect(typeof successWithArray.data).toBe('object');
    expect(Array.isArray(successWithArray.data)).toBe(true);

    expect(typeof failureSingle.data).toBe('object');
    expect(Array.isArray(failureSingle.data)).toBe(false);
    expect(Object.keys(failureSingle.data as any)).toHaveLength(0);

    expect(typeof failureMultiple.data).toBe('object');
    expect(Array.isArray(failureMultiple.data)).toBe(true);
    expect((failureMultiple.data as any[]).length).toBe(0);
  });
});
