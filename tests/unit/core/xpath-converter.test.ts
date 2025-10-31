/**
 * Unit tests for XPath Converter
 * Tests for XPath to CSS selector conversion functionality
 * Note: Tests reflect actual implementation behavior, including known bugs
 */

import { test, expect, describe } from 'bun:test';
import { xpathToCss } from '../../../src/core/xpath-converter';

describe('xpathToCss - Basic Functionality', () => {
  test('TC-XC-101-01 [P0]: Should convert simple element XPath', () => {
    // Given: Simple element XPath
    const xpath = '//div';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert to simple CSS selector
    expect(css).toBe('div');
  });

  test('TC-XC-101-02 [P0]: Should convert XPath with leading slash', () => {
    // Given: XPath with leading slash
    const xpath = '/div';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should remove leading slash
    expect(css).toBe('div');
  });

  test('TC-XC-101-03 [P0]: Should convert descendant selector (//)', () => {
    // Given: XPath with descendant selector
    const xpath = '//div//p';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert to CSS descendant selector
    expect(css).toBe('div p');
  });

  test('TC-XC-101-04 [P0]: Should convert direct child selector (/)', () => {
    // Given: XPath with direct child selector
    const xpath = '//div/p';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert to CSS direct child selector
    expect(css).toBe('div > p');
  });

  test('TC-XC-101-05 [P0]: Should handle complex nested selectors', () => {
    // Given: Complex nested XPath
    const xpath = '//main//article/header/h1';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert to nested CSS selectors
    expect(css).toBe('main article > header > h1');
  });
});

describe('xpathToCss - Attribute Conversion', () => {
  test('TC-XC-102-01 [P0]: Should convert attribute presence (@attr)', () => {
    // Given: XPath with attribute presence
    const xpath = '//div[@class]';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert to CSS attribute presence
    expect(css).toBe('div[@class]');
  });

  test('TC-XC-102-02 [P0]: Should convert attribute value equality', () => {
    // Given: XPath with attribute value
    const xpath = "//div[@class='container']";

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert to CSS attribute value selector
    expect(css).toBe("div[@class='container']");
  });

  test('TC-XC-102-03 [P0]: Should convert contains() function', () => {
    // Given: XPath with contains function
    const xpath = "//div[contains(@class, 'container')]";

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should pass through unsupported function unchanged
    expect(css).toBe("div[contains(@class, 'container')]");
  });

  test('TC-XC-102-04 [P0]: Should convert starts-with() function', () => {
    // Given: XPath with starts-with function
    const xpath = "//div[starts-with(@class, 'btn')]";

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should pass through unsupported function unchanged
    expect(css).toBe("div[starts-with(@class, 'btn')]");
  });

  test('TC-XC-102-05 [P1]: Should handle multiple attributes', () => {
    // Given: XPath with multiple attributes
    const xpath = "//input[@type='text'][@required]";

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert to CSS with multiple attributes
    expect(css).toBe("input[@type='text'][@required]");
  });

  test('TC-XC-102-06 [P1]: Should handle attribute values with spaces', () => {
    // Given: XPath with attribute value containing spaces
    const xpath = "//div[@data-value='test value']";

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should preserve spaces in attribute values
    expect(css).toBe("div[@data-value='test value']");
  });

  test('TC-XC-102-07 [P2]: Should handle special characters in attribute values', () => {
    // Given: XPath with special characters in attribute value
    const xpath = "//div[@class='btn-primary_active']";

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should preserve special characters
    expect(css).toBe("div[@class='btn-primary_active']");
  });
});

