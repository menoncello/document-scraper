import { test, expect, describe } from 'bun:test';
import { HtmlParser } from '../../../src/core/html-parser';
import { setupHtmlParserTest, TestData, Assertions } from '../../helpers/test-setup.helper';

describe('HTML Parser - Basic Loading', () => {
  setupHtmlParserTest();

  test('TC-HP-001-01 [P0]: Given valid HTML content, when loaded, then it should parse successfully', () => {
    // Given: Valid HTML content
    const htmlContent = TestData.htmlParser.givenValidHtml();
    const parser = new HtmlParser();

    // When: Loading the HTML content
    parser.load(htmlContent);

    // Then: Should parse successfully
    expect(parser.getTitle()).toContain('Test Page');
    expect(parser.getMetaDescription()).toContain('Test description');
  });
});

describe('HTML Parser - Malformed HTML Loading', () => {
  setupHtmlParserTest();

  test('TC-HP-001-02 [P1]: Given malformed HTML content, when loaded, then it should handle gracefully', () => {
    // Given: Malformed HTML content
    const htmlContent = TestData.htmlParser.givenMalformedHtml();
    const parser = new HtmlParser();

    // When: Loading the malformed HTML
    parser.load(htmlContent);

    // Then: Should handle gracefully without throwing
    expect(parser.getTitle()).toBeDefined();
    expect(parser.getLinks()).toBeDefined();
  });
});

describe('HTML Parser - Single Text Extraction', () => {
  setupHtmlParserTest();

  test('TC-HP-002-01 [P0]: Given HTML with text content, when extracting text with selector, then it should return text', () => {
    // Given: HTML with text content
    const htmlContent = TestData.htmlParser.givenBasic();
    const parser = new HtmlParser();
    parser.load(htmlContent);

    // When: Extracting text with h1 selector
    const _result = parser.extractText('h1');

    // Then: Should return the h1 text
    Assertions.html.shouldExtractText({ text: _result }, 'Test Page');
  });
});

describe('HTML Parser - Multiple Text Extraction', () => {
  setupHtmlParserTest();

  test('TC-HP-002-02 [P1]: Given HTML with multiple matching elements, when extracting multiple texts, then it should return array', () => {
    // Given: HTML with multiple articles
    const htmlContent = TestData.htmlParser.givenArticles(3);
    const parser = new HtmlParser();
    parser.load(htmlContent);

    // When: Extracting multiple article titles
    const _result = parser.extractText('h2', true);

    // Then: Should return array of titles
    expect(Array.isArray(_result)).toBe(true);
    expect(_result).toHaveLength(3);
    expect(_result[0]).toContain('Article 1');
    expect(_result[1]).toContain('Article 2');
    expect(_result[2]).toContain('Article 3');
  });
});

describe('HTML Parser - CSS Class Selection', () => {
  setupHtmlParserTest();

  test('TC-HP-003-01 [P0]: Given HTML with CSS classes, when selecting by class, then it should find elements', () => {
    // Given: HTML with CSS classes
    const htmlContent = TestData.htmlParser.givenArticles(2);
    const parser = new HtmlParser();
    parser.load(htmlContent);

    // When: Selecting elements by class
    const _result = parser.select('.post');

    // Then: Should find matching elements
    Assertions.html.shouldExtractMultiple(_result, 2);
  });
});

describe('HTML Parser - Descendant Selector Support', () => {
  setupHtmlParserTest();

  test('TC-HP-003-02 [P1]: Given HTML with nested structure, when using descendant selectors, then it should find nested elements', () => {
    // Given: HTML with nested structure
    const htmlContent = TestData.htmlParser.givenNested();
    const parser = new HtmlParser();
    parser.load(htmlContent);

    // When: Using descendant selectors
    const _result = parser.select('.container h2');

    // Then: Should find nested h2 elements
    Assertions.html.shouldExtractMultiple(_result, 1);
    Assertions.html.shouldExtractText(_result, 'Nested Title');
  });
});

