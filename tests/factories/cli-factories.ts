import { faker } from '@faker-js/faker';

// CLI Configuration Factory
export interface CLIConfig {
  scrapeUrl?: string;
  output: {
    format: 'json' | 'csv' | 'database';
    file?: string;
    connection?: DatabaseConnection;
  };
  selectors?: Record<string, string>;
  options?: {
    timeout?: number;
    retries?: number;
    userAgent?: string;
  };
}

export interface DatabaseConnection {
  type: 'sqlite' | 'postgresql' | 'mysql';
  database: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  table?: string;
}

export interface ScrapedData {
  title?: string;
  content?: string;
  url?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export const createCLIConfig = (overrides: Partial<CLIConfig> = {}): CLIConfig => ({
  scrapeUrl: faker.internet.url(),
  output: {
    format: 'json',
    file: `${faker.system.fileName({ extensionCount: 0 })}.json`,
    ...overrides.output,
  },
  selectors: {
    title: 'h1',
    content: '.content',
    description: 'meta[name="description"]',
    ...overrides.selectors,
  },
  options: {
    timeout: faker.number.int({ min: 5000, max: 30000 }),
    retries: faker.number.int({ min: 1, max: 5 }),
    userAgent: 'docs-scrape/1.0.0',
    ...overrides.options,
  },
  ...overrides,
});

export const createCSVConfig = (overrides: Partial<CLIConfig> = {}): CLIConfig =>
  createCLIConfig({
    output: {
      format: 'csv',
      file: `${faker.system.fileName({ extensionCount: 0 })}.csv`,
    },
    ...overrides,
  });

export const createDatabaseConfig = (overrides: Partial<CLIConfig> = {}): CLIConfig =>
  createCLIConfig({
    output: {
      format: 'database',
      connection: {
        type: 'sqlite',
        database: `${faker.system.fileName({ extensionCount: 0 })}.db`,
        table: 'scraped_content',
      },
    },
    ...overrides,
  });

export const createPostgresConfig = (overrides: Partial<CLIConfig> = {}): CLIConfig =>
  createDatabaseConfig({
    output: {
      format: 'database',
      connection: {
        type: 'postgresql',
        host: faker.internet.ip(),
        port: 5432,
        database: faker.database.type(),
        username: faker.internet.username(),
        password: faker.internet.password(),
        table: 'scraped_content',
      },
    },
    ...overrides,
  });

export const createScrapedData = (overrides: Partial<ScrapedData> = {}): ScrapedData => ({
  title: faker.lorem.sentence(),
  content: faker.lorem.paragraphs(2),
  url: faker.internet.url(),
  timestamp: faker.date.recent().toISOString(),
  metadata: {
    wordCount: faker.number.int({ min: 10, max: 1000 }),
    images: faker.number.int({ min: 0, max: 10 }),
    links: faker.number.int({ min: 0, max: 20 }),
  },
  ...overrides,
});

export const createMultipleScrapedData = (
  count: number,
  overrides: Partial<ScrapedData> = {}
): ScrapedData[] => Array.from({ length: count }, () => createScrapedData(overrides));

// CLI Command Factory
export interface CLICommand {
  command: string;
  args: string[];
  options: Record<string, string>;
  expectedExitCode: number;
  expectedOutput?: string;
  expectedError?: string;
}

export const createCLICommand = (overrides: Partial<CLICommand> = {}): CLICommand => ({
  command: 'scrape',
  args: [faker.internet.url()],
  options: {
    format: 'json',
    output: `${faker.system.fileName({ extensionCount: 0 })}.json`,
  },
  expectedExitCode: 0,
  ...overrides,
});

export const createInvalidCLICommand = (overrides: Partial<CLICommand> = {}): CLICommand => ({
  command: 'scrape',
  args: ['invalid-url'],
  options: {},
  expectedExitCode: 1,
  expectedError: 'Invalid URL format',
  ...overrides,
});

// Test Scenarios for CLI
export const TestScenarios = {
  cli: {
    basicScrape: () => createCLICommand(),
    csvExport: () =>
      createCLICommand({
        options: { format: 'csv' },
      }),
    databaseExport: () =>
      createCLICommand({
        options: {
          format: 'database',
          connection: 'sqlite:test.db',
        },
      }),
    withConfig: () =>
      createCLICommand({
        options: {
          config: 'test-config.yaml',
        },
      }),
    invalidUrl: () => createInvalidCLICommand(),
    missingArgs: () =>
      createCLICommand({
        args: [],
        expectedExitCode: 1,
        expectedError: 'URL parameter is required',
      }),
    timeoutError: () =>
      createCLICommand({
        options: {
          timeout: '100', // Very short timeout
        },
        args: [faker.internet.url()],
        expectedExitCode: 1,
        expectedError: 'Request timeout',
      }),
  },
  config: {
    basic: () => createCLIConfig(),
    csvOutput: () => createCSVConfig(),
    databaseOutput: () => createDatabaseConfig(),
    postgresOutput: () => createPostgresConfig(),
    invalidUrl: () =>
      createCLIConfig({
        scrapeUrl: 'not-a-valid-url',
      }),
    invalidFormat: () =>
      createCLIConfig({
        output: {
          format: 'invalid' as any,
          file: 'output.txt',
        },
      }),
    missingUrl: () => {
      const config = createCLIConfig();
      const configWithoutUrl = { ...config };
      delete configWithoutUrl.scrapeUrl;
      return configWithoutUrl as CLIConfig;
    },
  },
  data: {
    singleRecord: () => createScrapedData(),
    multipleRecords: (count = 5) => createMultipleScrapedData(count),
    complexData: () =>
      createScrapedData({
        metadata: {
          author: faker.person.fullName(),
          publishDate: faker.date.past().toISOString(),
          tags: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
            faker.lorem.word()
          ),
          categories: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () =>
            faker.commerce.department()
          ),
        },
      }),
  },
};
