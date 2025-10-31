/**
 * Unit tests for HtmlParser - Constructor Options
 * Tests for constructor parameter handling and options validation
 */

import { test, expect, beforeEach, describe } from 'bun:test';
import { HtmlParser } from '../../../../src/core/html-parser';

let _parser: HtmlParser;

beforeEach(() => {
  _parser = new HtmlParser();
});

describe('HtmlParser - Constructor Options', () => {
  test('TC-HP-CO-01 [P1]: should initialize with default options', () => {
    const customParser = new HtmlParser();
    expect(customParser).toBeInstanceOf(HtmlParser);
  });

  test('TC-HP-CO-02 [P1]: should initialize with custom options', () => {
    const options = {
      removeComments: true,
      removeScripts: true,
      removeStyles: true,
      decodeEntities: true,
    };

    const customParser = new HtmlParser(options);
    expect(customParser).toBeInstanceOf(HtmlParser);
  });

  test('TC-HP-CO-03 [P2]: should handle boolean option combinations', () => {
    const optionSets = [
      { removeComments: true, removeScripts: false },
      { removeComments: false, removeScripts: true },
      { removeComments: true, removeScripts: true },
      { removeComments: false, removeScripts: false },
    ];

    for (const options of optionSets) {
      const customParser = new HtmlParser(options);
      expect(customParser).toBeInstanceOf(HtmlParser);
    }
  });

  test('TC-HP-CO-04 [P2]: should validate option types', () => {
    const validOptions = [
      { removeComments: true },
      { removeComments: false },
      { decodeEntities: true },
      { decodeEntities: false },
      { removeScripts: true },
      { removeStyles: true },
    ];

    for (const options of validOptions) {
      expect(() => new HtmlParser(options)).not.toThrow();
    }
  });

  test('TC-HP-CO-05 [P3]: should maintain parser state after initialization', () => {
    const customParser = new HtmlParser({ removeComments: true });

    // Initially should have no content
    expect(customParser.getOriginalHtml()).toBe('');
    expect(customParser.getHtml()).toBe('');
  });

  test('TC-HP-CO-06 [P3]: should handle null/undefined options gracefully', () => {
    expect(() => new HtmlParser(null as any)).not.toThrow();
    expect(() => new HtmlParser(undefined as any)).not.toThrow();
  });

  test('TC-HP-CO-07 [P3]: should handle empty options object', () => {
    const customParser = new HtmlParser({});
    expect(customParser).toBeInstanceOf(HtmlParser);
  });
});
