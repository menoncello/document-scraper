/**
 * Test Factories Index
 *
 * This file exports all test factory classes for creating test data and fixtures.
 * All factories are designed to be parallel-safe with unique identifiers.
 * Enhanced with auto-cleanup and composition support.
 */

import { HtmlContentFactory } from './html-content.factory';
import { HttpClientConfigFactory } from './http-client-config.factory';
import { MockResponseFactory } from './mock-response.factory';
import { ScrapingConfigFactory } from './scraping-config.factory';

// Re-export the classes
export { HttpClientConfigFactory, ScrapingConfigFactory, HtmlContentFactory, MockResponseFactory };

// Re-export enhanced fixture management utilities
export {
  FixtureManager,
  setupConfigFixtures,
  setupHtmlFixtures,
  setupMockResponseFixtures,
  setupCompleteTestFixture,
  setupTestFixture,
} from '../helpers/fixture-manager';

// Re-export test isolation utilities
export {
  TestIsolationManager,
  setupTestIsolation,
  setupConfigTestIsolation,
  setupHttpClientTestIsolation,
  setupHtmlParserTestIsolation,
  setupIntegrationTestIsolation,
  createTestEnvironment,
  setupGlobalTestIsolation,
} from '../helpers/test-isolation';

/**
 * Utility function to reset all factory counters
 * Call this in test setup to ensure test isolation
 */
export function resetAllFactories(): void {
  HttpClientConfigFactory.reset();
  ScrapingConfigFactory.reset();
  HtmlContentFactory.reset();
  MockResponseFactory.reset();
}

/**
 * Common test scenarios that can be reused across tests
 */
export const TestScenarios = {
  // Basic HTTP client scenarios
  httpClient: {
    basic: (overrides: any = {}) => HttpClientConfigFactory.basic(overrides),
    withRateLimit: (rateLimit?: number) => HttpClientConfigFactory.forRateTesting(rateLimit),
    withTimeout: (timeout?: number) => HttpClientConfigFactory.forTimeoutTesting(timeout),
    withCustomHeaders: (headers: Record<string, string>) =>
      HttpClientConfigFactory.withCustomHeaders(headers),
  },

  // Basic scraping scenarios
  scraping: {
    basic: (overrides: any = {}) => ScrapingConfigFactory.basic(overrides),
    singleItem: (overrides: any = {}) => ScrapingConfigFactory.singleItem(overrides),
    complex: (overrides: any = {}) => ScrapingConfigFactory.complex(overrides),
    csvOutput: (overrides: any = {}) => ScrapingConfigFactory.csvOutput(overrides),
    withCustomHeaders: (headers?: Record<string, string>) =>
      ScrapingConfigFactory.withCustomHeaders(
        headers || {
          'Accept-Language': 'en-US,en;q=0.9',
        }
      ),
  },

  // HTML content scenarios
  html: {
    basic: () => HtmlContentFactory.basic(),
    articles: (count = 3) => HtmlContentFactory.withArticles(count),
    articleList: (count = 1) => HtmlContentFactory.withStructuredArticles(count),
    nested: () => HtmlContentFactory.withNestedStructure(),
    form: () => HtmlContentFactory.withForm(),
    dataAttributes: () => HtmlContentFactory.withDataAttributes(),
  },

  // Mock response scenarios
  responses: {
    success: (html?: string) => MockResponseFactory.html(html),
    successJson: (data: any) => MockResponseFactory.json(data),
    serverError: (status?: number) => MockResponseFactory.serverError(status),
    clientError: (status?: number) => MockResponseFactory.clientError(status),
    rateLimit: (retryAfter?: number) => MockResponseFactory.rateLimitError(retryAfter),
    timeout: () => MockResponseFactory.timeoutError(),
    networkError: () => MockResponseFactory.networkError(),
    retrySequence: (failures: number, successHtml?: string) =>
      MockResponseFactory.retrySequence(failures, successHtml),
  },
} as const;
