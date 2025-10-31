/**
 * Unit tests for HttpClient - Rate Limiting
 * Tests for rate limiting functionality and throttling
 */

import { test, expect, mock, beforeEach } from 'bun:test';
import { HttpClient } from '../../../../src/core/http-client';
import type { HttpClientConfig } from '../../../../src/types';
import { MockResponseFactory } from '../../../factories/mock-response.factory';

// Mock fetch globally
const mockFetch = mock(() =>
  Promise.resolve(MockResponseFactory.html('<html><body>Test content</body></html>'))
);

// Create global fetch with mock methods
(global as any).fetch = Object.assign(mockFetch, {
  preconnect: mock(() => Promise.resolve()),
});

beforeEach(() => {
  // Reset mock before each test
  (global as any).fetch.mockClear();
});

test('TC-HC-105-01 [P2]: HttpClient should apply rate limiting', async () => {
  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 10,
    rateLimit: 2, // 2 requests per second
  };

  const client = new HttpClient(config);

  const startTime = Date.now();

  // Make multiple requests
  const promises = [
    client.fetch('https://example.com/1'),
    client.fetch('https://example.com/2'),
    client.fetch('https://example.com/3'),
  ];

  await Promise.all(promises);

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Should take at least 1 second due to rate limiting
  expect(duration).toBeGreaterThan(900);
  expect(global.fetch).toHaveBeenCalledTimes(3);
});

test('TC-HC-111-01 [P1]: HttpClient should respect rate limiting thresholds', async () => {
  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 10,
    rateLimit: 1, // 1 request per second
  };

  const client = new HttpClient(config);

  const startTime = Date.now();

  // Make sequential requests
  await client.fetch('https://example.com/1');
  await client.fetch('https://example.com/2');

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Should take at least 1 second between requests
  expect(duration).toBeGreaterThan(900);
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

test('TC-HC-112-01 [P2]: HttpClient should test edge cases for rate limiting', async () => {
  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 10,
    rateLimit: 1000, // Very high rate limit
  };

  const client = new HttpClient(config);

  const startTime = Date.now();

  // Make multiple requests that should not be rate limited
  const promises = Array.from({ length: 5 }, (_, i) => client.fetch(`https://example.com/${i}`));

  await Promise.all(promises);

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Should complete quickly due to high rate limit
  expect(duration).toBeLessThan(100);
  expect(global.fetch).toHaveBeenCalledTimes(5);
});

test('TC-HC-113-01 [P2]: HttpClient should handle rate limit edge case with zero wait time', async () => {
  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 10,
    rateLimit: 0, // Should be treated as unlimited
  };

  const client = new HttpClient(config);

  const startTime = Date.now();

  // Make multiple requests
  const promises = Array.from({ length: 3 }, (_, i) => client.fetch(`https://example.com/${i}`));

  await Promise.all(promises);

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Should complete quickly with no rate limiting
  expect(duration).toBeLessThan(100);
  expect(global.fetch).toHaveBeenCalledTimes(3);
});

test('TC-HC-105-02 [P2]: HttpClient should handle rate limiting with different strategies', async () => {
  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 10,
    rateLimit: 2,
  };

  const client = new HttpClient(config);

  const startTime = Date.now();

  // Make requests with sliding window rate limiting
  const promises = [
    client.fetch('https://example.com/1'),
    client.fetch('https://example.com/2'),
    client.fetch('https://example.com/3'),
  ];

  await Promise.all(promises);

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Should take at least 1 second due to rate limiting
  expect(duration).toBeGreaterThan(900);
  expect(global.fetch).toHaveBeenCalledTimes(3);
});

test('TC-HC-105-03 [P2]: HttpClient should handle burst rate limiting', async () => {
  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 10,
    rateLimit: 5,
  };

  const client = new HttpClient(config);

  const startTime = Date.now();

  // Make a burst of requests
  const promises = Array.from({ length: 8 }, (_, i) => client.fetch(`https://example.com/${i}`));

  await Promise.all(promises);

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Should complete quickly due to burst allowance
  expect(duration).toBeLessThan(200);
  expect(global.fetch).toHaveBeenCalledTimes(8);
});
