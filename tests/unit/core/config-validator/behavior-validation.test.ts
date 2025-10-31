/**
 * Unit tests for config-validator.ts - Behavior Configuration Validation
 * Tests for behavior configuration validation rules
 */

import { test, expect } from 'bun:test';
import { validateConfig } from '../../../../src/index';
import type { ScrapingConfig } from '../../../../src/types';

test('validateConfig should return errors for negative retry attempts', () => {
  // Given: A config with negative retry attempts
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: -1, // Negative retry attempts
      retryDelay: 1000,
      rateLimit: 10,
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect negative retry attempts
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Retry attempts must be a non-negative number');
});

test('validateConfig should return errors for non-numeric retry attempts', () => {
  // Given: A config with non-numeric retry attempts
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: '3' as any, // String instead of number
      retryDelay: 1000,
      rateLimit: 10,
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect non-numeric retry attempts
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Retry attempts must be a non-negative number');
});

test('validateConfig should return errors for negative retry delay', () => {
  // Given: A config with negative retry delay
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: -500, // Negative retry delay
      rateLimit: 10,
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect negative retry delay
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Retry delay must be a non-negative number');
});

test('validateConfig should return errors for non-numeric retry delay', () => {
  // Given: A config with non-numeric retry delay
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: '1000' as any, // String instead of number
      rateLimit: 10,
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect non-numeric retry delay
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Retry delay must be a non-negative number');
});

test('validateConfig should handle undefined rate limit without errors', () => {
  // Given: A config with undefined rate limit
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: undefined as any, // Undefined rate limit
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should handle undefined rate limit gracefully
  expect(_result.valid).toBe(true);
  expect(_result.errors).toHaveLength(0);
});

test('validateConfig should return errors for non-positive rate limit', () => {
  // Given: A config with zero rate limit
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 0, // Zero rate limit
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect non-positive rate limit
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Rate limit must be a positive number');
});

test('validateConfig should return errors for negative rate limit', () => {
  // Given: A config with negative rate limit
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: -5, // Negative rate limit
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect negative rate limit
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Rate limit must be a positive number');
});

test('validateConfig should return errors for non-numeric rate limit', () => {
  // Given: A config with non-numeric rate limit
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: '10' as any, // String instead of number
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect non-numeric rate limit
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Rate limit must be a positive number');
});

test('validateConfig should return errors for non-string user agent', () => {
  // Given: A config with non-string user agent
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
      userAgent: 123 as any, // Number instead of string
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect non-string user agent
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('User agent must be a string');
});

test('validateConfig should return errors for non-object headers', () => {
  // Given: A config with non-object headers
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
      headers: 'Content-Type: application/json' as any, // String instead of object
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect non-object headers
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Headers must be an object');
});
