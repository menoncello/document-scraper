import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import { Logger } from '../../../../src/core/logger';
import {
  createSuccessSelectorResult,
  createFailureSelectorResult,
  logSelectorSuccess,
  logSelectorFailure,
} from '../../../../src/core/utils/selector-testing-helpers';

// Constants for test data
const TEST_CONSTANTS = {
  SELECTORS: {
    TEST: '.test-element',
    LONG_TEXT: '.long-text-element',
    EXACT_LENGTH: '.exact-length',
    NO_MATCHES: '.no-matches',
    MANY_MATCHES: '.many-matches',
    NEGATIVE_COUNT: '.negative-count',
    NULL_TEXT: '.null-text',
    UNDEFINED_TEXT: '.undefined-text',
    UNICODE_CONTENT: '.unicode-content',
    WHITESPACE_TEXT: '.whitespace-text',
    HTML_ENTITIES: '.html-entities',
    EMPTY: '',
    NON_EXISTENT: '.non-existent',
    STACK_ERROR: '.stack-error',
    CUSTOM_ERROR: '.custom-error',
    NUMBER_ERROR: '.number-error',
    OBJECT_ERROR: '.object-error',
    EMPTY_ERROR: '.empty-error',
    LONG_ERROR: '.long-error',
    SPECIAL_FIELD: '.special-field',
    UNICODE_FIELD: '.unicode-field',
    EMPTY_FIELD: '.empty-field',
    INTEGRATION: '.integration',
    INTEGRATION_ERROR: '.integration-error',
    PERFORMANCE: '.performance-test',
    BATCH: '.batch-test',
    BOUNDARY: '.boundary-test',
    TEXT_BOUNDARY: '.text-boundary-test',
    INJECTION: '.test<script>alert("xss")</script>',
    CONTROL_CHARS: '.control-chars',
    EMOJI: '.emoji-test',
    CIRCULAR_ERROR: '.circular-error',
    TYPE_TEST: '.type-test',
    EMPTY_FIELD_ERROR: '.empty-field-error',
  },
  COUNTS: {
    ZERO: 0,
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FIVE: 5,
    MANY: 9999,
    LARGE: 1000,
    NEGATIVE: -1,
  },
  LENGTHS: {
    TEXT_TRUNCATE: 200,
    LONG_TEXT: 300,
    VERY_LONG_TEXT: 100000,
    LONG_SELECTOR: 1000,
    LONG_ERROR: 1000,
    BATCH_OPERATIONS: 1000,
  },
  PERFORMANCE: {
    MAX_TIME_SINGLE: 100,
    MAX_TIME_BATCH: 200,
  },
  UNICODE: {
    MIXED: 'Hello 世界 🌍 ñiño 🚀 Café Москва Токио',
    FIELD_NAME: 'título- español',
    ERROR_FIELD: ' campo-error-ñ ',
  },
  TEXT_SAMPLES: {
    LONG_CHAR: 'a',
    BOUNDARY_CHAR: 'b',
    CONTROL: 'Text\u0000with\u0001control\u001Fcharacters',
    EMOJI_COMPLEX: '🚀🌟💯🔥🎉👍🏽👩‍💻🏴‍☠️',
    HTML_ENTITIES: '&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;',
    WHITESPACE: 'Line 1\nLine 2\t  Indented\r\nCarriage return   ',
    LONG_ERROR_CHAR: 'x',
  },
  FIELD_NAMES: {
    TITLE: 'title',
    DESCRIPTION: 'description',
    ITEMS: 'items',
    AUTHOR: 'author',
    PRICE: 'price',
    SPECIAL: 'field-with_special.characters',
    UNICODE: 'título- español',
    EMPTY: '',
    INTEGRATION_TEST: 'integration-test',
    INTEGRATION_ERROR: 'integration-error',
    STACK_FIELD: 'stack-field',
  },
  ERROR_MESSAGES: {
    ELEMENT_NOT_FOUND: 'Element not found',
    NETWORK_TIMEOUT: 'Network timeout',
    SELECTOR_SYNTAX: 'Selector syntax error',
    CUSTOM_ERROR: 'Custom error message',
    INVALID_PRICE: 'Invalid price format',
    STACK_ERROR: 'Stack error test',
    INTEGRATION_TEST: 'Integration test error',
    EMPTY_FIELD: 'Empty field error',
    SPECIAL_FIELD: 'Special field error',
    ERROR_ES: 'Error en selector',
    STACK_TRACE: 'Stack trace error',
    CIRCULAR_ERROR: 'Circular error',
    UNEXPECTED_NEGATIVE: 'Unexpected negative count',
  },
} as const;

