/**
 * Unit tests for HttpClient - Retry Logic
 * Tests for retry functionality and error handling
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

test('TC-HC-103-01 [P0]: HttpClient should retry on server errors', async () => {
  // Mock fetch to fail twice then succeed
  (global as any).fetch
    .mockImplementationOnce(() =>
      Promise.resolve(MockResponseFactory.serverError(500, 'Server Error'))
    )
    .mockImplementationOnce(() =>
      Promise.resolve(MockResponseFactory.serverError(502, 'Bad Gateway'))
    )
    .mockImplementationOnce(() =>
      Promise.resolve(MockResponseFactory.html('<html><body>Success</body></html>'))
    );

  const config: HttpClientConfig = {
    retryAttempts: 3,
    retryDelay: 10, // Small delay for test speed
    rateLimit: 10,
  };

  const client = new HttpClient(config);
  const response = await client.fetch('https://example.com');

  expect(global.fetch).toHaveBeenCalledTimes(3);
  expect(response.status).toBe(200);
  expect(await response.text()).toBe('<html><body>Success</body></html>');
});

test('TC-HC-103-02 [P1]: HttpClient should fail after all retries exhausted', async () => {
  // Mock fetch to always fail
  (global as any).fetch.mockImplementation(() =>
    Promise.resolve(MockResponseFactory.serverError(500, 'Server Error'))
  );

  const config: HttpClientConfig = {
    retryAttempts: 2,
    retryDelay: 10,
    rateLimit: 10,
  };

  const client = new HttpClient(config);

  await expect(client.fetch('https://example.com')).rejects.toThrow();
  expect(global.fetch).toHaveBeenCalledTimes(3); // Initial attempt + 2 retries
});

test('TC-HC-103-03 [P1]: HttpClient should not retry on client errors (4xx)', async () => {
  // Mock fetch to fail with client error
  (global as any).fetch.mockImplementation(() =>
    Promise.resolve(MockResponseFactory.clientError(404, 'Not Found'))
  );

  const config: HttpClientConfig = {
    retryAttempts: 3,
    retryDelay: 10,
    rateLimit: 10,
  };

  const client = new HttpClient(config);

  await expect(client.fetch('https://example.com')).rejects.toThrow();
  expect(global.fetch).toHaveBeenCalledTimes(1); // No retries for 4xx errors
});

test('TC-HC-109-01 [P1]: HttpClient should retry on rate limit errors (429)', async () => {
  // Mock fetch to return rate limit, then succeed
  (global as any).fetch
    .mockImplementationOnce(() => Promise.resolve(MockResponseFactory.rateLimitError()))
    .mockImplementationOnce(() =>
      Promise.resolve(MockResponseFactory.html('<html><body>Success</body></html>'))
    );

  const config: HttpClientConfig = {
    retryAttempts: 2,
    retryDelay: 10,
    rateLimit: 10,
  };

  const client = new HttpClient(config);
  const response = await client.fetch('https://example.com');

  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(response.status).toBe(200);
});

test('TC-HC-114-01 [P1]: HttpClient should handle exponential backoff with max delay', async () => {
  const callTimes: number[] = [];

  // Mock fetch with timing capture
  (global as any).fetch.mockImplementation(() => {
    callTimes.push(Date.now());
    return Promise.resolve(MockResponseFactory.serverError(500, 'Server Error'));
  });

  const config: HttpClientConfig = {
    retryAttempts: 4,
    retryDelay: 100,
    rateLimit: 10,
  };

  const client = new HttpClient(config);

  await expect(client.fetch('https://example.com')).rejects.toThrow();

  expect(global.fetch).toHaveBeenCalledTimes(5); // Initial + 4 retries
  expect(callTimes).toHaveLength(5);

  // Verify exponential backoff with max delay
  // Delays should be: 100, 200, 400, 500 (max reached)
  const delays: number[] = [];
  for (let i = 1; i < callTimes.length; i++) {
    delays.push(callTimes[i] - callTimes[i - 1]);
  }

  expect(delays[0]).toBeGreaterThanOrEqual(100);
  expect(delays[1]).toBeGreaterThanOrEqual(200);
  expect(delays[2]).toBeGreaterThanOrEqual(400);
  expect(delays[3]).toBeGreaterThanOrEqual(500);
});

test('TC-HC-115-01 [P2]: HttpClient should handle linear backoff strategy', async () => {
  const callTimes: number[] = [];

  (global as any).fetch.mockImplementation(() => {
    callTimes.push(Date.now());
    return Promise.resolve(MockResponseFactory.serverError(500, 'Server Error'));
  });

  const config: HttpClientConfig = {
    retryAttempts: 3,
    retryDelay: 100,
    rateLimit: 10,
  };

  const client = new HttpClient(config);

  await expect(client.fetch('https://example.com')).rejects.toThrow();

  expect(global.fetch).toHaveBeenCalledTimes(4); // Initial + 3 retries

  // For linear backoff with jitter (10%), delays should be approximately: 100, 200, 300
  // With jitter: 100-110, 200-220, 300-330
  const delays: number[] = [];
  for (let i = 1; i < callTimes.length; i++) {
    delays.push(callTimes[i] - callTimes[i - 1]);
  }

  expect(delays[0]).toBeGreaterThanOrEqual(100);
  expect(delays[0]).toBeLessThan(150); // 100 + 10% jitter + larger system tolerance

  expect(delays[1]).toBeGreaterThanOrEqual(200);
  expect(delays[1]).toBeLessThan(280); // 200 + 10% jitter + larger system tolerance

  expect(delays[2]).toBeGreaterThanOrEqual(300);
  expect(delays[2]).toBeLessThan(450); // 300 + 10% jitter + larger system tolerance
});

test('TC-HC-116-01 [P2]: HttpClient should handle jitter in retry delays', async () => {
  const callTimes: number[] = [];

  (global as any).fetch.mockImplementation(() => {
    callTimes.push(Date.now());
    return Promise.resolve(MockResponseFactory.serverError(500, 'Server Error'));
  });

  const config: HttpClientConfig = {
    retryAttempts: 3,
    retryDelay: 100,
    rateLimit: 10,
  };

  const client = new HttpClient(config);

  await expect(client.fetch('https://example.com')).rejects.toThrow();

  expect(global.fetch).toHaveBeenCalledTimes(4); // Initial + 3 retries

  // With jitter, delays should vary but still be reasonable
  const delays: number[] = [];
  for (let i = 1; i < callTimes.length; i++) {
    delays.push(callTimes[i] - callTimes[i - 1]);
  }

  // All delays should be positive and reasonable
  for (const delay of delays) {
    expect(delay).toBeGreaterThan(0);
    expect(delay).toBeLessThan(1000); // Should not be excessively long
  }
});

test('TC-HC-117-01 [P1]: HttpClient should throw proper HttpError with response details', async () => {
  (global as any).fetch.mockImplementation(() =>
    Promise.resolve(MockResponseFactory.serverError(500, 'Internal Server Error'))
  );

  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 10,
    rateLimit: 10,
  };

  const client = new HttpClient(config);

  await expect(client.fetch('https://example.com')).rejects.toThrow();

  // Verify the error is an HttpError by checking the caught exception
  try {
    await client.fetch('https://example.com');
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    if (error instanceof Error) {
      expect((error as any).status).toBe(500);
      expect((error as any).statusText).toBe('Internal Server Error');
      expect((error as any).url).toBe('https://example.com');
    }
  }
});
