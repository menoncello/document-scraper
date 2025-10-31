/**
 * HTTP Client with retry logic, rate limiting, and comprehensive error handling
 */

import type { HttpClientConfig, HttpResponse, RetryConfig } from '../types/index.ts';
import { HttpUtils } from './http-utils.ts';
import { RateLimiter } from './rate-limiter.ts';
import { RetryHandler } from './retry-handler.ts';

// Constants for magic numbers
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_RETRY_MAX_DELAY_MS = 30000;

/**
 * HTTP client class that provides robust fetching capabilities with retry logic, rate limiting,
 * and comprehensive error handling for web scraping operations.
 */
export class HttpClient {
  private config: HttpClientConfig;
  private rateLimiter: RateLimiter;
  private retryHandler: RetryHandler;

  /**
   * Creates a new HttpClient instance with the specified configuration.
   * @param {HttpClientConfig} config - Configuration object containing timeout, retry settings, and other options
   */
  constructor(config: HttpClientConfig) {
    this.config = {
      timeout: DEFAULT_TIMEOUT_MS,
      userAgent: 'docs-scrape/1.0.0',
      ...config,
    };

    const rateLimit = config.rateLimit === undefined ? 1 : config.rateLimit;
    this.rateLimiter = new RateLimiter(rateLimit);
    this.retryHandler = new RetryHandler();
  }

  /**
   * Fetches a URL with automatic retry logic and rate limiting.
   * @param {string} url - The URL to fetch
   * @param {RequestInit} options - Optional RequestInit object for additional fetch options
   * @returns {Promise<HttpResponse>} Promise that resolves to an HttpResponse object
   */
  async fetch(url: string, options: RequestInit = {}): Promise<HttpResponse> {
    await this.rateLimiter.waitForRateLimit();

    const retryConfig: RetryConfig = {
      attempts: this.config.retryAttempts,
      delay: this.config.retryDelay,
      backoff: 'exponential',
      maxDelay: DEFAULT_RETRY_MAX_DELAY_MS,
    };

    return this.retryHandler.executeWithRetry(() => this.attemptFetch(url, options), retryConfig);
  }

  /**
   * Attempts to fetch a URL and handles response status codes.
   * @param {string} url - The URL to fetch
   * @param {RequestInit} options - RequestInit object for fetch options
   * @returns {Promise<HttpResponse>} Promise that resolves to an HttpResponse object
   * @throws HttpError if the response indicates an error
   */
  private async attemptFetch(url: string, options: RequestInit): Promise<HttpResponse> {
    const response = await this.performFetch(url, options);

    // Ensure the response has the correct URL set
    if (!response.url) {
      Object.defineProperty(response, 'url', {
        value: url,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }

    if (response.ok) {
      return response;
    }

    throw await HttpUtils.createHttpError(response.status, response.statusText, response);
  }

  /**
   * Performs the actual HTTP fetch with timeout and proper headers.
   * @param {string} url - The URL to fetch
   * @param {RequestInit} options - RequestInit object for fetch options
   * @returns {Promise<HttpResponse>} Promise that resolves to an HttpResponse object
   * @throws HttpError if the request times out or other fetch errors occur
   */
  private async performFetch(url: string, options: RequestInit): Promise<HttpResponse> {
    const headers = this.buildHeaders(options);
    const controller = new AbortController();
    const timeoutCleanup = this.setupTimeout(controller);

    this.handleAbortSignal(options.signal || undefined, controller, timeoutCleanup);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      timeoutCleanup();
      return HttpUtils.createHttpResponse(response);
    } catch (error) {
      timeoutCleanup();
      return this.handleFetchError(error);
    }
  }

  /**
   * Sets up timeout for the HTTP request.
   * @param {AbortController} controller - AbortController to abort the request on timeout
   * @returns {() => void} Cleanup function to clear the timeout
   */
  private setupTimeout(controller: AbortController): () => void {
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    return () => clearTimeout(timeoutId);
  }

  /**
   * Handles external abort signal by setting up listeners and checking for immediate abort.
   * @param {AbortSignal | undefined} signal - External abort signal from options
   * @param {AbortController} controller - Internal abort controller to be triggered by external signal
   * @param {() => void} timeoutCleanup - Cleanup function to call on immediate abort
   */
  private handleAbortSignal(
    signal: AbortSignal | undefined,
    controller: AbortController,
    timeoutCleanup: () => void
  ): void {
    if (!signal) return;

    if (signal.aborted) {
      timeoutCleanup();
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      throw error;
    }

    signal.addEventListener('abort', () => {
      controller.abort();
    });
  }

  /**
   * Handles fetch errors, converting timeout errors to HttpError.
   * @param {unknown} error - The error that occurred during fetch
   * @throws HttpError if the error is a timeout
   * @throws The original error for other types of errors
   */
  private handleFetchError(error: unknown): never {
    if (error instanceof Error && error.name === 'AbortError') {
      throw HttpUtils.createTimeoutError(this.config.timeout || DEFAULT_TIMEOUT_MS);
    }

    throw error;
  }

  /**
   * Builds the headers object for the HTTP request.
   * @param {RequestInit} options - RequestInit object containing additional headers
   * @returns {Record<string, string>} Complete headers object
   */
  private buildHeaders(options: RequestInit): Record<string, string> {
    const baseHeaders = HttpUtils.getDefaultHeaders(this.config.userAgent);
    const headers: Record<string, string> = { ...baseHeaders };

    HttpUtils.mergeHeaders(headers, this.config.headers);
    HttpUtils.mergeHeaders(headers, options.headers);

    return headers;
  }

  /**
   * Updates the client configuration with new values.
   * @param {Partial<HttpClientConfig>} newConfig - Partial configuration object with values to update
   */
  updateConfig(newConfig: Partial<HttpClientConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.rateLimit !== undefined) {
      this.rateLimiter.updateRateLimit(newConfig.rateLimit);
    }
  }

  /**
   * Gets the current client configuration.
   * @returns {HttpClientConfig} Copy of the current configuration object
   */
  getConfig(): HttpClientConfig {
    return { ...this.config };
  }

  /**
   * Resets the rate limiter state.
   */
  resetRateLimiter(): void {
    this.rateLimiter.reset();
  }
}