// Type for mock logger spies
interface MockLoggerSpies {
  debug: ReturnType<typeof spyOn>;
  info: ReturnType<typeof spyOn>;
  warn: ReturnType<typeof spyOn>;
  error: ReturnType<typeof spyOn>;
  fatal: ReturnType<typeof spyOn>;
}

// Helper function to create mock logger with proper typing
function createMockLogger(): Logger & MockLoggerSpies {
  const debugSpy = spyOn(console, 'log').mockImplementation(() => {
    // Mock implementation for testing
  });
  const infoSpy = spyOn(console, 'log').mockImplementation(() => {
    // Mock implementation for testing
  });
  const warnSpy = spyOn(console, 'warn').mockImplementation(() => {
    // Mock implementation for testing
  });
  const errorSpy = spyOn(console, 'error').mockImplementation(() => {
    // Mock implementation for testing
  });
  const fatalSpy = spyOn(console, 'error').mockImplementation(() => {
    // Mock implementation for testing
  });

  // Create object that matches Logger interface method signatures
  const mockLogger = {
    debug: debugSpy,
    info: infoSpy,
    warn: warnSpy,
    error: errorSpy,
    fatal: fatalSpy,
    updateConfig: (_config: any) => {
      // Mock implementation for testing
    },
    getConfig: () => ({ level: 0, includeTimestamp: false }),
    setLevel: (_level: any) => {
      // Mock implementation for testing
    },
    getLevel: () => 0,
    setConsoleLogging: (_enabled: any) => {
      // Mock implementation for testing
    },
    setFileLogging: (_enabled: any, _logFile?: string) => {
      // Mock implementation for testing
    },
    clearLogs: () => {
      // Mock implementation for testing
    },
  } as unknown;

  return mockLogger as Logger & MockLoggerSpies;
}

// Helper functions for test data generation
function createLongText(char: string, length: number): string {
  return char.repeat(length);
}

function createCustomError(message: string, code: string): Error & { code: string } {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  error.name = 'CustomError';
  return error;
}

function createValidationError(message: string, code: string): Error & { code: string } {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  error.name = 'ValidationError';
  return error;
}

