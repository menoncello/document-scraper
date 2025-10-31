/**
 * Test factory for creating mock HTTP responses
 * Provides parallel-safe test data generation with unique identifiers
 */
export class MockResponseFactory {
  private static counter = 0;

  /**
   * Create a successful HTML response
   */
  static html(htmlContent?: string, overrides: Partial<Response> = {}): Response {
    const id = ++this.counter;
    const content = htmlContent || `<html><body>Test content ${id}</body></html>`;

    const headers = new Headers([
      ['content-type', 'text/html; charset=utf-8'],
      ['content-length', String(content.length)],
    ]);

    // Create a real Response object to ensure proper type compatibility
    const response = new Response(content, {
      status: 200,
      statusText: 'OK',
      headers,
    });

    // Apply any additional overrides
    if (overrides) {
      for (const key of Object.keys(overrides)) {
        if (key !== 'body' && key !== 'bodyUsed') {
          (response as any)[key] = overrides[key as keyof Response];
        }
      }
    }

    return response;
  }

  /**
   * Create a successful JSON response
   */
  static json(data: any, overrides: Partial<Response> = {}): Response {
    ++this.counter;
    const content = JSON.stringify(data);

    const headers = new Headers([
      ['content-type', 'application/json; charset=utf-8'],
      ['content-length', String(content.length)],
    ]);

    // Create a real Response object to ensure proper type compatibility
    const response = new Response(content, {
      status: 200,
      statusText: 'OK',
      headers,
    });

    // Apply any additional overrides
    if (overrides) {
      for (const key of Object.keys(overrides)) {
        if (key !== 'body' && key !== 'bodyUsed') {
          (response as any)[key] = overrides[key as keyof Response];
        }
      }
    }

    return response;
  }

  /**
   * Create a server error response (5xx)
   */
  static serverError(status = 500, message?: string): Response {
    const id = ++this.counter;
    const content = message || `Internal Server Error ${id}`;

    // Use appropriate status text for different status codes
    const statusTexts: Record<number, string> = {
      500: 'Internal Server Error',
      501: 'Not Implemented',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
      505: 'HTTP Version Not Supported',
    };

    const statusText = statusTexts[status] || 'Internal Server Error';

    const headers = new Headers([
      ['content-type', 'text/plain; charset=utf-8'],
      ['content-length', String(content.length)],
    ]);

    // Create a real Response object to ensure proper type compatibility
    return new Response(content, {
      status,
      statusText,
      headers,
    });
  }

  /**
   * Create a client error response (4xx)
   */
  static clientError(status = 404, message?: string): Response {
    const id = ++this.counter;
    const content = message || `Not Found ${id}`;

    const headers = new Headers([
      ['content-type', 'text/plain; charset=utf-8'],
      ['content-length', String(content.length)],
    ]);

    // Create a real Response object to ensure proper type compatibility
    return new Response(content, {
      status,
      statusText: 'Not Found',
      headers,
    });
  }

  /**
   * Create a rate limit error response (429)
   */
  static rateLimitError(retryAfter?: number): Response {
    const id = ++this.counter;
    const content = `Rate limit exceeded ${id}`;
    const headers = new Headers([
      ['content-type', 'text/plain; charset=utf-8'],
      ['content-length', String(content.length)],
    ]);

    if (retryAfter) {
      headers.set('retry-after', String(retryAfter));
    }

    // Create a real Response object to ensure proper type compatibility
    return new Response(content, {
      status: 429,
      statusText: 'Too Many Requests',
      headers,
    });
  }

  /**
   * Create a timeout error (simulated via AbortError)
   */
  static timeoutError(): Promise<never> {
    const id = ++this.counter;
    return Promise.reject(new DOMException(`Request timeout after 5000ms ${id}`, 'AbortError'));
  }

  /**
   * Create a network error
   */
  static networkError(): Promise<never> {
    const id = ++this.counter;
    return Promise.reject(new Error(`Network error ${id}`));
  }

  /**
   * Create a sequence of responses for retry testing
   */
  static retrySequence(failures = 2, successContent?: string): Response[] {
    const responses: Response[] = [];

    // Add failures
    for (let i = 0; i < failures; i++) {
      responses.push(this.serverError(503, `Service Unavailable - Attempt ${i + 1}`));
    }

    // Add success
    responses.push(this.html(successContent));

    return responses;
  }

  /**
   * Reset the counter (useful for test isolation)
   */
  static reset(): void {
    this.counter = 0;
  }
}
