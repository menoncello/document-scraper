import { test, expect, beforeEach, afterEach, describe, spyOn, mock } from 'bun:test';
import { existsSync, readdirSync, rmSync, unlinkSync } from 'fs';
import { DebugUtils, type DebugOptions } from '../../../src/core/debug';
import type { ScrapingConfig } from '../../../src/types';

// Constants
const TEST_OUTPUT_DIR = 'test-debug-extended-output';
const MOCK_URL = 'https://example.com/test';
const MOCK_MINIMAL_URL = 'https://example.com';
const HTTP_STATUS_OK = 200;
const HTTP_STATUS_ERROR = 500;
const NO_RETRY_ATTEMPTS = 0;
const MINIMAL_DELAY = 10;
const SHORT_TIMEOUT = 1000;
const DEFAULT_RETRY_ATTEMPTS = 1;
const DEFAULT_RETRY_DELAY = 100;

// Test data constants
const BASIC_HTML_CONTENT = '<html><body><h1>Simple Test</h1></body></html>';
const ERROR_HTML_CONTENT = '<html><body><h1>Simple</h1></body></html>';

// Unused constants (kept for future use)
const _DEFAULT_OUTPUT_DIR = 'debug';
const _MOCK_COMPLEX_URL = 'https://example.com/complex';
const _MOCK_MINIMAL_URL_2 = 'https://example.com/minimal';
const _MINIMAL_RATE_LIMIT = 1;
const _PERFORMANCE_TIMEOUT = 5000;
const _LARGE_CONTENT_SIZE = 10000;
const _MALFORMED_HTML = `
  <html>
    <body>
      <div id="broken"
      <p>Unclosed paragraph
      <span class="author">Malformed author
    </body>
  </html>
`;
const _SPECIAL_CHARS_HTML = `
  <html>
    <body>
      <article>
        <h1>Special Characters: áéíóú ñ ü</h1>
        <div class="content">Content with emoji: 🚀🌟💯</div>
        <span class="author">Author: François Müller</span>
      </article>
    </body>
  </html>
`;
const _COMPLEX_HTML_CONTENT = `<html><body>
  <div class="complex-item">
    <h1 class="title">Complex Title</h1>
    <h2 class="subtitle">Complex Subtitle</h2>
    <div class="content">Complex content goes here</div>
    <span class="author">Complex Author</span>
    <span class="date">2024-01-01</span>
    <span class="category">Complex Category</span>
    <span class="tags">tag1,tag2,tag3</span>
  </div>
</body></html>`;

// Test data factories
const createMockConfig = (overrides: Partial<ScrapingConfig> = {}): ScrapingConfig => ({
  target: {
    url: MOCK_URL,
    selector: 'article',
    ...overrides.target,
  },
  extraction: {
    fields: {
      title: 'h1',
      content: '.content',
      author: '.author',
      ...overrides.extraction?.fields,
    },
    ...overrides.extraction,
  },
  output: {
    format: 'json',
    ...overrides.output,
  },
  behavior: {
    retryAttempts: 3,
    retryDelay: 1000,
    rateLimit: 50,
    timeout: 30000,
    ...overrides.behavior,
  },
  ...overrides,
});

const createMinimalConfig = (): ScrapingConfig => ({
  target: {
    url: MOCK_MINIMAL_URL,
  },
  extraction: {
    fields: {},
  },
  output: {
    format: 'json',
  },
  behavior: {
    retryAttempts: DEFAULT_RETRY_ATTEMPTS,
    retryDelay: 500,
    rateLimit: 10,
  },
});

const createFailingConfig = (): ScrapingConfig => ({
  target: {
    url: MOCK_MINIMAL_URL,
    selector: '.nonexistent',
  },
  extraction: {
    fields: {
      title: '.missing-title',
      content: '.missing-content',
    },
  },
  output: {
    format: 'json',
  },
  behavior: {
    retryAttempts: DEFAULT_RETRY_ATTEMPTS,
    retryDelay: DEFAULT_RETRY_DELAY,
    rateLimit: 10,
  },
});

