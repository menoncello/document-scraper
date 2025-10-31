/**
 * Unit tests for Element Utilities - Integration Tests
 * Tests for element utilities working together
 */

import { test, expect, describe } from 'bun:test';
import * as cheerio from 'cheerio';
import {
  extractDataAttributesFromObject,
  shouldRemoveEmptyElement,
  createElementInfo,
  type DomElement,
} from '../../../src/core/element-utils';

describe('Integration Tests - Complex HTML Analysis', () => {
  test('TC-EU-401-01 [P1]: should work together for complex HTML analysis', () => {
    const html = `
      <article class="post" data-id="123" data-category="tech">
        <h2>Article Title</h2>
        <div class="content">
          <p>Article content goes here</p>
          <div></div>
        </div>
        <div class="metadata" data-author="John Doe" data-date="2024-01-15"></div>
      </article>
    `;
    const $ = cheerio.load(html);

    // Test extractDataAttributesFromObject
    const articleElement = $('article')[0] as DomElement;
    const dataAttributes = extractDataAttributesFromObject(
      articleElement.attribs as Record<string, string>
    );
    expect(dataAttributes).toEqual({
      id: '123',
      category: 'tech',
    });

    // Test shouldRemoveEmptyElement
    const emptyDiv = $('.content div')[0]; // First (and only) div in content (the empty one)
    expect(shouldRemoveEmptyElement(emptyDiv, $)).toBe(true);

    const contentDiv = $('.content')[0];
    expect(shouldRemoveEmptyElement(contentDiv, $)).toBe(false);

    // Test createElementInfo
    const metadataDiv = $('.metadata')[0];
    const metadataInfo = createElementInfo(metadataDiv, $);
    expect(metadataInfo.tagName).toBe('div');
    expect(metadataInfo.attributes).toEqual({
      class: 'metadata',
      'data-author': 'John Doe',
      'data-date': '2024-01-15',
    });
  });
});

describe('Integration Tests - Edge Cases', () => {
  test('TC-EU-401-02 [P2]: should handle edge cases in combination', () => {
    const html = `
      <div data-empty-value="" data-null-value="null">
        <span></span>
        <p>   </p>
        <div id="with-content" data-test="value">Actual content</div>
      </div>
    `;
    const $ = cheerio.load(html);

    const container = $('div')[0] as DomElement;
    const dataAttributes = extractDataAttributesFromObject(
      container.attribs as Record<string, string>
    );
    expect(dataAttributes).toEqual({
      'empty-value': '',
      'null-value': 'null',
    });

    const emptySpan = $('span')[0];
    expect(shouldRemoveEmptyElement(emptySpan, $)).toBe(true);

    const emptyParagraph = $('p')[0];
    expect(shouldRemoveEmptyElement(emptyParagraph, $)).toBe(true);

    const contentDiv = $('#with-content')[0];
    expect(shouldRemoveEmptyElement(contentDiv, $)).toBe(false);

    const contentInfo = createElementInfo(contentDiv, $);
    expect(contentInfo.text).toBe('Actual content');
    expect(contentInfo.attributes).toEqual({
      id: 'with-content',
      'data-test': 'value',
    });
  });
});
