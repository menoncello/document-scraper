# Stryker Mutation Testing Guide for Document Scrape

**适用项目**: Document Scrape (Bun + TypeScript web scraping library)
**工具**: Stryker 9.2.0+
**质量要求**: 70% break, 75% low, 90% high thresholds

---

## Mutation Testing 基础概念

### 什么是 Mutation Testing？
Mutation testing 是一种软件测试技术，通过修改源代码创建"变异体"(mutants)，然后运行测试套件来检查是否能检测到这些变更。

### 为什么重要？
- **测试质量评估**: 衡量测试套件检测缺陷的能力
- **测试覆盖盲点**: 发现未测试的代码路径
- **代码质量提升**: 驱动编写更全面的测试

### Document Scrape 配置
```javascript
// stryker.config.js
export default {
  testRunner: 'command',
  testRunnerCommand: 'bun test',

  mutate: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts'
  ],

  coverageAnalysis: 'perTest',

  thresholds: {
    high: 90,    // 目标分数
    low: 75,     // 警告阈值
    break: 70    // 最低要求
  },

  reporters: ['progress', 'clear-text', 'html', 'dashboard'],

  concurrency: 2,
  maxConcurrentTestRunners: 2,
  timeoutMS: 60000,
  timeoutFactor: 1.5
};
```

---

## 常见 Mutation Types 和应对策略

### 1. Arithmetic Operators (算术运算符)
```typescript
// 原始代码
export class RateLimiter {
  private requestCount = 0;
  private maxRequests = 10;

  canMakeRequest(): boolean {
    return this.requestCount < this.maxRequests;
  }
}

// 变异体示例
return this.requestCount <= this.maxRequests;  // < -> <=
return this.requestCount > this.maxRequests;   // < -> >
return this.requestCount >= this.maxRequests;  // < -> >=

// 测试策略
describe("RateLimiter", () => {
  test("should enforce request limits", () => {
    const limiter = new RateLimiter();

    // 测试边界值
    for (let i = 0; i < 10; i++) {
      expect(limiter.canMakeRequest()).toBe(true);
      limiter.incrementRequest();
    }

    // 测试临界点 - 杀死算术变异体
    expect(limiter.canMakeRequest()).toBe(false);
  });
});
```

### 2. Conditional Operators (条件运算符)
```typescript
// 原始代码
export class HttpClient {
  async fetchWithRetry(url: string, attempts = 3): Promise<Response> {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (attempts > 0) {
        return this.fetchWithRetry(url, attempts - 1);
      }
      throw error;
    }
  }
}

// 变异体示例
if (!response.ok) {                    // ok -> !ok
if (attempts <= 0) {                   // > -> <=
if (attempts >= 0) {                   // > -> >=
if (attempts != 0) {                   // > -> !=

// 测试策略
describe("HttpClient", () => {
  test("should retry on failure", async () => {
    let attemptCount = 0;
    global.fetch = mockFetch(() => {
      attemptCount++;
      if (attemptCount < 3) {
        return { ok: false, status: 500 };
      }
      return { ok: true, status: 200 };
    });

    const client = new HttpClient();
    const response = await client.fetchWithRetry("https://example.com");

    expect(response.ok).toBe(true);
    expect(attemptCount).toBe(3);  // 验证重试次数
  });

  test("should fail after max attempts", async () => {
    global.fetch = mockFetch(() => ({ ok: false, status: 500 }));

    const client = new HttpClient();

    await expect(client.fetchWithRetry("https://example.com"))
      .rejects.toThrow("HTTP 500");
  });
});
```

### 3. Boolean Literals (布尔字面量)
```typescript
// 原始代码
export class DataExtractor {
  extractData(html: string, selectors: Record<string, string>): any[] {
    const $ = cheerio.load(html);
    const results: any[] = [];

    for (const [field, selector] of Object.entries(selectors)) {
      const elements = $(selector);
      if (elements.length > 0) {  // 变异体: if (elements.length === 0)
        results.push({
          field,
          value: elements.first().text().trim()
        });
      }
    }

    return results;
  }
}

// 测试策略
describe("DataExtractor", () => {
  test("should handle empty elements", () => {
    const html = "<div><p>Content</p></div>";
    const selectors = {
      title: "h1",        // 不存在
      content: "p",        // 存在
      author: ".author"    // 不存在
    };

    const extractor = new DataExtractor();
    const results = extractor.extractData(html, selectors);

    expect(results).toHaveLength(1);  // 只有 content 匹配
    expect(results[0].field).toBe("content");
    expect(results[0].value).toBe("Content");
  });
});
```

