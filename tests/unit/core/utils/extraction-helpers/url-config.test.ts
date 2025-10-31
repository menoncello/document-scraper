/**
 * Unit tests for Extraction Helpers - createUrlConfig Function
 * Tests for URL-specific configuration creation
 */

import { test, expect, describe } from 'bun:test';
import { createUrlConfig } from '../../../../../src/core/utils/extraction-helpers';
import type { ScrapingConfig } from '../../../../../src/types/index';
import { HttpClientConfigFactory } from '../../../../../tests/factories/http-client-config.factory';

describe('createUrlConfig - basic configuration', () => {
  test('should create URL-specific configuration from base config', () => {
    // Given: A base configuration and target URL
    const baseConfig: ScrapingConfig = {
      target: { url: '', selector: 'body' },
      extraction: { fields: { title: 'h1' } },
      output: { format: 'json' },
      behavior: HttpClientConfigFactory.basic(),
    };
    const targetUrl = 'https://specific.example.com';

    // When: Creating URL-specific config
    const config = createUrlConfig(baseConfig, targetUrl);

    // Then: Should update URL while preserving other settings
    expect(config.target.url).toBe(targetUrl);
    expect(config.target.selector).toBe('body');
    expect(config.extraction.fields).toEqual({ title: 'h1' });
    expect(config.output.format).toBe('json');
    expect(config.behavior).toEqual(baseConfig.behavior);
  });

  test('should not modify original base config', () => {
    // Given: A base configuration
    const baseConfig: ScrapingConfig = {
      target: { url: '', selector: 'main' },
      extraction: { fields: { content: 'p' } },
      output: { format: 'json' },
      behavior: HttpClientConfigFactory.basic(),
    };
    const originalUrl = baseConfig.target.url;

    // When: Creating URL-specific config
    const config = createUrlConfig(baseConfig, 'https://new.example.com');

    // Then: Original config should remain unchanged
    expect(baseConfig.target.url).toBe(originalUrl);
    expect(config.target.url).toBe('https://new.example.com');
  });
});

describe('createUrlConfig - complex configuration', () => {
  test('should handle complex target configurations', () => {
    // Given: Base config with complex target settings
    const baseConfig: ScrapingConfig = {
      target: { url: '', selector: 'article', waitFor: 1000 },
      extraction: { fields: { title: 'h1', content: '.content' } },
      output: { format: 'json' },
      behavior: HttpClientConfigFactory.basic(),
    };
    const targetUrl = 'https://complex.example.com';

    // When: Creating URL-specific config
    const config = createUrlConfig(baseConfig, targetUrl);

    // Then: Should preserve all target settings except URL
    expect(config.target.url).toBe(targetUrl);
    expect(config.target.selector).toBe('article');
    expect(config.target.waitFor).toBe(1000);
  });

  test('should handle empty URL', () => {
    // Given: Base config and empty URL
    const baseConfig: ScrapingConfig = {
      target: { url: 'original', selector: 'body' },
      extraction: { fields: {} },
      output: { format: 'json' },
      behavior: HttpClientConfigFactory.basic(),
    };

    // When: Creating URL config with empty URL
    const config = createUrlConfig(baseConfig, '');

    // Then: Should set empty URL
    expect(config.target.url).toBe('');
  });
});
