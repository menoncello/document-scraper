import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { format } from 'date-fns';

// Define proper TypeScript types instead of 'any'
export interface CsvRowData {
  [key: string]: unknown;
}

export type CsvData = CsvRowData[];
export interface CsvExportOptions {
  delimiter?: string;
  includeHeaders?: boolean;
  encoding?: BufferEncoding;
  dateFormat?: string;
}

/**
 * Export data to CSV format with proper formatting and validation
 * @param {CsvData | CsvRowData} data - The data to export, either an array of objects or a single object
 * @param {string} filePath - The file path where the CSV will be saved
 * @param {CsvExportOptions} options - Configuration options for CSV export
 * @returns {Promise<void>} Promise that resolves when the file is written successfully
 * @throws {Error} When file write fails or data is invalid
 */
export async function exportToCsv(
  data: CsvData | CsvRowData,
  filePath: string,
  options: CsvExportOptions = {}
): Promise<void> {
  const resolvedOptions = resolveExportOptions(options);
  const normalizedData = normalizeData(data);

  if (normalizedData.length === 0) {
    throw new Error('No data to export');
  }

  await ensureDirectoryExists(filePath);
  const headers = extractHeaders(normalizedData[0]);
  const csvContent = generateCsvContent(normalizedData, headers, resolvedOptions);
  await writeCsvFile(filePath, csvContent, resolvedOptions.encoding);
}

/**
 * Resolve export options with defaults
 * @param {CsvExportOptions} options - User provided options
 * @returns {Required<CsvExportOptions>} Resolved options with defaults
 */
function resolveExportOptions(options: CsvExportOptions): Required<CsvExportOptions> {
  return {
    delimiter: ',',
    includeHeaders: true,
    encoding: 'utf8',
    dateFormat: 'yyyy-MM-dd HH:mm:ss',
    ...options,
  };
}

/**
 * Normalize input data to array format
 * @param {CsvData | CsvRowData} data - Input data
 * @returns {CsvData} Normalized array of data
 */
function normalizeData(data: CsvData | CsvRowData): CsvData {
  return Array.isArray(data) ? data : [data];
}

/**
 * Ensure directory exists for the given file path
 * @param {string} filePath - File path to create directory for
 * @returns {Promise<void>} Promise that resolves when directory exists
 */
async function ensureDirectoryExists(filePath: string): Promise<void> {
  const absolutePath = resolve(filePath);
  const dir = dirname(absolutePath);
  await mkdir(dir, { recursive: true });
}

/**
 * Generate CSV content from data and headers
 * @param {CsvData} data - Array of data objects
 * @param {string[]} headers - CSV headers
 * @param {Required<CsvExportOptions>} options - Export options
 * @returns {string} Generated CSV content
 */
function generateCsvContent(
  data: CsvData,
  headers: string[],
  options: Required<CsvExportOptions>
): string {
  let csvContent = '';

  if (options.includeHeaders) {
    csvContent += `${headers.map(header => escapeCsvField(header)).join(options.delimiter)}\n`;
  }

  for (const row of data) {
    const rowData = headers.map(header => {
      const value = getNestedValue(row, header);
      return escapeCsvField(formatValue(value, options.dateFormat));
    });
    csvContent += `${rowData.join(options.delimiter)}\n`;
  }

  return csvContent;
}

/**
 * Write CSV content to file
 * @param {string} filePath - File path to write to
 * @param {string} content - CSV content to write
 * @param {BufferEncoding} encoding - File encoding
 * @returns {Promise<void>} Promise that resolves when file is written
 */
async function writeCsvFile(
  filePath: string,
  content: string,
  encoding: BufferEncoding
): Promise<void> {
  try {
    const absolutePath = resolve(filePath);
    await writeFile(absolutePath, content, encoding);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to export CSV to ${filePath}: ${errorMessage}`);
  }
}

/**
 * Extract all possible headers from data structure recursively
 * @param {CsvRowData} obj - Object to extract headers from
 * @param {string} prefix - Prefix for nested properties
 * @returns {string[]} Array of header names
 */
function extractHeaders(obj: CsvRowData, prefix = ''): string[] {
  const headers: string[] = [];

  if (obj === null || typeof obj !== 'object') {
    return headers;
  }

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    headers.push(...processHeaderValue(fullKey, value));
  }

  return headers;
}

/**
 * Process header value based on type
 * @param {string} fullKey - Full key path
 * @param {unknown} value - Value to process
 * @returns {string[]} Headers for this value
 */
function processHeaderValue(fullKey: string, value: unknown): string[] {
  if (Array.isArray(value)) {
    return processArrayValue(fullKey, value);
  }

  if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
    return extractHeaders(value as CsvRowData, fullKey);
  }

  return [fullKey];
}

/**
 * Process array values for header extraction
 * @param {string} fullKey - Full key path
 * @param {unknown[]} value - Array value
 * @returns {string[]} Headers for array value
 */
function processArrayValue(fullKey: string, value: unknown[]): string[] {
  if (value.length === 0) {
    return [fullKey];
  }

  if (typeof value[0] === 'object' && value[0] !== null) {
    return extractHeaders(value[0] as CsvRowData, fullKey);
  }

  return [fullKey];
}

/**
 * Get nested value from object using dot notation
 * @param {CsvRowData} obj - Object to get value from
 * @param {string} path - Dot notation path to the value
 * @returns {unknown} The value at the specified path or empty string if not found
 */
function getNestedValue(obj: CsvRowData, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && current !== null && key in current) {
      return (current as CsvRowData)[key];
    }
    return '';
  }, obj);
}

/**
 * Format value for CSV output based on type
 * @param {unknown} value - Value to format
 * @param {string} dateFormat - Date format string
 * @returns {string} Formatted value as string
 */
function formatValue(value: unknown, dateFormat: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return format(value, dateFormat);
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Escape CSV field to handle commas, quotes, and newlines
 * @param {unknown} field - Field value to escape
 * @returns {string} Escaped field value
 */
function escapeCsvField(field: unknown): string {
  if (field === null || field === undefined) {
    return '';
  }

  const str = String(field);

  // Check if field contains delimiter, quotes, or newlines
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Validate CSV export data and return validation result
 * @param {CsvData | CsvRowData | null | undefined} data - Data to validate
 * @returns {{ isValid: boolean; errors?: string[] }} Validation result with optional error messages
 */
export function validateCsvData(data?: CsvData | CsvRowData | null | undefined): {
  isValid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    if (data === null || data === undefined) {
      errors.push('No data to export');
    }
    // Non-array data can be wrapped in array, so this is acceptable
  } else if (data.length === 0) {
    errors.push('Empty array - no data to export');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