### 4. Logical Operators (逻辑运算符)
```typescript
// 原始代码
export class ConfigValidator {
  validateConfig(config: ScrapingConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.target.url) {
      errors.push("Target URL is required");
    }

    if (config.extraction.fields && Object.keys(config.extraction.fields).length === 0) {
      errors.push("Extraction fields cannot be empty");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// 变异体示例
if (config.target.url || !config.target.url) {           // ! -> ||
if (config.extraction.fields && Object.keys(config.extraction.fields).length > 0) {  // === -> !==

// 测试策略
describe("ConfigValidator", () => {
  test("should validate empty URL", () => {
    const config = createSampleConfig({
      target: { url: "" }
    });

    const validator = new ConfigValidator();
    const result = validator.validateConfig(config);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Target URL is required");
  });

  test("should validate empty extraction fields", () => {
    const config = createSampleConfig({
      extraction: { fields: {} }
    });

    const validator = new ConfigValidator();
    const result = validator.validateConfig(config);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Extraction fields cannot be empty");
  });
});
```

---

## 提升 Mutation Score 的策略

### 1. 边界值测试
```typescript
// 测试数组边界
describe("Array Processing", () => {
  test("should handle empty array", () => {
    const processor = new DataProcessor();
    expect(processor.process([])).toEqual([]);
  });

  test("should handle single element array", () => {
    const processor = new DataProcessor();
    expect(processor.process(["single"])).toHaveLength(1);
  });

  test("should handle maximum size array", () => {
    const processor = new DataProcessor();
    const largeArray = Array.from({ length: 1000 }, (_, i) => `item${i}`);
    expect(processor.process(largeArray)).toHaveLength(1000);
  });
});
```

### 2. 错误路径测试
```typescript
describe("Error Path Testing", () => {
  test("should handle null input", () => {
    const parser = new HtmlParser();

    expect(() => parser.parse(null)).toThrow();
    expect(() => parser.parse(undefined)).toThrow();
  });

  test("should handle malformed input", () => {
    const parser = new HtmlParser();
    const malformedInputs = [
      "",
      "<",
      "<div>unclosed",
      "not html",
      null,
      undefined
    ];

    malformedInputs.forEach(input => {
      expect(() => parser.parse(input)).not.toThrow();
      // 应该优雅处理而不是崩溃
    });
  });
});
```

### 3. 条件分支覆盖
```typescript
describe("Conditional Branch Coverage", () => {
  test("should handle all selector types", () => {
    const extractor = new DataExtractor();
    const html = `
      <div id="content">Content</div>
      <p class="text">Text</p>
      <div data-value="test">Data</div>
    `;

    const selectors = {
      id: "#content",           // ID selector
      class: ".text",           // Class selector
      attribute: "[data-value]", // Attribute selector
      tag: "div",               // Tag selector
      nonexistent: ".missing"   // Non-existent selector
    };

    const results = extractor.extractData(html, selectors);

    expect(results).toHaveLength(4);  // 除了 nonexistent 都应该匹配
    expect(results.map(r => r.field)).toEqual(
      expect.arrayContaining(["id", "class", "attribute", "tag"])
    );
  });
});
```

### 4. 状态变化测试
```typescript
describe("State Change Testing", () => {
  test("should track state mutations", () => {
    const counter = new RequestCounter();

    expect(counter.getCount()).toBe(0);

    counter.increment();
    expect(counter.getCount()).toBe(1);  // 杀死 >= 变异体

    counter.increment();
    expect(counter.getCount()).toBe(2);

    counter.reset();
    expect(counter.getCount()).toBe(0);  // 杀死赋值变异体
  });
});
```

---

## 常见 Surviving Mutants 和解决方案

### 1. 未使用的代码路径
```typescript
// 问题代码
export class Logger {
  log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (level === 'error') {
      console.error(message);
    } else if (level === 'warn') {
      console.warn(message);
    } else {
      console.log(message);  // 可能永远不会被测试
    }
  }
}

// 解决方案
describe("Logger", () => {
  test("should log info messages", () => {
    const spy = jest.spyOn(console, 'log');
    const logger = new Logger();

    logger.log("info message", "info");
    expect(spy).toHaveBeenCalledWith("info message");
  });

  test("should log warn messages", () => {
    const spy = jest.spyOn(console, 'warn');
    const logger = new Logger();

    logger.log("warn message", "warn");
    expect(spy).toHaveBeenCalledWith("warn message");
  });

  test("should use default level", () => {
    const spy = jest.spyOn(console, 'log');
    const logger = new Logger();

    logger.log("default message");  // 测试默认参数
    expect(spy).toHaveBeenCalledWith("default message");
  });
});
```

