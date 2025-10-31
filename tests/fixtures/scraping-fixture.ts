/**
 * Reusable fixtures for scraping tests with auto-cleanup and composition support
 * Enhanced with proper resource management and deterministic wait patterns
 */

import { mock, afterEach, beforeAll } from 'bun:test';
import { unlinkSync } from 'node:fs';
import { DocumentScraper } from '../../src/core/scraper';
import { MockResponseFactory } from '../factories/mock-response.factory';
import {
  createScrapingConfig,
  createMinimalScrapingConfig,
  createComplexScrapingConfig,
  createBasicHtml,
  createArticleListHtml,
    createUniqueUrl
} from '../utils/factories/index';

/**
 * HTTP Client Test Fixture
 * Provides mock HTTP client with proper setup and cleanup
 */
export function setupHttpClientTest() {
  const mockFetch = mock(() =>
    Promise.resolve(MockResponseFactory.html('<html><body>Test content</body></html>'))
  );

  // Create global fetch with mock methods
  const globalFetch = Object.assign(mockFetch, {
    preconnect: mock(() => Promise.resolve()),
  });

  (global as any).fetch = globalFetch;

  const cleanup = () => {
    mockFetch.mockClear();
    delete (global as any).fetch;
  };

  return {
    fetchMock: mockFetch,
    globalFetch,
    resetMocks: () => mockFetch.mockClear(),
    cleanup
  };
}

/**
 * Basic Scraping Test Fixture
 * Provides a basic scraping setup with HTML content and configuration
 */
export function createBasicScrapingFixture() {
  const httpClientTest = setupHttpClientTest();

  const htmlContent = createBasicHtml({
    title: 'Test Article',
    content: 'This is test content for scraping.'
  });

  httpClientTest.fetchMock.mockImplementation(() =>
    Promise.resolve(MockResponseFactory.html(htmlContent))
  );

  const config = createMinimalScrapingConfig({
    target: { url: createUniqueUrl('/article') },
    extraction: {
      fields: {
        title: 'h1',
        content: '.content',
      },
      multiple: false,
    }
  });

  const scraper = new DocumentScraper(config);

  return {
    httpClientTest,
    scraper,
    config,
    htmlContent,
    expectedUrl: config.target.url
  };
}

/**
 * Article List Scraping Test Fixture
 * Provides a multi-article scraping setup
 */
export function createArticleListFixture() {
  const httpClientTest = setupHttpClientTest();
  const articleCount = 3;
  const htmlContent = createArticleListHtml(articleCount);
  const uniqueUrl = createUniqueUrl('/articles');

  httpClientTest.fetchMock.mockImplementation(() =>
    Promise.resolve(MockResponseFactory.html(htmlContent))
  );

  const config = createComplexScrapingConfig({
    target: {
      url: uniqueUrl,
      selector: 'article.post'
    },
    extraction: {
      fields: {
        title: 'h2',
        author: '.author',
        date: '.date',
        content: '.content',
        tags: '.tags',
      },
      multiple: true,
    }
  });

  const scraper = new DocumentScraper(config);

  return {
    httpClientTest,
    scraper,
    config,
    htmlContent,
    articleCount,
    expectedUrl: uniqueUrl
  };
}

/**
 * Error Scenario Test Fixture
 * Provides setup for testing error handling scenarios
 */
export function createErrorScenarioFixture() {
  const httpClientTest = setupHttpClientTest();
  const config = createScrapingConfig({
    target: {
      url: 'https://nonexistent-domain-12345.com',
      selector: 'nonexistent-selector'
    },
    behavior: {
      retryAttempts: 1,
      retryDelay: 100,
      rateLimit: 1,
    }
  });

  httpClientTest.fetchMock.mockRejectedValue(new Error('Network error'));

  const scraper = new DocumentScraper(config);

  return {
    httpClientTest,
    scraper,
    config,
    errorType: 'network'
  };
}

/**
 * Rate Limiting Test Fixture
 * Provides setup for testing rate limiting scenarios
 */
export function createRateLimitingFixture() {
  const httpClientTest = setupHttpClientTest();
  const htmlContent = createBasicHtml();
  const requestUrls = [
    createUniqueUrl('/page1'),
    createUniqueUrl('/page2'),
    createUniqueUrl('/page3')
  ];

  httpClientTest.fetchMock.mockImplementation(() =>
    Promise.resolve(MockResponseFactory.html(htmlContent))
  );

  const config = createScrapingConfig({
    behavior: {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 5, // 5 requests per minute
      userAgent: 'docs-scrape-test/1.0.0',
    }
  });

  const scraper = new DocumentScraper(config);

  return {
    httpClientTest,
    scraper,
    config,
    requestUrls,
    htmlContent
  };
}

