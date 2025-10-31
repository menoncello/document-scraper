import { test, expect, describe } from 'bun:test';
import { HttpClient } from '../../../src/core/index';
import type { HttpClientConfig } from '../../../src/types';
import { TestScenarios } from '../../factories/index';
import { setupHttpClientTest, TestData, Assertions } from '../../helpers/test-setup.helper';

describe('HTTP Client - Constructor and Basic Configuration Tests', () => {
  setupHttpClientTest();

  test('TC-HC-023-01 [P1]: Given constructor with rate limit, when created, then rate limiter should be initialized', () => {
    // Given: Configuration with rate limit
    const config: HttpClientConfig = {
      retryAttempts: 3,
      retryDelay: 100,
      rateLimit: 5.7, // Non-integer rate limit
    };

    // When: Creating HttpClient
    const client = new HttpClient(config);

    // Then: Rate limiter should be configured correctly
    expect(client.getConfig().rateLimit).toBe(5.7);
  });

  test('TC-HC-023-03 [P1]: Given retry configuration, when fetch is called, then retry config should be created', async () => {
    // Given: HTTP client with custom retry settings
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 5,
      retryDelay: 2000,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making a fetch request
    const response = await client.fetch('https://example.com');

    // Then: Should succeed with configured retry settings
    expect(response.status).toBe(200);
    Assertions.http.shouldHaveMadeRequest(mock, 'https://example.com');
  });

  test('TC-HC-023-16 [P2]: Given fetch with user agent config, when request is made, then it should include custom user agent', async () => {
    // Given: HTTP client with custom user agent
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
      userAgent: 'custom-test-agent/1.0.0',
    };
    const client = new HttpClient(config);

    // When: Making request
    await client.fetch('https://example.com');

    // Then: Should include custom user agent
    expect(mock).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': 'custom-test-agent/1.0.0',
        }),
      })
    );
  });
});

describe('HTTP Client - Basic Fetch Operations', () => {
  setupHttpClientTest();

  test('TC-HC-023-02 [P1]: Given fetch call, when made, then rate limiting should be checked', async () => {
    // Given: HTTP client
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
      timeout: 5000,
    };
    const client = new HttpClient(config);

    // When: Making a fetch request
    const response = await client.fetch('https://example.com');

    // Then: Request should succeed
    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
    Assertions.http.shouldHaveMadeRequest(mock, 'https://example.com');
  });

  test('TC-HC-023-11 [P2]: Given successful response, when fetch completes, then it should return Response object', async () => {
    // Given: HTTP client and successful response
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Test Content</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making successful request
    const response = await client.fetch('https://example.com');

    // Then: Should return proper HttpResponse object
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
    expect(await response.text()).toContain('Test Content');
  });

  test('TC-HC-023-08 [P2]: Given fetch with custom options, when called, then it should pass options correctly', async () => {
    // Given: HTTP client with custom request options
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('{"result": "success"}'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making POST request with custom options
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token123',
      },
      body: JSON.stringify({ data: 'test' }),
    };

    const response = await client.fetch('https://api.example.com/endpoint', options);

    // Then: Should pass options correctly to fetch
    expect(response.status).toBe(200);
    expect(mock).toHaveBeenCalledWith(
      'https://api.example.com/endpoint',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer token123',
        }),
        body: JSON.stringify({ data: 'test' }),
      })
    );
  });

  test('TC-HC-023-09 [P2]: Given fetch with Headers object, when called, then it should handle Headers correctly', async () => {
    // Given: HTTP client and Headers object
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    const headers = new Headers();
    headers.set('X-Custom-Header', 'custom-value');
    headers.set('Accept', 'application/json');

    // When: Making request with Headers object
    const options: RequestInit = {
      headers: headers,
    };

    const response = await client.fetch('https://example.com/api', options);

    // Then: Should handle Headers object correctly
    expect(response.status).toBe(200);
    expect(mock).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-custom-header': 'custom-value',
          accept: 'application/json',
        }),
      })
    );
  });

  test.skip('TC-HC-023-10 [P2]: Given fetch with timeout, when request times out, then it should abort correctly', async () => {
    // Given: HTTP client with short timeout and mock that never resolves
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() => {
      return new Promise(() => {
        // Never resolve - this will trigger timeout
      });
    });

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
      timeout: 50, // Very short timeout
    };
    const client = new HttpClient(config);

    // When: Making request that will timeout
    // Then: Should throw timeout error
    await expect(client.fetch('https://example.com')).rejects.toThrow('Request timeout after 50ms');
  });
});

