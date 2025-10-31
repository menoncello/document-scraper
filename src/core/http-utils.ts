/**
 * HTTP utility functions for request/response handling
 */

import type { HttpError, HttpResponse } from '../types/index.ts';

// Constants for HTTP operations
const HTTP_OK_START = 200;
const HTTP_OK_END = 299;
const HTTP_STATUS_TIMEOUT = 408;
const ACCEPT_QUALITY_HTML = 0.9;
const ACCEPT_QUALITY_ANY = 0.8;
const ACCEPT_QUALITY_EN = 0.5;

type HeadersInit = Record<string, string> | Headers | string[][];

/**
 * HTTP utilities class providing helper methods for HTTP operations
 */
export class HttpUtils {
  /**
   * Creates an HttpResponse object from a native Response
   * Converts Headers to Record<string, string> for compatibility
   * @param {Response} response - The native Response object
   * @returns {HttpResponse} HttpResponse object with converted headers
   */
  static createHttpResponse(response: Response): HttpResponse {
    const headersRecord = this.convertHeadersToRecord(response);
    const responseProperties = this.extractResponseProperties(response);

    return {
      ...responseProperties,
      headers: headersRecord,
    };
  }

  /**
   * Converts Response headers to Record<string, string>
   * @param {Response} response - The response object
   * @returns {Record<string, string>} Headers as a record
   */
  static convertHeadersToRecord(response: Response): Record<string, string> {
    const headersRecord: Record<string, string> = {};

    try {
      if (!response || !('headers' in response) || !response.headers) {
        return headersRecord;
      }

      const headers = response.headers;
      this.processHeaders(headers, headersRecord);
    } catch {
      // If headers processing fails, continue with empty headers
    }

    return headersRecord;
  }

  /**
   * Process headers and add them to the target record
   * @param {Headers} headers - Headers object to process
   * @param {Record<string, string>} target - Target record to populate
   */
  private static processHeaders(headers: Headers, target: Record<string, string>): void {
    if ('entries' in headers && typeof headers.entries === 'function') {
      for (const [key, value] of headers.entries()) {
        target[key] = value;
      }
    }
  }

  /**
   * Extracts response properties with defaults
   * @param {Response} response - The response object
   * @returns {{status: number, statusText: string, ok: boolean, url?: string, text: () => Promise<string>, json: () => Promise<unknown>, arrayBuffer: () => Promise<ArrayBuffer>}} Response properties
   */
  static extractResponseProperties(response: Response): {
    status: number;
    statusText: string;
    ok: boolean;
    url?: string;
    text: () => Promise<string>;
    json: () => Promise<unknown>;
    arrayBuffer: () => Promise<ArrayBuffer>;
  } {
    const status = response?.status ?? HTTP_OK_START;
    const statusText = response?.statusText ?? 'OK';
    const defaultOk = status >= HTTP_OK_START && status < HTTP_OK_END;
    const isOk = response?.ok ?? defaultOk;

    const textMethod = this.createBoundMethod(response, 'text', async () => '');
    const jsonMethod = this.createBoundMethod(response, 'json', async () => ({}));
    const arrayBufferMethod = this.createBoundMethod(
      response,
      'arrayBuffer',
      async () => new ArrayBuffer(0)
    );

    return {
      status,
      statusText,
      ok: isOk,
      url: response?.url,
      text: textMethod,
      json: jsonMethod,
      arrayBuffer: arrayBufferMethod,
    };
  }

  /**
   * Creates a bound method with fallback
   * @param {Response} response - The response object
   * @param {string} methodName - The method name to bind
   * @param {() => T} fallback - Fallback function if method doesn't exist
   * @returns {T} Bound method or fallback
   */
  private static createBoundMethod<T>(
    response: Response | undefined,
    methodName: keyof Response,
    fallback: () => T
  ): () => T {
    const method = response?.[methodName] as ((...args: unknown[]) => T) | undefined;
    return method ? method.bind(response) : fallback;
  }

