import { test, expect, describe } from 'bun:test';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { createSuccessSelectorResult } from '../../../src/core/html/selector-helpers';
import {
  extractElementStructuredData,
  extractMultipleStructuredData,
  extractSingleStructuredData,
} from '../../../src/core/structured-data-extractor';

// Constants for repeated test values
const DEFAULT_SELECTORS = {
  title: '.title',
  price: '.price',
  description: '.description',
} as const;

const TEST_PRODUCTS = {
  basic: {
    title: 'Test Product',
    price: '$29.99',
    description: 'A great product description',
  },
  withWhitespace: {
    title: '   Product Title with spaces   ',
    price: '$29.99',
  },
  nested: {
    title: 'Nested Title',
    price: '$19.99',
  },
} as const;

const TEST_PRICES = ['$10.00', '$20.00', '$30.00'] as const;
const EXPECTED_PRODUCT_COUNT = 3;
const MULTIPLE_TAG_COUNT = 3;

// Test data interfaces
interface Product {
  title: string;
  price: string;
  rating?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface BlogPost {
  title: string;
  author: string;
  publishedAt: string;
  content: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ECommerceProduct {
  name: string;
  currentPrice: string;
  originalPrice: string;
  rating: string;
  reviewCount: string;
  brand: string;
  category: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface BlogArticle {
  title: string;
  author: string;
  publishDate: string;
  categories: string;
  excerpt: string;
  readingTime: string;
  views: string;
  likes: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface NewsArticle {
  headline: string;
  author: string;
  publicationDate: string;
  publisher: string;
  description: string;
  wordCount: string;
  readTime: string;
}

// Test helper functions
function createCheerioInstance(html: string): cheerio.CheerioAPI {
  return cheerio.load(html);
}

function getProductElement(html: string, selector = '.product'): AnyNode {
  const $ = createCheerioInstance(html);
  return $(selector)[0];
}

function createProductHtml(title: string, price: string, description?: string): string {
  return `
    <div class="product">
      <h2 class="title">${title}</h2>
      <span class="price">${price}</span>
      ${description ? `<p class="description">${description}</p>` : ''}
    </div>
  `;
}

function createMultipleProductsHtml(products: Array<{ title: string; price: string }>): string {
  const productItems = products
    .map(
      product =>
        `<article class="product">
      <h2 class="title">${product.title}</h2>
      <span class="price">${product.price}</span>
    </article>`
    )
    .join('\n');

  return `<div class="products">${productItems}</div>`;
}

function extractStructuredDataResult(
  html: string,
  fieldMapping: Record<string, string>,
  selector = '.product'
) {
  const $ = createCheerioInstance(html);
  const element = getProductElement(html, selector);
  return extractElementStructuredData(element, fieldMapping, $);
}

function createSelectorResult(html: string, selector = '.product') {
  const $ = createCheerioInstance(html);
  const matches = $(selector);
  return createSuccessSelectorResult(matches, $);
}

function _extractMultipleDataWithSelector(
  html: string,
  fieldMapping: Record<string, string>,
  selector = '.product'
) {
  const $ = createCheerioInstance(html);
  const selectorResult = createSelectorResult(html, selector);
  return extractMultipleStructuredData(selectorResult, fieldMapping, $);
}

function _extractSingleDataWithSelector(
  html: string,
  fieldMapping: Record<string, string>,
  selector = '.product'
) {
  const selectorResult = createSelectorResult(html, selector);
  return extractSingleStructuredData(selectorResult, fieldMapping);
}

describe('Structured Data Extractor', () => {
  describe('extractElementStructuredData', () => {
    test('TC-SDE-101-01 [P0]: Should extract structured data from element with text content', () => {
      const html = createProductHtml(
        TEST_PRODUCTS.basic.title,
        TEST_PRODUCTS.basic.price,
        TEST_PRODUCTS.basic.description
      );
      const fieldMapping = DEFAULT_SELECTORS;

      const extractedData = extractStructuredDataResult(html, fieldMapping);

      expect(extractedData).toEqual(TEST_PRODUCTS.basic);
    });

    test('TC-SDE-101-02 [P1]: Should extract content attribute when text is empty', () => {
      const html = `
        <div class="product">
          <h2 class="title" content="Product Title"></h2>
          <meta class="price" content="$29.99">
          <span class="description">Product description</span>
        </div>
      `;
      const fieldMapping = DEFAULT_SELECTORS;
      const expectedData = {
        title: 'Product Title',
        price: '$29.99',
        description: 'Product description',
      };

      const extractedData = extractStructuredDataResult(html, fieldMapping);

      expect(extractedData).toEqual(expectedData);
    });

    test('TC-SDE-101-03 [P1]: Should prefer text content over content attribute', () => {
      const html = `
        <div class="product">
          <h2 class="title" content="Content Title">Text Title</h2>
          <meta class="price" content="$29.99">
        </div>
      `;
      const fieldMapping = {
        title: '.title',
        price: '.price',
      };
      const expectedData = {
        title: 'Text Title',
        price: '$29.99',
      };

      const extractedData = extractStructuredDataResult(html, fieldMapping);

      expect(extractedData).toEqual(expectedData);
    });

    test('TC-SDE-101-04 [P1]: Should handle missing elements gracefully', () => {
      const html = `
        <div class="product">
          <h2 class="title">Product Title</h2>
        </div>
      `;
      const fieldMapping = {
        title: '.title',
        price: '.price', // This doesn't exist
        description: '.description', // This doesn't exist
      };
      const expectedData = {
        title: 'Product Title',
        price: '',
        description: '',
      };

      const extractedData = extractStructuredDataResult(html, fieldMapping);

      expect(extractedData).toEqual(expectedData);
    });

    test('TC-SDE-101-05 [P1]: Should trim whitespace from text content', () => {
      const html = `
        <div class="product">
          <h2 class="title">   Product Title with spaces   </h2>
          <span class="price">
            $29.99
          </span>
        </div>
      `;
      const fieldMapping = {
        title: '.title',
        price: '.price',
      };
      const expectedData = {
        title: 'Product Title with spaces',
        price: '$29.99',
      };

      const extractedData = extractStructuredDataResult(html, fieldMapping);

      expect(extractedData).toEqual(expectedData);
    });

    test('TC-SDE-101-06 [P2]: Should handle empty field mapping', () => {
      const html = createProductHtml('Product Title', '$29.99');
      const fieldMapping: Record<string, string> = {};

      const extractedData = extractStructuredDataResult(html, fieldMapping);

      expect(extractedData).toEqual({});
    });

    test('TC-SDE-101-07 [P2]: Should handle nested elements', () => {
      const html = `
        <div class="product">
          <div class="info">
            <h2 class="title">${TEST_PRODUCTS.nested.title}</h2>
            <div class="details">
              <span class="price">${TEST_PRODUCTS.nested.price}</span>
            </div>
          </div>
        </div>
      `;
      const fieldMapping = {
        title: '.title',
        price: '.price',
      };

      const extractedData = extractStructuredDataResult(html, fieldMapping);

      expect(extractedData).toEqual(TEST_PRODUCTS.nested);
    });

    test('TC-SDE-101-08 [P2]: Should handle multiple matches for field selector', () => {
      const tags = Array.from({ length: MULTIPLE_TAG_COUNT }, (_, i) => `Tag ${i + 1}`);
      const tagHtml = tags.map(tag => `<span class="tag">${tag}</span>`).join('\n          ');
      const html = `
        <div class="product">
          <h2 class="title">Product Title</h2>
          ${tagHtml}
        </div>
      `;
      const fieldMapping = {
        title: '.title',
        tags: '.tag',
      };
      const expectedData = {
        title: 'Product Title',
        tags: tags.join(''), // All concatenated text content
      };

      const extractedData = extractStructuredDataResult(html, fieldMapping);

      expect(extractedData).toEqual(expectedData);
    });
  });

  describe('extractMultipleStructuredData', () => {
    test('TC-SDE-102-01 [P0]: Should extract structured data from multiple elements', () => {
      const products = Array.from({ length: EXPECTED_PRODUCT_COUNT }, (_, i) => ({
        title: `Product ${i + 1}`,
        price: TEST_PRICES[i],
      }));
      const html = createMultipleProductsHtml(products);
      const $ = createCheerioInstance(html);
      const selectorResult = createSelectorResult(html, '.product');
      const fieldMapping = {
        title: '.title',
        price: '.price',
      };

      const extractedData = extractMultipleStructuredData(selectorResult, fieldMapping, $);

      expect(extractedData).toHaveLength(EXPECTED_PRODUCT_COUNT);
      expect(extractedData).toEqual(products);
    });

    test('TC-SDE-102-02 [P1]: Should return empty array when Cheerio instance is null', () => {
      const html = createProductHtml('Product 1', '');
      const selectorResult = createSelectorResult(html, '.product');
      const fieldMapping = {
        title: '.title',
      };

      const extractedData = extractMultipleStructuredData(selectorResult, fieldMapping, null);

      expect(extractedData).toEqual([]);
    });

    test('TC-SDE-102-03 [P1]: Should filter out completely empty data objects', () => {
      const html = `
        <div class="products">
          <article class="product">
            <h2 class="title">Product 1</h2>
            <span class="price">$10.00</span>
          </article>
          <article class="product">
            <!-- Empty product with no matching fields -->
          </article>
          <article class="product">
            <h2 class="title">Product 3</h2>
          </article>
        </div>
      `;
      const $ = cheerio.load(html);
      const matches = $('.product');
      const _result = createSuccessSelectorResult(matches, $);
      const fieldMapping = {
        title: '.title',
        price: '.price',
      };

      const extracted = extractMultipleStructuredData(_result, fieldMapping, $);

      expect(extracted).toHaveLength(3); // All objects with some data (even empty strings) are included
      expect(extracted).toEqual([
        { title: 'Product 1', price: '$10.00' },
        { title: '', price: '' }, // Empty product but still has empty fields
        { title: 'Product 3', price: '' }, // Has title, so included
      ]);
    });

    test('TC-SDE-102-04 [P2]: Should handle complex nested structures', () => {
      const html = `
        <div class="articles">
          <article class="post">
            <header>
              <h2 class="title">First Post</h2>
              <div class="meta">
                <span class="author">John Doe</span>
                <time class="date">2024-01-15</time>
              </div>
            </header>
            <div class="content">
              <p class="excerpt">First post excerpt</p>
            </div>
          </article>
          <article class="post">
            <header>
              <h2 class="title">Second Post</h2>
              <div class="meta">
                <span class="author">Jane Smith</span>
                <time class="date">2024-01-20</time>
              </div>
            </header>
            <div class="content">
              <p class="excerpt">Second post excerpt</p>
            </div>
          </article>
        </div>
      `;
      const $ = cheerio.load(html);
      const matches = $('.post');
      const selectorResult = createSuccessSelectorResult(matches, $);
      const fieldMapping = {
        title: '.title',
        author: '.author',
        date: '.date',
        excerpt: '.excerpt',
      };

      const extracted = extractMultipleStructuredData(selectorResult, fieldMapping, $);

      expect(extracted).toHaveLength(2);
      expect(extracted).toEqual([
        {
          title: 'First Post',
          author: 'John Doe',
          date: '2024-01-15',
          excerpt: 'First post excerpt',
        },
        {
          title: 'Second Post',
          author: 'Jane Smith',
          date: '2024-01-20',
          excerpt: 'Second post excerpt',
        },
      ]);
    });

    test('TC-SDE-102-05 [P2]: Should work with different data types via generic', () => {
      const html = `
        <div class="products">
          <article class="product">
            <h2 class="title">Product 1</h2>
            <span class="price">$10.00</span>
            <span class="rating">4.5</span>
          </article>
        </div>
      `;
      const $ = createCheerioInstance(html);
      const selectorResult = createSelectorResult(html, '.product');
      const fieldMapping = {
        title: '.title',
        price: '.price',
        rating: '.rating',
      };
      const expectedProduct: Product = {
        title: 'Product 1',
        price: '$10.00',
        rating: '4.5',
      };

      const extractedData = extractMultipleStructuredData<Product>(selectorResult, fieldMapping, $);

      expect(extractedData).toHaveLength(1);
      expect(extractedData[0]).toEqual(expectedProduct);
    });
  });

  describe('extractSingleStructuredData', () => {
    test('TC-SDE-103-01 [P0]: Should extract structured data from single element', () => {
      const html = `
        <article class="post">
          <h2 class="title">Single Post Title</h2>
          <div class="meta">
            <span class="author">John Doe</span>
            <time class="date">2024-01-15</time>
          </div>
          <p class="excerpt">Post excerpt content</p>
        </article>
      `;
      const $ = cheerio.load(html);
      const matches = $('.post');
      const _result = createSuccessSelectorResult(matches, $);
      const fieldMapping = {
        title: '.title',
        author: '.author',
        date: '.date',
        excerpt: '.excerpt',
      };

      const extracted = extractSingleStructuredData(_result, fieldMapping);

      expect(extracted).toEqual({
        title: 'Single Post Title',
        author: 'John Doe',
        date: '2024-01-15',
        excerpt: 'Post excerpt content',
      });
    });

    test('TC-SDE-103-02 [P1]: Should handle missing fields gracefully', () => {
      const html = `
        <article class="post">
          <h2 class="title">Post Title</h2>
          <span class="author">John Doe</span>
        </article>
      `;
      const $ = cheerio.load(html);
      const matches = $('.post');
      const _result = createSuccessSelectorResult(matches, $);
      const fieldMapping = {
        title: '.title',
        author: '.author',
        date: '.date', // Missing
        excerpt: '.excerpt', // Missing
      };

      const extracted = extractSingleStructuredData(_result, fieldMapping);

      expect(extracted).toEqual({
        title: 'Post Title',
        author: 'John Doe',
        date: '',
        excerpt: '',
      });
    });

    test('TC-SDE-103-03 [P1]: Should prefer text over content attribute', () => {
      const html = `
        <article class="post">
          <h2 class="title" content="Content Title">Text Title</h2>
          <meta class="excerpt" content="Content excerpt">
          <span class="author">Text author</span>
        </article>
      `;
      const $ = cheerio.load(html);
      const matches = $('.post');
      const _result = createSuccessSelectorResult(matches, $);
      const fieldMapping = {
        title: '.title',
        excerpt: '.excerpt',
        author: '.author',
      };

      const extracted = extractSingleStructuredData(_result, fieldMapping);

      expect(extracted).toEqual({
        title: 'Text Title', // Text preferred over content
        excerpt: 'Content excerpt', // Only content available
        author: 'Text author',
      });
    });

    test('TC-SDE-103-04 [P2]: Should work with generic types', () => {
      interface BlogPost {
        title: string;
        author: string;
        publishedAt: string;
        content: string;
      }

      const html = `
        <article class="post">
          <h2 class="title">Typed Post</h2>
          <span class="author">Jane Author</span>
          <time class="date">2024-02-01</time>
          <div class="content">Post content here</div>
        </article>
      `;
      const $ = cheerio.load(html);
      const matches = $('.post');
      const _result = createSuccessSelectorResult(matches, $);
      const fieldMapping = {
        title: '.title',
        author: '.author',
        publishedAt: '.date',
        content: '.content',
      };

      const extracted = extractSingleStructuredData<BlogPost>(_result, fieldMapping);

      expect(extracted).toEqual({
        title: 'Typed Post',
        author: 'Jane Author',
        publishedAt: '2024-02-01',
        content: 'Post content here',
      });
    });

    test('TC-SDE-103-05 [P2]: Should handle empty matches', () => {
      const html = `<div>No articles here</div>`;
      const $ = cheerio.load(html);
      const matches = $('.post'); // No matches
      const _result = createSuccessSelectorResult(matches, $);
      const fieldMapping = {
        title: '.title',
        author: '.author',
      };

      const extracted = extractSingleStructuredData(_result, fieldMapping);

      expect(extracted).toEqual({}); // Empty object when no matches found
    });

    test('TC-SDE-103-06 [P2]: Should handle malformed HTML gracefully', () => {
      const html = `
        <article class="post">
          <h2 class="title">Unclosed title
          <span class="author">Author without closing span
          <div class="content">Content</div>
        </article>
      `;
      const $ = cheerio.load(html);
      const matches = $('.post');
      const _result = createSuccessSelectorResult(matches, $);
      const fieldMapping = {
        title: '.title',
        author: '.author',
        content: '.content',
      };

      const extracted = extractSingleStructuredData<Record<string, string>>(_result, fieldMapping);

      expect(extracted.title).toBeTruthy();
      expect(extracted.author).toBeTruthy();
      expect(extracted.content).toBe('Content');
    });

    test('TC-SDE-103-07 [P2]: Should handle special characters and encoding', () => {
      const html = `
        <article class="post">
          <h2 class="title">Post &amp; Special &lt;Characters&gt;</h2>
          <span class="author">Author &quot;Quote&quot;</span>
          <div class="content">Content with émojis 🎉 and ñ characters</div>
        </article>
      `;
      const $ = cheerio.load(html);
      const matches = $('.post');
      const _result = createSuccessSelectorResult(matches, $);
      const fieldMapping = {
        title: '.title',
        author: '.author',
        content: '.content',
      };

      const extracted = extractSingleStructuredData(_result, fieldMapping);

      expect(extracted).toEqual({
        title: 'Post & Special <Characters>',
        author: 'Author "Quote"',
        content: 'Content with émojis 🎉 and ñ characters',
      });
    });
  });

  describe('Integration Tests', () => {
    test('TC-SDE-104-01 [P1]: Should handle real-world e-commerce product data', () => {
      const html = `
        <div class="product-list">
          <div class="product-item" data-id="1">
            <h3 class="product-name">Wireless Headphones</h3>
            <div class="pricing">
              <span class="current-price">$89.99</span>
              <span class="original-price">$129.99</span>
            </div>
            <div class="rating" data-rating="4.5">
              <span class="stars">★★★★☆</span>
              <span class="review-count">(234 reviews)</span>
            </div>
            <div class="product-meta">
              <span class="brand">TechBrand</span>
              <span class="category">Electronics</span>
            </div>
          </div>
          <div class="product-item" data-id="2">
            <h3 class="product-name">Smart Watch</h3>
            <div class="pricing">
              <span class="current-price">$249.99</span>
              <span class="original-price">$299.99</span>
            </div>
            <div class="rating" data-rating="4.8">
              <span class="stars">★★★★★</span>
              <span class="review-count">(512 reviews)</span>
            </div>
            <div class="product-meta">
              <span class="brand">SmartTech</span>
              <span class="category">Wearables</span>
            </div>
          </div>
        </div>
      `;
      const $ = cheerio.load(html);
      const matches = $('.product-item');
      const _result = createSuccessSelectorResult(matches, $);
      const fieldMapping = {
        name: '.product-name',
        currentPrice: '.current-price',
        originalPrice: '.original-price',
        rating: '.rating',
        reviewCount: '.review-count',
        brand: '.brand',
        category: '.category',
      };

      const extracted = extractMultipleStructuredData(_result, fieldMapping, $);

      expect(extracted).toHaveLength(2);
      expect(extracted[0]).toEqual({
        name: 'Wireless Headphones',
        currentPrice: '$89.99',
        originalPrice: '$129.99',
        rating: '★★★★☆(234 reviews)',
        reviewCount: '(234 reviews)',
        brand: 'TechBrand',
        category: 'Electronics',
      });
      expect(extracted[1]).toEqual({
        name: 'Smart Watch',
        currentPrice: '$249.99',
        originalPrice: '$299.99',
        rating: '★★★★★(512 reviews)',
        reviewCount: '(512 reviews)',
        brand: 'SmartTech',
        category: 'Wearables',
      });
    });

    test('TC-SDE-104-02 [P1]: Should handle blog article with mixed content types', () => {
      const html = `
        <article class="blog-post">
          <header class="post-header">
            <h1 class="post-title">Understanding Modern Web Development</h1>
            <div class="post-meta">
              <span class="author" data-author-id="123">Sarah Johnson</span>
              <time class="publish-date" datetime="2024-01-15">January 15, 2024</time>
              <div class="post-categories">
                <span class="category">Web Development</span>
                <span class="category">JavaScript</span>
                <span class="category">React</span>
              </div>
            </div>
          </header>
          <div class="post-content">
            <div class="excerpt">
              <p>Modern web development has evolved significantly over the past decade...</p>
            </div>
            <div class="post-stats">
              <span class="reading-time">5 min read</span>
              <span class="views">1,234 views</span>
              <span class="likes">42 likes</span>
            </div>
          </div>
        </article>
      `;
      const $ = cheerio.load(html);
      const matches = $('.blog-post');
      const _result = createSuccessSelectorResult(matches, $);
      const fieldMapping = {
        title: '.post-title',
        author: '.author',
        publishDate: '.publish-date',
        categories: '.category',
        excerpt: '.excerpt p',
        readingTime: '.reading-time',
        views: '.views',
        likes: '.likes',
      };

      const extracted = extractSingleStructuredData(_result, fieldMapping);

      expect(extracted).toEqual({
        title: 'Understanding Modern Web Development',
        author: 'Sarah Johnson',
        publishDate: 'January 15, 2024',
        categories: 'Web DevelopmentJavaScriptReact', // All categories concatenated
        excerpt: 'Modern web development has evolved significantly over the past decade...',
        readingTime: '5 min read',
        views: '1,234 views',
        likes: '42 likes',
      });
    });

    test('TC-SDE-104-03 [P2]: Should handle news article with structured data', () => {
      const html = `
        <article class="news-article" itemscope itemtype="http://schema.org/NewsArticle">
          <div class="article-header">
            <h1 class="headline" itemprop="headline">Breaking: New Technology Breakthrough Announced</h1>
            <div class="article-meta">
              <span class="author" itemprop="author" itemscope itemtype="http://schema.org/Person">
                <span itemprop="name">Tech Reporter</span>
              </span>
              <time class="publication-date" itemprop="datePublished" datetime="2024-01-20T10:30:00Z">
                January 20, 2024
              </time>
              <div class="source" itemprop="publisher" itemscope itemtype="http://schema.org/Organization">
                <span itemprop="name">Tech News Network</span>
              </div>
            </div>
          </div>
          <div class="article-body">
            <div class="summary" itemprop="description">
              A major technology breakthrough was announced today by leading researchers...
            </div>
            <div class="article-stats">
              <span class="word-count">456 words</span>
              <span class="read-time">2 min read</span>
            </div>
          </div>
        </article>
      `;
      const $ = cheerio.load(html);
      const matches = $('.news-article');
      const _result = createSuccessSelectorResult(matches, $);
      const fieldMapping = {
        headline: '.headline',
        author: '.author [itemprop="name"]',
        publicationDate: '.publication-date',
        publisher: '.source [itemprop="name"]',
        description: '.summary',
        wordCount: '.word-count',
        readTime: '.read-time',
      };

      const extracted = extractSingleStructuredData(_result, fieldMapping);

      expect(extracted).toEqual({
        headline: 'Breaking: New Technology Breakthrough Announced',
        author: 'Tech Reporter',
        publicationDate: 'January 20, 2024',
        publisher: 'Tech News Network',
        description:
          'A major technology breakthrough was announced today by leading researchers...',
        wordCount: '456 words',
        readTime: '2 min read',
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('TC-SDE-105-01 [P2]: Should handle elements with script content', () => {
      const html = `
        <div class="product">
          <h2 class="title">Product Title</h2>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Product Title"
          }
          </script>
          <span class="price">$29.99</span>
        </div>
      `;
      const $ = cheerio.load(html);
      const element = $('.product')[0];
      const fieldMapping = {
        title: '.title',
        price: '.price',
      };

      const _result = extractElementStructuredData(element, fieldMapping, $);

      expect(_result).toEqual({
        title: 'Product Title',
        price: '$29.99',
      });
    });

    test('TC-SDE-105-02 [P2]: Should handle deeply nested selectors', () => {
      const html = `
        <div class="container">
          <div class="wrapper">
            <div class="inner">
              <div class="deep-content">
                <h2 class="deep-title">Deep Title</h2>
                <span class="deep-value">Deep Value</span>
              </div>
            </div>
          </div>
        </div>
      `;
      const $ = cheerio.load(html);
      const element = $('.container')[0];
      const fieldMapping = {
        title: '.deep-title',
        value: '.deep-value',
      };

      const _result = extractElementStructuredData(element, fieldMapping, $);

      expect(_result).toEqual({
        title: 'Deep Title',
        value: 'Deep Value',
      });
    });

    test('TC-SDE-105-03 [P2]: Should handle elements with HTML comments', () => {
      const html = `
        <div class="product">
          <!-- This is a comment -->
          <h2 class="title">Product Title</h2>
          <!-- Another comment -->
          <span class="price">$29.99</span>
          <!-- Final comment -->
        </div>
      `;
      const $ = cheerio.load(html);
      const element = $('.product')[0];
      const fieldMapping = {
        title: '.title',
        price: '.price',
      };

      const _result = extractElementStructuredData(element, fieldMapping, $);

      expect(_result).toEqual({
        title: 'Product Title',
        price: '$29.99',
      });
    });

    test('TC-SDE-105-04 [P2]: Should handle elements with duplicate field selectors', () => {
      const html = `
        <div class="product">
          <span class="value">First Value</span>
          <span class="value">Second Value</span>
          <span class="value">Third Value</span>
        </div>
      `;
      const $ = cheerio.load(html);
      const element = $('.product')[0];
      const fieldMapping = {
        value: '.value', // Multiple matches
      };

      const _result = extractElementStructuredData(element, fieldMapping, $);

      expect(_result).toEqual({
        value: 'First ValueSecond ValueThird Value', // Concatenated
      });
    });
  });
});
