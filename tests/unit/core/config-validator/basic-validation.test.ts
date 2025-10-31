/**
 * Unit tests for config-validator.ts - Basic Configuration Validation
 * Tests for missing/invalid basic configuration structures
 */

import { test, expect } from 'bun:test';
import { validateConfig } from '../../../../src/index';
import type { ScrapingConfig } from '../../../../src/types';

test('validateConfig should return errors for missing target configuration', () => {
  // Given: A config without target
  const config = {
    target: null,
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
  } as any;

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect missing target configuration
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Target configuration is required');
});

test('validateConfig should return errors for missing extraction configuration', () => {
  // Given: A config without extraction
  const config = {
    target: {
      url: 'https://example.com',
    },
    extraction: null,
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
    },
  } as any;

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect missing extraction configuration
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Extraction configuration is required');
});

test('validateConfig should return errors for missing output configuration', () => {
  // Given: A config without output
  const config = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: null,
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
    },
  } as any;

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect missing output configuration
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Output configuration is required');
});

test('validateConfig should return errors for missing behavior configuration', () => {
  // Given: A config without behavior
  const config = {
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
    behavior: null,
  } as any;

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should detect missing behavior configuration
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Behavior configuration is required');
});

test('validateConfig should return errors for invalid extraction multiple type', () => {
  // Given: A config with non-boolean extraction.multiple
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
      multiple: 'true' as any, // Invalid type
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

  // Then: Should detect invalid multiple type
  expect(_result.valid).toBe(false);
  expect(_result.errors).toContain('Extraction multiple must be a boolean');
});

test('validateConfig should handle valid configurations without errors', () => {
  // Given: A completely valid config
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
      selector: 'article',
      waitFor: 5000,
    },
    extraction: {
      fields: {
        title: 'h1',
        content: '.content',
        author: '.author',
      },
      multiple: true,
    },
    output: {
      format: 'json',
      filename: 'output.json',
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
      userAgent: 'test-agent/1.0.0',
      headers: {
        'Accept-Language': 'en-US',
        Accept: 'application/json',
      },
    },
  };

  // When: Validating the configuration
  const _result = validateConfig(config);

  // Then: Should be valid with no errors
  expect(_result.valid).toBe(true);
  expect(_result.errors).toHaveLength(0);
});
