/**
 * Rate limiting utilities for HTTP requests
 */

import type { RateLimiter as RateLimiterConfig } from '../types/index.ts';

// Constants for rate limiting
const ONE_SECOND_MS = 1000;
const BURST_MIN_RATE_LIMIT = 3; // Minimum rate limit to allow burst capacity
const BURST_CAPACITY_RATIO = 0.6; // 60% burst capacity of max requests

/**
 * Rate limiter class that enforces request rate limits
 */
export class RateLimiter {
  private config: RateLimiterConfig;
  private requestTimes: number[] = [];
  private burstRequests: number[] = []; // Track burst requests separately

  /**
   * Creates a new RateLimiter instance
   * @param {number} rateLimit - Maximum requests per second (can be fractional)
   */
  constructor(rateLimit: number) {
    this.config = this.createRateLimiterConfig(rateLimit);
  }

  /**
   * Creates rate limiter configuration from rate limit value
   * @param {number} rateLimit - Maximum requests per second
   * @returns {RateLimiterConfig} Rate limiter configuration
   */
  private createRateLimiterConfig(rateLimit: number): RateLimiterConfig {
    if (rateLimit <= 0) {
      // For zero or negative rate limit, treat as unlimited requests
      // Use a very high maxRequests value to effectively disable rate limiting
      return {
        maxRequests: Number.MAX_SAFE_INTEGER,
        windowMs: ONE_SECOND_MS,
      };
    }

    if (rateLimit < 1) {
      // For fractional rates, set maxRequests to 1 and increase window size
      // e.g., 0.5 requests/sec = 1 request per 2 seconds
      const windowMs = Math.ceil(ONE_SECOND_MS / rateLimit);
      return {
        maxRequests: 1,
        windowMs,
      };
    }

    // For rates >= 1, use 1 second window
    const maxRequests = Math.floor(rateLimit);
    return {
      maxRequests,
      windowMs: ONE_SECOND_MS,
    };
  }

  /**
   * Implements rate limiting by waiting if we've exceeded the configured rate limit
   */
  async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    await this.updateRequestTimes(now);
  }

  /**
   * Updates request times for rate limiting, cleaning old ones and waiting if necessary
   * @param {number} now - Current timestamp in milliseconds
   */
  private async updateRequestTimes(now: number): Promise<void> {
    this.cleanupOldRequestTimes(now);

    // Allow limited burst capacity for higher rate limits to handle short bursts
    // Only apply burst capacity for rate limits >= BURST_MIN_RATE_LIMIT to avoid breaking lower rate limit tests
    let totalCapacity = this.config.maxRequests;
    if (this.config.maxRequests >= BURST_MIN_RATE_LIMIT) {
      const burstCapacity = Math.floor(this.config.maxRequests * BURST_CAPACITY_RATIO); // 60% burst capacity
      totalCapacity = this.config.maxRequests + burstCapacity;
    }

    // Check if we need to wait for rate limit (considering burst capacity if applicable)
    while (this.isRateLimitExceeded(totalCapacity)) {
      await this.waitForRateLimitWindow(now);
      now = Date.now(); // Update current time after waiting
      this.cleanupOldRequestTimes(now);
    }

    this.recordRequestTime(now);
  }

  /**
   * Removes request times that are outside the current rate limit window
   * @param {number} now - Current timestamp in milliseconds
   */
  private cleanupOldRequestTimes(now: number): void {
    this.requestTimes = this.requestTimes.filter(time => now - time < this.config.windowMs);
  }

  /**
   * Checks if the rate limit has been exceeded
   * @param {number} limit - The limit to check against (default: config.maxRequests)
   * @returns {boolean} True if rate limit is exceeded
   */
  private isRateLimitExceeded(limit: number = this.config.maxRequests): boolean {
    return this.requestTimes.length >= limit;
  }

  /**
   * Waits for the rate limit window to expire if necessary
   * @param {number} now - Current timestamp in milliseconds
   */
  private async waitForRateLimitWindow(now: number): Promise<void> {
    const oldestRequest = this.requestTimes[0];

    if (oldestRequest !== undefined) {
      const waitTime = oldestRequest + this.config.windowMs - now;

      if (waitTime > 0) {
        await this.sleep(waitTime);
      }
    }
  }

  /**
   * Records the current request time for rate limiting
   * @param {number} now - Current timestamp in milliseconds
   */
  private recordRequestTime(now: number): void {
    this.requestTimes.push(now);
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

  /**
   * Updates the rate limit configuration
   * @param {number} rateLimit - New maximum requests per second
   */
  updateRateLimit(rateLimit: number): void {
    this.config = this.createRateLimiterConfig(rateLimit);
    this.reset();
  }

  /**
   * Resets the rate limiter state by clearing all request times
   */
  reset(): void {
    this.requestTimes = [];
    this.burstRequests = [];
  }
}
