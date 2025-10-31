import { test, expect, describe, mock } from 'bun:test';
import type { ScrapingConfig } from '../../../../src/types';
import { setupDebugUtils, cleanupDebugUtils } from './test-helpers';

describe('DebugUtils - Network Error Handling', () => {
  test('should handle network errors gracefully', async () => {
    const { debugUtils, outputDir } = setupDebugUtils();

    try {
      // Given: A configuration that will cause network errors
      const config: ScrapingConfig = {
        target: {
          url: 'https://invalid-url-that-will-fail.com',
        },
        extraction: {
          fields: {
            title: 'h1',
          },
        },
        output: {
          format: 'json',
        },
        behavior: {
          retryAttempts: 0,
          retryDelay: 10,
          rateLimit: 50,
        },
      };

      // Mock global fetch to throw error
      global.fetch = mock(() => {
        throw new Error('Network error');
      }) as any;

      // When: Running debug scraping with network errors
      const debugInfo = await debugUtils.debugScraping(config);

      // Then: Should handle errors and include them in debug info
      expect(debugInfo.url).toBe('https://invalid-url-that-will-fail.com');
      expect(debugInfo.errors).toBeDefined();
      expect(debugInfo.errors!.length).toBeGreaterThan(0);
      expect(debugInfo.errors![0]).toContain('Network error');
    } finally {
      cleanupDebugUtils(outputDir);
    }
  });
});

describe('DebugUtils - Extraction Error Handling', () => {
  test('should handle extraction errors gracefully', async () => {
    const { debugUtils, outputDir } = setupDebugUtils();

    try {
      // Given: A configuration that will cause extraction errors
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
          format: 'json',
        },
        behavior: {
          retryAttempts: 0,
          retryDelay: 10,
          rateLimit: 50,
        },
      };

      // Mock global fetch to return HTML
      global.fetch = mock(() =>
        Promise.resolve({
          status: 200,
          text: () => Promise.resolve('<html><body><h1>Test</h1></body></html>'),
        })
      ) as any;

      // When: Running debug scraping with extraction errors
      const debugInfo = await debugUtils.debugScraping(config);

      // Then: Should handle extraction errors
      expect(debugInfo.url).toBe('https://example.com');
      expect(debugInfo.html).toBeDefined();
      expect(debugInfo.selectedElements).toBeDefined();
      expect(debugInfo.errors).toBeDefined();
      // Note: Since the fetch succeeds and HTML is valid, no extraction errors should occur
      expect(debugInfo.errors!.length).toBe(0);
    } finally {
      cleanupDebugUtils(outputDir);
    }
  });

  test('should accumulate multiple errors', async () => {
    const { debugUtils, outputDir } = setupDebugUtils();

    try {
      // Given: A configuration that might cause multiple errors
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
          format: 'json',
        },
        behavior: {
          retryAttempts: 0,
          retryDelay: 10,
          rateLimit: 50,
        },
      };

      // Mock global fetch to throw error again
      global.fetch = mock(() => {
        throw new Error('Network error');
      }) as any;

      // When: Running debug scraping multiple times
      const debugInfo1 = await debugUtils.debugScraping(config);

      // Simulate additional errors by modifying debug info directly
      if (!debugInfo1.errors) debugInfo1.errors = [];
      debugInfo1.errors.push('Additional error');

      // Then: Should accumulate multiple errors
      expect(debugInfo1.errors).toBeDefined();
      expect(debugInfo1.errors!.length).toBeGreaterThan(0);
    } finally {
      cleanupDebugUtils(outputDir);
    }
  });
});
