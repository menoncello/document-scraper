/**
 * Helper utilities for data extraction
 */

import type { ScrapingConfig, HttpClientConfig } from '../../types/index.ts';
import { type ExtractionContext } from '../data-extractor.ts';

/**
 * Create a completely clean fields object that is immune to global state pollution
 * @param {Record<string, string>} initialProps - Initial properties to add
 * @returns {Record<string, string>} A clean fields object
 */
function createCleanFieldsObject(
  initialProps: Record<string, string> = {}
): Record<string, string> {
  // Create a completely isolated object with no prototype
  const fields = Object.create(null);

  // Add only the specified properties
  for (const [key, value] of Object.entries(initialProps)) {
    Object.defineProperty(fields, key, {
      value,
      enumerable: true,
      writable: false,
      configurable: false,
    });
  }

  // Return a frozen copy to prevent modifications
  return Object.freeze(fields);
}

/**
 * Create a minimal scraping configuration for single URL extraction
 * @param {string} url - The URL to extract data from
 * @param {HttpClientConfig} httpConfig - HTTP configuration to use
 * @returns {ScrapingConfig} Minimal scraping configuration
 */
export function createMinimalConfig(url: string, httpConfig: HttpClientConfig): ScrapingConfig {
  return {
    target: { url },
    extraction: {
      fields: createCleanFieldsObject(),
    },
    output: { format: 'json' },
    behavior: httpConfig,
  };
}

/**
 * Create a base configuration for multiple URL extraction
 * @param {HttpClientConfig} httpConfig - HTTP configuration to use
 * @returns {ScrapingConfig} Base scraping configuration for multiple URLs
 */
export function createBaseMultipleConfig(httpConfig: HttpClientConfig): ScrapingConfig {
  return {
    target: { url: '', selector: 'body' }, // Will be overridden
    extraction: {
      fields: createCleanFieldsObject({ dummy: 'dummy' }),
      multiple: true,
    },
    output: { format: 'json' },
    behavior: httpConfig,
  };
}

/**
 * Create URL-specific configuration from base configuration
 * @param {ScrapingConfig} baseConfig - Base configuration to use
 * @param {string} url - URL to create configuration for
 * @returns {ScrapingConfig} URL-specific configuration
 */
export function createUrlConfig(baseConfig: ScrapingConfig, url: string): ScrapingConfig {
  return { ...baseConfig, target: { ...baseConfig.target, url } };
}

/**
 * Create extraction context for a configuration
 * @param {Partial<ScrapingConfig>} config - The scraping configuration
 * @returns {unknown} Extraction context
 */
export function createExtractionContext(config: ScrapingConfig): ExtractionContext {
  return {
    url: config.target.url,
    config,
    startTime: Date.now(),
    retryCount: 0,
  };
}

/**
 * Sleep helper function
 * @param {number} ms - Number of milliseconds to sleep
 * @returns {Promise<void>} Promise that resolves after the specified delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