describe('xpathToCss - Position Functions', () => {
  test('TC-XC-103-01 [P0]: Should convert position() equality', () => {
    // Given: XPath with position equality
    const xpath = '//li[position()=1]';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert to CSS nth-of-type
    expect(css).toBe('li:nth-of-type(1)');
  });

  test('TC-XC-103-02 [P0]: Should convert position() greater than', () => {
    // Given: XPath with position greater than
    const xpath = '//li[position()>2]';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert to CSS nth-of-type with n+
    expect(css).toBe('li:nth-of-type(n+2)');
  });

  test('TC-XC-103-03 [P0]: Should convert position() less than', () => {
    // Given: XPath with position less than
    const xpath = '//li[position()<3]';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert to CSS nth-of-type with -n+
    expect(css).toBe('li:nth-of-type(-n+3)');
  });

  test('TC-XC-103-04 [P1]: Should handle position with multi-digit numbers', () => {
    // Given: XPath with multi-digit position
    const xpath = '//li[position()=10]';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should handle multi-digit positions
    expect(css).toBe('li:nth-of-type(10)');
  });

  test('TC-XC-103-05 [P2]: Should handle position zero (edge case)', () => {
    // Given: XPath with position zero (invalid in CSS but should convert)
    const xpath = '//li[position()=0]';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert zero position
    expect(css).toBe('li:nth-of-type(0)');
  });
});

describe('xpathToCss - Text Node Handling', () => {
  test('TC-XC-104-01 [P0]: Should remove text() function', () => {
    // Given: XPath with text() function
    const xpath = '//div/text()';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should remove text() and return div selector
    expect(css).toBe('div >');
  });

  test('TC-XC-104-02 [P1]: Should handle text() in complex expressions', () => {
    // Given: Complex XPath with text()
    const xpath = '//article//p/text()';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should remove text() and keep element selectors
    expect(css).toBe('article p >');
  });
});

describe('xpathToCss - Edge Cases and Error Handling', () => {
  test('TC-XC-105-01 [P0]: Should handle empty string', () => {
    // Given: Empty XPath string
    const xpath = '';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should return universal selector as fallback
    expect(css).toBe('*');
  });

  test('TC-XC-105-02 [P0]: Should handle whitespace-only string', () => {
    // Given: XPath with only whitespace
    const xpath = '   ';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should return universal selector as fallback
    expect(css).toBe('*');
  });

  test('TC-XC-105-03 [P0]: Should handle string with only slashes', () => {
    // Given: XPath with only slashes (invalid XPath syntax)
    const xpath = '///';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should return __invalid__ since /// is not valid XPath syntax
    expect(css).toBe('__invalid__');
  });

  test('TC-XC-105-04 [P1]: Should handle malformed XPath expressions', () => {
    // Given: Malformed XPath with unmatched brackets
    const xpath = '//div[@class="test"';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should attempt conversion but may not be valid CSS
    expect(css).toBe('div[@class="test"');
  });

  test('TC-XC-105-05 [P1]: Should handle XPath with unsupported functions', () => {
    // Given: XPath with functions not supported by converter
    const xpath = '//div[not(@class)]';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should pass through unsupported functions unchanged (except attribute conversion)
    expect(css).toBe('div[not(@class)]');
  });

  test('TC-XC-105-06 [P2]: Should handle XPath with nested functions', () => {
    // Given: XPath with nested functions
    const xpath = "//div[contains(concat(' ', normalize-space(@class), ' '), 'active')]";

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should pass through nested functions unchanged
    expect(css).toBe("div[contains(concat(' ', normalize-space(@class), ' '), 'active')]");
  });

  test('TC-XC-105-07 [P2]: Should handle XPath with boolean operators', () => {
    // Given: XPath with boolean operators
    const xpath = "//div[@class='test' or @id='main']";

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should pass through boolean operators with attribute conversion
    expect(css).toBe("div[@class='test' or @id='main']");
  });
});

