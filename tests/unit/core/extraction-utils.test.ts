import { test, expect } from 'bun:test';
import {
  extractTextContent,
  extractAttributeContent,
  extractFirstAvailableAttribute,
  normalizeValue,
  filterEmptyData,
  type ParseResult,
} from '../../../src/core/extraction-utils';

// Mock test data
const mockParseResult: ParseResult = {
  count: 1,
  text: '  Sample text content  ',
  matches: {
    attr: (_attributeName: string) => {
      const attributes: Record<string, string> = {
        href: 'https://example.com',
        class: 'sample-class',
        id: 'sample-id',
        'data-value': 'test-value',
        title: 'Sample Title',
      };
      return attributes[_attributeName];
    },
    0: {
      attribs: {
        href: 'https://example.com',
        class: 'sample-class',
        id: 'sample-id',
        'data-value': 'test-value',
        title: 'Sample Title',
        empty: '',
        whitespace: '   ',
      },
    },
    1: {
      attribs: {
        src: 'image.jpg',
        alt: 'Sample Image',
      },
    },
  },
};

const mockParseResultWithNoAttributes: ParseResult = {
  count: 1,
  text: 'Text without attributes',
  matches: {
    attr: (_attributeName: string) => '',
    0: {
      attribs: {},
    },
  },
};

const mockParseResultWithEmptyAttributes: ParseResult = {
  count: 1,
  text: 'Text with empty attributes',
  matches: {
    attr: (_attributeName: string) => {
      const attributes: Record<string, string | null | undefined> = {
        empty: '',
        whitespace: '   ',
        null: null,
        undefined: undefined as any,
      };
      return attributes[_attributeName] as string | undefined;
    },
    0: {
      attribs: {
        empty: '',
        whitespace: '   ',
        null: null as any,
        undefined: undefined as any,
      },
    },
  },
};

test('TC-EU-101-01 [P0]: extractTextContent should trim whitespace from text', () => {
  const _result = extractTextContent(mockParseResult);
  expect(_result).toBe('Sample text content');
});

test('TC-EU-101-02 [P1]: extractTextContent should handle empty text', () => {
  const emptyResult: ParseResult = {
    ...mockParseResult,
    text: '   ',
  };
  const _result = extractTextContent(emptyResult);
  expect(_result).toBe('');
});

test('TC-EU-101-03 [P1]: extractTextContent should handle text with only whitespace', () => {
  const whitespaceResult: ParseResult = {
    ...mockParseResult,
    text: '\t\n  \n\t',
  };
  const _result = extractTextContent(whitespaceResult);
  expect(_result).toBe('');
});

test('TC-EU-102-01 [P0]: extractAttributeContent should return attribute value when it exists', () => {
  const _result = extractAttributeContent(mockParseResult, 'href');
  expect(_result).toBe('https://example.com');
});

test('TC-EU-102-02 [P0]: extractAttributeContent should return empty string when attribute does not exist', () => {
  const _result = extractAttributeContent(mockParseResult, 'nonexistent');
  expect(_result).toBe('');
});

test('TC-EU-102-03 [P1]: extractAttributeContent should handle data attributes', () => {
  const _result = extractAttributeContent(mockParseResult, 'data-value');
  expect(_result).toBe('test-value');
});

test('TC-EU-103-01 [P0]: extractFirstAvailableAttribute should return first non-empty attribute', () => {
  const _result = extractFirstAvailableAttribute(mockParseResult);
  expect(_result).toBe('https://example.com');
});

test('TC-EU-103-02 [P1]: extractFirstAvailableAttribute should skip empty attributes', () => {
  const _result = extractFirstAvailableAttribute(mockParseResultWithEmptyAttributes);
  expect(_result).toBe('');
});

test('TC-EU-103-03 [P1]: extractFirstAvailableAttribute should return empty string when no attributes exist', () => {
  const _result = extractFirstAvailableAttribute(mockParseResultWithNoAttributes);
  expect(_result).toBe('');
});

