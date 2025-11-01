import { faker } from '@faker-js/faker';
import type { HttpClientConfig } from '../../src/types/index';

/**
 * Test factory for creating HTTP client configurations
 * Provides parallel-safe test data generation with unique identifiers
 * Enhanced with faker for dynamic, realistic test data
 */
export class HttpClientConfigFactory {
  private static counter = 0;

  /**
   * Create a basic HTTP client config for testing
   */
  static basic(overrides: Partial<HttpClientConfig> = {}): HttpClientConfig {
    const uniqueId = faker.string.uuid();

    return {
      retryAttempts: faker.number.int({ min: 1, max: 5 }),
      retryDelay: faker.number.int({ min: 100, max: 5000 }),
      rateLimit: faker.number.int({ min: 5, max: 100 }),
      timeout: faker.datatype.boolean() ? faker.number.int({ min: 5000, max: 30000 }) : undefined,
      userAgent: `${faker.internet.userAgent()} docs-scrape-test/${uniqueId}`,
      headers: {
        'X-Test-ID': uniqueId,
        'X-Test-Timestamp': faker.date.recent().toISOString(),
      },
      ...overrides,
    };
  }

  /**
   * Create an HTTP client config with custom headers
   */
  static withCustomHeaders(headers: Record<string, string>): HttpClientConfig {
    const uniqueId = faker.string.uuid();

    return this.basic({
      headers: {
        Authorization: `Bearer ${faker.string.alphanumeric(40)}`,
        'X-API-Key': faker.string.alphanumeric(32),
        'X-Request-ID': uniqueId,
        'X-Client-Version': faker.system.semver(),
        ...headers,
      },
    });
  }

  /**
   * Create an HTTP client config for testing rate limiting
   */
  static forRateTesting(requestsPerMinute = 5): HttpClientConfig {
    return this.basic({
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: requestsPerMinute,
    });
  }

  /**
   * Create an HTTP client config for testing timeouts
   */
  static forTimeoutTesting(timeoutMs = 100): HttpClientConfig {
    return this.basic({
      retryAttempts: 1,
      retryDelay: 10,
      timeout: timeoutMs,
    });
  }

  /**
   * Reset the counter (useful for test isolation)
   */
  static reset(): void {
    this.counter = 0;
  }
}
