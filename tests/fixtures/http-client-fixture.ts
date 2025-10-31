/**
 * HTTP Client specific test fixture
 * Provides HTTP client testing capabilities with automatic cleanup
 */

import { expect, mock } from 'bun:test';
import { HttpClient } from '../../src/core/http-client';
import type { HttpClientConfig } from '../../src/types';
import { MockResponseFactory } from '../factories/mock-response.factory';
import { test as baseTest, TestUtils } from './test-base-fixture';

// Types for HTTP client resources
interface HttpClientResources {
  httpClient: HttpClient;
  fetchMock: ReturnType<typeof mock>;
  requestCount: number;
  abortedRequests: number;
}

// Export base test from bun:test
// Note: Bun Test doesn't support extend() like Vitest
export const test = baseTest;

// Helper function to create HTTP client test resources
export function createHttpClientResources(): HttpClientResources {
  return {
    httpClient: undefined as any,
    fetchMock: mock(() => Promise.resolve({})),
    requestCount: 0,
    abortedRequests: 0,
  };
}

// HTTP Client test utilities
export const HttpClientTestUtils = {
  // Setup enhanced HTTP client test (exported for use in test files)
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
      return Promise.resolve(MockResponseFactory.html('<html><body>Default response</body></html>'));
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
  // Create client with custom configuration
  createClient: (
    resources: HttpClientResources,
    configOverrides: Partial<HttpClientConfig> = {}
  ): HttpClient => {
    const config = {
      retryAttempts: 3,
      retryDelay: 100,
      rateLimit: 1000,
      timeout: 5000,
      userAgent: 'test-agent/1.0.0',
      ...configOverrides,
    };

    return new HttpClient(config);
  },

  // Mock fetch to simulate timeout
  mockTimeout: (fetchMock: any): void => {
    fetchMock.mockImplementation((_url: string, options?: RequestInit) => {
      return new Promise((_resolve, _reject) => {
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
  },

  // Mock fetch to simulate delayed response
  mockDelayedResponse: (fetchMock: any, delayMs: number, response: any): void => {
    fetchMock.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve(response), delayMs);
      });
    });
  },

  // Mock fetch to simulate network error
  mockNetworkError: (fetchMock: any): void => {
    fetchMock.mockImplementation(() => {
      return Promise.reject(new Error('Network error'));
    });
  },

  // Mock fetch to simulate retry scenarios
  mockRetryScenario: (
    fetchMock: any,
    failuresBeforeSuccess: number,
    successResponse: any
  ): void => {
    let callCount = 0;
    fetchMock.mockImplementation(() => {
      callCount++;
      if (callCount <= failuresBeforeSuccess) {
        return Promise.reject(new Error(`Temporary failure ${callCount}`));
      }
      return Promise.resolve(successResponse);
    });
  },

  // Assert request was made with specific parameters
  assertRequestMade: async (
    fetchMock: any,
    expectedUrl: string,
    expectedOptions?: Partial<RequestInit>
  ): Promise<void> => {
    expect(fetchMock).toHaveBeenCalledWith(
      expectedUrl,
      expectedOptions ? expect.objectContaining(expectedOptions) : expect.any(Object)
    );
  },

  // Assert timing without hard waits
  assertReasonableTiming: (
    startTime: number,
    endTime: number,
    minExpectedMs: number,
    maxExpectedMs: number
  ): void => {
    TestUtils.assertTimingReasonable(startTime, endTime, minExpectedMs, maxExpectedMs);
  },

  // Wait for next request with timeout
  waitForNextRequest: async (fetchMock: any, timeoutMs = 1000): Promise<void> => {
    await TestUtils.waitForCondition(
      () => (fetchMock as any).getRequestCount() > 0,
      timeoutMs,
      50
    );
  },
};

// Re-export expect for convenience
export { expect };

/**
 * Usage example:
 *
 * import { test, expect, HttpClientTestUtils } from '../fixtures/http-client-fixture';
 *
 * test('should handle timeout', async ({ httpClient, fetchMock, requestCount }) => {
 *   // Setup timeout scenario
 *   HttpClientTestUtils.mockTimeout(fetchMock);
 *
 *   const startTime = Date.now();
 *   await expect(httpClient.fetch('https://example.com')).rejects.toThrow('Request timeout');
 *   const endTime = Date.now();
 *
 *   // Verify timing without hard wait
 *   HttpClientTestUtils.assertReasonableTiming(startTime, endTime, 100, 1000);
 *   expect(requestCount()).toBe(1);
 * });
 */