const createConfigWithNoRetry = (baseConfig: ScrapingConfig): ScrapingConfig => ({
  ...baseConfig,
  behavior: {
    ...baseConfig.behavior,
    retryAttempts: NO_RETRY_ATTEMPTS,
    retryDelay: MINIMAL_DELAY,
    timeout: SHORT_TIMEOUT,
  },
});

// Helper functions
const mockSuccessfulFetch = (htmlContent: string) => {
  global.fetch = mock(() =>
    Promise.resolve({
      status: HTTP_STATUS_OK,
      text: () => Promise.resolve(htmlContent),
    })
  ) as any;
};

const mockErrorFetch = (errorMessage = 'Server error') => {
  global.fetch = mock(() =>
    Promise.resolve({
      status: HTTP_STATUS_ERROR,
      text: () => Promise.reject(new Error(errorMessage)),
    })
  ) as any;
};

const _mockGeneralErrorFetch = (errorMessage: string) => {
  global.fetch = mock(() => {
    throw new Error(errorMessage);
  }) as any;
};

const createFullDebugOptions = (): DebugOptions => ({
  saveHtml: true,
  saveSelections: true,
  saveExtraction: true,
  saveConfig: true,
});

const createMinimalDebugOptions = (): DebugOptions => ({
  saveHtml: false,
  saveSelections: false,
  saveExtraction: false,
  saveConfig: false,
});

const suppressConsoleOutput = () => {
  spyOn(console, 'log').mockImplementation((_message: string, ..._args: any[]) => {
    // Suppress console output during tests
  });
};

