import { test, expect, beforeEach } from 'bun:test';
import { readFileSync } from 'node:fs';
import { HtmlParser } from '../../../src/core/html-parser.ts';

let parser: HtmlParser;
let sampleHtml: string;

beforeEach(() => {
  parser = new HtmlParser();
  // Load sample HTML from fixture
  sampleHtml = readFileSync('tests/fixtures/sample-html.html', 'utf-8');
});

test('TC-HP-101-01 [P0]: HtmlParser should load HTML content', () => {
  parser.load(sampleHtml);

  expect(parser.getOriginalHtml()).toBe(sampleHtml);
  expect(parser.getHtml()).toBeTruthy();
  expect(parser.getHtml()).toContain('Sample Web Page for Testing');
});

test('TC-HP-101-02 [P1]: HtmlParser should load from HTTP response', async () => {
  const mockResponse = {
    status: 200,
    statusText: 'OK',
    headers: {},
    text: () => Promise.resolve(sampleHtml),
    json: () => Promise.resolve({}),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    ok: true,
  };

  await parser.loadFromResponse(mockResponse);

  expect(parser.getOriginalHtml()).toBe(sampleHtml);
  expect(parser.getTitle()).toBe('Sample Web Page for Testing');
});

test('TC-HP-102-01 [P0]: HtmlParser should extract page title', () => {
  parser.load(sampleHtml);

  expect(parser.getTitle()).toBe('Sample Web Page for Testing');
});

test('TC-HP-102-02 [P1]: HtmlParser should extract meta description', () => {
  parser.load(sampleHtml);

  expect(parser.getMetaDescription()).toBe(
    'This is a sample web page for testing web scraping functionality'
  );
});

test('TC-HP-102-03 [P1]: HtmlParser should extract all meta tags', () => {
  parser.load(sampleHtml);

  const metaTags = parser.getMetaTags();

  expect(metaTags.description).toBe(
    'This is a sample web page for testing web scraping functionality'
  );
  expect(metaTags.author).toBe('Test Author');
  expect(metaTags.viewport).toBe('width=device-width, initial-scale=1.0');
});

test('TC-HP-103-01 [P1]: HtmlParser should extract links', () => {
  parser.load(sampleHtml);

  const links = parser.getLinks();

  expect(links).toContain('#home');
  expect(links).toContain('#about');
  expect(links).toContain('#contact');
  expect(links).toContain('https://example.com');
  expect(links).toContain('/privacy');
  expect(links).toContain('/terms');
});

test('TC-HP-103-02 [P1]: HtmlParser should extract images', () => {
  parser.load(sampleHtml);

  const images = parser.getImages();

  expect(images).toContain('image1.jpg');
});

test('TC-HP-104-01 [P0]: HtmlParser should select elements by CSS selector', () => {
  parser.load(sampleHtml);

  const _result = parser.select('article');

  expect(_result.count).toBe(3);
  expect(_result.text).toContain('First Article Title');
  expect(_result.text).toContain('Second Article Title');
  expect(_result.text).toContain('Third Article');
});

test('TC-HP-104-02 [P1]: HtmlParser should select single element', () => {
  parser.load(sampleHtml);

  const _result = parser.select('h1');

  expect(_result.count).toBe(1);
  expect(_result.text).toBe('Main Title');
});

test('TC-HP-105-01 [P0]: HtmlParser should extract text from selector', () => {
  parser.load(sampleHtml);

  const singleText = parser.extractText('h1');
  expect(singleText).toBe('Main Title');

  const multipleTexts = parser.extractText('h2', true);
  expect(Array.isArray(multipleTexts)).toBe(true);
  expect(multipleTexts).toHaveLength(3);
  if (Array.isArray(multipleTexts)) {
    expect(multipleTexts[0]).toBe('First Article Title');
    expect(multipleTexts[1]).toBe('Second Article Title');
    expect(multipleTexts[2]).toBe('Third Article with Complex Structure');
  }
});

test('TC-HP-105-02 [P0]: HtmlParser should extract attributes from selector', () => {
  parser.load(sampleHtml);

  const singleAttr = parser.extractAttribute('h1', 'id');
  expect(singleAttr).toBe(''); // h1 doesn't have id

  const multipleAttrs = parser.extractAttribute('article', 'data-id', true);
  expect(Array.isArray(multipleAttrs)).toBe(true);
  expect(multipleAttrs).toHaveLength(3);
  if (Array.isArray(multipleAttrs)) {
    expect(multipleAttrs[0]).toBe('1');
    expect(multipleAttrs[1]).toBe('2');
    expect(multipleAttrs[2]).toBe('3');
  }
});

test('TC-HP-105-03 [P1]: HtmlParser should extract data attributes', () => {
  parser.load(sampleHtml);

  const singleDataAttr = parser.extractDataAttributes('article[data-id="1"]');
  expect(singleDataAttr).toEqual({ id: '1' });

  const multipleDataAttrs = parser.extractDataAttributes('article', true);
  expect(Array.isArray(multipleDataAttrs)).toBe(true);
  expect(multipleDataAttrs).toHaveLength(3);
  if (Array.isArray(multipleDataAttrs)) {
    expect(multipleDataAttrs[0]).toEqual({ id: '1' });
    expect(multipleDataAttrs[1]).toEqual({ id: '2' });
    expect(multipleDataAttrs[2]).toEqual({ id: '3' });
  }
});

