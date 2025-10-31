import { test, expect, beforeEach, mock } from 'bun:test';
import { readFileSync } from 'node:fs';
import { ConfigManager } from '../../src/core/config';
import { DocumentScraper } from '../../src/core/scraper';

// Mock fetch for integration tests
const mockFetch = mock((_url: string) =>
  Promise.resolve(
    new Response(readFileSync('tests/fixtures/sample-html.html', 'utf-8'), {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'text/html' },
    })
  )
);

global.fetch = mockFetch as any;
(global.fetch as any).preconnect = mock(() => Promise.resolve());

beforeEach(() => {
  mockFetch.mockClear();
});

test('DocumentScraper should perform end-to-end scraping', async () => {
  const config = ConfigManager.loadFromFile('tests/fixtures/sample-config.json');
  const scraper = new DocumentScraper(config);

  const _result = await scraper.scrape();

  expect(mockFetch).toHaveBeenCalledWith('https://example.com/articles', expect.any(Object));
  expect(_result.url).toBe('https://example.com/articles');
  expect(Array.isArray(_result.data)).toBe(true);
  expect(_result.data.length).toBeGreaterThan(0);

  // Check extracted data structure
  const firstItem = (_result.data as Array<Record<string, unknown>>)[0];
  expect(firstItem).toHaveProperty('title');
  expect(firstItem).toHaveProperty('author');
  expect(firstItem).toHaveProperty('date');
  expect(firstItem).toHaveProperty('category');

  expect(_result.metadata).toHaveProperty('extractedAt');
  expect(_result.metadata).toHaveProperty('extractionTime');
  expect(_result.metadata).toHaveProperty('selector');
});

test('DocumentScraper should create scraper from config file', () => {
  const scraper = DocumentScraper.fromConfigFile('tests/fixtures/sample-config.json');

  expect(scraper).toBeInstanceOf(DocumentScraper);
  const config = scraper.getConfig();
  expect(config.target.url).toBe('https://example.com/articles');
});

test('DocumentScraper should create scraper with sample config', () => {
  const scraper = DocumentScraper.withSampleConfig('https://test.com', {
    title: 'h1',
    content: '.content',
  });

  expect(scraper).toBeInstanceOf(DocumentScraper);
  const config = scraper.getConfig();
  expect(config.target.url).toBe('https://test.com');
  expect(config.extraction.fields.title).toBe('h1');
  expect(config.extraction.fields.content).toBe('.content');
});

test('DocumentScraper should handle single item extraction', async () => {
  const config = {
    target: {
      url: 'https://example.com/single',
      selector: 'h1',
    },
    extraction: {
      fields: {
        title: 'h1',
        description: 'meta[name="description"]',
      },
      multiple: false,
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    },
  };

  const scraper = new DocumentScraper(config);
  const _result = await scraper.scrape();

  expect(mockFetch).toHaveBeenCalledWith('https://example.com/single', expect.any(Object));
  expect(_result.url).toBe('https://example.com/single');
  expect(Array.isArray(_result.data)).toBe(false);
  expect(typeof _result.data).toBe('object');

  expect(_result.data).toHaveProperty('title', 'Main Title');
  expect(_result.data).toHaveProperty(
    'description',
    'This is a sample web page for testing web scraping functionality'
  );
});

test('DocumentScraper should validate configuration', () => {
  const scraper = new DocumentScraper(ConfigManager.createSample());
  const validation = scraper.validateConfig();

  expect(validation.valid).toBe(true);
  expect(validation.errors).toHaveLength(0);
});

test('DocumentScraper should update configuration', async () => {
  const scraper = new DocumentScraper(ConfigManager.createSample());

  scraper.setConfig({
    target: {
      url: 'https://updated.com',
    },
  });

  const config = scraper.getConfig();
  expect(config.target.url).toBe('https://updated.com');
});

test('TC-DS-103-01 [P0]: DocumentScraper should handle network errors gracefully', async () => {
  // Mock fetch to always fail for this test
  mockFetch.mockImplementation(() => Promise.reject(new Error('Network error')));

  const config = ConfigManager.createSample();
  config.target.url = 'https://fail.com';
  config.behavior.retryAttempts = 0; // Disable retries for faster test
  config.behavior.timeout = 1000; // Reduce timeout for faster test

  const scraper = new DocumentScraper(config);
  const _result = await scraper.scrape();

  expect(_result.url).toBe('https://fail.com');
  expect(_result.data).toEqual([]); // Should be empty array since config has multiple: true
  expect(_result.success).toBe(false);
  expect(_result.metadata.extractedAt).toBeInstanceOf(Date);
});

