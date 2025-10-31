import { test, expect, beforeEach, afterEach, describe } from 'bun:test';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import {
  createScraper,
  createScraperFromConfig,
  createSampleScraper,
  loadConfig,
  validateConfig,
  createLogger,
  createDebugUtils,
  DocumentScraper,
  HttpClient,
  HtmlParser,
  DataExtractor,
  ConfigManager,
  Logger,
  DebugUtils,
  LogLevel,
} from '../../src/index';
import type { ScrapingConfig } from '../../src/types';

// Helper functions moved to outer scope to fix function scoping
const createClassTest = (className: any, _expectedName: string) => {
  return () => {
    expect(className).toBeDefined();
    expect(typeof className).toBe('function');
  };
};

const createValidConfig = (): ScrapingConfig => ({
  target: {
    url: 'https://example.com',
    selector: 'article',
  },
  extraction: {
    fields: {
      title: 'h1',
      content: '.content',
    },
  },
  output: {
    format: 'json',
  },
  behavior: {
    retryAttempts: 3,
    retryDelay: 1000,
    rateLimit: 50,
  },
});

const createMinimalConfig = (): ScrapingConfig => ({
  target: {
    url: 'https://example.com',
  },
  extraction: {
    fields: {
      title: 'h1',
    },
  },
  output: {
    format: 'json',
  },
  behavior: {
    retryAttempts: 1,
    retryDelay: 500,
    rateLimit: 100,
  },
});

const createFullConfig = (): ScrapingConfig => ({
  target: {
    url: 'https://example.com',
    selector: 'article',
  },
  extraction: {
    fields: {
      title: 'h1',
      content: '.content',
    },
    multiple: true,
  },
  output: {
    format: 'json',
    filename: 'output.json',
  },
  behavior: {
    retryAttempts: 3,
    retryDelay: 1000,
    rateLimit: 50,
    userAgent: 'Test-Agent/1.0',
  },
});

const writeConfigFile = (config: ScrapingConfig, path: string): void => {
  writeFileSync(path, JSON.stringify(config, null, 2));
};

const createSampleFields = () => ({
  title: 'h1',
  content: '.content',
});

const createWorkflowConfig = (): ScrapingConfig => ({
  target: {
    url: 'https://example.com',
  },
  extraction: {
    fields: {
      title: 'h1',
    },
  },
  output: {
    format: 'json',
  },
  behavior: {
    retryAttempts: 3,
    retryDelay: 1000,
    rateLimit: 50,
  },
});

const writeWorkflowConfig = (config: ScrapingConfig, path: string): void => {
  writeFileSync(path, JSON.stringify(config, null, 2));
};

const createInvalidConfig = (): ScrapingConfig => ({
  target: {
    url: '', // Invalid empty URL
  },
  extraction: {
    fields: {}, // No extraction fields
  },
  output: {
    format: 'json',
  },
  behavior: {
    retryAttempts: -1, // Invalid negative retry count
    retryDelay: -100, // Invalid negative delay
    rateLimit: -10, // Invalid negative rate limit
  },
});

const createWarningConfig = (): ScrapingConfig => ({
  target: {
    url: 'https://example.com',
  },
  extraction: {
    fields: {
      title: 'h1',
    },
  },
  output: {
    format: 'json',
  },
  behavior: {
    retryAttempts: 10, // High retry count (should generate warning)
    retryDelay: 100,
    rateLimit: 5000, // High rate limit (should generate warning)
  },
});

