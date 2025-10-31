/**
 * Configuration debugging utilities
 */

import type { ScrapingConfig } from '../types/index.ts';
import { Logger } from './logger.ts';

export interface ConfigAnalysis {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Utility class for debugging scraping configurations
 */
export class ConfigDebugger {
  private logger = new Logger({ enableConsole: true, enableFile: false });
  /**
   * Analyze scraping configuration for potential issues
   * @param {ScrapingConfig} config - The scraping configuration to analyze
   * @returns {ConfigAnalysis} Analysis results containing issues, warnings, and suggestions
   */
  analyzeConfig(config: ScrapingConfig): ConfigAnalysis {
    const issues: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate URL
    if (!config.target.url) {
      issues.push('Target URL is required');
    } else if (!this.isValidUrl(config.target.url)) {
      issues.push('Invalid target URL format');
    }

    // Validate selectors
    if (!config.target.selector) {
      issues.push('Target selector is required');
    }

    // Validate fields
    if (!config.extraction.fields || Object.keys(config.extraction.fields).length === 0) {
      warnings.push('No extraction fields defined');
    }

    // Check for common improvements
    if (config.behavior?.timeout === undefined) {
      suggestions.push('Consider setting a timeout for HTTP requests');
    }

    if (!config.behavior?.rateLimit) {
      suggestions.push('Consider setting rate limiting to avoid overwhelming the target server');
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      suggestions,
    };
  }

  /**
   * Log analysis results
   * @param {ConfigAnalysis} analysis - The configuration analysis results to log
   */
  logAnalysisResults(analysis: ConfigAnalysis): void {
    if (analysis.issues.length > 0) {
      this.logger.error('Configuration Issues:', undefined, { analysisIssues: analysis.issues });
    }
    if (analysis.warnings.length > 0) {
      this.logger.warn('Configuration Warnings:', { warnings: analysis.warnings });
    }
    if (analysis.suggestions.length > 0) {
      this.logger.info('Configuration Suggestions:', { suggestions: analysis.suggestions });
    }
  }

  /**
   * Check if URL is valid
   * @param {string} url - The URL to validate
   * @returns {boolean} True if the URL is valid, false otherwise
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
