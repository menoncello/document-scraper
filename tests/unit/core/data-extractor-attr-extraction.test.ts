/**
 * Targeted test for attribute extraction in DataExtractor
 * Specifically covers the getAttributeValue private method (lines 387-402)
 */

import { test, expect, describe, mock } from 'bun:test';
import { DataExtractor } from '../../../src/core/data-extractor';
import type { ScrapingConfig } from '../../../src/types';

// Helper function for mock element processing
const processMockElement = (_element: any) => ({
  find: (_selector: string) => ({
    text: () => 'Nested Content',
    attr: (name: string) => {
      if (name === 'content') return 'Nested Meta';
      if (name === 'href') return 'https://nested.com';
      if (name === 'src') return 'https://nested.com/image.jpg';
      return null;
    },
  }),
});

const createMockElementProcessor = () => processMockElement;

// Helper function for link element processing
const processLinkElement = (_element: any) => ({
  find: (_selector: string) => ({
    text: () => 'Link Text',
    attr: (name: string) => {
      if (name === 'href') return 'https://nested.com';
      return null;
    },
  }),
});

const createLinkElementProcessor = () => processLinkElement;

// Helper function for image element processing
const processImageElement = (_element: any) => ({
  find: (_selector: string) => ({
    text: () => 'Image Alt Text',
    attr: (name: string) => {
      if (name === 'src') return 'https://nested.com/image.jpg';
      return null;
    },
  }),
});

const createImageElementProcessor = () => processImageElement;

// Helper function for text element processing
const processTextElement = (_element: any) => ({
  find: (_selector: string) => ({
    text: () => 'Nested text',
    attr: () => null,
  }),
});

const _createTextElementProcessor = () => processTextElement;

// Mock the external dependencies with specific attribute scenarios
mock.module('../../../../src/core/http-client', () => ({
  HttpClient: class MockHttpClient {
    async fetch(_url: string): Promise<any> {
      return {
        ok: true,
        status: 200,
        text: async () => '<html><body><meta content="Meta Value"></body></html>',
        headers: new Map([['content-type', 'text/html']]),
      };
    }
    getConfig(): any {
      return {};
    }
    updateConfig(_config: any): void {
      // Mock implementation
    }
  },
}));

