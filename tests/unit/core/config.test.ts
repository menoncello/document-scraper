import { test, expect, beforeEach, afterEach } from 'bun:test';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { ConfigManager } from '../../../src/core/config';
import type { ScrapingConfig } from '../../../src/types';
import {
  createScrapingConfig,
  createMinimalScrapingConfig,
} from '../../utils/factories/config-factory';

let testConfigPath: string;
let testYamlPath: string;

beforeEach(() => {
  testConfigPath = 'test-config.json';
  testYamlPath = 'test-config.yaml';
});

afterEach(() => {
  // Clean up test files
  if (existsSync(testConfigPath)) {
    unlinkSync(testConfigPath);
  }
  if (existsSync(testYamlPath)) {
    unlinkSync(testYamlPath);
  }
});

test('TC-CFG-001-01 [P0]: ConfigManager should load JSON configuration', () => {
  // Given: A valid scraping configuration
  const config = createScrapingConfig({
    target: { url: 'https://example.com' },
  });

  writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

  // When: Loading the configuration from file
  const loadedConfig = ConfigManager.loadFromFile(testConfigPath);

  // Then: Should load the configuration correctly
  expect(loadedConfig.target.url).toBe('https://example.com');
  expect(loadedConfig.target.selector).toBe('article');
  expect(loadedConfig.extraction.fields.title).toBe('h1');
  expect(loadedConfig.extraction.fields.content).toBe('.content');
  expect(loadedConfig.extraction.multiple).toBe(true);
  expect(loadedConfig.output.format).toBe('json');
  expect(loadedConfig.behavior.retryAttempts).toBe(3);
});

test('TC-CFG-001-02 [P0]: ConfigManager should load YAML configuration', () => {
  const yamlContent = `
target:
  url: https://example.org
  selector: .product
  waitFor: 2000
extraction:
  fields:
    name: .title
    price: .price
  multiple: true
output:
  format: csv
  filename: products.csv
behavior:
  retryAttempts: 5
  retryDelay: 1500
  rateLimit: 20
  userAgent: custom-agent/1.0.0
`;

  writeFileSync(testYamlPath, yamlContent);

  const loadedConfig = ConfigManager.loadFromFile(testYamlPath);

  expect(loadedConfig.target.url).toBe('https://example.org');
  expect(loadedConfig.target.selector).toBe('.product');
  expect(loadedConfig.target.waitFor).toBe(2000);
  expect(loadedConfig.extraction.fields.name).toBe('.title');
  expect(loadedConfig.extraction.fields.price).toBe('.price');
  expect(loadedConfig.output.format).toBe('csv');
  expect(loadedConfig.behavior.retryAttempts).toBe(5);
  expect(loadedConfig.behavior.userAgent).toBe('custom-agent/1.0.0');
});

test('TC-CFG-002-01 [P0]: ConfigManager should merge with defaults', () => {
  // Given: A minimal configuration with only required fields
  const minimalConfig = createMinimalScrapingConfig({
    target: { url: 'https://example.com' },
    behavior: { retryAttempts: 1, retryDelay: 1000, rateLimit: 10 },
  });

  // When: Creating a full configuration from the minimal one
  const mergedConfig = ConfigManager.fromObject(minimalConfig);

  // Then: Should preserve provided values and add defaults
  expect(mergedConfig.target.url).toBe('https://example.com');
  expect(mergedConfig.extraction.fields.title).toBe('h1');
  expect(mergedConfig.output.format).toBe('json');
  expect(mergedConfig.behavior.retryAttempts).toBe(1);
  expect(mergedConfig.behavior.retryDelay).toBe(1000);

  // Should add sensible defaults
  expect(mergedConfig.extraction.multiple).toBe(false);
  expect(mergedConfig.behavior.rateLimit).toBe(10);
  expect(mergedConfig.behavior.userAgent).toBe(
    'docs-scrape/1.0.0 (+https://github.com/docs-scrape)'
  );
});

test('TC-CFG-003-01 [P0]: ConfigManager should validate valid configuration', () => {
  // Given: A valid configuration created with factory
  const config = createScrapingConfig({
    extraction: {
      fields: {
        title: 'h1',
        content: '.content',
      },
      multiple: false,
    }, // Override default to test validation
  });

  // When: Validating the configuration
  const validation = ConfigManager.validate(config);

  // Then: Should pass validation with no errors
  expect(validation.valid).toBe(true);
  expect(validation.errors).toHaveLength(0);
});

test('TC-CFG-003-02 [P1]: ConfigManager should detect missing required fields', () => {
  const invalidConfig = {
    target: {
      // Missing url
      selector: 'article',
    } as Partial<{ url: string; selector?: string }>,
    extraction: {
      // Missing fields
    } as Partial<{ fields: Record<string, string>; multiple?: boolean }>,
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
    },
  };

  const validation = ConfigManager.validate(invalidConfig as any);

  expect(validation.valid).toBe(false);
  expect(validation.errors).toContain('Target URL is required');
  expect(validation.errors).toContain(
    'Extraction fields must include at least one field definition'
  );
});

