/**
 * Structured Data Extraction Utilities
 *
 * This module provides utilities for extracting structured data from HTML elements
 * using field mappings and CSS selectors.
 */

import * as cheerio from 'cheerio';
import type { Element, AnyNode } from 'domhandler';
import type { SelectorResult } from '../types/index.ts';

type CheerioAPI = ReturnType<typeof cheerio.load>;

/**
 * Extract structured data from a single element
 *
 * @param {unknown} element - The element to extract data from
 * @param {Record<string, string>} fieldMapping - Object mapping field names to CSS selectors
 * @param {CheerioAPI} $ - The Cheerio instance for element operations
 * @returns {Record<string, unknown>} Structured data object
 */
export function extractElementStructuredData(
  element: unknown,
  fieldMapping: Record<string, string>,
  $: CheerioAPI
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const element$ = $(element as Element);

  for (const [field, fieldSelector] of Object.entries(fieldMapping)) {
    let value = '';

    // Handle data attributes (e.g., 'data-id', 'data-category')
    if (fieldSelector.startsWith('data-')) {
      value = element$.attr(fieldSelector) || '';
    } else {
      // Handle regular selectors
      const fieldElement = element$.find(fieldSelector);

      // Get text from all matching elements, but prefer children text to avoid whitespace between elements
      let textContent = '';
      fieldElement.each((_, el) => {
        // Use children().text() to avoid whitespace between child elements
        const text =
          $(el).children().length > 0 ? $(el).children().text().trim() : $(el).text().trim();
        if (text) {
          textContent += text;
        }
      });

      value = textContent || fieldElement.attr('content') || '';
    }

    data[field] = value;
  }

  return data;
}

/**
 * Extract structured data from multiple matching elements
 *
 * @param {SelectorResult} result - The selector result containing matches
 * @param {Record<string, string>} fieldMapping - Object mapping field names to CSS selectors
 * @param {CheerioAPI | null} $ - The Cheerio instance
 * @returns {T[]} Array of structured data objects
 */
export function extractMultipleStructuredData<T>(
  result: SelectorResult,
  fieldMapping: Record<string, string>,
  $: CheerioAPI | null
): T[] {
  const structuredData: T[] = [];

  if ($ && result.matches) {
    result.matches.each((_: unknown, element: unknown) => {
      const data = extractElementStructuredData(element, fieldMapping, $);
      if (Object.keys(data).length > 0) {
        structuredData.push(data as T);
      }
    });
  }

  return structuredData;
}

/**
 * Extract text content from field elements, preferring children text to avoid whitespace
 *
 * @param {cheerio.Cheerio<AnyNode>} fieldElement - The field element to extract text from
 * @returns {string} Extracted text content
 */
function extractFieldText(fieldElement: cheerio.Cheerio<AnyNode>): string {
  let textContent = '';
  fieldElement.each((index, _el) => {
    // Use the fieldElement instance to work with the current element
    const currentElement = fieldElement.eq(index);
    const text =
      currentElement.children().length > 0
        ? currentElement.children().text().trim()
        : currentElement.text().trim();
    if (text) {
      textContent += text;
    }
  });
  return textContent;
}

/**
 * Extract value from a field element using the field selector
 *
 * @param {cheerio.Cheerio<AnyNode>} firstElement - The main element to search within
 * @param {string} fieldSelector - The CSS selector for the field
 * @returns {string} Extracted value
 */
function extractFieldValue(firstElement: cheerio.Cheerio<AnyNode>, fieldSelector: string): string {
  // Handle data attributes (e.g., 'data-id', 'data-category')
  if (fieldSelector.startsWith('data-')) {
    return firstElement.attr(fieldSelector) || '';
  }

  // Handle regular selectors
  const fieldElement = firstElement.find(fieldSelector);
  const textContent = extractFieldText(fieldElement);
  return textContent || fieldElement.attr('content') || '';
}

/**
 * Extract structured data from a single matching element
 *
 * @param {SelectorResult} result - The selector result containing matches
 * @param {Record<string, string>} fieldMapping - Object mapping field names to CSS selectors
 * @returns {T} Structured data object
 */
export function extractSingleStructuredData<T>(
  result: SelectorResult,
  fieldMapping: Record<string, string>
): T {
  const data: Record<string, unknown> = {};
  const element$ = result.matches as cheerio.Cheerio<AnyNode>;

  if (!element$ || element$.length === 0) {
    return data as T;
  }

  const firstElement = element$.first();

  for (const [field, fieldSelector] of Object.entries(fieldMapping)) {
    data[field] = extractFieldValue(firstElement, fieldSelector);
  }

  return data as T;
}
