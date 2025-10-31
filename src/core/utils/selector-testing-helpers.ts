/**
 * Helper utilities for selector testing and debugging
 */

import { Logger } from '../logger';

// Constants for magic numbers
const MAX_TEXT_PREVIEW_LENGTH = 200;

export interface SelectorDebugResult {
  selector: string;
  count: number;
  text: string;
  found: boolean;
  error?: string;
}

/**
 * Create a successful selector test result
 * @param {string} selector - The CSS selector that was tested
 * @param {number} count - Number of elements found
 * @param {string} text - Text content from the result
 * @returns {SelectorDebugResult} Selector debug result
 */
export function createSuccessSelectorResult(
  selector: string,
  count: number,
  text: string
): SelectorDebugResult {
  return {
    selector,
    count,
    text: text.substring(0, MAX_TEXT_PREVIEW_LENGTH),
    found: count > 0,
  };
}

/**
 * Create a failed selector test result
 * @param {string} selector - The CSS selector that was tested
 * @param {Error | string} error - The error that occurred
 * @returns {SelectorDebugResult} Selector debug result
 */
export function createFailureSelectorResult(
  selector: string,
  error: Error | string
): SelectorDebugResult {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return {
    selector,
    count: 0,
    text: '',
    error: errorMessage,
    found: false,
  };
}

/**
 * Log successful selector test
 * @param {Logger} logger - Logger instance
 * @param {string} fieldName - The field name being tested
 * @param {string} selector - The CSS selector that was tested
 * @param {number} count - Number of elements found
 */
export function logSelectorSuccess(
  logger: Logger,
  fieldName: string,
  selector: string,
  count: number
): void {
  logger.debug(`Selector test for ${fieldName}`, {
    selector,
    count,
    found: count > 0,
  });
}

/**
 * Log failed selector test
 * @param {Logger} logger - Logger instance
 * @param {string} fieldName - The field name being tested
 * @param {Error} error - The error that occurred
 * @param {string} selector - The CSS selector that was tested
 */
export function logSelectorFailure(
  logger: Logger,
  fieldName: string,
  error: Error,
  selector: string
): void {
  logger.error(`Selector test failed for ${fieldName}`, error, { selector });
}
