/**
 * Unit tests for Types Module - HTTP Types
 * Tests for HttpClientConfig, HttpResponse, HttpError and related HTTP type definitions
 */

import { test, expect, describe } from 'bun:test';
import type { HttpClientConfig, HttpResponse, HttpError, RetryConfig, RateLimiter } from '@/types';

describe('HttpClientConfig', () => {
  test('should accept complete HTTP client configuration', () => {
    // Given: A complete HTTP client configuration
    const config: HttpClientConfig = {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 50,
      timeout: 30000,
      userAgent: 'Test-Agent/1.0',
      headers: {
        'Accept-Language': 'en-US',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Cache-Control': 'no-cache',
      },
    };

    // Then: Should accept the configuration
    expect(config.retryAttempts).toBe(3);
    expect(config.retryDelay).toBe(1000);
    expect(config.rateLimit).toBe(50);
    expect(config.timeout).toBe(30000);
    expect(config.userAgent).toBe('Test-Agent/1.0');
    expect(config.headers).toBeDefined();
  });

  test('should accept minimal HTTP client configuration', () => {
    // Given: A minimal HTTP client configuration
    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 500,
      rateLimit: 100,
    };

    // Then: Should accept minimal configuration
    expect(config.retryAttempts).toBe(1);
    expect(config.retryDelay).toBe(500);
    expect(config.rateLimit).toBe(100);
    expect(config.timeout).toBeUndefined();
    expect(config.userAgent).toBeUndefined();
    expect(config.headers).toBeUndefined();
  });

  test('should support custom headers', () => {
    // Given: Configuration with custom headers
    const config: HttpClientConfig = {
      retryAttempts: 2,
      retryDelay: 750,
      rateLimit: 25,
      headers: {
        Authorization: 'Bearer token123',
        'X-API-Key': 'api-key-value',
        'Custom-Header': 'custom-value',
      },
    };

    // Then: Should preserve custom headers and configuration
    expect(config.retryAttempts).toBe(2);
    expect(config.retryDelay).toBe(750);
    expect(config.rateLimit).toBe(25);
    expect(config.headers?.Authorization).toBe('Bearer token123');
    expect(config.headers?.['X-API-Key']).toBe('api-key-value');
    expect(config.headers?.['Custom-Header']).toBe('custom-value');
  });
});

describe('HttpResponse', () => {
  test('should represent HTTP response structure', () => {
    // Given: An HTTP response
    const response: HttpResponse = {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'text/html',
        'content-length': '1024',
      },
      url: 'https://example.com',
      ok: true,
      redirected: false,
      text: async () => 'response text',
      json: async () => ({}),
      arrayBuffer: async () => new ArrayBuffer(0),
    };

    // Then: Should have correct structure
    expect(response.status).toBe(200);
    expect(response.statusText).toBe('OK');
    expect(response.headers['content-type']).toBe('text/html');
    expect(response.headers['content-length']).toBe('1024');
    expect(response.url).toBe('https://example.com');
    expect(response.ok).toBe(true);
    expect(response.redirected).toBe(false);
    // Verify response methods exist
    expect(typeof response.text).toBe('function');
    expect(typeof response.json).toBe('function');
    expect(typeof response.arrayBuffer).toBe('function');
  });

  test('should handle error responses', () => {
    // Given: An error response
    const response: HttpResponse = {
      status: 404,
      statusText: 'Not Found',
      headers: {
        'content-type': 'text/html',
      },
      url: 'https://example.com/not-found',
      ok: false,
      redirected: false,
      text: async () => 'response text',
      json: async () => ({}),
      arrayBuffer: async () => new ArrayBuffer(0),
    };

    // Then: Should handle error status
    expect(response.status).toBe(404);
    expect(response.statusText).toBe('Not Found');
    expect(response.headers['content-type']).toBe('text/html');
    expect(response.url).toBe('https://example.com/not-found');
    expect(response.ok).toBe(false);
    expect(response.redirected).toBe(false);
    // Verify response methods exist
    expect(typeof response.text).toBe('function');
    expect(typeof response.json).toBe('function');
    expect(typeof response.arrayBuffer).toBe('function');
  });

  test('should handle redirected responses', () => {
    // Given: A redirected response
    const response: HttpResponse = {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
      },
      url: 'https://example.com/final',
      ok: true,
      redirected: true,
      text: async () => 'response text',
      json: async () => ({}),
      arrayBuffer: async () => new ArrayBuffer(0),
    };

    // Then: Should handle redirect
    expect(response.status).toBe(200);
    expect(response.statusText).toBe('OK');
    expect(response.headers['content-type']).toBe('application/json');
    expect(response.url).toBe('https://example.com/final');
    expect(response.ok).toBe(true);
    expect(response.redirected).toBe(true);
    // Verify response methods exist
    expect(typeof response.text).toBe('function');
    expect(typeof response.json).toBe('function');
    expect(typeof response.arrayBuffer).toBe('function');
  });
});