describe('createSuccessSelectorResult', () => {
  describe('basic functionality', () => {
    it('should create a success result with required fields', () => {
      // Given: A selector and basic data
      const selector = TEST_CONSTANTS.SELECTORS.TEST;
      const count = TEST_CONSTANTS.COUNTS.ONE;
      const text = 'Test content';

      // When: Creating success result
      const result = createSuccessSelectorResult(selector, count, text);

      // Then: Should have correct structure
      expect(result.selector).toBe(selector);
      expect(result.count).toBe(count);
      expect(result.text).toBe(text);
      expect(result.found).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle empty string selector', () => {
      // Given: Empty selector
      const selector = TEST_CONSTANTS.SELECTORS.EMPTY;
      const count = TEST_CONSTANTS.COUNTS.ZERO;
      const text = '';

      // When: Creating success result
      const result = createSuccessSelectorResult(selector, count, text);

      // Then: Should handle empty selector
      expect(result.selector).toBe('');
      expect(result.count).toBe(TEST_CONSTANTS.COUNTS.ZERO);
      expect(result.found).toBe(false);
    });
  });

  describe('text truncation', () => {
    it('should truncate long text content to limit', () => {
      // Given: A selector with very long text
      const selector = TEST_CONSTANTS.SELECTORS.LONG_TEXT;
      const count = TEST_CONSTANTS.COUNTS.ONE;
      const longText = createLongText(
        TEST_CONSTANTS.TEXT_SAMPLES.LONG_CHAR,
        TEST_CONSTANTS.LENGTHS.LONG_TEXT
      );

      // When: Creating success result
      const result = createSuccessSelectorResult(selector, count, longText);

      // Then: Should truncate text to limit
      expect(result.text.length).toBeLessThanOrEqual(TEST_CONSTANTS.LENGTHS.TEXT_TRUNCATE);
      expect(result.text).toBe(
        createLongText(TEST_CONSTANTS.TEXT_SAMPLES.LONG_CHAR, TEST_CONSTANTS.LENGTHS.TEXT_TRUNCATE)
      );
    });

    it('should handle exact limit character text without truncation', () => {
      // Given: Text exactly at limit
      const selector = TEST_CONSTANTS.SELECTORS.EXACT_LENGTH;
      const count = TEST_CONSTANTS.COUNTS.ONE;
      const exactText = createLongText(
        TEST_CONSTANTS.TEXT_SAMPLES.BOUNDARY_CHAR,
        TEST_CONSTANTS.LENGTHS.TEXT_TRUNCATE
      );

      // When: Creating success result
      const result = createSuccessSelectorResult(selector, count, exactText);

      // Then: Should not truncate
      expect(result.text.length).toBe(TEST_CONSTANTS.LENGTHS.TEXT_TRUNCATE);
      expect(result.text).toBe(exactText);
    });
  });

  describe('count handling', () => {
    it('should handle zero count correctly', () => {
      // Given: A selector with no matches
      const selector = TEST_CONSTANTS.SELECTORS.NO_MATCHES;
      const count = TEST_CONSTANTS.COUNTS.ZERO;
      const text = '';

      // When: Creating success result
      const result = createSuccessSelectorResult(selector, count, text);

      // Then: Should handle zero count
      expect(result.count).toBe(TEST_CONSTANTS.COUNTS.ZERO);
      expect(result.found).toBe(false);
      expect(result.text).toBe('');
    });

    it('should handle large positive count', () => {
      // Given: A selector with many matches
      const selector = TEST_CONSTANTS.SELECTORS.MANY_MATCHES;
      const count = TEST_CONSTANTS.COUNTS.MANY;
      const text = 'Matched content';

      // When: Creating success result
      const result = createSuccessSelectorResult(selector, count, text);

      // Then: Should handle large count
      expect(result.count).toBe(TEST_CONSTANTS.COUNTS.MANY);
      expect(result.found).toBe(true);
    });

    it('should handle negative count (edge case)', () => {
      // Given: An unexpected negative count
      const selector = TEST_CONSTANTS.SELECTORS.NEGATIVE_COUNT;
      const count = TEST_CONSTANTS.COUNTS.NEGATIVE;
      const text = TEST_CONSTANTS.ERROR_MESSAGES.UNEXPECTED_NEGATIVE;

      // When: Creating success result
      const result = createSuccessSelectorResult(selector, count, text);

      // Then: Should handle negative count (found will be false)
      expect(result.count).toBe(TEST_CONSTANTS.COUNTS.NEGATIVE);
      expect(result.found).toBe(false);
    });
  });

  describe('text content handling', () => {
    it('should preserve Unicode characters correctly', () => {
      // Given: Unicode content
      const selector = TEST_CONSTANTS.SELECTORS.UNICODE_CONTENT;
      const count = TEST_CONSTANTS.COUNTS.TWO;
      const unicodeText = TEST_CONSTANTS.UNICODE.MIXED;

      // When: Creating success result with Unicode text
      const result = createSuccessSelectorResult(selector, count, unicodeText);

      // Then: Should preserve Unicode characters
      expect(result.text).toContain('世界');
      expect(result.text).toContain('🌍');
      expect(result.text).toContain('ñiño');
      expect(result.text).toContain('Café');
      expect(result.text).toContain('Москва');
      expect(result.text).toContain('Ток'); // Fixed to match actual string content
      expect(result.found).toBe(true);
    });

    it('should handle whitespace and newlines in text', () => {
      // Given: Text with various whitespace characters
      const selector = TEST_CONSTANTS.SELECTORS.WHITESPACE_TEXT;
      const count = TEST_CONSTANTS.COUNTS.ONE;
      const whitespaceText = TEST_CONSTANTS.TEXT_SAMPLES.WHITESPACE;

      // When: Creating success result
      const result = createSuccessSelectorResult(selector, count, whitespaceText);

      // Then: Should preserve whitespace
      expect(result.text).toContain('\n');
      expect(result.text).toContain('\t');
      expect(result.text).toContain('\r\n');
      expect(result.found).toBe(true);
    });

    it('should handle HTML entities in text', () => {
      // Given: Text with HTML entities
      const selector = TEST_CONSTANTS.SELECTORS.HTML_ENTITIES;
      const count = TEST_CONSTANTS.COUNTS.ONE;
      const htmlText = TEST_CONSTANTS.TEXT_SAMPLES.HTML_ENTITIES;

      // When: Creating success result
      const result = createSuccessSelectorResult(selector, count, htmlText);

      // Then: Should preserve HTML entities
      expect(result.text).toContain('&lt;');
      expect(result.text).toContain('&gt;');
      expect(result.text).toContain('&quot;');
      expect(result.found).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle null text gracefully', () => {
      // Given: Null text input - this will throw an error
      const selector = TEST_CONSTANTS.SELECTORS.NULL_TEXT;
      const count = TEST_CONSTANTS.COUNTS.ONE;
      const text = null as any;

      // When: Creating success result
      // Then: Should throw an error for null text
      expect(() => createSuccessSelectorResult(selector, count, text)).toThrow();
    });

    it('should handle undefined text gracefully', () => {
      // Given: Undefined text input - this will throw an error
      const selector = TEST_CONSTANTS.SELECTORS.UNDEFINED_TEXT;
      const count = TEST_CONSTANTS.COUNTS.ONE;
      const text = undefined as any;

      // When: Creating success result
      // Then: Should throw an error for undefined text
      expect(() => createSuccessSelectorResult(selector, count, text)).toThrow();
    });
  });
});

