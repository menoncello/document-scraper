/**
 * Test factory for creating HTML content fixtures
 * Provides parallel-safe test data generation with unique identifiers
 */
export class HtmlContentFactory {
  private static counter = 0;

  /**
   * Create basic HTML content for testing
   */
  static basic(overrides: { title?: string; content?: string } = {}): string {
    const id = ++this.counter;
    const title = overrides.title || `Test Page ${id}`;
    const content = overrides.content || `This is test content ${id}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="Test description ${id}">
</head>
<body>
    <header>
        <h1>${title}</h1>
    </header>
    <main>
        <section class="content">
            <p>${content}</p>
        </section>
    </main>
</body>
</html>`;
  }

  /**
   * Create HTML content with article structure
   */
  static withArticles(articleCount = 3): string {
    const id = ++this.counter;
    let articles = '';

    for (let i = 1; i <= articleCount; i++) {
      articles += `
            <article class="post" data-id="${i}">
                <h2>Article ${i} Title</h2>
                <div class="meta">
                    <span class="author">Author ${i}</span>
                    <span class="date">2024-01-${String(i).padStart(2, '0')}</span>
                    <span class="category">Category ${i}</span>
                </div>
                <div class="content">
                    <p>This is the content of article ${i}.</p>
                    <p>It contains multiple paragraphs for testing.</p>
                </div>
                <div class="tags">
                    <span class="tag">tag-${i}-1</span>
                    <span class="tag">tag-${i}-2</span>
                </div>
            </article>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test Articles Page ${id}</title>
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
  static withDataAttributes(): string {
    const id = ++this.counter;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Data Attributes Test ${id}</title>
</head>
<body>
    <div class="products">
        <div class="product" data-id="1" data-category="electronics" data-price="99.99">
            <h3>Product 1</h3>
            <span class="price">$99.99</span>
        </div>
        <div class="product" data-id="2" data-category="books" data-price="29.99">
            <h3>Product 2</h3>
            <span class="price">$29.99</span>
        </div>
        <div class="product" data-id="3" data-category="clothing" data-price="49.99">
            <h3>Product 3</h3>
            <span class="price">$49.99</span>
        </div>
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
