/**
 * Enhanced Test Fixture Architecture
 *
 * Provides proper fixture patterns with auto-cleanup following the
 * pure function → fixture pattern from test-quality.md
 * Adapted for Bun Test which doesn't have extend method
 */

import { test, describe, beforeAll, afterAll, beforeEach, afterEach, expect } from 'bun:test';
import { faker } from '@faker-js/faker';
import { TestScenarios, resetAllFactories } from '../factories/index';
import { setupFetchMock, type FetchMock } from '../helpers/test-setup.helper';

// Type definitions for our fixture system
interface DynamicTestData {
  createHtmlContent: (overrides?: Partial<HtmlContentData>) => HtmlContentData;
  createScrapingConfig: (overrides?: Partial<ScrapingConfigData>) => ScrapingConfigData;
  createHttpClientConfig: (overrides?: Partial<HttpClientConfigData>) => HttpClientConfigData;
  createUniqueIdentifier: () => string;
  createTimestamp: () => Date;
}

interface HtmlContentData {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  category?: string;
  itemCount?: number;
}

interface ScrapingConfigData {
  id: string;
  target: {
    url: string;
    selector: string;
  };
  extraction: {
    fields: Record<string, string>;
    multiple: boolean;
  };
  output: {
    format: 'json' | 'csv' | 'database';
    filename?: string;
    filePath?: string;
  };
  behavior: {
    retryAttempts: number;
    retryDelay: number;
    rateLimit: number;
    timeout?: number;
    userAgent?: string;
    headers?: Record<string, string>;
  };
  timestamp: Date;
}

interface HttpClientConfigData {
  id: string;
  retryAttempts: number;
  retryDelay: number;
  rateLimit: number;
  timeout?: number;
  userAgent: string;
  timestamp: Date;
}

/**
 * Test fixture manager with auto-cleanup
 */
export class TestFixtureManager {
  private static instances = new Map<string, TestFixtureManager>();
  private cleanupFunctions: Array<() => void> = [];
  private createdResources: Array<{
    type: string;
    id: string;
    cleanup: () => void;
  }> = [];

  static getInstance(testName: string): TestFixtureManager {
    if (!this.instances.has(testName)) {
      this.instances.set(testName, new TestFixtureManager());
    }
    return this.instances.get(testName)!;
  }

  static cleanup(testName: string): void {
    const instance = this.instances.get(testName);
    if (instance) {
      instance.executeAllCleanup();
      this.instances.delete(testName);
    }
  }

  /**
   * Set up fetch mock with auto-cleanup
   */
  setupFetchMock(): FetchMock {
    const fetchMock = setupFetchMock();
    const originalFetch = global.fetch;
    global.fetch = fetchMock;

    // Add auto-cleanup
    this.addCleanup(() => {
      global.fetch = originalFetch;
      fetchMock.mockRestore();
    });

    return fetchMock;
  }

  /**
   * Create dynamic test data with faker integration
   */
  createTestData(): DynamicTestData {
    return {
      createHtmlContent: (overrides: Partial<HtmlContentData> = {}) => {
        const htmlContent: HtmlContentData = {
          id: faker.string.uuid(),
          title: faker.lorem.words(3),
          content: faker.lorem.paragraphs(2),
          timestamp: faker.date.recent(),
          category: faker.helpers.arrayElement(['articles', 'products', 'news']),
          itemCount: faker.number.int({ min: 1, max: 10 }),
          ...overrides,
        };

        // Track for cleanup (though HTML content doesn't need explicit cleanup)
        this.createdResources.push({
          type: 'htmlContent',
          id: htmlContent.id,
          cleanup: () => {
            // HTML content is immutable, no cleanup needed
          },
        });

        return htmlContent;
      },

      createScrapingConfig: (overrides: Partial<ScrapingConfigData> = {}) => {
        const config: ScrapingConfigData = {
          id: faker.string.uuid(),
          target: {
            url: faker.internet.url(),
            selector: faker.helpers.arrayElement(['.product-card', '.article', '.item']),
          },
          extraction: {
            fields: {
              title: faker.helpers.arrayElement(['h1', 'h2', '.title']),
              content: faker.helpers.arrayElement(['.content', '.description', 'p']),
              price: faker.helpers.arrayElement(['.price', '[data-price]']),
              category: faker.helpers.arrayElement(['.category', '[data-category]']),
            },
            multiple: faker.datatype.boolean(),
          },
          output: {
            format: faker.helpers.arrayElement(['json', 'csv', 'database']),
            filename: faker.system.fileName(),
            filePath: faker.system.filePath(),
          },
          behavior: {
            retryAttempts: faker.number.int({ min: 1, max: 5 }),
            retryDelay: faker.number.int({ min: 100, max: 5000 }),
            rateLimit: faker.number.int({ min: 10, max: 100 }),
            timeout: faker.datatype.boolean() ? faker.number.int({ min: 5000, max: 30000 }) : undefined,
            userAgent: faker.internet.userAgent(),
            headers: {
              'X-Test-ID': faker.string.uuid(),
              'X-Test-Timestamp': faker.date.recent().toISOString(),
            },
          },
          timestamp: faker.date.recent(),
          ...overrides,
        };

        return config;
      },

      createHttpClientConfig: (overrides: Partial<HttpClientConfigData> = {}) => {
        const config: HttpClientConfigData = {
          id: faker.string.uuid(),
          retryAttempts: faker.number.int({ min: 1, max: 5 }),
          retryDelay: faker.number.int({ min: 100, max: 5000 }),
          rateLimit: faker.number.int({ min: 10, max: 100 }),
          timeout: faker.datatype.boolean() ? faker.number.int({ min: 5000, max: 30000 }) : undefined,
          userAgent: faker.internet.userAgent(),
          timestamp: faker.date.recent(),
          ...overrides,
        };

        return config;
      },

      createUniqueIdentifier: () => faker.string.uuid(),
      createTimestamp: () => faker.date.recent(),
    };
  }

