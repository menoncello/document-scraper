import type { HttpClientConfig } from '../../src/types/index';

/**
 * Test factory for creating HTTP client configurations
 * Provides parallel-safe test data generation with unique identifiers
 */
export class HttpClientConfigFactory {
  private static counter = 0;

  /**
   * Create a basic HTTP client config for testing
   */
  static basic(overrides: Partial<HttpClientConfig> = {}): HttpClientConfig {
    const id = ++this.counter;
    return {
      retryAttempts: 3,
      retryDelay: 100,
      rateLimit: 10,
      timeout: undefined, // Explicitly include timeout property
      userAgent: `test-agent/${id}`,
      headers: {},
      ...overrides,
    };
  }

  /**
   * Create an HTTP client config with custom headers
   */
  static withCustomHeaders(headers: Record<string, string>): HttpClientConfig {
    return this.basic({
      headers: {
        Authorization: 'Bearer test-token',
        'X-API-Key': 'test-key',
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
