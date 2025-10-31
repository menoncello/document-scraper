/**
 * Data extraction pipeline with CSS selectors and transformation utilities
 */
import type { ScrapingConfig, ScrapingResult } from '../types/index.ts';
import {
  type DataTransform,
  type DataFilter,
  applyTransforms,
  applyFilters,
  normalizeData,
} from './data-transformer.ts';
import {
  normalizeValue as normalizeValueUtil,
  filterEmptyData as filterEmptyDataUtil,
  type ExtractableElement,
} from './extraction-utils.ts';
import {
  extractTextValue,
  extractAttributeValue,
  extractItemFromElement,
} from './field-extractor.ts';
import { getHtmlParserInstance } from './html-parser-instance.ts';
import { HtmlParser } from './html-parser.ts';
import { HttpClient } from './http-client.ts';
import {
  createMinimalConfig,
  createBaseMultipleConfig,
  createUrlConfig,
  createExtractionContext,
  sleep,
} from './utils/extraction-helpers.ts';
import {
  createSuccessResult,
  createFailureResult,
  createEmptyFailureResult,
} from './utils/result-factory.ts';

export interface ExtractionOptions {
  includeMetadata?: boolean;
  transformData?: boolean;
  normalizeData?: boolean;
  filterEmpty?: boolean;
}
export interface ExtractionContext {
  url: string;
  config: ScrapingConfig;
  startTime: number;
  retryCount: number;
}
/**
 * Main data extraction class that handles web scraping, data transformation, and filtering
 */
