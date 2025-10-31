import { test, expect, describe } from 'bun:test';
import { HttpClient } from '../../../src/core/index';
import type { HttpClientConfig } from '../../../src/types';
import { TestScenarios } from '../../factories/index';
import { setupHttpClientTest, TestData, Assertions } from '../../helpers/test-setup.helper';

describe('HTTP Client - Rate Limiting Behavior', () => {
  setupHttpClientTest();

  test('TC-HC-016-01 [P1]: Given rate limit of 1, when multiple requests are made, then they should be spaced out', async () => {
    // Given: Rate limit of 1 request per second
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 1, // 1 request per second
    };
    const client = new HttpClient(config);

    // When: Making multiple requests sequentially to test rate limiting
    const startTime = Date.now();
    await client.fetch('https://example.com');
    await client.fetch('https://example.com');
    await client.fetch('https://example.com');
    const endTime = Date.now();

    // Then: Requests should be spaced out (approximately 2 seconds between first and last)
    expect(endTime - startTime).toBeGreaterThan(1800); // Allow some tolerance
    expect(endTime - startTime).toBeLessThan(2500); // But not too long
  });

  test('TC-HC-016-02 [P1]: Given rate limit of 10, when requests are made rapidly, then they should not be delayed', async () => {
    // Given: Higher rate limit
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10, // 10 requests per second
    };
    const client = new HttpClient(config);

    // When: Making multiple requests rapidly
    const startTime = Date.now();
    const promises = Array.from({ length: 5 }, () => client.fetch('https://example.com'));
    await Promise.all(promises);
    const endTime = Date.now();

    // Then: Requests should complete quickly (no significant delay)
    expect(endTime - startTime).toBeLessThan(1000);
  });

  test('TC-HC-016-03 [P2]: Given fractional rate limit, when requests are made, then it should handle correctly', async () => {
    // Given: Fractional rate limit
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 0.5, // 0.5 requests per second (1 request every 2 seconds)
    };
    const client = new HttpClient(config);

    // When: Making multiple requests sequentially
    const startTime = Date.now();
    await client.fetch('https://example.com');
    await client.fetch('https://example.com');
    await client.fetch('https://example.com');
    const endTime = Date.now();

    // Then: Requests should be spaced out appropriately
    expect(endTime - startTime).toBeGreaterThan(3800); // Approximately 4 seconds for 3 requests
    expect(endTime - startTime).toBeLessThan(5000);
  });

  test('TC-HC-016-04 [P2]: Given very high rate limit, when requests are made, then they should not be throttled', async () => {
    // Given: Very high rate limit
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 1000, // Very high rate limit
    };
    const client = new HttpClient(config);

    // When: Making many requests rapidly
    const startTime = Date.now();
    const promises = Array.from({ length: 20 }, () => client.fetch('https://example.com'));
    await Promise.all(promises);
    const endTime = Date.now();

    // Then: Should complete quickly with no throttling
    expect(endTime - startTime).toBeLessThan(500);
  });
});

describe('HTTP Client - Configuration Management', () => {
  setupHttpClientTest();

  test('TC-HC-017-01 [P1]: Given configuration, when getConfig is called, then it should return config object', () => {
    // Given: HTTP client with configuration
    const config: HttpClientConfig = {
      retryAttempts: 3,
      retryDelay: 1500,
      rateLimit: 7.5,
      timeout: 45000,
      userAgent: 'test-agent/1.0.0',
      headers: {
        'X-Test': 'value',
      },
    };
    const client = new HttpClient(config);

    // When: Getting configuration
    const clientConfig = client.getConfig();

    // Then: Should return configuration object
    expect(clientConfig.retryAttempts).toBe(3);
    expect(clientConfig.retryDelay).toBe(1500);
    expect(clientConfig.rateLimit).toBe(7.5);
    expect(clientConfig.timeout).toBe(45000);
    expect(clientConfig.userAgent).toBe('test-agent/1.0.0');
    expect(clientConfig.headers).toEqual({ 'X-Test': 'value' });
  });

  test('TC-HC-017-02 [P2]: Given configuration changes, when getConfig is called, then it should return original values', () => {
    // Given: HTTP client
    const config: HttpClientConfig = {
      retryAttempts: 2,
      retryDelay: 1000,
      rateLimit: 5,
    };
    const client = new HttpClient(config);

    // When: Modifying the returned config object
    const clientConfig = client.getConfig();
    clientConfig.retryAttempts = 999;
    clientConfig.timeout = 999999;

    // Then: Original values should be preserved
    const newConfig = client.getConfig();
    expect(newConfig.retryAttempts).toBe(2); // Should remain unchanged
    expect(newConfig.timeout).toBe(30000); // Should remain default
  });

  test('TC-HC-017-03 [P2]: Given minimal configuration, when getConfig is called, then it should include defaults', () => {
    // Given: Minimal configuration
    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 100,
      rateLimit: 1,
    };
    const client = new HttpClient(config);

    // When: Getting configuration
    const clientConfig = client.getConfig();

    // Then: Should include default values
    expect(clientConfig.timeout).toBe(30000); // Default timeout
    expect(clientConfig.userAgent).toBe('docs-scrape/1.0.0'); // Default user agent
    expect(clientConfig.headers).toBeUndefined(); // Undefined when not specified
  });
});

