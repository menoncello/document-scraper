/**
 * Selector debugging utilities
 */

import type { ScrapingConfig, SelectorResult, ElementInfo } from '../types/index.ts';
import { HtmlParser } from './html-parser.ts';

// Constants for magic numbers
const TEXT_PREVIEW_LENGTH = 100;
const MAX_SAMPLE_TEXT_LENGTH = 200;
const MAX_ELEMENTS_PREVIEW = 5;

export interface FieldExtractionResults {
  [fieldName: string]: {
    selector: string;
    found: boolean;
    count: number;
    text?: string;
    attributes?: Record<string, string>;
    elements?: Array<{
      tag: string;
      text: string;
      attributes: Record<string, string>;
    }>;
  };
}

export interface SelectorMatch {
  selector: string;
  found: boolean;
  count: number;
  sampleText?: string;
}

/**
 * Utility class for debugging CSS selectors
 */
export class SelectorDebugger {
  /**
   * Test all selectors in a configuration
   * @param {ScrapingConfig} config - The scraping configuration containing selectors to test
   * @param {string} html - The HTML content to test selectors against
   * @returns {Promise<FieldExtractionResults>} Results of selector testing for each field
   */
  async testAllSelectors(config: ScrapingConfig, html: string): Promise<FieldExtractionResults> {
    const parser = new HtmlParser();
    parser.load(html);
    const results: FieldExtractionResults = {};

    for (const [fieldName, selector] of Object.entries(config.extraction.fields)) {
      results[fieldName] = await this.testSelector(parser, fieldName, selector);
    }

    return results;
  }

  /**
   * Test a single selector
   * @param {HtmlParser} parser - The HTML parser instance
   * @param {string} fieldName - The name of the field being extracted
   * @param {string} selector - The CSS selector to test
   * @returns {Promise<FieldExtractionResults[string]>} Results of testing the selector
   */
  async testSelector(
    parser: HtmlParser,
    fieldName: string,
    selector: string
  ): Promise<FieldExtractionResults[string]> {
    const result = parser.select(selector);
    const count = result.count;
    const found = result.found;

    const fieldResult: FieldExtractionResults[string] = {
      selector,
      found,
      count,
    };

    if (found) {
      // Get sample text from result
      fieldResult.text = result.text?.substring(0, MAX_SAMPLE_TEXT_LENGTH) || '';

      // Get attributes using extractAttribute
      if (typeof result.extractAttribute === 'function') {
        fieldResult.attributes = this.extractCommonAttributes(result);
      }

      // Get detailed element information from result.elements
      fieldResult.elements = this.createElementPreview(result.elements);
    }

    return fieldResult;
  }

  /**
   * Extract common attributes from selector result
   * @param {SelectorResult} result - The selector result containing extractAttribute method
   * @returns {Record<string, string>} Record of common attributes
   */
  private extractCommonAttributes(result: SelectorResult): Record<string, string> {
    return {
      href: this.getFirstValue(result.extractAttribute('href')),
      src: this.getFirstValue(result.extractAttribute('src')),
      class: this.getFirstValue(result.extractAttribute('class')),
    };
  }

  /**
   * Get first value from potentially array result
   * @param {string | string[]} value - Value that might be a string or array of strings
   * @returns {string} First string value or empty string
   */
  private getFirstValue(value: string | string[]): string {
    return Array.isArray(value) ? value[0] || '' : value;
  }

  /**
   * Create element preview for debugging
   * @param {ElementInfo[]} elements - Array of elements to preview
   * @returns {Array<{tag: string, text: string, attributes: Record<string, string}>} Array of element preview information
   */
  private createElementPreview(elements: ElementInfo[]): Array<{
    tag: string;
    text: string;
    attributes: Record<string, string>;
  }> {
    return elements.slice(0, MAX_ELEMENTS_PREVIEW).map(el => ({
      tag: el.tagName,
      text: el.text?.substring(0, TEXT_PREVIEW_LENGTH) || '',
      attributes: el.attributes || {},
    }));
  }

  /**
   * Analyze selector results and provide suggestions
   * @param {FieldExtractionResults} results - The selector results to analyze
   * @returns {string[]} Array of improvement suggestions
   */
  analyzeSelectorResults(results: FieldExtractionResults): string[] {
    const suggestions: string[] = [];

    for (const [fieldName, result] of Object.entries(results)) {
      if (!result.found) {
        suggestions.push(
          `Selector for '${fieldName}' found no elements. Consider: ${this.getSuggestionForEmptySelector(result.selector)}`
        );
      } else if (result.count > TEXT_PREVIEW_LENGTH) {
        suggestions.push(
          `Selector for '${fieldName}' matches ${result.count} elements. Consider being more specific.`
        );
      } else if (result.count > 1 && !fieldName.endsWith('s')) {
        suggestions.push(
          `Selector for '${fieldName}' matches multiple elements but field name suggests single value. Consider using :first-child or similar.`
        );
      }
    }

    return suggestions;
  }

  /**
   * Get suggestion for empty selector
   * @param {string} selector - The selector that returned no results
   * @returns {string} Suggestion for fixing the selector
   */
  private getSuggestionForEmptySelector(selector: string): string {
    // Common selector fixes
    if (selector.includes('class')) {
      return 'Check if class names have changed or use more generic selectors';
    }
    if (selector.includes('id')) {
      return 'Verify the element ID exists or use class selectors instead';
    }
    if (selector.includes(':nth-child')) {
      return 'Check if page structure has changed or use different selectors';
    }
    return 'Verify page structure or use browser dev tools to find correct selectors';
  }

  /**
   * Test selector against HTML content
   * @param {string} selector - The CSS selector to test
   * @param {string} html - The HTML content to test against
   * @returns {Promise<SelectorMatch>} Result of selector testing
   */
  async testSelectorAgainstHtml(selector: string, html: string): Promise<SelectorMatch> {
    const parser = new HtmlParser();
    parser.load(html);
    const result = parser.select(selector);
    const found = result.found;

    return {
      selector,
      found,
      count: result.count,
      sampleText: found ? result.text?.substring(0, TEXT_PREVIEW_LENGTH) : undefined,
    };
  }
}
