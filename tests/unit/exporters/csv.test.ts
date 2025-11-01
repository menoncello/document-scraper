import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { exportToCsv, validateCsvData } from '../../../src/exporters/csv.js';

// Mock file system operations
const mockWriteFile = mock();
const mockMkdir = mock();

mock.module('node:fs/promises', () => ({
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
}));

describe('TC-EXP-002: CSV Exporter', () => {
  beforeEach(() => {
    mockWriteFile.mockClear();
    mockMkdir.mockClear();
  });

  it('P0: should export simple array of objects to CSV', async () => {
    // Arrange
    const data = [
      { name: 'John', age: 30, city: 'New York' },
      { name: 'Jane', age: 25, city: 'London' },
    ];

    // Act
    await exportToCsv(data, 'test.csv');

    // Assert
    expect(mockMkdir).toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('test.csv'),
      expect.stringContaining('name,age,city\nJohn,30,New York\nJane,25,London'),
      'utf8'
    );
  });

  it('P0: should include headers by default', async () => {
    // Arrange
    const data = [{ id: 1, title: 'Test' }];

    // Act
    await exportToCsv(data, 'with-headers.csv');

    // Assert
    const output = mockWriteFile.mock.calls[0][1] as string;
    expect(output).toContain('id,title');
    expect(output.split('\n')[0]).toBe('id,title');
  });

  it('P0: should exclude headers when option is disabled', async () => {
    // Arrange
    const data = [{ id: 1, title: 'Test' }];

    // Act
    await exportToCsv(data, 'no-headers.csv', { includeHeaders: false });

    // Assert
    const output = mockWriteFile.mock.calls[0][1] as string;
    expect(output).not.toContain('id,title');
    expect(output).toContain('1,Test');
  });

  it('P0: should wrap non-array data in array', async () => {
    // Arrange
    const data = { name: 'Single', age: 25 };

    // Act
    await exportToCsv(data, 'single.csv');

    // Assert
    const output = mockWriteFile.mock.calls[0][1] as string;
    expect(output).toContain('name,age\nSingle,25');
  });

  it('P1: should handle special characters and escaping', async () => {
    // Arrange
    const data = [
      { name: 'John "The Man" Doe', description: 'Loves, commas, and "quotes"' },
      { name: 'Multi\nLine\nName', age: 30 },
    ];

    // Act
    await exportToCsv(data, 'special-chars.csv');

    // Assert
    const output = mockWriteFile.mock.calls[0][1] as string;
    expect(output).toContain('"John ""The Man"" Doe"');
    expect(output).toContain('"Loves, commas, and ""quotes"""');
    expect(output).toContain('"Multi\nLine\nName"');
  });

  it('P1: should handle custom delimiter', async () => {
    // Arrange
    const data = [{ col1: 'A', col2: 'B' }];

    // Act
    await exportToCsv(data, 'semicolon.csv', { delimiter: ';' });

    // Assert
    const output = mockWriteFile.mock.calls[0][1] as string;
    expect(output).toContain('col1;col2');
    expect(output).toContain('A;B');
  });

  it('P1: should handle nested objects with dot notation', async () => {
    // Arrange
    const data = [
      {
        name: 'John',
        address: {
          street: '123 Main St',
          city: 'New York',
          zip: '10001',
        },
      },
    ];

    // Act
    await exportToCsv(data, 'nested.csv');

    // Assert
    const output = mockWriteFile.mock.calls[0][1] as string;
    expect(output).toContain('name,address.street,address.city,address.zip');
    expect(output).toContain('John,123 Main St,New York,10001');
  });

  it('P1: should handle arrays by converting to JSON', async () => {
    // Arrange
    const data = [{ name: 'John', tags: ['developer', 'javascript'] }];

    // Act
    await exportToCsv(data, 'arrays.csv');

    // Assert
    const output = mockWriteFile.mock.calls[0][1] as string;
    expect(output).toContain('name,tags');
    expect(output).toContain('John,"[""developer"",""javascript""]"');
  });

  it('P1: should handle null and undefined values', async () => {
    // Arrange
    const data = [{ name: 'John', age: null, email: undefined, phone: '123-456-7890' }];

    // Act
    await exportToCsv(data, 'null-values.csv');

    // Assert
    const output = mockWriteFile.mock.calls[0][1] as string;
    expect(output).toContain('name,age,email,phone');
    expect(output).toContain('John,,,123-456-7890');
  });

  it('P1: should format dates correctly', async () => {
    // Arrange
    const data = [
      {
        name: 'John',
        created: new Date('2023-01-01T12:00:00Z'),
        lastLogin: new Date('2023-12-31T23:59:59Z'),
      },
    ];

    // Act
    await exportToCsv(data, 'dates.csv');

    // Assert
    const output = mockWriteFile.mock.calls[0][1] as string;
    expect(output).toContain('2023-01-01 12:00:00');
    expect(output).toContain('2023-12-31 23:59:59');
  });

  it('P2: should handle BigInt values', async () => {
    // Arrange
    const data = [{ id: BigInt(123), name: 'Test' }];

    // Act
    await exportToCsv(data, 'bigint.csv');

    // Assert
    const output = mockWriteFile.mock.calls[0][1] as string;
    expect(output).toContain('123,Test');
  });

  it('P2: should throw error for empty array', async () => {
    // Arrange
    const data = [];

    // Act & Assert
    await expect(exportToCsv(data, 'empty.csv')).rejects.toThrow('No data to export');
  });

  describe('validateCsvData', () => {
    it('P0: should validate array data', () => {
      expect(validateCsvData([{ a: 1 }]).isValid).toBe(true);
      expect(validateCsvData([]).isValid).toBe(false);
    });

    it('P0: should accept non-array data (can be wrapped)', () => {
      expect(validateCsvData({ a: 1 }).isValid).toBe(true);
      expect(validateCsvData({ value: 'string' }).isValid).toBe(true);
    });

    it('P1: should reject null/undefined', () => {
      expect(validateCsvData(null).isValid).toBe(false);
      expect(validateCsvData().isValid).toBe(false);
    });

    it('P2: should provide error messages', () => {
      const result = validateCsvData([]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Empty array - no data to export');
    });
  });
});
