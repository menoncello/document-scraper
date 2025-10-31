/**
 * Unit tests for HttpClient - Timeout Handling
 * Tests for timeout functionality and abort signal handling
 * Enhanced with deterministic timing patterns and automatic cleanup
 */

import { test, expect, mock, beforeEach, afterEach } from 'bun:test';
import { HttpClient } from '../../../../src/core/index';
import type { HttpClientConfig } from '../../../../src/types';
import { MockResponseFactory } from '../../../factories/mock-response.factory';

// Simple test utilities for timeout tests
const TimeoutTestUtils = {
  // Setup enhanced HTTP client test with deterministic timing
  setupEnhancedHttpClientTest: () => {
    let requestCount = 0;
    let abortedRequests = 0;

    const mockFetch = mock((url: string, options?: RequestInit) => {
      requestCount++;

      // Track abort signal usage
      if (options?.signal) {
        if (options.signal.aborted) {
          abortedRequests++;
          const error = new Error('Request aborted');
          error.name = 'AbortError';
          return Promise.reject(error);
        }

        options.signal.addEventListener('abort', () => {
          abortedRequests++;
        });
      }

      // Default success response
      return Promise.resolve(
        MockResponseFactory.html('<html><body>Default response</body></html>')
      );
    });

    // Add tracking properties
    (mockFetch as any).getRequestCount = () => requestCount;
    (mockFetch as any).getAbortedRequests = () => abortedRequests;
    (mockFetch as any).resetCounters = () => {
      requestCount = 0;
      abortedRequests = 0;
    };

    // Set global fetch
    (global as any).fetch = Object.assign(mockFetch, {
      preconnect: mock(() => Promise.resolve()),
    });

    return {
      fetchMock: mockFetch,
      getRequestCount: () => (mockFetch as any).getRequestCount(),
      getAbortedRequests: () => (mockFetch as any).getAbortedRequests(),
      resetMocks: () => {
        mockFetch.mockClear();
        (mockFetch as any).resetCounters();
      },
    };
  },

  // Create a timeout mock with tracking
  createTimeoutMock: () => {
    let requestCount = 0;
    let abortedRequests = 0;

    const mockFetch = mock((_url: string, options: RequestInit = {}) => {
      requestCount++;

      // Track abort signal usage
      if (options?.signal) {
        if (options.signal.aborted) {
          abortedRequests++;
        } else {
          options.signal.addEventListener('abort', () => {
            abortedRequests++;
          });
        }
      }

      // Return a promise that never resolves to test timeout
      return new Promise((_resolve, _reject) => {
        // Handle abort signal
        if (options?.signal) {
          if (options.signal.aborted) {
            const error = new Error('Request aborted');
            error.name = 'AbortError';
            _reject(error);
            return;
          }

          options.signal.addEventListener('abort', () => {
            const error = new Error('Request aborted');
            error.name = 'AbortError';
            _reject(error);
          });
        }
        // Intentionally don't resolve to test timeout
      });
    });

    // Add tracking properties
    (mockFetch as any).getRequestCount = () => requestCount;
    (mockFetch as any).getAbortedRequests = () => abortedRequests;

    // Set global fetch
    (global as any).fetch = Object.assign(mockFetch, {
      preconnect: mock(() => Promise.resolve()),
    });

    return {
      fetchMock: mockFetch,
      getRequestCount: () => (mockFetch as any).getRequestCount(),
      getAbortedRequests: () => (mockFetch as any).getAbortedRequests(),
    };
  },

  // Mock fetch to simulate delayed response
  mockDelayedResponse: (fetchMock: any, delayMs: number, response: any): void => {
    fetchMock.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve(response), delayMs);
      });
    });
  },

  // Assert timing without hard waits
  assertReasonableTiming: (
    startTime: number,
    endTime: number,
    minExpectedMs: number,
    maxExpectedMs: number
  ): void => {
    const elapsed = endTime - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(minExpectedMs);
    expect(elapsed).toBeLessThan(maxExpectedMs);
  },
};

// Setup and cleanup for all tests
beforeEach(() => {
  // Ensure global fetch is reset before each test
  delete (global as any).fetch;
});

afterEach(() => {
  // Clean up global fetch after each test
  delete (global as any).fetch;
});

test('TC-HC-104-01 [P1]: HttpClient should handle timeout', async () => {
  // Setup timeout mock with tracking
  const httpClientTest = TimeoutTestUtils.createTimeoutMock();

  const config: HttpClientConfig = {
    retryAttempts: 0, // No retries for timeout test
    retryDelay: 10,
    rateLimit: 1000, // High rate limit for timeout tests
    timeout: 100, // Short timeout for test
  };

  const client = new HttpClient(config);

  const startTime = Date.now();
  await expect(client.fetch('https://example.com')).rejects.toThrow('Request timeout');
  const endTime = Date.now();

  // Verify timing without hard wait - using deterministic timing assertion
  TimeoutTestUtils.assertReasonableTiming(startTime, endTime, 80, 200);

  // Verify request count and abort tracking
  expect(httpClientTest.getRequestCount()).toBe(1);
  expect(httpClientTest.getAbortedRequests()).toBe(1);

  // Verify the fetch was called with an AbortSignal
  expect(httpClientTest.fetchMock).toHaveBeenCalledWith(
    'https://example.com',
    expect.objectContaining({
      signal: expect.any(AbortSignal),
    })
  );
});

