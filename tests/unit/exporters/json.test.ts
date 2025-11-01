import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { exportToJson, validateJsonData, transformForJson } from '../../../src/exporters/json.js';

// Mock file system operations
const mockWriteFile = mock();
const mockMkdir = mock();

// Test helper function
const testFunction = () => 'value';

mock.module('node:fs/promises', () => ({
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
}));

describe('TC-EXP-001: JSON Exporter', () => {
  beforeEach(() => {
    mockWriteFile.mockClear();
    mockMkdir.mockClear();
  });

  it('P0: should export simple object to JSON with metadata', async () => {
    // Arrange
    const data = { title: 'Test', content: 'Test content' };
    const filePath = 'test.json';

    // Act
    await exportToJson(data, filePath);

    // Assert
    expect(mockMkdir).toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('test.json'),
      expect.stringContaining('"metadata"'),
      'utf8'
    );

    const exportedData = JSON.parse(mockWriteFile.mock.calls[0][1] as string);
    expect(exportedData).toHaveProperty('metadata');
    expect(exportedData).toHaveProperty('data', data);
    expect(exportedData.metadata).toHaveProperty('exportedAt');
    expect(exportedData.metadata).toHaveProperty('count', 1);
    expect(exportedData.metadata).toHaveProperty('format', 'json');
  });

  it('P0: should export array to JSON with metadata', async () => {
    // Arrange
    const data = [
      { id: 1, title: 'First' },
      { id: 2, title: 'Second' },
    ];
    const filePath = 'array.json';

    // Act
    await exportToJson(data, filePath);

    // Assert
    const exportedData = JSON.parse(mockWriteFile.mock.calls[0][1] as string);
    expect(exportedData.metadata.count).toBe(2);
    expect(exportedData.data).toEqual(data);
  });

  it('P0: should export without metadata when option is disabled', async () => {
    // Arrange
    const data = { title: 'Test' };
    const filePath = 'no-metadata.json';

    // Act
    await exportToJson(data, filePath, { includeMetadata: false });

    // Assert
    const exportedData = JSON.parse(mockWriteFile.mock.calls[0][1] as string);
    expect(exportedData).not.toHaveProperty('metadata');
    expect(exportedData).toEqual(data);
  });

  it('P1: should handle prettify option correctly', async () => {
    // Arrange
    const data = { title: 'Test' };
    const filePath = 'pretty.json';

    // Act
    await exportToJson(data, filePath, { prettify: true });

    // Assert
    const output = mockWriteFile.mock.calls[0][1] as string;
    expect(output).toContain('  "title"'); // Should contain indentation
    expect(output).toContain('\n'); // Should contain newlines
  });

  it('P1: should handle minified output', async () => {
    // Arrange
    const data = { title: 'Test' };
    const filePath = 'minified.json';

    // Act
    await exportToJson(data, filePath, { prettify: false });

    // Assert
    const output = mockWriteFile.mock.calls[0][1] as string;
    expect(output).toContain('"title":"Test"'); // Data should be included
    expect(output).not.toContain('\n'); // No newlines
    expect(output).not.toContain('  '); // No spaces
  });

  it('P2: should handle complex nested data', async () => {
    // Arrange
    const data = {
      user: {
        id: 1,
        name: 'John',
        roles: ['admin', 'user'],
        profile: {
          age: 30,
          active: true,
        },
      },
      posts: [
        { id: 1, title: 'Post 1' },
        { id: 2, title: 'Post 2' },
      ],
    };

    // Act
    await exportToJson(data, 'complex.json');

    // Assert
    const exportedData = JSON.parse(mockWriteFile.mock.calls[0][1] as string);
    expect(exportedData.data).toEqual(data);
    expect(exportedData.metadata.count).toBe(1); // It's a single object
  });

  describe('validateJsonData', () => {
    it('P0: should validate simple valid data', () => {
      expect(validateJsonData({ title: 'Test' }).isValid).toBe(true);
      expect(validateJsonData([1, 2, 3]).isValid).toBe(true);
      expect(validateJsonData('string').isValid).toBe(true);
      expect(validateJsonData(123).isValid).toBe(true);
      expect(validateJsonData(true).isValid).toBe(true);
      expect(validateJsonData(null).isValid).toBe(true);
    });

    it('P1: should detect circular references', () => {
      const data: any = { name: 'test' };
      data.self = data;

      const result = validateJsonData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data contains circular references');
    });

    it('P2: should handle edge cases', () => {
      // Functions are converted to undefined by JSON.stringify
      const result = validateJsonData(testFunction);
      expect(result.isValid).toBe(true); // Functions are actually handled by JSON.stringify
    });
  });

  describe('transformForJson', () => {
    it('P0: should handle basic types', () => {
      expect(transformForJson(null)).toBe(null);
      expect(transformForJson()).toBe(null);
      expect(transformForJson('string')).toBe('string');
      expect(transformForJson(123)).toBe(123);
      expect(transformForJson(true)).toBe(true);
    });

    it('P0: should convert dates to ISO strings', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      const result = transformForJson(date);
      expect(typeof result).toBe('string');
      expect(result).toContain('2023-01-01T00:00:00.000Z');
    });

    it('P0: should convert BigInt to string', () => {
      const bigInt = BigInt(123);
      const result = transformForJson(bigInt);
      expect(result).toBe('123');
    });

    it('P1: should handle arrays', () => {
      const data = [1, 'string', new Date('1970-01-01T00:00:00.000Z'), null];
      const result = transformForJson(data);
      expect(result).toEqual([1, 'string', '1970-01-01T00:00:00.000Z', null]);
    });

    it('P2: should skip functions', () => {
      const data = {
        name: 'test',
        getValue: testFunction,
        nested: {
          anotherFunc: testFunction,
        },
      };

      const result = transformForJson(data);
      expect(result).toEqual({
        name: 'test',
        nested: {},
      });
    });
  });
});