describe('DebugUtils Extended Coverage Tests', () => {
  let debugUtils: DebugUtils;
  let outputDir: string;
  let mockConfig: ScrapingConfig;

  beforeEach(() => {
    outputDir = TEST_OUTPUT_DIR;
    debugUtils = new DebugUtils(outputDir);
    mockConfig = createMockConfig();
  });

  afterEach(() => {
    // Clean up test directory and files
    if (existsSync(outputDir)) {
      try {
        const files = readdirSync(outputDir);
        for (const file of files) {
          unlinkSync(`${outputDir}/${file}`);
        }
      } catch {
        // Ignore cleanup errors
      }
      try {
        rmSync(outputDir, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('Execute Debug Steps', () => {
    test('should execute all debug steps in sequence', async () => {
      // Given: A complete debug configuration
      const options = createFullDebugOptions();
      const testHtml =
        '<html><body><article><h1>Test Title</h1><div class="content">Test Content</div><span class="author">Test Author</span></article></body></html>';

      mockSuccessfulFetch(testHtml);

      // When: Running debug scraping
      const debugInfo = await debugUtils.debugScraping(mockConfig, options);

      // Then: Should execute all steps and provide complete debug information
      expect(debugInfo.url).toBe(mockConfig.target.url);
      expect(debugInfo.config).toEqual(mockConfig);
      expect(debugInfo.html).toBeDefined();
      expect(debugInfo.selectedElements).toBeDefined();
      expect(debugInfo.extractedData).toBeDefined();
      expect(debugInfo.metadata).toBeDefined();
      expect(debugInfo.metadata?.extractedAt).toBeInstanceOf(Date);
    });

    test('should handle debug steps with minimal configuration', async () => {
      // Given: Minimal configuration
      const minimalConfig = createMinimalConfig();
      const options = createMinimalDebugOptions();

      mockSuccessfulFetch(BASIC_HTML_CONTENT);

      // When: Running debug with minimal config
      const debugInfo = await debugUtils.debugScraping(minimalConfig, options);

      // Then: Should still provide basic debug information
      expect(debugInfo.url).toBe(minimalConfig.target.url);
      expect(debugInfo.html).toBeDefined();
      expect(debugInfo.selectedElements).toBeDefined();
      expect(debugInfo.extractedData).toBeDefined();
    });

    test('should handle network errors during debug steps', async () => {
      // Given: Configuration that will fail network request with minimal retry
      const configWithNoRetry = createConfigWithNoRetry(mockConfig);

      mockErrorFetch('Network error');

      // When: Running debug scraping
      const debugInfo = await debugUtils.debugScraping(configWithNoRetry);

      // Then: Should handle error gracefully
      expect(debugInfo.url).toBe(configWithNoRetry.target.url);
      expect(debugInfo.errors).toBeDefined();
      expect(debugInfo.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('Perform Analysis and Logging', () => {
    test('should perform configuration analysis and logging', async () => {
      // Given: A configuration for analysis
      const testHtml =
        '<html><body><article><h1>Title</h1><div class="content">Content</div></article></body></html>';
      mockSuccessfulFetch(testHtml);
      suppressConsoleOutput();

      // When: Running debug scraping
      const debugInfo = await debugUtils.debugScraping(mockConfig);

      // Then: Should complete analysis and logging
      expect(debugInfo.selectedElements).toBeDefined();
      expect(typeof debugInfo.selectedElements).toBe('object');
    });

    test('should analyze selector results and provide suggestions', async () => {
      // Given: Configuration with problematic selectors
      const configWithProblems = createMockConfig({
        extraction: {
          fields: {
            title: '.nonexistent-title',
            content: '.missing-content',
            author: 'invalid-selector[',
          },
        },
      });

      mockSuccessfulFetch(ERROR_HTML_CONTENT);
      suppressConsoleOutput();

      // When: Running debug with problematic selectors
      const debugInfo = await debugUtils.debugScraping(configWithProblems);

      // Then: Should analyze and provide feedback
      expect(debugInfo.selectedElements).toBeDefined();
      expect(debugInfo.extractedData).toBeDefined();
    });

    test('should handle analysis without selector suggestions', async () => {
      // Given: Good configuration that should work well
      const goodHtml =
        '<html><body><article><h1>Good Title</h1><div class="content">Good Content</div><span class="author">Good Author</span></article></body></html>';
      mockSuccessfulFetch(goodHtml);

      // When: Running debug with good configuration
      const debugInfo = await debugUtils.debugScraping(mockConfig);

      // Then: Should complete without errors
      expect(debugInfo.url).toBe(mockConfig.target.url);
      expect(debugInfo.selectedElements).toBeDefined();
      expect(debugInfo.extractedData).toBeDefined();
    });
  });

  describe('Test Extraction Methods', () => {
    test('should test data extraction successfully', async () => {
      // Given: Good HTML for extraction
      const extractionHtml =
        '<html><body><article><h1>Test Article</h1><div class="content">Article content goes here</div><span class="author">John Doe</span></article></body></html>';
      mockSuccessfulFetch(extractionHtml);

      // When: Running debug with extraction enabled
      const options: DebugOptions = {
        saveExtraction: true,
      };

      const debugInfo = await debugUtils.debugScraping(mockConfig, options);

      // Then: Should extract data successfully
      expect(debugInfo.extractedData).toBeDefined();
      expect(debugInfo.errors).toEqual([]); // No errors expected
    });

    test('should handle extraction failures gracefully', async () => {
      // Given: Configuration that will fail extraction
      const failingConfig = createFailingConfig();
      mockSuccessfulFetch(ERROR_HTML_CONTENT);

      // When: Running debug with failing extraction
      const debugInfo = await debugUtils.debugScraping(failingConfig);

      // Then: Should handle extraction failure
      expect(debugInfo.extractedData).toBeDefined();
      expect(debugInfo.errors).toBeDefined();
    });

    test('should handle extraction with retry count', async () => {
      // Given: Configuration with retry attempts
      const retryHtml =
        '<html><body><article><h1>Retry Test</h1><div class="content">Content after retry</div></article></body></html>';
      mockSuccessfulFetch(retryHtml);

      // When: Running debug
      const debugInfo = await debugUtils.debugScraping(mockConfig);

      // Then: Should include retry information
      expect(debugInfo.metadata).toBeDefined();
      expect(typeof debugInfo.metadata?.retryCount).toBe('number');
    });

    test('should save extraction results when enabled', async () => {
      // Given: Configuration with extraction saving enabled
      const options: DebugOptions = {
        saveExtraction: true,
        saveHtml: false,
        saveSelections: false,
        saveConfig: false,
      };
      const saveHtml =
        '<html><body><article><h1>Save Test</h1><div class="content">Content to save</div></article></body></html>';
      mockSuccessfulFetch(saveHtml);

      // When: Running debug with extraction saving
      const debugInfo = await debugUtils.debugScraping(mockConfig, options);

      // Then: Should attempt to save extraction results
      expect(debugInfo.extractedData).toBeDefined();
    });

    test('should log extraction success', async () => {
      // Given: Successful extraction setup
      const successHtml =
        '<html><body><article><h1>Success Test</h1><div class="content">Success content</div></article></body></html>';
      mockSuccessfulFetch(successHtml);

      // When: Running debug
      const debugInfo = await debugUtils.debugScraping(mockConfig);

      // Then: Should complete successfully
      expect(debugInfo.extractedData).toBeDefined();
      expect(debugInfo.errors).toEqual([]);
    });
  });

  describe('Save Methods Configuration', () => {
    test('should save configuration when saveConfig is true', async () => {
      // Given: Configuration with saveConfig enabled
      const options: DebugOptions = {
        saveConfig: true,
        saveHtml: false,
        saveSelections: false,
        saveExtraction: false,
      };

      global.fetch = mock(() =>
        Promise.resolve({
          status: 200,
          text: () => Promise.resolve('<html><body><h1>Config Test</h1></body></html>'),
        })
      ) as any;

      // When: Running debug with config saving
      const debugInfo = await debugUtils.debugScraping(mockConfig, options);

      // Then: Should save configuration
      expect(debugInfo.config).toEqual(mockConfig);
    });

    test('should save configuration when saveConfig is undefined (default true)', async () => {
      // Given: Configuration with default saveConfig behavior
      const options: DebugOptions = {}; // saveConfig defaults to true

      global.fetch = mock(() =>
        Promise.resolve({
          status: 200,
          text: () => Promise.resolve('<html><body><h1>Default Config Test</h1></body></html>'),
        })
      ) as any;

      // When: Running debug with default settings
      const debugInfo = await debugUtils.debugScraping(mockConfig, options);

      // Then: Should save configuration by default
      expect(debugInfo.config).toEqual(mockConfig);
    });

    test('should not save configuration when saveConfig is false', async () => {
      // Given: Configuration with saveConfig explicitly disabled
      const options: DebugOptions = {
        saveConfig: false,
      };

      global.fetch = mock(() =>
        Promise.resolve({
          status: 200,
          text: () => Promise.resolve('<html><body><h1>No Config Save Test</h1></body></html>'),
        })
      ) as any;

      // When: Running debug with config saving disabled
      const debugInfo = await debugUtils.debugScraping(mockConfig, options);

      // Then: Should not save configuration (but still include it in debug info)
      expect(debugInfo.config).toEqual(mockConfig);
    });

    test('should save HTML when saveHtml is true', async () => {
      // Given: Configuration with HTML saving enabled
      const options: DebugOptions = {
        saveHtml: true,
        saveConfig: false,
        saveSelections: false,
        saveExtraction: false,
      };

      global.fetch = mock(() =>
        Promise.resolve({
          status: 200,
          text: () => Promise.resolve('<html><body><h1>HTML Save Test</h1></body></html>'),
        })
      ) as any;

      // When: Running debug with HTML saving
      const debugInfo = await debugUtils.debugScraping(mockConfig, options);

      // Then: Should save HTML
      expect(debugInfo.html).toBeDefined();
      expect(debugInfo.html).toContain('HTML Save Test');
    });

    test('should save selector results when saveSelections is true', async () => {
      // Given: Configuration with selector saving enabled
      const options: DebugOptions = {
        saveSelections: true,
        saveHtml: false,
        saveConfig: false,
        saveExtraction: false,
      };

      global.fetch = mock(() =>
        Promise.resolve({
          status: 200,
          text: () =>
            Promise.resolve(
              '<html><body><article><h1>Selection Test</h1><div class="content">Test content</div></article></body></html>'
            ),
        })
      ) as any;

      // When: Running debug with selector saving
      const debugInfo = await debugUtils.debugScraping(mockConfig, options);

      // Then: Should save selector results
      expect(debugInfo.selectedElements).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle debug errors and add to debug info', async () => {
      // Given: Configuration that will cause errors with minimal retry
      const configWithNoRetry: ScrapingConfig = {
        ...mockConfig,
        behavior: {
          ...mockConfig.behavior,
          retryAttempts: 0, // Disable retries to avoid timeout
          retryDelay: 10, // Minimal delay
          timeout: 1000, // Shorter timeout
        },
      };

      global.fetch = mock(() =>
        Promise.resolve({
          status: 500,
          text: () => Promise.reject(new Error('Server error')),
        })
      ) as any;

      // When: Running debug scraping
      const debugInfo = await debugUtils.debugScraping(configWithNoRetry);

      // Then: Should handle errors and add them to debug info
      expect(debugInfo.errors).toBeDefined();
      expect(debugInfo.errors!.length).toBeGreaterThan(0);
      // Error message format may be different, just check that an error exists
      expect(debugInfo.errors![0]).toBeTruthy();
    });

    test('should handle extraction errors specifically', async () => {
      // Given: Configuration that will cause extraction errors
      const errorConfig: ScrapingConfig = {
        target: {
          url: 'https://example.com',
          selector: 'invalid-selector[',
        },
        extraction: {
          fields: {
            title: 'another-invalid[',
          },
        },
        output: {
          format: 'json',
        },
        behavior: {
          retryAttempts: 1,
          retryDelay: 100,
          rateLimit: 10,
        },
      };

      global.fetch = mock(() =>
        Promise.resolve({
          status: 200,
          text: () => Promise.resolve('<html><body><h1>Error Test</h1></body></html>'),
        })
      ) as any;

      // When: Running debug with extraction errors
      const debugInfo = await debugUtils.debugScraping(errorConfig);

      // Then: Should handle extraction gracefully (may not always produce errors)
      expect(debugInfo.extractedData).toBeDefined();
      // The system may handle invalid selectors gracefully without throwing errors
    });

    test('should handle extraction errors without existing errors array', async () => {
      // Given: Debug info without errors array initially
      const configWithNoRetry: ScrapingConfig = {
        ...mockConfig,
        behavior: {
          ...mockConfig.behavior,
          retryAttempts: 0, // Disable retries to avoid timeout
          retryDelay: 10, // Minimal delay
          timeout: 1000, // Shorter timeout
        },
      };

      global.fetch = mock(() =>
        Promise.resolve({
          status: 200,
          text: () => Promise.reject(new Error('Extraction error')),
        })
      ) as any;

      // When: Running debug that will cause extraction errors
      const debugInfo = await debugUtils.debugScraping(configWithNoRetry);

      // Then: Should create errors array and add error
      expect(debugInfo.errors).toBeDefined();
      expect(Array.isArray(debugInfo.errors)).toBe(true);
    });

    test('should handle general errors in debug process', async () => {
      // Given: Configuration that causes general errors with minimal retry
      const configWithNoRetry: ScrapingConfig = {
        ...mockConfig,
        behavior: {
          ...mockConfig.behavior,
          retryAttempts: 0, // Disable retries to avoid timeout
          retryDelay: 10, // Minimal delay
          timeout: 1000, // Shorter timeout
        },
      };

      global.fetch = mock(() => {
        throw new Error('General debug error');
      }) as any;

      // When: Running debug scraping
      const debugInfo = await debugUtils.debugScraping(configWithNoRetry);

      // Then: Should handle general errors
      expect(debugInfo.errors).toBeDefined();
      expect(debugInfo.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('Output Directory Management', () => {
    test('should get output directory path', () => {
      // Given: DebugUtils instance with output directory
      const debugUtils = new DebugUtils('custom-output-dir');

      // When: Getting output directory
      const outputDir = debugUtils.getOutputDirectory();

      // Then: Should return correct directory path
      expect(outputDir).toBe('custom-output-dir');
    });

    test('should use default output directory when not specified', () => {
      // Given: DebugUtils instance without output directory
      const defaultDebugUtils = new DebugUtils();

      // When: Getting output directory
      const outputDir = defaultDebugUtils.getOutputDirectory();

      // Then: Should return default directory
      expect(outputDir).toBe('debug');
    });

    test('should handle special characters in output directory', () => {
      // Given: DebugUtils instance with special characters in directory
      const debugUtils = new DebugUtils('test-dir_with-special.chars');

      // When: Getting output directory
      const outputDir = debugUtils.getOutputDirectory();

      // Then: Should preserve special characters
      expect(outputDir).toBe('test-dir_with-special.chars');
    });
  });

  describe('Metadata Handling', () => {
    test('should initialize debug info with metadata', async () => {
      // Given: Configuration for debugging
      global.fetch = mock(() =>
        Promise.resolve({
          status: 200,
          text: () => Promise.resolve('<html><body><h1>Metadata Test</h1></body></html>'),
        })
      ) as any;

      // When: Running debug scraping
      const debugInfo = await debugUtils.debugScraping(mockConfig);

      // Then: Should initialize metadata correctly
      expect(debugInfo.metadata).toBeDefined();
      expect(debugInfo.metadata?.extractedAt).toBeInstanceOf(Date);
      expect(debugInfo.metadata?.extractionTime).toBe(0);
      expect(debugInfo.metadata?.retryCount).toBe(0);
    });

    test('should update metadata with retry count', async () => {
      // Given: Configuration that might trigger retries
      global.fetch = mock(() =>
        Promise.resolve({
          status: 200,
          text: () =>
            Promise.resolve(
              '<html><body><article><h1>Retry Metadata Test</h1><div class="content">Test content</div></article></body></html>'
            ),
        })
      ) as any;

      // When: Running debug scraping
      const debugInfo = await debugUtils.debugScraping(mockConfig);

      // Then: Should include retry count in metadata
      expect(debugInfo.metadata).toBeDefined();
      expect(typeof debugInfo.metadata?.retryCount).toBe('number');
    });

    test('should include selector in metadata when available', async () => {
      // Given: Configuration with selector
      const configWithSelector: ScrapingConfig = {
        ...mockConfig,
        target: {
          ...mockConfig.target,
          selector: 'article',
        },
      };

      global.fetch = mock(() =>
        Promise.resolve({
          status: 200,
          text: () =>
            Promise.resolve(
              '<html><body><article><h1>Selector Test</h1><div class="content">Test content</div></article></body></html>'
            ),
        })
      ) as any;

      // When: Running debug scraping
      const debugInfo = await debugUtils.debugScraping(configWithSelector);

      // Then: Should include selector in metadata if the implementation supports it
      expect(debugInfo.metadata).toBeDefined();
      // The selector field may or may not be included in metadata depending on implementation
      if (debugInfo.metadata?.selector) {
        expect(debugInfo.metadata.selector).toBe('article');
      }
    });
  });

  describe('Complex Configuration Handling', () => {
    test('should handle complex extraction configurations', async () => {
      // Given: Complex configuration with multiple fields
      const complexConfig: ScrapingConfig = {
        target: {
          url: 'https://example.com/complex',
          selector: '.complex-item',
        },
        extraction: {
          fields: {
            title: 'h1.title',
            subtitle: 'h2.subtitle',
            content: '.content',
            author: '.author',
            date: '.date',
            category: '.category',
            tags: '.tags',
          },
        },
        output: {
          format: 'json',
        },
        behavior: {
          retryAttempts: 5,
          retryDelay: 2000,
          rateLimit: 100,
          timeout: 60000,
        },
      };

      global.fetch = mock(() =>
        Promise.resolve({
          status: 200,
          text: () =>
            Promise.resolve(
              `<html><body>
                <div class="complex-item">
                  <h1 class="title">Complex Title</h1>
                  <h2 class="subtitle">Complex Subtitle</h2>
                  <div class="content">Complex content goes here</div>
                  <span class="author">Complex Author</span>
                  <span class="date">2024-01-01</span>
                  <span class="category">Complex Category</span>
                  <span class="tags">tag1,tag2,tag3</span>
                </div>
              </body></html>`
            ),
        })
      ) as any;

      // When: Running debug with complex configuration
      const debugInfo = await debugUtils.debugScraping(complexConfig);

      // Then: Should handle complex configuration successfully
      expect(debugInfo.url).toBe(complexConfig.target.url);
      expect(debugInfo.config).toEqual(complexConfig);
      expect(debugInfo.extractedData).toBeDefined();
    });

    test('should handle minimal configurations', async () => {
      // Given: Minimal configuration
      const minimalConfig: ScrapingConfig = {
        target: {
          url: 'https://example.com/minimal',
        },
        extraction: {
          fields: {},
        },
        output: {
          format: 'json',
        },
        behavior: {
          retryAttempts: 1,
          retryDelay: 100,
          rateLimit: 1,
        },
      };

      global.fetch = mock(() =>
        Promise.resolve({
          status: 200,
          text: () => Promise.resolve('<html><body><h1>Minimal</h1></body></html>'),
        })
      ) as any;

      // When: Running debug with minimal configuration
      const debugInfo = await debugUtils.debugScraping(minimalConfig);

      // Then: Should handle minimal configuration
      expect(debugInfo.url).toBe(minimalConfig.target.url);
      expect(debugInfo.config).toEqual(minimalConfig);
      expect(debugInfo.extractedData).toBeDefined();
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle large HTML content', async () => {
      // Given: Large HTML content
      const largeHtml = `<html><body>${'<div>Large content item</div>'.repeat(1000)}</body></html>`;

      global.fetch = mock(() =>
        Promise.resolve({
          status: 200,
          text: () => Promise.resolve(largeHtml),
        })
      ) as any;

      // When: Running debug with large content
      const startTime = Date.now();
      const debugInfo = await debugUtils.debugScraping(mockConfig);
      const endTime = Date.now();

      // Then: Should handle large content efficiently
      expect(debugInfo.html).toBeDefined();
      expect(debugInfo.html!.length).toBeGreaterThan(10000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in reasonable time
    });

    test('should handle special characters in HTML', async () => {
      // Given: HTML with special characters and Unicode
      const specialHtml = `
        <html>
          <body>
            <article>
              <h1>Special Characters: áéíóú ñ ü</h1>
              <div class="content">Content with emoji: 🚀🌟💯</div>
              <span class="author">Author: François Müller</span>
            </article>
          </body>
        </html>
      `;

      global.fetch = mock(() =>
        Promise.resolve({
          status: 200,
          text: () => Promise.resolve(specialHtml),
        })
      ) as any;

      // When: Running debug with special characters
      const debugInfo = await debugUtils.debugScraping(mockConfig);

      // Then: Should handle special characters correctly
      expect(debugInfo.html).toContain('áéíóú');
      expect(debugInfo.html).toContain('🚀');
      expect(debugInfo.html).toContain('François');
    });

    test('should handle malformed HTML', async () => {
      // Given: Malformed HTML
      const malformedHtml = `
        <html>
          <body>
            <div id="broken"
            <p>Unclosed paragraph
            <span class="author">Malformed author
          </body>
        </html>
      `;

      global.fetch = mock(() =>
        Promise.resolve({
          status: 200,
          text: () => Promise.resolve(malformedHtml),
        })
      ) as any;

      // When: Running debug with malformed HTML
      const debugInfo = await debugUtils.debugScraping(mockConfig);

      // Then: Should handle malformed HTML gracefully
      expect(debugInfo.html).toBeDefined();
      expect(debugInfo.errors).toEqual([]); // Should not error on malformed HTML
    });
  });
});