/**
 * File Management Test Fixture
 * Provides auto-cleanup for temporary files created during tests
 */
export function createFileManagementFixture() {
  const createdFiles: string[] = [];

  const createTestFile = (path: string, content: string): string => {
    Bun.write(path, content);
    createdFiles.push(path);
    return path;
  };

  const createTestConfig = (config: unknown, filename?: string): string => {
    const configPath = filename || `test-config-${Date.now()}.json`;
    Bun.write(configPath, JSON.stringify(config, null, 2));
    createdFiles.push(configPath);
    return configPath;
  };

  const cleanup = async () => {
    for (const filePath of createdFiles) {
      try {
        const file = Bun.file(filePath);
        if (await file.exists()) {
          // Use a proper file deletion method
          unlinkSync(filePath);
        }
      } catch {
        // File might not exist, ignore
      }
    }
    createdFiles.length = 0;
  };

  return {
    createTestFile,
    createTestConfig,
    createdFiles: () => [...createdFiles], // Return copy for inspection
    cleanup
  };
}

/**
 * HTML Content Test Fixture
 * Provides various HTML content scenarios for testing
 */
export function createHtmlContentFixture() {
  const basic = createBasicHtml();
  const articleList = createArticleListHtml(3);
  const complex = `
    <div class="container">
      <section class="products">
        <div class="product" data-id="1" data-price="29.99">
          <h3 class="title">Product 1</h3>
          <span class="price">$29.99</span>
        </div>
        <div class="product" data-id="2" data-price="49.99">
          <h3 class="title">Product 2</h3>
          <span class="price">$49.99</span>
        </div>
      </section>
    </div>
  `;

  return { basic, articleList, complex };
}

/**
 * Export specific test fixtures for different scenarios
 */
export const basicScrapingTest = createBasicScrapingFixture;
export const articleListTest = createArticleListFixture;
export const errorScenarioTest = createErrorScenarioFixture;
export const rateLimitingTest = createRateLimitingFixture;
export const fileManagementTest = createFileManagementFixture;
export const htmlContentTest = createHtmlContentFixture;

/**
 * Composable helper functions for common test patterns
 */
export const TestPatterns = {
  /**
   * Creates a standard scraping test pattern
   */
  createStandardScrapingTest: (configOverrides: Record<string, unknown> = {}) => {
    const config = createScrapingConfig(configOverrides);
    const htmlContent = createBasicHtml();

    return {
      config,
      htmlContent,
      scraper: new DocumentScraper(config),
      expectedFields: Object.keys(config.extraction.fields),
    };
  },

  /**
   * Creates a multi-item scraping test pattern
   */
  createMultiItemScrapingTest: (itemCount = 3, configOverrides: Record<string, unknown> = {}) => {
    const config = createComplexScrapingConfig({
      target: configOverrides.target as { url: string; selector?: string; waitFor?: number } | undefined,
      behavior: configOverrides.behavior as {
        retryAttempts: number;
        retryDelay: number;
        rateLimit: number;
        userAgent?: string;
        headers?: Record<string, string>
      } | undefined,
      extraction: {
        fields: {
          title: 'h2',
          author: '.author',
          date: '.date',
          content: '.content',
          tags: '.tags',
        },
        ...(configOverrides.extraction as Record<string, unknown>),
        multiple: true,
      }
    });
    const htmlContent = createArticleListHtml(itemCount);

    return {
      config,
      htmlContent,
      scraper: new DocumentScraper(config),
      expectedItems: itemCount,
      expectedFields: Object.keys(config.extraction.fields),
    };
  },

  /**
   * Creates an error scenario test pattern
   */
  createErrorScenarioTest: (errorType: 'network' | 'parsing' | 'validation') => {
    const config = createErrorScrapingConfig();

    return {
      config,
      scraper: new DocumentScraper(config),
      errorType,
      shouldFail: true,
    };
  },
};

/**
 * Enhanced utilities for deterministic testing and resource management
 */
