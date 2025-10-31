/**
 * Debugging utilities for troubleshooting scraping issues
 */

import type { ScrapingConfig } from '../types/index.ts';
import { ConfigDebugger } from './debug-config-utils.ts';
import { DebugFileUtils } from './debug-file-utils.ts';
import { SelectorDebugger, type FieldExtractionResults } from './debug-selector-utils.ts';
import { Logger } from './logger.ts';

export interface DebugInfo {
  url: string;
  config: ScrapingConfig;
  html?: string;
  selectedElements?: FieldExtractionResults;
  extractedData?: Record<string, unknown> | Array<Record<string, unknown>>;
  errors?: string[];
  metadata?: {
    extractedAt: Date;
    selector?: string;
    extractionTime: number;
    retryCount: number;
  };
}

export interface DebugOptions {
  saveHtml?: boolean;
  saveSelections?: boolean;
  saveExtraction?: boolean;
  saveConfig?: boolean;
  outputDir?: string;
}

/**
 * Utility class for debugging web scraping operations with detailed logging and analysis capabilities
 */
export class DebugUtils {
  private logger: Logger;
  private selectorDebugger: SelectorDebugger;
  private configDebugger: ConfigDebugger;
  private fileUtils: DebugFileUtils;

  /**
   * Create a new DebugUtils instance
   * @param {string} outputDir - Directory path where debug files will be saved, defaults to 'debug'
   */
  constructor(outputDir = 'debug') {
    this.logger = Logger.getInstance();
    this.selectorDebugger = new SelectorDebugger();
    this.configDebugger = new ConfigDebugger();
    this.fileUtils = new DebugFileUtils(outputDir);
  }

  /**
   * Debug scraping process step by step with comprehensive analysis and logging
   * @param {ScrapingConfig} config - The scraping configuration to debug
   * @param {DebugOptions} options - Debug options to control what information is saved and analyzed
   * @returns {Promise<DebugInfo>} Complete debug information including HTML content, selector results, extracted data, and any errors encountered
   */
  async debugScraping(config: ScrapingConfig, options: DebugOptions = {}): Promise<DebugInfo> {
    const debugInfo = this.initializeDebugInfo(config);
    this.logger.info('Starting debug scraping', { url: config.target.url });

    try {
      await this.executeDebugSteps(config, debugInfo, options);
    } catch (error) {
      this.handleDebugError(error, debugInfo);
    }

    return debugInfo;
  }

  /**
   * Initialize debug information object
   * @param {ScrapingConfig} config - The scraping configuration
   * @returns {DebugInfo} Initial debug info object
   */
  private initializeDebugInfo(config: ScrapingConfig): DebugInfo {
    return {
      url: config.target.url,
      config,
      errors: [], // Initialize empty errors array
      metadata: {
        extractedAt: new Date(),
        extractionTime: 0,
        retryCount: 0,
      },
    };
  }

  /**
   * Execute all debug steps in sequence
   * @param {ScrapingConfig} config - The scraping configuration
   * @param {DebugInfo} debugInfo - Debug information object to update
   * @param {DebugOptions} options - Debug options
   */
  private async executeDebugSteps(
    config: ScrapingConfig,
    debugInfo: DebugInfo,
    options: DebugOptions
  ): Promise<void> {
    await this.saveConfigIfEnabled(config, debugInfo, options.saveConfig);

    const html = await this.fetchHtmlContent(config);
    debugInfo.html = html;

    await this.saveHtmlIfEnabled(config.target.url, html, debugInfo, options.saveHtml);

    const selectorResults = await this.selectorDebugger.testAllSelectors(config, html);
    debugInfo.selectedElements = selectorResults;

    await this.saveSelectionsIfEnabled(
      config.target.url,
      selectorResults,
      debugInfo,
      options.saveSelections
    );

    await this.testExtraction(config, debugInfo, options);

    await this.performAnalysisAndLogging(config, selectorResults);
  }

