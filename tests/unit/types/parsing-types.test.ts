/**
 * Unit tests for Types Module - Parsing and Extraction Types
 * Tests for ParseOptions, ElementInfo, SelectorResult, ExtractionOptions, ExtractionContext
 */

import { test, expect, describe } from 'bun:test';
import type {
  ParseOptions,
  ElementInfo,
  SelectorResult,
  ExtractionOptions,
  ExtractionContext,
  DataTransform,
  DataFilter,
} from '@/types';

// Test factory functions moved to outer scope to fix function scoping issues
const createCompleteExtractionOptions = (): ExtractionOptions => ({
  multiple: true,
  transform: (value: string, _context: ExtractionContext) => value.toUpperCase(),
  filter: (value: string | number | boolean, _context: ExtractionContext) =>
    typeof value === 'string' && value.length > 0,
  preserveOrder: true,
});

const createCompleteContext = (): ExtractionContext => ({
  url: 'https://example.com',
  selector: 'article',
  timestamp: new Date('2023-01-01T12:00:00Z'),
});

const transform: DataTransform = (value: string, context: ExtractionContext) => {
  const transformed = value.trim().toLowerCase();
  return context.url.includes('test') ? `[TEST] ${transformed}` : transformed;
};

const filter: DataFilter = (value: string | number | boolean, _context: ExtractionContext) => {
  if (typeof value === 'number') {
    return value > 0;
  }
  if (typeof value === 'string') {
    return value.length > 5 && !value.includes('spam');
  }
  return false;
};

const createTransformAndFilter = () => ({ transform, filter });

const createTestContext = (): ExtractionContext => ({
  url: 'https://test.example.com',
  selector: 'article',
  timestamp: new Date('2023-01-01T12:00:00Z'),
});

describe('ParseOptions', () => {
  test('should accept complete parse options', () => {
    // Given: Complete HTML parsing options
    const options: ParseOptions = {
      preserveWhitespace: true,
      normalizeWhitespace: true,
    };

    // Then: Should accept complete options
    expect(options.preserveWhitespace).toBe(true);
    expect(options.normalizeWhitespace).toBe(true);
  });

  test('should accept minimal parse options', () => {
    // Given: Minimal parse options (all optional)
    const options: ParseOptions = {};

    // Then: Should accept empty options
    expect(Object.keys(options)).toHaveLength(0);
  });
});

describe('ElementInfo', () => {
  test('should accept element information structure', () => {
    // Given: Element information with nested children
    const elementInfo: ElementInfo = {
      tagName: 'div',
      text: 'Parent content',
      textContent: 'Parent content',
      innerHTML: '<p>Child content</p>',
      attributes: {
        id: 'test-div',
        class: 'container',
      },
      children: [
        {
          tagName: 'p',
          text: 'Child content',
          textContent: 'Child content',
          innerHTML: 'Child content',
          attributes: {},
          children: [],
        },
      ],
    };

    // Then: Should accept element structure
    expect(elementInfo.tagName).toBe('div');
    expect(elementInfo.text).toBe('Parent content');
    expect(elementInfo.attributes.id).toBe('test-div');
    expect(elementInfo.textContent).toBe('Parent content');
    expect(elementInfo.innerHTML).toBe('<p>Child content</p>');
    expect(elementInfo.attributes.class).toBe('container');
    expect(elementInfo.children).toHaveLength(1);
    expect(elementInfo.children[0].tagName).toBe('p');
  });

  test('should accept element without children', () => {
    // Given: Element without children
    const elementInfo: ElementInfo = {
      tagName: 'span',
      text: 'Simple text',
      textContent: 'Simple text',
      innerHTML: 'Simple text',
      attributes: {},
      children: [],
    };

    // Then: Should accept simple element
    expect(elementInfo.tagName).toBe('span');
    expect(elementInfo.text).toBe('Simple text');
    expect(elementInfo.textContent).toBe('Simple text');
    expect(elementInfo.innerHTML).toBe('Simple text');
    expect(elementInfo.attributes).toEqual({});
    expect(elementInfo.children).toHaveLength(0);
  });
});