test('TC-EU-103-04 [P1]: extractFirstAvailableAttribute should handle element without attribs property', () => {
  const resultWithoutAttribs: ParseResult = {
    count: 1,
    text: 'Text',
    matches: {
      attr: (_attributeName: string) => '',
      0: {},
    },
  };
  const _result = extractFirstAvailableAttribute(resultWithoutAttribs);
  expect(_result).toBe('');
});

test('TC-EU-103-05 [P2]: extractFirstAvailableAttribute should handle null element', () => {
  const resultWithNullElement: ParseResult = {
    count: 0,
    text: '',
    matches: {
      attr: (_attributeName: string) => '',
    },
  };
  const _result = extractFirstAvailableAttribute(resultWithNullElement);
  expect(_result).toBe('');
});

test('TC-EU-104-01 [P0]: normalizeValue should preserve non-string values', () => {
  expect(normalizeValue(42)).toBe(42);
  expect(normalizeValue(true)).toBe(true);
  expect(normalizeValue(false)).toBe(false);
  expect(normalizeValue(null)).toBe(null);
  expect(normalizeValue(undefined as unknown)).toBe(undefined);
  expect(normalizeValue({})).toStrictEqual({});
  expect(normalizeValue([])).toStrictEqual([]);
});

test('TC-EU-104-02 [P0]: normalizeValue should trim strings', () => {
  expect(normalizeValue('  hello world  ')).toBe('hello world');
  expect(normalizeValue('\t\n  test  \n\t')).toBe('test');
});

test('TC-EU-104-03 [P0]: normalizeValue should convert numeric strings to numbers', () => {
  expect(normalizeValue('42')).toBe(42);
  expect(normalizeValue('3.14')).toBe(3.14);
  expect(normalizeValue('-10')).toBe(-10);
  expect(normalizeValue('0')).toBe(0);
});

test('TC-EU-104-04 [P0]: normalizeValue should convert boolean strings to booleans', () => {
  expect(normalizeValue('true')).toBe(true);
  expect(normalizeValue('false')).toBe(false);
  expect(normalizeValue('TRUE')).toBe(true);
  expect(normalizeValue('FALSE')).toBe(false);
  expect(normalizeValue('True')).toBe(true);
  expect(normalizeValue('False')).toBe(false);
});

test('TC-EU-104-05 [P1]: normalizeValue should preserve empty strings', () => {
  expect(normalizeValue('')).toBe('');
  expect(normalizeValue('   ')).toBe(''); // whitespace gets trimmed
  expect(normalizeValue('\t\n')).toBe(''); // whitespace gets trimmed
});

test('TC-EU-104-06 [P1]: normalizeValue should handle non-numeric strings', () => {
  expect(normalizeValue('not a number')).toBe('not a number');
  expect(normalizeValue('123abc')).toBe('123abc');
  expect(normalizeValue('abc123')).toBe('abc123');
});

test('TC-EU-104-07 [P1]: normalizeValue should handle special number values', () => {
  expect(normalizeValue('NaN')).toBe('NaN');
  expect(normalizeValue('Infinity')).toBe('Infinity');
  expect(normalizeValue('-Infinity')).toBe('-Infinity');
});

test('TC-EU-104-08 [P2]: normalizeValue should handle edge case numeric strings', () => {
  expect(normalizeValue('0x10')).toBe(16); // hexadecimal
  expect(normalizeValue('1e5')).toBe(100000); // scientific notation
  expect(normalizeValue('.5')).toBe(0.5); // decimal without leading zero
});

test('TC-EU-105-01 [P0]: filterEmptyData should filter empty values from arrays', () => {
  const data = ['valid', '', null, undefined, '   ', 0, false, { key: 'value' }, []];
  const _result = filterEmptyData(data);
  expect(_result).toEqual([
    'valid',
    '   ', // whitespace not considered empty
    0,
    false,
    { key: 'value' },
  ]);
});

test('TC-EU-105-02 [P0]: filterEmptyData should filter empty values from objects', () => {
  const data = {
    valid: 'value',
    empty: '',
    null: null,
    undefined: undefined as any,
    whitespace: '   ',
    zero: 0,
    false: false,
    nested: { key: 'value' },
    emptyArray: [],
  };
  const _result = filterEmptyData(data);
  expect(_result).toEqual({
    valid: 'value',
    whitespace: '   ', // whitespace preserved in objects
    zero: 0,
    false: false,
    nested: { key: 'value' },
    emptyArray: [],
  });
});