  /**
   * Perform configuration and selector analysis and log results
   * @param {ScrapingConfig} config - The scraping configuration
   * @param {FieldExtractionResults} selectorResults - Results from selector testing
   */
  private async performAnalysisAndLogging(
    config: ScrapingConfig,
    selectorResults: FieldExtractionResults
  ): Promise<void> {
    // Analyze configuration and log results
    const configAnalysis = this.configDebugger.analyzeConfig(config);
    this.configDebugger.logAnalysisResults(configAnalysis);

    // Analyze selector results and log suggestions
    const selectorSuggestions = this.selectorDebugger.analyzeSelectorResults(selectorResults);
    if (selectorSuggestions.length > 0) {
      this.logger.info('Selector optimization suggestions', { suggestions: selectorSuggestions });
    }
  }

  /**
   * Handle errors during debug process
   * @param {unknown} error - The error that occurred
   * @param {DebugInfo} debugInfo - Debug information object to update
   */
  private handleDebugError(error: unknown, debugInfo: DebugInfo): void {
    debugInfo.errors = [error instanceof Error ? error.message : String(error)];
    this.logger.error('Debug scraping failed', error as Error);
  }

  /**
   * Save configuration if the option is enabled
   * @param {ScrapingConfig} config - The scraping configuration to save
   * @param {DebugInfo} debugInfo - Debug information object
   * @param {boolean} saveConfig - Whether to save the configuration
   */
  private async saveConfigIfEnabled(
    config: ScrapingConfig,
    debugInfo: DebugInfo,
    saveConfig?: boolean
  ): Promise<void> {
    if (saveConfig !== false) {
      await this.fileUtils.saveConfig(config, debugInfo);
    }
  }

  /**
   * Fetch HTML content using HTTP client
   * @param {ScrapingConfig} config - The scraping configuration
   * @returns {Promise<string>} The HTML content
   */
  private async fetchHtmlContent(config: ScrapingConfig): Promise<string> {
    const { HttpClient } = await import('./http-client');
    const httpClient = new HttpClient(config.behavior);
    const response = await httpClient.fetch(config.target.url);
    return response.text();
  }

  /**
   * Save HTML content if the option is enabled
   * @param {string} url - The URL from which HTML was fetched
   * @param {string} html - The HTML content to save
   * @param {DebugInfo} debugInfo - Debug information object
   * @param {boolean} saveHtml - Whether to save the HTML content
   */
  private async saveHtmlIfEnabled(
    url: string,
    html: string,
    debugInfo: DebugInfo,
    saveHtml?: boolean
  ): Promise<void> {
    if (saveHtml !== false) {
      await this.fileUtils.saveHtml(url, html, debugInfo);
    }
  }

  /**
   * Save selector results if the option is enabled
   * @param {string} url - The URL from which selectors were tested
   * @param {FieldExtractionResults} results - The selector test results
   * @param {DebugInfo} debugInfo - Debug information object
   * @param {boolean} saveSelections - Whether to save the selector results
   */
  private async saveSelectionsIfEnabled(
    url: string,
    results: FieldExtractionResults,
    debugInfo: DebugInfo,
    saveSelections?: boolean
  ): Promise<void> {
    if (saveSelections !== false) {
      await this.fileUtils.saveSelectorResults(url, results, debugInfo);
    }
  }

  /**
   * Test data extraction with current configuration
   * @param {ScrapingConfig} config - The scraping configuration
   * @param {DebugInfo} debugInfo - Debug information object to update
   * @param {DebugOptions} options - Debug options
   */
  private async testExtraction(
    config: ScrapingConfig,
    debugInfo: DebugInfo,
    options: DebugOptions
  ): Promise<void> {
    try {
      const result = await this.performExtraction(config);
      this.updateDebugInfoWithExtractionResult(debugInfo, result);

      await this.saveExtractionResultsIfEnabled(config, result, debugInfo, options.saveExtraction);
      this.logExtractionSuccess(result);
    } catch (error) {
      this.handleExtractionError(error, debugInfo);
    }
  }

