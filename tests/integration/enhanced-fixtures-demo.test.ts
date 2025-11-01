/**
 * Enhanced Fixture Demo Test
 *
 * This test demonstrates the improved fixture architecture with:
 * - Auto-cleanup patterns
 * - Dynamic data generation with faker
 * - Proper isolation
 * - No hardcoded test data
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { DocumentScraper } from '../../src/core/scraper';
import { HtmlContentFactory } from '../factories/html-content.factory';
import { HttpClientConfigFactory } from '../factories/http-client-config.factory';
import { TestScenarios } from '../factories/index';
import { createTestData, TestFixtureManager } from '../fixtures/test-fixture';
import { setupFetchMock } from '../helpers/test-setup.helper';

describe('Enhanced Fixture Architecture Demo', () => {
  let fixtureManager: TestFixtureManager;

  beforeEach(() => {
    // Set up fixture manager for each test
    fixtureManager = new TestFixtureManager();
  });

  afterEach(() => {
    // Clean up after each test
    fixtureManager.executeAllCleanup();
  });

  test('TC-FIXTURE-001 [P1]: Given enhanced fixtures, when scraping, then it should use dynamic data', async () => {
    // Given: Dynamic test data using faker
    const testData = createTestData;
    const htmlContent = testData.htmlContent({
      title: 'Dynamic Test Article',
      category: 'technology',
    });

    const scrapingConfig = testData.scrapingConfig({
      target: {
        url: 'https://example.com/dynamic-test',
        selector: 'article.post',
      },
      extraction: {
        fields: {
          title: 'h1',
          content: 'p',
          category: '[data-category]',
        },
        multiple: true,
      },
      // Add required configurations for DocumentScraper
      output: {
        format: 'json',
        filePath: 'test-output.json',
      },
      behavior: {
        retryAttempts: 1,
        retryDelay: 100,
        rateLimit: 10,
        userAgent: 'test-agent',
        headers: {},
      },
    });

    // Set up fetch mock with auto-cleanup
    const fetchMock = setupFetchMock();
    const originalFetch = global.fetch;
    global.fetch = fetchMock;

    fixtureManager.addCleanup(() => {
      global.fetch = originalFetch;
      fetchMock.mockRestore();
    });

    // Mock response
    fetchMock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success(htmlContent.content))
    );

    // Add manual cleanup for demonstration
    fixtureManager.addCleanup(() => {
      // Custom cleanup executed
    });

    // When: Scraping with dynamic configuration
    const scraper = new DocumentScraper(scrapingConfig);
    const result = await scraper.scrape();

    // Then: Should succeed with dynamic data
    expect(result).toBeDefined();
    expect(result.url).toBe(scrapingConfig.target.url);
    expect(result.metadata.extractedAt).toBeInstanceOf(Date);

    // Verify fetch was called
    expect(fetchMock).toHaveBeenCalled();
  });

  test('TC-FIXTURE-002 [P1]: Given HTTP client fixture, when making requests, then it should use dynamic config', async () => {
    // Given: Dynamic HTTP client configuration
    const testData = createTestData;
    const httpClientConfig = testData.httpClientConfig({
      retryAttempts: 2,
      rateLimit: 50,
    });

    // Mock response
    const dynamicHtml = testData.htmlContent({
      title: 'HTTP Client Test',
      content: 'Testing dynamic HTTP client configuration',
    });

    // setupFetchMock already imported
    const fetchMock = setupFetchMock();
    const originalFetch = global.fetch;
    global.fetch = fetchMock;

    fixtureManager.addCleanup(() => {
      global.fetch = originalFetch;
      fetchMock.mockRestore();
    });

    fetchMock.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        ok: true,
        text: () => Promise.resolve(dynamicHtml.content),
        headers: new Headers({
          'content-type': 'text/html',
        }),
      })
    );

    // When: Making HTTP request with dynamic config
    const response = await fetch('https://example.com/test', {
      headers: {
        'User-Agent': httpClientConfig.userAgent,
      },
    });

    // Then: Should use dynamic configuration
    expect(response.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalled();

    // Verify the dynamic user agent was used
    const calls = fetchMock.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const [, options] = calls[0];
    expect(options?.headers).toHaveProperty('User-Agent');
    expect(httpClientConfig.userAgent).toBeDefined();
  });

  test('TC-FIXTURE-003 [P2]: Given data factory, when creating test data, then it should be unique and realistic', () => {
    // Given: Data factory functions
    const htmlData1 = createTestData.htmlContent();
    const htmlData2 = createTestData.htmlContent();
    const scrapingConfig = createTestData.scrapingConfig();
    const httpClientConfig = createTestData.httpClientConfig();

    // When: Creating multiple data instances
    // Then: Should be unique
    expect(htmlData1.id).not.toBe(htmlData2.id);
    expect(htmlData1.title).not.toBe(htmlData2.title);
    expect(htmlData1.timestamp).not.toBe(htmlData2.timestamp);

    // Should have realistic data
    expect(htmlData1.category).toBeDefined();
    expect(typeof htmlData1.itemCount).toBe('number');
    expect(scrapingConfig.target.url).toMatch(/^https?:\/\//);
    expect(httpClientConfig.userAgent).toBeDefined();
    expect(httpClientConfig.userAgent.length).toBeGreaterThan(0);
    expect(httpClientConfig.retryAttempts).toBeGreaterThan(0);
    expect(httpClientConfig.retryDelay).toBeGreaterThan(0);
  });

  test('TC-FIXTURE-004 [P2]: Given concurrent tests, when creating data, then it should not collide', async () => {
    // Given: Multiple data creation operations
    const createDataPromises = Array.from({ length: 10 }, () =>
      Promise.resolve({
        html: createTestData.htmlContent(),
        config: createTestData.scrapingConfig(),
        httpClient: createTestData.httpClientConfig(),
      })
    );

    // When: Creating data concurrently
    const results = await Promise.all(createDataPromises);

    // Then: All data should be unique
    const ids = new Set();
    const titles = new Set();
    const urls = new Set();

    for (const result of results) {
      // Check for duplicates
      expect(ids.has(result.html.id)).toBe(false);
      expect(titles.has(result.html.title)).toBe(false);
      expect(urls.has(result.config.target.url)).toBe(false);

      // Add to sets
      ids.add(result.html.id);
      titles.add(result.html.title);
      urls.add(result.config.target.url);
    }

    // Should have created 10 unique items
    expect(ids.size).toBe(10);
    expect(titles.size).toBe(10);
    expect(urls.size).toBe(10);
  });

  test('TC-FIXTURE-005 [P2]: Given fixture manager, when using auto-cleanup, then it should restore state', async () => {
    // Given: Original fetch state
    const originalFetch = global.fetch;

    // When: Using fixture manager
    // setupFetchMock already imported
    const fetchMock = setupFetchMock();
    global.fetch = fetchMock;

    fixtureManager.addCleanup(() => {
      global.fetch = originalFetch;
      fetchMock.mockRestore();
    });

    expect(global.fetch).toBe(fetchMock);
    expect(global.fetch).not.toBe(originalFetch);

    // Then: Cleanup should restore original state
    fixtureManager.executeAllCleanup();
    expect(global.fetch).toBe(originalFetch);
  });
});

describe('Enhanced Data Factory Features', () => {
  test('TC-FIXTURE-006 [P2]: Given faker integration, when creating HTML content, then it should be realistic', () => {
    // Given: HTML content factory
    // HtmlContentFactory already imported

    // When: Creating different types of HTML content
    const basicContent = HtmlContentFactory.basic();
    const articlesContent = HtmlContentFactory.withArticles(5);
    const dataAttributesContent = HtmlContentFactory.withDataAttributes(3);

    // Then: Should contain realistic, dynamic data
    expect(basicContent).toContain('<meta name="test-id"');
    expect(basicContent).toContain('<span class="author">');
    expect(basicContent).toMatch(/\d{4}-\d{2}-\d{2}/); // Date format

    // Articles should have dynamic content
    expect(articlesContent).toContain('data-category="');
    expect(articlesContent).toMatch(/<span class="tag">[^<]+<\/span>/g);

    // Data attributes should have realistic product data
    expect(dataAttributesContent).toContain('data-price="');
    expect(dataAttributesContent).toContain('data-rating="');
    expect(dataAttributesContent).toMatch(/\$\d+\.\d{2}/); // Price format
    expect(dataAttributesContent).toMatch(/Rating: \d\.\d/); // Rating format
  });

  test('TC-FIXTURE-007 [P2]: Given faker integration, when creating HTTP configs, then they should be realistic', () => {
    // Given: HTTP client config factory
    // HttpClientConfigFactory already imported

    // When: Creating different configurations
    const basicConfig = HttpClientConfigFactory.basic();
    const customHeadersConfig = HttpClientConfigFactory.withCustomHeaders({});
    const rateLimitConfig = HttpClientConfigFactory.forRateTesting(25);

    // Then: Should have realistic, dynamic data
    expect(basicConfig.userAgent).toContain('docs-scrape-test/');
    expect(basicConfig.headers).toHaveProperty('X-Test-ID');
    expect(basicConfig.headers).toHaveProperty('X-Test-Timestamp');
    expect(basicConfig.retryAttempts).toBeGreaterThan(0);
    expect(basicConfig.retryAttempts).toBeLessThanOrEqual(5);

    // Custom headers should have realistic auth tokens
    expect(customHeadersConfig.headers).toBeDefined();
    expect(customHeadersConfig.headers!.Authorization).toMatch(/^Bearer [\dA-Za-z]{40}$/);
    expect(customHeadersConfig.headers!['X-API-Key']).toMatch(/^[\dA-Za-z]{32}$/);

    // Rate limit config should use provided value
    expect(rateLimitConfig.rateLimit).toBe(25);
  });
});