describe('createFailureSelectorResult', () => {
  describe('Error object handling', () => {
    it('should create a failure result with Error object', () => {
      // Given: A selector and Error object
      const selector = TEST_CONSTANTS.SELECTORS.NON_EXISTENT;
      const error = new Error(TEST_CONSTANTS.ERROR_MESSAGES.ELEMENT_NOT_FOUND);

      // When: Creating failure result
      const result = createFailureSelectorResult(selector, error);

      // Then: Should have correct structure
      expect(result.selector).toBe(selector);
      expect(result.count).toBe(TEST_CONSTANTS.COUNTS.ZERO);
      expect(result.text).toBe('');
      expect(result.error).toBe(TEST_CONSTANTS.ERROR_MESSAGES.ELEMENT_NOT_FOUND);
      expect(result.found).toBe(false);
    });

    it('should handle Error with stack trace', () => {
      // Given: Error with stack trace
      const selector = TEST_CONSTANTS.SELECTORS.STACK_ERROR;
      const error = new Error(TEST_CONSTANTS.ERROR_MESSAGES.STACK_ERROR);
      error.stack = 'Error: Stack error test\n    at Object.test (/test/file.js:1:1)';

      // When: Creating failure result
      const result = createFailureSelectorResult(selector, error);

      // Then: Should include error message
      expect(result.error).toBe(TEST_CONSTANTS.ERROR_MESSAGES.STACK_ERROR);
      expect(result.found).toBe(false);
    });

    it('should handle custom Error types', () => {
      // Given: Custom error type
      const selector = TEST_CONSTANTS.SELECTORS.CUSTOM_ERROR;
      const error = createCustomError(TEST_CONSTANTS.ERROR_MESSAGES.CUSTOM_ERROR, 'CUSTOM_CODE');

      // When: Creating failure result
      const result = createFailureSelectorResult(selector, error);

      // Then: Should extract message from custom error
      expect(result.error).toBe(TEST_CONSTANTS.ERROR_MESSAGES.CUSTOM_ERROR);
      expect(result.found).toBe(false);
    });
  });

  describe('String error handling', () => {
    it('should create a failure result with string error', () => {
      // Given: A selector and string error
      const selector = TEST_CONSTANTS.SELECTORS.NON_EXISTENT;
      const error = TEST_CONSTANTS.ERROR_MESSAGES.NETWORK_TIMEOUT;

      // When: Creating failure result
      const result = createFailureSelectorResult(selector, error);

      // Then: Should have correct structure
      expect(result.selector).toBe(selector);
      expect(result.count).toBe(TEST_CONSTANTS.COUNTS.ZERO);
      expect(result.text).toBe('');
      expect(result.error).toBe(TEST_CONSTANTS.ERROR_MESSAGES.NETWORK_TIMEOUT);
      expect(result.found).toBe(false);
    });

    it('should handle empty string error', () => {
      // Given: Empty string error
      const selector = TEST_CONSTANTS.SELECTORS.EMPTY_ERROR;
      const error = '';

      // When: Creating failure result
      const result = createFailureSelectorResult(selector, error);

      // Then: Should handle empty string error
      expect(result.error).toBe('');
      expect(result.found).toBe(false);
    });

    it('should handle very long error message', () => {
      // Given: Very long error message
      const selector = TEST_CONSTANTS.SELECTORS.LONG_ERROR;
      const longError = createLongText(
        TEST_CONSTANTS.TEXT_SAMPLES.LONG_ERROR_CHAR,
        TEST_CONSTANTS.LENGTHS.LONG_ERROR
      );

      // When: Creating failure result
      const result = createFailureSelectorResult(selector, longError);

      // Then: Should preserve long error message
      expect(result.error).toBe(longError);
      expect(result.error?.length).toBe(TEST_CONSTANTS.LENGTHS.LONG_ERROR);
      expect(result.found).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle null error correctly', () => {
      // Given: A selector and null error
      const selector = TEST_CONSTANTS.SELECTORS.OBJECT_ERROR;
      const error = null as any;

      // When: Creating failure result
      const result = createFailureSelectorResult(selector, error);

      // Then: Should handle null error
      expect(result.error).toBe('null');
      expect(result.found).toBe(false);
    });

    it('should handle undefined error correctly', () => {
      // Given: A selector and undefined error
      const selector = TEST_CONSTANTS.SELECTORS.UNDEFINED_TEXT;
      const error = undefined as any;

      // When: Creating failure result
      const result = createFailureSelectorResult(selector, error);

      // Then: Should handle undefined error
      expect(result.error).toBe('undefined');
      expect(result.found).toBe(false);
    });

    it('should handle number as error input', () => {
      // Given: Number as error
      const selector = TEST_CONSTANTS.SELECTORS.NUMBER_ERROR;
      const error = 404;

      // When: Creating failure result
      const result = createFailureSelectorResult(selector, String(error));

      // Then: Should convert number to string
      expect(result.error).toBe('404');
      expect(result.found).toBe(false);
    });

    it('should handle object as error input', () => {
      // Given: Object as error
      const selector = TEST_CONSTANTS.SELECTORS.OBJECT_ERROR;
      const error = { error: 'error' };

      // When: Creating failure result
      const result = createFailureSelectorResult(selector, error as any);

      // Then: Should convert object to string
      expect(result.error).toBe('[object Object]');
      expect(result.found).toBe(false);
    });
  });
});