  /**
   * Save extraction results if the option is enabled
   * @param {ScrapingConfig} config - The scraping configuration
   * @param {{ data: unknown; retryCount?: number }} result - The extraction result
   * @param {unknown} result.data - The extracted data
   * @param {number} [result.retryCount] - The number of retries attempted
   * @param {DebugInfo} debugInfo - Debug information object
   * @param {boolean} saveExtraction - Whether to save extraction results
   */
  private async saveExtractionResultsIfEnabled(
    config: ScrapingConfig,
    result: { data: unknown; retryCount?: number },
    debugInfo: DebugInfo,
    saveExtraction?: boolean
  ): Promise<void> {
    if (saveExtraction) {
      const mockResult: {
        url: string;
        data: Record<string, unknown> | Array<Record<string, unknown>>;
        success: boolean;
        metadata: { extractedAt: Date; extractionTime: number; retryCount: number };
      } = {
        url: config.target.url,
        data: result.data as Record<string, unknown> | Array<Record<string, unknown>>,
        success: true,
        metadata: {
          extractedAt: new Date(),
          extractionTime: 0,
          retryCount: result.retryCount || 0,
        },
      };
      await this.fileUtils.saveExtractionResults(config.target.url, mockResult, debugInfo);
    }
  }

  /**
   * Perform the actual data extraction
   * @param {ScrapingConfig} config - The scraping configuration
   * @returns {Promise<{ data: unknown; retryCount?: number }>} The extraction result containing data and retry count
   */
  private async performExtraction(
    config: ScrapingConfig
  ): Promise<{ data: unknown; retryCount?: number }> {
    const { DataExtractor } = await import('./data-extractor');
    const extractor = new DataExtractor(config);
    const result = await extractor.extractFromConfig(config);
    return {
      data: result.data,
      retryCount: result.metadata.retryCount,
    };
  }

  /**
   * Update debug info with extraction results
   * @param {DebugInfo} debugInfo - Debug information object to update
   * @param {{ data: unknown; retryCount?: number }} result - The extraction result containing data and retry count
   * @param {unknown} result.data - The extracted data
   * @param {number} [result.retryCount] - The number of retries attempted
   */
  private updateDebugInfoWithExtractionResult(
    debugInfo: DebugInfo,
    result: { data: unknown; retryCount?: number }
  ): void {
    debugInfo.extractedData = result.data as
      | Record<string, unknown>
      | Array<Record<string, unknown>>;
    if (debugInfo.metadata) {
      debugInfo.metadata.retryCount = result.retryCount || 0;
    }
  }

  /**
   * Log successful extraction
   * @param {{ data: unknown; retryCount?: number }} result - The extraction result containing data and retry count
   * @param {unknown} result.data - The extracted data
   * @param {number} [result.retryCount] - The number of retries attempted
   */
  private logExtractionSuccess(result: { data: unknown; retryCount?: number }): void {
    const dataPoints = Array.isArray(result.data)
      ? result.data.length
      : Object.keys(result.data as Record<string, unknown>).length;
    this.logger.info('Extraction test completed', {
      dataPoints,
      retryCount: result.retryCount,
    });
  }

  /**
   * Handle extraction errors
   * @param {unknown} error - The error that occurred
   * @param {DebugInfo} debugInfo - Debug information object to update
   */
  private handleExtractionError(error: unknown, debugInfo: DebugInfo): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!debugInfo.errors) {
      debugInfo.errors = [];
    }
    debugInfo.errors.push(`Extraction failed: ${errorMessage}`);
    this.logger.error('Extraction test failed', error as Error);
  }

  /**
   * Get the output directory path
   * @returns {string} The output directory path
   */
  getOutputDirectory(): string {
    return this.fileUtils.getOutputDirectory();
  }
}
