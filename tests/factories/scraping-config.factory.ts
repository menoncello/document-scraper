import type { ScrapingConfig } from '../../src/types/index';

/**
 * Test factory for creating scraping configurations
 * Provides parallel-safe test data generation with unique identifiers
 */
export class ScrapingConfigFactory {
  private static counter = 0;

  /**
   * Create a basic scraping config for testing
   */
  static basic(overrides: Partial<ScrapingConfig> = {}): ScrapingConfig {
    const id = ++this.counter;
    return {
      target: {
        url: `https://test-site-${id}.com`,
        selector: 'article',
        waitFor: 100,
      },
      extraction: {
        fields: {
          title: 'h2',
          content: 'p',
        },
        multiple: true,
      },
      output: {
        format: 'json',
        filename: `test-output-${id}.json`,
      },
      behavior: {
        retryAttempts: 2,
        retryDelay: 50,
        rateLimit: 5,
        userAgent: `docs-scrape-test/${id}`,
        headers: {},
      },
      ...overrides,
    };
  }

  /**
   * Create a scraping config for single item extraction
   */
  static singleItem(overrides: Partial<ScrapingConfig> = {}): ScrapingConfig {
    return this.basic({
      extraction: {
        fields: {
          title: 'h1',
          description: 'meta[name="description"]',
          author: '.author',
        },
        multiple: false,
      },
      ...overrides,
    });
  }

  /**
   * Create a scraping config for complex data extraction
   */
  static complex(overrides: Partial<ScrapingConfig> = {}): ScrapingConfig {
    return this.basic({
      extraction: {
        fields: {
          title: 'h2',
          author: '.author',
          date: '.date',
          category: '.category',
          content: '.content p',
          tags: '.tag',
          image: 'img',
          link: 'a',
        },
        multiple: true,
      },
      ...overrides,
    });
  }

  /**
   * Create a scraping config for CSV output
   */
  static csvOutput(overrides: Partial<ScrapingConfig> = {}): ScrapingConfig {
    const id = ++this.counter;
    return this.basic({
      output: {
        format: 'csv',
        filename: `test-output-${id}.csv`,
      },
      ...overrides,
    });
  }

  /**
   * Create a scraping config with custom headers
   */
  static withCustomHeaders(headers: Record<string, string>): ScrapingConfig {
    return this.basic({
      behavior: {
        retryAttempts: 2,
        retryDelay: 50,
        rateLimit: 5,
        userAgent: 'docs-scrape-test/1.0.0',
        headers: {
          Authorization: 'Bearer test-token',
          'Accept-Language': 'en-US,en;q=0.9',
          ...headers,
        },
      },
    });
  }

  /**
   * Reset the counter (useful for test isolation)
   */
  static reset(): void {
    this.counter = 0;
  }
}