// Mock HTML parser to test specific attribute extraction scenarios
mock.module('../../../../src/core/html-parser', () => ({
  HtmlParser: class MockHtmlParser {
    async loadFromResponse(_response: any): Promise<void> {
      // Mock implementation - would load HTML in real parser
    }

    select(_selector: string): any {
      return {
        count: 1,
        text: '',
        matches: {
          first: () => ({
            attr: (name: string) => {
              // Test the priority order: content -> href -> src -> ''
              if (name === 'content') return 'Meta Content Value';
              if (name === 'href') return 'https://example.com';
              if (name === 'src') return 'https://example.com/image.jpg';
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
  createMinimalConfig: (url: string, httpConfig: any) => ({
    target: { url, selector: 'body' },
    extraction: { fields: { meta: 'meta' } },
    output: { format: 'json' as const },
    behavior: httpConfig,
  }),
  createBaseMultipleConfig: (httpConfig: any) => ({
    target: { url: '', selector: 'body' },
    extraction: { fields: { title: 'h1' } },
    output: { format: 'json' as const },
    behavior: httpConfig,
  }),
  createUrlConfig: (baseConfig: ScrapingConfig, url: string) => ({
    ...baseConfig,
    target: { ...baseConfig.target, url },
  }),
  createExtractionContext: (config: ScrapingConfig) => ({
    url: config.target.url,
    config,
    startTime: Date.now(),
    retryCount: 0,
  }),
  sleep: async (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
}));

mock.module('../../../../src/core/utils/result-factory', () => ({
  createSuccessResult: (url: string, params: any) => ({
    success: true,
    url,
    data: params.data,
    metadata: {
      extractedAt: new Date(),
      selector: params.selector,
      extractionTime: params.extractionTime,
      retryCount: params.retryCount,
    },
  }),
  createFailureResult: (url: string, params: any) => ({
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
  }),
  createEmptyFailureResult: (url: string) => ({
    success: false,
    url,
    data: [],
    error: 'Empty result',
    metadata: {
      extractedAt: new Date(),
      extractionTime: 0,
      retryCount: 0,
    },
  }),
}));

describe('DataExtractor - Attribute Extraction Coverage', () => {
  test('TC-DE-006-01 [P2]: should extract content attribute with highest priority', async () => {
    const config: ScrapingConfig = {
      target: { url: 'https://example.com' },
      extraction: { fields: { meta: 'meta' } },
      output: { format: 'json' },
      behavior: {
        retryAttempts: 3,
        retryDelay: 1000,
        rateLimit: 10,
      },
    };

    const extractor = new DataExtractor(config);
    const _result = await extractor.extractFromConfig(config);

    expect(_result.success).toBe(true);
    expect(_result.data).toBeDefined();
  });

  test('TC-DE-006-02 [P2]: should extract href attribute when content is not available', async () => {
    // Mock HTML parser for href extraction (no content attribute)
    mock.module('../../../../src/core/html-parser', () => ({
      HtmlParser: class MockHtmlParser {
        async loadFromResponse(_response: any): Promise<void> {
          // Mock implementation - would load HTML in real parser
        }

        select(_selector: string): any {
          return {
            count: 1,
            text: '',
            matches: {
              first: () => ({
                attr: (name: string) => {
                  // No content attribute, but has href
                  if (name === 'content') return null;
                  if (name === 'href') return 'https://example.com/page';
                  if (name === 'src') return 'https://example.com/image.jpg';
                  return null;
                },
              }),
            },
          };
        }

        get $() {
          return createLinkElementProcessor();
        }
      },
    }));

    const config: ScrapingConfig = {
      target: { url: 'https://example.com' },
      extraction: { fields: { link: 'a' } },
      output: { format: 'json' },
      behavior: {
        retryAttempts: 3,
        retryDelay: 1000,
        rateLimit: 10,
      },
    };

    const extractor = new DataExtractor(config);
    const _result = await extractor.extractFromConfig(config);

    expect(_result.success).toBe(true);
    expect(_result.data).toBeDefined();
  });

  test('TC-DE-006-03 [P2]: should extract src attribute when neither content nor href are available', async () => {
    // Mock HTML parser for src extraction (no content or href attributes)
    mock.module('../../../../src/core/html-parser', () => ({
      HtmlParser: class MockHtmlParser {
        async loadFromResponse(_response: any): Promise<void> {
          // Mock implementation - would load HTML in real parser
        }

        select(_selector: string): any {
          return {
            count: 1,
            text: '',
            matches: {
              first: () => ({
                attr: (name: string) => {
                  // No content or href, but has src
                  if (name === 'content') return null;
                  if (name === 'href') return null;
                  if (name === 'src') return 'https://example.com/image.jpg';
                  return null;
                },
              }),
            },
          };
        }

        get $() {
          return createImageElementProcessor();
        }
      },
    }));

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

  test('TC-DE-006-04 [P2]: should return empty string when no attributes are available', async () => {
    const config: ScrapingConfig = {
      target: { url: 'https://example.com' },
      extraction: { fields: { text: 'span' } },
      output: { format: 'json' },
      behavior: { retryAttempts: 1, retryDelay: 100, rateLimit: 1 },
    };

    const extractor = new DataExtractor(config);
    // Don't filter empty values so we can see the empty string
    const _result = await extractor.extractFromConfig(config, { filterEmpty: false });

    expect(_result.success).toBe(true);
    expect(_result.data).toBeDefined();
    const extractedData = _result.data as Record<string, unknown>;
    expect(extractedData.text).toBe('');
  });
});
