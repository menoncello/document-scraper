/**
 * Element Utilities for HTML Parser
 *
 * This module provides utility functions for extracting information from HTML elements
 * and managing element data operations.
 */

import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import type { ElementInfo } from './element-types.ts';

type CheerioAPI = ReturnType<typeof cheerio.load>;

const DATA_PREFIX_LENGTH = 5; // Length of 'data-' prefix

/**
 * Interface for DOM element with tag name
 */
export interface DomElement {
  tagName?: string;
  attribs?: Record<string, unknown>;
}

/**
 * Extract data attributes from an element's attributes object
 *
 * @param {Record<string, unknown>} attributes - The element's attributes object
 * @returns {Record<string, unknown>} Data attribute object
 */
export function extractDataAttributesFromObject(
  attributes: Record<string, string | null | undefined> = {}
): Record<string, string | null | undefined> {
  const dataAttributes: Record<string, string | null | undefined> = {};

  for (const key of Object.keys(attributes)) {
    if (key.startsWith('data-')) {
      const dataKey = key.substring(DATA_PREFIX_LENGTH);
      const attributeValue = attributes[key];
      if (attributeValue !== undefined) {
        dataAttributes[dataKey] = attributeValue;
      }
    }
  }

  return dataAttributes;
}

/**
 * Check if an element should be removed (empty)
 *
 * @param {unknown} element - The element to check
 * @param {CheerioAPI} $ - The Cheerio instance
 * @returns {boolean} True if the element should be removed
 */
export function shouldRemoveEmptyElement(element: unknown, $: CheerioAPI): boolean {
  const element$ = $(element as Element);
  const text = element$.text().trim();
  const hasChildren = element$.children().length > 0;
  const elementNode = element as DomElement;
  const hasAttributes = Object.keys(elementNode.attribs || {}).length > 0;

  return !text && !hasChildren && !hasAttributes;
}

/**
 * Create element info object from element
 *
 * @param {unknown} element - The element to analyze
 * @param {CheerioAPI} $ - The Cheerio instance
 * @param {ElementInfo} [parent] - Optional parent element information
 * @returns {ElementInfo} Element information object
 */
export function createElementInfo(
  element: unknown,
  $: CheerioAPI,
  parent?: ElementInfo
): ElementInfo {
  const $element = $(element as Element);
  const elementNode = element as DomElement;

  return {
    tagName: elementNode.tagName || '',
    text: $element.text().trim(),
    attributes: (elementNode.attribs as Record<string, string>) || {},
    children: [],
    parent,
  };
}
