/**
 * Unit tests for HttpClient - Basic Client Functionality
 * Tests for basic HTTP client initialization and configuration
 */

import { test, expect, mock, beforeEach } from 'bun:test';
import { HttpClient } from '../../../../src/core/http-client';
import type { HttpClientConfig } from '../../../../src/types';
import { MockResponseFactory } from '../../../factories/mock-response.factory';
import { createHttpClientConfig } from '../../../utils/factories/config-factory';

// Mock fetch globally
const mockFetch = mock(() =>
  Promise.resolve(MockResponseFactory.html('<html><body>Test content</body></html>'))
);

// Create global fetch with mock methods
(global as any).fetch = Object.assign(mockFetch, {
  preconnect: mock(() => Promise.resolve()),
});

beforeEach(() => {
  // Reset mock before each test
  (global as any).fetch.mockClear();
});

test('TC-HC-101-01 [P0]: HttpClient should initialize with default config', () => {
  // Given: An HTTP client configuration
  const config = createHttpClientConfig({
    retryAttempts: 3,
    retryDelay: 1000,
    rateLimit: 10,
  });

  // When: Creating an HTTP client with the configuration
  const client = new HttpClient(config);
  const clientConfig = client.getConfig();

  // Then: Should initialize with the provided configuration and defaults
  expect(clientConfig.retryAttempts).toBe(3);
  expect(clientConfig.retryDelay).toBe(1000);
  expect(clientConfig.rateLimit).toBe(10);
  expect(clientConfig.timeout).toBe(10000); // factory default
  expect(clientConfig.userAgent).toBe('TestAgent/1.0');
});

test('TC-HC-101-02 [P1]: HttpClient should merge custom config with defaults', () => {
  const config: HttpClientConfig = {
    retryAttempts: 5,
    retryDelay: 2000,
    rateLimit: 20,
    timeout: 60000,
    userAgent: 'custom-agent/2.0.0',
    headers: { 'Custom-Header': 'value' },
  };

  const client = new HttpClient(config);
  const clientConfig = client.getConfig();

  expect(clientConfig.retryAttempts).toBe(5);
  expect(clientConfig.retryDelay).toBe(2000);
  expect(clientConfig.rateLimit).toBe(20);
  expect(clientConfig.timeout).toBe(60000);
  expect(clientConfig.userAgent).toBe('custom-agent/2.0.0');
  expect(clientConfig.headers).toEqual({ 'Custom-Header': 'value' });
});

test('TC-HC-102-01 [P0]: HttpClient should make successful fetch request', async () => {
  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 100,
    rateLimit: 10,
  };

  const client = new HttpClient(config);
  const response = await client.fetch('https://example.com');

  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith(
    'https://example.com',
    expect.objectContaining({
      headers: expect.objectContaining({
        'User-Agent': 'docs-scrape/1.0.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }),
      signal: expect.any(AbortSignal),
    })
  );

  expect(response.status).toBe(200);
  expect(response.ok).toBe(true);
  const text = await response.text();
  expect(text).toBe('<html><body>Test content</body></html>');
});

test('TC-HC-106-01 [P2]: HttpClient should update configuration', () => {
  const config: HttpClientConfig = {
    retryAttempts: 3,
    retryDelay: 1000,
    rateLimit: 10,
  };

  const client = new HttpClient(config);

  const newConfig: Partial<HttpClientConfig> = {
    retryAttempts: 5,
    userAgent: 'updated-agent/1.0.0',
  };

  client.updateConfig(newConfig);
  const updatedConfig = client.getConfig();

  expect(updatedConfig.retryAttempts).toBe(5);
  expect(updatedConfig.retryDelay).toBe(1000); // unchanged
  expect(updatedConfig.rateLimit).toBe(10); // unchanged
  expect(updatedConfig.userAgent).toBe('updated-agent/1.0.0');
});

test('TC-HC-107-01 [P2]: HttpClient should reset rate limiter', () => {
  const config: HttpClientConfig = {
    retryAttempts: 1,
    retryDelay: 100,
    rateLimit: 10,
  };

  const client = new HttpClient(config);

  // This test verifies that the rate limiter can be reset
  // The actual implementation would be tested in a rate limiter-specific test
  expect(() => client.resetRateLimiter()).not.toThrow();
});
