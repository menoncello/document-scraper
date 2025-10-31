/**
 * Main HTML parser methods
 */

import * as cheerio from 'cheerio';
import type { HttpResponse, SelectorResult } from '../../types/index.ts';
import type { ElementInfo } from '../element-types.ts';
import {
  extractMultipleStructuredData,
  extractSingleStructuredData,
} from '../structured-data-extractor.ts';
import { xpathToCss } from '../xpath-converter.ts';
import {
  extractTextFromResult,
  extractAttributeFromResult,
  getPageTitle,
  getMetaDescription,
  getMetaTags,
  getLinks,
  getImages,
} from './extraction-helpers.ts';
import { createSuccessSelectorResult, createEmptySelectorResult } from './selector-helpers.ts';

/**
 * Constants for XPath to CSS conversion
 */
const POSITIONAL_SELECTORS = {
  FIRST_CHILD: 1,
  SECOND_CHILD: 2,
  THIRD_CHILD: 3,
} as const;

/**
 * Convert XPath-compatible CSS selector to valid CSS selector for Cheerio
 * @param {string} selector - The XPath-compatible CSS selector
 * @returns {string} The valid CSS selector
 */
function convertXPathToValidCss(selector: string): string {
  let css = selector;

  // Convert @class="value" to .class
  css = css.replace(/\[@class\s*=\s*["']([^"']+)["']]/g, '.$1');

  // Convert @id="value" to #id
  css = css.replace(/\[@id\s*=\s*["']([^"']+)["']]/g, '#$1');

  // Convert other attributes @attr="value" to [attr="value"]
  // Optimized regex to prevent ReDoS and follow best practices
  css = css.replace(/\[@([^\s=]+)\s*=\s*["']([^"']+)["']]/g, '[$1="$2"]');

  // Convert simple positional selectors like [1] to :first-child, [2] to :nth-child(2), etc.
  const simplePositionPattern = /\[(\d+)]/g;
  css = css.replace(simplePositionPattern, (match, num) => {
    const number = Number.parseInt(num, 10);
    if (number === POSITIONAL_SELECTORS.FIRST_CHILD) {
      return ':first-child';
    } else if (number === POSITIONAL_SELECTORS.SECOND_CHILD) {
      return ':nth-child(2)';
    } else if (number === POSITIONAL_SELECTORS.THIRD_CHILD) {
      return ':nth-child(3)';
    }
    return `:nth-child(${number})`;
  });

  return css;
}

/**
 * Error messages for HTML parser methods
 */
const ERROR_MESSAGES = {
  NO_HTML_LOADED: 'No HTML loaded. Call load() or loadFromResponse() first.',
} as const;

/**
 * Load HTML content from HTTP response
 *
 * @param {string} html - The HTML string to parse
 * @param {() => void} loadCallback - The load function to call
 */
export function loadHtml(html: string, loadCallback: (html: string) => void): void {
  loadCallback(html);
}

/**
 * Load HTML content from HTTP response
 *
 * @param {HttpResponse} response - The HTTP response containing HTML content
 * @param {(html: string) => void} loadCallback - The load function to call
 * @returns {Promise<void>} Promise that resolves when HTML is loaded
 */
