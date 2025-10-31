/**
 * HTML parser instance utilities
 */
import { HtmlParser } from './html-parser.ts';

/**
 * Get HTML parser instance for a specific element
 * @param {HtmlParser} htmlParser - HTML parser instance
 * @param {unknown} element - The HTML element to create parser for
 * @returns {unknown} The HTML parser instance or null if not available
 */
export function getHtmlParserInstance(htmlParser: HtmlParser, element: unknown): unknown {
  const parser = htmlParser['$'] as unknown;
  if (typeof parser === 'function') {
    try {
      return parser(element);
    } catch {
      return null;
    }
  }
  return null;
}
