/**
 * XPath to CSS Selector Conversion Utilities
 *
 * This module provides utilities for converting XPath expressions to CSS selectors.
 * It handles common XPath patterns and converts them to equivalent CSS selectors.
 */

/**
 * XPath conversion patterns for different XPath constructs
 */
const XPATH_PATTERNS = {
  DESCENDANT: /\/\//g,
  LEADING_SLASH: /^\//,
  ANY_DESCENDANT_AFTER_ELEMENT: /([A-Za-z])\/\//g,
  DIRECT_CHILD: /([A-Za-z])\/([A-Za-z])/g,
  MULTIPLE_SPACES: /\s+/g,
  // Process complete attribute patterns first, then simple attributes
  ATTRIBUTE_VALUES_SINGLE: /\[@(\w+)='([^']+)'\]/g,
  ATTRIBUTE_VALUES_DOUBLE: /\[@(\w+)="([^"]*)"\]/g,
  CONTAINS_SINGLE: /\[contains\(@(\w+), '([^']+)'\)\]/g,
  CONTAINS_DOUBLE: /\[contains\(@(\w+), "([^"]*)"\)\]/g,
  STARTS_WITH_SINGLE: /\[starts-with\(@(\w+), '([^']+)'\)\]/g,
  STARTS_WITH_DOUBLE: /\[starts-with\(@(\w+), "([^"]*)"\)\]/g,
  ATTRIBUTES: /\[@(\w+)/g,
  POSITION_EQUALS: /\[position\(\)=(\d+)\]/g,
  POSITION_GREATER: /\[position\(\)>(\d+)\]/g,
  POSITION_LESS: /\[position\(\)<(\d+)\]/g,
  TEXT_NODES: /text\(\)/g,
  // Optimized regex for attribute selector validation - prevents backtracking
  MALFORMED_ATTRIBUTE_SELECTOR: /\[[^[\]]*]/g,
  VALID_ATTRIBUTE_SELECTOR: /^\[[\w-]+(?:[*^]?=["'][^"']*["'])?]$/,
} as const;

/**
 * Basic path handling conversions
 *
 * @param {string} xpath - The XPath expression to process
 * @returns {string} The XPath with basic path conversions applied
 */