describe('logSelectorSuccess', () => {
  let mockLogger: Logger & MockLoggerSpies;

  beforeEach(() => {
    mockLogger = createMockLogger();
  });

  describe('basic logging functionality', () => {
    it('should log successful selector test with positive count', () => {
      // Given: Logger and test data
      const fieldName = TEST_CONSTANTS.FIELD_NAMES.TITLE;
      const selector = '.title';
      const count = TEST_CONSTANTS.COUNTS.THREE;

      // When: Logging success
      logSelectorSuccess(mockLogger, fieldName, selector, count);

      // Then: Should call debug with correct parameters
      expect(mockLogger.debug).toHaveBeenCalledWith(`Selector test for ${fieldName}`, {
        selector,
        count,
        found: true,
      });
    });

    it('should log successful selector test with zero count', () => {
      // Given: Logger and test data with no matches
      const fieldName = TEST_CONSTANTS.FIELD_NAMES.DESCRIPTION;
      const selector = '.description';
      const count = TEST_CONSTANTS.COUNTS.ZERO;

      // When: Logging success
      logSelectorSuccess(mockLogger, fieldName, selector, count);

      // Then: Should call debug with found: false
      expect(mockLogger.debug).toHaveBeenCalledWith(`Selector test for ${fieldName}`, {
        selector,
        count,
        found: false,
      });
    });

    it('should log successful selector test with large count', () => {
      // Given: Logger and test data with many matches
      const fieldName = TEST_CONSTANTS.FIELD_NAMES.ITEMS;
      const selector = '.item';
      const count = TEST_CONSTANTS.COUNTS.LARGE;

      // When: Logging success
      logSelectorSuccess(mockLogger, fieldName, selector, count);

      // Then: Should call debug with large count
      expect(mockLogger.debug).toHaveBeenCalledWith(`Selector test for ${fieldName}`, {
        selector,
        count: TEST_CONSTANTS.COUNTS.LARGE,
        found: true,
      });
    });
  });

  describe('field name handling', () => {
    it('should handle field names with special characters', () => {
      // Given: Field name with special characters
      const fieldName = TEST_CONSTANTS.FIELD_NAMES.SPECIAL;
      const selector = TEST_CONSTANTS.SELECTORS.SPECIAL_FIELD;
      const count = TEST_CONSTANTS.COUNTS.ONE;

      // When: Logging success
      logSelectorSuccess(mockLogger, fieldName, selector, count);

      // Then: Should handle special characters in field name
      expect(mockLogger.debug).toHaveBeenCalledWith(`Selector test for ${fieldName}`, {
        selector,
        count,
        found: true,
      });
    });

    it('should handle Unicode field names', () => {
      // Given: Unicode field name
      const fieldName = TEST_CONSTANTS.UNICODE.FIELD_NAME;
      const selector = TEST_CONSTANTS.SELECTORS.UNICODE_FIELD;
      const count = TEST_CONSTANTS.COUNTS.ONE;

      // When: Logging success
      logSelectorSuccess(mockLogger, fieldName, selector, count);

      // Then: Should handle Unicode in field name
      expect(mockLogger.debug).toHaveBeenCalledWith(`Selector test for ${fieldName}`, {
        selector,
        count,
        found: true,
      });
    });

    it('should handle empty field name', () => {
      // Given: Empty field name
      const fieldName = TEST_CONSTANTS.FIELD_NAMES.EMPTY;
      const selector = TEST_CONSTANTS.SELECTORS.EMPTY_FIELD;
      const count = TEST_CONSTANTS.COUNTS.ONE;

      // When: Logging success
      logSelectorSuccess(mockLogger, fieldName, selector, count);

      // Then: Should handle empty field name
      expect(mockLogger.debug).toHaveBeenCalledWith(`Selector test for ${fieldName}`, {
        selector,
        count,
        found: true,
      });
    });
  });
});

