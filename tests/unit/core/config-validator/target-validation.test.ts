/**
 * Unit tests for config-validator.ts - Target Configuration Validation
 * Tests for target configuration validation rules
 */

import { test, expect } from 'bun:test';
import { validateConfig } from '../../../../src/index';
import type { ScrapingConfig } from '../../../../src/types';

test('validateConfig should return errors for negative waitFor values', () => {
  // Given: A config with negative waitFor
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
      waitFor: -1000, // Negative wait time
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
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect negative waitFor
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Target waitFor must be a non-negative number');
});

test('validateConfig should return errors for non-numeric waitFor values', () => {
  // Given: A config with non-numeric waitFor
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
      waitFor: '1000' as any, // String instead of number
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
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect non-numeric waitFor
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Target waitFor must be a non-negative number');
});