describe('HTML Parser - Attribute Selection', () => {
  setupHtmlParserTest();

  test('TC-HP-003-03 [P1]: Given HTML with data attributes, when selecting by attributes, then it should find elements', () => {
    // Given: HTML with data attributes
    const htmlContent = TestData.htmlParser.givenDataAttributes();
    const parser = new HtmlParser();
    parser.load(htmlContent);

    // When: Selecting by data attributes
    const _result = parser.select('[data-category="electronics"]');

    // Then: Should find elements with matching data attributes
    Assertions.html.shouldExtractMultiple(_result, 1);
    Assertions.html.shouldExtractAttributes(_result, 'data-category', 'electronics');
  });
});

describe('HTML Parser - Basic XPath Support', () => {
  setupHtmlParserTest();

  test('TC-HP-004-01 [P2]: Given HTML structure, when using XPath expressions, then it should convert to CSS and find elements', () => {
    // Given: HTML structure
    const htmlContent = TestData.htmlParser.givenBasic();
    const parser = new HtmlParser();
    parser.load(htmlContent);

    // When: Using XPath to find h1 elements
    const _result = parser.selectXPath('//h1');

    // Then: Should convert XPath to CSS and find elements
    Assertions.html.shouldHandleXpath(_result, 1);
    Assertions.html.shouldExtractText(_result, 'Test Page');
  });
});

describe('HTML Parser - XPath Descendant Support', () => {
  setupHtmlParserTest();

  test('TC-HP-004-02 [P2]: Given HTML with articles, when using XPath for descendants, then it should find nested elements', () => {
    // Given: HTML with articles
    const htmlContent = TestData.htmlParser.givenArticles(3);
    const parser = new HtmlParser();
    parser.load(htmlContent);

    // When: Using XPath for descendant h2 elements
    const _result = parser.selectXPath('//main//h2');

    // Then: Should find all article titles
    Assertions.html.shouldHandleXpath(_result, 3);
    expect(_result.text).toContain('Article 1');
    expect(_result.text).toContain('Article 2');
    expect(_result.text).toContain('Article 3');
  });
});

describe('HTML Parser - Single Attribute Extraction', () => {
  setupHtmlParserTest();

  test('TC-HP-005-01 [P0]: Given HTML with attributes, when extracting attributes, then it should return attribute values', () => {
    // Given: HTML with data attributes
    const htmlContent = TestData.htmlParser.givenDataAttributes();
    const parser = new HtmlParser();
    parser.load(htmlContent);

    // When: Extracting data-id attribute
    const _result = parser.extractAttribute('[data-id]', 'data-id');

    // Then: Should return attribute value
    expect(_result).toBe('1');
  });
});

describe('HTML Parser - Multiple Attribute Extraction', () => {
  setupHtmlParserTest();

  test('TC-HP-005-02 [P1]: Given HTML with multiple elements, when extracting multiple attributes, then it should return array', () => {
    // Given: HTML with multiple products
    const htmlContent = TestData.htmlParser.givenDataAttributes();
    const parser = new HtmlParser();
    parser.load(htmlContent);

    // When: Extracting data-category from multiple elements
    const _result = parser.extractAttribute('[data-category]', 'data-category', true);

    // Then: Should return array of attribute values
    expect(Array.isArray(_result)).toBe(true);
    expect(_result).toContain('electronics');
    expect(_result).toContain('books');
    expect(_result).toContain('clothing');
  });
});

describe('HTML Parser - Data Attributes Extraction', () => {
  setupHtmlParserTest();

  test('TC-HP-006-01 [P1]: Given HTML with data attributes, when extracting data attributes, then it should return key-value pairs', () => {
    // Given: HTML with data attributes
    const htmlContent = TestData.htmlParser.givenDataAttributes();
    const parser = new HtmlParser();
    parser.load(htmlContent);

    // When: Extracting data attributes from product
    const _result = parser.extractDataAttributes('[data-id="1"]');

    // Then: Should return data attributes as key-value pairs
    expect(_result).toHaveProperty('id', '1');
    expect(_result).toHaveProperty('category', 'electronics');
    expect(_result).toHaveProperty('price', '99.99');
  });
});

