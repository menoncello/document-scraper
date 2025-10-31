import { test, expect, describe } from 'bun:test';
import { HttpClient } from '../../../src/core/index';
import type { HttpClientConfig } from '../../../src/types';
import { TestScenarios } from '../../factories/index';
import { setupHttpClientTest, TestData, Assertions } from '../../helpers/test-setup.helper';

describe('HTTP Client - Header Management', () => {
  setupHttpClientTest();

  test('TC-HC-014-01 [P1]: Given config headers, when request is made, then default headers should be merged', async () => {
    // Given: Configuration with custom headers
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
      headers: {
        'X-Custom-Header': 'custom-value',
        Authorization: 'Bearer token123',
      },
    };
    const client = new HttpClient(config);

    // When: Making request
    await client.fetch('https://example.com');

    // Then: Default headers should be merged with custom headers
    Assertions.http.shouldHaveMadeRequest(
      mock,
      'https://example.com',
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('docs-scrape'),
          Accept: expect.stringContaining('text/html'),
          'Accept-Language': expect.stringContaining('en-US'),
          'Accept-Encoding': 'gzip, deflate',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'X-Custom-Header': 'custom-value',
          Authorization: 'Bearer token123',
        }),
      })
    );
  });

  test('TC-HC-014-02 [P1]: Given request headers, when request is made, then they should override config headers', async () => {
    // Given: Configuration and request with conflicting headers
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
      },
    };
    const client = new HttpClient(config);

    // When: Making request with overriding headers
    const options: RequestInit = {
      headers: {
        'X-Override-Test': 'request-value',
      },
    };

    await client.fetch('https://example.com', options);

    // Then: Request headers should override config headers
    Assertions.http.shouldHaveMadeRequest(
      mock,
      'https://example.com',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Override-Test': 'request-value',
        }),
      })
    );
  });

  test('TC-HC-014-03 [P2]: Given Headers object, when request is made, then it should be handled correctly', async () => {
    // Given: Headers object instead of plain object
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
    headers.set('Content-Type', 'application/json');
    headers.set('X-Custom', 'value');

    // When: Making request with Headers object
    const options: RequestInit = {
      method: 'POST',
      headers: headers,
    };

    await client.fetch('https://api.example.com', options);

    // Then: Should handle Headers object correctly
    expect(mock).toHaveBeenCalledWith(
      'https://api.example.com',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'content-type': 'application/json',
          'x-custom': 'value',
        }),
      })
    );
  });

  test('TC-HC-014-04 [P2]: Given user agent configuration, when request is made, then it should use custom user agent', async () => {
    // Given: Custom user agent
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
      userAgent: 'custom-agent/2.0.0',
    };
    const client = new HttpClient(config);

    // When: Making request
    await client.fetch('https://example.com');

    // Then: Should use custom user agent
    expect(mock).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': 'custom-agent/2.0.0',
        }),
      })
    );
  });

  test('TC-HC-014-05 [P2]: Given special characters in headers, when request is made, then they should be handled correctly', async () => {
    // Given: Headers with special characters
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
      headers: {
        'X-Special-Chars': 'test with spaces & symbols!',
        'X-Unicode': '测试中文字符',
        'X-Emoji': '🚀 🎉',
      },
    };
    const client = new HttpClient(config);

    // When: Making request
    await client.fetch('https://example.com');

    // Then: Should handle special characters correctly
    expect(mock).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Special-Chars': 'test with spaces & symbols!',
          'X-Unicode': '测试中文字符',
          'X-Emoji': '🚀 🎉',
        }),
      })
    );
  });

  test('TC-HC-014-06 [P2]: Given empty headers object, when request is made, then it should use only default headers', async () => {
    // Given: Empty headers in configuration
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
      headers: {}, // Empty headers object
    };
    const client = new HttpClient(config);

    // When: Making request
    await client.fetch('https://example.com');

    // Then: Should use only default headers
    expect(mock).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('docs-scrape'),
          Accept: expect.stringContaining('text/html'),
          'Accept-Language': expect.stringContaining('en-US'),
          'Accept-Encoding': 'gzip, deflate',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }),
      })
    );
  });
});

describe('HTTP Client - Response Processing', () => {
  setupHttpClientTest();

  test('TC-HC-015-01 [P1]: Given successful response, when fetch is called, then it should return Response object', async () => {
    // Given: Successful response
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

    // When: Making request
    const response = await client.fetch('https://example.com');

    // Then: Should return HttpResponse object
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
    expect(await response.text()).toContain('Success');
  });

  test('TC-HC-015-02 [P1]: Given JSON response, when fetch is called, then it should handle JSON correctly', async () => {
    // Given: JSON response
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(
        new Response('{"message": "Hello, World!", "success": true}', {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
        })
      )
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request
    const response = await client.fetch('https://api.example.com');

    // Then: Should handle JSON correctly
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/json');
    const data = (await response.json()) as { message: string; success: boolean };
    expect(data.message).toBe('Hello, World!');
    expect(data.success).toBe(true);
  });

  test('TC-HC-015-03 [P2]: Given binary response, when fetch is called, then it should handle binary data correctly', async () => {
    // Given: Binary response
    const mock = TestData.httpClient.givenWorkingConnection();
    // eslint-disable-next-line unicorn/number-literal-case
    const binaryData = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG signature
    mock.mockImplementation(() =>
      Promise.resolve(
        new Response(binaryData, {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'image/png' },
        })
      )
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request
    const response = await client.fetch('https://example.com/image.png');

    // Then: Should handle binary data correctly
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/png');
    const responseData = await response.arrayBuffer();
    const responseArray = new Uint8Array(responseData);
    expect(responseArray).toEqual(binaryData);
  });

  test('TC-HC-015-04 [P2]: Given response with custom headers, when fetch is called, then it should preserve headers', async () => {
    // Given: Response with custom headers
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(
        new Response('Custom response body', {
          status: 200,
          statusText: 'OK',
          headers: {
            'X-Custom-Header': 'custom-value',
            'X-Rate-Limit-Remaining': '100',
            'Cache-Control': 'max-age=3600',
          },
        })
      )
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request
    const response = await client.fetch('https://example.com');

    // Then: Should preserve response headers
    expect(response.status).toBe(200);
    expect(response.headers['x-custom-header']).toBe('custom-value');
    expect(response.headers['x-rate-limit-remaining']).toBe('100');
    expect(response.headers['cache-control']).toBe('max-age=3600');
  });

  test('TC-HC-015-05 [P2]: Given response with different status codes, when fetch is called, then it should handle all appropriately', async () => {
    // Given: Various successful response status codes (2xx only)
    const statusScenarios = [
      { status: 200, ok: true, statusText: 'OK' },
      { status: 201, ok: true, statusText: 'Created' },
      { status: 204, ok: true, statusText: 'No Content' },
    ];

    for (const scenario of statusScenarios) {
      // Given: Specific status code
      const mock = TestData.httpClient.givenWorkingConnection();
      mock.mockImplementation(() =>
        Promise.resolve(
          new Response('Response body', {
            status: scenario.status,
            statusText: scenario.statusText,
          })
        )
      );

      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 10,
      };
      const client = new HttpClient(config);

      // When: Making request
      const response = await client.fetch('https://example.com');

      // Then: Should handle status correctly
      expect(response.status).toBe(scenario.status);
      expect(response.ok).toBe(scenario.ok);
      expect(response.statusText).toBe(scenario.statusText);
    }
  });
});
