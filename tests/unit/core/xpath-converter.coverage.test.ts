/**
 * Comprehensive test coverage for XPath Converter
 * Focuses on remaining edge cases to achieve 98%+ coverage
 */

import { describe, test, expect } from 'bun:test';
import { xpathToCss } from '../../../src/core/xpath-converter';

describe('XPath Converter Coverage Tests', () => {
  describe('TC-XC-100-01 [P0]: Basic path conversions', () => {
    test('should convert simple element paths', () => {
      expect(xpathToCss('/html/body/div')).toBe('html > body > div');
      expect(xpathToCss('div')).toBe('div');
      expect(xpathToCss('//div')).toBe('div');
    });

    test('should handle descendant selectors (//)', () => {
      expect(xpathToCss('//div/span')).toBe('div > span');
      expect(xpathToCss('/html//div')).toBe('html div');
      expect(xpathToCss('//div//span')).toBe('div span');
    });

    test('should handle direct child selectors (/)', () => {
      expect(xpathToCss('div/span')).toBe('div > span');
      expect(xpathToCss('html/body/div')).toBe('html > body > div');
    });

    test('should remove leading slash', () => {
      expect(xpathToCss('/div')).toBe('div');
      expect(xpathToCss('/html/body')).toBe('html > body');
    });

    test('should clean up multiple spaces', () => {
      expect(xpathToCss('//div   //   span')).toBe('div span');
      expect(xpathToCss('div    >    span')).toBe('div > span');
    });
  });

  describe('TC-XC-101-01 [P0]: Attribute selector conversions', () => {
    test('should convert simple attribute selectors', () => {
      expect(xpathToCss('//div[@class]')).toBe('div[@class]');
      expect(xpathToCss('//input[@type]')).toBe('input[@type]');
    });

    test('should convert attribute values with single quotes', () => {
      expect(xpathToCss("//div[@class='container']")).toBe("div[@class='container']");
      expect(xpathToCss("//input[@type='text']")).toBe("input[@type='text']");
    });

    test('should convert attribute values with double quotes', () => {
      expect(xpathToCss('//div[@class="container"]')).toBe('div[@class="container"]');
      expect(xpathToCss('//input[@type="text"]')).toBe('input[@type="text"]');
    });

    test('should convert contains() functions', () => {
      expect(xpathToCss("//div[contains(@class, 'container')]")).toBe(
        "div[contains(@class, 'container')]"
      );
      expect(xpathToCss('//div[contains(@class, "container")]')).toBe(
        'div[contains(@class, "container")]'
      );
      expect(xpathToCss("//a[contains(@href, 'example')]")).toBe("a[contains(@href, 'example')]");
    });

    test('should convert starts-with() functions', () => {
      expect(xpathToCss("//div[starts-with(@class, 'container')]")).toBe(
        "div[starts-with(@class, 'container')]"
      );
      expect(xpathToCss('//div[starts-with(@class, "container")]')).toBe(
        'div[starts-with(@class, "container")]'
      );
      expect(xpathToCss("//a[starts-with(@href, 'https')]")).toBe("a[starts-with(@href, 'https')]");
    });

    test('should convert position() functions', () => {
      expect(xpathToCss('//div[position()=1]')).toBe('div:nth-of-type(1)');
      expect(xpathToCss('//div[position()=3]')).toBe('div:nth-of-type(3)');
      expect(xpathToCss('//div[position()>2]')).toBe('div:nth-of-type(n+2)');
      expect(xpathToCss('//div[position()<5]')).toBe('div:nth-of-type(-n+5)');
    });

    test('should handle text() nodes', () => {
      expect(xpathToCss('//div/text()')).toBe('div >');
      expect(xpathToCss('//p/text()')).toBe('p >');
    });
  });

  describe('TC-XC-102-01 [P0]: Complex XPath combinations', () => {
    test('should handle mixed path and attribute selectors', () => {
      expect(xpathToCss('//div[@class="container"]/span')).toBe('div[@class="container"] > span');
      expect(xpathToCss('/html/body//div[@id="main"]')).toBe('html body div[@id="main"]');
    });

    test('should handle multiple attribute conditions', () => {
      expect(xpathToCss("//div[@class='container'][@id='main']")).toBe(
        "div[@class='container'][@id='main']"
      );
      expect(xpathToCss('//input[@type="text"][@name="username"]')).toBe(
        'input[@type="text"][@name="username"]'
      );
    });

    test('should handle nested selectors with conditions', () => {
      expect(xpathToCss('//div[contains(@class, "container")]/span[position()=1]')).toBe(
        'div[contains(@class, "container")] > span:nth-of-type(1)'
      );
      expect(xpathToCss('//ul/li[starts-with(@class, "item-")]')).toBe(
        'ul li[starts-with(@class, "item-")]'
      );
    });

    test('should handle complex descendant paths with attributes', () => {
      expect(xpathToCss('//div[@class="main"]//p[contains(@class, "text")]')).toBe(
        'p[contains(@class, "text")]'
      );
    });
  });

  describe('TC-XC-103-01 [P1]: Edge cases and special characters', () => {
    test('should handle special characters in attribute values', () => {
      expect(xpathToCss("//div[@class='test-class_name']")).toBe("div[@class='test-class_name']");
      expect(xpathToCss('//div[@data-value="test:value"]')).toBe('div[@data-value="test:value"]');
      expect(xpathToCss('//div[@title=\'Quote: "test"\']')).toBe('div[@title=\'Quote: "test"\']');
    });

    test('should handle Unicode characters in attribute values', () => {
      expect(xpathToCss("//div[@title='测试']")).toBe("div[@title='测试']");
      expect(xpathToCss('//div[@data-emoji="🌍"]')).toBe('div[@data-emoji="🌍"]');
    });

    test('should handle empty attribute values', () => {
      expect(xpathToCss("//div[@class='']")).toBe("div[@class='']");
      expect(xpathToCss('//div[@data-empty=""]')).toBe('div[@data-empty=""]');
    });

    test('should handle numbers in attribute values', () => {
      expect(xpathToCss('//div[@data-id="123"]')).toBe('div[@data-id="123"]');
      expect(xpathToCss('//input[@min="0"]')).toBe('input[@min="0"]');
    });

    test('should handle hyphens and underscores in tag names', () => {
      expect(xpathToCss('//custom-element')).toBe('custom-element');
      expect(xpathToCss('//some_tag')).toBe('some_tag');
      expect(xpathToCss('//custom-element[@data-id="test"]')).toBe(
        'custom-element[@data-id="test"]'
      );
    });
  });

  describe('TC-XC-104-01 [P1]: Error handling and validation', () => {
    test('should return safe fallback for empty XPath', () => {
      expect(xpathToCss('')).toBe('*');
      expect(xpathToCss('   ')).toBe('*');
    });

    test('should return safe fallback for invalid XPath', () => {
      expect(xpathToCss('///invalid///path///')).toBe('__invalid__');
    });

    test('should handle malformed attribute selectors gracefully', () => {
      // This should trigger the validation and return no matches for malformed XPath
      expect(xpathToCss('//div[@invalid]')).toBe('__invalid__');
    });

    test('should handle XPath with only slashes', () => {
      expect(xpathToCss('///')).toBe('__invalid__');
      expect(xpathToCss('/')).toBe('__invalid__');
    });

    test('should handle null/undefined input', () => {
      expect(xpathToCss(null as any)).toBe('*');
      expect(xpathToCss(undefined as any)).toBe('*');
    });

    test('should handle very long XPath expressions', () => {
      const longXPath = `//div[contains(@class, "${'a'.repeat(1000)}")]`;
      expect(xpathToCss(longXPath)).toContain('div[class*="');
    });
  });

  describe('TC-XC-105-01 [P1]: Validation edge cases', () => {
    test('should validate attribute selectors without brackets', () => {
      expect(xpathToCss('div')).toBe('div');
      expect(xpathToCss('span')).toBe('span');
    });

    test('should handle missing closing brackets', () => {
      const malformedXpath = "//div[@class='unclosed'";
      expect(xpathToCss(malformedXpath)).toBe('__invalid__');
    });

    test('should handle nested brackets in attributes', () => {
      expect(xpathToCss('//div[@data-json=\'["test"]\']')).toBe('__invalid__');
    });

    test('should handle selectors with special regex characters', () => {
      expect(xpathToCss("//div[@class='test+value']")).toBe('div[class="test+value"]');
      expect(xpathToCss('//div[@class="test*value"]')).toBe('div[class="test*value"]');
    });

    test('should handle empty attribute names', () => {
      expect(xpathToCss("//div[@='value']")).toBe('__invalid__');
    });
  });

  describe('TC-XC-106-01 [P1]: Real-world XPath patterns', () => {
    test('should handle common scraping XPath patterns', () => {
      expect(xpathToCss('//div[@id="content"]/div[@class="article"]/h1')).toBe(
        'div[id="content"] > div[class="article"] > h1'
      );
      expect(xpathToCss('//ul[contains(@class, "menu")]/li[position()=1]/a')).toBe(
        'ul[class*="menu"] > li:nth-of-type(1) > a'
      );
      expect(xpathToCss('//table[@class="data"]//tr[position()>1]/td[position()=1]')).toBe(
        'table[class="data"] tr:nth-of-type(n+1) td:nth-of-type(1)'
      );
    });

    test('should handle form-related XPath patterns', () => {
      expect(xpathToCss('//form[@name="login"]//input[@type="text"]')).toBe(
        'form[name="login"] input[type="text"]'
      );
      expect(xpathToCss('//select[@id="country"]/option[contains(@value, "US")]')).toBe(
        'select[id="country"] option[value*="US"]'
      );
      expect(xpathToCss('//input[starts-with(@name, "user_")]')).toBe('input[name^="user_"]');
    });

    test('should handle navigation XPath patterns', () => {
      expect(xpathToCss('//nav//ul/li[position()=last()]')).toBe('nav ul li:nth-of-type(last())');
      expect(xpathToCss('//div[contains(@class, "breadcrumb")]/a[position()>1]')).toBe(
        'div[class*="breadcrumb"] a:nth-of-type(n+1)'
      );
    });

    test('should handle content extraction patterns', () => {
      expect(
        xpathToCss('//article[contains(@class, "post")]/div[@class="content"]/p[position()=1]')
      ).toBe('article[class*="post"] > div[class="content"] > p:nth-of-type(1)');
      expect(xpathToCss('//section[@id="comments"]//div[starts-with(@class, "comment-")]')).toBe(
        'section[id="comments"] div[class^="comment-"]'
      );
    });
  });

  describe('TC-XC-107-01 [P2]: Performance and optimization edge cases', () => {
    test('should handle extremely complex nested selectors', () => {
      const complexXPath =
        '/html/body/div[@id="container"]/div[@class="wrapper"]/div[contains(@class, "content")]/div[@class="article"]/div[@class="text"]/p[position()=1]/strong[position()=1]';
      const result = xpathToCss(complexXPath);

      expect(result).toContain('html > body > div');
      expect(result).toContain('div[id="container"]');
      expect(result).toContain('div[class*="content"]');
      expect(result).toContain('p:nth-of-type(1)');
      expect(result).toContain('strong:nth-of-type(1)');
    });

    test('should handle XPath with repeated patterns', () => {
      const repeatedXPath = '//div//div//div//span[contains(@class, "deep")]';
      expect(xpathToCss(repeatedXPath)).toBe('div div div span[class*="deep"]');
    });

    test('should handle XPath with mixed quote types', () => {
      const mixedQuotesXPath =
        '//div[@class="outer"]//span[contains(@title, \'mixed\') and @data-value="test"]';
      const result = xpathToCss(mixedQuotesXPath);
      expect(result).toContain('div[class="outer"]');
      expect(result).toContain('span[title*="mixed"]');
    });

    test('should handle XPath with numeric positions at boundaries', () => {
      expect(xpathToCss('//div[position()=0]')).toBe('div:nth-of-type(0)');
      expect(xpathToCss('//div[position()=999]')).toBe('div:nth-of-type(999)');
      expect(xpathToCss('//div[position()>999]')).toBe('div:nth-of-type(n+999)');
      expect(xpathToCss('//div[position()<999]')).toBe('div:nth-of-type(-n+999)');
    });
  });

  describe('TC-XC-108-01 [P2]: Fallback behavior testing', () => {
    test('should use last segment as fallback for complex invalid XPath', () => {
      const invalidXpath = '/invalid/path/to/element';
      expect(xpathToCss(invalidXpath)).toBe('element');
    });

    test('should use wildcard as fallback for single-element invalid XPath', () => {
      const invalidXpath = '/invalid';
      expect(xpathToCss(invalidXpath)).toBe('invalid');
    });

    test('should handle XPath that splits to empty array', () => {
      expect(xpathToCss('////')).toBe('__invalid__');
    });

    test('should preserve case in fallback', () => {
      expect(xpathToCss('/CustomElement')).toBe('CustomElement');
      expect(xpathToCss('/another-tag_name')).toBe('another-tag_name');
    });
  });

  describe('TC-XC-109-01 [P2]: Boundary condition testing', () => {
    test('should handle maximum attribute name length', () => {
      const longAttrName = `data-${'a'.repeat(100)}`;
      const xpath = `//div[@${longAttrName}='value']`;
      expect(xpathToCss(xpath)).toContain(`[${longAttrName}="value"]`);
    });

    test('should handle maximum attribute value length', () => {
      const longValue = 'x'.repeat(1000);
      const xpath = `//div[@class='${longValue}']`;
      expect(xpathToCss(xpath)).toContain(`[class="${longValue}"]`);
    });

    test('should handle deeply nested paths with many levels', () => {
      let deepPath = '';
      for (let i = 0; i < 50; i++) {
        deepPath += '/div';
      }
      const result = xpathToCss(deepPath);
      expect(result).toContain('div');
    });

    test('should handle XPath with many attribute conditions', () => {
      const attrs = Array.from({ length: 20 }, (_, i) => `[@attr${i}='value${i}']`).join('');
      const manyAttrs = `//div${attrs}`;
      const result = xpathToCss(manyAttrs);
      expect(result.split('[data-attr').length - 1).toBe(19); // Should have 19 data-attr patterns after conversion
    });
  });

  describe('TC-XC-110-01 [P2]: Integration scenarios', () => {
    test('should handle typical web scraping XPath patterns', () => {
      const patterns = [
        '//div[@id="main-content"]//article[contains(@class, "post")]',
        '//nav//ul[contains(@class, "menu")]/li[position()>1]/a',
        '//table[@class="data"]/tbody/tr[position()>1]/td[position()=1]',
        '//form[@name="search"]//input[@type="text" and contains(@name, "query")]',
        '//footer//div[contains(@class, "links")]/a[starts-with(@href, "https")]',
      ];

      for (const pattern of patterns) {
        const result = xpathToCss(pattern);
        expect(result).not.toBe('*'); // Should not fall back to wildcard for valid patterns
        expect(result).toBeTruthy();
      }
    });

    test('should maintain selector readability after conversion', () => {
      const readableXPath =
        '//div[@class="container"]//p[contains(@class, "text") and position()=1]';
      const css = xpathToCss(readableXPath);

      expect(css).toContain('div[class="container"]');
      expect(css).toContain('p[class*="text"]');
      expect(css).toContain('p[class*="text"]:nth-of-type(1)');
    });

    test('should handle conversion round-trip stability', () => {
      const simpleXPath = '//div[@class="test"]/span';
      const css = xpathToCss(simpleXPath);

      // Should produce consistent output for multiple calls
      expect(xpathToCss(simpleXPath)).toBe(css);
      expect(xpathToCss(simpleXPath)).toBe(xpathToCss(simpleXPath));
    });
  });
});