test('TC-CFG-003-03 [P1]: ConfigManager should detect invalid URLs', () => {
  const config: ScrapingConfig = {
    target: {
      url: 'not-a-valid-url',
      selector: 'article',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
    },
  };

  const validation = ConfigManager.validate(config);

  expect(validation.valid).toBe(false);
  expect(validation.errors).toContain('Target URL is invalid');
});

test('TC-CFG-003-04 [P1]: ConfigManager should detect invalid output formats', () => {
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
      selector: 'article',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'invalid' as any, // Invalid format
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
    },
  };

  const validation = ConfigManager.validate(config);

  expect(validation.valid).toBe(false);
  expect(validation.errors).toContain('Output format must be one of: json, csv, database');
});

test('TC-CFG-003-05 [P1]: ConfigManager should validate database configuration', () => {
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
      selector: 'article',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'database' as const,
      // Missing database config
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
    },
  };

  const validation = ConfigManager.validate(config);

  expect(validation.valid).toBe(false);
  expect(validation.errors).toContain(
    'Database configuration is required when output format is "database"'
  );
});

test('TC-CFG-004-01 [P2]: ConfigManager should generate warnings for edge cases', () => {
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
      selector: 'article',
      waitFor: 120000, // Very high wait time (2 minutes)
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 15, // High retry count
      retryDelay: 50, // Low retry delay
      rateLimit: 2000, // Very high rate limit
    },
  };

  const validation = ConfigManager.validate(config);

  // Should still be valid but with warnings
  expect(validation.valid).toBe(true);
  expect(validation.warnings.length).toBeGreaterThan(0);
  expect(validation.warnings.some(w => w.includes('very high (>60s)'))).toBe(true);
  expect(validation.warnings.some(w => w.includes('High retry attempts (>10)'))).toBe(true);
  expect(validation.warnings.some(w => w.includes('Very low retry delay (<100ms)'))).toBe(true);
  expect(validation.warnings.some(w => w.includes('Very high rate limit (>1000 req/min)'))).toBe(
    true
  );
});

test('TC-CFG-005-01 [P2]: ConfigManager should create sample configuration', () => {
  const sampleConfig = ConfigManager.createSample();

  expect(sampleConfig.target.url).toBe('https://example.com');
  expect(sampleConfig.extraction.fields).toHaveProperty('title', 'h1');
  expect(sampleConfig.extraction.fields).toHaveProperty('content', '.content');
  expect(sampleConfig.output.format).toBe('json');
  expect(sampleConfig.behavior.retryAttempts).toBe(3);
  expect(sampleConfig.behavior.retryDelay).toBe(1000);
});

test('TC-CFG-006-01 [P1]: ConfigManager should throw error for non-existent file', () => {
  expect(() => {
    ConfigManager.loadFromFile('non-existent-file.json');
  }).toThrow('Configuration file not found');
});

test('TC-CFG-006-02 [P1]: ConfigManager should throw error for invalid JSON', () => {
  writeFileSync(testConfigPath, '{ invalid json }');

  expect(() => {
    ConfigManager.loadFromFile(testConfigPath);
  }).toThrow('Failed to parse configuration file');
});

test('TC-CFG-006-03 [P1]: ConfigManager should throw error for unsupported file format', () => {
  const txtPath = 'test-config.txt';
  writeFileSync(txtPath, 'some content');

  try {
    expect(() => {
      ConfigManager.loadFromFile(txtPath);
    }).toThrow('Unsupported configuration file format');
  } finally {
    if (existsSync(txtPath)) {
      unlinkSync(txtPath);
    }
  }
});

test('TC-CFG-006-04 [P1]: ConfigManager should throw error on validation failure', () => {
  const invalidConfig = {
    target: {
      // Missing required url
    },
    extraction: {
      // Missing required fields
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
    },
  };

  expect(() => {
    ConfigManager.validateOrThrow(invalidConfig as ScrapingConfig);
  }).toThrow('Configuration validation failed');
});

test('TC-CFG-007-01 [P1]: ConfigManager should save configuration to JSON', () => {
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
      selector: 'article',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
    },
  };

  // This should not throw
  expect(() => {
    ConfigManager.saveToFile(config, testConfigPath);
  }).not.toThrow();
});

test('TC-CFG-007-02 [P1]: ConfigManager should save configuration to YAML', () => {
  const config: ScrapingConfig = {
    target: {
      url: 'https://example.com',
      selector: 'article',
    },
    extraction: {
      fields: {
        title: 'h1',
      },
    },
    output: {
      format: 'json' as const,
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 10,
    },
  };

  // This should not throw
  expect(() => {
    ConfigManager.saveToFile(config, testYamlPath);
  }).not.toThrow();
});