describe('Index Module - Public API', () => {
  let testConfigPath: string;

  beforeEach(() => {
    testConfigPath = 'test-index-config.json';
  });

  afterEach(() => {
    // Clean up test files
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
  });

  describe('Class Exports', () => {
    test(
      'should export DocumentScraper class',
      createClassTest(DocumentScraper, 'DocumentScraper')
    );
    test('should export HttpClient class', createClassTest(HttpClient, 'HttpClient'));
    test('should export HtmlParser class', createClassTest(HtmlParser, 'HtmlParser'));
    test('should export DataExtractor class', createClassTest(DataExtractor, 'DataExtractor'));
    test('should export ConfigManager class', createClassTest(ConfigManager, 'ConfigManager'));
    test('should export Logger class', createClassTest(Logger, 'Logger'));
    test('should export DebugUtils class', createClassTest(DebugUtils, 'DebugUtils'));

    test('should export LogLevel enum', () => {
      expect(LogLevel).toBeDefined();
      expect(LogLevel.DEBUG).toBeDefined();
      expect(LogLevel.INFO).toBeDefined();
      expect(LogLevel.WARN).toBeDefined();
      expect(LogLevel.ERROR).toBeDefined();
      expect(LogLevel.FATAL).toBeDefined();
    });
  });

  describe('createScraper Function', () => {
    test('should create DocumentScraper instance with configuration', () => {
      // Given: A valid scraping configuration
      const config = createValidConfig();

      // When: Creating a scraper with the configuration
      const scraper = createScraper(config);

      // Then: Should return a DocumentScraper instance
      expect(scraper).toBeInstanceOf(DocumentScraper);
    });

    test('should create scraper with minimal configuration', () => {
      // Given: A minimal scraping configuration
      const config = createMinimalConfig();

      // When: Creating a scraper with minimal configuration
      const scraper = createScraper(config);

      // Then: Should still create a valid DocumentScraper instance
      expect(scraper).toBeInstanceOf(DocumentScraper);
    });
  });

  describe('createScraperFromConfig Function', () => {
    test('should create DocumentScraper from config file', () => {
      // Given: A config file with scraping configuration
      const config: ScrapingConfig = {
        target: {
          url: 'https://example.com',
          selector: 'article',
        },
        extraction: {
          fields: {
            title: 'h1',
            content: '.content',
          },
        },
        output: {
          format: 'json',
        },
        behavior: {
          retryAttempts: 3,
          retryDelay: 1000,
          rateLimit: 50,
        },
      };

      writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

      // When: Creating a scraper from the config file
      const scraper = createScraperFromConfig(testConfigPath);

      // Then: Should return a DocumentScraper instance
      expect(scraper).toBeInstanceOf(DocumentScraper);
    });

    test('should handle invalid config file path', () => {
      // Given: An invalid config file path
      const invalidPath = 'nonexistent-config.json';

      // When/Then: Should throw error when trying to create scraper from invalid path
      expect(() => createScraperFromConfig(invalidPath)).toThrow();
    });
  });

  describe('createSampleScraper Function', () => {
    test('should create DocumentScraper with sample configuration', () => {
      // Given: URL and field mappings
      const url = 'https://example.com';
      const fields = {
        title: 'h1',
        content: '.content',
        author: '.author',
      };

      // When: Creating a sample scraper
      const scraper = createSampleScraper(url, fields);

      // Then: Should return a DocumentScraper instance
      expect(scraper).toBeInstanceOf(DocumentScraper);
    });

    test('should create sample scraper with single field', () => {
      // Given: URL and single field mapping
      const url = 'https://example.com';
      const fields = {
        title: 'h1',
      };

      // When: Creating a sample scraper
      const scraper = createSampleScraper(url, fields);

      // Then: Should return a valid DocumentScraper instance
      expect(scraper).toBeInstanceOf(DocumentScraper);
    });

    test('should handle empty fields object', () => {
      // Given: URL and empty fields object - should throw error
      const url = 'https://example.com';
      const fields = {};

      // When/Then: Should throw error for empty fields
      expect(() => createSampleScraper(url, fields)).toThrow();
    });
  });

  describe('loadConfig Function', () => {
    test('should load configuration from file', () => {
      // Given: A config file with valid configuration
      const config = createFullConfig();
      writeConfigFile(config, testConfigPath);

      // When: Loading the configuration
      const loadedConfig = loadConfig(testConfigPath);

      // Then: Should return the loaded configuration
      expect(loadedConfig.target.url).toBe('https://example.com');
      expect(loadedConfig.extraction.fields.title).toBe('h1');
      expect(loadedConfig.extraction.multiple).toBe(true);
      expect(loadedConfig.output.filename).toBe('output.json');
      expect(loadedConfig.behavior.userAgent).toBe('Test-Agent/1.0');
    });

    test('should load minimal configuration from file', () => {
      // Given: A config file with minimal configuration
      const config: ScrapingConfig = {
        target: { url: 'https://example.com' },
        extraction: { fields: { title: 'h1' } },
        output: { format: 'json' },
        behavior: { retryAttempts: 1, retryDelay: 500, rateLimit: 100 },
      };
      writeConfigFile(config, testConfigPath);

      // When: Loading the configuration
      const loadedConfig = loadConfig(testConfigPath);

      // Then: Should return the loaded configuration
      expect(loadedConfig.target.url).toBe('https://example.com');
      expect(loadedConfig.extraction.fields.title).toBe('h1');
    });

    test('should handle invalid JSON in config file', () => {
      // Given: A config file with invalid JSON
      writeFileSync(testConfigPath, '{ invalid json content }');

      // When/Then: Should throw error when trying to load invalid JSON
      expect(() => loadConfig(testConfigPath)).toThrow();
    });
  });

  describe('validateConfig Function', () => {
    test('should validate valid configuration', () => {
      // Given: A valid scraping configuration
      const config = createValidConfig();

      // When: Validating the configuration
      const _result = validateConfig(config);

      // Then: Should return valid result
      expect(_result.valid).toBe(true);
      expect(_result.errors).toHaveLength(0);
    });

    test('should detect invalid configuration', () => {
      // Given: An invalid scraping configuration
      const config = createInvalidConfig();

      // When: Validating the configuration
      const _result = validateConfig(config);

      // Then: Should return invalid result with errors
      expect(_result.valid).toBe(false);
      expect(_result.errors.length).toBeGreaterThan(0);
    });

    test('should provide warnings for configuration issues', () => {
      // Given: A configuration with potential issues
      const config = createWarningConfig();

      // When: Validating the configuration
      const _result = validateConfig(config);

      // Then: Should include warnings for potential issues
      expect(_result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('createLogger Function', () => {
    test('should create Logger instance with default configuration', () => {
      // When: Creating a logger without configuration
      const logger = createLogger();

      // Then: Should return a Logger instance
      expect(logger).toBeInstanceOf(Logger);
    });

    test('should create Logger instance with custom configuration', () => {
      // Reset singleton for testing
      (Logger as any).instance = null;

      // Given: Custom logger configuration
      const loggerConfig = {
        level: 0, // LogLevel.DEBUG = 0
        enableConsole: false,
        enableFile: true,
        logFile: 'test.log',
      };

      // When: Creating a logger with custom configuration
      const logger = createLogger(loggerConfig);

      // Then: Should return a Logger instance with custom configuration
      expect(logger).toBeInstanceOf(Logger);
      expect(logger.getLevel()).toBe(0); // DEBUG level
    });

    test('should return singleton logger instance', () => {
      // When: Creating multiple logger instances
      const logger1 = createLogger();
      const logger2 = createLogger();

      // Then: Should return the same singleton instance
      expect(logger1).toBe(logger2);
    });
  });

  describe('createDebugUtils Function', () => {
    test('should create DebugUtils instance with default output directory', () => {
      // When: Creating debug utils without output directory
      const debugUtils = createDebugUtils();

      // Then: Should return a DebugUtils instance with default directory
      expect(debugUtils).toBeInstanceOf(DebugUtils);
      expect(debugUtils.getOutputDirectory()).toBe('debug');
    });

    test('should create DebugUtils instance with custom output directory', () => {
      // Given: Custom output directory
      const customDir = 'custom-debug-output';

      // When: Creating debug utils with custom directory
      const debugUtils = createDebugUtils(customDir);

      // Then: Should return a DebugUtils instance with custom directory
      expect(debugUtils).toBeInstanceOf(DebugUtils);
      expect(debugUtils.getOutputDirectory()).toBe(customDir);
    });
  });

  describe('Integration Tests', () => {
    test('should work together all exported functions', () => {
      // Given: Complete workflow using all exported functions
      const url = 'https://example.com';
      const fields = createSampleFields();

      // When: Using the complete API workflow
      const scraper = createSampleScraper(url, fields);
      const configValidation = validateConfig(scraper.getConfig());
      const logger = createLogger({ level: LogLevel.INFO });
      const debugUtils = createDebugUtils('test-debug');

      // Then: All components should work together
      expect(scraper).toBeInstanceOf(DocumentScraper);
      expect(configValidation).toBeDefined();
      expect(logger).toBeInstanceOf(Logger);
      expect(debugUtils).toBeInstanceOf(DebugUtils);
    });

    test('should handle configuration workflow end-to-end', () => {
      // Given: Configuration workflow
      const config = createWorkflowConfig();
      writeWorkflowConfig(config, testConfigPath);

      // When: Using configuration workflow
      const loadedConfig = loadConfig(testConfigPath);
      const validation = validateConfig(loadedConfig);
      const scraper = createScraper(loadedConfig);

      // Then: Should complete workflow successfully
      expect(loadedConfig.target.url).toBe(config.target.url);
      expect(validation.valid).toBe(true);
      expect(scraper).toBeInstanceOf(DocumentScraper);
    });
  });
});
