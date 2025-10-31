/**
 * Type definitions for HTML parser and element utilities
 */

/**
 * Interface for element information extracted from HTML
 */
export interface ElementInfo {
  /**
   * The HTML tag name of the element
   */
  tagName: string;
  /**
   * The text content of the element
   */
  text: string;
  /**
   * The HTML attributes of the element
   */
  attributes: Record<string, string>;
  /**
   * Child elements of this element
   */
  children: ElementInfo[];
  /**
   * Parent element if available
   */
  parent?: ElementInfo;
}