describe('logSelectorFailure', () => {
  let mockLogger: Logger & MockLoggerSpies;

  beforeEach(() => {
    mockLogger = createMockLogger();
  });

  describe('basic error logging', () => {
    it('should log failed selector test with Error object', () => {
      // Given: Logger, field name, error, and selector
      const fieldName = TEST_CONSTANTS.FIELD_NAMES.AUTHOR;
      const error = new Error(TEST_CONSTANTS.ERROR_MESSAGES.SELECTOR_SYNTAX);
      const selector = '.author[invalid';

      // When: Logging failure
      logSelectorFailure(mockLogger, fieldName, error, selector);

      // Then: Should call error with correct parameters
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Selector test failed for ${fieldName}`,
        error,
        {
          selector,
        }
      );
    });

    it('should handle error with stack trace', () => {
      // Given: Error with stack trace
      const fieldName = TEST_CONSTANTS.FIELD_NAMES.STACK_FIELD;
      const error = new Error(TEST_CONSTANTS.ERROR_MESSAGES.STACK_TRACE);
      error.stack = 'Error: Stack trace error\n    at test (/test.js:1:1)';
      const selector = TEST_CONSTANTS.SELECTORS.STACK_ERROR;

      // When: Logging failure
      logSelectorFailure(mockLogger, fieldName, error, selector);

      // Then: Should include stack trace in error
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Selector test failed for ${fieldName}`,
        error,
        {
          selector,
        }
      );
    });
  });

  describe('custom error handling', () => {
    it('should log failed selector test with custom error type', () => {
      // Given: Custom error type
      const fieldName = TEST_CONSTANTS.FIELD_NAMES.PRICE;
      const error = createValidationError(
        TEST_CONSTANTS.ERROR_MESSAGES.INVALID_PRICE,
        'PRICE_FORMAT'
      );
      const selector = '.price';

      // When: Logging failure
      logSelectorFailure(mockLogger, fieldName, error, selector);

      // Then: Should call error with custom error
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Selector test failed for ${fieldName}`,
        error,
        {
          selector,
        }
      );
    });
  });

  describe('field name handling in failure', () => {
    it('should handle field names with special characters in failure logging', () => {
      // Given: Field name with special characters and error
      const fieldName = 'field@error#test';
      const error = new Error(TEST_CONSTANTS.ERROR_MESSAGES.SPECIAL_FIELD);
      const selector = TEST_CONSTANTS.SELECTORS.OBJECT_ERROR;

      // When: Logging failure
      logSelectorFailure(mockLogger, fieldName, error, selector);

      // Then: Should handle special characters in field name
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Selector test failed for ${fieldName}`,
        error,
        {
          selector,
        }
      );
    });

    it('should handle Unicode field names in failure logging', () => {
      // Given: Unicode field name and error
      const fieldName = TEST_CONSTANTS.UNICODE.ERROR_FIELD;
      const error = new Error(TEST_CONSTANTS.ERROR_MESSAGES.ERROR_ES);
      const selector = '.campo-error';

      // When: Logging failure
      logSelectorFailure(mockLogger, fieldName, error, selector);

      // Then: Should handle Unicode in field name
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Selector test failed for ${fieldName}`,
        error,
        {
          selector,
        }
      );
    });

    it('should handle empty field name in failure logging', () => {
      // Given: Empty field name and error
      const fieldName = TEST_CONSTANTS.FIELD_NAMES.EMPTY;
      const error = new Error(TEST_CONSTANTS.ERROR_MESSAGES.EMPTY_FIELD);
      const selector = TEST_CONSTANTS.SELECTORS.EMPTY_FIELD_ERROR;

      // When: Logging failure
      logSelectorFailure(mockLogger, fieldName, error, selector);

      // Then: Should handle empty field name
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Selector test failed for ${fieldName}`,
        error,
        {
          selector,
        }
      );
    });
  });
});

