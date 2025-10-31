/**
 * Bun-compatible fixtures for scraping tests
 */

import { mock } from 'bun:test';
import { unlinkSync, rmdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
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
 * Setup HTTP client with mocking
 */
export function setupHttpClientTest() {
  const mockFetch = mock(() =>
    Promise.resolve(MockResponseFactory.html('<html><body>Test content</body></html>'))
  );

  // Add the preconnect property to match the expected fetch interface
  Object.defineProperty(mockFetch, 'preconnect', {
    value: () => Promise.resolve(),
    writable: false,
    configurable: true,
  });

  (global as any).fetch = mockFetch;

  return {
    fetchMock: mockFetch,
    resetMocks: () => mockFetch.mockClear()
  };
}

/**
 * Create a basic scraping test setup
 */
export function createBasicScrapingTest() {
  const { fetchMock } = setupHttpClientTest();

  const htmlContent = createBasicHtml({
    title: 'Test Article',
    content: 'This is test content for scraping.'
  });

  fetchMock.mockImplementation(() =>
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
    scraper,
    config,
    htmlContent,
    expectedUrl: config.target.url
  };
}

/**
 * Create an article list scraping test setup
 */
export function createArticleListScrapingTest() {
  const { fetchMock } = setupHttpClientTest();

  const articleCount = 3;
  const htmlContent = createArticleListHtml(articleCount);
  const uniqueUrl = createUniqueUrl('/articles');

  fetchMock.mockImplementation(() =>
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
    scraper,
    config,
    htmlContent,
    articleCount,
    expectedUrl: uniqueUrl
  };
}

/**
 * File management utilities for tests
 */
export function createTestFileManager() {
  const createdFiles: string[] = [];

  const createTestFile = (path: string, content: string): string => {
    Bun.write(path, content);
    createdFiles.push(path);
    return path;
  };

  const createTestConfig = (config: any, filename?: string): string => {
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
    createdFiles: () => [...createdFiles],
    cleanup
  };
}

/**
 * Test patterns for common scenarios
 */
export const TestPatterns = {
  /**
   * Creates a standard scraping test pattern
   */
  createStandardScrapingTest: (configOverrides: any = {}) => {
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
  createMultiItemScrapingTest: (itemCount = 3, configOverrides: any = {}) => {
    const config = createComplexScrapingConfig({
      ...configOverrides,
      extraction: {
        ...configOverrides.extraction,
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

    return {
      config,
      scraper: new DocumentScraper(config),
      errorType,
      shouldFail: true,
    };
  },
};

/**
 * Enhanced cleanup utilities
 */
export function createEnhancedCleanup() {
  const trackedResources: Array<() => Promise<void>> = [];

  const trackFile = (filePath: string) => {
    trackedResources.push(async () => {
      try {
        const file = Bun.file(filePath);
        if (await file.exists()) {
          // Use a proper file deletion method
          unlinkSync(filePath);
        }
      } catch {
        // File might not exist, ignore
      }
    });
  };

  const trackCleanup = (cleanupFn: () => void | Promise<void>) => {
    trackedResources.push(async () => {
      await cleanupFn();
    });
  };

  const cleanupAll = () => {
    for (const cleanup of trackedResources) {
      try {
        cleanup();
      } catch {
        // Cleanup failed, but continue with other cleanup functions
      }
    }
    trackedResources.length = 0;
  };

  return {
    trackFile,
    trackCleanup,
    cleanupAll
  };
}

/**
 * Auto-cleaning utilities
 */
export function createAutoCleaningFile(content: string, filename?: string): string {
  const tempDir = mkdtempSync('test-');
  const filePath = join(tempDir, filename || `test-${Date.now()}.tmp`);

  Bun.write(filePath, content);

  // Auto-cleanup after tests
  setTimeout(async () => {
    try {
      const file = Bun.file(filePath);
      if (await file.exists()) {
        // Use a proper file deletion method
        unlinkSync(filePath);
        rmdirSync(tempDir);
      }
    } catch {
      // Cleanup failed, ignore
    }
  }, 1000);

  return filePath;
}

export function createAutoCleaningConfig(config: any, format = 'json'): string {
  const content = format === 'json'
    ? JSON.stringify(config, null, 2)
    : `# YAML Configuration\ntarget:\n  url: ${config.target?.url || 'https://example.com'}\n  selector: ${config.target?.selector || 'article'}\n`;

  return createAutoCleaningFile(content, `config-${Date.now()}.${format}`);
}