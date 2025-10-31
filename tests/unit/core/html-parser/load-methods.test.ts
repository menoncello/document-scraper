/**
 * Unit tests for HtmlParser - Load Methods
 * Tests for load() and loadFromResponse() methods
 */

import { test, expect, beforeEach, describe } from 'bun:test';
import { HtmlParser } from '../../../../src/core/html-parser';

// Test interfaces for better type safety
interface MockResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  text: () => Promise<string>;
  json: () => Promise<unknown>;
  arrayBuffer: () => Promise<ArrayBuffer>;
  ok: boolean;
}

let parser: HtmlParser;

beforeEach(() => {
  parser = new HtmlParser();
});

describe('HtmlParser - Load and LoadFromResponse Methods', () => {
  test('TC-HP-LO-01 [P0]: should load HTML content', () => {
    const html = '<html><body><h1>Test</h1></body></html>';
    parser.load(html);

    expect(parser.getOriginalHtml()).toBe(html);
    expect(parser.getHtml()).toBeTruthy();
  });

  test('TC-HP-LO-02 [P0]: should load empty HTML', () => {
    const html = '';
    parser.load(html);

    expect(parser.getOriginalHtml()).toBe('');
    expect(parser.getHtml()).toBe('');
  });

  test('TC-HP-LO-03 [P0]: should load HTML with special characters', () => {
    const html = '<html><body><p>Special chars: &lt; &gt; &amp;</p></body></html>';
    parser.load(html);

    expect(parser.getOriginalHtml()).toBe(html);
    expect(parser.getHtml()).toContain('Special chars:');
  });

  test('TC-HP-LO-04 [P1]: should load from HTTP response', async () => {
    const mockResponse: MockResponse = {
      status: 200,
      statusText: 'OK',
      headers: {},
      text: () => Promise.resolve('<html><body>Response content</body></html>'),
      json: () => Promise.resolve({}),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      ok: true,
    };

    await parser.loadFromResponse(mockResponse);

    expect(parser.getOriginalHtml()).toContain('Response content');
    expect(parser.getTitle()).toBeUndefined();
  });

  test('TC-HP-LO-05 [P1]: should handle error response', async () => {
    const mockResponse: MockResponse = {
      status: 404,
      statusText: 'Not Found',
      headers: {},
      text: () => Promise.resolve('<html><body>Not Found</body></html>'),
      json: () => Promise.resolve({}),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      ok: false,
    };

    await parser.loadFromResponse(mockResponse);

    expect(parser.getOriginalHtml()).toContain('Not Found');
  });

  test('TC-HP-LO-06 [P1]: should handle JSON response', async () => {
    const mockResponse: MockResponse = {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      text: () => Promise.resolve('{"message": "success"}'),
      json: () => Promise.resolve({ message: 'success' }),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      ok: true,
    };

    await parser.loadFromResponse(mockResponse);

    expect(parser.getOriginalHtml()).toBe('{"message": "success"}');
  });

  test('TC-HP-LO-07 [P2]: should handle large HTML content', async () => {
    const largeHtml = `<html><body>${'<p>Large content</p>'.repeat(1000)}</body></html>`;
    parser.load(largeHtml);

    expect(parser.getOriginalHtml().length).toBeGreaterThan(10000);
  });

  test('TC-HP-LO-08 [P2]: should handle malformed HTML', () => {
    const malformedHtml = '<html><body><p>Unclosed paragraph<div>Missing close';
    parser.load(malformedHtml);

    expect(parser.getOriginalHtml()).toBe(malformedHtml);
    expect(parser.getHtml()).toBeTruthy();
  });

  test('TC-HP-LO-09 [P2]: should reload content', () => {
    const firstHtml = '<html><body>First</body></html>';
    const secondHtml = '<html><body>Second</body></html>';

    parser.load(firstHtml);
    expect(parser.getOriginalHtml()).toBe(firstHtml);

    parser.load(secondHtml);
    expect(parser.getOriginalHtml()).toBe(secondHtml);
  });

  test('TC-HP-LO-10 [P3]: should handle null/undefined input', () => {
    expect(() => parser.load(null as any)).not.toThrow();
    expect(() => parser.load(undefined as any)).not.toThrow();
  });
});