describe('HTTP Client - Edge Cases and Boundary Conditions', () => {
  setupHttpClientTest();

  test('TC-HC-018-01 [P1]: Given zero retry attempts, when request fails, then it should not retry', async () => {
    // Given: Zero retry attempts
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() => Promise.resolve(TestScenarios.responses.serverError(500)));

    const config: HttpClientConfig = {
      retryAttempts: 0,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that fails
    // Then: Should not retry
    await expect(client.fetch('https://example.com')).rejects.toThrow(
      'HTTP 500: Internal Server Error'
    );
    Assertions.http.shouldHaveMadeRequests(mock, 1); // Only initial attempt
  });

  test('TC-HC-018-02 [P1]: Given very high retry attempts, when persistent failure occurs, then it should eventually stop', async () => {
    // Given: Very high retry attempts
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() => Promise.resolve(TestScenarios.responses.serverError(503)));

    const config: HttpClientConfig = {
      retryAttempts: 5,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that always fails
    // Then: Should eventually stop after max attempts
    await expect(client.fetch('https://example.com')).rejects.toThrow(
      'HTTP 503: Service Unavailable'
    );
    Assertions.http.shouldHaveMadeRequests(mock, 5); // Should make exactly 5 attempts
  });

  test('TC-HC-018-03 [P1]: Given zero retry delay, when retry occurs, then it should retry immediately', async () => {
    // Given: Zero retry delay
    const mock = TestData.httpClient.givenWorkingConnection();
    mock
      .mockImplementationOnce(() => Promise.resolve(TestScenarios.responses.serverError(500)))
      .mockImplementationOnce(() =>
        Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
      );

    const config: HttpClientConfig = {
      retryAttempts: 2,
      retryDelay: 0, // Immediate retry
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that fails then succeeds
    const startTime = Date.now();
    const response = await client.fetch('https://example.com');
    const endTime = Date.now();

    // Then: Should retry immediately and succeed
    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    Assertions.http.shouldHaveMadeRequests(mock, 2);
  });

  test('TC-HC-018-04 [P1]: Given zero rate limit, when requests are made, then they should be treated as unlimited', async () => {
    // Given: Zero rate limit (treated as unlimited in current implementation)
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 0, // Treated as unlimited requests
    };
    const client = new HttpClient(config);

    // When: Making request
    // Then: Should succeed without rate limiting (current behavior treats 0 as unlimited)
    const response = await client.fetch('https://example.com');

    expect(response.status).toBe(200);
    Assertions.http.shouldHaveMadeRequests(mock, 1);
  });

  test('TC-HC-018-05 [P2]: Given very large timeout value, when request is made, then it should handle correctly', async () => {
    // Given: Very large timeout
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
      timeout: 2147483647, // Maximum 32-bit integer
    };
    const client = new HttpClient(config);

    // When: Making request
    const response = await client.fetch('https://example.com');

    // Then: Should handle large timeout correctly
    expect(response.status).toBe(200);
  });

  test('TC-HC-018-06 [P2]: Given negative retry delay, when retry occurs, then it should handle gracefully', async () => {
    // Given: Negative retry delay
    const mock = TestData.httpClient.givenWorkingConnection();
    mock
      .mockImplementationOnce(() => Promise.resolve(TestScenarios.responses.serverError(500)))
      .mockImplementationOnce(() =>
        Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
      );

    const config: HttpClientConfig = {
      retryAttempts: 2,
      retryDelay: -100, // Negative delay
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that fails then succeeds
    const response = await client.fetch('https://example.com');

    // Then: Should handle negative delay gracefully
    expect(response.status).toBe(200);
    Assertions.http.shouldHaveMadeRequests(mock, 2);
  });

  test('TC-HC-018-07 [P2]: Given fractional timeout, when request is made, then it should handle correctly', async () => {
    // Given: Fractional timeout
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
      timeout: 1500.5, // Fractional timeout
    };
    const client = new HttpClient(config);

    // When: Making request
    const response = await client.fetch('https://example.com');

    // Then: Should handle fractional timeout correctly
    expect(response.status).toBe(200);
  });

  test('TC-HC-018-08 [P2]: Given very long URL, when request is made, then it should handle correctly', async () => {
    // Given: Very long URL
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const longPath = '/'.repeat(2000); // Very long path
    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request with very long URL
    const response = await client.fetch(`https://example.com${longPath}`);

    // Then: Should handle long URL correctly
    expect(response.status).toBe(200);
    expect(mock).toHaveBeenCalledWith(
      expect.stringContaining(`https://example.com${longPath}`),
      expect.any(Object)
    );
  });

  test('TC-HC-018-09 [P2]: Given special characters in URL, when request is made, then it should handle correctly', async () => {
    // Given: URL with special characters
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const specialUrl = 'https://example.com/path with spaces/测试?param=value&other=测试中文字符';
    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request with special characters
    const response = await client.fetch(specialUrl);

    // Then: Should handle special characters correctly
    expect(response.status).toBe(200);
    expect(mock).toHaveBeenCalledWith(specialUrl, expect.any(Object));
  });
});
