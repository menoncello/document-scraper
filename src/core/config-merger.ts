/**
 * Configuration merging utilities for deep object merging.
 */

import type { ConfigMergeOptions } from './config.ts';

/**
 * Deep merge two objects with configurable merge behavior.
 * Recursively merges nested objects and handles overwrite behavior.
 * @param {Record<string, unknown>} target - The target object to merge into
 * @param {Record<string, unknown>} source - The source object to merge from
 * @param {ConfigMergeOptions} options - Configuration options for merge behavior
 * @returns {string} {Record<string, unknown>} The merged object
 */
export function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  options: ConfigMergeOptions = {}
): Record<string, unknown> {
  const result = { ...target };
  const { deep = true, overwrite = true } = options;

  for (const key in source) {
    if (shouldMergeProperty(source, key)) {
      result[key] = mergeProperty({
        target,
        source,
        key,
        deep,
        overwrite,
        options,
      }) as string | number | boolean | Record<string, unknown>;
    }
  }

  return result;
}

/**
 * Determines if a property should be merged.
 * @param {Record<string, unknown>} source - The source object
 * @param {string} key - The property key
 * @returns {boolean} {boolean} True if the property should be merged
 */
function shouldMergeProperty(source: Record<string, unknown>, key: string): boolean {
  return source.hasOwnProperty(key);
}

/**
 * Merges a single property from source to target.
 * @param {object} mergeContext - Object containing merge context and options
 * @param {Record<string, unknown>} mergeContext.target - The target object to merge into
 * @param {Record<string, unknown>} mergeContext.source - The source object to merge from
 * @param {string} mergeContext.key - The property key to merge
 * @param {boolean} mergeContext.deep - Whether to perform deep merge
 * @param {boolean} mergeContext.overwrite - Whether to overwrite existing values
 * @param {ConfigMergeOptions} mergeContext.options - Merge options
 * @returns {unknown} {unknown} The merged property value
 */
function mergeProperty(mergeContext: {
  target: Record<string, unknown>;
  source: Record<string, unknown>;
  key: string;
  deep: boolean;
  overwrite: boolean;
  options: ConfigMergeOptions;
}): unknown {
  const { target, source, key, deep, options } = mergeContext;

  if (isNestedObject(source[key]) && deep) {
    return mergeNestedObject(target, source, key, options);
  }

  if (mergeContext.overwrite || !(key in target)) {
    return source[key];
  }

  return target[key];
}

/**
 * Checks if a value is a nested object (not null, not array).
 * @param {unknown} value - The value to check
 * @returns {boolean} {boolean} True if the value is a nested object
 */
function isNestedObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Merges nested objects recursively.
 * @param {Record<string, unknown>} target - The target object
 * @param {Record<string, unknown>} source - The source object
 * @param {string} key - The property key
 * @param {ConfigMergeOptions} options - Merge options
 * @returns {string} {Record<string, unknown>} The merged nested object
 */
function mergeNestedObject(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  key: string,
  options: ConfigMergeOptions
): Record<string, unknown> {
  if (isNestedObject(target[key])) {
    return deepMerge(
      target[key] as Record<string, unknown>,
      source[key] as Record<string, unknown>,
      options
    );
  }
  return source[key] as Record<string, unknown>;
}
