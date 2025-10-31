/**
 * Configuration management system with YAML/JSON support and validation
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import * as yaml from 'yaml';
import type { ScrapingConfig } from '../types/index.ts';
import { deepMerge } from './config-merger.ts';
import { validateConfig } from './config-validator.ts';

// Constants for magic numbers
const DEFAULT_WAIT_TIME = 5000;
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY = 1000;
const DEFAULT_RATE_LIMIT = 10;
const YAML_INDENT = 2;
const JSON_INDENT = 2;

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ConfigMergeOptions {
  deep?: boolean;
  overwrite?: boolean;
}

/**
 * Configuration manager class that handles loading, validating, and managing scraping configurations.
 * Supports both YAML and JSON configuration files with validation and default value merging.
 */
export class ConfigManager {
  private static readonly DEFAULT_CONFIG: Partial<ScrapingConfig> = {
    target: {
      url: '', // Will be validated later
      waitFor: DEFAULT_WAIT_TIME,
    },
    extraction: {
      fields: {}, // Will be validated later
      multiple: false,
    },
    output: {
      format: 'json',
    },
    behavior: {
      retryAttempts: DEFAULT_RETRY_ATTEMPTS,
      retryDelay: DEFAULT_RETRY_DELAY,
      rateLimit: DEFAULT_RATE_LIMIT,
      userAgent: 'docs-scrape/1.0.0 (+https://github.com/docs-scrape)',
    },
  };

  /**
   * Load configuration from a file supporting YAML and JSON formats.
   * The configuration is merged with default values and validated before being returned.
   * @param {string} configPath - The path to the configuration file (YAML or JSON)
   * @returns {ScrapingConfig} {ScrapingConfig} A complete and validated scraping configuration object
   */
  static loadFromFile(configPath: string): ScrapingConfig {
    const fullPath = resolve(configPath);

    if (!existsSync(fullPath)) {
      throw new Error(`Configuration file not found: ${fullPath}`);
    }

    const content = readFileSync(fullPath, 'utf-8');
    const ext = extname(fullPath).toLowerCase();

    let config: Partial<ScrapingConfig>;

    try {
      switch (ext) {
        case '.yaml':
        case '.yml':
          config = yaml.parse(content) as Partial<ScrapingConfig>;
          break;
        case '.json':
          config = JSON.parse(content) as Partial<ScrapingConfig>;
          break;
        default:
          throw new Error(`Unsupported configuration file format: ${ext}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse configuration file ${fullPath}: ${error.message}`);
      }
      throw error;
    }

    // Merge with defaults
    return this.mergeWithDefaults(config);
  }

  /**
   * Create a configuration object from a partial configuration object.
   * The partial configuration is merged with default values and validated.
   * @param {Partial<ScrapingConfig>} config - A partial configuration object with custom settings
   * @returns {ScrapingConfig} {ScrapingConfig} A complete and validated scraping configuration object
   */
  static fromObject(config: Partial<ScrapingConfig>): ScrapingConfig {
    return this.mergeWithDefaults(config);
  }

  /**
   * Merge a partial configuration with default values and validate required fields.
   * Ensures all required configuration properties are present and valid.
   * @param {Partial<ScrapingConfig>} config - A partial configuration object to merge with defaults
   * @returns {ScrapingConfig} {ScrapingConfig} A complete and validated scraping configuration object
   */
  private static mergeWithDefaults(config: Partial<ScrapingConfig>): ScrapingConfig {
    const merged = deepMerge(this.DEFAULT_CONFIG, config) as Partial<ScrapingConfig>;

    this.validateRequiredFields(merged);

    return this.buildFinalConfig(merged);
  }

  /**
   * Validate that all required fields are present in the merged configuration.
   * @param {Partial<ScrapingConfig>} merged - The merged configuration to validate
   * @throws {Error} Error if required fields are missing
   */
  private static validateRequiredFields(merged: Partial<ScrapingConfig>): void {
    if (!merged.target?.url) {
      throw new Error('Configuration must include target.url');
    }

    if (!merged.extraction?.fields || Object.keys(merged.extraction.fields).length === 0) {
      throw new Error('Configuration must include extraction.fields with at least one field');
    }
  }

  /**
   * Build the final configuration object with all required properties.
   * @param {Partial<ScrapingConfig>} merged - The validated merged configuration
   * @returns {ScrapingConfig} A complete and validated scraping configuration object
   */
  private static buildFinalConfig(merged: Partial<ScrapingConfig>): ScrapingConfig {
    const targetUrl = this.ensureString(merged.target?.url, 'target.url');
    const extractionFields = this.ensureRecord(merged.extraction?.fields, 'extraction.fields');

    return {
      target: this.buildTargetConfig(merged, targetUrl),
      extraction: this.buildExtractionConfig(merged, extractionFields),
      output: this.buildOutputConfig(merged),
      behavior: this.buildBehaviorConfig(merged),
    };
  }

  /**
   * Build the target configuration section.
   * @param {Partial<ScrapingConfig>} merged - The merged configuration
   * @param {string} url - The validated target URL
   * @returns {ScrapingConfig} The target configuration
   */
  private static buildTargetConfig(
    merged: Partial<ScrapingConfig>,
    url: string
  ): ScrapingConfig['target'] {
    return {
      url,
      selector: merged.target?.selector,
      waitFor: merged.target?.waitFor ?? DEFAULT_WAIT_TIME,
    };
  }

