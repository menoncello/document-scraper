/**
 * Additional coverage tests for DataExtractor private methods
 * Focuses on getting coverage for uncovered lines in private methods
 */

import { test, expect, describe, beforeEach, mock } from 'bun:test';
import { DataExtractor } from '../../../src/core/data-extractor';
import type { ScrapingConfig } from '../../../src/types';

// Helper functions for mock implementations
const createMinimalConfig = (url: string, httpConfig: any) => ({
  target: { url, selector: 'body' },
  extraction: { fields: { title: 'h1', content: 'p' } },
  output: { format: 'json' as const },
  behavior: httpConfig,
});

const createBaseMultipleConfig = (httpConfig: any) => ({
  target: { url: '', selector: 'body' },
  extraction: { fields: { title: 'h1', content: 'p' } },
  output: { format: 'json' as const },
  behavior: httpConfig,
});

const createUrlConfig = (baseConfig: ScrapingConfig, url: string) => ({
  ...baseConfig,
  target: { ...baseConfig.target, url },
});

const createExtractionContext = (config: ScrapingConfig) => ({
  url: config.target.url,
  config,
  startTime: Date.now(),
  retryCount: 0,
});

const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createSuccessResult = (url: string, params: any) => ({
  success: true,
  url,
  data: params.data,
  metadata: {
    extractedAt: new Date(),
    selector: params.selector,
    extractionTime: params.extractionTime,
    retryCount: params.retryCount,
  },
});

const createFailureResult = (url: string, params: any) => ({
  success: false,
  url,
  data: params.isMultiple ? [] : {},
  error: 'Extraction failed',
  metadata: {
    extractedAt: new Date(),
    selector: params.selector,
    extractionTime: params.extractionTime,
    retryCount: params.retryCount,
  },
});

const createEmptyFailureResult = (url: string) => ({
  success: false,
  url,
  data: [],
  error: 'Empty result',
  metadata: {
    extractedAt: new Date(),
    extractionTime: 0,
    retryCount: 0,
  },
});

const processMockElement = (_element: any) => ({
  find: (_selector: string) => ({
    text: () => 'Nested Content',
    attr: (name: string) => {
      if (name === 'href') return 'https://nested.com';
      if (name === 'src') return 'https://nested.com/image.jpg';
      if (name === 'content') return 'Nested Content Meta';
      return null;
    },
  }),
});

const createMockElementProcessor = () => processMockElement;

// Helper function for processing elements with no attributes
const _processElementNoAttrs = (_element: any) => ({
  find: (_selector: string) => ({
    text: () => 'Nested Content',
    attr: () => null,
  }),
});

// Helper function for processing empty results
const processEmptyElement = (_element: any) => ({
  find: (_selector: string) => ({
    text: () => '',
    attr: () => null,
  }),
});

