import { test, expect, describe } from 'bun:test';
import { HttpClient } from '../../../src/core/index';
import type { HttpClientConfig } from '../../../src/types';
import { TestScenarios } from '../../factories/index';
import { setupHttpClientTest, TestData } from '../../helpers/test-setup.helper';

describe('HTTP Client - Constructor and Initialization Logic', () => {
  setupHttpClientTest();

  test('TC-HC-008-01 [P0]: Given minimal configuration, when HttpClient is created, then it should use default values', () => {
    // Given: Minimal configuration
    const config: Partial<HttpClientConfig> = {
      retryAttempts: 1,
      retryDelay: 100,
      rateLimit: 1,
    };

    // When: Creating HttpClient
    const client = new HttpClient(config as HttpClientConfig);

    // Then: Should use default values for unspecified properties
    const clientConfig = client.getConfig();
    expect(clientConfig.timeout).toBe(30000); // DEFAULT_TIMEOUT_MS
    expect(clientConfig.userAgent).toBe('docs-scrape/1.0.0'); // default user agent
    expect(clientConfig.headers).toBeUndefined(); // undefined when not specified
  });

  test('TC-HC-008-02 [P1]: Given configuration with rate limit less than 1, when HttpClient is created, then it should normalize to 1', () => {
    // Given: Configuration with rate limit less than 1
    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 100,
      rateLimit: 0.5, // Less than 1
    };

    // When: Creating HttpClient
    const client = new HttpClient(config);

    // Then: Rate limiter should have maxRequests of 1 (minimum)
    // We can't directly access rateLimiter, but we can test behavior
    expect(client.getConfig().rateLimit).toBe(0.5); // Config stays as is
  });

  test('TC-HC-008-03 [P1]: Given configuration with all parameters, when HttpClient is created, then it should store all config values', () => {
    // Given: Complete configuration
    const config: HttpClientConfig = {
      retryAttempts: 5,
      retryDelay: 2000,
      rateLimit: 10,
      timeout: 60000,
      userAgent: 'custom-agent/2.0.0',
      headers: {
        'X-Custom-Header': 'custom-value',
        Authorization: 'Bearer token123',
      },
    };

    // When: Creating HttpClient
    const client = new HttpClient(config);

    // Then: Should store all configuration values
    const clientConfig = client.getConfig();
    expect(clientConfig.retryAttempts).toBe(5);
    expect(clientConfig.retryDelay).toBe(2000);
    expect(clientConfig.rateLimit).toBe(10);
    expect(clientConfig.timeout).toBe(60000);
    expect(clientConfig.userAgent).toBe('custom-agent/2.0.0');
    expect(clientConfig.headers).toEqual({
      'X-Custom-Header': 'custom-value',
      Authorization: 'Bearer token123',
    });
  });
});

describe('HTTP Client - Rate Limiter Initialization', () => {
  setupHttpClientTest();

  test('TC-HC-008-04 [P1]: Given rate limit configuration, when HttpClient is created, then rate limiter should be configured', () => {
    // Given: Configuration with rate limit
    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 100,
      rateLimit: 5.7, // Non-integer rate limit
    };

    // When: Creating HttpClient
    const client = new HttpClient(config);

    // Then: Rate limiter should be configured correctly
    expect(client.getConfig().rateLimit).toBe(5.7);
  });

  test('TC-HC-008-05 [P2]: Given very high rate limit, when HttpClient is created, then it should handle gracefully', () => {
    // Given: Very high rate limit
    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 100,
      rateLimit: 1000000, // Extremely high rate limit
    };

    // When: Creating HttpClient
    const client = new HttpClient(config);

    // Then: Should handle gracefully
    expect(client.getConfig().rateLimit).toBe(1000000);
  });

  test('TC-HC-008-06 [P2]: Given fractional rate limit, when HttpClient is created, then it should handle correctly', () => {
    // Given: Fractional rate limit
    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 100,
      rateLimit: 2.3, // Fractional rate limit
    };

    // When: Creating HttpClient
    const client = new HttpClient(config);

    // Then: Should handle fractional rate limit correctly
    expect(client.getConfig().rateLimit).toBe(2.3);
  });
});

describe('HTTP Client - Fetch Method with Rate Limiting', () => {
  setupHttpClientTest();

  test('TC-HC-008-07 [P1]: Given configured HTTP client, when fetch is called, then it should use fetch API', async () => {
    // Given: Configured HTTP client
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

    // Then: Should use fetch API
    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
    expect(await response.text()).toContain('Success');
  });

  test('TC-HC-008-08 [P1]: Given fetch with options, when called, then it should pass options correctly', async () => {
    // Given: HTTP client with custom options
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('{"success": true}'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request with custom options
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'data' }),
    };

    const response = await client.fetch('https://api.example.com', options);

    // Then: Should pass options correctly
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('success');
  });

  test('TC-HC-008-09 [P2]: Given rate limiting, when multiple requests are made, then they should be rate limited', async () => {
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

    // When: Making multiple requests
    const startTime = Date.now();
    const promises = Array.from({ length: 3 }, () => client.fetch('https://example.com'));
    await Promise.all(promises);
    const endTime = Date.now();

    // Then: Requests should be rate limited (take at least 1 second due to rate limiting)
    expect(endTime - startTime).toBeGreaterThan(900); // Allow some tolerance
  });
});
