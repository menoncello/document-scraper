/**
 * Utility functions for data extraction
 */

export interface ParseResult {
  count: number;
  text: string;
  matches: {
    attr: (attributeName: string) => string | undefined;
    [index: number]: {
      attribs?: Record<string, string>;
    };
  };
}

export interface HtmlElement {
  attribs?: Record<string, string>;
}

export interface ExtractableElement {
  find: (selector: string) => {
    text: () => string;
    attr: (name: string) => string | undefined;
  };
  attr: (name: string) => string | undefined;
}

/**
 * Extract text content from parse result
 * @param {ScrapingResult} result - The parse result
 * @returns {unknown} The extracted text content
 */
export function extractTextContent(result: ParseResult): string {
  return result.text.trim();
}

/**
 * Extract specific attribute from parse result
 * @param {ScrapingResult} result - The parse result
 * @param {string} attributeName - The attribute name to extract
 * @returns {unknown} The extracted attribute value
 */
export function extractAttributeContent(result: ParseResult, attributeName: string): string {
  return result.matches.attr(attributeName) || '';
}

/**
 * Extract first available attribute from element
 * @param {ScrapingResult} result - The parse result
 * @returns {unknown} The first available attribute value
 */
export function extractFirstAvailableAttribute(result: ParseResult): string {
  const element = result.matches[0] as HtmlElement;
  if (element?.attribs) {
    for (const [, attrValue] of Object.entries(element.attribs)) {
      if (attrValue && typeof attrValue === 'string' && attrValue.trim()) {
        return attrValue;
      }
    }
  }
  return '';
}

/**
 * Normalize individual values
 * @param {string | number | boolean} value - The value to normalize
 * @returns {unknown} The normalized value
 */
export function normalizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    // Don't convert empty strings to numbers
    if (trimmed === '') {
      return '';
    }

    // Try to convert to number
    const numValue = Number(trimmed);
    if (!Number.isNaN(numValue) && Number.isFinite(numValue)) {
      return numValue;
    }

    // Try to convert to boolean
    if (trimmed.toLowerCase() === 'true') {
      return true;
    }
    if (trimmed.toLowerCase() === 'false') {
      return false;
    }

    // Return trimmed string
    return trimmed;
  }

  return value;
}

/**
 * Filter out empty data
 * @param {Record<string, unknown> | Array<Record<string, unknown>>} data - The data to filter (object, array, or primitive)
 * @returns {unknown} The filtered data with empty values removed
 */
export function filterEmptyData(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.filter(item => {
      if (typeof item === 'object' && item !== null) {
        return Object.values(item).some(
          value => value !== null && value !== undefined && value !== ''
        );
      }
      return item !== null && item !== undefined && item !== '';
    });
  }

  if (typeof data === 'object' && data !== null) {
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && value !== '') {
        filtered[key] = value;
      }
    }
    return filtered;
  }

  return data;
}
