import { test, expect, describe, mock, beforeEach, afterEach } from 'bun:test';
import { HttpClient } from '../../../src/core/index';
import type { HttpClientConfig } from '../../../src/types';
import type { FetchMock } from '../../helpers/test-setup.helper';

describe('HTTP Client - Update Config Method (Lines 479-498)', () => {
  beforeEach(() => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response('Success', { status: 200 }))
    ) as FetchMock;
    fetchMock.preconnect = (
      _url: string | URL,
      _options?: { dns?: boolean; tcp?: boolean; http?: boolean; https?: boolean }
    ) => {
      // Mock preconnect functionality - no-op for tests
    };
    global.fetch = fetchMock;
  });

  afterEach(() => {
    mock.restore();
  });

  describe('updateConfig method', () => {
    test('should update configuration values', () => {
      const initialConfig: HttpClientConfig = {
        retryAttempts: 2,
        retryDelay: 500,
        rateLimit: 5,
        timeout: 30000,
        userAgent: 'initial-agent/1.0.0',
        headers: { 'X-Initial': 'initial-value' },
      };

      const client = new HttpClient(initialConfig);

      // Update config with new values
      const newConfig: Partial<HttpClientConfig> = {
        retryAttempts: 5,
        timeout: 60000,
        userAgent: 'updated-agent/2.0.0',
        headers: { 'X-Updated': 'updated-value' },
      };

      client.updateConfig(newConfig);

      const updatedConfig = client.getConfig();

      // Should have updated values
      expect(updatedConfig.retryAttempts).toBe(5);
      expect(updatedConfig.timeout).toBe(60000);
      expect(updatedConfig.userAgent).toBe('updated-agent/2.0.0');
      expect(updatedConfig.headers).toEqual({ 'X-Updated': 'updated-value' });

      // Should preserve unchanged values
      expect(updatedConfig.retryDelay).toBe(500); // Unchanged
      expect(updatedConfig.rateLimit).toBe(5); // Unchanged
    });

    test('should handle zero rate limit update', () => {
      const initialConfig: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 100,
        rateLimit: 10,
      };

      const client = new HttpClient(initialConfig);

      // Update rate limit to zero
      client.updateConfig({ rateLimit: 0 });

      const updatedConfig = client.getConfig();
      expect(updatedConfig.rateLimit).toBe(0);
    });

    test('should handle fractional rate limit update less than 1', () => {
      const initialConfig: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 100,
        rateLimit: 10,
      };

      const client = new HttpClient(initialConfig);

      // Update rate limit to fractional value
      client.updateConfig({ rateLimit: 0.5 });

      const updatedConfig = client.getConfig();
      expect(updatedConfig.rateLimit).toBe(0.5);
    });

    test('should handle rate limit update greater than 1', () => {
      const initialConfig: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 100,
        rateLimit: 1,
      };

      const client = new HttpClient(initialConfig);

      // Update rate limit to value greater than 1
      client.updateConfig({ rateLimit: 15.7 });

      const updatedConfig = client.getConfig();
      expect(updatedConfig.rateLimit).toBe(15.7);
    });

    test('should handle negative rate limit update', () => {
      const initialConfig: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 100,
        rateLimit: 10,
      };

      const client = new HttpClient(initialConfig);

      // Update rate limit to negative value
      client.updateConfig({ rateLimit: -3 });

      const updatedConfig = client.getConfig();
      expect(updatedConfig.rateLimit).toBe(-3);
    });

    test('should handle partial config update without rate limit', () => {
      const initialConfig: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 100,
        rateLimit: 5,
        timeout: 30000,
        userAgent: 'initial-agent/1.0.0',
      };

      const client = new HttpClient(initialConfig);

      // Update config without changing rate limit
      const newConfig: Partial<HttpClientConfig> = {
        retryAttempts: 3,
        timeout: 45000,
        userAgent: 'partial-agent/1.0.0',
      };

      client.updateConfig(newConfig);

      const updatedConfig = client.getConfig();

      // Should have updated values
      expect(updatedConfig.retryAttempts).toBe(3);
      expect(updatedConfig.timeout).toBe(45000);
      expect(updatedConfig.userAgent).toBe('partial-agent/1.0.0');

      // Should preserve rate limit
      expect(updatedConfig.rateLimit).toBe(5);

      // Should preserve unchanged values
      expect(updatedConfig.retryDelay).toBe(100);
    });

    test('should handle empty config update', () => {
      const initialConfig: HttpClientConfig = {
        retryAttempts: 2,
        retryDelay: 500,
        rateLimit: 10,
        timeout: 30000,
        userAgent: 'initial-agent/1.0.0',
      };

      const client = new HttpClient(initialConfig);
      const originalConfig = client.getConfig();

      // Update with empty config
      client.updateConfig({});

      const updatedConfig = client.getConfig();

      // Should have same values as before
      expect(updatedConfig).toEqual(originalConfig);
    });

    test('should handle updating headers to undefined', () => {
      const initialConfig: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 100,
        rateLimit: 10,
        headers: { 'X-Initial': 'value' },
      };

      const client = new HttpClient(initialConfig);

      // Update headers to undefined
      client.updateConfig({ headers: undefined });

      const updatedConfig = client.getConfig();
      expect(updatedConfig.headers).toBeUndefined();
    });

    test('should handle updating user agent to undefined', () => {
      const initialConfig: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 100,
        rateLimit: 10,
        userAgent: 'initial-agent/1.0.0',
      };

      const client = new HttpClient(initialConfig);

      // Update user agent to undefined
      client.updateConfig({ userAgent: undefined });

      const updatedConfig = client.getConfig();
      expect(updatedConfig.userAgent).toBeUndefined();
    });

    test('should preserve rate limiter behavior after config update', async () => {
      const mockFetch = mock(() =>
        Promise.resolve(new Response('Success', { status: 200 }))
      ) as FetchMock;
      mockFetch.preconnect = (
        _url: string | URL,
        _options?: { dns?: boolean; tcp?: boolean; http?: boolean; https?: boolean }
      ) => {
        // Mock preconnect functionality - no-op for tests
      };
      global.fetch = mockFetch;

      const initialConfig: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 2, // Start with low rate limit
      };

      const client = new HttpClient(initialConfig);

      // Make a request to initialize rate limiter
      await client.fetch('https://example.com');

      // Update rate limit to higher value
      client.updateConfig({ rateLimit: 10 });

      const updatedConfig = client.getConfig();
      expect(updatedConfig.rateLimit).toBe(10);

      // Should be able to make requests without being overly limited
      const startTime = Date.now();
      const promises = Array.from({ length: 3 }, (_, i) =>
        client.fetch(`https://example.com/page${i + 1}.html`)
      );
      await Promise.all(promises);
      const endTime = Date.now();

      // Should complete relatively quickly with higher rate limit
      expect(endTime - startTime).toBeLessThan(1000);
      expect(mockFetch).toHaveBeenCalledTimes(4); // 1 initial + 3 after update
    });

    test('should handle rate limit update during active requests', async () => {
      const mockFetch = mock(() =>
        Promise.resolve(new Response('Success', { status: 200 }))
      ) as FetchMock;
      mockFetch.preconnect = (
        _url: string | URL,
        _options?: { dns?: boolean; tcp?: boolean; http?: boolean; https?: boolean }
      ) => {
        // Mock preconnect functionality - no-op for tests
      };
      global.fetch = mockFetch;

      const initialConfig: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 1,
      };

      const client = new HttpClient(initialConfig);

      // Start a request
      const request1 = client.fetch('https://example.com/page1.html');

      // Update config while request is in progress
      client.updateConfig({ rateLimit: 5, timeout: 60000 });

      await request1;

      const updatedConfig = client.getConfig();
      expect(updatedConfig.rateLimit).toBe(5);
      expect(updatedConfig.timeout).toBe(60000);

      // Should be able to make more requests with new rate limit
      await client.fetch('https://example.com/page2.html');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getConfig method', () => {
    test('should return a copy of the configuration', () => {
      const initialConfig: HttpClientConfig = {
        retryAttempts: 2,
        retryDelay: 500,
        rateLimit: 10,
        timeout: 30000,
        userAgent: 'test-agent/1.0.0',
        headers: { 'X-Test': 'value' },
      };

      const client = new HttpClient(initialConfig);
      const config1 = client.getConfig();
      const config2 = client.getConfig();

      // Should return equal but different objects
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different object references

      // Modifying returned config should not affect client
      (config1 as any).retryAttempts = 999;

      const config3 = client.getConfig();
      expect(config3.retryAttempts).toBe(2); // Should remain unchanged
    });
  });

  describe('resetRateLimiter method', () => {
    test('should reset rate limiter state', async () => {
      const mockFetch = mock(() =>
        Promise.resolve(new Response('Success', { status: 200 }))
      ) as FetchMock;
      mockFetch.preconnect = (
        _url: string | URL,
        _options?: { dns?: boolean; tcp?: boolean; http?: boolean; https?: boolean }
      ) => {
        // Mock preconnect functionality - no-op for tests
      };
      global.fetch = mockFetch;

      const config: HttpClientConfig = {
        retryAttempts: 1,
        retryDelay: 10,
        rateLimit: 2,
      };

      const client = new HttpClient(config);

      // Make several requests to populate rate limiter
      await client.fetch('https://example.com/page1.html');
      await client.fetch('https://example.com/page2.html');

      // Reset rate limiter
      client.resetRateLimiter();

      // Should be able to make request immediately after reset
      const startTime = Date.now();
      await client.fetch('https://example.com/page3.html');
      const endTime = Date.now();

      // Should complete quickly (not wait for rate limit)
      expect(endTime - startTime).toBeLessThan(100);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('should not affect other configuration when resetting rate limiter', () => {
      const config: HttpClientConfig = {
        retryAttempts: 3,
        retryDelay: 1000,
        rateLimit: 5,
        timeout: 60000,
        userAgent: 'test-agent/1.0.0',
        headers: { 'X-Test': 'value' },
      };

      const client = new HttpClient(config);

      // Reset rate limiter
      client.resetRateLimiter();

      // Other config should remain unchanged
      const currentConfig = client.getConfig();
      expect(currentConfig.retryAttempts).toBe(3);
      expect(currentConfig.retryDelay).toBe(1000);
      expect(currentConfig.rateLimit).toBe(5);
      expect(currentConfig.timeout).toBe(60000);
      expect(currentConfig.userAgent).toBe('test-agent/1.0.0');
      expect(currentConfig.headers).toEqual({ 'X-Test': 'value' });
    });
  });
});