test('TC-DS-102-01 [P1]: DocumentScraper should scrape multiple URLs', async () => {
  const config = ConfigManager.createSample();
  config.behavior.retryAttempts = 0; // Disable retries for faster test
  config.behavior.timeout = 1000; // Reduce timeout for faster test
  const scraper = new DocumentScraper(config);
  const urls = ['https://example.com/1', 'https://example.com/2', 'https://example.com/3'];

  const results = await scraper.scrapeMultiple(urls);

  expect(results).toHaveLength(3);
  expect(mockFetch).toHaveBeenCalledTimes(3);
  expect(mockFetch).toHaveBeenCalledWith('https://example.com/1', expect.any(Object));
  expect(mockFetch).toHaveBeenCalledWith('https://example.com/2', expect.any(Object));
  expect(mockFetch).toHaveBeenCalledWith('https://example.com/3', expect.any(Object));

  for (const [index, _result] of results.entries()) {
    expect(_result.url).toBe(urls[index]!);
    expect(_result.metadata.extractedAt).toBeInstanceOf(Date);
  }
});

test('DocumentScraper should handle partial failures in multiple URL scraping', async () => {
  // Mock fetch to fail for second URL
  mockFetch.mockImplementation((url: string) => {
    if (url === 'https://example.com/fail') {
      return Promise.reject(new Error('Network error'));
    }
    return Promise.resolve(
      new Response(readFileSync('tests/fixtures/sample-html.html', 'utf-8'), {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'text/html' },
      })
    );
  });

  const config = ConfigManager.createSample();
  config.behavior.retryAttempts = 0; // Disable retries for faster test
  config.behavior.timeout = 1000; // Reduce timeout for faster test

  const scraper = new DocumentScraper(config);
  const urls = [
    'https://example.com/success',
    'https://example.com/fail',
    'https://example.com/success2',
  ];

  const results = await scraper.scrapeMultiple(urls);

  expect(results).toHaveLength(3);
  expect(results[0]?.data).toBeTruthy();
  expect(results[1]?.data).toEqual([]);
  expect(results[2]?.data).toBeTruthy();
});

test('DocumentScraper should work with YAML configuration', () => {
  const scraper = DocumentScraper.fromConfigFile('tests/fixtures/sample-config.yaml');

  expect(scraper).toBeInstanceOf(DocumentScraper);
  const config = scraper.getConfig();
  expect(config.target.url).toBe('https://example.com/products');
  expect(config.extraction.fields.name).toBe('.product-name');
  expect(config.output.format).toBe('csv');
});

test('DocumentScraper should apply transformations', async () => {
  const config = {
    target: {
      url: 'https://example.com/transform',
      selector: 'article',
    },
    extraction: {
      fields: {
        title: 'h2',
        date: '.date',
      },
      multiple: true,
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    },
  };

  const scraper = new DocumentScraper(config);
  const extractor = scraper.getExtractor();

  // Add transformation to convert date string to Date object
  extractor.addTransform('date', (value: string) => new Date(value));

  const _result = await scraper.scrape();

  expect(Array.isArray(_result.data)).toBe(true);
  expect(_result.data.length).toBeGreaterThan(0);

  const firstItem = (_result.data as Array<Record<string, unknown>>)[0];
  expect(firstItem?.date).toBeInstanceOf(Date);
});

test('DocumentScraper should apply filters', async () => {
  const config = {
    target: {
      url: 'https://example.com/filter',
      selector: 'article',
    },
    extraction: {
      fields: {
        title: 'h2',
        category: '.category',
      },
      multiple: true,
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    },
  };

  const scraper = new DocumentScraper(config);
  const extractor = scraper.getExtractor();

  // Add filter to only include Technology category
  extractor.addFilter('category', (value: unknown) => (value as string) === 'Technology');

  const _result = await scraper.scrape();

  expect(Array.isArray(_result.data)).toBe(true);
  expect(_result.data.length).toBeGreaterThan(0);

  for (const item of _result.data as Array<Record<string, unknown>>) {
    expect(item.category).toBe('Technology');
  }
});

test('DocumentScraper should normalize data types', async () => {
  const config = {
    target: {
      url: 'https://example.com/normalize',
      selector: 'article',
    },
    extraction: {
      fields: {
        title: 'h2',
        testNumber: '.date', // This will be a string that looks like a number
        testBoolean: '.category', // This will test boolean conversion
      },
      multiple: false,
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 10,
    },
  };

  const scraper = new DocumentScraper(config);
  const result = await scraper.scrape();

  expect(typeof result.data).toBe('object');
  expect(typeof (result.data as Record<string, unknown>).title).toBe('string');
  // The normalization should be applied automatically
});

test('DocumentScraper should maintain metadata integrity', async () => {
  const config = ConfigManager.createSample();
  config.target.waitFor = 100; // Add wait time for testing

  const scraper = new DocumentScraper(config);
  const _result = await scraper.scrape();

  expect(_result.metadata).toHaveProperty('extractedAt');
  expect(_result.metadata).toHaveProperty('extractionTime');
  expect(_result.metadata).toHaveProperty('retryCount');
  expect(_result.metadata).toHaveProperty('selector');
  expect(typeof _result.metadata.extractionTime).toBe('number');
  expect(_result.metadata.extractionTime).toBeGreaterThan(0);
  expect(_result.metadata.retryCount).toBeGreaterThanOrEqual(0);
});