describe('HTML Parser - Single Structured Data Extraction', () => {
  setupHtmlParserTest();

  test('TC-HP-007-01 [P0]: Given HTML with structured content, when extracting structured data, then it should map fields correctly', () => {
    // Given: HTML with article structure
    const htmlContent = TestData.htmlParser.givenArticleList(1);
    const parser = new HtmlParser();
    parser.load(htmlContent);

    // When: Extracting structured data with field mapping
    const _result = parser.extractStructuredData('.post', {
      title: 'h2',
      author: '.author',
      date: '.date',
    });

    // Then: Should map fields correctly
    expect(_result).toHaveProperty('title', 'Article 1 Title');
    expect(_result).toHaveProperty('author', 'Author 1');
    expect(_result).toHaveProperty('date', '2024-01-01');
  });
});

describe('HTML Parser - Multiple Structured Data Extraction', () => {
  setupHtmlParserTest();

  test('TC-HP-007-02 [P1]: Given HTML with multiple items, when extracting multiple structured items, then it should return array', () => {
    // Given: HTML with multiple articles
    const htmlContent = TestData.htmlParser.givenArticleList(2);
    const parser = new HtmlParser();
    parser.load(htmlContent);

    // When: Extracting multiple structured items
    const _result = parser.extractStructuredData(
      '.post',
      {
        title: 'h2',
        author: '.author',
      },
      true
    );

    // Then: Should return array of structured data
    expect(Array.isArray(_result)).toBe(true);
    expect(_result).toHaveLength(2);
    expect((_result as Array<Record<string, unknown>>)[0]).toHaveProperty(
      'title',
      'Article 1 Title'
    );
    expect((_result as Array<Record<string, unknown>>)[1]).toHaveProperty(
      'title',
      'Article 2 Title'
    );
  });
});

describe('HTML Parser - Form Data Extraction', () => {
  setupHtmlParserTest();

  test('TC-HP-008-01 [P1]: Given HTML with forms, when extracting form data, then it should extract form fields', () => {
    // Given: HTML with form structure
    const htmlContent = TestData.htmlParser.givenFormData();
    const parser = new HtmlParser();
    parser.load(htmlContent);

    // When: Extracting input values using attribute extraction for input fields
    const nameValue = parser.extractAttribute('input[name="name"]', 'value');
    const emailValue = parser.extractAttribute('input[name="email"]', 'value');
    const messageText = parser.extractText('textarea[name="message"]');

    const _result = {
      name: nameValue,
      email: emailValue,
      message: messageText,
    };

    // Then: Should extract form fields and values
    expect(_result).toHaveProperty('name');
    expect(_result).toHaveProperty('email');
    expect(_result).toHaveProperty('message');
    expect(_result.name).toMatch(/Test Name \d+/);
    expect(_result.email).toMatch(/test\d+@example\.com/);
    expect(_result.message).toMatch(/Test message \d+/);
  });
});

describe('HTML Parser - Navigation Links Extraction', () => {
  setupHtmlParserTest();

  test('TC-HP-009-01 [P1]: Given HTML with links, when extracting links, then it should return href attributes', () => {
    // Given: HTML with navigation links
    const htmlContent = TestData.htmlParser.givenNested();
    const parser = new HtmlParser();
    parser.load(htmlContent);

    // When: Extracting links
    const _result = parser.getLinks();

    // Then: Should return href attributes
    expect(Array.isArray(_result)).toBe(true);
    expect(_result.length).toBeGreaterThan(0);
    expect(_result.some(link => link.includes('#home'))).toBe(true);
  });
});

describe('HTML Parser - Element Information', () => {
  setupHtmlParserTest();

  test('TC-HP-010-01 [P2]: Given HTML elements, when getting element info, then it should return detailed information', () => {
    // Given: HTML with elements
    const htmlContent = TestData.htmlParser.givenBasic();
    const parser = new HtmlParser();
    parser.load(htmlContent);

    // When: Getting element information
    const _result = parser.getElementInfo('h1');

    // Then: Should return detailed element information
    expect(Array.isArray(_result)).toBe(true);
    expect(_result).toHaveLength(1);
    expect((_result as unknown as Array<Record<string, unknown>>)[0]).toHaveProperty('tagName');
    expect((_result as unknown as Array<Record<string, unknown>>)[0]).toHaveProperty('text');
    expect((_result as unknown as Array<Record<string, unknown>>)[0]).toHaveProperty('attributes');
    expect((_result as Array<{ tagName: string }>)[0]?.tagName).toBe('h1');
  });
});