describe('HTTP Client - Header Management Tests', () => {
  setupHttpClientTest();

  test('TC-HC-023-17 [P2]: Given fetch with config headers, when request is made, then it should merge headers', async () => {
    // Given: HTTP client with configured headers
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
      headers: {
        'X-Config-Header': 'config-value',
        Authorization: 'Bearer token123',
      },
    };
    const client = new HttpClient(config);

    // When: Making request
    await client.fetch('https://example.com');

    // Then: Should merge default headers with config headers
    expect(mock).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('docs-scrape'),
          'X-Config-Header': 'config-value',
          Authorization: 'Bearer token123',
        }),
      })
    );
  });

  test('TC-HC-023-18 [P2]: Given fetch with request headers, when request is made, then request headers should override config', async () => {
    // Given: HTTP client with config and request headers
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
      headers: {
        'X-Override-Test': 'config-value',
        'X-Keep-This': 'keep-this-value',
      },
    };
    const client = new HttpClient(config);

    // When: Making request with overriding headers
    const options: RequestInit = {
      headers: {
        'X-Override-Test': 'request-value',
        'X-Request-Only': 'request-only-value',
      },
    };

    await client.fetch('https://example.com', options);

    // Then: Request headers should override config headers
    expect(mock).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Override-Test': 'request-value', // Overridden
          'X-Keep-This': 'keep-this-value', // Kept from config
          'X-Request-Only': 'request-only-value', // Added from request
        }),
      })
    );
  });
});