describe('SelectorResult', () => {
  test('should accept selector result with elements', () => {
    // Given: A selector result with found elements
    const _result: SelectorResult = {
      elements: [
        {
          tagName: 'h1',
          text: 'Title 1',
          textContent: 'Title 1',
          innerHTML: 'Title 1',
          attributes: { class: 'title' },
          children: [],
        },
        {
          tagName: 'h1',
          text: 'Title 2',
          textContent: 'Title 2',
          innerHTML: 'Title 2',
          attributes: { class: 'title' },
          children: [],
        },
      ],
      count: 2,
      exists: true,
      found: true,
      data: ['Title 1', 'Title 2'],
      extractAttribute: (attributeName: string) =>
        attributeName === 'class' ? ['title', 'title'] : [],
    };

    // Then: Should accept selector result
    expect(_result.elements).toHaveLength(2);
    expect(_result.count).toBe(2);
    expect(_result.exists).toBe(true);
    expect(_result.found).toBe(true);
    expect(_result.data).toEqual(['Title 1', 'Title 2']);
    expect(_result.elements[0].textContent).toBe('Title 1');
    expect(typeof _result.extractAttribute).toBe('function');
  });

  test('should accept empty selector result', () => {
    // Given: A selector result with no elements found
    const _result: SelectorResult = {
      elements: [],
      count: 0,
      exists: false,
      found: false,
      data: null,
      extractAttribute: () => '',
    };

    // Then: Should accept empty result
    expect(_result.count).toBe(0);
    expect(_result.exists).toBe(false);
    expect(_result.found).toBe(false);
    expect(_result.data).toBeNull();
    expect(_result.elements).toHaveLength(0);
    expect(typeof _result.extractAttribute).toBe('function');
    expect(_result.extractAttribute('class')).toBe('');
  });
});

describe('ExtractionOptions', () => {
  test('should accept complete extraction options', () => {
    // Given: Complete extraction options with transform and filter functions
    const options = createCompleteExtractionOptions();

    // Then: Should accept complete options
    expect(options.multiple).toBe(true);
    expect(typeof options.transform).toBe('function');
    expect(typeof options.filter).toBe('function');
  });

  test('should accept minimal extraction options', () => {
    // Given: Minimal extraction options
    const options: ExtractionOptions = {};

    // Then: Should accept empty options
    expect(options.multiple).toBeUndefined();
  });
});

describe('ExtractionContext', () => {
  test('should accept extraction context', () => {
    // Given: An extraction context
    const context = createCompleteContext();

    // Then: Should accept context structure
    expect(context.url).toBe('https://example.com');
    expect(context.selector).toBe('article');
    expect(context.timestamp).toBeInstanceOf(Date);
  });

  test('should accept context without selector', () => {
    // Given: Context without selector
    const context: ExtractionContext = {
      url: 'https://example.com',
      timestamp: new Date(),
    };

    // Then: Should accept context without selector
    expect(context.url).toBe('https://example.com');
    expect(context.timestamp).toBeInstanceOf(Date);
    expect(context.selector).toBeUndefined();
  });
});

describe('DataTransform and DataFilter', () => {
  test('should accept data transform function', () => {
    // Given: A data transform function
    const { transform } = createTransformAndFilter();
    const context = createTestContext();

    // When: Applying transform
    const _result = transform('  Test Value  ', context);

    // Then: Should apply transformation correctly
    expect(_result).toBe('[TEST] test value');
  });

  test('should accept data filter function', () => {
    // Given: A data filter function
    const { filter } = createTransformAndFilter();
    const context = createTestContext();

    // Then: Should filter correctly
    expect(filter(10, context)).toBe(true);
    expect(filter(0, context)).toBe(false);
    expect(filter('valid content', context)).toBe(true);
    expect(filter('short', context)).toBe(false);
    expect(filter('spam content', context)).toBe(false);
  });
});