  /**
   * Set up test scenarios with factory reset
   */
  setupTestScenarios(): typeof TestScenarios {
    resetAllFactories();

    // Add auto-cleanup
    this.addCleanup(() => {
      resetAllFactories();
    });

    return TestScenarios;
  }

  /**
   * Add cleanup function
   */
  addCleanup(fn: () => void): void {
    this.cleanupFunctions.push(fn);
  }

  /**
   * Execute all cleanup functions
   */
  executeAllCleanup(): void {
    // Run manual cleanup functions
    for (const fn of this.cleanupFunctions.reverse()) {
      try {
        fn();
      } catch {
        // Silently handle cleanup errors to avoid test interference
        // In test environments, cleanup failures should not fail the test
      }
    }
    this.cleanupFunctions.length = 0;
  }
}

/**
 * Enhanced test helper that provides fixture functionality
 */
export function withFixtures(testFn: (fixtures: {
  fetchMock: () => FetchMock;
  testData: DynamicTestData;
  testScenarios: typeof TestScenarios;
  cleanup: { add: (fn: () => void) => void };
}) => void | Promise<void>) {
  return (testName: string) => {
    return test(testName, async () => {
      const fixtureManager = TestFixtureManager.getInstance(testName);

      const fixtures = {
        fetchMock: () => fixtureManager.setupFetchMock(),
        testData: fixtureManager.createTestData(),
        testScenarios: fixtureManager.setupTestScenarios(),
        cleanup: {
          add: (fn: () => void) => fixtureManager.addCleanup(fn),
        },
      };

      try {
        await testFn(fixtures);
      } finally {
        TestFixtureManager.cleanup(testName);
      }
    });
  };
}

/**
 * Export the enhanced test and original expect for convenience
 */
export { expect, describe, beforeAll, afterAll, beforeEach, afterEach };

/**
 * Helper function to create test data with faker
 */
export const createTestData = {
  htmlContent: (overrides: Partial<HtmlContentData> = {}): HtmlContentData => ({
    id: faker.string.uuid(),
    title: faker.lorem.words(3),
    content: faker.lorem.paragraphs(2),
    timestamp: faker.date.recent(),
    category: faker.helpers.arrayElement(['articles', 'products', 'news']),
    itemCount: faker.number.int({ min: 1, max: 10 }),
    ...overrides,
  }),

  scrapingConfig: (overrides: Partial<ScrapingConfigData> = {}): ScrapingConfigData => ({
    id: faker.string.uuid(),
    target: {
      url: faker.internet.url(),
      selector: faker.helpers.arrayElement(['.product-card', '.article', '.item']),
    },
    extraction: {
      fields: {
        title: faker.helpers.arrayElement(['h1', 'h2', '.title']),
        content: faker.helpers.arrayElement(['.content', '.description', 'p']),
      },
      multiple: faker.datatype.boolean(),
    },
    output: {
      format: faker.helpers.arrayElement(['json', 'csv', 'database']),
      filename: faker.system.fileName(),
      filePath: faker.system.filePath(),
    },
    behavior: {
      retryAttempts: faker.number.int({ min: 1, max: 5 }),
      retryDelay: faker.number.int({ min: 100, max: 5000 }),
      rateLimit: faker.number.int({ min: 10, max: 100 }),
      timeout: faker.datatype.boolean() ? faker.number.int({ min: 5000, max: 30000 }) : undefined,
      userAgent: faker.internet.userAgent(),
      headers: {
        'X-Test-ID': faker.string.uuid(),
        'X-Test-Timestamp': faker.date.recent().toISOString(),
      },
    },
    timestamp: faker.date.recent(),
    ...overrides,
  }),

  httpClientConfig: (overrides: Partial<HttpClientConfigData> = {}): HttpClientConfigData => ({
    id: faker.string.uuid(),
    retryAttempts: faker.number.int({ min: 1, max: 5 }),
    retryDelay: faker.number.int({ min: 100, max: 5000 }),
    rateLimit: faker.number.int({ min: 10, max: 100 }),
    userAgent: faker.internet.userAgent(),
    timestamp: faker.date.recent(),
    ...overrides,
  }),
};