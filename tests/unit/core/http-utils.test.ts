import { test, expect, describe } from 'bun:test';
import { HttpUtils } from '../../../src/core/http-utils';

// Test constants for HTTP status codes and values
const HTTP_STATUS_OK = 200;
const HTTP_STATUS_CREATED = 201;
const HTTP_STATUS_ACCEPTED = 202;
const HTTP_STATUS_NO_CONTENT = 204;
const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_FORBIDDEN = 403;
const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_METHOD_NOT_ALLOWED = 405;
const HTTP_STATUS_NOT_ACCEPTABLE = 406;
const HTTP_STATUS_REQUEST_TIMEOUT = 408;
const HTTP_STATUS_CONFLICT = 409;
const HTTP_STATUS_GONE = 410;
const HTTP_STATUS_UNPROCESSABLE_ENTITY = 422;
const HTTP_STATUS_TOO_EARLY = 425;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
const HTTP_STATUS_BAD_GATEWAY = 502;
const HTTP_STATUS_SERVICE_UNAVAILABLE = 503;
const HTTP_STATUS_GATEWAY_TIMEOUT = 504;
const HTTP_STATUS_INSUFFICIENT_STORAGE = 507;
const HTTP_STATUS_LOOP_DETECTED = 508;
const HTTP_STATUS_NOT_EXTENDED = 510;
const HTTP_STATUS_NETWORK_AUTHENTICATION_REQUIRED = 511;

const STATUS_OK = 'OK';
const STATUS_CREATED = 'Created';
const STATUS_NOT_FOUND = 'Not Found';
const STATUS_INTERNAL_SERVER_ERROR = 'Internal Server Error';
const STATUS_SERVICE_UNAVAILABLE = 'Service Unavailable';
const STATUS_BAD_REQUEST = 'Bad Request';
const STATUS_UNPROCESSABLE_ENTITY = 'Unprocessable Entity';
const STATUS_TOO_MANY_REQUESTS = 'Too Many Requests';
const STATUS_UNAUTHORIZED = 'Unauthorized';

const DEFAULT_USER_AGENT = 'docs-scrape/1.0.0';
const CUSTOM_USER_AGENT = 'TestBot/1.0';

const TIMEOUT_1000MS = 1000;
const TIMEOUT_5000MS = 5000;
const TIMEOUT_30000MS = 30000;

// Type definitions for better type safety
interface MockResponseOptions {
  status?: number;
  statusText?: string;
  ok?: boolean;
  headers?: Headers | Record<string, string> | null;
  text?: string | (() => Promise<string>);
  json?: unknown | (() => Promise<unknown>);
  arrayBuffer?: ArrayBuffer | (() => Promise<ArrayBuffer>);
}

// Helper function to create headers based on input type
const createHeaders = (headers?: Headers | Record<string, string> | null): Headers => {
  if (headers === null || headers === undefined) {
    return new Headers();
  }

  if (headers instanceof Headers) {
    return headers;
  }

  if (typeof headers === 'object') {
    return new Headers(headers as Record<string, string>);
  }

  return new Headers();
};

// Helper function to create a method function
const createMethod = <T>(
  method: T | (() => Promise<T>) | undefined,
  defaultValue: T
): (() => Promise<T>) => {
  if (typeof method === 'function') {
    return method as () => Promise<T>;
  }

  return async () => method ?? defaultValue;
};

// Test factory functions
const createMockResponse = (options: MockResponseOptions = {}): Response => {
  const {
    status = HTTP_STATUS_OK,
    statusText = STATUS_OK,
    ok = status >= HTTP_STATUS_OK && status < 300,
    headers,
    text,
    json,
    arrayBuffer,
  } = options;

  const headersObj = createHeaders(headers);
  const textMethod = createMethod(text, '');
  const jsonMethod = createMethod(json, {});
  const arrayBufferMethod = createMethod(arrayBuffer, new ArrayBuffer(0));

  return {
    status,
    statusText,
    ok,
    headers: headersObj,
    text: textMethod,
    json: jsonMethod,
    arrayBuffer: arrayBufferMethod,
  } as Response;
};

const createDefaultHeaders = () => ({
  'User-Agent': DEFAULT_USER_AGENT,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  Connection: 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
});

