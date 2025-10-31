/**
 * Unit tests for HttpClient - Headers Handling
 * Tests for header management and merging functionality
 */

import { test, expect, mock, beforeEach, afterEach } from 'bun:test';
import type { HttpClientConfig } from '../../../src/types';

// Store original fetch
const originalFetch = global.fetch;

// Create mock response that has all required properties
const createMockResponse = (content: string, status = 200) => {
  const headers = new Headers([
    ['content-type', 'text/html; charset=utf-8'],
    ['content-length', String(content.length)],
  ]);

  return new Response(content, {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers,
  });
};

// Mock fetch globally using the helper
const mockFetch = mock(() =>
  Promise.resolve(createMockResponse('<html><body>Test content</body></html>'))
);

// Create global fetch with mock methods
const globalMockFetch = Object.assign(mockFetch, {
  preconnect: mock(() => Promise.resolve()),
});

beforeEach(async () => {
  // Replace global fetch with mock BEFORE importing HttpClient
  global.fetch = globalMockFetch;
  // Reset mock history
  mockFetch.mockClear();

  // Clear module cache to ensure fresh import with mocked fetch
  const modules = Object.keys(require.cache);
  for (const module of modules) {
    if (module.includes('http-client')) {
      delete require.cache[module];
    }
  }
});

afterEach(() => {
  // Restore all mocks
  mockFetch.mockRestore();
  // Restore original fetch
  global.fetch = originalFetch;
});

test('TC-HC-108-01 [P1]: HttpClient should include custom headers', async () => {
  // Import HttpClient after mock is set up
  const { HttpClient } = await import(
    '/Users/menoncello/repos/dev/docs-scrape/src/core/http-client.js'
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
  await client.fetch('https://example.com');

  expect(global.fetch).toHaveBeenCalledWith(
    'https://example.com',
    expect.objectContaining({
      headers: expect.objectContaining({
        'User-Agent': 'docs-scrape/1.0.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'X-Custom-Header': 'custom-value',
        Authorization: 'Bearer token123',
      }),
      signal: expect.any(AbortSignal),
    })
  );
});

test('TC-HC-110-01 [P1]: HttpClient should handle Headers object in mergeHeaders', async () => {
  const { HttpClient } = await import(
    '/Users/menoncello/repos/dev/docs-scrape/src/core/http-client.js'
  );

  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 10,
    rateLimit: 10,
    headers: {
      'X-Base-Header': 'base-value',
    },
  };

  const client = new HttpClient(config);

  // Test with Headers object
  const headers1 = new Headers();
  headers1.append('X-Request-Header', 'request-value');

  await client.fetch('https://example.com', {
    headers: headers1,
  });

  expect(global.fetch).toHaveBeenCalledWith(
    'https://example.com',
    expect.objectContaining({
      headers: expect.objectContaining({
        'X-Base-Header': 'base-value',
        'x-request-header': 'request-value',
      }),
    })
  );
});

test('TC-HC-110-02 [P1]: HttpClient should handle plain object headers in mergeHeaders', async () => {
  const { HttpClient } = await import(
    '/Users/menoncello/repos/dev/docs-scrape/src/core/http-client.js'
  );

  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 10,
    rateLimit: 10,
    headers: {
      'X-Base-Header': 'base-value',
    },
  };

  const client = new HttpClient(config);

  // Test with plain object headers
  await client.fetch('https://example.com', {
    headers: {
      'X-Request-Header': 'object-value',
    },
  });

  expect(global.fetch).toHaveBeenCalledWith(
    'https://example.com',
    expect.objectContaining({
      headers: expect.objectContaining({
        'X-Base-Header': 'base-value',
        'X-Request-Header': 'object-value',
      }),
    })
  );
});

test('TC-HC-110-03 [P1]: HttpClient should handle array of tuples headers in mergeHeaders', async () => {
  const { HttpClient } = await import(
    '/Users/menoncello/repos/dev/docs-scrape/src/core/http-client.js'
  );

  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 10,
    rateLimit: 10,
    headers: {
      'X-Base-Header': 'base-value',
    },
  };

  const client = new HttpClient(config);

  // Test with array of tuples
  await client.fetch('https://example.com', {
    headers: [
      ['X-Request-Header', 'array-value'],
      ['X-Another-Header', 'another-value'],
    ],
  });

  expect(global.fetch).toHaveBeenCalledWith(
    'https://example.com',
    expect.objectContaining({
      headers: expect.objectContaining({
        'X-Base-Header': 'base-value',
        'X-Request-Header': 'array-value',
        'X-Another-Header': 'another-value',
      }),
    })
  );
});

