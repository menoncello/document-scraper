/**
 * Test factory for creating HTML content fixtures
 * Provides parallel-safe test data generation with unique identifiers
 * Enhanced with faker for dynamic, realistic test data
 */
import { faker } from '@faker-js/faker';

export class HtmlContentFactory {
  private static counter = 0;

  /**
   * Create basic HTML content for testing
   */
  static basic(overrides: { title?: string; content?: string; description?: string } = {}): string {
    const uniqueId = faker.string.uuid();
    const title = overrides.title || 'Test Page';
    const content = overrides.content || 'This is a test page content for parsing.';
    const description = overrides.description || 'Test description';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="test-id" content="${uniqueId}">
</head>
<body>
    <header>
        <h1>${title}</h1>
    </header>
    <main>
        <section class="content">
            <p>${content}</p>
            <div class="meta" data-test-id="${uniqueId}">
                <span class="author">Test Author</span>
                <span class="date">2024-01-01</span>
            </div>
        </section>
    </main>
</body>
</html>`;
  }

  /**
   * Create HTML content with article structure
   */
  static withArticles(articleCount = 3): string {
    let articles = '';
    const categories = ['technology', 'business', 'science', 'health'];

    for (let i = 0; i < articleCount; i++) {
      const articleId = faker.string.uuid();
      const articleNum = i + 1;
      const title = `Article ${articleNum} Title`;
      const author = `Author ${articleNum}`;
      const date = `2024-01-${articleNum.toString().padStart(2, '0')}`;
      const category = categories[i % categories.length];
      const content = `This is the content for article ${articleNum}. It contains meaningful text for testing purposes.`;
      const tags = [`tag${articleNum}a`, `tag${articleNum}b`];

      articles += `
            <article class="post" data-id="${articleId}" data-category="${category}">
                <h2>${title}</h2>
                <div class="meta">
                    <span class="author">${author}</span>
                    <span class="date">${date}</span>
                    <span class="category">${category}</span>
                </div>
                <div class="content">
                    <p>${content}</p>
                </div>
                <div class="tags">
                    ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </article>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test Articles</title>
    <meta name="test-id" content="${faker.string.uuid()}">
</head>
<body>
    <main>
        <section class="content">
            ${articles}
        </section>
    </main>
</body>
</html>`;
  }

  /**
   * Create HTML content with structured article data (for structured data extraction tests)
   */
  static withStructuredArticles(articleCount = 1): string {
    let articles = '';

    for (let i = 0; i < articleCount; i++) {
      const articleNum = i + 1;
      const title = `Article ${articleNum} Title`;
      const author = `Author ${articleNum}`;
      const date = `2024-01-01`;
      const content = `Structured content for article ${articleNum} with specific test data.`;

      articles += `
            <article class="post">
                <h2>${title}</h2>
                <div class="meta">
                    <span class="author">${author}</span>
                    <span class="date">${date}</span>
                </div>
                <div class="content">
                    <p>${content}</p>
                </div>
            </article>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Structured Articles</title>
    <meta name="test-id" content="${faker.string.uuid()}">
</head>
<body>
    <main>
        <section class="content">
            ${articles}
        </section>
    </main>
</body>
</html>`;
  }

  /**
   * Create HTML content with nested structure
   */
  static withNestedStructure(): string {
    const id = ++this.counter;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Nested Structure Test ${id}</title>
</head>
<body>
    <div class="container">
        <header>
            <h1>Main Title ${id}</h1>
            <nav>
                <ul class="navigation">
                    <li><a href="#home">Home</a></li>
                    <li><a href="#about">About</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            </nav>
        </header>
        <main>
            <section class="content">
                <div class="nested-level-1">
                    <div class="nested-level-2">
                        <h2>Nested Title</h2>
                        <p>Nested content</p>
                        <div class="nested-level-3">
                            <span class="highlight">Highlighted text</span>
                        </div>
                    </div>
                </div>
            </section>
        </main>
        <footer>
            <p>Footer content ${id}</p>
        </footer>
    </div>
</body>
</html>`;
  }

  /**
   * Create HTML content with form elements
   */
  static withForm(): string {
    const id = ++this.counter;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Form Test Page ${id}</title>
</head>
<body>
    <form id="test-form-${id}" class="contact-form">
        <div class="form-group">
            <label for="name-${id}">Name</label>
            <input type="text" id="name-${id}" name="name" value="Test Name ${id}" />
        </div>
        <div class="form-group">
            <label for="email-${id}">Email</label>
            <input type="email" id="email-${id}" name="email" value="test${id}@example.com" />
        </div>
        <div class="form-group">
            <label for="message-${id}">Message</label>
            <textarea id="message-${id}" name="message">Test message ${id}</textarea>
        </div>
        <button type="submit">Submit ${id}</button>
    </form>
</body>
</html>`;
  }

  /**
   * Create HTML content with data attributes
   */
  static withDataAttributes(productCount = 3): string {
    const categories = ['electronics', 'books', 'clothing', 'home', 'sports', 'toys'];
    const fixedPrices = ['99.99', '29.99', '49.99', '199.99', '15.99', '79.99'];
    let products = '';

    for (let i = 0; i < productCount; i++) {
      const productNum = i + 1;
      const productId = productNum === 1 ? '1' : faker.string.uuid(); // First product has predictable ID
      const category = categories[i % categories.length];
      const price = fixedPrices[i % fixedPrices.length];
      const name = `Product ${productNum}`;
      const rating = 4.5;
      const inStock = true;

      products += `
        <div class="product"
             data-id="${productId}"
             data-category="${category}"
             data-price="${price}"
             data-rating="${rating}"
             data-in-stock="${inStock}">
            <h3>${name}</h3>
            <span class="price">$${Number.parseFloat(price).toFixed(2)}</span>
            <span class="rating">Rating: ${rating}/5</span>
            <span class="stock">${inStock ? 'In Stock' : 'Out of Stock'}</span>
        </div>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test Products</title>
    <meta name="test-id" content="${faker.string.uuid()}">
</head>
<body>
    <div class="products" data-category="all">
        ${products}
    </div>
</body>
</html>`;
  }

  /**
   * Reset the counter (useful for test isolation)
   */
  static reset(): void {
    this.counter = 0;
  }
}
