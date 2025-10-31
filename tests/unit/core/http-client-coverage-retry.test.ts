import { test, expect, describe } from 'bun:test';
import { HttpClient } from '../../../src/core/index';
import type { HttpClientConfig } from '../../../src/types';
import { TestScenarios } from '../../factories/index';
import { setupHttpClientTest, TestData, Assertions } from '../../helpers/test-setup.helper';

describe('HTTP Client - Retry Logic', () => {
  setupHttpClientTest();

  test('TC-HC-011-01 [P0]: Given retryable server error, when fetch fails, then it should retry', async () => {
    // Given: Server error followed by success
    const mock = TestData.httpClient.givenWorkingConnection();
    mock
      .mockImplementationOnce(() => Promise.resolve(TestScenarios.responses.serverError(500)))
      .mockImplementationOnce(() =>
        Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
      );

    const config: HttpClientConfig = {
      retryAttempts: 3,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that fails first
    const response = await client.fetch('https://example.com');

    // Then: Should retry and succeed
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Success');
    Assertions.http.shouldHaveMadeRequests(mock, 2); // Initial + 1 retry
  });

  test('TC-HC-011-02 [P1]: Given rate limit error, when fetch fails, then it should retry', async () => {
    // Given: Rate limit error followed by success
    const mock = TestData.httpClient.givenWorkingConnection();
    mock
      .mockImplementationOnce(() => Promise.resolve(TestScenarios.responses.rateLimit()))
      .mockImplementationOnce(() =>
        Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
      );

    const config: HttpClientConfig = {
      retryAttempts: 3,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that gets rate limited
    const response = await client.fetch('https://example.com');

    // Then: Should retry and succeed
    expect(response.status).toBe(200);
    Assertions.http.shouldHaveMadeRequests(mock, 2);
  });

  test('TC-HC-011-03 [P1]: Given non-retryable client error, when fetch fails, then it should not retry', async () => {
    // Given: Client error (4xx)
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() => Promise.resolve(TestScenarios.responses.clientError(404)));

    const config: HttpClientConfig = {
      retryAttempts: 3,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that gets client error
    // Then: Should fail immediately
    await expect(client.fetch('https://example.com')).rejects.toThrow('HTTP 404: Not Found');
    Assertions.http.shouldHaveMadeRequests(mock, 1); // No retries
  });

  test('TC-HC-011-04 [P2]: Given multiple failures, when retries are exhausted, then it should throw last error', async () => {
    // Given: Persistent server errors
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() => Promise.resolve(TestScenarios.responses.serverError(503)));

    const config: HttpClientConfig = {
      retryAttempts: 2,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that keeps failing
    // Then: Should exhaust retries and throw error
    await expect(client.fetch('https://example.com')).rejects.toThrow(
      /HTTP 503: Service Unavailable/
    );
    Assertions.http.shouldHaveMadeRequests(mock, 2); // Initial + 1 retry (total attempts)
  });
});

describe('HTTP Client - Error Handling', () => {
  setupHttpClientTest();

  test('TC-HC-012-01 [P0]: Given HTTP error response, when fetch is called, then it should throw HttpError', async () => {
    // Given: HTTP error response
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() => Promise.resolve(TestScenarios.responses.clientError(404)));

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that returns error
    // Then: Should throw HttpError
    await expect(client.fetch('https://example.com')).rejects.toThrow('HTTP 404: Not Found');
  });

  test('TC-HC-012-02 [P1]: Given server error with retry attempts, when fetch is called, then it should retry and throw if all fail', async () => {
    // Given: Persistent server error
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() => Promise.resolve(TestScenarios.responses.serverError(500)));

    const config: HttpClientConfig = {
      retryAttempts: 3,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that always fails
    // Then: Should retry and throw error
    await expect(client.fetch('https://example.com')).rejects.toThrow(
      'HTTP 500: Internal Server Error'
    );
    Assertions.http.shouldHaveMadeRequests(mock, 3); // Initial + 2 retries
  });

  test('TC-HC-012-03 [P1]: Given network error, when fetch is called, then it should retry and throw if all fail', async () => {
    // Given: Network error
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() => Promise.reject(new Error('Network error')));

    const config: HttpClientConfig = {
      retryAttempts: 2,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that fails with network error
    // Then: Should retry and throw error
    await expect(client.fetch('https://example.com')).rejects.toThrow('Network error');
    Assertions.http.shouldHaveMadeRequests(mock, 2); // Initial + 1 retry
  });

  test('TC-HC-012-04 [P2]: Given HttpError, when caught, then it should contain response details', async () => {
    // Given: HTTP error response
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() => Promise.resolve(TestScenarios.responses.serverError(502)));

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that fails
    try {
      await client.fetch('https://example.com');
      throw new Error('Should have thrown HttpError');
    } catch (error) {
      // Then: Error should contain response details
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('HTTP 502: Bad Gateway');
      // Note: URL is not included in error message with response body
    }
  });

  test('TC-HC-012-05 [P2]: Given error response with body, when caught, then it should include body in error message', async () => {
    // Given: Error response with body content
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(
        new Response('Error details here', {
          status: 400,
          statusText: 'Bad Request',
          headers: { 'content-type': 'text/plain' },
        })
      )
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that fails
    try {
      await client.fetch('https://example.com');
      throw new Error('Should have thrown HttpError');
    } catch (error) {
      // Then: Error message should include response body
      expect((error as Error).message).toContain('Error details here');
    }
  });

  test('TC-HC-012-06 [P2]: Given different HTTP status codes, when fetch is called, then it should handle each appropriately', async () => {
    // Given: Various HTTP error status codes
    const errorScenarios = [
      { status: 400, expectedPattern: /HTTP 400/ },
      { status: 401, expectedPattern: /HTTP 401/ },
      { status: 403, expectedPattern: /HTTP 403/ },
      { status: 404, expectedPattern: /HTTP 404/ },
      { status: 500, expectedPattern: /HTTP 500/ },
      { status: 502, expectedPattern: /HTTP 502/ },
      { status: 503, expectedPattern: /HTTP 503/ },
    ];

    for (const scenario of errorScenarios) {
      // Given: Specific error status
      const mock = TestData.httpClient.givenWorkingConnection();
      mock.mockImplementation(() =>
        Promise.resolve(TestScenarios.responses.clientError(scenario.status))
      );

      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 10,
      };
      const client = new HttpClient(config);

      // When: Making request
      // Then: Should throw appropriate error
      await expect(client.fetch('https://example.com')).rejects.toThrow(scenario.expectedPattern);
    }
  });
});

