# Bun Testing Patterns for Document Scrape

**适用项目**: Document Scrape (Bun + TypeScript web scraping library)
**测试框架**: Bun Test
**质量要求**: 100% pass rate, 70%+ mutation score

---

## Bun Test API 基础模式

### 基本测试结构
```typescript
import { test, expect, describe } from "bun:test";

describe("DocumentScraper", () => {
  test("should create scraper with valid config", () => {
    const config = createSampleConfig();
    const scraper = new DocumentScraper(config);

    expect(scraper).toBeDefined();
    expect(scraper.getConfig()).toEqual(config);
  });
});
```

### 异步测试模式
```typescript
test("should fetch and parse HTML content", async () => {
  const scraper = new DocumentScraper(createSampleConfig());
  const result = await scraper.scrape();

  expect(result).toBeDefined();
  expect(result.data).toBeInstanceOf(Array);
  expect(result.success).toBe(true);
});
```

### Mock HTTP 请求
```typescript
import { mockFetch } from "bun:test";

test("should handle HTTP errors gracefully", async () => {
  // Mock failed response
  global.fetch = mockFetch(() => ({
    status: 500,
    ok: false,
    text: async () => "Internal Server Error"
  }));

  const scraper = new DocumentScraper(createSampleConfig());

  // Should handle error without throwing
  const result = await scraper.scrape();
  expect(result.success).toBe(false);
  expect(result.errors).toHaveLength(1);
});
```

---

## 测试数据工厂模式

### 配置工厂
```typescript
// factories/config-factory.ts
export function createSampleConfig(overrides?: Partial<ScrapingConfig>): ScrapingConfig {
  return {
    target: {
      url: "https://example.com",
      selector: ".content",
      waitFor: 1000
    },
    extraction: {
      fields: {
        title: "h1",
        content: ".content p",
        author: ".author"
      },
      multiple: false
    },
    output: {
      format: "json",
      filename: "output.json"
    },
    behavior: {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: 1,
      userAgent: "docs-scrape/1.0.0"
    },
    ...overrides
  };
}

export function createInvalidConfig(): Partial<ScrapingConfig> {
  return {
    target: {
      url: "",  // Invalid empty URL
      selector: ""
    }
  };
}
```

### HTML 内容工厂
```typescript
// factories/html-factory.ts
export function createSampleHTML(title: string = "Test Page"): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><title>${title}</title></head>
    <body>
      <h1>${title}</h1>
      <div class="content">
        <p>First paragraph</p>
        <p>Second paragraph</p>
        <p class="author">John Doe</p>
      </div>
    </body>
    </html>
  `;
}