export class DataExtractor {
  private httpClient: HttpClient;
  private htmlParser: HtmlParser;
  private transforms: DataTransform[] = [];
  private filters: DataFilter[] = [];
  /**
   * Initialize the DataExtractor with scraping configuration
   * @param {Partial<ScrapingConfig>} config - The scraping configuration containing behavior settings
   */
  constructor(config: ScrapingConfig) {
    this.httpClient = new HttpClient(config.behavior);
    this.htmlParser = new HtmlParser({
      normalizeWhitespace: true,
      removeEmptyElements: false,
      decodeEntities: true,
    });
  }
  /**
   * Extract data from a single URL
   * @param {string} url - The URL to extract data from
   * @param {ExtractionOptions} options - Extraction options for controlling the extraction process
   * @returns {ScrapingResult} Promise resolving to the scraping result with extracted data and metadata
   */
  async extractFromUrl(url: string, options: ExtractionOptions = {}): Promise<ScrapingResult> {
    const httpConfig = this.httpClient.getConfig();
    const minimalConfig = createMinimalConfig(url, httpConfig);
    return this.extractFromConfig(minimalConfig, options);
  }
  /**
   * Extract data from a configuration
   * @param {Partial<ScrapingConfig>} config - The scraping configuration containing target and extraction settings
   * @param {ExtractionOptions} options - Extraction options for controlling the extraction process
   * @returns {ScrapingResult} Promise resolving to the scraping result with extracted data and metadata
   */
  async extractFromConfig(
    config: ScrapingConfig,
    options: ExtractionOptions = {}
  ): Promise<ScrapingResult> {
    const context = createExtractionContext(config);
    try {
      const rawData = await this.fetchAndParseContent(config, context);
      const processedData = this.processExtractedData(rawData, config, options, context);
      const extractionTime = Date.now() - context.startTime;
      return createSuccessResult(config.target.url, {
        selector: config.target.selector,
        data: processedData,
        extractionTime,
        retryCount: context.retryCount,
      });
    } catch {
      const extractionTime = Date.now() - context.startTime;
      return createFailureResult(config.target.url, {
        selector: config.target.selector,
        isMultiple: config.extraction.multiple ?? false,
        extractionTime,
        retryCount: context.retryCount,
      });
    }
  }
  /**
   * Fetch web page and parse HTML content
   * @param {Partial<ScrapingConfig>} config - The scraping configuration
   * @param {ExtractionContext} context - The extraction context
   * @returns {unknown} Promise resolving to the extracted raw data
   */
  private async fetchAndParseContent(
    config: ScrapingConfig,
    context: ExtractionContext
  ): Promise<Record<string, unknown> | Array<Record<string, unknown>>> {
    const response = await this.httpClient.fetch(config.target.url);
    await this.htmlParser.loadFromResponse(response);
    if (config.target.waitFor && config.target.waitFor > 0) {
      await sleep(config.target.waitFor);
    }
    return this.extractData(config, context);
  }
  /**
   * Process extracted data through transformations, filters, and normalization
   * @param {Record<string, unknown> | Array<Record<string, unknown>>} data - The raw extracted data
   * @param {Partial<ScrapingConfig>} config - The scraping configuration
   * @param {ExtractionOptions} options - Extraction options
   * @param {ExtractionContext} context - The extraction context
   * @returns {unknown} The processed data
   */
  private processExtractedData(
    data: Record<string, unknown> | Array<Record<string, unknown>>,
    config: ScrapingConfig,
    options: ExtractionOptions,
    context: ExtractionContext
  ): Record<string, unknown> | Array<Record<string, unknown>> {
    let processedData = data;
    if (options.transformData !== false) {
      processedData = applyTransforms(processedData, this.transforms, context) as
        | Record<string, unknown>
        | Array<Record<string, unknown>>;
    }
    processedData = applyFilters(processedData, this.filters, context) as
      | Record<string, unknown>
      | Array<Record<string, unknown>>;
    if (options.normalizeData !== false) {
      processedData = normalizeData(processedData, normalizeValueUtil) as
        | Record<string, unknown>
        | Array<Record<string, unknown>>;
    }
    if (options.filterEmpty !== false) {
      processedData = filterEmptyDataUtil(processedData) as
        | Record<string, unknown>
        | Array<Record<string, unknown>>;
    }
    return processedData;
  }
  /**
   * Extract data from multiple URLs
   * @param {string[]} urls - Array of URLs to extract data from
   * @param {ExtractionOptions} options - Extraction options for controlling the extraction process
   * @returns {ScrapingResult} Promise resolving to an array of scraping results
   */
  async extractFromMultipleUrls(
    urls: string[],
    options: ExtractionOptions = {}
  ): Promise<ScrapingResult[]> {
    const baseConfig = this.createBaseMultipleConfig();
    const results: ScrapingResult[] = [];
    for (const url of urls) {
      const result = await this.extractFromSingleUrlWithErrorHandling(url, baseConfig, options);
      results.push(result);
    }
    return results;
  }
  /**
   * Create base configuration for multiple URL extraction
   * @returns {ScrapingConfig} Base scraping configuration
   */
  private createBaseMultipleConfig(): ScrapingConfig {
    const httpConfig = this.httpClient.getConfig();
    return createBaseMultipleConfig(httpConfig);
  }
  /**
   * Extract data from a single URL with error handling
   * @param {string} url - The URL to extract data from
   * @param {ScrapingConfig} baseConfig - Base configuration to use
   * @param {ExtractionOptions} options - Extraction options
   * @returns {ScrapingResult} Promise resolving to scraping result
   */
  private async extractFromSingleUrlWithErrorHandling(
    url: string,
    baseConfig: ScrapingConfig,
    options: ExtractionOptions
  ): Promise<ScrapingResult> {
    try {
      const urlConfig = createUrlConfig(baseConfig, url);
      return await this.extractFromConfig(urlConfig, options);
    } catch {
      return createEmptyFailureResult(url);
    }
  }
  /**
   * Extract data using configuration
   * @param {Partial<ScrapingConfig>} config - The scraping configuration containing extraction rules
   * @param {ExtractionContext} context - The extraction context containing URL and metadata
   * @returns {Array<Record<string, unknown>>} Promise resolving to the extracted data (object or array)
   */
  private async extractData(
    config: ScrapingConfig,
    context: ExtractionContext
  ): Promise<Record<string, unknown> | Array<Record<string, unknown>>> {
    const { fields, multiple } = config.extraction;
    const selector = config.target.selector || 'body';
    // Handle empty fields case
    if (!fields || Object.keys(fields).length === 0) {
      if (multiple) {
        return this.extractMultipleItemsWithEmptyFields(selector);
      }
      return this.extractSingleItemWithEmptyFields();
    }
    if (multiple) {
      return this.extractMultipleItems(selector, fields);
    }
    return this.extractSingleItem(fields, context);
  }
  /**
   * Extract multiple items from the page
   * @param {string} selector - CSS selector to find multiple elements
   * @param {Record<string, string>} fields - Field configuration for extraction
   * @returns {unknown} Array of extracted items
   */
  private extractMultipleItems(
    selector: string,
    fields: Record<string, string>
  ): Array<Record<string, unknown>> {
    const elements = this.htmlParser.select(selector);
    const results: Array<Record<string, unknown>> = [];
    if (elements.matches) {
      elements.matches.each((_: unknown, element: unknown) => {
        const element$ = getHtmlParserInstance(this.htmlParser, element);
        if (!element$) return;
        // Type cast to ExtractableElement since we know it comes from the HTML parser
        const extractableElement = element$ as ExtractableElement;
        const item = extractItemFromElement(extractableElement, fields);
        if (Object.keys(item).length > 0) {
          results.push(item);
        }
      });
    }
    return results;
  }
  /**
   * Extract multiple items with empty fields configuration
   * @param {string} selector - CSS selector to find multiple elements
   * @returns {Array<Record<string, unknown>>} Array of empty items
   */
  private extractMultipleItemsWithEmptyFields(selector: string): Array<Record<string, unknown>> {
    const elements = this.htmlParser.select(selector);
    const results: Array<Record<string, unknown>> = [];
    if (elements.matches) {
      elements.matches.each((_: unknown, _element: unknown) => {
        results.push({});
      });
    }
    return results;
  }
  /**
   * Extract a single item from the page
   * @param {Record<string, string>} fields - Field configuration for extraction
   * @param {ExtractionContext} context - The extraction context
   * @returns {unknown} Single extracted item
   */
  private extractSingleItem(
    fields: Record<string, string>,
    context: ExtractionContext
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [fieldName, fieldSelector] of Object.entries(fields)) {
      const value = this.extractFieldValue(fieldSelector, context);
      result[fieldName] = value;
    }
    return result;
  }
  /**
   * Extract a single item with empty fields configuration
   * @returns {Record<string, unknown>} Empty item
   */
  private extractSingleItemWithEmptyFields(): Record<string, unknown> {
    return {};
  }
  /**
   * Extract value for a specific field
   * @param {string} selector - CSS selector for the field to extract
   * @param {ExtractionContext} _context - The extraction context containing URL and metadata (currently unused)
   * @returns {string} The extracted value as a string
   */
  private extractFieldValue(selector: string, _context: ExtractionContext): string {
    const result = this.htmlParser.select(selector);
    if (result.count === 0) {
      return '';
    }
    const textValue = extractTextValue(result);
    if (textValue) {
      return textValue;
    }
    return extractAttributeValue(result);
  }
  /**
   * Add a data transformation
   * @param {string} field - The field name to apply the transformation to
   * @param {DataTransform} transform - The transformation function to apply to the field value
   */
  addTransform(
    field: string,
    transform: (value: string, context: ExtractionContext) => unknown
  ): void {
    this.transforms.push({ field, transform });
  }
  /**
   * Add a data filter
   * @param {string} field - The field name to apply the filter to
   * @param {DataFilter} filter - The filter function to determine if the item should be included
   */
  addFilter(field: string, filter: (value: unknown, context: ExtractionContext) => boolean): void {
    this.filters.push({ field, filter });
  }
  /**
   * Clear all transformations
   */
  clearTransforms(): void {
    this.transforms = [];
  }
  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filters = [];
  }
  /**
   * Update HTTP client configuration
   * @param {Partial<ScrapingConfig>} config - Partial scraping configuration to update
   */
  updateConfig(config: Partial<ScrapingConfig>): void {
    if (config.behavior) {
      this.httpClient.updateConfig(config.behavior);
    }
  }
  /**
   * Get HTML parser instance for advanced usage
   * @returns {unknown} The HTML parser instance
   */
  getHtmlParser(): HtmlParser {
    return this.htmlParser;
  }
  /**
   * Get HTTP client instance for advanced usage
   * @returns {unknown} The HTTP client instance
   */
  getHttpClient(): HttpClient {
    return this.httpClient;
  }
}
