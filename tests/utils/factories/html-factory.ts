/**
 * Factory functions for generating HTML test content with parallel-safe defaults
 */

import { faker } from '@faker-js/faker';

const fakerAny = faker as any;

/**
 * Creates a basic HTML document structure
 */
export const createBasicHtml = (
  overrides: { title?: string; content?: string; url?: string } = {}
): string => {
  const title = overrides.title || fakerAny.lorem.sentences(1);
  const content =
    overrides.content || Array.from({ length: 3 }, () => fakerAny.lorem.paragraph()).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body>
    <header>
        <h1>${title}</h1>
    </header>
    <main>
        <article>
            <div class="content">${content}</div>
        </article>
    </main>
    <footer>
        <p>Generated at: ${new Date().toISOString()}</p>
    </footer>
</body>
</html>`;
};

/**
 * Creates an HTML document with multiple articles
 */
export const createArticleListHtml = (count = 3, overrides: { baseUrl?: string } = {}): string => {
  const baseUrl = overrides.baseUrl || fakerAny.internet.url();
  const articles = Array.from({ length: count }, (_, index) => ({
    title: fakerAny.lorem.sentences(),
    content: Array.from({ length: 2 }, () => fakerAny.lorem.paragraph()).join('\n\n'),
    author: `${fakerAny.person.firstName()} ${fakerAny.person.lastName()}`,
    date: fakerAny.date.recent({ days: 1 }).toISOString().split('T')[0],
    tags: Array.from({ length: fakerAny.number.int({ min: 1, max: 3 }) }, () =>
      fakerAny.lorem.words(2)
    ).join(', '),
    url: `${baseUrl}/article-${index + 1}`,
  }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Article List</title>
</head>
<body>
    <h1>Articles</h1>
    ${articles
      .map(
        article => `
    <article class="article-item">
        <h2><a href="${article.url}">${article.title}</a></h2>
        <div class="content">${article.content}</div>
        <div class="meta">
            <span class="author">By ${article.author}</span>
            <span class="date">${article.date}</span>
            <span class="tags">${article.tags}</span>
        </div>
    </article>`
      )
      .join('')}
</body>
</html>`;
};

/**
 * Creates an HTML document with forms for testing form extraction
 */
export const createFormHtml = (): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Contact Form</title>
</head>
<body>
    <form id="contact-form" method="post" action="/submit">
        <div class="form-group">
            <label for="name">Name:</label>
            <input type="text" id="name" name="name" required>
        </div>
        <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
        </div>
        <div class="form-group">
            <label for="message">Message:</label>
            <textarea id="message" name="message" rows="4" required></textarea>
        </div>
        <button type="submit">Send Message</button>
    </form>
</body>
</html>`;
};

/**
 * Creates product listing HTML for testing e-commerce extraction
 */
export const createProductHtml = (count = 5): string => {
  const products = Array.from({ length: count }, (_, index) => ({
    name: fakerAny.commerce.productName(),
    price: fakerAny.commerce.price(),
    description: Array.from({ length: 2 }, () => fakerAny.lorem.paragraph()).join('\n\n'),
    rating: fakerAny.number.int({ min: 1, max: 5 }),
    image: fakerAny.internet.url(), // Fallback for image URL
    id: `product-${index + 1}`,
  }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Products</title>
</head>
<body>
    <h1>Product Catalog</h1>
    <div class="products">
        ${products
          .map(
            product => `
        <div class="product" data-id="${product.id}">
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">$${product.price}</div>
            <div class="product-description">${product.description}</div>
            <div class="product-rating">Rating: ${product.rating}/5</div>
            <img src="${product.image}" alt="${product.name}">
        </div>`
          )
          .join('')}
    </div>
</body>
</html>`;
};

/**
 * Creates nested sections for testing
 */
const createNestedSections = (): Array<{
  title: string;
  content: string;
  subsections: Array<{ title: string; content: string }>;
}> => {
  return Array.from({ length: fakerAny.number.int({ min: 2, max: 4 }) }, () => ({
    title: fakerAny.lorem.words(3),
    content: fakerAny.lorem.paragraph(),
    subsections: Array.from({ length: fakerAny.number.int({ min: 1, max: 3 }) }, () => ({
      title: fakerAny.lorem.words(2),
      content: fakerAny.lorem.sentences(),
    })),
  }));
};

/**
 * Creates complex nested HTML structure
 */
