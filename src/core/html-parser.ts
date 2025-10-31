/**
 * HTML Parser using Cheerio for content extraction
 *
 * This class provides a comprehensive interface for parsing HTML content
 * and extracting structured data using CSS selectors and XPath expressions.
 * It wraps Cheerio's functionality to provide a clean, typed API for web scraping.
 */

import * as cheerio from 'cheerio';
import type { HttpResponse, SelectorResult } from '../types/index.ts';
import type { ElementInfo } from './element-types.ts';
import { createElementInfo } from './element-utils.ts';
import {
  extractMultipleDataAttributes,
  extractSingleDataAttributes,
  EMPTY_COUNT,
} from './html/extraction-helpers.ts';
import {
  hasSelector,
  getProcessedHtml,
  getElementInfoRecursive,
  processEmptyElementsRemoval,
} from './html/parser-core.ts';
import {
  loadFromResponse,
  selectElements,
  selectXPath,
  extractText,
  extractAttribute,
  extractStructuredData,
  getElementInfo,
  getPageTitle,
  getMetaDescription,
  getMetaTags,
  getLinks,
  getImages,
} from './html/parser-methods.ts';

// Re-export SelectorResult for compatibility with other modules
export type { SelectorResult } from '../types/index.ts';

// Re-export ElementInfo for backward compatibility
export type { ElementInfo } from './element-types.ts';

type CheerioAPI = ReturnType<typeof cheerio.load>;

const HTML_NOT_LOADED_ERROR = 'No HTML loaded. Call load() or loadFromResponse() first.';
const HTML_CONTENT_NOT_LOADED_ERROR = 'HTML content not loaded. Call load() method first.';

export interface ParseOptions {
  /**
   * Whether to normalize whitespace in HTML content
   */
  normalizeWhitespace?: boolean;
  /**
   * Whether to remove empty elements from the DOM
   */
  removeEmptyElements?: boolean;
  /**
   * Whether to decode HTML entities
   */
  decodeEntities?: boolean;
  /**
   * Whether to remove HTML comments from the DOM
   */
  removeComments?: boolean;
  /**
   * Whether to remove script tags from the DOM
   */
  removeScripts?: boolean;
  /**
   * Whether to remove style tags from the DOM
   */
  removeStyles?: boolean;
}

/**
 * HTML Parser class for extracting content from HTML documents
 *
 * This class provides methods for loading HTML content, selecting elements,
 * and extracting structured data using CSS selectors and XPath expressions.
 */
export class HtmlParser {
  private $: CheerioAPI | null = null;
  private originalHtml = '';
  private options: ParseOptions;

  /**
   * Create a new HtmlParser instance
   *
   * @param {ParseOptions} options - Configuration options for parsing behavior
   */
  constructor(options: ParseOptions = {}) {
    this.options = {
      normalizeWhitespace: true,
      removeEmptyElements: false,
      decodeEntities: true,
      removeComments: false,
      removeScripts: false,
      removeStyles: false,
      ...options,
    };
  }

  /**
   * Load HTML content for parsing
   *
   * @param {string} html - The HTML string to parse
   */
  load(html = ''): void {
    // Handle null/undefined input gracefully by treating as empty string
    const normalizedHtml = html ?? '';
    this.originalHtml = normalizedHtml;
    this.$ = cheerio.load(normalizedHtml);

    if (this.options.removeEmptyElements) {
      this.removeEmptyElements();
    }
  }

  /**
   * Load HTML content from HTTP response
   *
   * @param {HttpResponse} response - The HTTP response containing HTML content
   * @returns {Promise<void>} Promise that resolves when HTML is loaded
   */
  async loadFromResponse(response: HttpResponse): Promise<void> {
    await loadFromResponse(response, this.load.bind(this));
  }

  /**
   * Query elements using CSS selector
   *
   * @param {string} selector - The CSS selector to query elements
   * @returns {number} Object containing matches, count, text, and HTML
   */
  select(selector: string): SelectorResult {
    return selectElements(selector, this.$);
  }

  /**
   * Query elements using XPath expression
   *
   * @param {string} xpath - The XPath expression to query elements
   * @returns {SelectorResult} Object containing matches, count, text, and HTML
   */
  selectXPath(xpath: string): SelectorResult {
    return selectXPath(xpath, this.$);
  }

  /**
   * Extract text from matching elements
   *
   * @param {string} selector - The CSS selector to query elements
   * @param {boolean} multiple - Whether to return text from all matching elements as an array
   * @returns {string | string[]} Text content from matching elements
   */
  extractText(selector: string, multiple = false): string | string[] {
    if (!this.$) {
      throw new Error(HTML_CONTENT_NOT_LOADED_ERROR);
    }
    return extractText(selector, this.$, multiple);
  }

  /**
   * Extract attributes from matching elements
   *
   * @param {string} selector - The CSS selector to query elements
   * @param {string} attribute - The attribute name to extract
   * @param {boolean} multiple - Whether to return attributes from all matching elements as an array
   * @returns {string | string[]} Attribute value(s) from matching elements
   */
  extractAttribute(selector: string, attribute: string, multiple = false): string | string[] {
    if (!this.$) {
      throw new Error(HTML_CONTENT_NOT_LOADED_ERROR);
    }
    return extractAttribute(selector, this.$, attribute, multiple);
  }

