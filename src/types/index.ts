/**
 * Core types for the Document Scrape library
 */

import type * as _cheerio from 'cheerio';

export interface ScrapingConfig {
  target: {
    url: string;
    selector?: string;
    waitFor?: number;
  };
  extraction: {
    fields: Record<string, string>;
    multiple?: boolean;
  };
  output: {
    format: 'json' | 'csv' | 'database';
    filename?: string;
    database?: {
      type: 'sqlite' | 'postgresql' | 'mysql';
      connection: string;
      table: string;
    };
  };
  behavior: {
    retryAttempts: number;
    retryDelay: number;
    rateLimit: number;
    timeout?: number;
    userAgent?: string;
    headers?: Record<string, string>;
  };
}

export interface HttpClientConfig {
  retryAttempts: number;
  retryDelay: number;
  rateLimit: number;
  userAgent?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ScrapingResult {
  url: string;
  data: Record<string, unknown> | Array<Record<string, unknown> | unknown>;
  success: boolean;
  error?: string;
  metadata: {
    extractedAt: Date;
    selector?: string;
    extractionTime: number;
    retryCount: number;
  };
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  text: () => Promise<string>;
  json: () => Promise<unknown>;
  arrayBuffer: () => Promise<ArrayBuffer>;
  ok: boolean;
  url?: string;
  redirected?: boolean;
}

export interface HttpError extends Error {
  status?: number;
  statusText?: string;
  response?: HttpResponse;
  url?: string;
  code?: string;
  timeout?: number;
}

export interface RetryConfig {
  attempts: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
  maxDelay?: number;
}

export interface RateLimiter {
  maxRequests: number;
  windowMs: number;
}

// HTML Parser Types
export interface ParseOptions {
  preserveWhitespace?: boolean;
  normalizeWhitespace?: boolean;
  decodeEntities?: boolean;
  replaceInvalidEntities?: boolean;
}

// ElementInfo interface (re-exported from core/element-types)
export interface ElementInfo {
  tagName: string;
  text: string;
  textContent?: string;
  innerHTML?: string;
  attributes: Record<string, string>;
  children: ElementInfo[];
  parent?: ElementInfo;
}

export interface SelectorResult {
  elements: ElementInfo[];
  count: number;
  exists: boolean;
  found: boolean;
  data: unknown;
  extractAttribute: (attributeName: string) => string | string[];
  // Additional properties for compatibility with html-parser implementation
  matches?: _cheerio.Cheerio<unknown>;
  text?: string;
  html?: string;
  attributes?: Record<string, string>;
}

// Data Extractor Types
export interface ExtractionOptions {
  multiple?: boolean;
  transform?: DataTransform;
  filter?: DataFilter;
  preserveOrder?: boolean;
  includeEmpty?: boolean;
  trimWhitespace?: boolean;
  convertToNumber?: boolean;
  dateFormat?: string;
  encoding?: string;
}

export interface ExtractionContext {
  url: string;
  selector?: string;
  timestamp: Date;
}

export type DataTransform = (
  value: string,
  context: ExtractionContext
) => string | number | boolean;

export type DataFilter = (value: string | number | boolean, context: ExtractionContext) => boolean;

// Config Types (additional)
export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ConfigMergeOptions {
  deep?: boolean;
  overwrite?: boolean;
}

// Logger Types
export interface LoggerConfig {
  level: import('../core/logger-types.js').LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logFile?: string;
  maxFileSize?: number;
  maxFiles?: number;
  enableColors: boolean;
  includeTimestamp: boolean;
  includeContext: boolean;
}

export interface LogEntry {
  level: import('../core/logger-types.js').LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  module?: string;
}

// Re-export LogLevel from core/logger-types for convenience
export type LogLevel = import('../core/logger-types.js').LogLevel;

// Debug Types
export interface DebugInfo {
  url: string;
  timestamp: Date;
  userAgent: string;
  responseHeaders: Record<string, string>;
  requestHeaders: Record<string, string>;
  responseTime: number;
  status: number;
  contentLength: number;
  contentType: string;
  extractedData?: Record<string, unknown>;
  errors?: string[];
}

export interface DebugOptions {
  saveHtml?: boolean;
  saveScreenshots?: boolean;
  saveHeaders?: boolean;
  saveData?: boolean;
  saveSelections?: boolean;
  saveExtraction?: boolean;
  saveConfig?: boolean;
  outputPath?: string;
  outputDir?: string;
}
