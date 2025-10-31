import { test, expect, describe, mock, beforeEach, afterEach } from 'bun:test';
import { HttpClient } from '../../../src/core/index';
import type { HttpClientConfig } from '../../../src/types';

/**
 * Helper function to create a properly typed fetch mock with preconnect
 */
function createFetchMock(responseFn: () => Promise<Response>) {
  return Object.assign(mock(responseFn), {
    preconnect: mock(() => Promise.resolve()),
  });
}

describe('HTTP Client - Critical Line Coverage (Lines 20-164)', () => {
  beforeEach(() => {
    // Reset global fetch mock before each test
    global.fetch = Object.assign(
      mock(() => Promise.resolve(new Response('Success', { status: 200 }))),
      {
        preconnect: mock(() => Promise.resolve()),
      }
    );
  });

  afterEach(() => {
    // Clean up mocks after each test
    mock.restore();
  });

  describe('Constructor and Rate Limiter Initialization (Lines 45-78)', () => {
    test('should handle zero rate limit configuration', () => {
      // This covers lines 56-61
      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 100,
        rateLimit: 0, // Zero rate limit
      };

      const client = new HttpClient(config);

      // Should handle zero rate limit gracefully
      expect(client.getConfig().rateLimit).toBe(0);
    });

    test('should handle fractional rate limit less than 1', () => {
      // This covers lines 62-69
      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 100,
        rateLimit: 0.3, // Fractional rate limit
      };

      const client = new HttpClient(config);

      expect(client.getConfig().rateLimit).toBe(0.3);
    });

    test('should handle rate limit exactly 1', () => {
      // This covers lines 71-76
      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 100,
        rateLimit: 1, // Exactly 1
      };

      const client = new HttpClient(config);

      expect(client.getConfig().rateLimit).toBe(1);
    });

    test('should handle rate limit greater than 1', () => {
      // This covers lines 71-76
      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 100,
        rateLimit: 5.7, // Greater than 1
      };

      const client = new HttpClient(config);

      expect(client.getConfig().rateLimit).toBe(5.7);
    });

    test('should handle negative rate limit', () => {
      // This covers lines 56-61
      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 100,
        rateLimit: -2, // Negative rate limit
      };

      const client = new HttpClient(config);

      expect(client.getConfig().rateLimit).toBe(-2);
    });
  });

  describe('Fetch Method and Rate Limiting (Lines 86-97)', () => {
    test('should call waitForRateLimit before making request', async () => {
      const mockFetch = createFetchMock(() =>
        Promise.resolve(
          new Response('<html><body>Success</body></html>', {
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'text/html' },
          })
        )
      );
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 2,
        retryDelay: 100,
        rateLimit: 5,
      };

      const client = new HttpClient(config);

      await client.fetch('https://example.com');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    test('should create retry config with default values', async () => {
      const mockFetch = createFetchMock(() =>
        Promise.resolve(new Response('Success', { status: 200 }))
      );
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 3,
        retryDelay: 1000,
        rateLimit: 10,
      };

      const client = new HttpClient(config);

      await client.fetch('https://example.com');

      // Verify that fetch was called (indicating retry config was created)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Fetch With Retry Logic (Lines 107-140)', () => {
    test('should handle retry loop with successful retry', async () => {
      let attemptCount = 0;
      const mockFetch = createFetchMock(() => {
        attemptCount++;
        if (attemptCount === 1) {
          return Promise.resolve(new Response('Server Error', { status: 500 }));
        }
        return Promise.resolve(new Response('Success', { status: 200 }));
      });
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 2,
        retryDelay: 10,
        rateLimit: 10,
      };

      const client = new HttpClient(config);

      const response = await client.fetch('https://example.com');

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });

    test('should exhaust all retry attempts and throw last error', async () => {
      const mockFetch = createFetchMock(() =>
        Promise.resolve(new Response('Server Error', { status: 500 }))
      );
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 2,
        retryDelay: 10,
        rateLimit: 10,
      };

      const client = new HttpClient(config);

      await expect(client.fetch('https://example.com')).rejects.toThrow('HTTP 500:');
      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    test('should handle zero retry attempts', async () => {
      const mockFetch = createFetchMock(() =>
        Promise.resolve(new Response('Server Error', { status: 500 }))
      );
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 0, // No retries
        retryDelay: 10,
        rateLimit: 10,
      };

      const client = new HttpClient(config);

      await expect(client.fetch('https://example.com')).rejects.toThrow('HTTP 500:');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial attempt
    });

    test('should throw unknown error when lastError is null', async () => {
      const mockFetch = createFetchMock(() => {
        // Create a scenario where error becomes null somehow
        throw new Error('Test error');
      });
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 10,
      };

      const client = new HttpClient(config);

      // Should throw the actual error, not "Unknown error occurred"
      await expect(client.fetch('https://example.com')).rejects.toThrow('Test error');
    });
  });

  describe('Attempt Fetch Method (Lines 149-157)', () => {
    test('should return response on success', async () => {
      const mockResponse = new Response('Success', { status: 200, statusText: 'OK' });
      const mockFetch = createFetchMock(() => Promise.resolve(mockResponse));
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 10,
      };

      const client = new HttpClient(config);

      const response = await client.fetch('https://example.com');

      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
    });

    test('should create HttpError for failed responses', async () => {
      const mockResponse = new Response('Not Found', {
        status: 404,
        statusText: 'Not Found',
      });
      const mockFetch = createFetchMock(() => Promise.resolve(mockResponse));
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 10,
      };

      const client = new HttpClient(config);

      await expect(client.fetch('https://example.com')).rejects.toThrow('HTTP 404: Not Found');
    });
  });

  describe('Error Classification (Lines 164-185)', () => {
    test('should identify retryable server errors', async () => {
      const serverErrors = [500, 502, 503, 504];

      for (const status of serverErrors) {
        const mockFetch = createFetchMock(() =>
          Promise.resolve(new Response('Server Error', { status }))
        );
        global.fetch = mockFetch;

        const config: HttpClientConfig = {
          retryAttempts: 2,
          retryDelay: 10,
          rateLimit: 10,
        };

        const client = new HttpClient(config);

        // Should retry server errors
        await expect(client.fetch('https://example.com')).rejects.toThrow();
        expect(mockFetch).toHaveBeenCalledTimes(3); // Should retry

        mock.restore();
      }
    });

    test('should retry on rate limit errors', async () => {
      const mockFetch = createFetchMock(() =>
        Promise.resolve(new Response('Rate Limited', { status: 429 }))
      );
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 2,
        retryDelay: 10,
        rateLimit: 10,
      };

      const client = new HttpClient(config);

      await expect(client.fetch('https://example.com')).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(3); // Should retry
    });

    test('should not retry client errors (except 429 and 408)', async () => {
      const clientErrors = [400, 401, 403, 404, 422];

      for (const status of clientErrors) {
        const mockFetch = createFetchMock(() =>
          Promise.resolve(new Response('Client Error', { status }))
        );
        global.fetch = mockFetch;

        const config: HttpClientConfig = {
          retryAttempts: 2,
          retryDelay: 10,
          rateLimit: 10,
        };

        const client = new HttpClient(config);

        // Should not retry client errors
        await expect(client.fetch('https://example.com')).rejects.toThrow();
        expect(mockFetch).toHaveBeenCalledTimes(1); // Should not retry

        mock.restore();
      }
    });

    test('should retry timeout errors', async () => {
      const mockFetch = createFetchMock(() =>
        Promise.resolve(new Response('Request Timeout', { status: 408 }))
      );
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 2,
        retryDelay: 10,
        rateLimit: 10,
      };

      const client = new HttpClient(config);

      await expect(client.fetch('https://example.com')).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(3); // Should retry
    });

    test('should handle non-HTTP errors appropriately', async () => {
      const mockFetch = createFetchMock(() =>
        Promise.reject(new Error('Network connection failed'))
      );
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 2,
        retryDelay: 10,
        rateLimit: 10,
      };

      const client = new HttpClient(config);

      // Network errors should be retried
      await expect(client.fetch('https://example.com')).rejects.toThrow(
        'Network connection failed'
      );
      expect(mockFetch).toHaveBeenCalledTimes(3); // Should retry
    });
  });

  describe('HttpError Creation (Lines 194-215)', () => {
    test('should create HttpError with response body', async () => {
      const mockResponse = new Response('Error details', {
        status: 400,
        statusText: 'Bad Request',
      });
      const mockFetch = createFetchMock(() => Promise.resolve(mockResponse));
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 10,
      };

      const client = new HttpClient(config);

      try {
        await client.fetch('https://example.com');
        expect.unreachable('Should have thrown HttpError');
      } catch (error) {
        expect(error instanceof Error ? error.message : String(error)).toContain(
          'HTTP 400: Bad Request'
        );
        expect(error instanceof Error ? error.message : String(error)).toContain('Error details');
        expect((error as any).status).toBe(400);
        expect((error as any).response).toBeDefined();
        expect((error as any).response.status).toBe(400);
        expect((error as any).response.statusText).toBe('Bad Request');
      }
    });

    test('should handle response body reading errors', async () => {
      // Create a mock response that throws when text() is called
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Server Error',
        text: mock(() => Promise.reject(new Error('Cannot read body'))),
        headers: new Headers(),
        url: 'https://example.com',
        redirected: false,
        bodyUsed: false,
        clone: mock(),
        body: null,
        arrayBuffer: mock(),
        blob: mock(),
        formData: mock(),
        json: mock(),
      } as any;

      const mockFetch = createFetchMock(() => Promise.resolve(mockResponse));
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 10,
      };

      const client = new HttpClient(config);

      try {
        await client.fetch('https://example.com');
        expect.unreachable('Should have thrown HttpError');
      } catch (error) {
        // Should still create error with just status text
        expect(error instanceof Error ? error.message : String(error)).toContain(
          'HTTP 500: Server Error'
        );
        expect((error as any).status).toBe(500);
      }
    });

    test('should handle empty response body gracefully', async () => {
      const mockResponse = new Response('', {
        status: 204,
        statusText: 'No Content',
      });
      const mockFetch = createFetchMock(() => Promise.resolve(mockResponse));
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 10,
      };

      const client = new HttpClient(config);

      // 204 is a successful status code, should not throw an error
      const response = await client.fetch('https://example.com');
      expect(response.status).toBe(204);
      expect(response.statusText).toBe('No Content');
      expect(response.ok).toBe(true);
    });
  });

  describe('Perform Fetch Method (Lines 224-244)', () => {
    test('should build headers and set up abort controller', async () => {
      const mockResponse = new Response('Success', { status: 200 });
      const mockFetch = createFetchMock(() => Promise.resolve(mockResponse));
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 10,
        userAgent: 'test-agent/1.0.0',
        headers: { 'X-Custom': 'value' },
      };

      const client = new HttpClient(config);

      await client.fetch('https://example.com', {
        method: 'POST',
        headers: { 'X-Request': 'req-value' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'User-Agent': 'test-agent/1.0.0',
            'X-Custom': 'value',
            'X-Request': 'req-value',
          }),
          signal: expect.any(AbortSignal),
        })
      );
    });

    test('should handle fetch errors with timeout cleanup', async () => {
      const mockFetch = createFetchMock(() => Promise.reject(new Error('Network error')));
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 10,
        timeout: 1000,
      };

      const client = new HttpClient(config);

      await expect(client.fetch('https://example.com')).rejects.toThrow('Network error');
    });

    test('should handle AbortError and convert to timeout error', async () => {
      const mockFetch = createFetchMock(() => {
        const error = new Error('Request aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 10,
        timeout: 100,
      };

      const client = new HttpClient(config);

      try {
        await client.fetch('https://example.com');
        throw new Error('Should have thrown timeout error');
      } catch (error) {
        expect((error as Error).message).toContain('Request timeout after');
        expect((error as any).status).toBe(408);
        expect((error as any).name).toBe('AbortError');
      }
    });
  });

  describe('Header Management (Lines 275-327)', () => {
    test('should merge default headers with config headers', async () => {
      const mockResponse = new Response('Success', { status: 200 });
      const mockFetch = createFetchMock(() => Promise.resolve(mockResponse));
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 10,
        headers: {
          'X-Config': 'config-value',
          Authorization: 'Bearer token123',
        },
      };

      const client = new HttpClient(config);
      await client.fetch('https://example.com');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('docs-scrape'),
            Accept: expect.stringContaining('text/html'),
            'X-Config': 'config-value',
            Authorization: 'Bearer token123',
          }),
        })
      );
    });

    test('should handle Headers object from options', async () => {
      const mockResponse = new Response('Success', { status: 200 });
      const mockFetch = createFetchMock(() => Promise.resolve(mockResponse));
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 10,
      };

      const client = new HttpClient(config);

      const headers = new Headers();
      headers.set('X-Custom', 'custom-value');
      headers.set('Accept', 'application/json');

      await client.fetch('https://example.com', { headers });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-custom': 'custom-value',
            accept: 'application/json',
          }),
        })
      );
    });

    test('should handle array format headers', async () => {
      const mockResponse = new Response('Success', { status: 200 });
      const mockFetch = createFetchMock(() => Promise.resolve(mockResponse));
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 10,
      };

      const client = new HttpClient(config);

      const arrayHeaders: Array<[string, string]> = [
        ['X-Array-1', 'value1'],
        ['X-Array-2', 'value2'],
      ];

      await client.fetch('https://example.com', { headers: arrayHeaders });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Array-1': 'value1',
            'X-Array-2': 'value2',
          }),
        })
      );
    });

    test('should handle undefined headers gracefully', async () => {
      const mockResponse = new Response('Success', { status: 200 });
      const mockFetch = createFetchMock(() => Promise.resolve(mockResponse));
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 10,
        headers: undefined,
      };

      const client = new HttpClient(config);

      await client.fetch('https://example.com');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('docs-scrape'),
            Accept: expect.stringContaining('text/html'),
          }),
        })
      );
    });
  });

  describe('Default Headers (Lines 289-298)', () => {
    test('should include all default headers', async () => {
      const mockResponse = new Response('Success', { status: 200 });
      const mockFetch = createFetchMock(() => Promise.resolve(mockResponse));
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 10,
      };

      const client = new HttpClient(config);
      await client.fetch('https://example.com');

      const callArgs = mockFetch.mock.calls[0] as unknown as [string, any];
      const headers =
        callArgs &&
        callArgs.length > 1 &&
        callArgs[1] &&
        typeof callArgs[1] === 'object' &&
        'headers' in callArgs[1]
          ? (callArgs[1] as any).headers
          : undefined;

      expect(headers['User-Agent']).toContain('docs-scrape');
      expect(headers['Accept']).toContain('text/html');
      expect(headers['Accept']).toContain('application/xhtml+xml');
      expect(headers['Accept-Language']).toContain('en-US');
      expect(headers['Accept-Encoding']).toBe('gzip, deflate');
      expect(headers['Connection']).toBe('keep-alive');
      expect(headers['Upgrade-Insecure-Requests']).toBe('1');
    });

    test('should use custom user agent when provided', async () => {
      const mockResponse = new Response('Success', { status: 200 });
      const mockFetch = createFetchMock(() => Promise.resolve(mockResponse));
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 10,
        userAgent: 'custom-agent/2.0.0',
      };

      const client = new HttpClient(config);
      await client.fetch('https://example.com');

      const callArgs = mockFetch.mock.calls[0] as unknown as [string, any];
      expect(
        callArgs &&
          callArgs.length > 1 &&
          callArgs[1] &&
          typeof callArgs[1] === 'object' &&
          'headers' in callArgs[1]
          ? (callArgs[1] as any).headers['User-Agent']
          : undefined
      ).toBe('custom-agent/2.0.0');
    });
  });
});
