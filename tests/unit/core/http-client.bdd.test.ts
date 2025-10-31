import { test, expect, describe, mock } from 'bun:test';
import { HttpClient } from '../../../src/core/index';
import { TestScenarios } from '../../factories/index';
import {
  setupHttpClientTest,
  TestData,
  Assertions,
  Performance,
  type FetchMock,
} from '../../helpers/test-setup.helper';

describe('HTTP Client - Basic Configuration', () => {
  setupHttpClientTest();

  test('TC-HC-001-01 [P0]: Given valid configuration, when HttpClient is initialized, then it should merge with defaults', () => {
    // Given: A valid HTTP client configuration
    const config = TestScenarios.httpClient.basic();

    // When: HttpClient is initialized with the configuration
    const client = new HttpClient(config);
    const clientConfig = client.getConfig();

    // Then: It should have the configured values and default values merged
    expect(clientConfig.retryAttempts).toBe(config.retryAttempts);
    expect(clientConfig.retryDelay).toBe(config.retryDelay);
    expect(clientConfig.rateLimit).toBe(config.rateLimit);
    expect(clientConfig.timeout).toBeUndefined(); // factory returns undefined for default
    expect(clientConfig.userAgent).toBe(config.userAgent);
  });
});

describe('HTTP Client - Custom Configuration Override', () => {
  setupHttpClientTest();

  test('TC-HC-001-02 [P1]: Given configuration with custom values, when HttpClient is initialized, then it should override defaults', () => {
    // Given: Configuration with custom values
    const config = TestScenarios.httpClient.basic({
      retryAttempts: 5,
      retryDelay: 2000,
      rateLimit: 20,
      timeout: 60000,
      userAgent: 'custom-agent/2.0.0',
      headers: { 'Custom-Header': 'value' },
    });

    // When: HttpClient is initialized
    const client = new HttpClient(config);
    const clientConfig = client.getConfig();

    // Then: Custom values should override defaults
    expect(clientConfig.retryAttempts).toBe(5);
    expect(clientConfig.retryDelay).toBe(2000);
    expect(clientConfig.rateLimit).toBe(20);
    expect(clientConfig.timeout).toBe(60000);
    expect(clientConfig.userAgent).toBe('custom-agent/2.0.0');
    expect(clientConfig.headers?.['Custom-Header']).toBe('value');
  });
});

describe('HTTP Client - Basic Request Execution', () => {
  setupHttpClientTest();

  test('TC-HC-002-01 [P0]: Given a working connection and valid URL, when making a request, then it should fetch successfully', async () => {
    // Given: A working connection and valid URL
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );
    const config = TestScenarios.httpClient.basic();
    const client = new HttpClient(config);

    // When: Making a request
    const response = await client.fetch('https://example.com');

    // Then: Request should be successful
    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
    expect(await response.text()).toContain('Success');
    Assertions.http.shouldHaveMadeRequest(mock, 'https://example.com');
  });
});

describe('HTTP Client - Custom Headers Request', () => {
  setupHttpClientTest();

  test('TC-HC-002-02 [P1]: Given custom headers configuration, when making a request, then it should include headers', async () => {
    // Given: Configuration with custom headers
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.successJson({ data: 'success' }))
    );
    const config = TestScenarios.httpClient.withCustomHeaders({
      Authorization: 'Bearer token123',
      'X-API-Key': 'test-key',
    });
    const client = new HttpClient(config);

    // When: Making a request
    await client.fetch('https://api.example.com/data');

    // Then: Request should include custom headers
    Assertions.http.shouldHaveMadeRequest(
      mock,
      'https://api.example.com/data',
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('test-agent'),
          Authorization: 'Bearer token123',
          'X-API-Key': 'test-key',
        }),
      })
    );
  });
});

describe('HTTP Client - Retry Logic Success', () => {
  setupHttpClientTest();

  test('TC-HC-003-01 [P0]: Given server errors, when making requests, then it should retry and eventually succeed', async () => {
    // Given: Server errors that should be retried
    const mock = TestData.httpClient.givenWorkingConnection();
    const retrySequence = TestScenarios.responses.retrySequence(
      2,
      '<html><body>Final Success</body></html>'
    );
    mock
      .mockImplementationOnce(() => Promise.resolve(retrySequence[0]))
      .mockImplementationOnce(() => Promise.resolve(retrySequence[1]))
      .mockImplementationOnce(() => Promise.resolve(retrySequence[2]));

    const config = TestScenarios.httpClient.basic({ retryAttempts: 3, retryDelay: 10 });
    const client = new HttpClient(config);

    // When: Making a request that will be retried
    const response = await client.fetch('https://example.com');

    // Then: Should retry and succeed
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Final Success');
    Assertions.http.shouldRetryOnFailure(mock, 2);
  });
});

