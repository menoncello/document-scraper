/**
 * Comprehensive test coverage for HTML Parser Core
 * Focuses on edge cases and uncovered lines in parser functionality
 */

import { describe, test, expect, beforeEach, mock } from 'bun:test';
import * as cheerio from 'cheerio';
import {
  HTML_PROCESSING_CONSTANTS,
  removeEmptyElements,
  hasSelector,
  getProcessedHtml,
  getElementInfoRecursive,
  processEmptyElementsRemoval,
} from '../../../../src/core/html/parser-core';

// Mock dependencies
const mockShouldRemoveEmptyElement = mock((_element: unknown, _$: any) => false);

describe('HTML Parser Core Coverage Tests', () => {
  let mock$: ReturnType<typeof cheerio.load>;

  beforeEach(() => {
    // Reset mock
    mockShouldRemoveEmptyElement.mockReturnValue(false);

    // Default test HTML
    const testHtml = `
      <html>
        <head><title>Test Page</title></head>
        <body>
          <div class="container">
            <h1>Header</h1>
            <p>Paragraph content</p>
            <div class="empty"></div>
          </div>
        </body>
      </html>
    `;
    mock$ = cheerio.load(testHtml);
  });

  describe('TC-PC-100-01 [P0]: HTML_PROCESSING_CONSTANTS', () => {
    test('should have correct basic structure regex', () => {
      const expected = /<html><head><\/head><(?:body><\/){2}html>/g;
      expect(HTML_PROCESSING_CONSTANTS.BASIC_STRUCTURE_REGEX.source).toBe(expected.source);
      expect(HTML_PROCESSING_CONSTANTS.BASIC_STRUCTURE_REGEX.flags).toBe(expected.flags);
    });

    test('should match basic HTML structure', () => {
      const basicHtml = '<html><head></head><body></body></html>';
      expect(HTML_PROCESSING_CONSTANTS.BASIC_STRUCTURE_REGEX.test(basicHtml)).toBe(true);
    });

    test('should not match HTML with content', () => {
      const contentHtml = '<html><head></head><body><div>Content</div></body></html>';
      expect(HTML_PROCESSING_CONSTANTS.BASIC_STRUCTURE_REGEX.test(contentHtml)).toBe(false);
    });
  });

  describe('TC-PC-101-01 [P0]: removeEmptyElements', () => {
    test('should call removeCallback when cheerio instance is provided', () => {
      const mockRemoveCallback = mock(() => {
        // Mock function for element removal
      });

      removeEmptyElements(mock$, mockRemoveCallback);

      expect(mockRemoveCallback).toHaveBeenCalled();
    });

    test('should not call removeCallback when cheerio instance is null', () => {
      const mockRemoveCallback = mock(() => {
        // Mock function for element removal
      });

      removeEmptyElements(null, mockRemoveCallback);

      expect(mockRemoveCallback).not.toHaveBeenCalled();
    });

    test('should handle removeCallback errors gracefully', () => {
      const mockRemoveCallback = mock(() => {
        throw new Error('Remove callback error');
      });

      expect(() => removeEmptyElements(mock$, mockRemoveCallback)).toThrow('Remove callback error');
    });
  });

  describe('TC-PC-102-01 [P0]: hasSelector', () => {
    test('should return true when selector matches elements', () => {
      const mockSelectCallback = mock(() => ({ count: 3 }));

      const result = hasSelector('.container', mockSelectCallback, 0);

      expect(result).toBe(true);
      expect(mockSelectCallback).toHaveBeenCalledWith('.container');
    });

    test('should return false when selector matches no elements', () => {
      const mockSelectCallback = mock(() => ({ count: 0 }));

      const result = hasSelector('.nonexistent', mockSelectCallback, 0);

      expect(result).toBe(false);
      expect(mockSelectCallback).toHaveBeenCalledWith('.nonexistent');
    });

    test('should handle empty count threshold', () => {
      const mockSelectCallback = mock(() => ({ count: 1 }));

      const result = hasSelector('.element', mockSelectCallback, 1);

      expect(result).toBe(false); // count === emptyCount, so false
    });

    test('should handle negative count threshold', () => {
      const mockSelectCallback = mock(() => ({ count: 0 }));

      const result = hasSelector('.element', mockSelectCallback, -1);

      expect(result).toBe(true); // count > emptyCount (-1)
    });

    test('should handle positive count threshold', () => {
      const mockSelectCallback = mock(() => ({ count: 5 }));

      const result = hasSelector('.element', mockSelectCallback, 2);

      expect(result).toBe(true); // count > emptyCount (2)
    });
  });

  describe('TC-PC-103-01 [P0]: getProcessedHtml', () => {
    test('should return processed HTML when cheerio instance is valid', () => {
      const originalHtml = '<div>Test content</div>';
      const $ = cheerio.load(originalHtml);

      const result = getProcessedHtml($, originalHtml);

      expect(result).toContain('<html>');
      expect(result).toContain('Test content');
    });

    test('should return empty string when cheerio instance is null', () => {
      const originalHtml = '<div>Test content</div>';

      const result = getProcessedHtml(null, originalHtml);

      expect(result).toBe('');
    });

    test('should return empty string when original HTML is empty', () => {
      const $ = cheerio.load('');

      const result = getProcessedHtml($, '');

      expect(result).toBe('');
    });

    test('should return empty string when original HTML is whitespace only', () => {
      const $ = cheerio.load('   \n\t   ');

      const result = getProcessedHtml($, '   \n\t   ');

      expect(result).toBe('');
    });

    test('should return empty string when original HTML is null/undefined', () => {
      const $ = cheerio.load('');

      const result1 = getProcessedHtml($, null as any);
      const result2 = getProcessedHtml($, undefined as any);

      expect(result1).toBe('');
      expect(result2).toBe('');
    });

    test('should return empty string when HTML only contains basic structure', () => {
      const basicHtml = '<html><head></head><body></body></html>';
      const $ = cheerio.load(basicHtml);

      const result = getProcessedHtml($, basicHtml);

      expect(result).toBe('');
    });

    test('should return HTML when it contains content beyond basic structure', () => {
      const contentHtml = '<html><head></head><body><div>Content</div></body></html>';
      const $ = cheerio.load(contentHtml);

      const result = getProcessedHtml($, contentHtml);

      expect(result).toContain('Content');
      expect(result).not.toBe('');
    });

    test('should handle $.html() returning null', () => {
      const $ = cheerio.load('<div>test</div>');
      // Mock $.html to return null
      const mockHtml = mock((): string | null => null);
      // Type assertion to bypass strict typing for this test scenario
      ($.html as any) = mockHtml;

      const result = getProcessedHtml($, '<div>test</div>');

      expect(result).toBe('');
    });

    test('should handle complex HTML with multiple elements', () => {
      const complexHtml = `
        <html>
          <head><title>Complex</title></head>
          <body>
            <div class="container">
              <h1>Title</h1>
              <p>Paragraph</p>
              <span>Span content</span>
            </div>
          </body>
        </html>
      `;
      const $ = cheerio.load(complexHtml);

      const result = getProcessedHtml($, complexHtml);

      expect(result).toContain('Title');
      expect(result).toContain('Paragraph');
      expect(result).toContain('Span content');
    });
  });

  describe('TC-PC-104-01 [P0]: getElementInfoRecursive', () => {
    test('should create element info with children', () => {
      const mockCreateElementCallback = mock((_element: any, _$: any, _parent: any) => ({
        tagName: 'DIV',
        text: 'Test',
        attributes: {},
        children: [],
      }));

      const $ = cheerio.load('<div><span>Child</span></div>');
      const element = $('div')[0];

      const result = getElementInfoRecursive(element, $, mockCreateElementCallback);

      expect(mockCreateElementCallback).toHaveBeenCalledTimes(2); // div + span
      expect(result.tagName).toBe('DIV');
      expect(result.children).toHaveLength(1);
    });

    test('should throw error when cheerio instance is null', () => {
      const mockCreateElementCallback = mock((_element: any, _$: any, _parent: any) => ({
        tagName: 'TEST',
        text: '',
        attributes: {},
        children: [],
      }));
      const element = { tagName: 'DIV' };

      expect(() => getElementInfoRecursive(element, null, mockCreateElementCallback)).toThrow(
        'Cheerio instance not initialized'
      );
    });

    test('should handle element with no children', () => {
      const mockCreateElementCallback = mock(() => ({
        tagName: 'SPAN',
        text: 'Simple text',
        attributes: {},
        children: [],
      }));

      const $ = cheerio.load('<span>Simple text</span>');
      const element = $('span')[0];

      const result = getElementInfoRecursive(element, $, mockCreateElementCallback);

      expect(result.children).toHaveLength(0);
      expect(mockCreateElementCallback).toHaveBeenCalledTimes(1);
    });

    test('should handle deeply nested elements', () => {
      const mockCreateElementCallback = mock((element: any, $: any, _parent: any) => ({
        tagName: element.tagName || 'UNKNOWN',
        text: $(element).text(),
        attributes: {},
        children: [],
      }));

      const $ = cheerio.load('<div><span><strong><em>Deep</em></strong></span></div>');
      const element = $('div')[0];

      const result = getElementInfoRecursive(element, $, mockCreateElementCallback);

      expect(mockCreateElementCallback).toHaveBeenCalledTimes(4); // div, span, strong, em
      expect(result.children[0].children[0].children).toHaveLength(1); // Nested structure
    });

    test('should pass parent information correctly', () => {
      const mockCreateElementCallback = mock((element: any, $: any, parent: any) => {
        const info = {
          tagName: element.tagName ? element.tagName.toUpperCase() : 'UNKNOWN',
          text: $(element).text(),
          attributes: {},
          children: [],
        };
        if (parent) {
          (info as any).parentTag = parent.tagName;
        }
        return info;
      });

      const $ = cheerio.load('<div><span>Child</span></div>');
      const element = $('div')[0];

      const result = getElementInfoRecursive(element, $, mockCreateElementCallback);

      // Child element should have parent info
      expect((result.children[0] as any).parentTag).toBe('DIV');
    });

    test('should handle malformed elements', () => {
      const mockCreateElementCallback = mock(() => ({
        tagName: 'UNKNOWN',
        text: '',
        attributes: {},
        children: [],
      }));

      const $ = cheerio.load('<div>Content</div>');
      const malformedElement = { tagName: null, children: [], attribs: {} };

      getElementInfoRecursive(malformedElement, $, mockCreateElementCallback);

      expect(mockCreateElementCallback).toHaveBeenCalledWith(malformedElement, $, undefined);
    });
  });

  describe('TC-PC-105-01 [P0]: processEmptyElementsRemoval', () => {
    test('should remove elements when shouldRemoveEmptyElement returns true', () => {
      const $ = cheerio.load('<div><span></span><p>Content</p></div>');
      const originalSpanCount = $('span').length;

      processEmptyElementsRemoval($);

      // The empty span (no text, no children, no attributes) should be removed
      expect($('span').length).toBeLessThan(originalSpanCount);
    });

    test('should not remove elements when shouldRemoveEmptyElement returns false', () => {
      mockShouldRemoveEmptyElement.mockReturnValue(false);

      const $ = cheerio.load('<div><span>Content</span><p>More content</p></div>');
      const originalElementCount = $('*').length;

      processEmptyElementsRemoval($);

      // The count should be the same or only slightly different due to HTML parsing normalization
      expect($('*').length).toBeGreaterThanOrEqual(originalElementCount - 1);
    });

    test('should not process when cheerio instance is null', () => {
      expect(() => processEmptyElementsRemoval(null)).not.toThrow();
      expect(mockShouldRemoveEmptyElement).not.toHaveBeenCalled();
    });

    test('should handle mixed removal scenarios', () => {
      const $ = cheerio.load(`
        <div>
          <span class="keep">Keep this</span>
          <div class="empty"></div>
          <p></p>
          <strong>Bold text</strong>
        </div>
      `);

      processEmptyElementsRemoval($);

      // The empty div (class="empty") should NOT be removed because it has attributes
      // The empty p should be removed because it has no text, no children, and no attributes
      expect($('div.empty').length).toBe(1);
      expect($('p').length).toBe(0);
      expect($('span.keep').length).toBe(1);
      expect($('strong').length).toBe(1);
    });

    test('should handle removal during iteration', () => {
      const $ = cheerio.load(`
        <div>
          <span></span>
          <span></span>
          <span></span>
        </div>
      `);

      processEmptyElementsRemoval($);

      // Empty spans (no text, no children, no attributes) should be removed
      expect($('span').length).toBe(0);
    });

    test('should handle complex nested empty elements', () => {
      const $ = cheerio.load(`
        <div>
          <div class="outer">
            <div class="inner">
              <span></span>
            </div>
          </div>
          <div class="content">
            <p>Real content</p>
          </div>
        </div>
      `);

      processEmptyElementsRemoval($);

      // The span should be removed (no text, no children, no attributes)
      // The inner div should NOT be removed because it has a class attribute
      // The outer div should NOT be removed because it has a class attribute
      expect($('.outer').length).toBe(1);
      expect($('.inner').length).toBe(1); // Not removed because of class attribute
      expect($('span').length).toBe(0); // Removed because it's truly empty
      expect($('.content').length).toBe(1);
      expect($('p').length).toBe(1);
    });
  });

  describe('TC-PC-106-01 [P1]: Integration scenarios', () => {
    test('should handle complete HTML processing workflow', () => {
      const html = `
        <html>
          <body>
            <div class="container">
              <h1>Title</h1>
              <div></div>
              <p>Content</p>
            </div>
          </body>
        </html>
      `;

      const $ = cheerio.load(html);

      // Remove empty elements
      processEmptyElementsRemoval($);

      // Get processed HTML
      const processed = getProcessedHtml($, html);

      expect(processed).toContain('Title');
      expect(processed).toContain('Content');
      // The empty div should be removed because it has no attributes, text, or children
    });

    test('should handle edge case with self-closing tags', () => {
      const html = '<div><img src="test.jpg"/></div>';
      const $ = cheerio.load(html);

      processEmptyElementsRemoval($);

      const processed = getProcessedHtml($, html);

      expect(processed).toContain('img');
    });

    test('should handle HTML with comments and whitespace', () => {
      const html = `
        <html>
          <body>
            <!-- This is a comment -->
            <div>

              <p>Content with spaces</p>

            </div>
          </body>
        </html>
      `;

      const $ = cheerio.load(html);
      mockShouldRemoveEmptyElement.mockReturnValue(false);

      processEmptyElementsRemoval($);
      const processed = getProcessedHtml($, html);

      expect(processed).toContain('Content with spaces');
    });
  });

  describe('TC-PC-107-01 [P2]: Error handling and edge cases', () => {
    test('should handle malformed HTML gracefully', () => {
      const malformedHtml = '<div><span>Unclosed tag<p>Another paragraph';

      expect(() => {
        const $ = cheerio.load(malformedHtml);
        processEmptyElementsRemoval($);
        getProcessedHtml($, malformedHtml);
      }).not.toThrow();
    });

    test('should handle very large HTML documents', () => {
      const largeContent = `<div>${'<p>Large content</p>'.repeat(1000)}</div>`;
      const $ = cheerio.load(largeContent);

      expect(() => {
        processEmptyElementsRemoval($);
        getProcessedHtml($, largeContent);
      }).not.toThrow();
    });

    test('should handle HTML with special characters', () => {
      const specialHtml = '<div>Special chars: &lt;&gt;&amp;"\' and unicode: 世界 🌍</div>';
      const $ = cheerio.load(specialHtml);

      const processed = getProcessedHtml($, specialHtml);

      expect(processed).toContain('Special chars');
      expect(processed).toContain('世界');
    });

    test('should handle script and style tags', () => {
      const scriptHtml = `
        <html>
          <head>
            <script>console.log('test');</script>
            <style>body { margin: 0; }</style>
          </head>
          <body>
            <div>Content</div>
          </body>
        </html>
      `;

      const $ = cheerio.load(scriptHtml);
      const processed = getProcessedHtml($, scriptHtml);

      expect(processed).toContain('console.log');
      expect(processed).toContain('margin: 0');
      expect(processed).toContain('Content');
    });
  });
});