export function createComplexHTML(): string {
  return `
    <!DOCTYPE html>
    <html>
    <body>
      <div class="articles">
        ${Array.from({ length: 5 }, (_, i) => `
          <article class="post">
            <h2>Post ${i + 1}</h2>
            <p>Content for post ${i + 1}</p>
            <span class="author">Author ${i + 1}</span>
          </article>
        `).join('')}
      </div>
    </body>
    </html>
  `;
}
```

---

## 错误处理测试模式

### 网络错误测试
```typescript
describe("HTTP Client Error Handling", () => {
  test("should retry on network timeout", async () => {
    let attemptCount = 0;
    global.fetch = mockFetch(() => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error("Network timeout");
      }
      return {
        status: 200,
        ok: true,
        text: async () => "<html>Success</html>"
      };
    });

    const config = createSampleConfig({
      behavior: {
        retryAttempts: 3,
        retryDelay: 100,
        rateLimit: 1
      }
    });

    const scraper = new DocumentScraper(config);
    const result = await scraper.scrape();

    expect(attemptCount).toBe(3);
    expect(result.success).toBe(true);
  });

  test("should fail after max retries", async () => {
    global.fetch = mockFetch(() => {
      throw new Error("Persistent network error");
    });

    const config = createSampleConfig({
      behavior: {
        retryAttempts: 2,
        retryDelay: 50,
        rateLimit: 1
      }
    });

    const scraper = new DocumentScraper(config);
    const result = await scraper.scrape();

    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain("Persistent network error");
  });
});
```

### 配置验证测试
```typescript
describe("Configuration Validation", () => {
  test("should reject invalid URL", () => {
    const invalidConfig = createInvalidConfig();

    expect(() => {
      new DocumentScraper(invalidConfig as ScrapingConfig);
    }).toThrow("Invalid URL");
  });

  test("should reject missing extraction fields", () => {
    const config = createSampleConfig({
      extraction: {
        fields: {},  // Empty fields
        multiple: false
      }
    });

    const scraper = new DocumentScraper(config);
    const validation = scraper.validateConfig();

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("No extraction fields defined");
  });
});
```

---

## Mutation Testing 优化模式

### 边界值测试
```typescript
describe("Boundary Value Testing", () => {
  test("should handle empty content gracefully", async () => {
    global.fetch = mockFetch(() => ({
      status: 200,
      ok: true,
      text: async () => ""  // Empty HTML
    }));

    const scraper = new DocumentScraper(createSampleConfig());
    const result = await scraper.scrape();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  test("should handle malformed HTML", async () => {
    global.fetch = mockFetch(() => ({
      status: 200,
      ok: true,
      text: async () => "<div>Unclosed tag<p>Missing closing"
    }));

    const scraper = new DocumentScraper(createSampleConfig());
    const result = await scraper.scrape();

    expect(result.success).toBe(true);
    // Should parse what it can, not crash
  });
});
```

### 空值和错误路径测试
```typescript
describe("Null and Error Path Testing", () => {
  test("should handle null response headers", async () => {
    global.fetch = mockFetch(() => ({
      status: 200,
      ok: true,
      text: async () => "<html>Content</html>",
      headers: null  // Null headers
    }));

    const scraper = new DocumentScraper(createSampleConfig());
    const result = await scraper.scrape();

    expect(result.success).toBe(true);
  });

  test("should handle undefined extraction results", async () => {
    global.fetch = mockFetch(() => ({
      status: 200,
      ok: true,
      text: async () => "<html>No matching selectors</html>"
    }));

    const config = createSampleConfig({
      extraction: {
        fields: {
          title: ".nonexistent",
          content: "#missing"
        }
      }
    });

    const scraper = new DocumentScraper(config);
    const result = await scraper.scrape();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });
});
```

---

## 性能和并发测试

### 速率限制测试
```typescript
describe("Rate Limiting", () => {
  test("should respect rate limits", async () => {
    const startTime = Date.now();
    const urls = Array.from({ length: 3 }, (_, i) => `https://example.com/page${i + 1}`);

    global.fetch = mockFetch(() => ({
      status: 200,
      ok: true,
      text: async () => `<html>Page content</html>`
    }));

    const config = createSampleConfig({
      behavior: {
        rateLimit: 2,  // 2 requests per second
        retryAttempts: 1,
        retryDelay: 100
      }
    });

    const scraper = new DocumentScraper(config);
    await scraper.scrapeMultiple(urls);

    const elapsedTime = Date.now() - startTime;
    expect(elapsedTime).toBeGreaterThan(1000); // Should take at least 1 second for 3 requests
  });
});
```

---

## 测试质量标准

### 必须满足的条件
1. **100% test pass rate** - 所有测试必须通过
2. **TypeScript 0 errors** - 测试代码必须编译通过
3. **ESLint 0 errors** - 测试代码必须通过 lint 检查
4. **70%+ mutation score** - 测试必须能杀死大部分变异体

### 优化 Mutation Score 的技巧
1. **测试边界值** - 0, 1, 最大值, 空值
2. **测试错误路径** - 异常处理, null/undefined 检查
3. **测试条件分支** - 覆盖所有 if/else 分支
4. **使用具体断言** - 避免 toBeTruthy() 等模糊断言
5. **测试副作用** - 验证状态改变和副作用

### 测试文件命名规范
- 单元测试: `*.test.ts`
- 集成测试: `integration/*.test.ts`
- 工厂函数: `factories/*.ts`
- 测试辅助: `helpers/*.ts`

---

## 常见陷阱和解决方案

### 1. Floating Promises
```typescript
// ❌ 错误 - 未处理 Promise
test("bad async test", () => {
  scraper.scrape();  // Floating promise
});

// ✅ 正确 - 使用 async/await
test("good async test", async () => {
  const result = await scraper.scrape();
  expect(result.success).toBe(true);
});
```

### 2. Mock 清理
```typescript
// ❌ 错误 - 污染其他测试
test("without cleanup", () => {
  global.fetch = mockFetch(() => ({ status: 200 }));
});

// ✅ 正确 - 使用 beforeEach 清理
describe("with proper cleanup", () => {
  beforeEach(() => {
    // 清理之前的 mock
    global.fetch = originalFetch;
  });
});
```

### 3. 测试隔离
```typescript
// ✅ 每个测试使用独立数据
test("with isolated data", async () => {
  const uniqueConfig = createSampleConfig({
    target: { url: "https://unique-test.com" }
  });
  const scraper = new DocumentScraper(uniqueConfig);
  // ... 测试逻辑
});
```