export const createNestedHtml = (): string => {
  const sections = createNestedSections();

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Nested Content</title>
</head>
<body>
    <h1>Main Document</h1>
    ${sections
      .map(
        section => `
    <section class="main-section">
        <h2>${section.title}</h2>
        <div class="section-content">${section.content}</div>
        ${section.subsections
          .map(
            sub => `
        <div class="subsection">
            <h3>${sub.title}</h3>
            <div class="subsection-content">${sub.content}</div>
        </div>`
          )
          .join('')}
    </section>`
      )
      .join('')}
</body>
</html>`;
};

/**
 * Creates table HTML with structured data
 */
export const createTableHtml = (rows = 5): string => {
  const headers = ['Name', 'Email', 'Phone', 'Department', 'Salary'];
  const data = Array.from({ length: rows }, () => ({
    name: `${fakerAny.person.firstName()} ${fakerAny.person.lastName()}`,
    email: fakerAny.internet.email(),
    phone: fakerAny.phone.number('###-###-####'), // Format for phone number
    department: fakerAny.helpers.arrayElement(['Engineering', 'Sales', 'Marketing', 'HR']),
    salary: `$${fakerAny.number.int({ min: 50000, max: 150000 }).toLocaleString()}`,
  }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Employee Data</title>
</head>
<body>
    <h1>Employee Directory</h1>
    <table id="employee-table" class="data-table">
        <thead>
            <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${data
              .map(
                row => `
            <tr>
                <td class="name">${row.name}</td>
                <td class="email">${row.email}</td>
                <td class="phone">${row.phone}</td>
                <td class="department">${row.department}</td>
                <td class="salary">${row.salary}</td>
            </tr>`
              )
              .join('')}
        </tbody>
    </table>
</body>
</html>`;
};

/**
 * Creates list items with sub-items for testing
 */
const createListItems = (): Array<{
  text: string;
  subItems: string[];
}> => {
  return Array.from({ length: fakerAny.number.int({ min: 3, max: 6 }) }, () => ({
    text: fakerAny.lorem.sentences(),
    subItems: Array.from({ length: fakerAny.number.int({ min: 1, max: 3 }) }, () =>
      fakerAny.lorem.sentences()
    ),
  }));
};

/**
 * Renders unordered list HTML with nested sub-items
 */
export const createListHtml = (): string => {
  const items = createListItems();

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Nested List</title>
</head>
<body>
    <h1>Task List</h1>
    <ul class="main-list">
        ${items
          .map(
            item => `
        <li class="list-item">
            <span class="item-text">${item.text}</span>
            <ul class="sub-list">
                ${item.subItems
                  .map(
                    subItem => `
                <li class="sub-item">${subItem}</li>
                `
                  )
                  .join('')}
            </ul>
        </li>`
          )
          .join('')}
    </ul>
</body>
</html>`;
};

/**
 * Creates pagination HTML for testing navigation extraction
 */
export const createPaginationHtml = (currentPage = 1, totalPages = 10): string => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Paginated Results</title>
</head>
<body>
    <div class="pagination">
        ${currentPage > 1 ? `<a href="/page/${currentPage - 1}" class="prev">Previous</a>` : ''}
        ${pages
          .map(
            page => `
        <a href="/page/${page}" class="${page === currentPage ? 'current' : 'page-link'}">${page}</a>
        `
          )
          .join('')}
        ${currentPage < totalPages ? `<a href="/page/${currentPage + 1}" class="next">Next</a>` : ''}
    </div>
    <div class="results">
        <p>Showing page ${currentPage} of ${totalPages}</p>
    </div>
</body>
</html>`;
};

/**
 * Creates an HTML document with specific attributes for testing attribute extraction
 */
export const createAttributeHtml = (): string => {
  const items = Array.from({ length: 3 }, (_, index) => ({
    id: `item-${index + 1}`,
    class: fakerAny.helpers.arrayElement(['important', 'normal', 'featured']),
    'data-category': fakerAny.helpers.arrayElement(['tech', 'business', 'design']),
    'data-priority': fakerAny.number.int({ min: 1, max: 5 }),
    href: fakerAny.internet.url(),
    title: fakerAny.lorem.sentences(),
  }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Attribute Test</title>
</head>
<body>
    <h1>Attribute Extraction Test</h1>
    <div class="container">
        ${items
          .map(
            (item, index) => `
        <a
            id="${item.id}"
            class="${item.class}"
            data-category="${item['data-category']}"
            data-priority="${item['data-priority']}"
            href="${item.href}"
            title="${item.title}"
        >
            Link ${index + 1}
        </a>`
          )
          .join('')}
    </div>
</body>
</html>`;
};

/**
 * Creates HTML with various input types for testing form field extraction
 */
export const createInputTypesHtml = (): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Input Types Test</title>
</head>
<body>
    <form>
        <input type="text" name="username" placeholder="Username">
        <input type="password" name="password" placeholder="Password">
        <input type="email" name="email" placeholder="Email">
        <input type="number" name="age" min="1" max="120">
        <input type="date" name="birthdate">
        <input type="checkbox" name="newsletter" value="yes">
        <input type="radio" name="gender" value="male">
        <input type="radio" name="gender" value="female">
        <select name="country">
            <option value="us">United States</option>
            <option value="uk">United Kingdom</option>
        </select>
        <textarea name="message" rows="4"></textarea>
        <button type="submit">Submit</button>
    </form>
</body>
</html>`;
};
