/**
 * Unit tests for HtmlParser - Extraction Methods
 * Tests for text, attribute, and data extraction functionality
 */

import { test, expect, beforeEach, describe } from 'bun:test';
import { HtmlParser } from '../../../../src/core/html-parser';

let parser: HtmlParser;

beforeEach(() => {
  parser = new HtmlParser();
});

describe('HtmlParser - Text Extraction', () => {
  test('TC-HP-EX-01 [P0]: should extract text from single element', () => {
    const html = '<html><body><p>Simple text</p></body></html>';
    parser.load(html);

    const result = parser.select('p');
    expect(result.count).toBe(1);
    expect(result.text).toBe('Simple text');
  });

  test('TC-HP-EX-02 [P0]: should extract text from multiple elements', () => {
    const html = `
      <html>
        <body>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
          <p>Paragraph 3</p>
        </body>
      </html>
    `;
    parser.load(html);

    const result = parser.select('p');
    expect(result.count).toBe(3);
    expect(result.text).toContain('Paragraph 1');
    expect(result.text).toContain('Paragraph 2');
    expect(result.text).toContain('Paragraph 3');
  });

  test('TC-HP-EX-03 [P1]: should extract text with HTML tags stripped', () => {
    const html = '<html><body><div><strong>Bold</strong> text <em>italic</em></div></body></html>';
    parser.load(html);

    const result = parser.select('div');
    expect(result.text).toBe('Bold text italic');
  });

  test('TC-HP-EX-04 [P1]: should handle empty elements', () => {
    const html = '<html><body><p></p><div></div></body></html>';
    parser.load(html);

    const pResult = parser.select('p');
    expect(pResult.count).toBe(1);
    expect(pResult.text).toBe('');

    const divResult = parser.select('div');
    expect(divResult.count).toBe(1);
    expect(divResult.text).toBe('');
  });
});

describe('HtmlParser - Attribute Extraction', () => {
  test('TC-HP-AT-01 [P0]: should extract single attribute', () => {
    const html = '<html><body><a href="https://example.com">Link</a></body></html>';
    parser.load(html);

    const result = parser.select('a');
    expect(result.count).toBe(1);
    expect(result.attributes).toHaveProperty('href', 'https://example.com');
  });

  test('TC-HP-AT-02 [P0]: should extract multiple attributes', () => {
    const html =
      '<html><body><input type="text" name="username" class="form-control" required></body></html>';
    parser.load(html);

    const result = parser.select('input');
    expect(result.count).toBe(1);
    expect(result.attributes).toHaveProperty('type', 'text');
    expect(result.attributes).toHaveProperty('name', 'username');
    expect(result.attributes).toHaveProperty('class', 'form-control');
  });

  test('TC-HP-AT-03 [P1]: should extract data attributes', () => {
    const html = '<html><body><div data-id="123" data-user="john">Content</div></body></html>';
    parser.load(html);

    const result = parser.select('div');
    expect(result.count).toBe(1);
    expect(result.data).toHaveProperty('id', '123');
    expect(result.data).toHaveProperty('user', 'john');
  });

  test('TC-HP-AT-04 [P1]: should handle missing attributes', () => {
    const html = '<html><body><p>Just text</p></body></html>';
    parser.load(html);

    const result = parser.select('p');
    expect(result.count).toBe(1);
    expect(result.attributes).toEqual({});
    expect(result.data).toEqual({});
  });
});

describe('HtmlParser - Structured Data Extraction', () => {
  test('TC-HP-SD-01 [P0]: should extract structured data from single element', () => {
    const html = `
      <html>
        <body>
          <article class="post" data-id="1">
            <h2>Article Title</h2>
            <p>Article content</p>
            <span class="author">John Doe</span>
            <time datetime="2023-01-01">2023-01-01</time>
          </article>
        </body>
      </html>
    `;
    parser.load(html);

    const result = parser.select('article.post');
    expect(result.count).toBe(1);
    expect(result.data).toHaveProperty('id', '1');
  });

  test('TC-HP-SD-02 [P1]: should extract structured data from multiple elements', () => {
    const html = `
      <html>
        <body>
          <div class="item" data-id="1">Item 1</div>
          <div class="item" data-id="2">Item 2</div>
          <div class="item" data-id="3">Item 3</div>
        </body>
      </html>
    `;
    parser.load(html);

    const result = parser.select('.item');
    expect(result.count).toBe(3);
  });

  test('TC-HP-SD-03 [P2]: should handle nested data attributes', () => {
    const html = `
      <html>
        <body>
          <div data-category="books" data-subcategory="fiction" data-id="123">
            Book content
          </div>
        </body>
      </html>
    `;
    parser.load(html);

    const result = parser.select('div');
    expect(result.count).toBe(1);
    expect(result.data).toHaveProperty('category', 'books');
    expect(result.data).toHaveProperty('subcategory', 'fiction');
    expect(result.data).toHaveProperty('id', '123');
  });

  test('TC-HP-SD-04 [P3]: should handle malformed data attributes', () => {
    const html = '<html><body><div data-json=\'{"invalid": json}\'>Content</div></body></html>';
    parser.load(html);

    const result = parser.select('div');
    expect(result.count).toBe(1);
    // Should handle malformed JSON gracefully
  });
});