export async function loadFromResponse(
  response: HttpResponse,
  loadCallback: (html: string) => void
): Promise<void> {
  try {
    const html = await response.text();
    loadCallback(html);
  } catch (error) {
    throw new Error(
      `Failed to load HTML from response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Query elements using CSS selector
 *
 * @param {string} selector - The CSS selector to query elements
 * @param {ReturnType<typeof cheerio.load> | null} $ - Cheerio instance
 * @returns {SelectorResult} Object containing matches, count, text, and HTML
 */
export function selectElements(
  selector: string,
  $: ReturnType<typeof cheerio.load> | null
): SelectorResult {
  if (!$) {
    throw new Error(ERROR_MESSAGES.NO_HTML_LOADED);
  }

  try {
    // Auto-detect XPath patterns and convert to CSS selector
    let cssSelector = selector;

    // Check if the selector looks like XPath (starts with //, contains @, or contains [position()])
    if (selector.startsWith('//') || selector.includes('@') || selector.includes('position()')) {
      // First convert XPath to XPath-compatible CSS syntax
      const xpathCompatibleCss = xpathToCss(selector);
      // Then convert to valid CSS that works with Cheerio
      cssSelector = convertXPathToValidCss(xpathCompatibleCss);
    }

    const matches = $(cssSelector);
    return createSuccessSelectorResult(matches, $);
  } catch {
    // Handle invalid selectors gracefully
    return createEmptySelectorResult($);
  }
}

/**
 * Query elements using XPath expression
 *
 * @param {string} xpath - The XPath expression to query elements
 * @param {ReturnType<typeof cheerio.load> | null} $ - Cheerio instance
 * @returns {SelectorResult} Object containing matches, count, text, and HTML
 */
export function selectXPath(
  xpath: string,
  $: ReturnType<typeof cheerio.load> | null
): SelectorResult {
  if (!$) {
    throw new Error(ERROR_MESSAGES.NO_HTML_LOADED);
  }

  try {
    // Convert XPath to CSS selector (basic conversion)
    const cssSelector = xpathToCss(xpath);
    return selectElements(cssSelector, $);
  } catch {
    // Return empty result if XPath conversion fails
    return createEmptySelectorResult($);
  }
}

/**
 * Extract text from matching elements
 *
 * @param {string} selector - The CSS selector to query elements
 * @param {ReturnType<typeof cheerio.load> | null} $ - Cheerio instance
 * @param {boolean} multiple - Whether to return text from all matching elements as an array
 * @returns {string | string[]} Text content from matching elements
 */
export function extractText(
  selector: string,
  $: ReturnType<typeof cheerio.load> | null,
  multiple = false
): string | string[] {
  if (!$) {
    throw new Error(ERROR_MESSAGES.NO_HTML_LOADED);
  }

  const result = selectElements(selector, $);
  return extractTextFromResult(result, $, multiple);
}

/**
 * Extract attributes from matching elements
 *
 * @param {string} selector - The CSS selector to query elements
 * @param {ReturnType<typeof cheerio.load> | null} $ - Cheerio instance
 * @param {string} attribute - The attribute name to extract
 * @param {boolean} multiple - Whether to return attributes from all matching elements as an array
 * @returns {string | string[]} Attribute value(s) from matching elements
 */
export function extractAttribute(
  selector: string,
  $: ReturnType<typeof cheerio.load> | null,
  attribute: string,
  multiple = false
): string | string[] {
  if (!$) {
    throw new Error(ERROR_MESSAGES.NO_HTML_LOADED);
  }

  const result = selectElements(selector, $);
  return extractAttributeFromResult(result, $, attribute, multiple);
}

/**
 * Extract structured data from matching elements
 *
 * @param {string} selector - The CSS selector to query elements
 * @param {ReturnType<typeof cheerio.load> | null} $ - Cheerio instance
 * @param {Record<string, string>} fieldMapping - Object mapping field names to CSS selectors
 * @param {boolean} multiple - Whether to return structured data from all matching elements as an array
 * @returns {T | T[]} Structured data object(s) from matching elements
 */
export function extractStructuredData<T = Record<string, unknown>>(
  selector: string,
  $: ReturnType<typeof cheerio.load> | null,
  fieldMapping: Record<string, string>,
  multiple = false
): T | T[] {
  if (!$) {
    throw new Error(ERROR_MESSAGES.NO_HTML_LOADED);
  }

  const result = selectElements(selector, $);

  if (multiple) {
    return extractMultipleStructuredData<T>(result, fieldMapping, $);
  }
  return extractSingleStructuredData<T>(result, fieldMapping);
}

/**
 * Get element information for debugging
 *
 * @param {string} selector - The CSS selector to query elements
 * @param {ReturnType<typeof cheerio.load> | null} $ - Cheerio instance
 * @param {(element: unknown, parent?: ElementInfo) => ElementInfo} recursiveCallback - Callback for recursive element info
 * @returns {ElementInfo[]} Array of element information objects
 */
export function getElementInfo(
  selector: string,
  $: ReturnType<typeof cheerio.load> | null,
  recursiveCallback: (element: unknown, parent?: ElementInfo) => ElementInfo
): ElementInfo[] {
  if (!$) {
    throw new Error(ERROR_MESSAGES.NO_HTML_LOADED);
  }

  const result = selectElements(selector, $);
  const elements: ElementInfo[] = [];

  if (result.matches) {
    result.matches.each((_: unknown, element: unknown) => {
      const elementInfo = recursiveCallback(element);
      elements.push(elementInfo);
    });
  }

  return elements;
}

// Re-export the getter functions for convenience
export { getPageTitle, getMetaDescription, getMetaTags, getLinks, getImages };
