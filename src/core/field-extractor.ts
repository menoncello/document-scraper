/**
 * Field extraction utilities for data extraction
 */
import type { SelectorResult } from '../types/index.ts';
import type { ExtractionContext } from './data-extractor.ts';
import { type ExtractableElement } from './extraction-utils.ts';

/**
 * Extract field value using selector
 * @param {string} _selector - CSS selector for the field
 * @param {ExtractionContext} _context - Extraction context
 * @returns {string} Extracted value
 */
export function extractFieldValue(_selector: string, _context: ExtractionContext): string {
  // Implementation depends on HTML parser instance
  // This would be integrated with the main DataExtractor class
  return '';
}

/**
 * Extract text value from selector result
 * @param {SelectorResult} result - Selector result
 * @returns {string} Text value
 */
export function extractTextValue(result: SelectorResult): string {
  return result.text || '';
}

/**
 * Get first value from potentially array result
 * @param {string | string[]} value - Value that might be a string or array of strings
 * @returns {string} First string value or empty string
 */
function getFirstValue(value: string | string[]): string {
  return Array.isArray(value) ? value[0] || '' : value;
}

/**
 * Extract attribute value from selector result
 * @param {SelectorResult} result - Selector result
 * @returns {string} Attribute value
 */
export function extractAttributeValue(result: SelectorResult): string {
  return (
    getFirstValue(result.extractAttribute('content')) ||
    getFirstValue(result.extractAttribute('href')) ||
    getFirstValue(result.extractAttribute('src')) ||
    ''
  );
}

/**
 * Get attribute value from element
 * @param {ExtractableElement} element - HTML element
 * @returns {string} Attribute value
 */
export function getAttributeValue(element: ExtractableElement): string {
  if (!element) return '';

  // Try different attributes in order of preference
  const attributes = ['content', 'href', 'src', 'alt', 'title', 'value'];
  for (const attr of attributes) {
    const value = element.attr?.(attr);
    if (value) return value;
  }

  return '';
}

/**
 * Extract item data from HTML element using field configuration
 * @param {ExtractableElement} element - HTML element
 * @param {Record<string, string>} fields - Field configuration mapping field names to selectors
 * @returns {Record<string, unknown>} Extracted item data
 */
export function extractItemFromElement(
  element: ExtractableElement,
  fields: Record<string, string>
): Record<string, unknown> {
  const item: Record<string, unknown> = {};

  for (const [fieldName, fieldSelector] of Object.entries(fields)) {
    const fieldElement = element.find(fieldSelector);
    const value =
      fieldElement.text?.().trim() ||
      fieldElement.attr?.('content') ||
      fieldElement.attr?.('href') ||
      fieldElement.attr?.('src') ||
      '';
    item[fieldName] = value;
  }

  return item;
}