### 2. 字符串操作变异体
```typescript
// 问题代码
export class UrlNormalizer {
  normalize(url: string): string {
    if (url.endsWith('/')) {
      return url.slice(0, -1);  // 变异体: slice(0, -2)
    }
    return url;
  }
}

// 解决方案
describe("UrlNormalizer", () => {
  test("should remove trailing slash", () => {
    const normalizer = new UrlNormalizer();
    expect(normalizer.normalize("https://example.com/")).toBe("https://example.com");
  });

  test("should handle single character", () => {
    const normalizer = new UrlNormalizer();
    expect(normalizer.normalize("a/")).toBe("a");  // 测试边界情况
  });

  test("should not modify url without trailing slash", () => {
    const normalizer = new UrlNormalizer();
    expect(normalizer.normalize("https://example.com")).toBe("https://example.com");
  });

  test("should handle empty string", () => {
    const normalizer = new UrlNormalizer();
    expect(normalizer.normalize("")).toBe("");
  });
});
```

### 3. 对象属性访问
```typescript
// 问题代码
export class ResponseParser {
  parseSuccess(response: any): boolean {
    return response && response.status === 200;  // 变异体: response.status !== 200
  }
}

// 解决方案
describe("ResponseParser", () => {
  test("should handle successful response", () => {
    const parser = new ResponseParser();
    expect(parser.parseSuccess({ status: 200 })).toBe(true);
  });

  test("should handle failure response", () => {
    const parser = new ResponseParser();
    expect(parser.parseSuccess({ status: 404 })).toBe(false);
  });

  test("should handle null response", () => {
    const parser = new ResponseParser();
    expect(parser.parseSuccess(null)).toBe(false);
  });

  test("should handle response without status", () => {
    const parser = new ResponseParser();
    expect(parser.parseSuccess({})).toBe(false);
  });
});
```

---

## 性能优化和最佳实践

### 1. 配置优化
```javascript
// 针对大型项目的配置
export default {
  // 并发控制
  concurrency: Math.min(4, require('os').cpus().length),
  maxConcurrentTestRunners: 2,

  // 超时控制
  timeoutMS: 30000,        // 降低超时时间
  timeoutFactor: 1.5,

  // 覆盖分析
  coverageAnalysis: 'perTest',  // 精确分析

  // 限制变异范围
  mutate: [
    'src/core/**/*.ts',      // 只变异核心代码
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],

  // 阈值设置
  thresholds: {
    high: 85,    // 渐进式目标
    low: 70,
    break: 65
  }
};
```

### 2. 快速反馈循环
```bash
# 增量测试 - 只测试变更的文件
bun run mutation:incremental

# 快速检查 - 降低阈值
stryker run --threshold.high 70 --threshold.low 60

# 调试模式 - 运行特定文件
stryker run --mutate src/core/http-client.ts

# 并行运行 - 使用多个进程
stryker run --concurrency 4
```

### 3. CI/CD 集成
```yaml
# GitHub Actions 示例
- name: Run Mutation Testing
  run: |
    if [ "$GITHUB_EVENT_NAME" = "pull_request" ]; then
      # PR 中只运行增量测试
      bun run mutation:incremental
    else
      # 主分支运行完整测试
      bun run mutation
    fi
```

---

## 监控和报告

### 1. HTML 报告分析
```bash
# 生成详细报告
bun run mutation:report

# 查看报告
open reports/mutation/html/index.html
```

### 2. 命令行报告解读
```
Mutation score: 78.3%
- Surviving mutants: 23
- Killed mutants: 82
- Timed out mutants: 2
- Error mutants: 1

关注重点：
1. High impact survivors (影响大的变异体)
2. Easy kills (容易杀死的变异体 - 可能是冗余测试)
3. Surviving mutants in critical paths (关键路径的存活变异体)
```

### 3. Dashboard 使用
```bash
# 启动 dashboard
stryker dashboard

# 查看历史趋势
# 对比不同分支的 mutation score
```

---

## 总结

### Mutation Testing 成功指标
- **70%+ mutation score** (基础要求)
- **90%+ coverage on critical paths** (关键路径)
- **No surviving mutants in error handling** (错误处理)
- **All edge cases covered** (边界情况)

### 持续改进策略
1. **定期审查**: 每周检查 mutation score 趋势
2. **渐进提升**: 逐步提高阈值要求
3. **重点优化**: 优先处理关键模块的 surviving mutants
4. **团队培训**: 分享 mutation testing 最佳实践

通过遵循这些指南，Document Scrape 项目可以保持高质量的测试标准，确保代码的健壮性和可靠性。