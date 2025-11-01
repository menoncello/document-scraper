import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { format } from 'date-fns';

const JSON_INDENTATION = 2;

// Special symbol to mark values that should be skipped
const SKIP_VALUE = Symbol('skip');

export interface JsonExportOptions {
  prettify?: boolean;
  includeMetadata?: boolean;
  encoding?: BufferEncoding;
}

export type JsonSerializableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | bigint
  | (() => unknown)
  | JsonSerializableValue[]
  | { [key: string]: JsonSerializableValue };

export interface JsonExportResult {
  metadata?: {
    exportedAt: string;
    count: number;
    format: string;
    version: string;
  };
  data: JsonSerializableValue;
}

/**
 * Prepares export data with optional metadata
 * @param {JsonSerializableValue} data - The original data
 * @param {boolean} includeMetadata - Whether to include metadata in the export
 * @returns {JsonExportResult | JsonSerializableValue} Prepared data for export
 */
function prepareExportData(
  data: JsonSerializableValue,
  includeMetadata: boolean
): JsonExportResult | JsonSerializableValue {
  return includeMetadata
    ? {
        metadata: {
          exportedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          count: Array.isArray(data) ? data.length : 1,
          format: 'json',
          version: '1.0',
        },
        data,
      }
    : data;
}

/**
 * Ensures the target directory exists
 * @param {string} filePath - The file path to ensure directory exists for
 */
async function ensureDirectoryExists(filePath: string): Promise<void> {
  const absolutePath = resolve(filePath);
  const dir = dirname(absolutePath);
  await mkdir(dir, { recursive: true });
}

/**
 * Export data to JSON format with optional metadata
 * @param {JsonSerializableValue} data - The data to export to JSON format
 * @param {string} filePath - The file path where the JSON will be saved
 * @param {JsonExportOptions} options - Configuration options for JSON export
 * @returns {Promise<void>} Promise that resolves when the export is complete
 */
export async function exportToJson(
  data: JsonSerializableValue,
  filePath: string,
  options: JsonExportOptions = {}
): Promise<void> {
  const { prettify = true, includeMetadata = true, encoding = 'utf8' } = options;

  try {
    await ensureDirectoryExists(filePath);
    const exportData = prepareExportData(data, includeMetadata);
    const jsonString = prettify
      ? JSON.stringify(exportData, null, JSON_INDENTATION)
      : JSON.stringify(exportData);

    const absolutePath = resolve(filePath);
    await writeFile(absolutePath, jsonString, encoding);
  } catch (error) {
    throw new Error(
      `Failed to export JSON to ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Detects circular references in an object
 * @param {JsonSerializableValue} obj - The object to check for circular references
 * @returns {boolean} True if circular reference is detected, false otherwise
 */
function detectCircular(obj: JsonSerializableValue): boolean {
  const seen = new WeakSet();

  return (function detectCircularInner(value: JsonSerializableValue): boolean {
    if (value && typeof value === 'object') {
      if (seen.has(value)) {
        return true;
      }
      seen.add(value);
      for (const key in value) {
        if (detectCircularInner(value[key])) {
          return true;
        }
      }
    }
    return false;
  })(obj);
}

/**
 * Validate JSON export data
 * @param {JsonSerializableValue} data - The data to validate for JSON serialization
 * @returns {{ isValid: boolean; errors?: string[] }} Validation result with validity status and optional error messages
 */
export function validateJsonData(data: JsonSerializableValue): {
  isValid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  try {
    JSON.stringify(data);
  } catch {
    errors.push('Data is not serializable to JSON');
  }

  if (detectCircular(data)) {
    errors.push('Data contains circular references');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Transforms a single value for JSON serialization
 * @param {unknown} value - The value to transform
 * @returns {JsonSerializableValue | symbol} The transformed value, or SKIP_VALUE if it should be skipped
 */
function transformValue(value: unknown): JsonSerializableValue | typeof SKIP_VALUE {
  // Handle undefined values
  if (value === undefined) {
    return null;
  }

  // Handle functions (skip in JSON export)
  if (typeof value === 'function') {
    return SKIP_VALUE;
  }

  // Recursively transform objects
  if (typeof value === 'object' && value !== null) {
    return transformForJson(value as JsonSerializableValue);
  }

  return value as JsonSerializableValue;
}

/**
 * Transforms an object for JSON serialization
 * @param {Record<string, unknown>} obj - The object to transform
 * @returns {Record<string, JsonSerializableValue>} The transformed object
 */
function transformObject(obj: Record<string, unknown>): Record<string, JsonSerializableValue> {
  const transformed: Record<string, JsonSerializableValue> = {};

  for (const [key, value] of Object.entries(obj)) {
    const transformedValue = transformValue(value);

    // Skip values marked with SKIP_VALUE (functions)
    if (transformedValue !== SKIP_VALUE) {
      transformed[key] = transformedValue;
    }
  }

  return transformed;
}

/**
 * Transform data for JSON export (handle special cases)
 * @param {JsonSerializableValue} data - The data to transform for JSON serialization
 * @returns {JsonSerializableValue} The transformed data compatible with JSON serialization
 */
export function transformForJson(data?: JsonSerializableValue): JsonSerializableValue {
  if (data === null || data === undefined) {
    return null;
  }

  // Handle Date objects
  if (data instanceof Date) {
    return data.toISOString();
  }

  // Handle BigInt
  if (typeof data === 'bigint') {
    return data.toString();
  }

  // Handle functions
  if (typeof data === 'function') {
    return null;
  }

  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(transformForJson);
    }

    return transformObject(data as Record<string, unknown>);
  }

  return data;
}
