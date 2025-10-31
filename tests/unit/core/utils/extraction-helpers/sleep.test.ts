/**
 * Unit tests for Extraction Helpers - sleep Function
 * Tests for sleep utility functionality
 */

import { test, expect, describe } from 'bun:test';
import { sleep } from '../../../../../src/core/utils/extraction-helpers';

describe('sleep', () => {
  test('should resolve after specified delay', async () => {
    // Given: A sleep duration
    const delayMs = 50;
    const startTime = Date.now();

    // When: Sleeping for the specified duration
    await sleep(delayMs);
    const endTime = Date.now();

    // Then: Should have waited at least the specified duration
    const elapsed = endTime - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(delayMs - 5); // Allow small variance
    expect(elapsed).toBeLessThan(delayMs + 50); // Should not be much longer
  });

  test('should handle zero delay', async () => {
    // Given: Zero delay
    const startTime = Date.now();

    // When: Sleeping for 0ms
    await sleep(0);
    const endTime = Date.now();

    // Then: Should resolve quickly
    const elapsed = endTime - startTime;
    expect(elapsed).toBeLessThan(50); // Should be very fast
  });

  test('should handle small delays', async () => {
    // Given: Small delay
    const delayMs = 10;

    // When: Sleeping
    const startTime = Date.now();
    await sleep(delayMs);
    const endTime = Date.now();

    // Then: Should wait approximately the right time
    const elapsed = endTime - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(delayMs - 5);
    expect(elapsed).toBeLessThan(delayMs + 50);
  });

  test('should return Promise<void>', async () => {
    // Given: Sleep function
    const delayMs = 10;

    // When: Calling sleep
    const _result = sleep(delayMs);

    // Then: Should return a Promise
    expect(_result).toBeInstanceOf(Promise);

    // And: Promise should resolve to undefined
    const resolved = await _result;
    expect(resolved).toBeUndefined();
  });
});