  /**
   * Gets the default HTTP headers for requests
   * @param {string | undefined} userAgent - User agent string to use
   * @returns {Record<string, string>} Default headers object
   */
  static getDefaultHeaders(userAgent?: string): Record<string, string> {
    return {
      'User-Agent': userAgent || 'docs-scrape/1.0.0',
      Accept: `text/html,application/xhtml+xml,application/xml;q=${ACCEPT_QUALITY_HTML},*/*;q=${ACCEPT_QUALITY_ANY}`,
      'Accept-Language': `en-US,en;q=${ACCEPT_QUALITY_EN}`,
      'Accept-Encoding': 'gzip, deflate',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };
  }

  /**
   * Merges additional headers into the target headers object
   * @param {Record<string, string>} target - Target headers object to merge into
   * @param {Record<string, string> | HeadersInit | undefined} source - Source headers object to merge from
   */
  static mergeHeaders(
    target: Record<string, string>,
    source?: Record<string, string> | HeadersInit | undefined
  ): void {
    if (!source) {
      return;
    }

    // Handle different types of HeadersInit
    if (source instanceof Headers) {
      this.mergeHeadersFromHeaders(source, target);
    } else if (Array.isArray(source)) {
      this.mergeHeadersFromArray(source as Array<[string, string]>, target);
    } else {
      // Record<string, string>
      Object.assign(target, source);
    }
  }

  /**
   * Merge headers from Headers object to target record
   * @param {Headers} source - Headers source object
   * @param {Record<string, string>} target - Target record to merge into
   */
  private static mergeHeadersFromHeaders(source: Headers, target: Record<string, string>): void {
    try {
      this.processHeaders(source, target);
    } catch {
      // If headers processing fails, continue without this source
    }
  }

  /**
   * Merge headers from array to target record
   * @param {Array<[string, string]>} source - Array source
   * @param {Record<string, string>} target - Target record to merge into
   */
  private static mergeHeadersFromArray(
    source: Array<[string, string]>,
    target: Record<string, string>
  ): void {
    for (const [key, value] of source) {
      target[key] = value;
    }
  }

  /**
   * Creates an HTTP error with the specified status and message
   * @param {number} status - HTTP status code
   * @param {string} statusText - HTTP status text
   * @param {HttpResponse} response - The HTTP response object
   * @returns {Promise<HttpError>} HttpError object
   */
  static async createHttpError(
    status: number,
    statusText: string,
    response: HttpResponse
  ): Promise<HttpError> {
    let errorMessage = `HTTP ${status}: ${statusText}`;

    try {
      // Try to include response body in error message for debugging
      const responseBody = await response.text();
      if (responseBody && responseBody.trim()) {
        errorMessage += ` - ${responseBody}`;
      }
    } catch {
      // If we can't read the response body, just use the status text
    }

    const error: HttpError = new Error(errorMessage) as HttpError;
    error.status = status;
    error.statusText = statusText;
    error.response = response;
    error.url = response.url;
    return error;
  }

  /**
   * Creates a timeout error
   * @param {number} timeout - Timeout duration in milliseconds
   * @returns {HttpError} HttpError object with timeout status
   */
  static createTimeoutError(timeout: number): HttpError {
    const timeoutError: HttpError = new Error(`Request timeout after ${timeout}ms`) as HttpError;
    timeoutError.status = HTTP_STATUS_TIMEOUT;
    timeoutError.name = 'AbortError'; // Preserve the AbortError name for compatibility
    return timeoutError;
  }

  /**
   * Determines if an HTTP status code represents a retryable error
   * @param {number} status - HTTP status code
   * @returns {boolean} True if the error should be retried
   */
  static isRetryableError(status: number): boolean {
    const HTTP_STATUS_SERVER_ERROR_START = 500;
    const HTTP_STATUS_RATE_LIMIT = 429;
    return status >= HTTP_STATUS_SERVER_ERROR_START || status === HTTP_STATUS_RATE_LIMIT;
  }
}
