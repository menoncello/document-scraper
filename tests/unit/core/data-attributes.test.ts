/**
 * Unit tests for Element Utilities - Data Attributes Extraction
 * Tests for extractDataAttributesFromObject function
 */

import { test, expect, describe } from 'bun:test';
import { extractDataAttributesFromObject } from '../../../src/core/element-utils';

describe('extractDataAttributesFromObject - Basic Functionality', () => {
  test('TC-EU-101-01 [P0]: should extract data attributes from object with data attributes', () => {
    const attributes = {
      id: 'test-id',
      class: 'test-class',
      'data-name': 'test-name',
      'data-value': '123',
      'data-boolean': 'true',
      href: 'https://example.com',
    };

    const _result = extractDataAttributesFromObject(attributes);

    expect(_result).toEqual({
      name: 'test-name',
      value: '123',
      boolean: 'true',
    });
  });

  test('TC-EU-101-02 [P1]: should return empty object when no data attributes exist', () => {
    const attributes = {
      id: 'test-id',
      class: 'test-class',
      href: 'https://example.com',
      src: 'image.jpg',
    };

    const _result = extractDataAttributesFromObject(attributes);

    expect(_result).toEqual({});
  });
});

describe('extractDataAttributesFromObject - Edge Cases', () => {
  test('TC-EU-101-03 [P1]: should handle empty attributes object', () => {
    const _result = extractDataAttributesFromObject({});

    expect(_result).toEqual({});
  });

  test('TC-EU-101-04 [P1]: should handle undefined attributes', () => {
    const _result = extractDataAttributesFromObject();

    expect(_result).toEqual({});
  });
});

describe('extractDataAttributesFromObject - Value Handling', () => {
  test('TC-EU-101-05 [P2]: should handle data attributes with undefined values', () => {
    const attributes = {
      'data-defined': 'defined-value',
      'data-undefined': undefined,
      'data-null': null,
      'data-empty': '',
    };

    const _result = extractDataAttributesFromObject(attributes);

    expect(_result).toEqual({
      defined: 'defined-value',
      undefined: undefined,
      null: null,
      empty: '',
    });
  });
});

describe('extractDataAttributesFromObject - Complex Attribute Names', () => {
  test('TC-EU-101-06 [P2]: should handle complex data attribute names', () => {
    const attributes = {
      'data-simple': 'simple',
      'data-with-hyphens': 'hyphenated',
      'data-with_underscores': 'underscored',
      'data-WITH-CAPS': 'uppercase',
      data123numeric: 'numeric-start',
      'data-123numeric': 'numeric-in-name',
    };

    const _result = extractDataAttributesFromObject(attributes);

    expect(_result).toEqual({
      simple: 'simple',
      'with-hyphens': 'hyphenated',
      with_underscores: 'underscored',
      'WITH-CAPS': 'uppercase',
      '123numeric': 'numeric-in-name',
    });
  });

  test('TC-EU-101-07 [P2]: should handle attributes with special characters', () => {
    const attributes = {
      'data-special-chars': '!@#$%^&*()',
      'data-unicode': '🚀 Unicode Test',
      'data-url-encoded': 'https%3A//example.com',
      'data-quotes': '"quoted" and \'single\'',
    };

    const _result = extractDataAttributesFromObject(attributes);

    expect(_result).toEqual({
      'special-chars': '!@#$%^&*()',
      unicode: '🚀 Unicode Test',
      'url-encoded': 'https%3A//example.com',
      quotes: '"quoted" and \'single\'',
    });
  });
});
