/**
 * Unit tests for Element Utilities - Element Info Creation
 * Tests for createElementInfo function
 */

import { test, expect, describe } from 'bun:test';
import * as cheerio from 'cheerio';
import { createElementInfo } from '../../../src/core/element-utils';
import type { ElementInfo } from '../../../src/types';

describe('createElementInfo - Basic Elements', () => {
  test('TC-EU-301-01 [P0]: should create element info from simple element', () => {
    const html = '<div class="test" id="example">Hello World</div>';
    const $ = cheerio.load(html);
    const element = $('div').get(0);

    const _result = createElementInfo(element, $);

    expect(_result.tagName).toBe('div');
    expect(_result.text).toBe('Hello World');
    expect(_result.attributes).toEqual({
      class: 'test',
      id: 'example',
    });
    expect(_result.children).toEqual([]);
    expect(_result.parent).toBeUndefined();
  });

  test('TC-EU-301-03 [P1]: should handle element without attributes', () => {
    const html = '<p>Simple paragraph</p>';
    const $ = cheerio.load(html);
    const element = $('p')[0];

    const _result = createElementInfo(element, $);

    expect(_result.tagName).toBe('p');
    expect(_result.text).toBe('Simple paragraph');
    expect(_result.attributes).toEqual({});
  });
});

describe('createElementInfo - Complex Attributes', () => {
  test('TC-EU-301-02 [P1]: should create element info with parent', () => {
    const html = '<div class="parent"><span class="child">Child content</span></div>';
    const $ = cheerio.load(html);
    const childElement = $('span')[0];
    const parentInfo: ElementInfo = {
      tagName: 'div',
      text: 'Child content',
      attributes: { class: 'parent' },
      children: [],
    };

    const _result = createElementInfo(childElement, $, parentInfo);

    expect(_result.tagName).toBe('span');
    expect(_result.text).toBe('Child content');
    expect(_result.attributes).toEqual({ class: 'child' });
    expect(_result.parent).toBe(parentInfo);
  });

  test('TC-EU-301-04 [P1]: should handle element with complex attributes', () => {
    const html =
      '<img src="image.jpg" alt="Test Image" data-id="123" style="border: 1px solid red">';
    const $ = cheerio.load(html);
    const element = $('img')[0];

    const _result = createElementInfo(element, $);

    expect(_result.tagName).toBe('img');
    expect(_result.attributes).toEqual({
      src: 'image.jpg',
      alt: 'Test Image',
      'data-id': '123',
      style: 'border: 1px solid red',
    });
  });
});

describe('createElementInfo - Edge Cases', () => {
  test('TC-EU-301-05 [P2]: should handle empty element', () => {
    const html = '<div></div>';
    const $ = cheerio.load(html);
    const element = $('div').get(0);

    const _result = createElementInfo(element, $);

    expect(_result.tagName).toBe('div');
    expect(_result.text).toBe('');
    expect(_result.attributes).toEqual({});
  });

  test('TC-EU-301-06 [P2]: should handle element with whitespace text', () => {
    const html = '<span>   \n\t  </span>';
    const $ = cheerio.load(html);
    const element = $('span')[0];

    const _result = createElementInfo(element, $);

    expect(_result.tagName).toBe('span');
    expect(_result.text).toBe(''); // Should be trimmed
  });

  test('TC-EU-301-07 [P2]: should handle element with nested HTML content', () => {
    const html = '<div><strong>Bold</strong> and <em>italic</em> text</div>';
    const $ = cheerio.load(html);
    const element = $('div').get(0);

    const _result = createElementInfo(element, $);

    expect(_result.tagName).toBe('div');
    expect(_result.text).toBe('Bold and italic text');
  });

  test('TC-EU-301-08 [P2]: should handle malformed element gracefully', () => {
    const html = '<p>Unclosed paragraph';
    const $ = cheerio.load(html);
    const element = $('p')[0];

    const _result = createElementInfo(element, $);

    expect(_result.tagName).toBe('p');
    expect(_result.text).toBe('Unclosed paragraph');
  });
});
