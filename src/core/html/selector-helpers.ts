/**
 * Helper methods for HTML selector result processing
 */

import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { SelectorResult } from '../../types/index.ts';
import { extractDataAttributesFromObject } from '../element-utils.ts';

/**
 * Type definition for element attributes
 */
interface ElementAttributes {
  [key: string]: string;
}

/**
 * Type definition for element data
 */
interface ElementData {
  tagName: string;
  text: string;
  attributes: ElementAttributes;
  children: ElementData[];
}

/**
 * Type definition for DOM element with extended properties
 */
interface DomElementWithProperties {
  textContent?: string;
  tagName?: string;
  attribs?: ElementAttributes;
}

/**
 * Convert cheerio elements to element data array
 *
 * @param {cheerio.Cheerio<AnyNode>} matches - Cheerio elements to convert
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {ElementData[]} Array of element data objects
 */
export function convertElementsToData(
  matches: cheerio.Cheerio<AnyNode>,
  $: ReturnType<typeof cheerio.load>
): ElementData[] {
  const elements: ElementData[] = [];

  matches.each((_: unknown, element: unknown) => {
    const domElement = element as DomElementWithProperties;

    // Handle text extraction safely
    let text = '';
    try {
      text = $(element as AnyNode)
        .text()
        .trim();
    } catch {
      // If text extraction fails, try to get direct text content
      text = domElement.textContent || '';
    }

    elements.push({
      tagName: domElement.tagName ? domElement.tagName.toUpperCase() : '',
      text,
      attributes: domElement.attribs || {},
      children: [],
    });
  });

  return elements;
}

/**
 * Try to get outerHTML using cheerio's outerHTML method
 *
 * @param {AnyNode} node - The node to process
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {string | null} outerHTML if available, null otherwise
 */
function tryCheerioOuterHTML(node: AnyNode, $: ReturnType<typeof cheerio.load>): string | null {
  try {
    // Wrap the node in cheerio and get its HTML
    const cheerioNode = $(node);
    const tempHtml = cheerioNode.html();
    if (typeof tempHtml === 'string') {
      // Since we need outerHTML, reconstruct it using the node's tag name and attributes
      const domElement = node as DomElementWithProperties;
      const tagName = domElement.tagName?.toLowerCase() || '';
      const attribs = domElement.attribs || {};

      if (tagName) {
        const attributes = Object.entries(attribs)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ');

        const attrStr = attributes ? ` ${attributes}` : '';
        return `<${tagName}${attrStr}>${tempHtml}</${tagName}>`;
      }
    }
  } catch {
    // Method failed, return null
  }
  return null;
}

/**
 * Try to get outerHTML from node's outerHTML property
 *
 * @param {AnyNode} node - The node to process
 * @returns {string | null} outerHTML if available, null otherwise
 */
function tryNodeOuterHTML(node: AnyNode): string | null {
  if ('outerHTML' in node && typeof node.outerHTML === 'string') {
    return node.outerHTML;
  }
  return null;
}

/**
 * Build attributes string from element attributes
 *
 * @param {ElementAttributes} attribs - Element attributes
 * @returns {string} Formatted attributes string
 */
function buildAttributesString(attribs: ElementAttributes): string {
  const attributesStr = Object.entries(attribs)
    .map(([key, value]) => {
      // Don't escape quotes for HTML reconstruction - keep original values
      return `${key}="${value}"`;
    })
    .join(' ');

  return attributesStr ? ` ${attributesStr}` : '';
}

/**
 * Reconstruct outerHTML from innerHTML and element properties
 *
 * @param {AnyNode} node - The node to process
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {string} Reconstructed outerHTML or empty string
 */
function reconstructOuterHTML(node: AnyNode, $: ReturnType<typeof cheerio.load>): string {
  try {
    const innerHTML = $(node).html() || '';
    const domElement = node as DomElementWithProperties;
    const tagName = domElement.tagName || '';

    if (tagName) {
      const attribs = domElement.attribs || {};
      const attributes = buildAttributesString(attribs);
      return `<${tagName.toLowerCase()}${attributes}>${innerHTML}</${tagName.toLowerCase()}>`;
    }
  } catch {
    // If reconstruction fails, return empty string
  }
  return '';
}

/**
 * Get outerHTML safely from any node, handling different node types
 *
 * @param {AnyNode | null | undefined} node - The node to get outerHTML from
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {string} The outerHTML string or empty string if not available
 */
export function getElementOuterHTML(
  node: AnyNode | null | undefined,
  $: ReturnType<typeof cheerio.load>
): string {
  if (!node) {
    return '';
  }

  // Try cheerio outerHTML method first
  const cheerioHTML = tryCheerioOuterHTML(node, $);
  if (cheerioHTML) {
    return cheerioHTML;
  }

  // Try node's outerHTML property
  const nodeHTML = tryNodeOuterHTML(node);
  if (nodeHTML) {
    return nodeHTML;
  }

  // Fallback to reconstruction
  return reconstructOuterHTML(node, $);
}

/**
 * Create a selector result object from successful matches
 *
 * @param {cheerio.Cheerio<AnyNode>} matches - The matched elements
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {SelectorResult} Selector result object
 */
export function createSuccessSelectorResult(
  matches: cheerio.Cheerio<AnyNode>,
  $: ReturnType<typeof cheerio.load>
): SelectorResult {
  const elements = convertElementsToData(matches, $);
  const exists = matches.length > 0;

  // Extract attributes from the first element for direct access
  const attributes = exists && elements.length > 0 ? elements[0].attributes : {};

  // Extract data attributes from the first element for direct access
  const data =
    exists && elements.length > 0 ? extractDataAttributesFromObject(elements[0].attributes) : null;

  return {
    matches,
    count: matches.length,
    text: matches.text().trim(),
    html: matches.length > 0 ? getElementOuterHTML(matches.get(0), $) : '',
    elements,
    exists,
    found: exists,
    data,
    attributes,
    extractAttribute: (attributeName: string) => {
      if (matches.length > 0) {
        return matches.first().attr(attributeName) || '';
      }
      return '';
    },
  };
}

/**
 * Create an empty selector result object for failed selectors
 *
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {SelectorResult} Empty selector result object
 */
export function createEmptySelectorResult(
  $: ReturnType<typeof cheerio.load> | null
): SelectorResult {
  return {
    matches: $ ? $('') : cheerio.load('')(''),
    count: 0,
    text: '',
    html: '',
    elements: [],
    exists: false,
    found: false,
    data: null,
    attributes: {},
    extractAttribute: () => '',
  };
}
