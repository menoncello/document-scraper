/**
 * Core module barrel exports
 * Centralized exports for all core modules
 */

// HTTP Client
export { HttpClient } from './http-client.ts';
export { HttpUtils } from './http-utils.ts';

// Re-export HttpError from types for convenience
export type { HttpError } from '../types/index.ts';

// Element Utilities
export {
  createElementInfo,
  extractDataAttributesFromObject,
  shouldRemoveEmptyElement,
} from './element-utils.ts';
export type { DomElement } from './element-utils.ts';

// Element Types
export type { ElementInfo } from './element-types.ts';

// Data Extractor
export { DataExtractor } from './data-extractor.ts';

// Structured Data Extractor
export {
  extractElementStructuredData,
  extractMultipleStructuredData,
} from './structured-data-extractor.ts';

// HTML Parser
export { HtmlParser } from './html-parser.ts';

// Logger
export { Logger } from './logger.ts';

// Config
export { validateConfig } from './config-validator.ts';
export { deepMerge } from './config-merger.ts';

// Debug utilities
export { DebugUtils } from './debug.ts';
export { DebugFileUtils } from './debug-file-utils.ts';
export { ConfigDebugger } from './debug-config-utils.ts';
export { SelectorDebugger } from './debug-selector-utils.ts';

// Utilities
export * from './extraction-utils.ts';
export * from './data-transformer.ts';
export * from './xpath-converter.ts';

// Config types and classes
export { ConfigManager } from './config.ts';

// Core scraper
export { DocumentScraper } from './scraper.ts';