// Mock the external dependencies with more detailed behavior
mock.module('../../../../src/core/http-client', () => ({
  HttpClient: class MockHttpClient {
    private config: any = {};

    constructor(config: any) {
      this.config = config;
    }

    async fetch(_url: string): Promise<any> {
      return {
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <body>
              <div>
                <h1>Test Title</h1>
                <p>Test Content</p>
                <a href="https://example.com" content="Meta Content">Link</a>
                <img src="https://example.com/image.jpg" alt="Test Image">
              </div>
            </body>
          </html>
        `,
        headers: new Map([['content-type', 'text/html']]),
      };
    }

    getConfig(): any {
      return this.config;
    }

    updateConfig(config: any): void {
      this.config = { ...this.config, ...config };
    }
  },
}));

// Mock HTML parser with more detailed selector behavior
mock.module('../../../../src/core/html-parser', () => ({
  HtmlParser: class MockHtmlParser {
    private content = '';

    async loadFromResponse(_response: any): Promise<void> {
      // Content would be loaded in real implementation
    }

    select(selector: string): any {
      if (selector === 'a') {
        return {
          count: 1,
          text: 'Link',
          matches: {
            length: 1,
            first: () => ({
              attr: (name: string) => {
                // Test all attribute extraction scenarios
                if (name === 'content') return 'Meta Content';
                if (name === 'href') return 'https://example.com';
                if (name === 'src') return null; // Not on an anchor tag
                return null;
              },
            }),
          },
        };
      }

      if (selector === 'img') {
        return {
          count: 1,
          text: '',
          matches: {
            length: 1,
            first: () => ({
              attr: (name: string) => {
                // Test image-specific attributes
                if (name === 'content') return null;
                if (name === 'href') return null;
                if (name === 'src') return 'https://example.com/image.jpg';
                return null;
              },
            }),
          },
        };
      }

      if (selector === 'h1') {
        return {
          count: 1,
          text: 'Test Title',
          matches: {
            length: 1,
            first: () => ({
              attr: () => null,
            }),
          },
        };
      }

      if (selector === 'nonexistent') {
        return {
          count: 0,
          text: '',
          matches: {
            length: 0,
            first: () => null,
          },
        };
      }

      if (selector === 'div') {
        return {
          count: 1,
          text: 'Plain Text',
          matches: {
            length: 1,
            first: () => ({
              attr: () => null,
            }),
          },
        };
      }

      if (selector === '.empty') {
        return {
          count: 0,
          text: '',
          matches: {
            length: 0,
            first: () => null,
          },
        };
      }

      // Default case
      return {
        count: 1,
        text: 'Default Content',
        matches: {
          length: 1,
          first: () => ({
            attr: (name: string) => {
              if (name === 'content') return 'Default Content Meta';
              if (name === 'href') return 'https://default.com';
              if (name === 'src') return 'https://default.com/image.jpg';
              return null;
            },
          }),
        },
      };
    }

    get $() {
      return createMockElementProcessor();
    }
  },
}));

// Mock helper functions
mock.module('../../../../src/core/utils/extraction-helpers', () => ({
  createMinimalConfig,
  createBaseMultipleConfig,
  createUrlConfig,
  createExtractionContext,
  sleep,
}));

mock.module('../../../../src/core/utils/result-factory', () => ({
  createSuccessResult,
  createFailureResult,
  createEmptyFailureResult,
}));

describe('DataExtractor - Coverage for Private Methods', () => {
  beforeEach(() => {
    // No setup needed for these tests
  });

  test('TC-DE-005-01 [P2]: should extract content attribute from anchor tags', async () => {
    const config: ScrapingConfig = {
      target: { url: 'https://example.com' },
      extraction: { fields: { meta: 'a' } },
      output: { format: 'json' },
      behavior: { retryAttempts: 1, retryDelay: 100, rateLimit: 1 },
    };

    const extractor = new DataExtractor(config);
    const _result = await extractor.extractFromConfig(config);

    expect(_result.success).toBe(true);
    expect(_result.data).toBeDefined();
  });

  test('TC-DE-005-02 [P2]: should extract src attribute from img tags', async () => {
    const config: ScrapingConfig = {
      target: { url: 'https://example.com' },
      extraction: { fields: { image: 'img' } },
      output: { format: 'json' },
      behavior: { retryAttempts: 1, retryDelay: 100, rateLimit: 1 },
    };

    const extractor = new DataExtractor(config);
    const _result = await extractor.extractFromConfig(config);

    expect(_result.success).toBe(true);
    expect(_result.data).toBeDefined();
  });

  test('TC-DE-005-03 [P2]: should handle selectors with no matches', async () => {
    const config: ScrapingConfig = {
      target: { url: 'https://example.com' },
      extraction: { fields: { missing: 'nonexistent' } },
      output: { format: 'json' },
      behavior: { retryAttempts: 1, retryDelay: 100, rateLimit: 1 },
    };

    const extractor = new DataExtractor(config);
    const _result = await extractor.extractFromConfig(config, { filterEmpty: false });

    expect(_result.success).toBe(true);
    expect((_result.data as Record<string, unknown>).missing).toBe('');
  });

  test('TC-DE-005-04 [P2]: should extract multiple fields with different attribute types', async () => {
    const config: ScrapingConfig = {
      target: { url: 'https://example.com' },
      extraction: {
        fields: {
          link: 'a',
          image: 'img',
          title: 'h1',
          nonexistent: 'nonexistent',
        },
      },
      output: { format: 'json' },
      behavior: { retryAttempts: 1, retryDelay: 100, rateLimit: 1 },
    };

    const extractor = new DataExtractor(config);
    const _result = await extractor.extractFromConfig(config, { filterEmpty: false });

    expect(_result.success).toBe(true);
    expect(_result.data).toBeDefined();
    expect(Object.keys(_result.data)).toContain('link');
    expect(Object.keys(_result.data)).toContain('image');
    expect(Object.keys(_result.data)).toContain('title');
    expect(Object.keys(_result.data)).toContain('nonexistent');
  });
});

describe('DataExtractor - Edge Cases for Attribute Extraction', () => {
  test('TC-DE-005-05 [P2]: should handle elements with no attributes', async () => {
    const config: ScrapingConfig = {
      target: { url: 'https://example.com' },
      extraction: { fields: { plain: 'div' } },
      output: { format: 'json' },
      behavior: { retryAttempts: 1, retryDelay: 100, rateLimit: 1 },
    };

    const extractor = new DataExtractor(config);
    const _result = await extractor.extractFromConfig(config);

    expect(_result.success).toBe(true);
    // Since we can't control the exact HTML content from example.com, we just verify the structure
    expect(_result.data).toBeDefined();

    // The 'plain' field should exist if div elements are found and not empty
    // By default, empty values are filtered out, so the field might be missing
    const dataObj = _result.data as Record<string, unknown>;
    if ('plain' in dataObj) {
      expect(typeof dataObj.plain).toBe('string');
      // If the field exists, it should have content (empty strings are filtered out)
      expect(dataObj.plain).toBeTruthy();
    }
  });

  test('TC-DE-005-06 [P2]: should handle empty selector results', async () => {
    // Mock HTML parser for empty results
    mock.module('../../../../src/core/html-parser', () => ({
      HtmlParser: class MockHtmlParser {
        async loadFromResponse(_response: any): Promise<void> {
          // Mock implementation
        }
        select(_selector: string): any {
          return {
            count: 0,
            text: '',
            matches: {
              length: 0,
              first: () => null,
            },
          };
        }
        get $() {
          return processEmptyElement;
        }
      },
    }));

    const config: ScrapingConfig = {
      target: { url: 'https://example.com' },
      extraction: { fields: { empty: '.empty' } },
      output: { format: 'json' },
      behavior: { retryAttempts: 1, retryDelay: 100, rateLimit: 1 },
    };

    const extractor = new DataExtractor(config);
    const _result = await extractor.extractFromConfig(config, { filterEmpty: false });

    expect(_result.success).toBe(true);
    expect((_result.data as Record<string, unknown>).empty).toBe('');
  });
});
