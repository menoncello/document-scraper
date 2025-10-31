import { test, expect, beforeEach, afterEach, describe, mock } from 'bun:test';
import { existsSync, readdirSync, rmSync, unlinkSync } from 'node:fs';
import { DebugUtils } from '../../../../src/core/debug';
import type { ScrapingConfig } from '../../../../src/types';

describe('DebugUtils - Missing Extraction Fields', () => {
  let debugUtils: DebugUtils;
  let outputDir: string;

  beforeEach(() => {
    outputDir = 'test-debug-utils-output';
    debugUtils = new DebugUtils(outputDir);
  });

  afterEach(() => {
    // Clean up test directory and files
    if (existsSync(outputDir)) {
      const files = readdirSync(outputDir);
      for (const file of files) {
        unlinkSync(`${outputDir}/${file}`);
      }
      rmSync(outputDir, { recursive: true });
    }
  });

  test('should handle configuration with missing extraction fields', async () => {
    // Given: A configuration without extraction fields
    const config: ScrapingConfig = {
      target: {
        url: 'https://example.com',
      },
      extraction: {
        fields: {},
      },
      output: {
        format: 'json',
      },
      behavior: {
        retryAttempts: 3,
        retryDelay: 1000,
        rateLimit: 50,
      },
    };

    // Simple mocking approach - mock global fetch instead of class constructors
    global.fetch = mock(() =>
      Promise.resolve({
        status: 200,
        text: () => Promise.resolve('<html><body></body></html>'),
      })
    ) as any;

    // When: Running debug scraping without extraction fields
    const debugInfo = await debugUtils.debugScraping(config);

    // Then: Should still complete debug process
    expect(debugInfo.url).toBe('https://example.com');
    expect(debugInfo.html).toBeDefined();
    expect(debugInfo.selectedElements).toBeDefined();
    expect(debugInfo.errors).toEqual([]); // Empty array since no errors occurred
  });
});

describe('DebugUtils - Array Extraction Results', () => {
  let debugUtils: DebugUtils;
  let outputDir: string;

  beforeEach(() => {
    outputDir = 'test-debug-utils-output';
    debugUtils = new DebugUtils(outputDir);
  });

  afterEach(() => {
    // Clean up test directory and files
    if (existsSync(outputDir)) {
      const files = readdirSync(outputDir);
      for (const file of files) {
        unlinkSync(`${outputDir}/${file}`);
      }
      rmSync(outputDir, { recursive: true });
    }
  });

  test('should handle array extraction results', async () => {
    // Given: A configuration that returns array data
    const config: ScrapingConfig = {
      target: {
        url: 'https://example.com',
      },
      extraction: {
        fields: {
          title: 'h1',
        },
        multiple: true,
      },
      output: {
        format: 'json',
      },
      behavior: {
        retryAttempts: 3,
        retryDelay: 1000,
        rateLimit: 50,
      },
    };

    // Simple mocking approach - mock global fetch for array results test
    global.fetch = mock(() =>
      Promise.resolve({
        status: 200,
        text: () => Promise.resolve('<html><body><h1>Test 1</h1><h1>Test 2</h1></body></html>'),
      })
    ) as any;

    // When: Running debug scraping with multiple results
    const debugInfo = await debugUtils.debugScraping(config);

    // Then: Should handle array extraction results
    expect(debugInfo.extractedData).toBeDefined();
    expect(Array.isArray(debugInfo.extractedData)).toBe(true);
    expect(
      debugInfo.extractedData &&
        Array.isArray(debugInfo.extractedData) &&
        (debugInfo.extractedData as any[]).length > 0
    ).toBe(true); // At least one item extracted
  });
});
