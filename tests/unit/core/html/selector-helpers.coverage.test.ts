/**
 * Comprehensive test coverage for HTML Selector Helpers
 * Focuses on uncovered lines and edge cases in selector functionality
 */

import { describe, test, expect, beforeEach, jest } from 'bun:test';
import * as cheerio from 'cheerio';
import {
  convertElementsToData,
  getElementOuterHTML,
  createSuccessSelectorResult,
  createEmptySelectorResult,
} from '../../../../src/core/html/selector-helpers';

describe('HTML Selector Helpers Coverage Tests', () => {
  let mock$: ReturnType<typeof cheerio.load>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default test HTML
    const testHtml = `
      <html>
        <body>
          <div class="container" id="main" data-test="value">
            <h1 class="title">Header Text</h1>
            <p class="content">Paragraph content</p>
            <span class="empty"></span>
            <input type="text" value="input value" />
          </div>
        </body>
      </html>
    `;
    mock$ = cheerio.load(testHtml);
  });

  describe('TC-SH-100-01 [P0]: convertElementsToData basic functionality', () => {
    test('should convert elements to data array', () => {
      const elements = mock$('.container, .title');
      const result = convertElementsToData(elements, mock$);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        tagName: 'DIV',
        attributes: {
          class: 'container',
          id: 'main',
          'data-test': 'value',
        },
        children: [],
      });
      expect(result[1]).toMatchObject({
        tagName: 'H1',
        attributes: {
          class: 'title',
        },
        children: [],
      });
    });

    test('should handle empty elements collection', () => {
      const elements = mock$('.nonexistent');
      const result = convertElementsToData(elements, mock$);

      expect(result).toHaveLength(0);
    });

    test('should trim text content', () => {
      const elements = mock$('.title');
      const result = convertElementsToData(elements, mock$);

      expect(result[0].text).toBe('Header Text');
    });

    test('should handle elements with no attributes', () => {
      const html = '<div>Simple div</div><span>Simple span</span>';
      const $ = cheerio.load(html);
      const elements = $('div, span');
      const result = convertElementsToData(elements, $);

      expect(result[0].attributes).toEqual({});
      expect(result[1].attributes).toEqual({});
    });
  });

  describe('TC-SH-101-01 [P1]: convertElementsToData edge cases', () => {
    test('should handle elements with missing tagName', () => {
      const mockElement = {
        attribs: { class: 'test' },
        // Missing tagName
      };

      const elements = cheerio.load('<div>test</div>')('div');
      // Replace the first element with our mock
      (elements as any)[0] = mockElement;

      const result = convertElementsToData(elements, mock$);

      expect(result[0].tagName).toBe('');
      expect(result[0].attributes).toEqual({ class: 'test' });
    });

    test('should handle elements with missing attribs', () => {
      const mockElement = {
        tagName: 'DIV',
        // Missing attribs
      };

      const elements = cheerio.load('<div>test</div>')('div');
      (elements as any)[0] = mockElement;

      const result = convertElementsToData(elements, mock$);

      expect(result[0].tagName).toBe('DIV');
      expect(result[0].attributes).toEqual({});
    });

    test('should handle elements with null/undefined attributes', () => {
      const mockElement = {
        tagName: 'DIV',
        attribs: null,
      };

      const elements = cheerio.load('<div>test</div>')('div');
      (elements as any)[0] = mockElement;

      const result = convertElementsToData(elements, mock$);

      expect(result[0].attributes).toEqual({});
    });

    test('should handle elements with complex attributes', () => {
      const html = `
        <div
          class="multi-class test"
          id="complex"
          data-value="123"
          data-json='{"key": "value"}'
          style="color: red; font-size: 14px;"
          disabled
          title="Tooltip text"
        >
          Content
        </div>
      `;
      const $ = cheerio.load(html);
      const elements = $('div');
      const result = convertElementsToData(elements, $);

      expect(result[0].attributes).toMatchObject({
        class: 'multi-class test',
        id: 'complex',
        'data-value': '123',
        'data-json': '{"key": "value"}',
        style: 'color: red; font-size: 14px;',
        title: 'Tooltip text',
      });
      expect(result[0].attributes).toHaveProperty('disabled');
    });

    test('should handle elements with special characters in attributes', () => {
      const html =
        '<div data-special="quotes: &quot;single&quot; and &quot;double&quot; and unicode: 世界">Content</div>';
      const $ = cheerio.load(html);
      const elements = $('div');
      const result = convertElementsToData(elements, $);

      expect(result[0].attributes['data-special']).toContain('quotes');
      expect(result[0].attributes['data-special']).toContain('世界');
    });
  });

  describe('TC-SH-102-01 [P0]: getElementOuterHTML functionality', () => {
    test('should return outerHTML for element nodes', () => {
      const element = mock$('div')[0];
      const result = getElementOuterHTML(element, mock$);

      expect(result).toContain('<div');
      expect(result).toContain('</div>');
      expect(result).toContain('class="container"');
    });

    test('should return empty string for null node', () => {
      const result = getElementOuterHTML(null, mock$);
      expect(result).toBe('');
    });

    test('should return empty string for undefined node', () => {
      const result = getElementOuterHTML(undefined, mock$);
      expect(result).toBe('');
    });

    test('should handle nodes without outerHTML property', () => {
      const mockNode = {
        nodeType: 3, // Text node
        data: 'text content',
        // No outerHTML property
      };

      const result = getElementOuterHTML(mockNode as any, mock$);
      expect(result).toBe(''); // Should return empty string since cheerio.html() will likely fail
    });

    test('should handle cheerio html() method fallback', () => {
      const element = mock$('h1')[0];
      const result = getElementOuterHTML(element, mock$);

      expect(result).toContain('<h1');
      expect(result).toContain('Header Text');
      expect(result).toContain('</h1>');
    });

    test('should handle cheerio html() returning null', () => {
      const element = mock$('span.empty')[0];

      // Mock cheerio's html method to return null
      const mock$withNull = {
        ...mock$,
        html: jest.fn().mockReturnValue(null),
      };

      const result = getElementOuterHTML(element, mock$withNull as any);
      expect(result).toBe('');
    });
  });

  describe('TC-SH-103-01 [P1]: getElementOuterHTML error handling', () => {
    test('should handle errors in cheerio html() method gracefully', () => {
      const element = mock$('div')[0];

      // Mock cheerio to throw error when calling html()
      const mock$withError = {
        ...mock$,
        html: jest.fn().mockImplementation(() => {
          throw new Error('Cheerio html error');
        }),
      };

      const result = getElementOuterHTML(element, mock$withError as any);
      expect(result).toBe('');
    });

    test('should handle complex nested elements', () => {
      const complexHtml = `
        <div class="outer">
          <div class="inner">
            <span class="nested">
              <em>Deep content</em>
            </span>
          </div>
        </div>
      `;
      const $ = cheerio.load(complexHtml);
      const element = $('.outer')[0];

      const result = getElementOuterHTML(element, $);

      expect(result).toContain('class="outer"');
      expect(result).toContain('class="inner"');
      expect(result).toContain('class="nested"');
      expect(result).toContain('Deep content');
    });

    test('should handle self-closing tags', () => {
      const html = '<img src="test.jpg" alt="test" /><br />';
      const $ = cheerio.load(html);
      const img = $('img')[0];

      const result = getElementOuterHTML(img, $);

      expect(result).toContain('<img');
      expect(result).toContain('src="test.jpg"');
      expect(result).toContain('alt="test"');
    });

    test('should handle void elements', () => {
      const html = '<input type="text" value="test" />';
      const $ = cheerio.load(html);
      const input = $('input')[0];

      const result = getElementOuterHTML(input, $);

      expect(result).toContain('<input');
      expect(result).toContain('type="text"');
      expect(result).toContain('value="test"');
    });
  });

  describe('TC-SH-104-01 [P0]: createSuccessSelectorResult functionality', () => {
    test('should create success result with matched elements', () => {
      const matches = mock$('.container');
      const result = createSuccessSelectorResult(matches, mock$);

      expect(result.matches).toBe(matches);
      expect(result.count).toBe(1);
      expect(result.text?.replace(/\s+/g, ' ').trim()).toBe('Header Text Paragraph content');
      expect(result.html).toContain('<div');
      expect(result.elements).toHaveLength(1);
      expect(result.exists).toBe(true);
      expect(result.found).toBe(true);
      expect(result.data).toEqual({ test: 'value' });
    });

    test('should create success result with multiple matches', () => {
      const matches = mock$('.title, .content');
      const result = createSuccessSelectorResult(matches, mock$);

      expect(result.count).toBe(2);
      expect(result.elements).toHaveLength(2);
      expect(result.exists).toBe(true);
      expect(result.found).toBe(true);
    });

    test('should handle empty matches', () => {
      const matches = mock$('.nonexistent');
      const result = createSuccessSelectorResult(matches, mock$);

      expect(result.count).toBe(0);
      expect(result.text).toBe('');
      expect(result.html).toBe('');
      expect(result.elements).toHaveLength(0);
      expect(result.exists).toBe(false);
      expect(result.found).toBe(false);
    });

    test('should implement extractAttribute function', () => {
      const matches = mock$('.container');
      const result = createSuccessSelectorResult(matches, mock$);

      expect(typeof result.extractAttribute).toBe('function');

      // Test existing attribute
      expect(result.extractAttribute('class')).toBe('container');
      expect(result.extractAttribute('id')).toBe('main');
      expect(result.extractAttribute('data-test')).toBe('value');

      // Test non-existing attribute
      expect(result.extractAttribute('nonexistent')).toBe('');
    });

    test('should handle extractAttribute with no matches', () => {
      const matches = mock$('.nonexistent');
      const result = createSuccessSelectorResult(matches, mock$);

      expect(result.extractAttribute('class')).toBe('');
    });
  });

  describe('TC-SH-105-01 [P1]: createSuccessSelectorResult edge cases', () => {
    test('should handle elements with whitespace text', () => {
      const html = '<div>   spaced content   </div>';
      const $ = cheerio.load(html);
      const matches = $('div');
      const result = createSuccessSelectorResult(matches, $);

      expect(result.text).toBe('spaced content');
    });

    test('should handle elements with HTML entities', () => {
      const html = '<div>&lt;script&gt;alert("test")&lt;/script&gt;</div>';
      const $ = cheerio.load(html);
      const matches = $('div');
      const result = createSuccessSelectorResult(matches, $);

      expect(result.text).toBe('<script>alert("test")</script>');
    });

    test('should handle elements with Unicode content', () => {
      const html = '<div>Unicode: 世界 🌍 ñáéíóú</div>';
      const $ = cheerio.load(html);
      const matches = $('div');
      const result = createSuccessSelectorResult(matches, $);

      expect(result.text).toBe('Unicode: 世界 🌍 ñáéíóú');
    });

    test('should handle elements with boolean attributes', () => {
      const html = '<input type="checkbox" checked disabled readonly />';
      const $ = cheerio.load(html);
      const matches = $('input');
      const result = createSuccessSelectorResult(matches, $);

      expect(result.elements[0].attributes).toHaveProperty('checked');
      expect(result.elements[0].attributes).toHaveProperty('disabled');
      expect(result.elements[0].attributes).toHaveProperty('readonly');
    });

    test('should get HTML from first element when multiple matches', () => {
      const matches = mock$('.title, .content');
      const result = createSuccessSelectorResult(matches, mock$);

      expect(result.html).toContain('<h1');
      expect(result.html).toContain('Header Text');
      expect(result.html).not.toContain('<p');
    });
  });

  describe('TC-SH-106-01 [P0]: createEmptySelectorResult functionality', () => {
    test('should create empty result with valid cheerio instance', () => {
      const result = createEmptySelectorResult(mock$);

      expect(result.matches).toBeDefined();
      expect(result.count).toBe(0);
      expect(result.text).toBe('');
      expect(result.html).toBe('');
      expect(result.elements).toHaveLength(0);
      expect(result.exists).toBe(false);
      expect(result.found).toBe(false);
      expect(result.data).toBeNull();
      expect(typeof result.extractAttribute).toBe('function');
    });

    test('should create empty result with null cheerio instance', () => {
      const result = createEmptySelectorResult(null);

      expect(result.matches).toBeDefined();
      expect(result.count).toBe(0);
      expect(result.text).toBe('');
      expect(result.html).toBe('');
      expect(result.elements).toHaveLength(0);
      expect(result.exists).toBe(false);
      expect(result.found).toBe(false);
      expect(result.data).toBeNull();
      expect(typeof result.extractAttribute).toBe('function');
    });

    test('should handle extractAttribute on empty result', () => {
      const result = createEmptySelectorResult(mock$);

      expect(result.extractAttribute('any-attribute')).toBe('');
    });
  });

  describe('TC-SH-107-01 [P1]: createEmptySelectorResult edge cases', () => {
    test('should handle undefined cheerio instance', () => {
      const result = createEmptySelectorResult(undefined as any);

      expect(result.count).toBe(0);
      expect(result.exists).toBe(false);
      expect(result.extractAttribute('test')).toBe('');
    });

    test('should ensure matches is always a valid cheerio object', () => {
      const result = createEmptySelectorResult(mock$);

      // Should have cheerio methods available
      expect(typeof result.matches?.length).toBe('number');
      expect(typeof result.matches?.text).toBe('function');
      expect(typeof result.matches?.attr).toBe('function');
    });

    test('should handle result with null cheerio instance gracefully', () => {
      const result = createEmptySelectorResult(null);

      expect(() => {
        // These operations should not throw
        expect(result.count).toBeDefined();
        expect(result.text).toBeDefined();
        expect(result.exists).toBeDefined();
        expect(result.extractAttribute('test')).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('TC-SH-108-01 [P2]: Integration scenarios', () => {
    test('should handle complete selector workflow', () => {
      const html = `
        <div class="products">
          <div class="product" data-id="1" data-price="10.99">
            <h3 class="product-title">Product 1</h3>
            <p class="price">$10.99</p>
          </div>
          <div class="product" data-id="2" data-price="20.99">
            <h3 class="product-title">Product 2</h3>
            <p class="price">$20.99</p>
          </div>
        </div>
      `;
      const $ = cheerio.load(html);

      // Successful selector
      const products = $('.product');
      const successResult = createSuccessSelectorResult(products, $);

      expect(successResult.count).toBe(2);
      expect(successResult.elements[0].attributes['data-id']).toBe('1');
      expect(successResult.elements[1].attributes['data-price']).toBe('20.99');

      // Extract specific attributes
      const firstProductPrice = successResult.extractAttribute('data-price');
      expect(firstProductPrice).toBe('10.99');

      // Failed selector
      const emptyResult = createEmptySelectorResult($);

      expect(emptyResult.count).toBe(0);
      expect(emptyResult.extractAttribute('data-price')).toBe('');
    });

    test('should handle malformed HTML gracefully', () => {
      const malformedHtml = '<div><span>Unclosed<p>Mixed tags<div>Nested</div>';
      const $ = cheerio.load(malformedHtml);

      const elements = $('*');
      const result = createSuccessSelectorResult(elements, $);

      expect(result.count).toBeGreaterThan(0);
      expect(result.elements.length).toBeGreaterThan(0);
      expect(() => result.extractAttribute('class')).not.toThrow();
    });

    test('should handle script and style tags', () => {
      const html = `
        <html>
          <head>
            <style>.test { color: red; }</style>
            <script>console.log('test');</script>
          </head>
          <body>
            <div>Content</div>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);

      const styles = $('style');
      const styleResult = createSuccessSelectorResult(styles, $);

      expect(styleResult.count).toBe(1);
      expect(styleResult.html).toContain('.test { color: red; }');

      const scripts = $('script');
      const scriptResult = createSuccessSelectorResult(scripts, $);

      expect(scriptResult.count).toBe(1);
      expect(scriptResult.html).toContain('console.log');
    });
  });

  describe('TC-SH-109-01 [P2]: Performance and edge cases', () => {
    test('should handle large number of elements', () => {
      const largeHtml = `<div>${'<span>Item</span>'.repeat(1000)}</div>`;
      const $ = cheerio.load(largeHtml);
      const spans = $('span');
      const result = createSuccessSelectorResult(spans, $);

      expect(result.count).toBe(1000);
      expect(result.elements).toHaveLength(1000);
      expect(typeof result.extractAttribute).toBe('function');
    });

    test('should handle deeply nested elements', () => {
      let nestedHtml = '<div>';
      for (let i = 0; i < 10; i++) {
        nestedHtml += `<div class="level-${i}">`;
      }
      nestedHtml += 'Deep content';
      for (let i = 0; i < 10; i++) {
        nestedHtml += '</div>';
      }
      nestedHtml += '</div>';

      const $ = cheerio.load(nestedHtml);
      const deepDiv = $('.level-5');
      const result = createSuccessSelectorResult(deepDiv, $);

      expect(result.count).toBe(1);
      expect(result.html).toContain('class="level-5"');
    });

    test('should handle elements with unusual tag names', () => {
      const html =
        '<custom-tag>Custom element</custom-tag><another-tag:ns>Namespaced</another-tag:ns>';
      const $ = cheerio.load(html);
      const customElements = $('*');
      const result = createSuccessSelectorResult(customElements, $);

      expect(result.count).toBeGreaterThan(0);
      expect(result.elements.some(el => el.tagName.includes('CUSTOM-TAG'))).toBe(true);
    });
  });
});
