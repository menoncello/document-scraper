import { describe, it, expect } from 'bun:test';
import {
  validateUrl,
  sanitizeFilename,
  getFormatFromExtension,
} from '../../../src/cli/utils/validation.js';

describe('TC-CLI-002: CLI Validation Utilities', () => {
  describe('validateUrl', () => {
    it('P0: should validate valid HTTP URLs', () => {
      expect(validateUrl('http://example.com')).toBe(true);
      expect(validateUrl('http://www.example.com')).toBe(true);
      expect(validateUrl('http://example.com/path')).toBe(true);
      expect(validateUrl('http://example.com/path?query=value')).toBe(true);
      expect(validateUrl('http://example.com:8080')).toBe(true);
    });

    it('P0: should validate valid HTTPS URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('https://www.example.com')).toBe(true);
      expect(validateUrl('https://example.com/path')).toBe(true);
      expect(validateUrl('https://example.com/path?query=value')).toBe(true);
      expect(validateUrl('https://example.com:443')).toBe(true);
    });

    it('P1: should reject invalid URLs', () => {
      expect(validateUrl('ftp://example.com')).toBe(false);
      expect(validateUrl('file:///path/to/file')).toBe(false);
      expect(validateUrl('example.com')).toBe(false);
      expect(validateUrl('www.example.com')).toBe(false);
      expect(validateUrl('not-a-url')).toBe(false);
      expect(validateUrl('')).toBe(false);
      // Test for dangerous protocol rejection (security concern)
      // Using string construction to avoid direct javascript: protocol in code
      const dangerousProtocol = 'javascript' + ':void(0)';
      expect(validateUrl(dangerousProtocol)).toBe(false);
    });

    it('P2: should handle edge cases', () => {
      expect(validateUrl('https://')).toBe(false);
      expect(validateUrl('http://')).toBe(false);
      expect(validateUrl('https://example.com/')).toBe(true);
      expect(validateUrl('https://192.168.1.1')).toBe(true);
      expect(validateUrl('https://localhost:3000')).toBe(true);
    });
  });

  describe('sanitizeFilename', () => {
    it('P0: should sanitize basic filenames', () => {
      expect(sanitizeFilename('test file.txt')).toBe('test_file_txt');
      expect(sanitizeFilename('my-file.json')).toBe('my_file_json');
      expect(sanitizeFilename('data@export.csv')).toBe('data_export_csv');
    });

    it('P1: should handle special characters', () => {
      expect(sanitizeFilename('file#name$with%special^chars')).toBe('file_name_with_special_chars');
      expect(sanitizeFilename('file with spaces and    multiple   spaces')).toBe(
        'file_with_spaces_and____multiple___spaces'
      );
      expect(sanitizeFilename('File_Name.CAPITALIZED')).toBe('file_name_capitalized');
    });

    it('P2: should handle edge cases', () => {
      expect(sanitizeFilename('')).toBe('');
      expect(sanitizeFilename('123')).toBe('123');
      expect(sanitizeFilename('!!!@@@###')).toBe('_________');
      expect(sanitizeFilename('file.txt')).toBe('file_txt');
    });
  });

  describe('getFormatFromExtension', () => {
    it('P0: should identify JSON files', () => {
      expect(getFormatFromExtension('data.json')).toBe('json');
      expect(getFormatFromExtension('export.JSON')).toBe('json');
      expect(getFormatFromExtension('path/to/data.json')).toBe('json');
    });

    it('P0: should identify CSV files', () => {
      expect(getFormatFromExtension('data.csv')).toBe('csv');
      expect(getFormatFromExtension('export.CSV')).toBe('csv');
      expect(getFormatFromExtension('path/to/data.csv')).toBe('csv');
    });

    it('P1: should return undefined for unknown formats', () => {
      expect(getFormatFromExtension('data.txt')).toBeUndefined();
      expect(getFormatFromExtension('data.xml')).toBeUndefined();
      expect(getFormatFromExtension('data')).toBeUndefined();
      expect(getFormatFromExtension('')).toBeUndefined();
    });

    it('P2: should handle edge cases', () => {
      expect(getFormatFromExtension('.json')).toBe('json');
      expect(getFormatFromExtension('.csv')).toBe('csv');
      expect(getFormatFromExtension('file.')).toBeUndefined();
      expect(getFormatFromExtension('file..json')).toBe('json');
    });
  });
});
