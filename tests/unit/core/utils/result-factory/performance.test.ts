/**
 * Unit tests for Result Factory - Performance Tests
 * Tests for performance with large datasets and stress scenarios
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

describe('Result Factory - Performance Tests', () => {
  test('TC-RF-108-01 [P2]: Should handle large array data efficiently', () => {
    // Given: Large array data (100,000 items)
    const largeArray = Array.from({ length: 100000 }, (_, i) => ({
      id: i,
      title: `Item ${i}`,
      description: `This is description for item ${i}`,
      metadata: {
        created: new Date(`2025-01-${(i % 28) + 1}`),
        tags: [`tag-${i % 100}`, `category-${i % 10}`],
      },
    }));

    const startTime = performance.now();
    const params = {
      selector: TEST_SELECTOR,
      data: largeArray,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating success result with large data
    const result = createSuccessResult(TEST_URL, params);
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Then: Should handle large data efficiently
    expect(Array.isArray(result.data)).toBe(true);
    expect((result.data as any[]).length).toBe(100000);
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
  });

  test('TC-RF-108-02 [P2]: Should handle large object data efficiently', () => {
    // Given: Large object with many properties
    const largeObject: Record<string, any> = {};
    for (let i = 0; i < 10000; i++) {
      largeObject[`property_${i}`] = {
        value: `value_${i}`,
        nested: {
          deep: `deep_value_${i}`,
          array: [i, i + 1, i + 2],
        },
      };
    }

    const startTime = performance.now();
    const params = {
      selector: TEST_SELECTOR,
      data: largeObject,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating success result with large object
    const result = createSuccessResult(TEST_URL, params);
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Then: Should handle large object efficiently
    expect(typeof result.data).toBe('object');
    expect(Object.keys(result.data as any).length).toBe(10000);
    expect(duration).toBeLessThan(500); // Should complete within 0.5 seconds
  });

  test('TC-RF-108-03 [P2]: Should handle rapid successive result creation', () => {
    // Given: Need to create many results rapidly
    const iterations = 10000;
    const startTime = performance.now();
    const results: ScrapingResult[] = [];

    // When: Creating many results in succession
    for (let i = 0; i < iterations; i++) {
      const isEven = i % 2 === 0;
      if (isEven) {
        results.push(
          createSuccessResult(`${TEST_URL}/${i}`, {
            selector: `${TEST_SELECTOR}-${i}`,
            data: { id: i, type: 'success' },
            extractionTime: TEST_EXTRACTION_TIME,
            retryCount: TEST_RETRY_COUNT,
          })
        );
      } else {
        results.push(
          createFailureResult(`${TEST_URL}/${i}`, {
            selector: `${TEST_SELECTOR}-${i}`,
            isMultiple: i % 4 === 0,
            extractionTime: TEST_EXTRACTION_TIME,
            retryCount: TEST_RETRY_COUNT,
          })
        );
      }
    }
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Then: Should handle rapid creation efficiently
    expect(results.length).toBe(iterations);
    expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    expect(results.filter(r => r.success).length).toBe(iterations / 2);
    expect(results.filter(r => !r.success).length).toBe(iterations / 2);
  });

  test('TC-RF-108-04 [P2]: Should handle memory-intensive data structures', () => {
    // Given: Memory-intensive data with many nested structures
    const memoryIntensiveData = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      largeString: 'x'.repeat(1000), // 1KB string
      nestedArray: Array.from({ length: 100 }, (_, j) => ({
        index: j,
        data: `item_${i}_${j}`,
        metadata: {
          timestamp: Date.now(),
          hash: `hash_${i}_${j}`,
          binary: Buffer.alloc(100, i + j).toString('binary'),
        },
      })),
    }));

    const startTime = performance.now();
    const params = {
      selector: TEST_SELECTOR,
      data: memoryIntensiveData,
      extractionTime: TEST_EXTRACTION_TIME,
      retryCount: TEST_RETRY_COUNT,
    };

    // When: Creating result with memory-intensive data
    const result = createSuccessResult(TEST_URL, params);
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Then: Should handle memory-intensive data
    expect(Array.isArray(result.data)).toBe(true);
    expect((result.data as any[]).length).toBe(1000);
    expect((result.data as any[])[0].nestedArray.length).toBe(100);
    expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
  });

  test('TC-RF-108-05 [P2]: Should maintain performance with complex selectors', () => {
    // Given: Complex selector strings
    const complexSelectors = [
      '.content .main .article .section .subsection .element',
      '#main > div.container > ul.items > li.item:nth-child(odd)',
      '[data-attribute="value"][data-other="another"]',
      '.class1.class2.class3.class4.class5',
      'body header nav ul li a[href*="example"]',
      'div:not(.exclude):has(.child)',
      'input[type="text"][required][placeholder*="name"]',
    ];

    const startTime = performance.now();
    const results: ScrapingResult[] = [];

    // When: Creating results with complex selectors
    for (const [index, selector] of complexSelectors.entries()) {
      results.push(
        createSuccessResult(`${TEST_URL}/${index}`, {
          selector,
          data: { selector, index },
          extractionTime: TEST_EXTRACTION_TIME,
          retryCount: TEST_RETRY_COUNT,
        })
      );
    }
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Then: Should handle complex selectors efficiently
    expect(results.length).toBe(complexSelectors.length);
    expect(duration).toBeLessThan(100); // Should be very fast for selector handling
    for (const [index, result] of results.entries()) {
      expect(result.metadata.selector).toBe(complexSelectors[index]);
    }
  });

  test('TC-RF-108-06 [P2]: Should handle concurrent result creation (stress test)', () => {
    // Given: Need to simulate concurrent result creation
    const concurrentOperations = 1000;
    const promises: Array<Promise<ScrapingResult>> = [];

    // Use deterministic sequence for test consistency
    const delays = Array.from({ length: concurrentOperations }, (_, i) => (i % 10) + 1);

    const startTime = performance.now();

    // When: Creating many "concurrent" results
    for (let i = 0; i < concurrentOperations; i++) {
      promises.push(
        new Promise(resolve => {
          // Simulate async operation with deterministic delay
          setTimeout(() => {
            const result = createEmptyFailureResult(`${TEST_URL}/${i}`);
            resolve(result);
          }, delays[i]);
        })
      );
    }

    // Then: Should handle concurrent operations
    return Promise.all(promises).then(results => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results.length).toBe(concurrentOperations);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      for (const [index, result] of results.entries()) {
        expect(result.url).toBe(`${TEST_URL}/${index}`);
        expect(result.success).toBe(false);
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
});

describe('Result Factory - Memory and Resource Management', () => {
  test('TC-RF-109-01 [P2]: Should not leak memory with repeated creation', () => {
    // Given: Memory baseline measurement
    const initialMemory = process.memoryUsage().heapUsed;
    const iterations = 5000;

    // When: Creating and discarding many results
    for (let i = 0; i < iterations; i++) {
      createSuccessResult(`${TEST_URL}/${i}`, {
        selector: `.${i}`,
        data: { id: i, data: 'x'.repeat(100) },
        extractionTime: TEST_EXTRACTION_TIME,
        retryCount: TEST_RETRY_COUNT,
      });
      // Result goes out of scope and should be garbage collected
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Then: Memory increase should be reasonable
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
  });

  test('TC-RF-109-02 [P2]: Should handle URL string length performance', () => {
    // Given: URLs of varying lengths
    const urlLengths = [100, 1000, 10000, 100000];
    const results: Array<{ url: string; duration: number }> = [];

    // When: Testing different URL lengths
    for (const length of urlLengths) {
      const longUrl = `${TEST_URL}/${'path'.repeat(length / 4)}`;
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        createEmptyFailureResult(`${longUrl}/${i}`);
      }

      const endTime = performance.now();
      results.push({
        url: `length_${length}`,
        duration: endTime - startTime,
      });
    }

    // Then: Performance should scale reasonably
    for (const [index, result] of results.entries()) {
      if (index > 0) {
        const previousDuration = results[index - 1].duration;
        const growthFactor = result.duration / previousDuration;
        expect(growthFactor).toBeLessThan(10); // Should not grow more than 10x
      }
    }
  });

  test('TC-RF-109-03 [P2]: Should maintain metadata creation performance', () => {
    // Given: Need to test metadata creation performance
    const iterations = 10000;
    const results: ScrapingResult[] = [];

    const startTime = performance.now();

    // When: Creating many results to test metadata performance
    for (let i = 0; i < iterations; i++) {
      const result = createSuccessResult(TEST_URL, {
        selector: `.selector-${i}`,
        data: { iteration: i },
        extractionTime: i % 1000,
        retryCount: i % 10,
      });
      results.push(result);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const avgDuration = duration / iterations;

    // Then: Metadata creation should be efficient
    expect(results.length).toBe(iterations);
    expect(avgDuration).toBeLessThan(0.1); // Average less than 0.1ms per result
    expect(duration).toBeLessThan(2000); // Total less than 2 seconds

    // Verify metadata integrity
    for (const [index, result] of results.entries()) {
      expect(result.metadata.selector).toBe(`.selector-${index}`);
      expect(result.metadata.extractionTime).toBe(index % 1000);
      expect(result.metadata.retryCount).toBe(index % 10);
      expect(result.metadata.extractedAt).toBeInstanceOf(Date);
    }
  });
});