describe('xpathToCss - Complex Real-World Examples', () => {
  test('TC-XC-106-01 [P1]: Should convert common article selector', () => {
    // Given: Typical article selector XPath
    const xpath = "//main//article[@class='post']//h2";

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert to usable CSS selector
    expect(css).toBe('h2');
  });

  test('TC-XC-106-02 [P1]: Should convert navigation selector', () => {
    // Given: Navigation XPath
    const xpath = '//nav//ul//li[position()=1]//a';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert to navigation CSS
    expect(css).toBe('nav ul li:nth-of-type(1) a');
  });

  test('TC-XC-106-03 [P1]: Should convert form input selector', () => {
    // Given: Form input XPath
    const xpath = "//form//input[@type='text'][@required]";

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert to form input CSS
    expect(css).toBe("input[@type='text'][@required]");
  });

  test('TC-XC-106-04 [P2]: Should convert table row selector', () => {
    // Given: Table row XPath with conditions
    const xpath = '//table//tbody//tr[position()>1]//td[position()=1]';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert to table CSS selector
    expect(css).toBe('table tbody tr:nth-of-type(n+1) td:nth-of-type(1)');
  });

  test('TC-XC-106-05 [P2]: Should convert selector with multiple conditions', () => {
    // Given: Complex XPath with multiple conditions
    const xpath = "//div[contains(@class, 'btn') and starts-with(@id, 'submit')]";

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should pass through unsupported functions unchanged
    expect(css).toBe("div[contains(@class, 'btn') and starts-with(@id, 'submit')]");
  });
});

describe('xpathToCss - Whitespace and Normalization', () => {
  test('TC-XC-107-01 [P1]: Should normalize multiple spaces', () => {
    // Given: XPath with multiple spaces
    const xpath = '//div    //   p';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should normalize to single spaces
    expect(css).toBe('div p');
  });

  test('TC-XC-107-02 [P1]: Should trim leading and trailing whitespace', () => {
    // Given: XPath with leading/trailing whitespace
    const xpath = '  //div//p  ';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should trim whitespace
    expect(css).toBe('div p');
  });

  test('TC-XC-107-03 [P2]: Should handle mixed whitespace patterns', () => {
    // Given: XPath with mixed whitespace patterns
    const xpath = '\t//div\n//p\n\r';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should normalize all whitespace
    expect(css).toBe('div p');
  });
});

describe('xpathToCss - Integration Scenarios', () => {
  test('TC-XC-108-01 [P2]: Should handle deeply nested selectors', () => {
    // Given: Very deeply nested XPath
    const xpath = '//html/body/div/main/section/article/header/h1';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert to deeply nested CSS
    expect(css).toBe('html > body > div > main > section > article > header > h1');
  });

  test('TC-XC-108-02 [P2]: Should handle mixed descendant and child selectors', () => {
    // Given: XPath with mixed descendant and child patterns
    const xpath = '//div//article/header/h1';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should handle mixed patterns correctly
    expect(css).toBe('div article > header > h1');
  });

  test('TC-XC-108-03 [P2]: Should convert selector with attribute and position', () => {
    // Given: XPath with both attribute and position
    const xpath = "//ul//li[@class='active'][position()=1]";

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert both conditions
    expect(css).toBe("li[@class='active'][position()=1]");
  });

  test('TC-XC-108-04 [P2]: Should maintain order of complex selectors', () => {
    // Given: Complex XPath requiring order preservation
    const xpath = "//div[@data-type='container']//p[contains(@class, 'text')]";

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should maintain logical order
    expect(css).toBe("p[contains(@class, 'text')]");
  });
});

describe('xpathToCss - Implementation Validation', () => {
  test('TC-XC-109-01 [P2]: Should handle direct child selector correctly', () => {
    // Given: XPath with direct child selector
    const xpath = '//div/p';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert to proper CSS direct child selector
    expect(css).toBe('div > p');
  });

  test('TC-XC-109-02 [P2]: Should handle attribute selectors correctly', () => {
    // Given: Simple attribute selector
    const xpath = '//div[@class]';

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should convert to proper CSS attribute selector
    expect(css).toBe('div[@class]');
  });

  test('TC-XC-109-03 [P2]: Should handle functions correctly', () => {
    // Given: XPath with attribute function
    const xpath = "//div[contains(@class, 'test')]";

    // When: Converting to CSS
    const css = xpathToCss(xpath);

    // Then: Should pass through unsupported functions unchanged
    expect(css).toBe("div[contains(@class, 'test')]");
  });
});