test('TC-EU-105-03 [P1]: filterEmptyData should handle arrays with objects', () => {
  const data = [
    { name: 'John', age: 30 },
    { name: '', age: 0 },
    { name: 'Jane', age: null },
    null,
    undefined,
    '',
    { name: 'Bob' },
  ];
  const _result = filterEmptyData(data);
  expect(_result).toEqual([
    { name: 'John', age: 30 },
    { name: '', age: 0 }, // has valid age, empty name preserved in object
    { name: 'Jane', age: null }, // has name, null age preserved in object
    { name: 'Bob' },
  ]);
});

test('TC-EU-105-04 [P1]: filterEmptyData should handle nested empty objects', () => {
  const data = [
    { name: 'John', details: { age: 30, city: '' } },
    { name: 'Jane', details: { age: null, city: undefined } },
    { name: 'Bob', details: {} },
  ];
  const _result = filterEmptyData(data);
  expect(_result).toEqual([
    { name: 'John', details: { age: 30, city: '' } }, // has valid age
    { name: 'Jane', details: { age: null, city: undefined } }, // has name, details preserved
    { name: 'Bob', details: {} }, // empty object still counts as having structure
  ]);
});

test('TC-EU-105-05 [P1]: filterEmptyData should return primitive values unchanged', () => {
  expect(filterEmptyData('string')).toBe('string');
  expect(filterEmptyData(42)).toBe(42);
  expect(filterEmptyData(true)).toBe(true);
  expect(filterEmptyData(false)).toBe(false);
  expect(filterEmptyData(null)).toBe(null);
  expect(filterEmptyData(undefined as unknown)).toBe(undefined);
});

test('TC-EU-106-01 [P2]: extractTextContent should handle various unicode whitespace', () => {
  const unicodeResult: ParseResult = {
    ...mockParseResult,
    text: '\u00A0\u2000\u2001text\u2002\u2003',
  };
  const _result = extractTextContent(unicodeResult);
  expect(_result).toBe('text'); // Unicode whitespace gets trimmed by standard trim()
});

test('TC-EU-107-01 [P2]: extractFirstAvailableAttribute should handle attributes with various falsy values', () => {
  const resultWithFalsyValues: ParseResult = {
    count: 1,
    text: 'Text',
    matches: {
      attr: (_attributeName: string) => {
        const attributes: Record<string, string | null | undefined> = {
          zero: '0',
          false: 'false',
          empty: '',
          valid: 'value',
          null: null,
          undefined: undefined as any,
        };
        return attributes[_attributeName] as string | undefined;
      },
      0: {
        attribs: {
          zero: '0',
          false: 'false',
          empty: '',
          valid: 'value',
          null: null as any,
          undefined: undefined as any,
        },
      },
    },
  };
  const _result = extractFirstAvailableAttribute(resultWithFalsyValues);
  expect(_result).toBe('0'); // '0' is truthy after trim()
});

test('TC-EU-108-01 [P2]: normalizeValue should handle scientific notation edge cases', () => {
  expect(normalizeValue('1.7976931348623157e+308')).toBe(Number.MAX_VALUE);
  expect(normalizeValue('5e-324')).toBe(Number.MIN_VALUE);
  expect(normalizeValue('-1.7976931348623157e+308')).toBe(-Number.MAX_VALUE);
});

test('TC-EU-109-01 [P2]: filterEmptyData should handle Date objects', () => {
  const data = {
    validDate: new Date('2024-01-01'),
    invalidDate: new Date(''),
    nullDate: null,
    stringDate: '2024-01-01',
    emptyString: '',
  };
  const _result = filterEmptyData(data);
  expect(_result).toEqual({
    validDate: data.validDate,
    invalidDate: data.invalidDate, // Date object preserved even if invalid
    stringDate: '2024-01-01',
  });
});
