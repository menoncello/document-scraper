/**
 * Factory functions for creating scraping results
 */

import type { ScrapingResult } from '../../types/index.ts';

interface SuccessResultParams {
  selector: string | undefined;
  data: Record<string, unknown> | Array<Record<string, unknown> | unknown>;
  extractionTime: number;
  retryCount: number;
}

interface FailureResultParams {
  selector: string | undefined;
  isMultiple: boolean;
  extractionTime: number;
  retryCount: number;
}

/**
 * Create a successful scraping result
 * @param {string} url - The URL that was scraped
 * @param {SuccessResultParams} params - Result parameters including selector, data, extraction time, and retry count
 * @returns {ScrapingResult} The scraping result
 */
export function createSuccessResult(url: string, params: SuccessResultParams): ScrapingResult {
  return {
    url,
    data: params.data,
    success: true,
    metadata: {
      extractedAt: new Date(),
      selector: params.selector,
      extractionTime: params.extractionTime,
      retryCount: params.retryCount,
    },
  };
}

/**
 * Create a failed scraping result
 * @param {string} url - The URL that failed to scrape
 * @param {FailureResultParams} params - Failure parameters including selector, multiple flag, extraction time, and retry count
 * @returns {ScrapingResult} The scraping result with empty data
 */
export function createFailureResult(url: string, params: FailureResultParams): ScrapingResult {
  return {
    url,
    data: params.isMultiple ? [] : {},
    success: false,
    error: 'Extraction failed',
    metadata: {
      extractedAt: new Date(),
      selector: params.selector,
      extractionTime: params.extractionTime,
      retryCount: params.retryCount,
    },
  };
}

/**
 * Create an empty failure result for multiple URL extraction
 * @param {string} url - The URL that failed to scrape
 * @returns {ScrapingResult} The scraping result with empty array data
 */
export function createEmptyFailureResult(url: string): ScrapingResult {
  return {
    url,
    data: [],
    success: false,
    error: 'Empty result',
    metadata: {
      extractedAt: new Date(),
      extractionTime: 0,
      retryCount: 0,
    },
  };
}
