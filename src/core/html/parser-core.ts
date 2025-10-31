/**
 * Core HTML parser functionality
 */

import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import type { ElementInfo } from '../element-types.ts';
import { shouldRemoveEmptyElement } from '../element-utils.ts';

/**
 * Constants for HTML processing
 */
export const HTML_PROCESSING_CONSTANTS = {
  BASIC_STRUCTURE_REGEX: /<html><head><\/head><(?:body><\/){2}html>/g,
} as const;

/**
 * Remove empty elements from the DOM
 *
 * @param {ReturnType<typeof cheerio.load> | null} $ - Cheerio instance
 * @param {() => void} removeCallback - Callback for removing empty elements
 */
export function removeEmptyElements(
  $: ReturnType<typeof cheerio.load> | null,
  removeCallback: () => void
): void {
  if (!$) {
    return;
  }

  removeCallback();
}

/**
 * Check if selector matches any elements
 *
 * @param {string} selector - The CSS selector to check
 * @param {() => SelectorResult} selectCallback - The select function to call
 * @param {number} emptyCount - The empty count constant
 * @returns {boolean} True if elements match the selector, false otherwise
 */
export function hasSelector(
  selector: string,
  selectCallback: (selector: string) => { count: number },
  emptyCount: number
): boolean {
  const result = selectCallback(selector);
  return result.count > emptyCount;
}

/**
 * Get the processed HTML
 *
 * @param {ReturnType<typeof cheerio.load> | null} $ - Cheerio instance
 * @param {string} originalHtml - The original HTML content
 * @returns {string} The processed HTML content after any modifications
 */
export function getProcessedHtml(
  $: ReturnType<typeof cheerio.load> | null,
  originalHtml: string
): string {
  if (!$) {
    return '';
  }

  const html = $.html() || '';

  // If the original HTML was empty or whitespace-only, return empty string
  if (!originalHtml || originalHtml.trim() === '') {
    return '';
  }

  // If the HTML only contains basic structure, return empty string
  const strippedHtml = html.replace(HTML_PROCESSING_CONSTANTS.BASIC_STRUCTURE_REGEX, '').trim();
  if (strippedHtml === '') {
    return '';
  }

  return html;
}

/**
 * Get element information recursively
 *
 * @param {unknown} element - The Cheerio element to analyze
 * @param {ReturnType<typeof cheerio.load> | null} $ - Cheerio instance
 * @param {(element: unknown, $: ReturnType<typeof cheerio.load>, parent?: ElementInfo) => ElementInfo} createElementCallback - Callback for creating element info
 * @param {ElementInfo} [parent] - Optional parent element information
 * @returns {ElementInfo} Element information object
 */
export function getElementInfoRecursive(
  element: unknown,
  $: ReturnType<typeof cheerio.load> | null,
  createElementCallback: (
    element: unknown,
    $: ReturnType<typeof cheerio.load>,
    parent?: ElementInfo
  ) => ElementInfo,
  parent?: ElementInfo
): ElementInfo {
  if (!$) {
    throw new Error('Cheerio instance not initialized');
  }

  const info = createElementCallback(element, $, parent);

  // Process children recursively
  try {
    const $element = $(element as Element);
    $element.children().each((_: unknown, child: unknown) => {
      info.children.push(getElementInfoRecursive(child, $, createElementCallback, info));
    });
  } catch {
    // If element can't be processed by cheerio, skip children processing
  }

  return info;
}

/**
 * Process empty elements removal
 *
 * @param {ReturnType<typeof cheerio.load> | null} $ - Cheerio instance
 */
export function processEmptyElementsRemoval($: ReturnType<typeof cheerio.load> | null): void {
  if (!$) {
    return;
  }

  $('*').each((_: unknown, element: unknown) => {
    if (shouldRemoveEmptyElement(element, $)) {
      const $element = $(element as Element);
      $element.remove();
    }
  });
}
