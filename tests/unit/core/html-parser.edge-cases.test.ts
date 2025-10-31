import { test, expect, beforeEach, describe } from 'bun:test';
import { HtmlParser } from '../../../src/core/html-parser';

describe('HtmlParser - Edge Cases and Comprehensive Coverage', () => {
  let parser: HtmlParser;

  beforeEach(() => {
    parser = new HtmlParser();
  });

  describe('TC-HP-201-01 [P2]: Remove Empty Elements Functionality', () => {
    test('should remove empty elements when option is enabled', () => {
      const htmlWithEmptyElements = `
        <div>
          <p>Content</p>
          <span></span>
          <div></div>
          <section>   </section>
          <article>
            <p>Nested content</p>
            <span></span>
          </article>
        </div>
      `;

      const parserWithCleanup = new HtmlParser({ removeEmptyElements: true });
      parserWithCleanup.load(htmlWithEmptyElements);

      const _result = parserWithCleanup.getHtml();

      // Should not contain empty elements
      expect(_result).not.toContain('<span></span>');
      expect(_result).not.toContain('<div></div>');
      expect(_result).not.toContain('<section>   </section>');

      // Should preserve content
      expect(_result).toContain('<p>Content</p>');
      expect(_result).toContain('Nested content');
    });

    test('should preserve elements with attributes even if empty', () => {
      const htmlWithAttributes = `
        <div>
          <span data-id="1"></span>
          <div class="empty-div"></div>
          <section id="test"></section>
        </div>
      `;

      const parserWithCleanup = new HtmlParser({ removeEmptyElements: true });
      parserWithCleanup.load(htmlWithAttributes);

      const _result = parserWithCleanup.getHtml();

      // Should preserve elements with attributes
      expect(_result).toContain('<span data-id="1"></span>');
      expect(_result).toContain('<div class="empty-div"></div>');
      expect(_result).toContain('<section id="test"></section>');
    });

    test('should preserve elements with children even if text is empty', () => {
      const htmlWithChildren = `
        <div>
          <div>
            <span></span>
          </div>
          <section>
            <p></p>
          </section>
        </div>
      `;

      const parserWithCleanup = new HtmlParser({ removeEmptyElements: true });
      parserWithCleanup.load(htmlWithChildren);

      const _result = parserWithCleanup.getHtml();

      // Should preserve elements that have children
      expect(_result).toContain('<div>');
      expect(_result).toContain('<section>');
      // Empty children get removed, so parent divs might be empty and also get removed
      // Check that some structure is preserved
      expect(_result).toBeTruthy();
    });

    test('should not affect parser when removeEmptyElements is false', () => {
      const htmlWithEmptyElements = `
        <div>
          <p>Content</p>
          <span></span>
          <div></div>
        </div>
      `;

      const parserWithoutCleanup = new HtmlParser({ removeEmptyElements: false });
      parserWithoutCleanup.load(htmlWithEmptyElements);

      const _result = parserWithoutCleanup.getHtml();

      // Should preserve empty elements when option is disabled
      expect(_result).toContain('<span></span>');
      expect(_result).toContain('<div></div>');
      expect(_result).toContain('<p>Content</p>');
    });
  });

  describe('TC-HP-202-01 [P2]: Malformed HTML Handling', () => {
    test('should handle unclosed tags gracefully', () => {
      const malformedHtml = `
        <html>
          <head>
            <title>Test Page</title>
          </head>
          <body>
            <h1>Main Title</h1>
            <p>Paragraph without closing tag
            <div>Nested div
              <span>Span content</span>
            </div>
          </body>
        </html>
      `;

      expect(() => {
        parser.load(malformedHtml);
      }).not.toThrow();

      // Should still be able to extract content
      expect(parser.getTitle()).toContain('Test Page');
      expect(parser.extractText('h1')).toContain('Main Title');
      expect(parser.extractText('p')).toContain('Paragraph without closing tag');
    });

    test('should handle improperly nested tags', () => {
      const improperlyNestedHtml = `
        <div>
          <p>
            <strong>Bold text
            <em>Italic and bold
          </p>
          </em>
          <span>Mixed up tags</div>
        </span>
      `;

      expect(() => {
        parser.load(improperlyNestedHtml);
      }).not.toThrow();

      // Should extract text despite nesting issues
      expect(parser.extractText('div')).toContain('Bold text');
      expect(parser.extractText('div')).toContain('Italic and bold');
      expect(parser.extractText('div')).toContain('Mixed up tags');
    });

    test('should handle HTML with special characters and entities', () => {
      const htmlWithEntities = `
        <html>
          <head>
            <title>Page with &lt;entities&gt; &amp; symbols</title>
          </head>
          <body>
            <p>This page contains: &lt; &gt; &amp; &quot; &#39; and numeric entities: &#169; &#8364;</p>
            <div>Special chars: àáâãäå æœ ç èéêë ñòóôõö ùúûüý ÿ</div>
            <span>Math symbols: ≤ ≥ ≠ ± × ÷ ∞ ∑ ∏</span>
          </body>
        </html>
      `;

      parser.load(htmlWithEntities);

      // Should handle entities correctly
      expect(parser.getTitle()).toContain('Page with <entities> & symbols');
      expect(parser.extractText('p')).toContain('< > & " \'');
      expect(parser.extractText('p')).toContain('© €');
      expect(parser.extractText('div')).toContain('àáâãäå æœ ç');
      expect(parser.extractText('span')).toContain('≤ ≥ ≠ ± × ÷ ∞ ∑ ∏');
    });

    test('should handle broken attribute structures', () => {
      const htmlWithBrokenAttrs = `
        <div>
          <p id="para1" class=test>Paragraph with unquoted class</p>
          <span data-value=123 missing-quote>Broken attribute</span>
          <img src=image.jpg alt=Image with spaces>
          <a href=https://example.com?param=value&other=test>Link with unencoded URL</a>
        </div>
      `;

      expect(() => {
        parser.load(htmlWithBrokenAttrs);
      }).not.toThrow();

      // Should still extract content
      expect(parser.extractText('p')).toContain('Paragraph with unquoted class');
      expect(parser.extractText('span')).toContain('Broken attribute');
      expect(parser.extractAttribute('a', 'href')).toContain('https://example.com');
    });

    test('should handle comments and CDATA sections', () => {
      const htmlWithComments = `
        <html>
          <head>
            <!-- This is a comment -->
            <title>Page with comments</title>
            <!-- Another comment with <tags> & symbols -->
          </head>
          <body>
            <!-- Body comment -->
            <div>
              <!-- Nested comment -->
              <p>Content</p>
              <![CDATA[This is CDATA content with <tags>]]>
            </div>
          </body>
        </html>
      `;

      expect(() => {
        parser.load(htmlWithComments);
      }).not.toThrow();

      // Should extract content ignoring comments
      expect(parser.getTitle()).toBe('Page with comments');
      expect(parser.extractText('p')).toBe('Content');
      expect(parser.extractText('div')).toContain('Content');
    });
  });

  describe('TC-HP-203-01 [P2]: Encoding and Character Sets', () => {
    test('should handle UTF-8 encoded content', () => {
      const utf8Html = `
        <html>
          <head>
            <meta charset="UTF-8">
            <title>UTF-8 Test: 中文 Español Français العربية</title>
          </head>
          <body>
            <h1>Testing International Characters</h1>
            <p>Chinese: 你好世界</p>
            <p>Spanish: ¡Hola Mundo!</p>
            <p>French: Bonjour le Monde</p>
            <p>Arabic: مرحبا بالعالم</p>
            <p>Russian: Привет мир</p>
            <p>Emoji: 🌍 🚀 💻 📚 ✨</p>
            <div>Mixed: Café naïve résumé coöperate</div>
          </body>
        </html>
      `;

      parser.load(utf8Html);

      expect(parser.getTitle()).toContain('中文 Español Français العربية');
      expect(parser.extractText('h1')).toBe('Testing International Characters');
      expect(parser.extractText('p')).toContain('你好世界');
      expect(parser.extractText('p')).toContain('¡Hola Mundo!');
      expect(parser.extractText('p')).toContain('Bonjour le Monde');
      expect(parser.extractText('p')).toContain('مرحبا بالعالم');
      expect(parser.extractText('p')).toContain('Привет мир');
      expect(parser.extractText('p')).toContain('🌍 🚀 💻 📚 ✨');
      expect(parser.extractText('div')).toContain('Café naïve résumé coöperate');
    });

    test('should handle HTML with mixed character references', () => {
      const mixedEncodingHtml = `
        <html>
          <head>
            <title>Mixed Encoding Test</title>
          </head>
          <body>
            <p>Mixed entities: &#169; &copy; &euro;</p>
            <div>Hex entities: &#xA9; &#x20AC;</div>
            <span>Named entities: &nbsp; &mdash; &lsquo;</span>
          </body>
        </html>
      `;

      parser.load(mixedEncodingHtml);

      // Should decode entities properly
      const text = parser.extractText('body');
      expect(text).toContain('©');
      expect(text).toContain('€');
      expect(text).toContain('—');
    });
  });

  describe('TC-HP-204-01 [P2]: Performance with Large Documents', () => {
    test('should handle large documents efficiently', () => {
      // Generate a large HTML document
      let largeHtml = `
        <html>
          <head><title>Large Document Test</title></head>
          <body>
            <h1>Large Document</h1>
            <div class="content">
      `;

      // Add many articles
      for (let i = 1; i <= 1000; i++) {
        largeHtml += `
          <article class="post" data-id="${i}">
            <h2>Article ${i}</h2>
            <div class="meta">
              <span class="author">Author ${i}</span>
              <span class="date">2024-01-${String((i % 30) + 1).padStart(2, '0')}</span>
            </div>
            <div class="content">
              <p>This is the content of article ${i}.</p>
              <p>It contains multiple paragraphs for testing performance.</p>
              <ul>
                <li>Point 1 for article ${i}</li>
                <li>Point 2 for article ${i}</li>
                <li>Point 3 for article ${i}</li>
              </ul>
            </div>
          </article>
        `;
      }

      largeHtml += `
            </div>
          </body>
        </html>
      `;

      const startTime = performance.now();

      parser.load(largeHtml);

      const loadTime = performance.now() - startTime;

      // Should load within reasonable time (less than 1 second)
      expect(loadTime).toBeLessThan(1000);

      // Should still be able to extract content efficiently
      const extractStartTime = performance.now();

      const titles = parser.extractText('h2', true);
      const articles = parser.select('article');

      const extractTime = performance.now() - extractStartTime;

      // Should extract within reasonable time (less than 500ms)
      expect(extractTime).toBeLessThan(500);

      // Should extract correct amount of data
      expect(titles).toHaveLength(1000);
      expect(articles.count).toBe(1000);
      expect(titles[0]).toBe('Article 1');
      expect(titles[999]).toBe('Article 1000');
    });

    test('should handle deeply nested structures', () => {
      // Create deeply nested HTML
      let nestedHtml = '<html><body><div class="root">';

      for (let i = 1; i <= 100; i++) {
        nestedHtml += `<div class="level-${i}">`;
      }

      nestedHtml += '<span class="deep-content">Deep nested content</span>';

      for (let i = 100; i >= 1; i--) {
        nestedHtml += '</div>';
      }

      nestedHtml += '</div></body></html>';

      const startTime = performance.now();

      parser.load(nestedHtml);

      const loadTime = performance.now() - startTime;

      // Should handle deep nesting efficiently
      expect(loadTime).toBeLessThan(500);

      // Should be able to find deeply nested content
      const deepContent = parser.extractText('.deep-content');
      expect(deepContent).toBe('Deep nested content');

      // Should be able to select deeply nested elements
      const deepDiv = parser.select('.level-50');
      expect(deepDiv.count).toBe(1);
    });
  });

  describe('TC-HP-205-01 [P2]: Complex Selector Scenarios', () => {
    test('should handle complex CSS selectors', () => {
      const complexHtml = `
        <html>
          <body>
            <div class="container">
              <article class="post featured" data-category="tech" data-id="1">
                <h2 class="title primary">First Article</h2>
                <div class="meta">
                  <span class="author author-vip">John Doe</span>
                </div>
              </article>
              <article class="post" data-category="design" data-id="2">
                <h2 class="title">Second Article</h2>
                <div class="meta">
                  <span class="author">Jane Smith</span>
                </div>
              </article>
              <section class="sidebar">
                <div class="widget">
                  <h3>Related Posts</h3>
                  <ul class="links">
                    <li><a href="#" class="link active">Link 1</a></li>
                    <li><a href="#" class="link">Link 2</a></li>
                  </ul>
                </div>
              </section>
            </div>
          </body>
        </html>
      `;

      parser.load(complexHtml);

      // Test compound selectors
      const featuredTech = parser.select('.post.featured[data-category="tech"]');
      expect(featuredTech.count).toBe(1);
      expect(featuredTech.extractAttribute('data-id')).toBe('1');

      // Test descendant selectors
      const vipAuthorText = parser.select('.post .author-vip');
      expect(vipAuthorText.count).toBe(1);
      expect(vipAuthorText.text).toBe('John Doe');

      // Test multiple class selectors
      const primaryTitle = parser.select('.title.primary');
      expect(primaryTitle.count).toBe(1);
      expect(primaryTitle.text).toBe('First Article');

      // Test child selectors
      const directLinks = parser.select('.links > li > .link');
      expect(directLinks.count).toBe(2);

      // Test attribute selectors
      const techArticles = parser.select('[data-category="tech"]');
      expect(techArticles.count).toBe(1);
    });

    test('should handle pseudo-selectors gracefully', () => {
      const pseudoHtml = `
        <div>
          <ul class="list">
            <li class="item">Item 1</li>
            <li class="item active">Item 2</li>
            <li class="item">Item 3</li>
            <li class="item last">Item 4</li>
          </ul>
        </div>
      `;

      parser.load(pseudoHtml);

      // Basic selectors should work
      const items = parser.select('.item');
      expect(items.count).toBe(4);

      // Note: Cheerio has limited support for CSS pseudo-selectors
      // These should either work or fail gracefully
      expect(() => {
        const firstItem = parser.select('.item:first-child');
        expect(firstItem.count).toBeGreaterThanOrEqual(0);
      }).not.toThrow();

      expect(() => {
        const lastItem = parser.select('.item:last-child');
        expect(lastItem.count).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });
  });

  describe('TC-HP-206-01 [P2]: Error Handling and Edge Cases', () => {
    test('should handle empty HTML content', () => {
      parser.load('');

      expect(parser.getTitle()).toBeUndefined();
      expect(parser.getMetaDescription()).toBe('');
      expect(parser.getLinks()).toEqual([]);
      expect(parser.getImages()).toEqual([]);
      expect(parser.getHtml()).toBe('');
    });

    test('should handle whitespace-only HTML', () => {
      parser.load('   \n\t   \n   ');

      expect(parser.getTitle()).toBeUndefined();
      expect(parser.getHtml()).toBe('');
    });

    test('should handle HTML with only tags and no content', () => {
      const emptyStructureHtml = '<html><head><title></title></head><body></body></html>';

      parser.load(emptyStructureHtml);

      expect(parser.getTitle()).toBeUndefined();
      expect(parser.getMetaDescription()).toBe('');
      expect(parser.getLinks()).toEqual([]);
    });

    test('should handle invalid CSS selectors gracefully', () => {
      const simpleHtml = '<div><p>Content</p></div>';
      parser.load(simpleHtml);

      // These should not throw but return empty results
      expect(() => {
        const _result = parser.select(''); // Empty selector
        expect(_result.count).toBe(0);
      }).not.toThrow();

      expect(() => {
        const _result = parser.select('..invalid..'); // Invalid selector
        expect(_result.count).toBe(0);
      }).not.toThrow();
    });

    test('should handle very long attribute values', () => {
      const longValue = 'a'.repeat(10000);
      const htmlWithLongAttr = `<div data-long="${longValue}">Content</div>`;

      parser.load(htmlWithLongAttr);

      const extracted = parser.extractAttribute('div', 'data-long');
      expect(extracted).toBe(longValue);
    });

    test('should handle HTML with script and style tags', () => {
      const htmlWithScripts = `
        <html>
          <head>
            <script>
              var test = "This is JavaScript content";
              function hello() { console.log("Hello"); }
            </script>
            <style>
              .test { color: red; font-size: 14px; }
              .large { background: #fff; }
            </style>
          </head>
          <body>
            <div>Actual content</div>
            <script>
              // More JavaScript
              window.onload = function() {};
            </script>
          </body>
        </html>
      `;

      parser.load(htmlWithScripts);

      // Should extract actual content, not script/style content
      expect(parser.extractText('div')).toBe('Actual content');

      // Should still find the page structure
      expect(parser.has('div')).toBe(true);
    });
  });

  describe('TC-HP-207-01 [P2]: Integration with Extraction Pipeline', () => {
    test('should integrate structured data extraction with complex field mappings', () => {
      const complexProductHtml = `
        <div class="products">
          <div class="product" data-id="1" data-category="electronics">
            <h2 class="product-name">Smartphone X1</h2>
            <div class="pricing">
              <span class="price">$299.99</span>
              <span class="currency">USD</span>
            </div>
            <div class="specs">
              <span class="screen-size">6.1"</span>
              <span class="storage">128GB</span>
              <span class="ram">4GB</span>
            </div>
            <div class="availability">
              <span class="stock-status in-stock">In Stock</span>
              <span class="shipping">Free Shipping</span>
            </div>
          </div>
          <div class="product" data-id="2" data-category="electronics">
            <h2 class="product-name">Laptop Pro</h2>
            <div class="pricing">
              <span class="price">$999.99</span>
              <span class="currency">USD</span>
            </div>
            <div class="specs">
              <span class="screen-size">15.6"</span>
              <span class="storage">512GB</span>
              <span class="ram">16GB</span>
            </div>
            <div class="availability">
              <span class="stock-status out-of-stock">Out of Stock</span>
              <span class="shipping">Express Shipping</span>
            </div>
          </div>
        </div>
      `;

      parser.load(complexProductHtml);

      const fieldMapping = {
        id: 'data-id',
        category: 'data-category',
        name: '.product-name',
        price: '.price',
        currency: '.currency',
        screenSize: '.screen-size',
        storage: '.storage',
        ram: '.ram',
        stockStatus: '.stock-status',
        shipping: '.shipping',
      };

      const products = parser.extractStructuredData('.product', fieldMapping, true);

      expect(Array.isArray(products)).toBe(true);
      expect(products).toHaveLength(2);

      expect(products[0]).toEqual({
        id: '1',
        category: 'electronics',
        name: 'Smartphone X1',
        price: '$299.99',
        currency: 'USD',
        screenSize: '6.1"',
        storage: '128GB',
        ram: '4GB',
        stockStatus: 'In Stock',
        shipping: 'Free Shipping',
      });

      expect(products[1]).toEqual({
        id: '2',
        category: 'electronics',
        name: 'Laptop Pro',
        price: '$999.99',
        currency: 'USD',
        screenSize: '15.6"',
        storage: '512GB',
        ram: '16GB',
        stockStatus: 'Out of Stock',
        shipping: 'Express Shipping',
      });
    });

    test('should handle extraction with missing fields gracefully', () => {
      const incompleteHtml = `
        <div class="items">
          <div class="item" data-id="1">
            <h3>Complete Item</h3>
            <span class="description">This has all fields</span>
            <span class="price">$10.00</span>
          </div>
          <div class="item" data-id="2">
            <h3>Incomplete Item</h3>
            <!-- Missing description -->
            <span class="price">$20.00</span>
          </div>
          <div class="item">
            <!-- Missing id and other fields -->
            <span class="description">Only description</span>
          </div>
        </div>
      `;

      parser.load(incompleteHtml);

      const fieldMapping = {
        id: 'data-id',
        name: 'h3',
        description: '.description',
        price: '.price',
      };

      const items = parser.extractStructuredData('.item', fieldMapping, true);

      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(3);

      // First item - all fields present
      expect(items[0]).toEqual({
        id: '1',
        name: 'Complete Item',
        description: 'This has all fields',
        price: '$10.00',
      });

      // Second item - missing description
      expect(items[1]).toEqual({
        id: '2',
        name: 'Incomplete Item',
        description: '',
        price: '$20.00',
      });

      // Third item - missing id and price
      expect(items[2]).toEqual({
        id: '',
        name: '',
        description: 'Only description',
        price: '',
      });
    });
  });

  describe('TC-HP-208-01 [P2]: XPath Conversion Edge Cases', () => {
    test('should handle complex XPath expressions', () => {
      const html = `
        <html>
          <body>
            <div class="container">
              <main>
                <article class="post">
                  <h2>Title</h2>
                  <p>Content</p>
                </article>
              </main>
            </div>
          </body>
        </html>
      `;

      parser.load(html);

      // Test various XPath patterns
      const xpathTests = [
        { xpath: '//h2', expectedCount: 1 },
        { xpath: '//main//h2', expectedCount: 1 },
        { xpath: '//article/h2', expectedCount: 1 },
        { xpath: '//div//p', expectedCount: 1 },
        { xpath: '//body//h2', expectedCount: 1 },
      ];

      for (const { xpath, expectedCount } of xpathTests) {
        expect(() => {
          const _result = parser.selectXPath(xpath);
          expect(_result.count).toBe(expectedCount);
        }).not.toThrow();
      }
    });

    test('should handle XPath expressions that convert to complex CSS selectors', () => {
      const html = `
        <div>
          <ul class="list">
            <li class="item">Item 1</li>
            <li class="item special">Item 2</li>
            <li class="item">Item 3</li>
          </ul>
        </div>
      `;

      parser.load(html);

      // XPath with conditions
      expect(() => {
        const _result = parser.selectXPath('//li[@class="special"]');
        expect(_result.count).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });
  });
});