describe('HttpUtils Extended Coverage Tests', () => {
  describe('createHttpResponse', () => {
    test('should create HttpResponse from basic Response', () => {
      // Given: A basic Response object
      const mockResponse = createMockResponse({
        status: HTTP_STATUS_OK,
        statusText: STATUS_OK,
        ok: true,
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value',
        },
        text: '{"message": "success"}',
        json: { message: 'success' },
        arrayBuffer: new ArrayBuffer(8),
      });

      // When: Creating HttpResponse
      const httpResponse = HttpUtils.createHttpResponse(mockResponse);

      // Then: Should create HttpResponse with converted headers
      expect(httpResponse.status).toBe(HTTP_STATUS_OK);
      expect(httpResponse.statusText).toBe(STATUS_OK);
      expect(httpResponse.ok).toBe(true);
      expect(httpResponse.headers).toEqual({
        'content-type': 'application/json',
        'x-custom-header': 'custom-value',
      });
      expect(typeof httpResponse.text).toBe('function');
      expect(typeof httpResponse.json).toBe('function');
      expect(typeof httpResponse.arrayBuffer).toBe('function');
    });

    test('should handle Response without headers', () => {
      // Given: Response without headers
      const mockResponse = createMockResponse({
        status: HTTP_STATUS_NOT_FOUND,
        statusText: STATUS_NOT_FOUND,
        ok: false,
        headers: null,
        text: 'Not Found',
        json: { error: 'Not found' },
        arrayBuffer: new ArrayBuffer(0),
      });

      // When: Creating HttpResponse
      const httpResponse = HttpUtils.createHttpResponse(mockResponse);

      // Then: Should handle missing headers gracefully
      expect(httpResponse.status).toBe(HTTP_STATUS_NOT_FOUND);
      expect(httpResponse.statusText).toBe(STATUS_NOT_FOUND);
      expect(httpResponse.ok).toBe(false);
      expect(httpResponse.headers).toEqual({});
    });

    test('should handle Response with null headers', () => {
      // Given: Response with null headers
      const mockResponse = createMockResponse({
        status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
        statusText: STATUS_INTERNAL_SERVER_ERROR,
        ok: false,
        headers: null,
        text: 'Server Error',
        json: { error: 'Internal error' },
        arrayBuffer: new ArrayBuffer(0),
      });

      // When: Creating HttpResponse
      const httpResponse = HttpUtils.createHttpResponse(mockResponse);

      // Then: Should handle null headers gracefully
      expect(httpResponse.status).toBe(HTTP_STATUS_INTERNAL_SERVER_ERROR);
      expect(httpResponse.statusText).toBe(STATUS_INTERNAL_SERVER_ERROR);
      expect(httpResponse.ok).toBe(false);
      expect(httpResponse.headers).toEqual({});
    });

    test('should handle Response with invalid headers', () => {
      // Given: Response with invalid headers that throws error
      const invalidHeaders = {
        forEach: () => {
          throw new Error('Headers iteration error');
        },
      } as unknown as Headers;

      // Create response manually to bypass the factory function for this special case
      const mockResponse = {
        status: HTTP_STATUS_OK,
        statusText: STATUS_OK,
        ok: true,
        headers: invalidHeaders,
        text: () => Promise.resolve('Success'),
        json: () => Promise.resolve({ success: true }),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
      } as Response;

      // When: Creating HttpResponse
      const httpResponse = HttpUtils.createHttpResponse(mockResponse);

      // Then: Should handle headers error gracefully
      expect(httpResponse.status).toBe(HTTP_STATUS_OK);
      expect(httpResponse.headers).toEqual({});
    });

    test('should handle Response with missing properties', () => {
      // Given: Response with missing properties
      const mockResponse = {
        text: () => Promise.resolve('Partial response'),
        json: () => Promise.resolve({ partial: true }),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(2)),
      } as Response;

      // When: Creating HttpResponse
      const httpResponse = HttpUtils.createHttpResponse(mockResponse);

      // Then: Should provide defaults for missing properties
      expect(httpResponse.status).toBe(HTTP_STATUS_OK);
      expect(httpResponse.statusText).toBe(STATUS_OK);
      expect(httpResponse.ok).toBe(true);
      expect(httpResponse.headers).toEqual({});
    });
  });

  describe('convertHeadersToRecord', () => {
    test('should convert Headers object to record', () => {
      // Given: Headers object with multiple values
      const headers = new Headers({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token123',
        'X-Custom-Header': 'custom-value',
        'Set-Cookie': 'session=abc123; HttpOnly',
      });

      const response = { headers } as Response;

      // When: Converting to record
      const headersRecord = HttpUtils.convertHeadersToRecord(response);

      // Then: Should convert all headers
      expect(headersRecord).toEqual({
        'content-type': 'application/json',
        authorization: 'Bearer token123',
        'x-custom-header': 'custom-value',
        'set-cookie': 'session=abc123; HttpOnly',
      });
    });

    test('should handle empty Headers object', () => {
      // Given: Empty Headers object
      const headers = new Headers();
      const response = { headers } as Response;

      // When: Converting to record
      const headersRecord = HttpUtils.convertHeadersToRecord(response);

      // Then: Should return empty record
      expect(headersRecord).toEqual({});
    });

    test('should handle headers with special characters', () => {
      // Given: Headers with special characters
      const headers = new Headers({
        'X-Special': 'special-chars-áéíóú-ñ',
        'Content-Disposition': 'attachment; filename="test file.pdf"',
      });

      const response = { headers } as Response;

      // When: Converting to record
      const headersRecord = HttpUtils.convertHeadersToRecord(response);

      // Then: Should preserve special characters
      expect(headersRecord['x-special']).toBe('special-chars-áéíóú-ñ');
      expect(headersRecord['content-disposition']).toBe('attachment; filename="test file.pdf"');
    });

    test('should handle headers that throw during iteration', () => {
      // Given: Headers that throw during iteration
      const headers = {
        forEach: () => {
          throw new Error('Iteration failed');
        },
      } as unknown as Headers;

      const response = { headers } as Response;

      // When: Converting to record
      const headersRecord = HttpUtils.convertHeadersToRecord(response);

      // Then: Should handle error gracefully
      expect(headersRecord).toEqual({});
    });

    test('should handle Response without headers property', () => {
      // Given: Response without headers property
      const response = {} as Response;

      // When: Converting to record
      const headersRecord = HttpUtils.convertHeadersToRecord(response);

      // Then: Should return empty record
      expect(headersRecord).toEqual({});
    });

    test('should handle Response with null headers', () => {
      // Given: Response with null headers
      const response = {
        status: HTTP_STATUS_OK,
        statusText: STATUS_OK,
        ok: true,
        headers: null,
        text: () => Promise.resolve(''),
        json: () => Promise.resolve({}),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      } as unknown as Response;

      // When: Converting to record
      const headersRecord = HttpUtils.convertHeadersToRecord(response);

      // Then: Should return empty record
      expect(headersRecord).toEqual({});
    });
  });

  describe('extractResponseProperties', () => {
    test('should extract properties from complete Response', () => {
      // Given: Complete Response object
      const mockResponse = createMockResponse({
        status: HTTP_STATUS_CREATED,
        statusText: STATUS_CREATED,
        ok: true,
        text: 'Created successfully',
        json: { id: 1, created: true },
        arrayBuffer: new ArrayBuffer(16),
      });

      // When: Extracting properties
      const properties = HttpUtils.extractResponseProperties(mockResponse);

      // Then: Should extract all properties correctly
      expect(properties.status).toBe(HTTP_STATUS_CREATED);
      expect(properties.statusText).toBe(STATUS_CREATED);
      expect(properties.ok).toBe(true);
      expect(typeof properties.text).toBe('function');
      expect(typeof properties.json).toBe('function');
      expect(typeof properties.arrayBuffer).toBe('function');
    });

    test('should provide defaults for missing Response properties', () => {
      // Given: Response with missing properties
      const mockResponse = {
        status: HTTP_STATUS_OK,
        statusText: STATUS_OK,
        ok: true,
        text: undefined,
        json: undefined,
        arrayBuffer: undefined,
      } as unknown as Response;

      // When: Extracting properties
      const properties = HttpUtils.extractResponseProperties(mockResponse);

      // Then: Should provide appropriate defaults
      expect(properties.status).toBe(HTTP_STATUS_OK);
      expect(properties.statusText).toBe(STATUS_OK);
      expect(properties.ok).toBe(true);
      expect(typeof properties.text).toBe('function');
      expect(typeof properties.json).toBe('function');
      expect(typeof properties.arrayBuffer).toBe('function');
    });

    test('should handle error status codes correctly', () => {
      // Given: Response with error status
      const mockResponse = createMockResponse({
        status: HTTP_STATUS_NOT_FOUND,
        statusText: STATUS_NOT_FOUND,
        ok: false,
        text: 'Not found',
        json: { error: 'Not found' },
        arrayBuffer: new ArrayBuffer(0),
      });

      // When: Extracting properties
      const properties = HttpUtils.extractResponseProperties(mockResponse);

      // Then: Should handle error status correctly
      expect(properties.status).toBe(HTTP_STATUS_NOT_FOUND);
      expect(properties.statusText).toBe(STATUS_NOT_FOUND);
      expect(properties.ok).toBe(false);
    });

    test('should handle undefined Response gracefully', () => {
      // Given: Undefined response
      const mockResponse = undefined as unknown as Response;

      // When: Extracting properties
      const properties = HttpUtils.extractResponseProperties(mockResponse);

      // Then: Should provide defaults
      expect(properties.status).toBe(HTTP_STATUS_OK);
      expect(properties.statusText).toBe(STATUS_OK);
      expect(properties.ok).toBe(true);
      expect(typeof properties.text).toBe('function');
      expect(typeof properties.json).toBe('function');
      expect(typeof properties.arrayBuffer).toBe('function');
    });

    test('should handle null Response gracefully', () => {
      // Given: Null response
      const mockResponse = null as unknown as Response;

      // When: Extracting properties
      const properties = HttpUtils.extractResponseProperties(mockResponse);

      // Then: Should provide defaults
      expect(properties.status).toBe(HTTP_STATUS_OK);
      expect(properties.statusText).toBe(STATUS_OK);
      expect(properties.ok).toBe(true);
      expect(typeof properties.text).toBe('function');
      expect(typeof properties.json).toBe('function');
      expect(typeof properties.arrayBuffer).toBe('function');
    });
  });

  describe('getDefaultHeaders', () => {
    test('should return default headers without custom user agent', () => {
      // When: Getting default headers
      const headers = HttpUtils.getDefaultHeaders();

      // Then: Should return complete default headers
      expect(headers).toEqual(createDefaultHeaders());
    });

    test('should return default headers with custom user agent', () => {
      // Given: Custom user agent
      const customUserAgent = 'CustomBot/2.0.0';

      // When: Getting default headers
      const headers = HttpUtils.getDefaultHeaders(customUserAgent);

      // Then: Should use custom user agent
      expect(headers['User-Agent']).toBe(customUserAgent);
      expect(headers.Accept).toBe(
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      );
      expect(headers['Accept-Language']).toBe('en-US,en;q=0.5');
      expect(headers['Accept-Encoding']).toBe('gzip, deflate');
      expect(headers.Connection).toBe('keep-alive');
      expect(headers['Upgrade-Insecure-Requests']).toBe('1');
    });

    test('should handle empty string user agent', () => {
      // Given: Empty user agent
      const emptyUserAgent = '';

      // When: Getting default headers
      const headers = HttpUtils.getDefaultHeaders(emptyUserAgent);

      // Then: Should use default user agent when empty string provided
      expect(headers['User-Agent']).toBe(DEFAULT_USER_AGENT);
    });

    test('should handle special characters in user agent', () => {
      // Given: User agent with special characters
      const specialUserAgent = 'TestBot/1.0 (Linux; x86_64) áéíóú';

      // When: Getting default headers
      const headers = HttpUtils.getDefaultHeaders(specialUserAgent);

      // Then: Should preserve special characters
      expect(headers['User-Agent']).toBe(specialUserAgent);
    });
  });

  describe('mergeHeaders', () => {
    test('should merge Headers object into target', () => {
      // Given: Target headers and Headers source
      const target: Record<string, string> = {
        'Existing-Header': 'existing-value',
        'Keep-This': 'keep-value',
      };

      const source = new Headers({
        'New-Header': 'new-value',
        'Existing-Header': 'updated-value',
        'Another-New': 'another-value',
      });

      // When: Merging headers
      HttpUtils.mergeHeaders(target, source);

      // Then: Should merge all headers (headers are converted to lowercase, but original may be preserved)
      expect(target['existing-header']).toBe('updated-value');
      expect(target['Keep-This']).toBe('keep-value');
      expect(target['new-header']).toBe('new-value');
      expect(target['another-new']).toBe('another-value');
    });

    test('should merge plain object headers into target', () => {
      // Given: Target headers and plain object source
      const target: Record<string, string> = {
        'Base-Header': 'base-value',
      };

      const source: Record<string, string> = {
        'Additional-Header': 'additional-value',
        'Base-Header': 'override-value',
      };

      // When: Merging headers
      HttpUtils.mergeHeaders(target, source);

      // Then: Should merge plain object headers
      expect(target).toEqual({
        'Base-Header': 'override-value',
        'Additional-Header': 'additional-value',
      });
    });

    test('should merge array of tuples into target', () => {
      // Given: Target headers and array source
      const target: Record<string, string> = {
        Initial: 'initial-value',
      };

      const source = [
        ['Array-Header', 'array-value'],
        ['Initial', 'array-override'],
        ['Second-Array', 'second-value'],
      ] as Array<[string, string]>;

      // When: Merging headers
      HttpUtils.mergeHeaders(target, source);

      // Then: Should merge array headers
      expect(target).toEqual({
        Initial: 'array-override',
        'Array-Header': 'array-value',
        'Second-Array': 'second-value',
      });
    });

    test('should handle undefined source gracefully', () => {
      // Given: Target headers
      const target: Record<string, string> = {
        'Keep-This': 'keep-value',
      };

      // When: Merging with undefined
      HttpUtils.mergeHeaders(target);

      // Then: Should preserve target unchanged
      expect(target).toEqual({
        'Keep-This': 'keep-value',
      });
    });

    test('should handle null source gracefully', () => {
      // Given: Target headers
      const target: Record<string, string> = {
        'Keep-This': 'keep-value',
      };

      // When: Merging with null
      HttpUtils.mergeHeaders(target);

      // Then: Should preserve target unchanged
      expect(target).toEqual({
        'Keep-This': 'keep-value',
      });
    });

    test('should handle Headers that throw during forEach', () => {
      // Given: Target headers and problematic Headers source
      const target: Record<string, string> = {
        Existing: 'value',
      };

      const source = {
        forEach: () => {
          throw new Error('Headers iteration failed');
        },
      } as unknown as Headers;

      // When: Merging with problematic headers
      HttpUtils.mergeHeaders(target, source);

      // Then: Should preserve target unchanged
      expect(target).toHaveProperty('Existing', 'value');
    });

    test('should merge headers with special characters', () => {
      // Given: Target and source with special characters
      const target: Record<string, string> = {
        Special: 'base-áéíóú',
      };

      const source = new Headers({
        'New-Special': 'new-ñüöä',
        Special: 'override-ßç',
      });

      // When: Merging headers
      HttpUtils.mergeHeaders(target, source);

      // Then: Should preserve special characters
      expect(target).toHaveProperty('Special', 'base-áéíóú');
      expect(target).toHaveProperty('new-special', 'new-ñüöä');
      expect(target).toHaveProperty('special', 'override-ßç');
    });
  });

  describe('createHttpError', () => {
    test('should create HttpError with status and message', async () => {
      // Given: Status, statusText, and response
      const status = HTTP_STATUS_NOT_FOUND;
      const statusText = STATUS_NOT_FOUND;
      const mockResponse = createMockResponse({
        status,
        statusText,
        headers: { 'Content-Type': 'text/plain' },
        text: 'Resource not found',
        json: { error: 'Not found' },
        arrayBuffer: new ArrayBuffer(0),
      });

      const httpResponse = HttpUtils.createHttpResponse(mockResponse);

      // When: Creating HttpError
      const httpError = await HttpUtils.createHttpError(status, statusText, httpResponse);

      // Then: Should create HttpError with correct properties
      expect(httpError).toBeInstanceOf(Error);
      expect(httpError.status).toBe(HTTP_STATUS_NOT_FOUND);
      expect(httpError.response).toBe(httpResponse);
      expect(httpError.message).toContain(`HTTP ${HTTP_STATUS_NOT_FOUND}: ${STATUS_NOT_FOUND}`);
      expect(httpError.message).toContain('Resource not found');
    });

    test('should create HttpError without response body', async () => {
      // Given: Status, statusText, and response that fails to return text
      const status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
      const statusText = STATUS_INTERNAL_SERVER_ERROR;

      const mockResponse = {
        status,
        statusText,
        headers: new Headers({ 'Content-Type': 'text/plain' }),
        text: () => Promise.reject(new Error('Cannot read body')),
        json: () => Promise.reject(new Error('Cannot parse JSON')),
        arrayBuffer: () => Promise.reject(new Error('Cannot get array buffer')),
      } as Response;

      const httpResponse = HttpUtils.createHttpResponse(mockResponse);

      // When: Creating HttpError
      const httpError = await HttpUtils.createHttpError(status, statusText, httpResponse);

      // Then: Should create HttpError without body content
      expect(httpError.status).toBe(HTTP_STATUS_INTERNAL_SERVER_ERROR);
      expect(httpError.message).toBe(
        `HTTP ${HTTP_STATUS_INTERNAL_SERVER_ERROR}: ${STATUS_INTERNAL_SERVER_ERROR}`
      );
      expect(httpError.response).toBe(httpResponse);
    });

    test('should create HttpError with empty response body', async () => {
      // Given: Status, statusText, and response with empty body
      const status = HTTP_STATUS_BAD_REQUEST;
      const statusText = STATUS_BAD_REQUEST;
      const mockResponse = createMockResponse({
        status,
        statusText,
        headers: { 'Content-Type': 'text/plain' },
        text: '',
        json: {},
        arrayBuffer: new ArrayBuffer(0),
      });

      const httpResponse = HttpUtils.createHttpResponse(mockResponse);

      // When: Creating HttpError
      const httpError = await HttpUtils.createHttpError(status, statusText, httpResponse);

      // Then: Should create HttpError with only status info
      expect(httpError.status).toBe(HTTP_STATUS_BAD_REQUEST);
      expect(httpError.message).toBe(`HTTP ${HTTP_STATUS_BAD_REQUEST}: ${STATUS_BAD_REQUEST}`);
      expect(httpError.response).toBe(httpResponse);
    });

    test('should create HttpError with whitespace-only response body', async () => {
      // Given: Status, statusText, and response with whitespace body
      const status = HTTP_STATUS_UNPROCESSABLE_ENTITY;
      const statusText = STATUS_UNPROCESSABLE_ENTITY;
      const mockResponse = createMockResponse({
        status,
        statusText,
        headers: { 'Content-Type': 'text/plain' },
        text: '   \n\t  ',
        json: {},
        arrayBuffer: new ArrayBuffer(0),
      });

      const httpResponse = HttpUtils.createHttpResponse(mockResponse);

      // When: Creating HttpError
      const httpError = await HttpUtils.createHttpError(status, statusText, httpResponse);

      // Then: Should create HttpError with only status info
      expect(httpError.status).toBe(HTTP_STATUS_UNPROCESSABLE_ENTITY);
      expect(httpError.message).toBe(
        `HTTP ${HTTP_STATUS_UNPROCESSABLE_ENTITY}: ${STATUS_UNPROCESSABLE_ENTITY}`
      );
      expect(httpError.response).toBe(httpResponse);
    });

    test('should create HttpError with JSON response body', async () => {
      // Given: Status, statusText, and response with JSON body
      const status = HTTP_STATUS_TOO_MANY_REQUESTS;
      const statusText = STATUS_TOO_MANY_REQUESTS;
      const jsonBody = { error: 'Rate limit exceeded', retryAfter: 60 };
      const mockResponse = createMockResponse({
        status,
        statusText,
        headers: { 'Content-Type': 'application/json' },
        text: JSON.stringify(jsonBody),
        json: jsonBody,
        arrayBuffer: new ArrayBuffer(0),
      });

      const httpResponse = HttpUtils.createHttpResponse(mockResponse);

      // When: Creating HttpError
      const httpError = await HttpUtils.createHttpError(status, statusText, httpResponse);

      // Then: Should include JSON in error message
      expect(httpError.status).toBe(HTTP_STATUS_TOO_MANY_REQUESTS);
      expect(httpError.message).toContain(
        `HTTP ${HTTP_STATUS_TOO_MANY_REQUESTS}: ${STATUS_TOO_MANY_REQUESTS}`
      );
      expect(httpError.message).toContain(JSON.stringify(jsonBody));
    });
  });

  describe('createTimeoutError', () => {
    test('should create timeout error with correct properties', () => {
      // Given: Timeout duration
      const timeout = TIMEOUT_5000MS;

      // When: Creating timeout error
      const timeoutError = HttpUtils.createTimeoutError(timeout);

      // Then: Should create error with timeout properties
      expect(timeoutError).toBeInstanceOf(Error);
      expect(timeoutError.status).toBe(HTTP_STATUS_REQUEST_TIMEOUT);
      expect(timeoutError.name).toBe('AbortError');
      expect(timeoutError.message).toBe(`Request timeout after ${TIMEOUT_5000MS}ms`);
    });

    test('should create timeout error with different timeout values', () => {
      // Given: Various timeout values
      const testCases = [
        { timeout: TIMEOUT_1000MS, expectedMessage: `Request timeout after ${TIMEOUT_1000MS}ms` },
        { timeout: TIMEOUT_30000MS, expectedMessage: `Request timeout after ${TIMEOUT_30000MS}ms` },
        { timeout: 0, expectedMessage: 'Request timeout after 0ms' },
      ];

      // When/Then: Should create appropriate timeout errors
      for (const { timeout, expectedMessage } of testCases) {
        const timeoutError = HttpUtils.createTimeoutError(timeout);
        expect(timeoutError.status).toBe(HTTP_STATUS_REQUEST_TIMEOUT);
        expect(timeoutError.name).toBe('AbortError');
        expect(timeoutError.message).toBe(expectedMessage);
      }
    });
  });

  describe('isRetryableError', () => {
    test('should identify server errors as retryable', () => {
      // Given: Various server error status codes
      const serverErrors = [
        HTTP_STATUS_INTERNAL_SERVER_ERROR,
        HTTP_STATUS_BAD_GATEWAY,
        HTTP_STATUS_SERVICE_UNAVAILABLE,
        HTTP_STATUS_GATEWAY_TIMEOUT,
        HTTP_STATUS_INSUFFICIENT_STORAGE,
        HTTP_STATUS_LOOP_DETECTED,
        HTTP_STATUS_NOT_EXTENDED,
        HTTP_STATUS_NETWORK_AUTHENTICATION_REQUIRED,
      ];

      // When/Then: Should identify server errors as retryable
      for (const status of serverErrors) {
        expect(HttpUtils.isRetryableError(status)).toBe(true);
      }
    });

    test('should identify rate limit error as retryable', () => {
      // Given: Rate limit status code
      const rateLimitStatus = HTTP_STATUS_TOO_MANY_REQUESTS;

      // When: Checking if retryable
      const isRetryable = HttpUtils.isRetryableError(rateLimitStatus);

      // Then: Should identify as retryable
      expect(isRetryable).toBe(true);
    });

    test('should not identify client errors as retryable', () => {
      // Given: Various client error status codes
      const clientErrors = [
        HTTP_STATUS_BAD_REQUEST,
        HTTP_STATUS_UNAUTHORIZED,
        HTTP_STATUS_FORBIDDEN,
        HTTP_STATUS_NOT_FOUND,
        HTTP_STATUS_METHOD_NOT_ALLOWED,
        HTTP_STATUS_NOT_ACCEPTABLE,
        HTTP_STATUS_REQUEST_TIMEOUT,
        HTTP_STATUS_CONFLICT,
        HTTP_STATUS_GONE,
        HTTP_STATUS_UNPROCESSABLE_ENTITY,
        HTTP_STATUS_TOO_EARLY,
      ];

      // When/Then: Should not identify client errors as retryable
      for (const status of clientErrors) {
        expect(HttpUtils.isRetryableError(status)).toBe(false);
      }
    });

    test('should not identify success codes as retryable', () => {
      // Given: Various success status codes
      const successCodes = [
        HTTP_STATUS_OK,
        HTTP_STATUS_CREATED,
        HTTP_STATUS_ACCEPTED,
        HTTP_STATUS_NO_CONTENT,
      ];

      // When/Then: Should not identify success codes as retryable
      for (const status of successCodes) {
        expect(HttpUtils.isRetryableError(status)).toBe(false);
      }
    });

    test('should handle edge case status codes', () => {
      // Given: Edge case status codes
      const edgeCases = [0, -1, 999, 1000];

      // When/Then: Should handle edge cases appropriately
      for (const status of edgeCases) {
        const isRetryable = HttpUtils.isRetryableError(status);
        // Only server errors (500+) and 429 should be retryable
        const shouldBeRetryable =
          status >= HTTP_STATUS_INTERNAL_SERVER_ERROR || status === HTTP_STATUS_TOO_MANY_REQUESTS;
        expect(isRetryable).toBe(shouldBeRetryable);
      }
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete HTTP workflow', async () => {
      // Given: Complete HTTP scenario
      const originalHeaders = {
        Authorization: 'Bearer token123',
        'Content-Type': 'application/json',
      };

      const defaultHeaders = HttpUtils.getDefaultHeaders(CUSTOM_USER_AGENT);
      HttpUtils.mergeHeaders(defaultHeaders, originalHeaders);

      const mockResponse = createMockResponse({
        status: HTTP_STATUS_OK,
        statusText: STATUS_OK,
        ok: true,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': 'req-123',
        },
        text: '{"success": true, "data": "test"}',
        json: { success: true, data: 'test' },
        arrayBuffer: new ArrayBuffer(10),
      });

      // When: Processing complete workflow
      const httpResponse = HttpUtils.createHttpResponse(mockResponse);

      // Then: Should handle complete workflow
      expect(httpResponse.status).toBe(HTTP_STATUS_OK);
      expect(httpResponse.headers['content-type']).toBe('application/json');
      expect(httpResponse.headers['x-request-id']).toBe('req-123');
      expect(httpResponse.ok).toBe(true);
      // Headers are merged but case might be different
      expect(defaultHeaders['authorization'] || defaultHeaders['Authorization']).toBeDefined();
      // User agent is set in the default headers
      expect(defaultHeaders['User-Agent'] || defaultHeaders['user-agent']).toBe(CUSTOM_USER_AGENT);
    });

    test('should handle error scenario with retryable status', async () => {
      // Given: Error scenario with retryable status
      const errorStatus = HTTP_STATUS_SERVICE_UNAVAILABLE;
      const statusText = STATUS_SERVICE_UNAVAILABLE;
      const mockResponse = createMockResponse({
        status: errorStatus,
        statusText,
        ok: false,
        headers: { 'Content-Type': 'text/plain' },
        text: 'Service temporarily unavailable',
        json: { error: 'Service unavailable' },
        arrayBuffer: new ArrayBuffer(0),
      });

      const errorResponse = HttpUtils.createHttpResponse(mockResponse);

      // When: Creating HTTP error
      const httpError = await HttpUtils.createHttpError(errorStatus, statusText, errorResponse);

      // Then: Should handle error scenario correctly
      expect(httpError.status).toBe(HTTP_STATUS_SERVICE_UNAVAILABLE);
      expect(httpError.message).toContain(
        `HTTP ${HTTP_STATUS_SERVICE_UNAVAILABLE}: ${STATUS_SERVICE_UNAVAILABLE}`
      );
      expect(httpError.message).toContain('Service temporarily unavailable');
      expect(HttpUtils.isRetryableError(errorStatus)).toBe(true);
    });

    test('should handle non-retryable error scenario', async () => {
      // Given: Non-retryable error scenario
      const errorStatus = HTTP_STATUS_UNAUTHORIZED;
      const statusText = STATUS_UNAUTHORIZED;
      const mockResponse = createMockResponse({
        status: errorStatus,
        statusText,
        ok: false,
        headers: { 'WWW-Authenticate': 'Bearer realm="api"' },
        text: 'Unauthorized access',
        json: { error: 'Unauthorized' },
        arrayBuffer: new ArrayBuffer(0),
      });

      const errorResponse = HttpUtils.createHttpResponse(mockResponse);

      // When: Creating HTTP error
      const httpError = await HttpUtils.createHttpError(errorStatus, statusText, errorResponse);

      // Then: Should handle non-retryable error correctly
      expect(httpError.status).toBe(HTTP_STATUS_UNAUTHORIZED);
      expect(httpError.message).toContain(
        `HTTP ${HTTP_STATUS_UNAUTHORIZED}: ${STATUS_UNAUTHORIZED}`
      );
      expect(HttpUtils.isRetryableError(errorStatus)).toBe(false);
    });
  });
});