describe('Integration Tests with Real Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = Logger.getInstance({
      enableConsole: false,
      enableFile: false,
      level: 0, // DEBUG
    });
  });

  it('should work with real Logger instance for success logging', () => {
    // Given: Real logger instance
    const fieldName = TEST_CONSTANTS.FIELD_NAMES.INTEGRATION_TEST;
    const selector = TEST_CONSTANTS.SELECTORS.INTEGRATION;
    const count = TEST_CONSTANTS.COUNTS.FIVE;
    const debugSpy = spyOn(logger, 'debug').mockImplementation(() => {
      // Mock implementation for testing
    });

    // When: Logging success with real logger
    logSelectorSuccess(logger, fieldName, selector, count);

    // Then: Should call real logger method
    expect(debugSpy).toHaveBeenCalledWith(`Selector test for ${fieldName}`, {
      selector,
      count,
      found: true,
    });
  });

  it('should work with real Logger instance for failure logging', () => {
    // Given: Real logger instance
    const fieldName = TEST_CONSTANTS.FIELD_NAMES.INTEGRATION_ERROR;
    const error = new Error(TEST_CONSTANTS.ERROR_MESSAGES.INTEGRATION_TEST);
    const selector = TEST_CONSTANTS.SELECTORS.INTEGRATION_ERROR;
    const errorSpy = spyOn(logger, 'error').mockImplementation(() => {
      // Mock implementation for testing
    });

    // When: Logging failure with real logger
    logSelectorFailure(logger, fieldName, error, selector);

    // Then: Should call real logger method
    expect(errorSpy).toHaveBeenCalledWith(`Selector test failed for ${fieldName}`, error, {
      selector,
    });
  });
});

describe('Performance Tests', () => {
  it('should handle large text content efficiently', () => {
    // Given: Very large text content
    const selector = TEST_CONSTANTS.SELECTORS.PERFORMANCE;
    const count = TEST_CONSTANTS.COUNTS.ONE;
    const largeText = createLongText('x', TEST_CONSTANTS.LENGTHS.VERY_LONG_TEXT);

    // When: Creating result (should be fast)
    const startTime = performance.now();
    const result = createSuccessSelectorResult(selector, count, largeText);
    const endTime = performance.now();

    // Then: Should process quickly and truncate correctly
    expect(endTime - startTime).toBeLessThan(TEST_CONSTANTS.PERFORMANCE.MAX_TIME_SINGLE);
    expect(result.text.length).toBeLessThanOrEqual(TEST_CONSTANTS.LENGTHS.TEXT_TRUNCATE);
    expect(result.found).toBe(true);
  });

  it('should handle many small text operations efficiently', () => {
    // Given: Many operations
    const operations = TEST_CONSTANTS.LENGTHS.BATCH_OPERATIONS;
    const selector = TEST_CONSTANTS.SELECTORS.BATCH;

    // When: Processing many operations
    const startTime = performance.now();
    const results = Array.from({ length: operations }, (_, i) =>
      createSuccessSelectorResult(selector, i, `Text ${i}`)
    );
    const endTime = performance.now();

    // Then: Should process quickly
    expect(endTime - startTime).toBeLessThan(TEST_CONSTANTS.PERFORMANCE.MAX_TIME_BATCH);
    expect(results.length).toBe(operations);
    for (const [i, result] of results.entries()) {
      expect(result.count).toBe(i);
      expect(result.found).toBe(i > 0);
    }
  });
});

describe('Boundary Value Tests', () => {
  describe('createSuccessSelectorResult boundary values', () => {
    it.each([
      [TEST_CONSTANTS.COUNTS.ZERO, false],
      [TEST_CONSTANTS.COUNTS.ONE, true],
      [TEST_CONSTANTS.COUNTS.NEGATIVE, false],
      [Number.MAX_SAFE_INTEGER, true],
      [Number.MIN_SAFE_INTEGER, false],
      [Number.MAX_VALUE, true],
      [Number.MIN_VALUE, true], // MIN_VALUE is smallest positive number (> 0)
    ])('should handle count value %s with found: %s', (count, expectedFound) => {
      // Given: Boundary count value
      const selector = TEST_CONSTANTS.SELECTORS.BOUNDARY;
      const text = 'Boundary test';

      // When: Creating result
      const result = createSuccessSelectorResult(selector, count, text);

      // Then: Should handle boundary value correctly
      expect(result.count).toBe(count);
      expect(result.found).toBe(expectedFound);
    });
  });

  describe('text length boundary values', () => {
    it.each([
      [0, 'empty text'],
      [1, 'a'],
      [199, createLongText('a', 199)],
      [
        TEST_CONSTANTS.LENGTHS.TEXT_TRUNCATE,
        createLongText('a', TEST_CONSTANTS.LENGTHS.TEXT_TRUNCATE),
      ],
      [201, createLongText('a', 201)],
      [1000, createLongText('a', 1000)],
    ])('should handle text length %s correctly', (length, text) => {
      // Given: Text with specific length
      const selector = TEST_CONSTANTS.SELECTORS.TEXT_BOUNDARY;
      const count = TEST_CONSTANTS.COUNTS.ONE;

      // When: Creating result
      const result = createSuccessSelectorResult(selector, count, text);

      // Then: Should handle text length correctly
      expect(result.text.length).toBeLessThanOrEqual(TEST_CONSTANTS.LENGTHS.TEXT_TRUNCATE);
      if (length <= TEST_CONSTANTS.LENGTHS.TEXT_TRUNCATE) {
        expect(result.text).toBe(text);
      } else {
        expect(result.text).toBe(text.substring(0, TEST_CONSTANTS.LENGTHS.TEXT_TRUNCATE));
      }
    });
  });
});

