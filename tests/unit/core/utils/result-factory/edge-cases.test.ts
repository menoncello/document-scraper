/**
 * Unit tests for Result Factory - Edge Cases and Complex Data Structures
 * Tests for comprehensive edge case handling and complex scenarios
 */

import { test, expect, beforeEach, afterEach, describe } from 'bun:test';
import {
  createSuccessResult,
  createFailureResult,
} from '../../../../../src/core/utils/result-factory';

// Test data fixtures
const _TEST_URL = 'https://example.com';
const TEST_SELECTOR = '.content';
const TEST_EXTRACTION_TIME = 150;
const TEST_RETRY_COUNT = 2;

// Test function for edge cases
const testFunc = () => 'test';

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

describe('Result Factory - Complex Data Structures', () => {
  test('TC-RF-105-01 [P2]: Should handle deeply nested object data', () => {
    // Given: Deeply nested data structure
    const deepData = {
      level1: {
        level2: {
          level3: {
            level4: {
              data: 'deep value',
              array: [1, 2, { nested: 'object' }],
            },
          },
        },
      },
    };
    const params = {
      selector: TEST_SELECTOR,
      data: deepData,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating success result with deep data
    const result = createSuccessResult(_TEST_URL, params);

    // Then: Should preserve deep structure
    expect(result.data).toEqual(deepData);
    expect((result.data as any).level1.level2.level3.level4.data).toBe('deep value');
  });

  test('TC-RF-105-02 [P2]: Should handle array with mixed data types', () => {
    // Given: Array with various data types
    const mixedData = [
      'string',
      42,
      true,
      null,
      undefined,
      { object: 'value' },
      [1, 2, 3],
      new Date('2025-01-01'),
    ];
    const params = {
      selector: TEST_SELECTOR,
      data: mixedData,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating success result with mixed data
    const result = createSuccessResult(_TEST_URL, params);

    // Then: Should preserve all data types
    expect(result.data).toEqual(mixedData);
    expect(Array.isArray(result.data)).toBe(true);
    expect((result.data as any[]).length).toBe(8);
  });

  test('TC-RF-105-03 [P2]: Should handle circular references in data gracefully', () => {
    // Given: Data with circular reference
    const circularData: any = { name: 'parent' };
    circularData.self = circularData;
    const params = {
      selector: TEST_SELECTOR,
      data: circularData,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating success result with circular data
    const result = createSuccessResult(_TEST_URL, params);

    // Then: Should handle circular reference (JSON would stringify but we test structure)
    expect(result.data).toBeDefined();
    expect((result.data as any).name).toBe('parent');
    expect((result.data as any).self).toBe(circularData);
  });

  test('TC-RF-105-04 [P2]: Should handle very large data structures', () => {
    // Given: Large data structure
    const largeArray = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `item-${i}`,
      description: `This is item number ${i} with some additional text to make it larger`,
      tags: [`tag-${i}`, `category-${i % 10}`, `type-${i % 5}`],
    }));
    const params = {
      selector: TEST_SELECTOR,
      data: largeArray,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating success result with large data
    const result = createSuccessResult(_TEST_URL, params);

    // Then: Should handle large data without issues
    expect(Array.isArray(result.data)).toBe(true);
    expect((result.data as any[]).length).toBe(10000);
    expect((result.data as any[])[0].id).toBe(0);
    expect((result.data as any[])[9999].id).toBe(9999);
  });

  test('TC-RF-105-05 [P2]: Should handle special number values', () => {
    // Given: Data with special number values
    const specialNumbers = {
      infinity: Infinity,
      negInfinity: -Infinity,
      nan: Number.NaN,
      maxSafe: Number.MAX_SAFE_INTEGER,
      minSafe: Number.MIN_SAFE_INTEGER,
      epsilon: Number.EPSILON,
    };
    const params = {
      selector: TEST_SELECTOR,
      data: specialNumbers,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating success result with special numbers
    const result = createSuccessResult(_TEST_URL, params);

    // Then: Should preserve special number values
    expect((result.data as any).infinity).toBe(Infinity);
    expect((result.data as any).negInfinity).toBe(-Infinity);
    expect(Number.isNaN((result.data as any).nan)).toBe(true);
    expect((result.data as any).maxSafe).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe('Result Factory - Null and Undefined Edge Cases', () => {
  test('TC-RF-106-01 [P2]: Should handle null values in data', () => {
    // Given: Data with null values
    const dataWithNulls = {
      nullValue: null,
      nested: {
        alsoNull: null,
        arrayWithNulls: [1, null, 3, null],
      },
    };
    const params = {
      selector: TEST_SELECTOR,
      data: dataWithNulls,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating success result with nulls
    const result = createSuccessResult(_TEST_URL, params);

    // Then: Should preserve null values
    expect((result.data as any).nullValue).toBe(null);
    expect((result.data as any).nested.alsoNull).toBe(null);
    expect((result.data as any).nested.arrayWithNulls[1]).toBe(null);
  });

  test('TC-RF-106-02 [P2]: Should handle undefined values in data', () => {
    // Given: Data with undefined values
    const dataWithUndef = {
      undefValue: undefined,
      nested: {
        alsoUndef: undefined,
        arrayWithUndef: [1, undefined, 3],
      },
    };
    const params = {
      selector: TEST_SELECTOR,
      data: dataWithUndef,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating success result with undefined values
    const result = createSuccessResult(_TEST_URL, params);

    // Then: Should preserve undefined values
    expect((result.data as any).undefValue).toBe(undefined);
    expect((result.data as any).nested.alsoUndef).toBe(undefined);
    expect((result.data as any).nested.arrayWithUndef[1]).toBe(undefined);
  });

  test('TC-RF-106-03 [P2]: Should handle empty strings and whitespace', () => {
    // Given: Data with various string edge cases
    const stringEdgeCases = {
      empty: '',
      spaces: '   ',
      tabs: '\t\t',
      newlines: '\n\n',
      mixed: ' \t\n \r ',
      unicode: '🚀 🌟 💫',
      emojis: '😀😁😂🤣😃😄',
    };
    const params = {
      selector: TEST_SELECTOR,
      data: stringEdgeCases,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating success result with string edge cases
    const result = createSuccessResult(_TEST_URL, params);

    // Then: Should preserve all string variations
    expect((result.data as any).empty).toBe('');
    expect((result.data as any).spaces).toBe('   ');
    expect((result.data as any).unicode).toBe('🚀 🌟 💫');
  });
});

describe('Result Factory - Extreme Values Edge Cases', () => {
  test('TC-RF-107-01 [P2]: Should handle extreme extraction times', () => {
    // Given: Extreme extraction time values
    const extremeTimes = [
      Number.MAX_SAFE_INTEGER,
      Number.MIN_SAFE_INTEGER,
      0,
      -1, // Invalid but should be handled
      999999999999,
    ];

    // When: Creating results with extreme times
    for (const extractionTime of extremeTimes) {
      const successResult = createSuccessResult(_TEST_URL, {
        selector: TEST_SELECTOR,
        data: { test: 'data' },
        extractionTime,
        retryCount: TEST_RETRY_COUNT,
      });

      const failureResult = createFailureResult(_TEST_URL, {
        selector: TEST_SELECTOR,
        isMultiple: false,
        extractionTime,
        retryCount: TEST_RETRY_COUNT,
      });

      // Then: Should preserve extreme values
      expect(successResult.metadata.extractionTime).toBe(extractionTime);
      expect(failureResult.metadata.extractionTime).toBe(extractionTime);
    }
  });

  test('TC-RF-107-02 [P2]: Should handle extreme retry counts', () => {
    // Given: Extreme retry count values
    const extremeRetries = [
      Number.MAX_SAFE_INTEGER,
      Number.MIN_SAFE_INTEGER,
      0,
      -1, // Invalid but should be handled
      999999,
    ];

    // When: Creating results with extreme retry counts
    for (const retryCount of extremeRetries) {
      const successResult = createSuccessResult(_TEST_URL, {
        selector: TEST_SELECTOR,
        data: { test: 'data' },
        extractionTime: TEST_EXTRACTION_TIME,
        retryCount,
      });

      const failureResult = createFailureResult(_TEST_URL, {
        selector: TEST_SELECTOR,
        isMultiple: true,
        extractionTime: TEST_EXTRACTION_TIME,
        retryCount,
      });

      // Then: Should preserve extreme values
      expect(successResult.metadata.retryCount).toBe(retryCount);
      expect(failureResult.metadata.retryCount).toBe(retryCount);
    }
  });

  test('TC-RF-107-03 [P2]: Should handle function values in data (edge case)', () => {
    // Given: Data with function values (edge case)
    const dataWithFunc = {
      normalValue: 'test',
      funcValue: testFunc,
    };

    const params = {
      selector: TEST_SELECTOR,
      data: dataWithFunc,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating success result with function data
    const result = createSuccessResult(_TEST_URL, params);

    // Then: Should handle function values (functions are serializable in objects)
    expect((result.data as any).normalValue).toBe('test');
    expect(typeof (result.data as any).funcValue).toBe('function');
    expect((result.data as any).funcValue).toBe(testFunc);
  });
});