  /**
   * Extract data attributes from matching elements
   *
   * @param {string} selector - The CSS selector to query elements
   * @param {boolean} multiple - Whether to return data attributes from all matching elements as an array
   * @returns {Record<string, string> | Array<Record<string, string>>} Data attribute object(s) from matching elements
   */
  extractDataAttributes(
    selector: string,
    multiple = false
  ): Record<string, string> | Array<Record<string, string>> {
    const result = this.select(selector);

    if (multiple) {
      if (!this.$) {
        throw new Error(HTML_NOT_LOADED_ERROR);
      }
      return extractMultipleDataAttributes(result, this.$);
    }
    return extractSingleDataAttributes(result);
  }

  /**
   * Extract structured data from matching elements
   *
   * @param {string} selector - The CSS selector to query elements
   * @param {Record<string, string>} fieldMapping - Object mapping field names to CSS selectors
   * @param {boolean} multiple - Whether to return structured data from all matching elements as an array
   * @returns {T | T[]} Structured data object(s) from matching elements
   */
  extractStructuredData<T = Record<string, unknown>>(
    selector: string,
    fieldMapping: Record<string, string>,
    multiple = false
  ): T | T[] {
    if (!this.$) {
      throw new Error(HTML_CONTENT_NOT_LOADED_ERROR);
    }
    return extractStructuredData<T>(selector, this.$, fieldMapping, multiple);
  }

  /**
   * Get element information for debugging
   *
   * @param {string} selector - The CSS selector to query elements
   * @returns {ElementInfo[]} Array of element information objects
   */
  getElementInfo(selector: string): ElementInfo[] {
    if (!this.$) {
      throw new Error(HTML_CONTENT_NOT_LOADED_ERROR);
    }
    return getElementInfo(selector, this.$, this.getElementInfoRecursive.bind(this));
  }

  /**
   * Get page title
   *
   * @returns {string | undefined} The page title or undefined if not found
   */
  getTitle(): string | undefined {
    if (!this.$) {
      throw new Error(HTML_CONTENT_NOT_LOADED_ERROR);
    }
    return getPageTitle(this.$);
  }

  /**
   * Get meta description
   *
   * @returns {string} The meta description content or empty string if not found
   */
  getMetaDescription(): string {
    if (!this.$) {
      throw new Error(HTML_CONTENT_NOT_LOADED_ERROR);
    }
    return getMetaDescription(this.$);
  }

  /**
   * Get all meta tags
   *
   * @returns {Record<string, string>} Object containing meta tag names and their content
   */
  getMetaTags(): Record<string, string> {
    if (!this.$) {
      throw new Error(HTML_CONTENT_NOT_LOADED_ERROR);
    }
    return getMetaTags(this.$);
  }

  /**
   * Get all links (href attributes)
   *
   * @returns {string[]} Array of href values from all link elements
   */
  getLinks(): string[] {
    if (!this.$) {
      throw new Error(HTML_CONTENT_NOT_LOADED_ERROR);
    }
    return getLinks(this.$);
  }

  /**
   * Get all images (src attributes)
   *
   * @returns {string[]} Array of src values from all image elements
   */
  getImages(): string[] {
    if (!this.$) {
      throw new Error(HTML_CONTENT_NOT_LOADED_ERROR);
    }
    return getImages(this.$);
  }

  /**
   * Check if selector matches any elements
   *
   * @param {string} selector - The CSS selector to check
   * @returns {boolean} True if elements match the selector, false otherwise
   */
  has(selector: string): boolean {
    if (!this.$) {
      throw new Error(HTML_NOT_LOADED_ERROR);
    }
    return hasSelector(selector, this.select.bind(this), EMPTY_COUNT);
  }

  /**
   * Get the original HTML
   *
   * @returns {string} The original HTML content before any processing
   */
  getOriginalHtml(): string {
    return this.originalHtml;
  }

  /**
   * Get the processed HTML
   *
   * @returns {string} The processed HTML content after any modifications
   */
  getHtml(): string {
    return getProcessedHtml(this.$, this.originalHtml);
  }

  /**
   * Remove empty elements from the DOM
   *
   * Removes elements that have no text content, no children, and no attributes.
   */
  private removeEmptyElements(): void {
    processEmptyElementsRemoval(this.$);
  }

  /**
   * Get element information recursively
   *
   * @param {unknown} element - The Cheerio element to analyze
   * @param {ElementInfo} [parent] - Optional parent element information
   * @returns {ElementInfo} Element information object
   */
  private getElementInfoRecursive(element: unknown, parent?: ElementInfo): ElementInfo {
    if (!this.$) {
      throw new Error(HTML_NOT_LOADED_ERROR);
    }
    return getElementInfoRecursive(element, this.$, createElementInfo, parent);
  }
}