function handleBasicPaths(xpath: string): string {
  let css = xpath;

  // Handle // patterns (descendants) carefully
  // We need to handle cases like //div[@attr]/span where / after attributes should be >
  css = css.replace(/\/\//g, ' '); // Convert // to space first

  // Handle leading / (root)
  css = css.replace(/^\//, '');

  // Handle single / patterns based on original XPath structure
  if (xpath.startsWith('//')) {
    // Original XPath started with //, so most / should become spaces (descendants)
    // EXCEPT / after attribute conditions ] which should be > (direct child)
    css = css.replace(/(\])\/(\w)/g, '$1 > $2'); // element[attr]/element -> element[attr] > element
    // Convert remaining / to spaces for descendant relationships
    css = css.replace(/\//g, ' ');
  } else {
    // Original XPath didn't start with //, so all / should become > (direct child)
    css = css.replace(/(\])\/(\w)/g, '$1 > $2'); // element[attr]/element
    css = css.replace(/(\w)\/(\w)/g, '$1 > $2'); // element/element
    css = css.replace(/(\w)\/(\[)/g, '$1 > $2'); // element/[attr]
  }

  // Clean up multiple spaces
  css = css.replace(/\s+/g, ' ').trim();

  return css;
}

/**
 * Attribute selector conversions
 *
 * @param {string} css - The CSS selector to process
 * @returns {string} The CSS with attribute conversions applied
 */
function handleAttributeSelectors(css: string): string {
  return css
    // Process complete attribute patterns first
    // Handle both single and double quotes in attribute values
    .replace(/\[@(\w+)='([^']*)'\]/g, '[$1="$2"]') // Attribute values with single quotes (allow empty)
    .replace(/\[@(\w+)="([^"]*)"\]/g, '[$1="$2"]') // Attribute values with double quotes (allow empty)
    .replace(/\[contains\(@(\w+),\s*'([^']+)'\)\]/g, '[$1*="$2"]') // Contains with single quotes
    .replace(/\[contains\(@(\w+),\s*"([^"]*)"\)\]/g, '[$1*="$2"]') // Contains with double quotes
    .replace(/\[starts-with\(@(\w+),\s*'([^']+)'\)\]/g, '[$1^="$2"]') // Starts with with single quotes
    .replace(/\[starts-with\(@(\w+),\s*"([^"]*)"\)\]/g, '[$1^="$2"]') // Starts with with double quotes
    // Then process simple attributes (those that weren't matched above)
    .replace(/\[@(\w+)/g, '[$1') // Simple attributes
    .replace(/\[position\(\)\s*=\s*(\d+)\]/g, ':nth-of-type($1)') // Position equals
    .replace(/\[position\(\)\s*>\s*(\d+)\]/g, ':nth-of-type(n+$1)') // Position greater than
    .replace(/\[position\(\)\s*<\s*(\d+)\]/g, ':nth-of-type(-n+$1)') // Position less than
    .replace(/text\(\)/g, ''); // Text nodes
}

/**
 * Validate CSS attribute selectors to prevent malformed selectors
 *
 * @param {string} css - The CSS selector to validate
 * @returns {boolean} True if the selector has valid attributes, false otherwise
 */
function validateAttributeSelectors(css: string): boolean {
  if (!css.includes('[') || !css.includes(']')) {
    return true; // No attribute selectors to validate
  }

  // Check for common malformed patterns
  const malformedPatterns = [
    /\[@/, // XPath @ attribute syntax that wasn't converted
    /\[[^\[\]]*\[@/, // Mixed XPath/CSS syntax
    /\[[^\[\]]*\][^\[\]]*\[@/, // Multiple attributes with mixed syntax
    /\[[^\]]*$/, // Unclosed bracket
    /^\[[^\]]*$/, // Single unbalanced bracket
    /\[\w+\]$/, // Attribute without value (like [invalid])
  ];

  // If any malformed patterns are found, the selector is invalid
  return !malformedPatterns.some(pattern => pattern.test(css));
}

/**
 * Extract a safe fallback selector from XPath
 *
 * @param {string} xpath - The XPath expression
 * @returns {string} A safe CSS selector fallback
 */
function getSafeFallback(xpath: string): string {
  try {
    // Split by / and get the last part
    const lastPart = xpath.split('/').pop() || '*';

    // Extract element name from patterns like "div[@invalid]" or "div[@class='test']"
    const elementMatch = lastPart.match(/^(\w+)/);
    if (elementMatch) {
      return elementMatch[1];
    }

    return lastPart;
  } catch {
    return '*';
  }
}

/**
 * Basic XPath to CSS selector conversion
 *
 * This is a simplified conversion - for complex XPath, consider using a proper XPath library.
 * Converts common XPath patterns to equivalent CSS selectors.
 *
 * @param {string} xpath - The XPath expression to convert
 * @returns {string} The equivalent CSS selector
 */
export function xpathToCss(xpath: string): string {
  try {
    // Check for obviously invalid XPath patterns first
    if (isValidXPath(xpath)) {
      let css = handleBasicPaths(xpath);

      // For debugging: check if we have the problematic pattern before attribute processing
      const hasUnprocessedAttr = css.includes('[@');

      css = handleAttributeSelectors(css);

      // Validate the resulting CSS selector
      if (!validateAttributeSelectors(css)) {
        // If there are malformed attribute selectors, return a safe fallback
        return getSafeFallback(xpath);
      }

      return css.trim() || '*';
    } else {
      // Return safe fallback for invalid XPath
      return getSafeFallback(xpath);
    }
  } catch {
    // Return a safe fallback if conversion fails
    return getSafeFallback(xpath);
  }
}

/**
 * Check if XPath is valid enough for conversion
 *
 * @param {string} xpath - The XPath to validate
 * @returns {boolean} True if XPath appears valid, false otherwise
 */
function isValidXPath(xpath: string): boolean {
  if (!xpath || typeof xpath !== 'string') {
    return false;
  }

  const trimmed = xpath.trim();
  if (!trimmed) {
    return false;
  }

  // Check for invalid patterns
  const invalidPatterns = [
    /\/\/\/+/, // Three or more consecutive slashes
    /^\//, // Starting with single slash (should be // or element name)
    /\/$/, // Ending with slash
  ];

  return !invalidPatterns.some(pattern => pattern.test(trimmed));
}
