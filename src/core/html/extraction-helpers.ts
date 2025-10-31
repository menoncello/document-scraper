/**
 * Helper methods for HTML content extraction
 */

import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import type { SelectorResult } from '../../types/index.ts';
import { extractDataAttributesFromObject } from '../element-utils.ts';

/**
 * Constants for element indexing and comparison
 */
export const FIRST_ELEMENT_INDEX = 0;
export const EMPTY_COUNT = 0;

/**
 * Type definition for element attributes
 */
interface ElementAttributes {
  [key: string]: string;
}

/**
 * Extract text from matching elements
 *
 * @param {SelectorResult} result - The selector result containing matches
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {boolean} multiple - Whether to return text from all matching elements as an array
 * @returns {string | string[]} Text content from matching elements
 */
export function extractTextFromResult(
  result: SelectorResult,
  $: ReturnType<typeof cheerio.load>,
  multiple = false
): string | string[] {
  if (multiple) {
    const texts: string[] = [];
    if (result.matches) {
      result.matches.each((_: unknown, element: unknown) => {
        const $element = $(element as Element);
        const text = $element.text().trim();
        if (text) {
          texts.push(text);
        }
      });
    }
    return texts;
  }
  return (result.text || '').trim();
}

/**
 * Extract attributes from matching elements
 *
 * @param {SelectorResult} result - The selector result containing matches
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {string} attribute - The attribute name to extract
 * @param {boolean} multiple - Whether to return attributes from all matching elements as an array
 * @returns {string | string[]} Attribute value(s) from matching elements
 */
export function extractAttributeFromResult(
  result: SelectorResult,
  $: ReturnType<typeof cheerio.load>,
  attribute: string,
  multiple = false
): string | string[] {
  if (multiple) {
    const attributes: string[] = [];
    if (result.matches) {
      result.matches.each((_: unknown, element: unknown) => {
        const $element = $(element as Element);
        const value = $element.attr(attribute);
        if (value !== undefined) {
          attributes.push(value);
        }
      });
    }
    return attributes;
  }
  if (result.matches && result.matches.length > EMPTY_COUNT) {
    return (result.matches as cheerio.Cheerio<Element>).first().attr(attribute) || '';
  }
  return '';
}

/**
 * Extract data attributes from multiple matching elements
 *
 * @param {SelectorResult} result - The selector result containing matches
 * @param {ReturnType<typeof cheerio.load>} _$ - Cheerio instance (unused, for compatibility)
 * @returns {Array<Record<string, string>>} Array of data attribute objects
 */
export function extractMultipleDataAttributes(
  result: SelectorResult,
  _$: ReturnType<typeof cheerio.load>
): Array<Record<string, string>> {
  const dataAttributes: Array<Record<string, string>> = [];

  if (result.matches) {
    result.matches.each((_: unknown, element: unknown) => {
      const elementData = extractElementDataAttributes(element);
      if (Object.keys(elementData).length > EMPTY_COUNT) {
        dataAttributes.push(elementData);
      }
    });
  }

  return dataAttributes;
}

/**
 * Extract data attributes from a single matching element
 *
 * @param {SelectorResult} result - The selector result containing matches
 * @returns {Record<string, string>} Data attribute object
 */
export function extractSingleDataAttributes(result: SelectorResult): Record<string, string> {
  if (!result.matches) {
    return {};
  }

  const firstElement = result.matches.get(FIRST_ELEMENT_INDEX);
  const elementNode = firstElement as unknown as { attribs?: ElementAttributes };
  const dataAttributes = extractDataAttributesFromObject(elementNode?.attribs);

  // Filter out null and undefined values to match the expected return type
  const filteredDataAttributes: Record<string, string> = {};
  for (const [key, value] of Object.entries(dataAttributes)) {
    if (value !== null && value !== undefined) {
      filteredDataAttributes[key] = value;
    }
  }
  return filteredDataAttributes;
}

/**
 * Extract data attributes from a single element
 *
 * @param {unknown} element - The element to extract data from
 * @returns {Record<string, string>} Data attribute object
 */
export function extractElementDataAttributes(element: unknown): Record<string, string> {
  const elementNode = element as unknown as { attribs?: ElementAttributes };
  const dataAttributes = extractDataAttributesFromObject(elementNode?.attribs);

  // Filter out null and undefined values to match the expected return type
  const filteredDataAttributes: Record<string, string> = {};
  for (const [key, value] of Object.entries(dataAttributes)) {
    if (value !== null && value !== undefined) {
      filteredDataAttributes[key] = value;
    }
  }
  return filteredDataAttributes;
}

/**
 * Get page title
 *
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {string | undefined} The page title or undefined if not found
 */
export function getPageTitle($: ReturnType<typeof cheerio.load>): string | undefined {
  if (!$) {
    return undefined;
  }
  const title = $('title').text().trim();
  return title || undefined;
}

/**
 * Get meta description
 *
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {string} The meta description content or empty string if not found
 */
export function getMetaDescription($: ReturnType<typeof cheerio.load>): string {
  if (!$) {
    return '';
  }
  return $('meta[name="description"]').attr('content') || '';
}

/**
 * Get all meta tags
 *
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {Record<string, string>} Object containing meta tag names and their content
 */
export function getMetaTags($: ReturnType<typeof cheerio.load>): Record<string, string> {
  if (!$) {
    return {};
  }

  const metaTags: Record<string, string> = {};
  $('meta').each((_: unknown, element: unknown) => {
    const $element = $(element as Element);
    const name = $element.attr('name') || $element.attr('property');
    const content = $element.attr('content');
    if (name && content) {
      metaTags[name] = content;
    }
  });

  return metaTags;
}

/**
 * Get all links (href attributes)
 *
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {string[]} Array of href values from all link elements
 */
export function getLinks($: ReturnType<typeof cheerio.load>): string[] {
  if (!$) {
    return [];
  }

  const links: string[] = [];
  $('a[href]').each((_: unknown, element: unknown) => {
    const $element = $(element as Element);
    const href = $element.attr('href');
    if (href) {
      links.push(href);
    }
  });

  return links;
}

/**
 * Get all images (src attributes)
 *
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {string[]} Array of src values from all image elements
 */
export function getImages($: ReturnType<typeof cheerio.load>): string[] {
  if (!$) {
    return [];
  }

  const images: string[] = [];
  $('img[src]').each((_: unknown, element: unknown) => {
    const $element = $(element as Element);
    const src = $element.attr('src');
    if (src) {
      images.push(src);
    }
  });

  return images;
}