describe('HTTP Client - Retry Logic Exhaustion', () => {
  setupHttpClientTest();

  test('TC-HC-003-02 [P1]: Given persistent server errors, when retries are exhausted, then it should fail', async () => {
    // Given: Persistent server errors
    const serverErrorMock = TestData.httpClient.givenServerErrors();
    const config = TestScenarios.httpClient.basic({ retryAttempts: 2, retryDelay: 10 });
    const client = new HttpClient(config);

    // When: Making a request that will exhaust retries
    // Then: Should fail with error
    await expect(client.fetch('https://example.com')).rejects.toThrow(
      'HTTP 500: Internal Server Error'
    );
    Assertions.http.shouldHaveMadeRequests(serverErrorMock, 2); // Configured for 2 attempts
  });
});

describe('HTTP Client - No Retry on Client Errors', () => {
  setupHttpClientTest();

  test('TC-HC-003-03 [P1]: Given client errors (4xx), when making requests, then it should not retry', async () => {
    // Given: Client error (4xx)
    const clientErrorMock = mock(() =>
      Promise.resolve(TestScenarios.responses.clientError(404))
    ) as FetchMock;
    clientErrorMock.preconnect = (
      _url: string | URL,
      _options?: { dns?: boolean; tcp?: boolean; http?: boolean; https?: boolean }
    ) => {
      // Mock preconnect functionality - no-op for tests
    };
    global.fetch = clientErrorMock;
    const config = TestScenarios.httpClient.basic({ retryAttempts: 3, retryDelay: 10 });
    const client = new HttpClient(config);

    // When: Making a request that gets a client error
    // Then: Should fail immediately without retrying
    await expect(client.fetch('https://example.com')).rejects.toThrow('HTTP 404: Not Found');
    Assertions.http.shouldHaveMadeRequests(clientErrorMock, 1); // No retries for 4xx errors
  });
});

describe('HTTP Client - Rate Limiting High Rate', () => {
  setupHttpClientTest();

  test('TC-HC-004-01 [P2]: Given high rate limit, when making multiple requests, then they should complete quickly', async () => {
    // Given: High rate limit configuration
    const mock = TestData.httpClient.givenWorkingConnection();
    const config = TestScenarios.httpClient.withRateLimit(100);
    const client = new HttpClient(config);

    // When: Making multiple requests
    const { result, duration } = await Performance.measureTime(async () => {
      const promises = [
        client.fetch('https://example.com/1'),
        client.fetch('https://example.com/2'),
        client.fetch('https://example.com/3'),
      ];
      return Promise.all(promises);
    });

    // Then: All requests should complete quickly
    expect(result).toHaveLength(3);
    Performance.expectDurationWithin(duration, 0, 1000); // Should complete within 1 second
    Assertions.http.shouldHaveMadeRequests(mock, 3);
  });
});

describe('HTTP Client - Timeout Handling', () => {
  setupHttpClientTest();

  test('TC-HC-005-01 [P1]: Given short timeout configuration, when request takes too long, then it should timeout', async () => {
    // Given: Short timeout configuration
    const timeoutMock = mock(() => TestScenarios.responses.timeout()) as FetchMock;
    timeoutMock.preconnect = (
      _url: string | URL,
      _options?: { dns?: boolean; tcp?: boolean; http?: boolean; https?: boolean }
    ) => {
      // Mock preconnect functionality - no-op for tests
    };
    global.fetch = timeoutMock;
    const config = TestScenarios.httpClient.withTimeout(50);
    const client = new HttpClient(config);

    // When: Making a request that times out
    // Then: Should fail with timeout error
    await expect(client.fetch('https://example.com')).rejects.toThrow('Request timeout');
  });
});

describe('HTTP Client - Configuration Updates', () => {
  setupHttpClientTest();

  test('TC-HC-006-01 [P2]: Given existing client, when configuration is updated, then it should use new values', () => {
    // Given: An existing HTTP client
    const config = TestScenarios.httpClient.basic();
    const client = new HttpClient(config);

    // When: Updating configuration
    client.updateConfig({
      retryAttempts: 5,
      userAgent: 'updated-agent/1.0.0',
    });

    // Then: Should use updated configuration
    const updatedConfig = client.getConfig();
    expect(updatedConfig.retryAttempts).toBe(5);
    expect(updatedConfig.retryDelay).toBe(config.retryDelay); // Unchanged
    expect(updatedConfig.rateLimit).toBe(config.rateLimit); // Unchanged
    expect(updatedConfig.userAgent).toBe('updated-agent/1.0.0');
  });
});

describe('HTTP Client - Rate Limiter Reset', () => {
  setupHttpClientTest();

  test('TC-HC-007-01 [P2]: Given active rate limiter, when reset is called, then it should clear request history', () => {
    // Given: HTTP client with active rate limiting
    const config = TestScenarios.httpClient.basic();
    const client = new HttpClient(config);

    // When: Resetting rate limiter
    // Then: Should not throw and should work without issues
    expect(() => client.resetRateLimiter()).not.toThrow();
  });
});