export const DeterministicUtils = {
  /**
   * Wait for a condition with timeout, avoiding hard sleeps
   */
  waitForCondition: async <T>(
    condition: () => Promise<T> | T,
    timeoutMs = 5000,
    checkIntervalMs = 100
  ): Promise<T> => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        return await condition();
      } catch {
        // Condition not yet met, continue waiting
      }

      if (Date.now() - startTime < timeoutMs) {
        await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
      }
    }

    throw new Error(`Condition not met within ${timeoutMs}ms`);
  },

  /**
   * Assert timing is within reasonable bounds
   */
  assertReasonableTiming: (
    startTime: number,
    endTime: number,
    minMs = 0,
    maxMs = 5000
  ): void => {
    const elapsed = endTime - startTime;
    if (minMs > 0 && elapsed < minMs) {
      throw new Error(`Expected at least ${minMs}ms, got ${elapsed}ms`);
    }
    if (elapsed > maxMs) {
      throw new Error(`Expected at most ${maxMs}ms, got ${elapsed}ms`);
    }
  },

  /**
   * Create a promise that resolves after a delay (for legitimate timing tests)
   */
  createTimedPromise: <T>(value: T, delayMs: number): Promise<T> => {
    return new Promise(resolve => {
      setTimeout(() => resolve(value), delayMs);
    });
  },

  /**
   * Measure execution time of an async operation
   */
  measureTime: async <T>(operation: () => Promise<T>): Promise<{ result: T; elapsedMs: number }> => {
    const startTime = Date.now();
    const result = await operation();
    const elapsedMs = Date.now() - startTime;
    return { result, elapsedMs };
  },
};

/**
 * Enhanced resource cleanup utilities
 */
export const ResourceCleanup = {
  /**
   * Global resource tracker for cleanup across tests
   */
  globalResources: {
    createdFiles: [] as string[],
    createdConfigs: [] as unknown[],
    cleanupTasks: [] as Array<() => Promise<void> | void>,

    trackFile(filePath: string): void {
      this.createdFiles.push(filePath);
    },

    trackConfig(config: unknown): void {
      this.createdConfigs.push(config);
    },

    addCleanupTask(task: () => Promise<void> | void): void {
      this.cleanupTasks.push(task);
    },

    async cleanupAll(): Promise<void> {
      // Clean up files
      for (const filePath of this.createdFiles) {
        try {
          const file = Bun.file(filePath);
          if (await file.exists()) {
            unlinkSync(filePath);
          }
        } catch {
          // Silently handle cleanup errors - test fixtures shouldn't pollute console output
        }
      }

      // Execute cleanup tasks
      for (const task of [...this.cleanupTasks].reverse()) {
        try {
          await task();
        } catch {
          // Silently handle cleanup errors - test fixtures shouldn't pollute console output
        }
      }

      // Clear all trackers
      this.createdFiles.length = 0;
      this.createdConfigs.length = 0;
      this.cleanupTasks.length = 0;
    },
  },

  /**
   * Setup automatic cleanup for all tests
   */
  setupGlobalCleanup(): void {
    beforeAll(() => {
      // Initialize clean state
      this.globalResources.cleanupAll();
    });

    afterEach(async () => {
      // Cleanup after each test
      await this.globalResources.cleanupAll();
    });
  },
};

/**
 * Enhanced HTTP Client Test Fixture with deterministic timing
 */
export function setupEnhancedHttpClientTest() {
  let requestCount = 0;
  let abortedRequests = 0;

  const mockFetch = mock((url: string, options?: RequestInit) => {
    requestCount++;

    // Track abort signal usage
    if (options?.signal) {
      if (options.signal.aborted) {
        abortedRequests++;
        const error = new Error('Request aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      }

      options.signal.addEventListener('abort', () => {
        abortedRequests++;
      });
    }

    // Default success response
    return Promise.resolve(MockResponseFactory.html('<html><body>Default response</body></html>'));
  });

  // Add tracking properties
  (mockFetch as any).getRequestCount = () => requestCount;
  (mockFetch as any).getAbortedRequests = () => abortedRequests;
  (mockFetch as any).resetCounters = () => {
    requestCount = 0;
    abortedRequests = 0;
  };

  // Create global fetch with mock methods
  const globalFetch = Object.assign(mockFetch, {
    preconnect: mock(() => Promise.resolve()),
  });

  (global as any).fetch = globalFetch;

  // Add cleanup to global tracker
  ResourceCleanup.globalResources.addCleanupTask(() => {
    mockFetch.mockClear();
    delete (global as any).fetch;
  });

  return {
    fetchMock: mockFetch,
    globalFetch,
    resetMocks: () => {
      mockFetch.mockClear();
      (mockFetch as any).resetCounters();
    },
    getRequestCount: () => (mockFetch as any).getRequestCount(),
    getAbortedRequests: () => (mockFetch as any).getAbortedRequests(),
  };
}

/**
 * Import the error config factory (circular import workaround)
 */
function createErrorScrapingConfig() {
  return createScrapingConfig({
    target: {
      url: 'https://nonexistent-domain-12345.com',
      selector: 'nonexistent-selector'
    },
    behavior: {
      retryAttempts: 1,
      retryDelay: 100,
      rateLimit: 1,
    }
  });
}