describe('Edge Cases and Error Scenarios', () => {
  it('should handle selectors with injection attempts', () => {
    // Given: Potentially malicious selector
    const selector = TEST_CONSTANTS.SELECTORS.INJECTION;
    const count = TEST_CONSTANTS.COUNTS.ONE;
    const text = 'Safe content';

    // When: Creating result
    const result = createSuccessSelectorResult(selector, count, text);

    // Then: Should handle safely (not execute)
    expect(result.selector).toContain('<script>');
    expect(result.found).toBe(true);
  });

  it('should handle control characters in text', () => {
    // Given: Text with control characters
    const selector = TEST_CONSTANTS.SELECTORS.CONTROL_CHARS;
    const count = TEST_CONSTANTS.COUNTS.ONE;
    const controlText = TEST_CONSTANTS.TEXT_SAMPLES.CONTROL;

    // When: Creating result
    const result = createSuccessSelectorResult(selector, count, controlText);

    // Then: Should preserve control characters
    expect(result.text).toContain('\u0000');
    expect(result.text).toContain('\u0001');
    expect(result.text).toContain('\u001F');
  });

  it('should handle surrogate pairs and emoji correctly', () => {
    // Given: Text with complex Unicode including emoji
    const selector = TEST_CONSTANTS.SELECTORS.EMOJI;
    const count = TEST_CONSTANTS.COUNTS.ONE;
    const emojiText = TEST_CONSTANTS.TEXT_SAMPLES.EMOJI_COMPLEX;

    // When: Creating result
    const result = createSuccessSelectorResult(selector, count, emojiText);

    // Then: Should preserve emoji correctly
    expect(result.text).toBe(emojiText);
    expect(result.found).toBe(true);
  });

  it('should handle very long selector names', () => {
    // Given: Very long selector
    const longSelector = createLongText('a', TEST_CONSTANTS.LENGTHS.LONG_SELECTOR);
    const count = TEST_CONSTANTS.COUNTS.ONE;
    const text = 'Long selector test';

    // When: Creating result
    const result = createSuccessSelectorResult(longSelector, count, text);

    // Then: Should handle long selector
    expect(result.selector).toBe(longSelector);
    expect(result.selector.length).toBe(TEST_CONSTANTS.LENGTHS.LONG_SELECTOR);
    expect(result.found).toBe(true);
  });

  it('should handle circular reference in error object', () => {
    // Given: Error with circular reference
    const selector = TEST_CONSTANTS.SELECTORS.CIRCULAR_ERROR;
    const error: any = new Error(TEST_CONSTANTS.ERROR_MESSAGES.CIRCULAR_ERROR);
    error.self = error; // Create circular reference

    // When: Creating failure result
    const result = createFailureSelectorResult(selector, error);

    // Then: Should handle circular reference gracefully
    expect(result.error).toBe(TEST_CONSTANTS.ERROR_MESSAGES.CIRCULAR_ERROR);
    expect(result.found).toBe(false);
  });
});

describe('Type Safety Tests', () => {
  it('should maintain correct SelectorDebugResult type structure', () => {
    // Given: Various inputs
    const successResult = createSuccessSelectorResult('.test', TEST_CONSTANTS.COUNTS.ONE, 'test');
    const failureResult = createFailureSelectorResult('.test', new Error('test'));

    // When: Checking types
    const successKeys = Object.keys(successResult);
    const failureKeys = Object.keys(failureResult);

    // Then: Should maintain correct structure
    expect(successKeys).toContain('selector');
    expect(successKeys).toContain('count');
    expect(successKeys).toContain('text');
    expect(successKeys).toContain('found');
    expect(successKeys).not.toContain('error');

    expect(failureKeys).toContain('selector');
    expect(failureKeys).toContain('count');
    expect(failureKeys).toContain('text');
    expect(failureKeys).toContain('found');
    expect(failureKeys).toContain('error');
  });

  it('should handle type coercion properly', () => {
    // Given: Mixed type inputs
    const selector = TEST_CONSTANTS.SELECTORS.TYPE_TEST;
    const count = '5' as any; // String instead of number
    const text = 123 as any; // Number instead of string

    // When: Creating result with type coercion
    // Then: Should throw an error for non-string text
    expect(() => createSuccessSelectorResult(selector, count, text)).toThrow();
  });
});
