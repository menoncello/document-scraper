/**
 * Main DocumentScraper class - Core scraping engine
 */

import type { ScrapingConfig, ScrapingResult } from '../types/index.ts';
import { ConfigManager } from './config.ts';
import { DataExtractor } from './data-extractor.ts';

/**
 * Main DocumentScraper class - Core scraping engine
 * Provides high-level interface for web scraping with configurable extraction rules
 */
export class DocumentScraper {
  private config: ScrapingConfig;
  private extractor: DataExtractor;

  /**
   * Create a new DocumentScraper instance with the provided configuration
   * @param {Partial<ScrapingConfig>} config - The scraping configuration containing target URL, extraction rules, and options
   */
  constructor(config: ScrapingConfig) {
    // Validate configuration
    ConfigManager.validateOrThrow(config);

    this.config = { ...config };
    this.extractor = new DataExtractor(config);
  }

  /**
   * Scrape data from the configured URL
   * @returns {ScrapingResult} Promise that resolves to the scraping result containing extracted data and metadata
   */
  async scrape(): Promise<ScrapingResult> {
    return this.extractor.extractFromConfig(this.config);
  }

  /**
   * Scrape data from multiple URLs using the current configuration
   * @param {string[]} urls - Array of URLs to scrape data from
   * @returns {Promise<ScrapingResult[]>} Promise that resolves to an array of scraping results, one for each URL
   */
  async scrapeMultiple(urls: string[]): Promise<ScrapingResult[]> {
    return this.extractor.extractFromMultipleUrls(urls);
  }

  /**
   * Update configuration with partial changes
   * @param {Partial<ScrapingConfig>} config - Partial configuration object containing only the properties to update
   */
  setConfig(config: Partial<ScrapingConfig>): void {
    this.config = ConfigManager.fromObject({ ...this.config, ...config });
    this.extractor.updateConfig(this.config);
  }

  /**
   * Get current configuration
   * @returns {ScrapingConfig} A copy of the current scraping configuration
   */
  getConfig(): ScrapingConfig {
    return { ...this.config };
  }

  /**
   * Create scraper from configuration file
   * @param {string} configPath - Path to the configuration file containing scraping settings
   * @returns {unknown} A new DocumentScraper instance configured with settings from the file
   */
  static fromConfigFile(configPath: string): DocumentScraper {
    const config = ConfigManager.loadFromFile(configPath);
    return new DocumentScraper(config);
  }

  /**
   * Create scraper with sample configuration
   * @param {string} url - The target URL to scrape
   * @param {Record<string, string>} fields - Object mapping field names to CSS selectors for data extraction
   * @returns {ScrapingConfig} A new DocumentScraper instance with basic configuration for the specified URL and fields
   */
  static withSampleConfig(url: string, fields: Record<string, string>): DocumentScraper {
    const config = ConfigManager.createSample();
    config.target.url = url;
    config.extraction.fields = fields;
    return new DocumentScraper(config);
  }

  /**
   * Validate current configuration
   * @returns {ScrapingResult} Validation result containing validity status, errors, and warnings
   */
  validateConfig(): { valid: boolean; errors: string[]; warnings: string[] } {
    return ConfigManager.validate(this.config);
  }

  /**
   * Get data extractor for advanced usage
   * @returns {unknown} The DataExtractor instance for performing low-level extraction operations
   */
  getExtractor(): DataExtractor {
    return this.extractor;
  }
}

// Export types
export type { ScrapingConfig, ScrapingResult } from '../types/index.ts';
