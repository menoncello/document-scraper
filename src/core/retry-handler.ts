/**
 * Retry logic utilities for HTTP requests
 */

import type { HttpError, RetryConfig } from '../types/index.ts';

// Constants for retry logic
const JITTER_MULTIPLIER = 0.1;
const HTTP_STATUS_CLIENT_ERROR_START = 400;
const HTTP_STATUS_CLIENT_ERROR_END = 499;
const HTTP_STATUS_RATE_LIMIT = 429;
const HTTP_STATUS_TIMEOUT = 408;
const EXPONENTIAL_BACKOFF_BASE = 2;

/**
 * Retry handler class that manages retry logic with exponential backoff
 */
export class RetryHandler {
  /**
   * Executes a function with retry logic
   * @param {() => Promise<T>} operation - Function to retry
   * @param {RetryConfig} retryConfig - Configuration for retry behavior
   * @returns {Promise<T>} Result of the operation
   * @throws Error if all retry attempts fail
   */
  async executeWithRetry<T>(operation: () => Promise<T>, retryConfig: RetryConfig): Promise<T> {
    let lastError: Error | HttpError | null = null;
    let attempt = 0;

    // If retryAttempts is 0, only make the initial attempt without retry loop
    // retryAttempts is the number of additional retries, so total attempts = 1 + retryAttempts
    const maxAttempts = Math.max(1, (retryConfig.attempts || 0) + 1);

    while (attempt < maxAttempts) {
      attempt++;

      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (this.shouldNotRetry(error)) {
          throw error;
        }

        if (attempt >= maxAttempts) {
          break;
        }

        const delay = this.calculateRetryDelay(retryConfig, attempt);
        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Unknown error occurred during operation');
  }

  /**
   * Determines if an error should not be retried
   * @param {unknown} error - The error to check
   * @returns {boolean} True if the error should not be retried
   */
  private shouldNotRetry(error: unknown): boolean {
    if (error instanceof Error && 'status' in error) {
      const httpError = error as HttpError;
      return (
        httpError.status !== undefined &&
        httpError.status >= HTTP_STATUS_CLIENT_ERROR_START &&
        httpError.status <= HTTP_STATUS_CLIENT_ERROR_END &&
        httpError.status !== HTTP_STATUS_RATE_LIMIT &&
        httpError.status !== HTTP_STATUS_TIMEOUT // Timeout errors should be retryable
      );
    }
    return false;
  }

  /**
   * Calculates retry delay with exponential backoff and jitter
   * @param {RetryConfig} retryConfig - Configuration for retry behavior
   * @param {number} attempt - Current attempt number (1-based)
   * @returns {number} Calculated delay in milliseconds
   */
  private calculateRetryDelay(retryConfig: RetryConfig, attempt: number): number {
    let delay: number;

    switch (retryConfig.backoff) {
      case 'exponential':
        delay = retryConfig.delay * Math.pow(EXPONENTIAL_BACKOFF_BASE, attempt - 1);
        break;
      case 'linear':
      default:
        delay = retryConfig.delay * attempt;
        break;
    }

    delay = this.addJitter(delay);

    if (retryConfig.maxDelay) {
      delay = Math.min(delay, retryConfig.maxDelay);
    }

    return Math.floor(delay);
  }

  /**
   * Adds jitter to delay to prevent thundering herd problems
   * Uses crypto.randomUUID() for better randomness in timing distribution
   * @param {number} delay - Base delay in milliseconds
   * @returns {number} Delay with jitter added
   */
  private addJitter(delay: number): number {
    // Use crypto.randomUUID() to generate random values for jitter calculation
    // This provides better randomness than Math.random() and is appropriate
    // for timing distribution in retry scenarios
    const uuidBytes = crypto.randomUUID().replace(/-/g, '');
    // Convert first 8 hex characters to a number between 0 and 1
    const RANDOM_BYTES_LENGTH = 8;
    const MAX_HEX_VALUE = 0xFFFFFFFF;
    const randomFactor =
      Number.parseInt(uuidBytes.substring(0, RANDOM_BYTES_LENGTH), 16) / MAX_HEX_VALUE;
    const jitter = delay * JITTER_MULTIPLIER * randomFactor;
    return delay + jitter;
  }

  /**
   * Sleep helper function that returns a promise that resolves after the specified time
   * @param {number} ms - Time to sleep in milliseconds
   * @returns {Promise<void>} Promise that resolves after the specified time
   */
  private sleep(ms: number): Promise<void> {
    // Ensure we don't sleep for negative time
    const sleepTime = Math.max(0, Math.floor(ms));
    return new Promise(resolve => setTimeout(resolve, sleepTime));
  }
}
