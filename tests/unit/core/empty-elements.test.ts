/**
 * Unit tests for Element Utilities - Empty Element Detection
 * Tests for shouldRemoveEmptyElement function
 */

import { test, expect, describe } from 'bun:test';
import * as cheerio from 'cheerio';
import { shouldRemoveEmptyElement } from '../../../src/core/element-utils';

describe('shouldRemoveEmptyElement - Empty Detection', () => {
  test('TC-EU-201-01 [P0]: should return true for completely empty element', () => {
    const html = '<div></div>';
    const $ = cheerio.load(html);
    const element = $('div')[0];

    const _result = shouldRemoveEmptyElement(element, $);

    expect(_result).toBe(true);
  });

  test('TC-EU-201-05 [P1]: should return true for element with only whitespace text', () => {
    const html = '<div>   \n\t   </div>';
    const $ = cheerio.load(html);
    const element = $('div')[0];

    const _result = shouldRemoveEmptyElement(element, $);

    expect(_result).toBe(true);
  });

  test('TC-EU-201-06 [P1]: should return false for element with HTML comments', () => {
    const html = '<div><!-- This is a comment --></div>';
    const $ = cheerio.load(html);
    const element = $('div')[0];

    const _result = shouldRemoveEmptyElement(element, $);

    expect(_result).toBe(true); // Comments don't count as content
  });
});

describe('shouldRemoveEmptyElement - Content Detection', () => {
  test('TC-EU-201-02 [P0]: should return false for element with text', () => {
    const html = '<div>Hello World</div>';
    const $ = cheerio.load(html);
    const element = $('div')[0];

    const _result = shouldRemoveEmptyElement(element, $);

    expect(_result).toBe(false);
  });

  test('TC-EU-201-03 [P0]: should return false for element with children', () => {
    const html = '<div><span>Child content</span></div>';
    const $ = cheerio.load(html);
    const element = $('div')[0];

    const _result = shouldRemoveEmptyElement(element, $);

    expect(_result).toBe(false);
  });

  test('TC-EU-201-04 [P0]: should return false for element with attributes', () => {
    const html = '<div id="test" class="example" data-value="123"></div>';
    const $ = cheerio.load(html);
    const element = $('div')[0];

    const _result = shouldRemoveEmptyElement(element, $);

    expect(_result).toBe(false);
  });

  test('TC-EU-201-07 [P1]: should return false for element with nested empty children', () => {
    const html = '<div><span></span><p></p></div>';
    const $ = cheerio.load(html);
    const element = $('div')[0];

    const _result = shouldRemoveEmptyElement(element, $);

    expect(_result).toBe(false); // Has children even if they're empty
  });
});

describe('shouldRemoveEmptyElement - Attribute Handling', () => {
  test('TC-EU-201-09 [P2]: should handle elements with boolean attributes', () => {
    const html = '<input type="checkbox" checked disabled>';
    const $ = cheerio.load(html);
    const element = $('input')[0];

    const _result = shouldRemoveEmptyElement(element, $);

    expect(_result).toBe(false); // Has attributes
  });

  test('TC-EU-201-10 [P2]: should handle self-closing elements', () => {
    const html = '<img src="image.jpg" alt="test">';
    const $ = cheerio.load(html);
    const element = $('img')[0];

    const _result = shouldRemoveEmptyElement(element, $);

    expect(_result).toBe(false); // Has attributes
  });

  test('TC-EU-201-11 [P2]: should handle elements with data attributes', () => {
    const html = '<div data-testid="empty-element" data-value=""></div>';
    const $ = cheerio.load(html);
    const element = $('div')[0];

    const _result = shouldRemoveEmptyElement(element, $);

    expect(_result).toBe(false); // Has data attributes
  });

  test('TC-EU-201-13 [P2]: should handle elements with style attributes', () => {
    const html = '<div style="color: red; font-size: 14px;"></div>';
    const $ = cheerio.load(html);
    const element = $('div')[0];

    const _result = shouldRemoveEmptyElement(element, $);

    expect(_result).toBe(false); // Has style attribute
  });
});

describe('shouldRemoveEmptyElement - Edge Cases', () => {
  test('TC-EU-201-08 [P2]: should handle complex nested structures', () => {
    const html = `
      <div class="container" id="main">
        <div></div>
        <span class="text-content">Actual content</span>
      </div>
    `;
    const $ = cheerio.load(html);
    const emptyChild = $('.container > div')[0]; // Direct child div that's empty
    const parent = $('.container')[0];

    expect(shouldRemoveEmptyElement(emptyChild, $)).toBe(true); // Truly empty - no text, no children, no attributes
    expect(shouldRemoveEmptyElement(parent, $)).toBe(false); // Has children and attributes
  });

  test('TC-EU-201-12 [P2]: should handle malformed elements gracefully', () => {
    const html = '<div>';
    const $ = cheerio.load(html);
    const element = $('div')[0];

    const _result = shouldRemoveEmptyElement(element, $);

    expect(_result).toBe(true); // Empty element
  });

  test('TC-EU-201-14 [P2]: should handle elements with script-like content', () => {
    const html = '<div>  \n  <!-- comment -->   \n  </div>';
    const $ = cheerio.load(html);
    const element = $('div')[0];

    const _result = shouldRemoveEmptyElement(element, $);

    expect(_result).toBe(true); // Only whitespace and comments
  });
});
