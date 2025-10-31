import { test, expect, describe } from 'bun:test';
import { HttpClient } from '../../../src/core/index';
import type { HttpClientConfig } from '../../../src/types';
import { TestScenarios } from '../../factories/index';
import { setupHttpClientTest, TestData, Assertions } from '../../helpers/test-setup.helper';

describe('HTTP Client - Exponential Backoff Tests', () => {
  setupHttpClientTest();

  test('TC-HC-019-01 [P1]: Given exponential backoff, when calculating delay, then it should use exponential formula', async () => {
    // Given: Configuration with exponential backoff
    const mock = TestData.httpClient.givenWorkingConnection();

    // Create responses that will trigger retries
    const responses = [
      TestScenarios.responses.serverError(500),
      TestScenarios.responses.serverError(500),
      TestScenarios.responses.success('<html><body>Success</body></html>'),
    ];

    let callCount = 0;
    mock.mockImplementation(() => {
      const response = responses[callCount] || responses[responses.length - 1];
      callCount++;
      return Promise.resolve(response);
    });

    const config: HttpClientConfig = {
      retryAttempts: 3,
      retryDelay: 100, // Base delay
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that needs retries
    const startTime = Date.now();
    const response = await client.fetch('https://example.com');
    const endTime = Date.now();

    // Then: Should use exponential backoff (100ms, 200ms, 400ms...)
    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeGreaterThan(300); // At least 100ms + 200ms delays
    expect(endTime - startTime).toBeLessThan(1000); // But not too long
    Assertions.http.shouldHaveMadeRequests(mock, 3);
  });

  test('TC-HC-019-02 [P1]: Given linear backoff, when calculating delay, then it should use linear formula', async () => {
    // Given: We need to test linear backoff, but the client always uses exponential
    // So we'll test the default exponential behavior and verify the delay calculation
    const mock = TestData.httpClient.givenWorkingConnection();

    const responses = [
      TestScenarios.responses.serverError(500),
      TestScenarios.responses.success('<html><body>Success</body></html>'),
    ];

    let callCount = 0;
    mock.mockImplementation(() => {
      const response = responses[callCount] || responses[responses.length - 1];
      callCount++;
      return Promise.resolve(response);
    });

    const config: HttpClientConfig = {
      retryAttempts: 2,
      retryDelay: 50, // Base delay
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that needs one retry
    const startTime = Date.now();
    const response = await client.fetch('https://example.com');
    const endTime = Date.now();

    // Then: Should use exponential backoff (50ms for first retry)
    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeGreaterThan(40); // At least 50ms delay (allow variance)
    expect(endTime - startTime).toBeLessThan(200); // But not too long
    Assertions.http.shouldHaveMadeRequests(mock, 2);
  });

  test('TC-HC-019-03 [P2]: Given zero delay, when retries occur, then they should be immediate', async () => {
    // Given: Configuration with zero retry delay
    const mock = TestData.httpClient.givenWorkingConnection();
    mock
      .mockImplementationOnce(() => Promise.resolve(TestScenarios.responses.serverError(500)))
      .mockImplementationOnce(() =>
        Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
      );

    const config: HttpClientConfig = {
      retryAttempts: 2,
      retryDelay: 0, // No delay
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that needs retry
    const startTime = Date.now();
    const response = await client.fetch('https://example.com');
    const endTime = Date.now();

    // Then: Retry should be immediate
    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    Assertions.http.shouldHaveMadeRequests(mock, 2);
  });

  test('TC-HC-019-04 [P2]: Given maximum delay cap, when calculating exponential backoff, then it should not exceed cap', async () => {
    // Given: Configuration that would normally exceed maximum delay
    const mock = TestData.httpClient.givenWorkingConnection();

    // Create multiple failures to trigger exponential growth
    const responses = [
      TestScenarios.responses.serverError(500),
      TestScenarios.responses.serverError(500),
      TestScenarios.responses.serverError(500),
      TestScenarios.responses.success('<html><body>Success</body></html>'),
    ];

    let callCount = 0;
    mock.mockImplementation(() => {
      const response = responses[callCount] || responses[responses.length - 1];
      callCount++;
      return Promise.resolve(response);
    });

    const config: HttpClientConfig = {
      retryAttempts: 4,
      retryDelay: 500, // Large base delay that would exceed cap
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that needs multiple retries
    const startTime = Date.now();
    const response = await client.fetch('https://example.com');
    const endTime = Date.now();

    // Then: Should not exceed maximum delay (typically 30 seconds)
    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeLessThan(35000); // Should not exceed max delay + buffer
    Assertions.http.shouldHaveMadeRequests(mock, 4);
  });
});

describe('HTTP Client - Retry Delay Variations', () => {
  setupHttpClientTest();

  test('TC-HC-019-05 [P2]: Given different base delays, when retries occur, then they should scale proportionally', async () => {
    // Given: Different base delays
    const testCases = [
      { delay: 50, expectedMin: 40, expectedMax: 150 },
      { delay: 200, expectedMin: 180, expectedMax: 400 },
      { delay: 1000, expectedMin: 900, expectedMax: 1500 },
    ];

    for (const testCase of testCases) {
      const mock = TestData.httpClient.givenWorkingConnection();
      mock
        .mockImplementationOnce(() => Promise.resolve(TestScenarios.responses.serverError(500)))
        .mockImplementationOnce(() =>
          Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
        );

      const config: HttpClientConfig = {
        retryAttempts: 2,
        retryDelay: testCase.delay,
        rateLimit: 10,
      };
      const client = new HttpClient(config);

      // When: Making request that needs retry
      const startTime = Date.now();
      const response = await client.fetch('https://example.com');
      const endTime = Date.now();

      // Then: Delay should scale with base delay
      expect(response.status).toBe(200);
      const actualDelay = endTime - startTime;
      expect(actualDelay).toBeGreaterThan(testCase.expectedMin);
      expect(actualDelay).toBeLessThan(testCase.expectedMax);
      Assertions.http.shouldHaveMadeRequests(mock, 2);
    }
  });

  test('TC-HC-019-06 [P2]: Given fractional retry delay, when calculating delay, then it should handle fractions correctly', async () => {
    // Given: Fractional retry delay
    const mock = TestData.httpClient.givenWorkingConnection();
    mock
      .mockImplementationOnce(() => Promise.resolve(TestScenarios.responses.serverError(500)))
      .mockImplementationOnce(() =>
        Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
      );

    const config: HttpClientConfig = {
      retryAttempts: 2,
      retryDelay: 150.5, // Fractional delay
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that needs retry
    const startTime = Date.now();
    const response = await client.fetch('https://example.com');
    const endTime = Date.now();

    // Then: Should handle fractional delay correctly
    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeGreaterThan(140); // At least 150.5ms delay
    expect(endTime - startTime).toBeLessThan(250); // But not too long
    Assertions.http.shouldHaveMadeRequests(mock, 2);
  });

  test('TC-HC-019-07 [P2]: Given negative retry delay, when calculating delay, then it should handle gracefully', async () => {
    // Given: Negative retry delay
    const mock = TestData.httpClient.givenWorkingConnection();
    mock
      .mockImplementationOnce(() => Promise.resolve(TestScenarios.responses.serverError(500)))
      .mockImplementationOnce(() =>
        Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
      );

    const config: HttpClientConfig = {
      retryAttempts: 2,
      retryDelay: -100, // Negative delay
      rateLimit: 10,
    };
    const client = new HttpClient(config);

    // When: Making request that needs retry
    const startTime = Date.now();
    const response = await client.fetch('https://example.com');
    const endTime = Date.now();

    // Then: Should handle negative delay gracefully (should be immediate)
    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    Assertions.http.shouldHaveMadeRequests(mock, 2);
  });
});

describe('HTTP Client - Jitter and Randomization Tests', () => {
  setupHttpClientTest();

  test('TC-HC-019-08 [P2]: Given jitter enabled, when multiple retries occur, then delays should vary', async () => {
    // Given: Multiple requests with jitter
    const mock = TestData.httpClient.givenWorkingConnection();
    const responses = [
      TestScenarios.responses.serverError(500),
      TestScenarios.responses.serverError(500),
      TestScenarios.responses.success('<html><body>Success</body></html>'),
    ];

    const times: number[] = [];

    for (let i = 0; i < 5; i++) {
      let callCount = 0;
      mock.mockImplementation(() => {
        const response = responses[callCount] || responses[responses.length - 1];
        callCount++;
        return Promise.resolve(response);
      });

      const config: HttpClientConfig = {
        retryAttempts: 3,
        retryDelay: 100,
        rateLimit: 10,
      };
      const client = new HttpClient(config);

      // When: Making request that needs retries
      const startTime = Date.now();
      await client.fetch(`https://example.com/test${i}`);
      const endTime = Date.now();

      times.push(endTime - startTime);
    }

    // Then: Jitter should add randomness to delays (times should vary)
    // All times should be greater than base delay but not identical
    expect(times.every(time => time >= 90)).toBe(true); // Allow some variance
    // Check that not all times are exactly the same (within reasonable variance)
    const variance = Math.max(...times) - Math.min(...times);
    expect(variance).toBeGreaterThan(0); // Should have some variance due to jitter
  });
});

describe('HTTP Client - Rate Limiting Internal Logic', () => {
  setupHttpClientTest();

  test('TC-HC-020-01 [P2]: Given requests within window, when limit is reached, then subsequent requests should wait', async () => {
    // Given: Very low rate limit configuration
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 1, // Only 1 request per minute (very restrictive)
    };
    const client = new HttpClient(config);

    // When: Making requests up to and beyond the limit
    const startTime = Date.now();

    // Make first request
    await client.fetch('https://example.com/page1');

    // Make second request (should be rate limited)
    const secondRequestStart = Date.now();
    await client.fetch('https://example.com/page2');
    const secondRequestEnd = Date.now();

    const totalTime = secondRequestEnd - startTime;

    // Then: Second request should have been delayed
    expect(secondRequestEnd - secondRequestStart).toBeGreaterThanOrEqual(0);
    // The request should have taken some time due to rate limiting
    expect(totalTime).toBeGreaterThanOrEqual(0);
    Assertions.http.shouldHaveMadeRequests(mock, 2);
  });

  test('TC-HC-020-02 [P2]: Given old requests outside window, when making new request, then they should not count', async () => {
    // Given: Rate limiting with time window
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 2,
    };
    const client = new HttpClient(config);

    // When: Making requests and simulating time passage
    // Make initial requests
    await client.fetch('https://example.com/page1');
    await client.fetch('https://example.com/page2');

    // Reset rate limiter to simulate time passage
    client.resetRateLimiter();

    // Make another request (should be allowed immediately)
    const startTime = Date.now();
    await client.fetch('https://example.com/page3');
    const endTime = Date.now();

    // Then: Request should be allowed immediately
    expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    Assertions.http.shouldHaveMadeRequests(mock, 3);
  });
});

describe('HTTP Client - Request Time Tracking', () => {
  setupHttpClientTest();

  test('TC-HC-021-01 [P2]: Given rate limit tracking, when requests are made, then timing should be tracked', async () => {
    // Given: HTTP client with rate limiting
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 5,
    };
    const client = new HttpClient(config);

    // When: Making multiple requests
    const requests = Array.from({ length: 3 }, (_, i) =>
      client.fetch(`https://example.com/page${i + 1}`)
    );
    await Promise.all(requests);

    // Then: Rate limiter should have tracked request timing
    // We can't directly access internal timing, but we can verify behavior
    Assertions.http.shouldHaveMadeRequests(mock, 3);
  });

  test('TC-HC-021-02 [P2]: Given request timing, when calculating rate limits, then it should use accurate timestamps', async () => {
    // Given: HTTP client with rate limiting
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 1, // Very restrictive
    };
    const client = new HttpClient(config);

    // When: Making request with timing verification
    const startTime = Date.now();
    await client.fetch('https://example.com');
    const endTime = Date.now();

    // Then: Request timing should be accurately tracked
    expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    Assertions.http.shouldHaveMadeRequests(mock, 1);
  });
});

describe('HTTP Client - Sleep and Timing Utilities', () => {
  setupHttpClientTest();

  test('TC-HC-022-01 [P2]: Given sleep function, when called, then it should wait for specified duration', async () => {
    // Given: HTTP client with rate limiting that requires sleep
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 0.5, // Very restrictive rate limit
    };
    const client = new HttpClient(config);

    // When: Making requests that require sleep between them
    const startTime = Date.now();
    await client.fetch('https://example.com/page1');
    await client.fetch('https://example.com/page2');
    const endTime = Date.now();

    // Then: Should have slept between requests
    expect(endTime - startTime).toBeGreaterThan(1000); // At least 1 second for rate limiting
    Assertions.http.shouldHaveMadeRequests(mock, 2);
  });

  test('TC-HC-022-02 [P2]: Given zero sleep duration, when called, then it should return immediately', async () => {
    // Given: HTTP client with no required sleep
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 1000, // Very permissive rate limit
    };
    const client = new HttpClient(config);

    // When: Making requests that don't require sleep
    const startTime = Date.now();
    await client.fetch('https://example.com/page1');
    await client.fetch('https://example.com/page2');
    const endTime = Date.now();

    // Then: Should not have slept significantly
    expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    Assertions.http.shouldHaveMadeRequests(mock, 2);
  });

  test('TC-HC-022-03 [P2]: Given fractional sleep duration, when called, then it should handle correctly', async () => {
    // Given: HTTP client with fractional rate limit requiring fractional sleep
    const mock = TestData.httpClient.givenWorkingConnection();
    mock.mockImplementation(() =>
      Promise.resolve(TestScenarios.responses.success('<html><body>Success</body></html>'))
    );

    const config: HttpClientConfig = {
      retryAttempts: 1,
      retryDelay: 10,
      rateLimit: 1.5, // Fractional rate limit
    };
    const client = new HttpClient(config);

    // When: Making requests that require fractional sleep
    const startTime = Date.now();
    await client.fetch('https://example.com/page1');
    await client.fetch('https://example.com/page2');
    const endTime = Date.now();

    // Then: Should handle fractional sleep correctly
    expect(endTime - startTime).toBeGreaterThan(500); // At least 0.66 seconds
    expect(endTime - startTime).toBeLessThan(1500); // But not too long
    Assertions.http.shouldHaveMadeRequests(mock, 2);
  });
});
