/**
 * Configuration validation utilities for scraping configurations.
 */

import type { ScrapingConfig } from '../types/index.ts';
import type { ConfigValidationResult } from './config.ts';

// Constants for validation limits
const MAX_WAIT_TIME_WARNING = 60000;
const MAX_RETRY_ATTEMPTS_WARNING = 10;
const MIN_RETRY_DELAY_WARNING = 100;
const MAX_RATE_LIMIT_WARNING = 1000;

/**
 * Validates a scraping configuration object and return validation results.
 * Checks for required fields, proper data types, and logical constraints.
 * @param {ScrapingConfig} config - The scraping configuration object to validate
 * @returns {ScrapingResult} {ConfigValidationResult} A validation result containing errors and warnings
 */
export function validateConfig(config: ScrapingConfig): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  validateTarget(config.target, errors, warnings);
  validateExtraction(config.extraction, errors);
  validateOutput(config.output, errors);
  validateBehavior(config.behavior, errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates the target configuration section.
 * @param {ScrapingConfig['target']} target - The target configuration to validate
 * @param {string[]} errors - Array to collect validation errors
 * @param {string[]} warnings - Array to collect validation warnings
 */
function validateTarget(
  target: ScrapingConfig['target'],
  errors: string[],
  warnings: string[]
): void {
  if (!target) {
    errors.push('Target configuration is required');
    return;
  }

  if (!target.url) {
    errors.push('Target URL is required');
    return;
  }

  if (!isValidUrl(target.url)) {
    errors.push('Target URL is invalid');
  }

  if (target.waitFor !== undefined) {
    validateWaitTime(target.waitFor, errors, warnings);
  }
}

/**
 * Validates the extraction configuration section.
 * @param {ScrapingConfig['extraction']} extraction - The extraction configuration to validate
 * @param {string[]} errors - Array to collect validation errors
 */
function validateExtraction(extraction: ScrapingConfig['extraction'], errors: string[]): void {
  if (!extraction) {
    errors.push('Extraction configuration is required');
    return;
  }

  if (!extraction.fields || Object.keys(extraction.fields).length === 0) {
    errors.push('Extraction fields must include at least one field definition');
    return;
  }

  validateExtractionFields(extraction.fields, errors);

  if (extraction.multiple !== undefined && typeof extraction.multiple !== 'boolean') {
    errors.push('Extraction multiple must be a boolean');
  }
}

/**
 * Validates the output configuration section.
 * @param {ScrapingConfig['output']} output - The output configuration to validate
 * @param {string[]} errors - Array to collect validation errors
 */
function validateOutput(output: ScrapingConfig['output'], errors: string[]): void {
  if (!output) {
    errors.push('Output configuration is required');
    return;
  }

  validateOutputFormat(output.format, errors);

  if (output.format === 'database') {
    validateDatabaseConfig(output.database, errors);
  }
}

/**
 * Validates the behavior configuration section.
 * @param {ScrapingConfig['behavior']} behavior - The behavior configuration to validate
 * @param {string[]} errors - Array to collect validation errors
 * @param {string[]} warnings - Array to collect validation warnings
 */
function validateBehavior(
  behavior: ScrapingConfig['behavior'],
  errors: string[],
  warnings: string[]
): void {
  if (!behavior) {
    errors.push('Behavior configuration is required');
    return;
  }

  validateRetryBehavior(behavior, errors, warnings);
  validateRateLimit(behavior.rateLimit, errors, warnings);
  validateUserAgent(behavior.userAgent, errors);
  validateHeaders(behavior.headers, errors);
}

/**
 * Checks if a URL is valid.
 * @param {string} url - The URL to validate
 * @returns {boolean} {boolean} True if the URL is valid, false otherwise
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates the wait time configuration.
 * @param {number} waitTime - The wait time to validate in milliseconds
 * @param {string[]} errors - Array to collect validation errors
 * @param {string[]} warnings - Array to collect validation warnings
 */
function validateWaitTime(waitTime: number, errors: string[], warnings: string[]): void {
  if (typeof waitTime !== 'number' || waitTime < 0) {
    errors.push('Target waitFor must be a non-negative number');
    return;
  }

  if (waitTime > MAX_WAIT_TIME_WARNING) {
    warnings.push('Target waitFor is very high (>60s), this may cause slow scraping');
  }
}

/**
 * Validates extraction fields configuration.
 * @param {Record<string, string>} fields - The extraction fields to validate
 * @param {string[]} errors - Array to collect validation errors
 */
function validateExtractionFields(fields: Record<string, string>, errors: string[]): void {
  for (const [fieldName, selector] of Object.entries(fields)) {
    if (!fieldName.trim()) {
      errors.push('Field names cannot be empty');
    }

    if (!selector || typeof selector !== 'string' || !selector.trim()) {
      errors.push(`Field "${fieldName}" has invalid selector: ${selector}`);
    }
  }
}

/**
 * Validates the output format.
 * @param {string} format - The output format to validate
 * @param {string[]} errors - Array to collect validation errors
 */
function validateOutputFormat(format: string, errors: string[]): void {
  const validFormats = ['json', 'csv', 'database'];
  if (!validFormats.includes(format)) {
    errors.push(`Output format must be one of: ${validFormats.join(', ')}`);
  }
}

/**
 * Validates the database configuration.
 * @param {ScrapingConfig['output']['database']} database - The database configuration to validate
 * @param {string[]} errors - Array to collect validation errors
 */
function validateDatabaseConfig(
  database: ScrapingConfig['output']['database'],
  errors: string[]
): void {
  if (!database) {
    errors.push('Database configuration is required when output format is "database"');
    return;
  }

  const validDbTypes = ['sqlite', 'postgresql', 'mysql'];

  if (!database.type) {
    errors.push('Database type is required');
  } else if (!validDbTypes.includes(database.type)) {
    errors.push('Database type must be one of: sqlite, postgresql, mysql');
  }

  if (!database.connection) {
    errors.push('Database connection string is required');
  }

  if (!database.table) {
    errors.push('Database table name is required');
  }
}

/**
 * Validates retry behavior configuration.
 * @param {ScrapingConfig['behavior']} behavior - The behavior configuration containing retry settings
 * @param {string[]} errors - Array to collect validation errors
 * @param {string[]} warnings - Array to collect validation warnings
 */
function validateRetryBehavior(
  behavior: ScrapingConfig['behavior'],
  errors: string[],
  warnings: string[]
): void {
  if (behavior.retryAttempts !== undefined) {
    if (typeof behavior.retryAttempts !== 'number' || behavior.retryAttempts < 0) {
      errors.push('Retry attempts must be a non-negative number');
    } else if (behavior.retryAttempts > MAX_RETRY_ATTEMPTS_WARNING) {
      warnings.push('High retry attempts (>10) may cause slow scraping');
    }
  }

  if (behavior.retryDelay !== undefined) {
    if (typeof behavior.retryDelay !== 'number' || behavior.retryDelay < 0) {
      errors.push('Retry delay must be a non-negative number');
    } else if (behavior.retryDelay < MIN_RETRY_DELAY_WARNING) {
      warnings.push('Very low retry delay (<100ms) may overwhelm servers');
    }
  }
}

/**
 * Validates the rate limit configuration.
 * @param {number | undefined} rateLimit - The rate limit value to validate
 * @param {string[]} errors - Array to collect validation errors
 * @param {string[]} warnings - Array to collect validation warnings
 */
function validateRateLimit(
  rateLimit: number | undefined,
  errors: string[],
  warnings: string[]
): void {
  if (rateLimit === undefined) {
    return;
  }

  if (typeof rateLimit !== 'number' || rateLimit <= 0) {
    errors.push('Rate limit must be a positive number');
    return;
  }

  if (rateLimit > MAX_RATE_LIMIT_WARNING) {
    warnings.push('Very high rate limit (>1000 req/min) may be blocked by servers');
  }
}

/**
 * Validates the user agent configuration.
 * @param {string | undefined} userAgent - The user agent string to validate
 * @param {string[]} errors - Array to collect validation errors
 */
function validateUserAgent(userAgent: string | undefined, errors: string[]): void {
  if (userAgent && typeof userAgent !== 'string') {
    errors.push('User agent must be a string');
  }
}

/**
 * Validates the headers configuration.
 * @param {Record<string, string> | undefined} headers - The headers object to validate
 * @param {string[]} errors - Array to collect validation errors
 */
function validateHeaders(headers: Record<string, string> | undefined, errors: string[]): void {
  if (headers && typeof headers !== 'object') {
    errors.push('Headers must be an object');
  }
}
