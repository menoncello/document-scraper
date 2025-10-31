/**
 * Unit tests for config-validator.ts - Field Validation
 * Tests for field name and selector validation rules
 */

import { test, expect } from 'bun:test';
import { validateConfig } from '../../../../src/index';
import type { ScrapingConfig } from '../../../../src/types';

test('validateConfig should return errors for empty field names', () => {
  // Given: A config with empty field name
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        '': 'h1', // Empty field name
        title: '.title',
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

  // Then: Should detect empty field name
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Field names cannot be empty');
});

test('validateConfig should return errors for whitespace-only field names', () => {
  // Given: A config with whitespace-only field name
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        '   ': 'h1', // Whitespace-only field name
        title: '.title',
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

  // Then: Should detect empty field name
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Field names cannot be empty');
});

test('validateConfig should return errors for invalid selectors', () => {
  // Given: A config with invalid selector
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: '', // Empty selector
        content: '.content',
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

  // Then: Should detect invalid selector
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Field "title" has invalid selector: ');
});

test('validateConfig should return errors for non-string selectors', () => {
  // Given: A config with non-string selector
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 123 as any, // Number instead of string
        content: '.content',
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

  // Then: Should detect invalid selector
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Field "title" has invalid selector: 123');
});

test('validateConfig should return errors for whitespace-only selectors', () => {
  // Given: A config with whitespace-only selector
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: '   ', // Whitespace-only selector
        content: '.content',
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

  // Then: Should detect invalid selector
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Field "title" has invalid selector:    ');
});
