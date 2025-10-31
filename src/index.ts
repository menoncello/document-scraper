/**
 * Document Scrape - Core scraping engine library
 * Main entry point with TypeScript API
 */

import { ConfigManager } from './core/config.ts';
import { DebugUtils } from './core/debug.ts';
import { Logger } from './core/logger.ts';
import { DocumentScraper } from './core/scraper.ts';
import type { ScrapingConfig } from './types/index.ts';

// Core classes
export { DocumentScraper } from './core/scraper.ts';
export { HttpClient } from './core/http-client.ts';
export { HtmlParser } from './core/html-parser.ts';
export { DataExtractor } from './core/data-extractor.ts';
export { ConfigManager } from './core/config.ts';
export { Logger, LogLevel } from './core/logger.ts';
export { DebugUtils } from './core/debug.ts';

// Types
export type {
  ScrapingConfig,
  ScrapingResult,
  HttpClientConfig,
  HttpResponse,
  HttpError,
  RetryConfig,
  RateLimiter,
  ParseOptions,
  ElementInfo,
  SelectorResult,
  ExtractionOptions,
  ExtractionContext,
  DataTransform,
  DataFilter,
  ConfigValidationResult,
  ConfigMergeOptions,
  LoggerConfig,
  LogEntry,
  DebugInfo,
  DebugOptions,
} from './types/index.ts';

// Convenience functions
/**
 * Creates a new DocumentScraper instance with the provided configuration.
 *
 * @param {Partial<ScrapingConfig>} config - The scraping configuration object containing settings for the scraper
 * @returns {ScrapingConfig} A new DocumentScraper instance initialized with the provided configuration
 */
export function createScraper(config: ScrapingConfig): DocumentScraper {
  return new DocumentScraper(config);
}

/**
 * Creates a new DocumentScraper instance by loading configuration from a file.
 *
 * @param {string} configPath - The file path to the configuration file containing scraper settings
 * @returns {ScrapingConfig} A new DocumentScraper instance initialized with the loaded configuration
 */
export function createScraperFromConfig(configPath: string): DocumentScraper {
  return DocumentScraper.fromConfigFile(configPath);
}

/**
 * Creates a new DocumentScraper instance with sample configuration for quick testing.
 *
 * @param {string} url - The base URL to scrape
 * @param {Record<string, string>} fields - A record mapping field names to CSS selectors for data extraction
 * @returns {unknown} A new DocumentScraper instance configured with sample settings
 */
export function createSampleScraper(url: string, fields: Record<string, string>): DocumentScraper {
  return DocumentScraper.withSampleConfig(url, fields);
}

/**
 * Loads scraping configuration from a file.
 *
 * @param {string} configPath - The file path to the configuration file to load
 * @returns {ScrapingConfig} The loaded scraping configuration object
 */
export function loadConfig(configPath: string): ScrapingConfig {
  return ConfigManager.loadFromFile(configPath);
}

/**
 * Validates a scraping configuration object.
 *
 * @param {Partial<ScrapingConfig>} config - The scraping configuration object to validate
 * @returns {ScrapingResult} A validation result object containing validity status, errors, and warnings
 */
export function validateConfig(config: ScrapingConfig): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  return ConfigManager.validate(config);
}

/**
 * Creates a new Logger instance with optional configuration.
 *
 * @param {Partial<ScrapingConfig>} config - Optional partial logger configuration to override default settings
 * @returns {unknown} A Logger instance configured with the provided or default settings
 */
export function createLogger(
  config?: Partial<import('./core/logger-types.js').LoggerConfig>
): Logger {
  return Logger.getInstance(config);
}

/**
 * Creates a new DebugUtils instance for debugging and troubleshooting operations.
 *
 * @param {string} outputDir - Optional directory path where debug files and outputs will be saved
 * @returns {DebugUtils} A new DebugUtils instance configured with the specified output directory
 */
export function createDebugUtils(outputDir?: string): DebugUtils {
  return new DebugUtils(outputDir);
}