describe('HTTP Client - Timeout Handling', () => {
  setupHttpClientTest();

  test('TC-HC-013-01 [P1]: Given request timeout, when fetch takes too long, then it should abort request', async () => {
    // Given: Short timeout configuration
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation((_, options) => {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          resolve(TestScenarios.responses.success('<html><body>Success</body></html>'));
        }, 2000);

        // Respect the abort signal
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            const error = new DOMException('Request timeout', 'AbortError');
            reject(error);
          });
        }
      });
    });

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
      timeout: 100, // Very short timeout
    };
    const client = new HttpClient(config);

    // When: Making request that takes longer than timeout
    // Then: Should abort and throw timeout error
    await expect(client.fetch('https://example.com')).rejects.toThrow('Request timeout');
  });

  test('TC-HC-013-02 [P1]: Given timeout with retries, when request times out, then it should retry', async () => {
    // Given: Request that times out initially
    const mock = TestData.httpClient.givenWorkingConnection();
    let callCount = 0;
    mock.mockImplementation((_, options) => {
      callCount++;
      if (callCount === 1) {
        // First call times out
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            resolve(TestScenarios.responses.success('<html><body>Success</body></html>'));
          }, 2000);

          // Respect the abort signal
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              clearTimeout(timeoutId);
              const error = new DOMException('Request timeout', 'AbortError');
              reject(error);
            });
          }
        });
      }
      // Second call succeeds quickly
      return Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'));
    });

    const config: HttpClientConfig = {
      retryAttempts: 2,
      retryDelay: 10,
      rateLimit: 10,
      timeout: 100, // Short timeout
    };
    const client = new HttpClient(config);

    // When: Making request
    const response = await client.fetch('https://example.com');

    // Then: Should retry and succeed
    expect(response.status).toBe(200);
    expect(mock).toHaveBeenCalledTimes(2);
  });

  test('TC-HC-013-03 [P2]: Given timeout on all retries, when all attempts time out, then it should throw timeout error', async () => {
    // Given: Request that always times out
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation((_, options) => {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          resolve(TestScenarios.responses.success('<html><body>Success</body></html>'));
        }, 2000);

        // Respect the abort signal
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            const error = new DOMException('Request timeout', 'AbortError');
            reject(error);
          });
        }
      });
    });

    const config: HttpClientConfig = {
      retryAttempts: 2,
      retryDelay: 10,
      rateLimit: 10,
      timeout: 100, // Short timeout
    };
    const client = new HttpClient(config);

    // When: Making request that always times out
    // Then: Should throw timeout error
    try {
      await client.fetch('https://example.com');
      expect(true).toBe(false); // Force test failure
    } catch (error) {
      expect(error instanceof Error ? error.name : String(error)).toBe('AbortError');
    }
  });

  test('TC-HC-013-04 [P2]: Given very long timeout, when request completes within timeout, then it should succeed', async () => {
    // Given: Long timeout configuration
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () => resolve(TestScenarios.responses.success('<html><body>Success</body></html>')),
            500
          )
        )
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
      timeout: 5000, // Long timeout
    };
    const client = new HttpClient(config);

    // When: Making request that completes within timeout
    const response = await client.fetch('https://example.com');

    // Then: Should succeed
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Success');
  });
});
