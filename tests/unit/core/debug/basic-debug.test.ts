import { test, expect, beforeEach, afterEach, describe, mock } from 'bun:test';
import { existsSync, readdirSync, rmSync, unlinkSync } from 'node:fs';
import { DebugUtils } from '../../../../src/core/debug';
import type { DebugOptions, ScrapingConfig } from '../../../../src/types';

describe('DebugUtils - Debug Info Initialization', () => {
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

  test('should initialize debug info correctly', async () => {
    // Given: A scraping configuration
    const config: ScrapingConfig = {
      target: {
        url: 'https://example.com',
        selector: 'article',
      },
      extraction: {
        fields: {
          title: 'h1',
          content: '.content',
        },
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
        text: () =>
          Promise.resolve(
            '<html><body><article><h1>Test</h1><div class="content">Test Content</div></article></body></html>'
          ),
      })
    ) as any;

    // When: Starting debug scraping
    const debugInfo = await debugUtils.debugScraping(config);

    // Then: Should initialize debug info correctly
    expect(debugInfo.url).toBe('https://example.com');
    expect(debugInfo.config).toEqual(config);
    expect(debugInfo.metadata).toBeDefined();
    expect(debugInfo.metadata?.extractedAt).toBeInstanceOf(Date);
    expect(debugInfo.metadata?.extractionTime).toBe(0);
    expect(debugInfo.metadata?.retryCount).toBe(0);
  });
});

describe('DebugUtils - All Debug Options Enabled', () => {
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

  test('should handle debug scraping with all options enabled', async () => {
    // Given: A complete configuration with all debug options enabled
    const config: ScrapingConfig = {
      target: {
        url: 'https://example.com',
        selector: 'article',
      },
      extraction: {
        fields: {
          title: 'h1',
          content: '.content',
        },
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

    const options: DebugOptions = {
      saveHtml: true,
      saveSelections: true,
      saveExtraction: true,
      saveConfig: true,
      outputDir: outputDir,
    };

    // Mock HTTP client and dependencies to avoid actual network calls
    global.fetch = mock(() =>
      Promise.resolve({
        status: 200,
        text: () =>
          Promise.resolve(
            '<html><body><article><h1>Test Title</h1><div class="content">Test Content</div></article></body></html>'
          ),
      })
    ) as any;

    // When: Running debug scraping with all options
    const debugInfo = await debugUtils.debugScraping(config, options);

    // Then: Should complete without errors and include all debug information
    expect(debugInfo.url).toBe('https://example.com');
    expect(debugInfo.html).toBeDefined();
    expect(debugInfo.selectedElements).toBeDefined();
    expect(debugInfo.extractedData).toBeDefined();
    expect(debugInfo.errors).toEqual([]); // No errors expected

    // Should create debug files
    expect(existsSync(outputDir)).toBe(true);
    const files = readdirSync(outputDir);
    expect(files.length).toBeGreaterThan(0);
  });
});

describe('DebugUtils - Minimal Debug Options', () => {
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

  test('should handle debug scraping with minimal options', async () => {
    // Given: A configuration with minimal debug options
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
        retryAttempts: 3,
        retryDelay: 1000,
        rateLimit: 50,
      },
    };

    const options: DebugOptions = {
      saveHtml: false,
      saveSelections: false,
      saveExtraction: false,
      saveConfig: false,
    };

    // Mock HTTP client to avoid actual network calls
    global.fetch = mock(() =>
      Promise.resolve({
        status: 200,
        text: () => Promise.resolve('<html><body><h1>Test</h1></body></html>'),
      })
    ) as any;

    // When: Running debug scraping with minimal options
    const debugInfo = await debugUtils.debugScraping(config, options);

    // Then: Should still provide debug information without saving files
    expect(debugInfo.url).toBe('https://example.com');
    expect(debugInfo.html).toBeDefined();
    expect(debugInfo.selectedElements).toBeDefined();
    expect(debugInfo.extractedData).toBeDefined();
  });
});