test('TC-HC-104-02 [P1]: HttpClient should use different timeout values', async () => {
  // Setup enhanced HTTP client test with deterministic timing
  const httpClientTest = TimeoutTestUtils.setupEnhancedHttpClientTest();

  // Mock fetch to resolve after a delay using deterministic timing
  TimeoutTestUtils.mockDelayedResponse(
    httpClientTest.fetchMock,
    50,
    MockResponseFactory.html('<html><body>Success</body></html>')
  );

  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 10,
    rateLimit: 1000, // High rate limit for timeout tests
    timeout: 1000, // Longer timeout
  };

  const client = new HttpClient(config);

  const startTime = Date.now();
  const response = await client.fetch('https://example.com');
  const endTime = Date.now();

  expect(response.status).toBe(200);
  expect(await response.text()).toBe('<html><body>Success</body></html>');

  // Verify timing is reasonable without hard wait
  TimeoutTestUtils.assertReasonableTiming(startTime, endTime, 40, 200);
});

test('TC-HC-104-03 [P2]: HttpClient should handle timeout during retry attempts', async () => {
  let callCount = 0;

  // Setup enhanced HTTP client test with deterministic timing
  const httpClientTest = TimeoutTestUtils.setupEnhancedHttpClientTest();

  // Mock fetch to timeout initially, then succeed
  httpClientTest.fetchMock.mockImplementation((_url: string, options: RequestInit = {}) => {
    callCount++;
    if (callCount <= 2) {
      return new Promise((_resolve, _reject) => {
        // Handle abort signal for timeout tests
        if (options.signal) {
          if (options.signal.aborted) {
            const error = new Error('Request aborted');
            error.name = 'AbortError';
            _reject(error);
            return;
          }

          options.signal.addEventListener('abort', () => {
            const error = new Error('Request aborted');
            error.name = 'AbortError';
            _reject(error);
          });
        }
        // Intentionally don't resolve to test timeout
      }); // Will timeout
    }
    return Promise.resolve(MockResponseFactory.html('<html><body>Success</body></html>'));
  });

  const config: HttpClientConfig = {
    retryAttempts: 3,
    retryDelay: 10,
    rateLimit: 1000, // High rate limit for timeout tests
    timeout: 50, // Short timeout
  };

  const client = new HttpClient(config);

  const response = await client.fetch('https://example.com');

  expect(response.status).toBe(200);
  expect(await response.text()).toBe('<html><body>Success</body></html>');
  expect(httpClientTest.fetchMock).toHaveBeenCalledTimes(3);
});

test('TC-HC-104-04 [P2]: HttpClient should preserve abort signal when provided', async () => {
  // Setup enhanced HTTP client test with deterministic timing
  const httpClientTest = TimeoutTestUtils.setupEnhancedHttpClientTest();

  // Mock fetch to resolve immediately
  httpClientTest.fetchMock.mockImplementation(() =>
    Promise.resolve(MockResponseFactory.html('<html><body>Success</body></html>'))
  );

  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 10,
    rateLimit: 1000, // High rate limit for timeout tests
    timeout: 1000,
  };

  const client = new HttpClient(config);
  const abortController = new AbortController();

  const response = await client.fetch('https://example.com', {
    signal: abortController.signal,
  });

  expect(response.status).toBe(200);

  // Verify the custom signal was preserved
  expect(httpClientTest.fetchMock).toHaveBeenCalledWith(
    'https://example.com',
    expect.objectContaining({
      signal: abortController.signal,
    })
  );
});

test('TC-HC-104-05 [P2]: HttpClient should handle externally aborted requests', async () => {
  // Setup enhanced HTTP client test with deterministic timing
  const httpClientTest = TimeoutTestUtils.setupEnhancedHttpClientTest();

  // Mock fetch to handle already-aborted signal
  httpClientTest.fetchMock.mockImplementation(
    (_url: string, options: RequestInit = {}) =>
      new Promise((_resolve, _reject) => {
        // Handle abort signal
        if (options.signal) {
          if (options.signal.aborted) {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            _reject(error);
            return;
          }

          options.signal.addEventListener('abort', () => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            _reject(error);
          });
        }
      })
  );

  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 10,
    rateLimit: 1000, // High rate limit for timeout tests
    timeout: 5000, // Long timeout
  };

  const client = new HttpClient(config);
  const abortController = new AbortController();

  // Abort the request immediately
  abortController.abort();

  await expect(
    client.fetch('https://example.com', {
      signal: abortController.signal,
    })
  ).rejects.toThrow('The operation was aborted');
});