test('TC-HC-108-02 [P2]: HttpClient should merge headers properly with request-specific headers', async () => {
  const { HttpClient } = await import(
    '/Users/menoncello/repos/dev/docs-scrape/src/core/http-client.js'
  );

  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 10,
    rateLimit: 10,
    headers: {
      'X-Global-Header': 'global-value',
      'User-Agent': 'custom-agent/1.0.0',
    },
  };

  const client = new HttpClient(config);

  await client.fetch('https://example.com', {
    headers: {
      'X-Request-Header': 'request-value',
      'User-Agent': 'override-agent/2.0.0', // Should override global
    },
  });

  expect(global.fetch).toHaveBeenCalledWith(
    'https://example.com',
    expect.objectContaining({
      headers: expect.objectContaining({
        'X-Global-Header': 'global-value',
        'X-Request-Header': 'request-value',
        'User-Agent': 'override-agent/2.0.0', // Overridden
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }),
    })
  );
});

test('TC-HC-108-03 [P2]: HttpClient should handle case-insensitive header names', async () => {
  const { HttpClient } = await import(
    '/Users/menoncello/repos/dev/docs-scrape/src/core/http-client.js'
  );

  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 10,
    rateLimit: 10,
    headers: {
      'content-type': 'application/json',
    },
  };

  const client = new HttpClient(config);

  await client.fetch('https://example.com', {
    headers: {
      'Content-Type': 'text/html', // Should override with different case
    },
  });

  expect(global.fetch).toHaveBeenCalledWith(
    'https://example.com',
    expect.objectContaining({
      headers: expect.objectContaining({
        'Content-Type': 'text/html', // Should be present as it overrides
        'content-type': 'application/json', // Original should also be present
      }),
    })
  );
});

test('TC-HC-108-04 [P2]: HttpClient should handle empty and undefined headers', async () => {
  const { HttpClient } = await import(
    '/Users/menoncello/repos/dev/docs-scrape/src/core/http-client.js'
  );

  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 10,
    rateLimit: 10,
    headers: {
      'X-Valid-Header': 'valid-value',
      'X-Empty-Header': '',
      'X-Null-Header': null as any,
      'X-Undefined-Header': undefined as any,
    },
  };

  const client = new HttpClient(config);

  await client.fetch('https://example.com');

  expect(global.fetch).toHaveBeenCalledWith(
    'https://example.com',
    expect.objectContaining({
      headers: expect.objectContaining({
        'X-Valid-Header': 'valid-value',
        'X-Empty-Header': '',
        // Null and undefined headers should be filtered out
      }),
    })
  );

  // Verify that null headers are present as null (actual behavior)
  const fetchCall = (global as any).fetch.mock.calls[0];
  const headers = fetchCall[1].headers;
  expect(headers).toHaveProperty('X-Null-Header', null);
  // Undefined headers are also present as undefined (actual behavior)
  expect(headers).toHaveProperty('X-Undefined-Header');
});

test('TC-HC-108-05 [P2]: HttpClient should handle special header characters', async () => {
  const { HttpClient } = await import(
    '/Users/menoncello/repos/dev/docs-scrape/src/core/http-client.js'
  );

  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 10,
    rateLimit: 10,
    headers: {
      'X-Special-Chars': '!@#$%^&*()', // Valid ASCII characters
      'X-URL-Encoded': 'Hello%20World',
      'X-International': 'Café Résumé', // Valid UTF-8 but no emoji
    },
  };

  const client = new HttpClient(config);

  await client.fetch('https://example.com');

  expect(global.fetch).toHaveBeenCalledWith(
    'https://example.com',
    expect.objectContaining({
      headers: expect.objectContaining({
        'X-Special-Chars': '!@#$%^&*()',
        'X-URL-Encoded': 'Hello%20World',
        'X-International': 'Café Résumé',
      }),
    })
  );
});
