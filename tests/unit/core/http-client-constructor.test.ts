import { test, expect, describe, mock } from 'bun:test';
import { HttpClient } from '../../../src/core/index';
import type { HttpClientConfig } from '../../../src/types';

describe('HTTP Client - Constructor Configuration Tests', () => {
  test('TC-HC-025-01 [P1]: Given config with all properties, when constructor is called, then all lines should be executed', () => {
    // Given: Complete configuration to ensure all constructor paths are taken
    const config: HttpClientConfig = {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
      timeout: 60000,
      userAgent: 'test-user-agent/2.0.0',
      headers: {
        'X-Custom-Header': 'custom-value',
        Authorization: 'Bearer token123',
      },
    };

    // When: Creating HttpClient (this exercises lines 45-56)
    const client = new HttpClient(config);

    // Then: Configuration should be merged correctly (line 46-50)
    const clientConfig = client.getConfig();
    expect(clientConfig.retryAttempts).toBe(3);
    expect(clientConfig.retryDelay).toBe(1000);
    expect(clientConfig.rateLimit).toBe(10);
    expect(clientConfig.timeout).toBe(60000);
    expect(clientConfig.userAgent).toBe('test-user-agent/2.0.0');
    expect(clientConfig.headers).toEqual({
      'X-Custom-Header': 'custom-value',
      Authorization: 'Bearer token123',
    });
  });

  test('TC-HC-025-02 [P1]: Given config without optional properties, when constructor is called, then defaults should be used', () => {
    // Given: Minimal configuration to test default value merging
    const config: HttpClientConfig = {
      retryAttempts: 2,
      retryDelay: 500,
      rateLimit: 5,
      // timeout, userAgent, headers are omitted
    };

    // When: Creating HttpClient
    const client = new HttpClient(config);

    // Then: Defaults should be applied
    const clientConfig = client.getConfig();
    expect(clientConfig.timeout).toBe(30000); // DEFAULT_TIMEOUT_MS
    expect(clientConfig.userAgent).toBe('docs-scrape/1.0.0'); // default user agent
  });

  test('TC-HC-025-09 [P2]: Given constructor with partial config merging, when called, then it should preserve existing properties', () => {
    // Given: Configuration with some properties
    const config: Partial<HttpClientConfig> = {
      retryAttempts: 5,
      retryDelay: 2000,
      // rateLimit will use default
      timeout: 45000,
      userAgent: 'partial-agent/1.0.0',
      headers: {
        'Partial-Header': 'partial-value',
      },
    };

    // When: Creating HttpClient with partial config
    const client = new HttpClient(config as HttpClientConfig);

    // Then: Should merge properties correctly
    const clientConfig = client.getConfig();
    expect(clientConfig.retryAttempts).toBe(5);
    expect(clientConfig.retryDelay).toBe(2000);
    expect(clientConfig.rateLimit).toBeUndefined(); // Not specified
    expect(clientConfig.timeout).toBe(45000);
    expect(clientConfig.userAgent).toBe('partial-agent/1.0.0');
    expect(clientConfig.headers).toEqual({
      'Partial-Header': 'partial-value',
    });
  });

  test('TC-HC-025-10 [P2]: Given constructor with empty headers, when called, then it should handle gracefully', () => {
    // Given: Configuration with empty headers
    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 100,
      rateLimit: 5,
      headers: {}, // Empty headers object
    };

    // When: Creating HttpClient
    const client = new HttpClient(config);

    // Then: Should handle empty headers gracefully
    const clientConfig = client.getConfig();
    expect(clientConfig.headers).toEqual({});
  });
});

describe('HTTP Client - Rate Limiter Initialization Tests', () => {
  test('TC-HC-025-03 [P1]: Given rate limiter initialization, when constructor is called, then rate limiter should be configured', () => {
    // Given: Configuration with different rate limit values
    const configs: HttpClientConfig[] = [
      { retryAttempts: 1, retryDelay: 100, rateLimit: 1 },
      { retryAttempts: 1, retryDelay: 100, rateLimit: 5.5 },
      { retryAttempts: 1, retryDelay: 100, rateLimit: 0.1 },
      { retryAttempts: 1, retryDelay: 100, rateLimit: 100 },
    ];

    // When: Creating multiple HttpClients
    const clients = configs.map(config => new HttpClient(config));

    // Then: Each should be configured correctly
    for (const [index, client] of clients.entries()) {
      expect(client.getConfig().rateLimit).toBe(configs[index].rateLimit);
    }
  });

  test('TC-HC-025-04 [P1]: Given config with zero rate limit, when constructor is called, then it should handle gracefully', () => {
    // Given: Edge case with zero rate limit
    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 100,
      rateLimit: 0,
    };

    // When: Creating HttpClient
    const client = new HttpClient(config);

    // Then: Should handle gracefully
    expect(client.getConfig().rateLimit).toBe(0);
  });

  test('TC-HC-025-05 [P1]: Given config with negative rate limit, when constructor is called, then it should handle gracefully', () => {
    // Given: Edge case with negative rate limit
    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 100,
      rateLimit: -5,
    };

    // When: Creating HttpClient
    const client = new HttpClient(config);

    // Then: Should handle gracefully
    expect(client.getConfig().rateLimit).toBe(-5);
  });

  test('TC-HC-025-06 [P1]: Given config with fraction rate limit, when constructor is called, then it should handle correctly', () => {
    // Given: Configuration with fractional rate limit
    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 100,
      rateLimit: 2.7,
    };

    // When: Creating HttpClient
    const client = new HttpClient(config);

    // Then: Rate limiter should handle fractional value
    expect(client.getConfig().rateLimit).toBe(2.7);
  });
});

describe('HTTP Client - Fetch Method Tests', () => {
  test('TC-HC-025-07 [P1]: Given fetch method call, when called, then it should execute rate limiting', async () => {
    // Given: HTTP client
    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
      timeout: 5000,
      userAgent: 'test-agent/1.0.0',
    };
    const client = new HttpClient(config);

    // Mock fetch to return a successful response
    global.fetch = Object.assign(
      mock(() =>
        Promise.resolve(
          new Response('<html><body>Success</body></html>', {
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'text/html' },
          })
        )
      ),
      {
        preconnect: mock(() => Promise.resolve()),
      }
    );

    // When: Making a fetch request (this exercises the fetch method and rate limiting)
    const response = await client.fetch('https://example.com');

    // Then: Should succeed
    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
    expect(await response.text()).toContain('Success');
  });

  test('TC-HC-025-08 [P1]: Given fetch method with options, when called, then it should handle options correctly', async () => {
    // Given: HTTP client with custom headers
    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
      headers: {
        'X-Config-Header': 'config-value',
      },
    };
    const client = new HttpClient(config);

    // Mock fetch
    const fetchMock = Object.assign(
      mock(() =>
        Promise.resolve(
          new Response('{"success": true}', {
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'application/json' },
          })
        )
      ),
      {
        preconnect: mock(() => Promise.resolve()),
      }
    );
    global.fetch = fetchMock;

    // When: Making fetch with custom options
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'X-Request-Header': 'request-value',
        'Content-Type': 'application/json',
      },
      body: '{"test": "data"}',
    };

    await client.fetch('https://api.example.com', options);

    // Then: Should merge headers correctly
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('docs-scrape'),
          'X-Config-Header': 'config-value',
          'X-Request-Header': 'request-value',
          'Content-Type': 'application/json',
        }),
        body: '{"test": "data"}',
      })
    );
  });
});
