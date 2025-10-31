/**
 * Unit tests for Types Module - Element Types
 * Tests for ElementInfo, ParseOptions and related element parsing type definitions
 */

import { test, expect, describe } from 'bun:test';
import type {
  ElementInfo,
  ParseOptions,
  DataTransform,
  DataFilter,
  ExtractionContext,
} from '../../../src/types';

// Helper functions moved to outer scope to fix function scoping
const createCompleteElement = (): ElementInfo => ({
  tagName: 'DIV',
  text: 'Main content text',
  textContent: 'Main content text',
  innerHTML: '<div id="main-content" class="content main article">Main content text</div>',
  attributes: {
    'data-id': '123',
    role: 'main',
    'aria-label': 'Main content',
    id: 'main-content',
    class: 'content main article',
  },
  children: [
    {
      tagName: 'P',
      text: 'Child paragraph',
      textContent: 'Child paragraph',
      innerHTML: 'Child paragraph',
      attributes: {},
      children: [],
    },
  ],
});

const createCompleteParseOptions = (): ParseOptions => ({
  preserveWhitespace: true,
  normalizeWhitespace: true,
  decodeEntities: true,
  replaceInvalidEntities: true,
});

describe('ElementInfo', () => {
  test('should represent complete element information', () => {
    // Given: Complete element information
    const element = createCompleteElement();

    // Then: Should have complete element information
    expect(element.tagName).toBe('DIV');
    expect(element.textContent).toBe('Main content text');
    expect(element.innerHTML).toContain('<div id="main-content"');
    expect(element.attributes['data-id']).toBe('123');
    expect(element.attributes.id).toBe('main-content');
    expect(element.children).toHaveLength(1);
  });

  test('should handle minimal element information', () => {
    // Given: Minimal element information
    const element: ElementInfo = {
      tagName: 'SPAN',
      text: 'Simple text',
      textContent: 'Simple text',
      innerHTML: 'Simple text',
      attributes: {},
      children: [],
    };

    // Then: Should accept minimal information
    expect(element.tagName).toBe('SPAN');
    expect(element.text).toBe('Simple text');
    expect(element.textContent).toBe('Simple text');
    expect(element.innerHTML).toBe('Simple text');
    expect(element.attributes).toEqual({});
    expect(element.children).toEqual([]);
  });

  test('should handle element without text content', () => {
    // Given: Element without text content
    const element: ElementInfo = {
      tagName: 'IMG',
      text: '',
      textContent: '',
      innerHTML: '<img>',
      attributes: {
        src: 'image.jpg',
        alt: 'Description',
      },
      children: [],
    };

    // Then: Should handle empty text
    expect(element.tagName).toBe('IMG');
    expect(element.text).toBe('');
    expect(element.textContent).toBe('');
    expect(element.innerHTML).toBe('<img>');
    expect(element.attributes?.src).toBe('image.jpg');
    expect(element.attributes?.alt).toBe('Description');
    expect(element.children).toEqual([]);
  });

  test('should handle nested elements', () => {
    // Given: Nested element structure
    const element: ElementInfo = {
      tagName: 'UL',
      text: 'List content',
      textContent: 'List content',
      innerHTML: '<ul><li>Item 1</li><li>Item 2</li></ul>',
      attributes: {
        class: 'list',
      },
      children: [
        {
          tagName: 'LI',
          text: 'Item 1',
          textContent: 'Item 1',
          innerHTML: 'Item 1',
          attributes: {},
          children: [],
        },
        {
          tagName: 'LI',
          text: 'Item 2',
          textContent: 'Item 2',
          innerHTML: 'Item 2',
          attributes: {},
          children: [],
        },
      ],
    };

    // Then: Should handle nesting
    expect(element.tagName).toBe('UL');
    expect(element.text).toBe('List content');
    expect(element.textContent).toBe('List content');
    expect(element.innerHTML).toBe('<ul><li>Item 1</li><li>Item 2</li></ul>');
    expect(element.attributes?.class).toBe('list');
    expect(element.children).toHaveLength(2);
    expect(element.children[0]?.tagName).toBe('LI');
    expect(element.children[0]?.textContent).toBe('Item 1');
  });
});

describe('ParseOptions', () => {
  test('should represent complete parsing options', () => {
    // Given: Complete parsing options
    const options = createCompleteParseOptions();

    // Then: Should have complete options
    expect(options.preserveWhitespace).toBe(true);
    expect(options.normalizeWhitespace).toBe(true);
    expect(options.decodeEntities).toBe(true);
    expect(options.replaceInvalidEntities).toBe(true);
  });

  test('should handle minimal parsing options', () => {
    // Given: Minimal parsing options
    const options: ParseOptions = {
      normalizeWhitespace: true,
    };

    // Then: Should accept minimal options
    expect(options.normalizeWhitespace).toBe(true);
    expect(options.preserveWhitespace).toBeUndefined();
    expect(options.decodeEntities).toBeUndefined();
  });

  test('should accept empty parse options', () => {
    // Given: Empty parse options
    const options: ParseOptions = {};

    // Then: Should accept empty options
    expect(Object.keys(options)).toHaveLength(0);
  });
});

describe('DataTransform', () => {
  test('should represent data transformation function', () => {
    // Given: A data transformation function
    const transform: DataTransform = (value: string, _context: ExtractionContext): string => {
      return value.toUpperCase();
    };

    // Then: Should apply transformation
    const context: ExtractionContext = {
      url: 'https://example.com',
      timestamp: new Date(),
    };
    const _result = transform('hello world', context);
    expect(_result).toBe('HELLO WORLD');
  });

  test('should handle complex transformations', () => {
    // Given: Complex data transformation
    const transform: DataTransform = (
      value: string,
      _context: ExtractionContext
    ): string | number => {
      if (/^\d+$/.test(value)) {
        return Number.parseInt(value, 10);
      }
      return `Processed: ${value}`;
    };

    // Then: Should handle different transformations
    const context: ExtractionContext = {
      url: 'https://example.com',
      timestamp: new Date(),
    };

    const stringResult = transform('hello', context);
    expect(stringResult).toBe('Processed: hello');

    const numberResult = transform('123', context);
    expect(numberResult).toBe(123);
  });
});

describe('DataFilter', () => {
  test('should represent data filtering function', () => {
    // Given: A data filter function
    const filter: DataFilter = (
      value: string | number | boolean,
      _context: ExtractionContext
    ): boolean => {
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      if (typeof value === 'number') {
        return value > 0;
      }
      return value === true;
    };

    // Then: Should apply filter
    const context: ExtractionContext = {
      url: 'https://example.com',
      timestamp: new Date(),
    };

    expect(filter('hello', context)).toBe(true);
    expect(filter('', context)).toBe(false);
    expect(filter(10, context)).toBe(true);
    expect(filter(0, context)).toBe(false);
    expect(filter(true, context)).toBe(true);
    expect(filter(false, context)).toBe(false);
  });

  test('should support custom filter logic', () => {
    // Given: Custom filter logic with context awareness
    const filter: DataFilter = (
      value: string | number | boolean,
      _context: ExtractionContext
    ): boolean => {
      if (typeof value === 'string') {
        return value.includes(context.url) || value.length > 10;
      }
      return false;
    };

    // Then: Should apply custom logic
    const context: ExtractionContext = {
      url: 'example.com',
      timestamp: new Date(),
    };

    expect(filter('https://example.com/page', context)).toBe(true);
    expect(filter('short', context)).toBe(false);
    expect(filter('this is a long enough string', context)).toBe(true);
    expect(filter(123, context)).toBe(false);
  });
});
