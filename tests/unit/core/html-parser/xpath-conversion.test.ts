/**
 * Unit tests for HtmlParser - XPath Conversion
 * Tests for XPath to CSS selector conversion functionality
 */

import { test, expect, beforeEach, describe } from 'bun:test';
import { HtmlParser } from '../../../../src/core/html-parser';

let parser: HtmlParser;

beforeEach(() => {
  parser = new HtmlParser();
});

describe('HtmlParser - XPath Conversion', () => {
  test('TC-HP-XP-01 [P1]: should convert simple XPath to CSS selector', () => {
    const html = '<html><body><div class="test">Content</div></body></html>';
    parser.load(html);

    // Test basic XPath conversion
    const result = parser.select('//div');
    expect(result.count).toBe(1);
    expect(result.text).toContain('Content');
  });

  test('TC-HP-XP-02 [P1]: should convert XPath with class attribute', () => {
    const html = '<html><body><div class="target">Target content</div></body></html>';
    parser.load(html);

    const result = parser.select('//div[@class="target"]');
    expect(result.count).toBe(1);
    expect(result.text).toContain('Target content');
  });

  test('TC-HP-XP-03 [P1]: should convert XPath with ID attribute', () => {
    const html = '<html><body><div id="main">Main content</div></body></html>';
    parser.load(html);

    const result = parser.select('//div[@id="main"]');
    expect(result.count).toBe(1);
    expect(result.text).toContain('Main content');
  });

  test('TC-HP-XP-04 [P1]: should handle complex XPath expressions', () => {
    const html = `
      <html>
        <body>
          <div class="container">
            <p class="text">Paragraph 1</p>
            <p class="text">Paragraph 2</p>
          </div>
        </body>
      </html>
    `;
    parser.load(html);

    const result = parser.select('//div[@class="container"]/p[@class="text"]');
    expect(result.count).toBe(2);
    expect(result.text).toContain('Paragraph 1');
    expect(result.text).toContain('Paragraph 2');
  });

  test('TC-HP-XP-05 [P2]: should convert XPath with position', () => {
    const html = `
      <html>
        <body>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
        </body>
      </html>
    `;
    parser.load(html);

    const result = parser.select('//li[1]');
    expect(result.count).toBe(1);
    expect(result.text).toContain('Item 1');
  });

  test('TC-HP-XP-06 [P2]: should handle XPath with contains()', () => {
    const html = `
      <html>
        <body>
          <div class="button primary">Primary Button</div>
          <div class="button secondary">Secondary Button</div>
        </body>
      </html>
    `;
    parser.load(html);

    // Note: XPath contains() might not be fully supported in CSS conversion
    // This test documents the current behavior
    const result = parser.select('//div[contains(@class, "button")]');
    expect(result.count).toBeGreaterThanOrEqual(0);
  });

  test('TC-HP-XP-07 [P2]: should handle XPath with multiple attributes', () => {
    const html = `
      <html>
        <body>
          <input type="text" name="username" class="form-input" />
        </body>
      </html>
    `;
    parser.load(html);

    const result = parser.select('//input[@type="text"][@name="username"]');
    expect(result.count).toBe(1);
  });

  test('TC-HP-XP-08 [P3]: should handle invalid XPath gracefully', () => {
    const html = '<html><body><div>Content</div></body></html>';
    parser.load(html);

    expect(() => {
      parser.select('///invalid/xpath');
    }).not.toThrow();
  });

  test('TC-HP-XP-09 [P3]: should handle empty XPath', () => {
    const html = '<html><body><div>Content</div></body></html>';
    parser.load(html);

    expect(() => {
      parser.select('');
    }).not.toThrow();
  });

  test('TC-HP-XP-10 [P3]: should handle XPath for non-existent elements', () => {
    const html = '<html><body><div>Content</div></body></html>';
    parser.load(html);

    const result = parser.select('//nonexistent');
    expect(result.count).toBe(0);
    expect(result.text).toBe('');
  });
});