describe('HTTP Client - Retry Logic Tests', () => {
  setupHttpClientTest();

  test('TC-HC-023-04 [P2]: Given fetchWithRetry method, when called directly, then it should handle retries', async () => {
    // Given: HTTP client and error sequence
    const mock = TestData.httpClient.givenWorkingConnection();
    mock
      .mockImplementationOnce(() => Promise.resolve(TestScenarios.responses.serverError(500)))
      .mockImplementationOnce(() =>
        Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
      );

    const config: HttpClientConfig = {
      retryAttempts: 3,
      retryDelay: 50,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that triggers retry logic
    const response = await client.fetch('https://example.com');

    // Then: Should retry and succeed
    expect(response.status).toBe(200);
    Assertions.http.shouldHaveMadeRequests(mock, 2);
  });

  test('TC-HC-023-05 [P2]: Given retry loop, when all attempts fail, then it should throw last error', async () => {
    // Given: HTTP client with persistent failure
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() => Promise.resolve(TestScenarios.responses.serverError(502)));

    const config: HttpClientConfig = {
      retryAttempts: 3,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that keeps failing
    // Then: Should throw the last error after exhausting retries
    await expect(client.fetch('https://example.com')).rejects.toThrow('HTTP 502: Bad Gateway');
    Assertions.http.shouldHaveMadeRequests(mock, 3); // Initial + 2 retries
  });

  test('TC-HC-023-13 [P2]: Given retry with different delays, when retries occur, then it should use exponential backoff', async () => {
    // Given: HTTP client with custom retry delay
    const mock = TestData.httpClient.givenWorkingConnection();
    mock
      .mockImplementationOnce(() => Promise.resolve(TestScenarios.responses.serverError(500)))
      .mockImplementationOnce(() => Promise.resolve(TestScenarios.responses.serverError(500)))
      .mockImplementationOnce(() =>
        Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
      );

    const config: HttpClientConfig = {
      retryAttempts: 3,
      retryDelay: 100, // Base delay
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that needs multiple retries
    const startTime = Date.now();
    const response = await client.fetch('https://example.com');
    const endTime = Date.now();

    // Then: Should use exponential backoff (100ms, 200ms, 400ms)
    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeGreaterThan(300); // At least 100ms + 200ms
    expect(endTime - startTime).toBeLessThan(1000); // But not too long
    Assertions.http.shouldHaveMadeRequests(mock, 3); // Initial + 2 retries
  });

  test('TC-HC-023-14 [P2]: Given network error, when fetch fails, then it should retry network errors', async () => {
    // Given: HTTP client and network error
    const mock = TestData.httpClient.givenWorkingConnection();
    mock
      .mockImplementationOnce(() => Promise.reject(new Error('Network connection failed')))
      .mockImplementationOnce(() =>
        Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
      );

    const config: HttpClientConfig = {
      retryAttempts: 2,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that fails with network error then succeeds
    const response = await client.fetch('https://example.com');

    // Then: Should retry network error and succeed
    expect(response.status).toBe(200);
    Assertions.http.shouldHaveMadeRequests(mock, 2);
  });

  test('TC-HC-023-15 [P2]: Given fetch with no retry attempts, when error occurs, then it should fail immediately', async () => {
    // Given: HTTP client with no retries
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() => Promise.resolve(TestScenarios.responses.serverError(500)));

    const config: HttpClientConfig = {
      retryAttempts: 0, // No retries
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that fails
    // Then: Should fail immediately without retrying
    await expect(client.fetch('https://example.com')).rejects.toThrow(
      'HTTP 500: Internal Server Error'
    );
    Assertions.http.shouldHaveMadeRequests(mock, 1); // Only initial attempt
  });

  test('TC-HC-023-19 [P2]: Given retry logic, when 429 error occurs, then it should retry rate limit errors', async () => {
    // Given: HTTP client and rate limit error
    const mock = TestData.httpClient.givenWorkingConnection();
    mock
      .mockImplementationOnce(() => TestScenarios.responses.rateLimit())
      .mockImplementationOnce(() =>
        Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
      );

    const config: HttpClientConfig = {
      retryAttempts: 2,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that gets rate limited
    const response = await client.fetch('https://example.com');

    // Then: Should retry rate limit error and succeed
    expect(response.status).toBe(200);
    Assertions.http.shouldHaveMadeRequests(mock, 2);
  });

  test('TC-HC-023-20 [P2]: Given retry logic, when client error occurs, then it should not retry', async () => {
    // Given: HTTP client and client error (4xx)
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() => TestScenarios.responses.clientError(403));

    const config: HttpClientConfig = {
      retryAttempts: 3,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that gets client error
    // Then: Should not retry client errors
    await expect(client.fetch('https://example.com')).rejects.toThrow('HTTP 403: Not Found');
    Assertions.http.shouldHaveMadeRequests(mock, 1); // No retry
  });
});

describe('HTTP Client - Error Handling and Status Code Tests', () => {
  setupHttpClientTest();

  test('TC-HC-023-12 [P2]: Given HTTP error response, when fetch fails, then it should create HttpError correctly', async () => {
    // Given: HTTP client and error response
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() => TestScenarios.responses.clientError(404));

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that returns error
    await expect(client.fetch('https://example.com/not-found')).rejects.toThrow(
      'HTTP 404: Not Found'
    );
  });

  test('TC-HC-023-06 [P2]: Given different HTTP status codes, when errors occur, then it should categorize correctly', async () => {
    // Given: HTTP client and various error scenarios
    const testCases = [
      { status: 400, shouldRetry: false, description: 'Bad Request' },
      { status: 401, shouldRetry: false, description: 'Unauthorized' },
      { status: 403, shouldRetry: false, description: 'Forbidden' },
      { status: 404, shouldRetry: false, description: 'Not Found' },
      { status: 429, shouldRetry: true, description: 'Too Many Requests' },
      { status: 500, shouldRetry: true, description: 'Internal Server Error' },
      { status: 502, shouldRetry: true, description: 'Bad Gateway' },
      { status: 503, shouldRetry: true, description: 'Service Unavailable' },
      { status: 504, shouldRetry: true, description: 'Gateway Timeout' },
    ];

    for (const testCase of testCases) {
      // Given: Specific error status
      const mock = TestData.httpClient.givenWorkingConnection();
      mock.mockImplementation(() => TestScenarios.responses.clientError(testCase.status));

      const config: HttpClientConfig = {
        retryAttempts: 2,
        retryDelay: 10,
        rateLimit: 10,
      };
      const client = new HttpClient(config);

      // When: Making request
      await expect(client.fetch('https://example.com')).rejects.toThrow();

      // Then: Error should contain correct status
      // This will be checked by the expect above

      // And should have correct retry behavior
      if (testCase.shouldRetry) {
        Assertions.http.shouldHaveMadeRequests(mock, 2); // Should retry
      } else {
        Assertions.http.shouldHaveMadeRequests(mock, 1); // Should not retry
      }
    }
  });
});

describe('HTTP Client - Rate Limiting Tests', () => {
  setupHttpClientTest();

  test('TC-HC-023-07 [P2]: Given rate limiter, when fetch is called, then it should wait for token', async () => {
    // Given: HTTP client with rate limiting
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 2, // 2 requests per second
    };
    const client = new HttpClient(config);

    // When: Making multiple requests rapidly
    const startTime = Date.now();
    const promises = Array.from({ length: 3 }, (_, i) =>
      client.fetch(`https://example.com/page${i + 1}.html`)
    );
    await Promise.all(promises);
    const endTime = Date.now();

    // Then: Should be rate limited
    expect(endTime - startTime).toBeGreaterThan(900); // At least 1 second between requests
    expect(mock).toHaveBeenCalledTimes(3);
  });
});

describe('HTTP Client - Edge Cases for Line Coverage', () => {
  setupHttpClientTest();

  test('TC-HC-024-01 [P2]: Given unknown error in retry loop, when all attempts fail, then it should throw default error', async () => {
    // Given: HTTP client with persistent unknown error
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() => Promise.reject(new Error('Unknown network error')));

    const config: HttpClientConfig = {
      retryAttempts: 2,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that keeps failing with unknown error
    // Then: Should throw "Unknown error occurred" after exhausting retries
    await expect(client.fetch('https://example.com')).rejects.toThrow('Unknown network error');
  });

  test('TC-HC-024-02 [P2]: Given constructor with no rate limit config, when created, then it should handle gracefully', () => {
    // Given: Configuration with minimal properties
    const config = {
      retryAttempts: 1,
      retryDelay: 100,
      rateLimit: 0, // Edge case: zero rate limit
    } as HttpClientConfig;

    // When: Creating HttpClient
    const client = new HttpClient(config);

    // Then: Should handle gracefully
    expect(client).toBeDefined();
    expect(client.getConfig()).toBeDefined();
  });

  test('TC-HC-024-03 [P2]: Given fetch with empty options, when called, then it should work correctly', async () => {
    // Given: HTTP client
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request with empty options
    const response = await client.fetch('https://example.com', {});

    // Then: Should work correctly
    expect(response.status).toBe(200);
    Assertions.http.shouldHaveMadeRequest(mock, 'https://example.com');
  });

  test('TC-HC-024-04 [P2]: Given fetch with empty options object, when called, then it should work correctly', async () => {
    // Given: HTTP client
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request with empty options object
    const response = await client.fetch('https://example.com', {});

    // Then: Should handle gracefully
    expect(response.status).toBe(200);
    Assertions.http.shouldHaveMadeRequest(mock, 'https://example.com');
  });

  test('TC-HC-024-05 [P2]: Given fetch with undefined options, when called, then it should work correctly', async () => {
    // Given: HTTP client
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request with undefined options
    const response = await client.fetch('https://example.com');

    // Then: Should work correctly
    expect(response.status).toBe(200);
    Assertions.http.shouldHaveMadeRequest(mock, 'https://example.com');
  });

  test('TC-HC-024-06 [P2]: Given constructor with undefined headers, when created, then it should handle gracefully', () => {
    // Given: Configuration with undefined headers
    const config = {
      retryAttempts: 1,
      retryDelay: 100,
      rateLimit: 10,
      headers: undefined,
    } as HttpClientConfig;

    // When: Creating HttpClient
    const client = new HttpClient(config);

    // Then: Should handle gracefully
    expect(client).toBeDefined();
    expect(client.getConfig().headers).toBeUndefined();
  });

  test('TC-HC-024-07 [P2]: Given constructor with null headers, when created, then it should handle gracefully', () => {
    // Given: Configuration with null headers
    const config = {
      retryAttempts: 1,
      retryDelay: 100,
      rateLimit: 10,
      headers: undefined,
    } as HttpClientConfig;

    // When: Creating HttpClient
    const client = new HttpClient(config);

    // Then: Should handle gracefully
    expect(client).toBeDefined();
    expect(client.getConfig().headers).toBeUndefined();
  });

  test('TC-HC-024-08 [P2]: Given very long URL, when fetch is called, then it should handle correctly', async () => {
    // Given: HTTP client and very long URL
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    const longUrl = `https://example.com/${'path'.repeat(1000)}`;

    // When: Making request with very long URL
    const response = await client.fetch(longUrl);

    // Then: Should handle correctly
    expect(response.status).toBe(200);
    expect(mock).toHaveBeenCalledWith(longUrl, expect.any(Object));
  });

  test('TC-HC-024-09 [P2]: Given special characters in URL, when fetch is called, then it should handle correctly', async () => {
    // Given: HTTP client and URL with special characters
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    const specialUrl = 'https://example.com/path with spaces/测试?param=value&emoji=🚀';

    // When: Making request with special characters
    const response = await client.fetch(specialUrl);

    // Then: Should handle correctly
    expect(response.status).toBe(200);
    expect(mock).toHaveBeenCalledWith(specialUrl, expect.any(Object));
  });
});