test('TC-HP-106-01 [P0]: HtmlParser should extract structured data', () => {
  parser.load(sampleHtml);

  const fieldMapping = {
    title: 'h2',
    author: '.author',
    date: '.date',
    category: '.category',
  };

  const singleItem = parser.extractStructuredData('article:first-child', fieldMapping, false);
  expect(singleItem).toEqual({
    title: 'First Article Title',
    author: 'John Doe',
    date: '2024-01-15',
    category: 'Technology',
  });

  const multipleItems = parser.extractStructuredData('article', fieldMapping, true);
  expect(Array.isArray(multipleItems)).toBe(true);
  expect(multipleItems).toHaveLength(3);
  if (Array.isArray(multipleItems)) {
    expect(multipleItems[0]).toEqual({
      title: 'First Article Title',
      author: 'John Doe',
      date: '2024-01-15',
      category: 'Technology',
    });
    expect(multipleItems[1]).toEqual({
      title: 'Second Article Title',
      author: 'Jane Smith',
      date: '2024-01-20',
      category: 'Programming',
    });
  }
});

test('TC-HP-107-01 [P1]: HtmlParser should check if selector exists', () => {
  parser.load(sampleHtml);

  expect(parser.has('h1')).toBe(true);
  expect(parser.has('h1.nonexistent')).toBe(false);
  expect(parser.has('.nonexistent-class')).toBe(false);
});

test('TC-HP-108-01 [P1]: HtmlParser should handle complex selectors', () => {
  parser.load(sampleHtml);

  const _result = parser.select('article.post .meta .author');
  expect(_result.count).toBe(3);
  expect(_result.text).toContain('John Doe');
  expect(_result.text).toContain('Jane Smith');
  expect(_result.text).toContain('Bob Johnson');
});

test('TC-HP-108-02 [P2]: HtmlParser should handle nested content extraction', () => {
  parser.load(sampleHtml);

  const _result = parser.select('.nested-content .highlight');
  expect(_result.count).toBe(1);
  expect(_result.text).toBe('Highlighted text');
});

test('TC-HP-109-01 [P2]: HtmlParser should extract table data', () => {
  parser.load(sampleHtml);

  const tableRows = parser.extractText('table tbody tr', true);
  expect(tableRows).toHaveLength(2);
  expect(tableRows[0]).toContain('Test 1');
  expect(tableRows[0]).toContain('Value 1');
  expect(tableRows[1]).toContain('Test 2');
  expect(tableRows[1]).toContain('Value 2');
});

test('TC-HP-110-01 [P1]: HtmlParser should handle non-existent selectors gracefully', () => {
  parser.load(sampleHtml);

  const _result = parser.select('.non-existent');
  expect(_result.count).toBe(0);
  expect(_result.text).toBe('');
  expect(_result.html).toBe('');

  const text = parser.extractText('.non-existent');
  expect(text).toBe('');

  const multipleTexts = parser.extractText('.non-existent', true);
  expect(multipleTexts).toEqual([]);
});

test('TC-HP-111-01 [P1]: HtmlParser should throw error when no HTML loaded', () => {
  const emptyParser = new HtmlParser();

  expect(() => emptyParser.select('h1')).toThrow(
    'No HTML loaded. Call load() or loadFromResponse() first.'
  );
  expect(() => emptyParser.extractText('h1')).toThrow(
    'HTML content not loaded. Call load() method first.'
  );
  expect(() => emptyParser.has('h1')).toThrow(
    'No HTML loaded. Call load() or loadFromResponse() first.'
  );
});

test('TC-HP-112-01 [P2]: HtmlParser should support different parsing options', () => {
  const htmlWithWhitespace = '<div>  <p>   Text with spaces   </p>  </div>';

  const parserWithNormalization = new HtmlParser({ normalizeWhitespace: true });
  parserWithNormalization.load(htmlWithWhitespace);

  const _result = parserWithNormalization.extractText('p');
  expect(_result).toBe('Text with spaces'); // Should be trimmed

  const parserWithoutNormalization = new HtmlParser({ normalizeWhitespace: false });
  parserWithoutNormalization.load(htmlWithWhitespace);

  const result2 = parserWithoutNormalization.extractText('p');
  expect(result2).toContain('Text with spaces'); // Should preserve some structure
});

test('TC-HP-113-01 [P2]: HtmlParser should convert basic XPath to CSS', () => {
  parser.load(sampleHtml);

  // Basic XPath conversions should work
  const _result = parser.selectXPath('//h1'); // Should become 'h1'
  expect(_result.count).toBe(1);
  expect(_result.text).toContain('Main Title');

  const result2 = parser.selectXPath('//main//h2'); // Should become 'main h2'
  expect(result2.count).toBe(3);
  expect(result2.text).toContain('First Article Title');
  expect(result2.text).toContain('Second Article Title');
  expect(result2.text).toContain('Third Article');
});

test('TC-HP-114-01 [P2]: HtmlParser should provide element information', () => {
  parser.load(sampleHtml);

  const elementInfo = parser.getElementInfo('h1');
  expect(elementInfo).toHaveLength(1);
  expect(elementInfo[0]?.tagName).toBe('h1');
  expect(elementInfo[0]?.text).toBe('Main Title');
  expect(elementInfo[0]?.attributes).toBeDefined();
  expect(elementInfo[0]?.children).toBeDefined();
});
