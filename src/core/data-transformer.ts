/**
 * Data transformation utilities
 */

import type { ExtractionContext } from './data-extractor.ts';

export interface DataTransform {
  field: string;
  transform: (value: string, context: ExtractionContext) => unknown;
}

export interface DataFilter {
  field: string;
  filter: (value: unknown, context: ExtractionContext) => boolean;
}

/**
 * Apply data transformations
 * @param {Record<string, unknown> | Array<Record<string, unknown>>} data - The data to transform (object, array, or primitive)
 * @param {DataTransform[]} transforms - Array of transformations to apply
 * @param {ExtractionContext} context - The extraction context containing URL and metadata
 * @returns {unknown} The transformed data
 */
export function applyTransforms(
  data: unknown,
  transforms: DataTransform[],
  context: ExtractionContext
): unknown {
  if (Array.isArray(data)) {
    return data.map(item => applyTransforms(item, transforms, context));
  }

  if (typeof data === 'object' && data !== null) {
    const transformed = { ...data } as Record<string, unknown>;

    for (const { field, transform } of transforms) {
      if (field in transformed) {
        transformed[field] = transform(transformed[field] as string, context);
      }
    }

    return transformed;
  }

  return data;
}

/**
 * Apply data filters
 * @param {Record<string, unknown> | Array<Record<string, unknown>>} data - The data to filter (object, array, or primitive)
 * @param {DataFilter[]} filters - Array of filters to apply
 * @param {ExtractionContext} context - The extraction context containing URL and metadata
 * @returns {unknown} The filtered data
 */
export function applyFilters(
  data: unknown,
  filters: DataFilter[],
  context: ExtractionContext
): unknown {
  if (Array.isArray(data)) {
    return data.filter(item => {
      for (const { field, filter } of filters) {
        if (
          field in (item as Record<string, unknown>) &&
          !filter((item as Record<string, unknown>)[field], context)
        ) {
          return false;
        }
      }
      return true;
    });
  }

  return data;
}

/**
 * Normalize data (trim strings, convert numbers, etc.)
 * @param {Record<string, unknown> | Array<Record<string, unknown>>} data - The data to normalize (object, array, or primitive)
 * @param {(value: unknown) => unknown} normalizeValue - Function to normalize individual values
 * @returns {unknown} The normalized data
 */
export function normalizeData(data: unknown, normalizeValue: (value: unknown) => unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(item => normalizeData(item, normalizeValue));
  }

  if (typeof data === 'object' && data !== null) {
    const normalized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      normalized[key] = normalizeValue(value);
    }

    return normalized;
  }

  return normalizeValue(data);
}