  /**
   * Build the extraction configuration section.
   * @param {Partial<ScrapingConfig>} merged - The merged configuration
   * @param {Record<string, string>} fields - The validated extraction fields
   * @returns {ScrapingConfig} The extraction configuration
   */
  private static buildExtractionConfig(
    merged: Partial<ScrapingConfig>,
    fields: Record<string, string>
  ): ScrapingConfig['extraction'] {
    return {
      fields,
      multiple: merged.extraction?.multiple ?? false,
    };
  }

  /**
   * Build the output configuration section.
   * @param {Partial<ScrapingConfig>} merged - The merged configuration
   * @returns {ScrapingConfig} The output configuration
   */
  private static buildOutputConfig(merged: Partial<ScrapingConfig>): ScrapingConfig['output'] {
    return {
      format: merged.output?.format ?? 'json',
      filename: merged.output?.filename,
      database: merged.output?.database,
    };
  }

  /**
   * Build the behavior configuration section.
   * @param {Partial<ScrapingConfig>} merged - The merged configuration
   * @returns {ScrapingConfig} The behavior configuration
   */
  private static buildBehaviorConfig(merged: Partial<ScrapingConfig>): ScrapingConfig['behavior'] {
    return {
      retryAttempts: merged.behavior?.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS,
      retryDelay: merged.behavior?.retryDelay ?? DEFAULT_RETRY_DELAY,
      rateLimit: merged.behavior?.rateLimit ?? DEFAULT_RATE_LIMIT,
      userAgent: merged.behavior?.userAgent,
      headers: merged.behavior?.headers,
    };
  }

  /**
   * Ensure a value is a string and not null/undefined.
   * @param {string | number | boolean} value - The value to check
   * @param {string} fieldName - The field name for error messages
   * @returns {string} The validated string value
   * @throws Error if the value is not a string or is null/undefined
   */
  private static ensureString(value: unknown, fieldName: string): string {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  /**
   * Ensure a value is a record with string keys and values.
   * @param {string | number | boolean} value - The value to check
   * @param {string} fieldName - The field name for error messages
   * @returns {Record<string, unknown>} The validated record
   * @throws Error if the value is not a record or is empty
   */
  private static ensureRecord(value: unknown, fieldName: string): Record<string, string> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      const hasValidEntries =
        Object.keys(record).length > 0 &&
        Object.values(record).every(v => typeof v === 'string' && v.length > 0);

      if (hasValidEntries) {
        return record as Record<string, string>;
      }
    }
    throw new Error(`${fieldName} must be a non-empty object with string values`);
  }

  /**
   * Validate a scraping configuration object and return validation results.
   * Checks for required fields, proper data types, and logical constraints.
   * @param {Partial<ScrapingConfig>} config - The scraping configuration object to validate
   * @returns {ScrapingResult} A validation result containing errors and warnings
   */
  static validate(config: ScrapingConfig): ConfigValidationResult {
    return validateConfig(config);
  }

  /**
   * Save a configuration object to a file in YAML or JSON format.
   * The output format is determined by the file extension.
   * @param {Partial<ScrapingConfig>} config - The scraping configuration object to save
   * @param {string} configPath - The path where the configuration file should be saved
   */
  static saveToFile(config: ScrapingConfig, configPath: string): void {
    const fullPath = resolve(configPath);
    const ext = extname(fullPath).toLowerCase();

    let content: string;

    switch (ext) {
      case '.yaml':
      case '.yml':
        content = yaml.stringify(config, {
          indent: YAML_INDENT,
          lineWidth: 0,
          minContentWidth: 0,
        });
        break;
      case '.json':
        content = JSON.stringify(config, null, JSON_INDENT);
        break;
      default:
        throw new Error(`Unsupported configuration file format: ${ext}`);
    }

    try {
      // For YAML, validate by parsing it back
      if (ext === '.yaml' || ext === '.yml') {
        yaml.parse(content);
      } else {
        JSON.parse(content); // Validate JSON format
      }
    } catch {
      throw new Error(`Failed to serialize configuration`);
    }
  }

  /**
   * Create a sample configuration object with typical settings for web scraping.
   * Includes example target URL, extraction fields, output settings, and behavior options.
   * @returns {ScrapingConfig} A sample scraping configuration object that can be used as a template
   */
  static createSample(): ScrapingConfig {
    return {
      target: {
        url: 'https://example.com',
        selector: 'article',
        waitFor: DEFAULT_WAIT_TIME,
      },
      extraction: {
        fields: {
          title: 'h1',
          content: '.content',
          author: '.author',
          date: '.date',
        },
        multiple: true,
      },
      output: {
        format: 'json',
        filename: 'extracted-data.json',
      },
      behavior: {
        retryAttempts: DEFAULT_RETRY_ATTEMPTS,
        retryDelay: DEFAULT_RETRY_DELAY,
        rateLimit: DEFAULT_RATE_LIMIT,
        userAgent: 'docs-scrape/1.0.0',
        headers: { 'Accept-Language': 'en-US,en;q=0.9' },
      },
    };
  }

  /**
   * Validate a configuration object and throw an error if validation fails.
   * This is a convenience method that combines validation with error handling.
   * @param {Partial<ScrapingConfig>} config - The scraping configuration object to validate
   * @throws An error with detailed validation messages if the configuration is invalid
   */
  static validateOrThrow(config: ScrapingConfig): void {
    const validation = this.validate(config);
    if (!validation.valid) {
      const errorMessage = `Configuration validation failed:\n${validation.errors.join('\n')}`;
      throw new Error(errorMessage);
    }
  }
}
