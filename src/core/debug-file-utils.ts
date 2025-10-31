/**
 * File utilities for debugging operations
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { ScrapingConfig } from '../types/index.ts';
import type { FieldExtractionResults } from './debug-selector-utils.ts';
import type { DebugInfo } from './debug.ts';

// Constants for magic numbers
const JSON_INDENTATION = 2;

/**
 * Utility class for saving debug information to files
 */
export class DebugFileUtils {
  private outputDir: string;

  /**
   * Initialize debug file utilities
   * @param {string} outputDir - Directory path for debug output files
   */
  constructor(outputDir = 'debug') {
    this.outputDir = outputDir;
  }

  /**
   * Save configuration to file
   * @param {ScrapingConfig} config - The scraping configuration to save
   * @param {DebugInfo} debugInfo - Debug information metadata
   */
  async saveConfig(config: ScrapingConfig, debugInfo: DebugInfo): Promise<void> {
    await this.ensureOutputDir();
    const filename = this.generateFilename('config', 'json', debugInfo);
    const filepath = join(this.outputDir, filename);
    await fs.writeFile(filepath, JSON.stringify(config, null, JSON_INDENTATION));
  }

  /**
   * Save HTML content to file
   * @param {string} url - The source URL
   * @param {string} html - The HTML content to save
   * @param {DebugInfo} debugInfo - Debug information metadata
   */
  async saveHtml(url: string, html: string, debugInfo: DebugInfo): Promise<void> {
    await this.ensureOutputDir();
    const filename = this.generateFilename('html', 'html', debugInfo);
    const filepath = join(this.outputDir, filename);
    await fs.writeFile(filepath, html);
  }

  /**
   * Save selector results to file
   * @param {string} url - The source URL
   * @param {FieldExtractionResults} results - The selector extraction results
   * @param {DebugInfo} debugInfo - Debug information metadata
   */
  async saveSelectorResults(
    url: string,
    results: FieldExtractionResults,
    debugInfo: DebugInfo
  ): Promise<void> {
    await this.ensureOutputDir();
    const filename = this.generateFilename('selectors', 'json', debugInfo);
    const filepath = join(this.outputDir, filename);
    await fs.writeFile(filepath, JSON.stringify(results, null, JSON_INDENTATION));
  }

  /**
   * Save extraction results to file
   * @param {string} url - The source URL
   * @param {object} result - The extraction result object
   * @param {string} result.url - The URL from the result
   * @param {Record<string, unknown> | Array<Record<string, unknown>>} result.data - The extracted data
   * @param {boolean} result.success - Whether the extraction was successful
   * @param {object} result.metadata - Extraction metadata
   * @param {Date} result.metadata.extractedAt - Extraction timestamp
   * @param {number} result.metadata.extractionTime - Time taken for extraction
   * @param {number} result.metadata.retryCount - Number of retry attempts
   * @param {DebugInfo} debugInfo - Debug information metadata
   */
  async saveExtractionResults(
    url: string,
    result: {
      url: string;
      data: Record<string, unknown> | Array<Record<string, unknown>>;
      success: boolean;
      metadata: { extractedAt: Date; extractionTime: number; retryCount: number };
    },
    debugInfo: DebugInfo
  ): Promise<void> {
    await this.ensureOutputDir();
    const filename = this.generateFilename('extraction', 'json', debugInfo);
    const filepath = join(this.outputDir, filename);
    await fs.writeFile(filepath, JSON.stringify(result, null, JSON_INDENTATION));
  }

  /**
   * Get output directory path
   * @returns {string} The current output directory path
   */
  getOutputDirectory(): string {
    return this.outputDir;
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDir(): Promise<void> {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate filename with timestamp
   * @param {string} type - The type of debug file
   * @param {string} extension - The file extension
   * @param {DebugInfo} debugInfo - Debug information metadata
   * @returns {string} Generated filename
   */
  private generateFilename(type: string, extension: string, debugInfo: DebugInfo): string {
    const timestamp = debugInfo.metadata?.extractedAt || new Date();
    const dateStr = timestamp.toISOString().replace(/[.:]/g, '-');
    const urlSlug = this.createUrlSlug(debugInfo.url);
    return `${urlSlug}-${type}-${dateStr}.${extension}`;
  }

  /**
   * Create URL-safe slug from URL
   * @param {string} url - The URL to create a slug from
   * @returns {string} URL-safe slug string
   */
  private createUrlSlug(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/[^\dA-Za-z]/g, '-');
    } catch {
      return 'unknown-url';
    }
  }
}