describe('HttpError', () => {
  test('should represent HTTP error structure', () => {
    // Given: An HTTP error
    const error: HttpError = {
      name: 'HttpError',
      message: 'Request failed',
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      response: {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        url: 'https://example.com',
        ok: false,
        redirected: false,
        text: async () => 'response text',
        json: async () => ({}),
        arrayBuffer: async () => new ArrayBuffer(0),
      },
    };

    // Then: Should have correct error structure
    expect(error.name).toBe('HttpError');
    expect(error.message).toBe('Request failed');
    expect(error.status).toBe(500);
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(error.response).toBeDefined();
    if (error.response) {
      expect(error.response.status).toBe(500);
      expect(error.response.statusText).toBe('Internal Server Error');
      expect(error.response.headers).toEqual({});
      expect(error.response.url).toBe('https://example.com');
      expect(error.response.ok).toBe(false);
      expect(error.response.redirected).toBe(false);
      // Verify response methods exist
      expect(typeof error.response.text).toBe('function');
      expect(typeof error.response.json).toBe('function');
      expect(typeof error.response.arrayBuffer).toBe('function');
    }
  });

  test('should handle network errors', () => {
    // Given: A network error
    const error: HttpError = {
      name: 'NetworkError',
      message: 'Network request failed',
      code: 'NETWORK_ERROR',
    };

    // Then: Should handle network error
    expect(error.name).toBe('NetworkError');
    expect(error.message).toBe('Network request failed');
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.status).toBeUndefined();
    expect(error.response).toBeUndefined();
  });

  test('should handle timeout errors', () => {
    // Given: A timeout error
    const error: HttpError = {
      name: 'TimeoutError',
      message: 'Request timeout',
      code: 'TIMEOUT',
      timeout: 30000,
    };

    // Then: Should handle timeout error
    expect(error.name).toBe('TimeoutError');
    expect(error.message).toBe('Request timeout');
    expect(error.code).toBe('TIMEOUT');
    expect(error.timeout).toBe(30000);
  });
});

describe('RetryConfig', () => {
  test('should represent retry configuration', () => {
    // Given: A retry configuration
    const config: RetryConfig = {
      attempts: 3,
      delay: 1000,
      backoff: 'exponential',
      maxDelay: 10000,
    };

    // Then: Should have correct structure
    expect(config.attempts).toBe(3);
    expect(config.delay).toBe(1000);
    expect(config.backoff).toBe('exponential');
    expect(config.maxDelay).toBe(10000);
  });

  test('should support linear backoff', () => {
    // Given: Linear backoff configuration
    const config: RetryConfig = {
      attempts: 5,
      delay: 500,
      backoff: 'linear',
    };

    // Then: Should support linear backoff
    expect(config.attempts).toBe(5);
    expect(config.delay).toBe(500);
    expect(config.backoff).toBe('linear');
    expect(config.maxDelay).toBeUndefined();
  });
});

describe('RateLimiter', () => {
  test('should represent rate limiter configuration', () => {
    // Given: A rate limiter configuration
    const limiter: RateLimiter = {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
    };

    // Then: Should have correct structure
    expect(limiter.maxRequests).toBe(100);
    expect(limiter.windowMs).toBe(60000);
  });

  test('should support fixed window strategy', () => {
    // Given: Fixed window rate limiter
    const limiter: RateLimiter = {
      maxRequests: 50,
      windowMs: 30000, // 30 seconds
    };

    // Then: Should support fixed window
    expect(limiter.maxRequests).toBe(50);
    expect(limiter.windowMs).toBe(30000);
  });
});
