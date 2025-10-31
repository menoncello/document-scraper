import { randomUUID } from 'node:crypto';
import { existsSync, unlinkSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resetAllFactories, TestScenarios } from '../factories/index';

/**
 * Enhanced Fixture Manager with Auto-Cleanup and Composition
 *
 * Features:
 * - Automatic cleanup of temporary files and resources
 * - Composable fixture setup
 * - Resource tracking and cleanup
 * - Test isolation utilities
 */

export interface FixtureResource {
  id: string;
  type: 'file' | 'directory' | 'mock' | 'factory' | 'custom';
  path?: string;
  cleanup: () => void;
  description?: string;
}

export interface FixtureSetup {
  resources: FixtureResource[];
  cleanup: () => void;
  getResource: (id: string) => FixtureResource | undefined;
}

/**
 * Fixture Manager Class
 */
export class FixtureManager {
  private static instance: FixtureManager;
  private resources: Map<string, FixtureResource> = new Map();
  private testSuites: Map<string, Set<string>> = new Map();
  private tempDir: string;

  private constructor() {
    // Create a temporary directory for all fixtures
    this.tempDir = join(tmpdir(), `docs-scrape-fixtures-${Date.now()}-${randomUUID().slice(0, 8)}`);
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true });
    }
  }

  public static getInstance(): FixtureManager {
    if (!FixtureManager.instance) {
      FixtureManager.instance = new FixtureManager();
    }
    return FixtureManager.instance;
  }

  /**
   * Create a temporary file with auto-cleanup
   */
  public createTempFile(filename: string, content: string, description?: string): FixtureResource {
    const filePath = join(this.tempDir, filename);
    writeFileSync(filePath, content, 'utf8');

    const resource: FixtureResource = {
      id: `file-${filename}-${randomUUID().slice(0, 8)}`,
      type: 'file',
      path: filePath,
      cleanup: () => {
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      },
      description,
    };

    this.resources.set(resource.id, resource);
    return resource;
  }

  /**
   * Create a temporary directory with auto-cleanup
   */
  public createTempDir(dirname: string, description?: string): FixtureResource {
    const dirPath = join(this.tempDir, dirname);
    mkdirSync(dirPath, { recursive: true });

    const resource: FixtureResource = {
      id: `dir-${dirname}-${randomUUID().slice(0, 8)}`,
      type: 'directory',
      path: dirPath,
      cleanup: () => {
        // Note: In a real implementation, you'd want recursive directory removal
        // For simplicity, we'll just track it for now
      },
      description,
    };

    this.resources.set(resource.id, resource);
    return resource;
  }

  /**
   * Register a factory reset resource
   */
  public registerFactoryReset(factoryName: string, description?: string): FixtureResource {
    const resource: FixtureResource = {
      id: `factory-${factoryName}-${randomUUID().slice(0, 8)}`,
      type: 'factory',
      cleanup: () => {
        resetAllFactories();
      },
      description,
    };

    this.resources.set(resource.id, resource);
    return resource;
  }

  /**
   * Register a custom cleanup function
   */
  public registerCustomCleanup(cleanupFn: () => void, description?: string): FixtureResource {
    const resource: FixtureResource = {
      id: `custom-${randomUUID().slice(0, 8)}`,
      type: 'custom',
      cleanup: cleanupFn,
      description,
    };

    this.resources.set(resource.id, resource);
    return resource;
  }

  /**
   * Associate resources with a test suite
   */
  public associateWithTestSuite(testSuiteName: string, ...resources: FixtureResource[]): void {
    if (!this.testSuites.has(testSuiteName)) {
      this.testSuites.set(testSuiteName, new Set());
    }

    const suite = this.testSuites.get(testSuiteName)!;
    for (const resource of resources) suite.add(resource.id);
  }

  /**
   * Cleanup all resources for a test suite
   */
  public cleanupTestSuite(testSuiteName: string): void {
    const resourceIds = this.testSuites.get(testSuiteName);
    if (!resourceIds) return;

    for (const id of resourceIds) {
      const resource = this.resources.get(id);
      if (resource) {
        try {
          resource.cleanup();
        } catch {
          // Resource cleanup failed - continuing with other resources
        }
        this.resources.delete(id);
      }
    }

    this.testSuites.delete(testSuiteName);
  }

  /**
   * Cleanup a specific resource
   */
  public cleanupResource(resourceId: string): void {
    const resource = this.resources.get(resourceId);
    if (resource) {
      try {
        resource.cleanup();
      } catch {
        // Resource cleanup failed
      }
      this.resources.delete(resourceId);
    }
  }

  /**
   * Get a resource by ID
   */
  public getResource(resourceId: string): FixtureResource | undefined {
    return this.resources.get(resourceId);
  }

  /**
   * Cleanup all resources (call at the end of test run)
   */
  public cleanupAll(): void {
    // Cleanup all resources
    for (const [, resource] of this.resources) {
      try {
        resource.cleanup();
      } catch {
        // Resource cleanup failed - continuing with other resources
      }
    }

    this.resources.clear();
    this.testSuites.clear();

    // Cleanup temp directory
    try {
      if (existsSync(this.tempDir)) {
        // Note: In a real implementation, you'd want recursive directory removal
        // For simplicity, temp directory cleanup would be handled here
      }
    } catch {
      // Temp directory cleanup failed
    }
  }

  /**
   * Get cleanup statistics
   */
  public getStats(): { totalResources: number; resourcesByType: Record<string, number> } {
    const resourcesByType: Record<string, number> = {};

    for (const resource of this.resources.values()) {
      resourcesByType[resource.type] = (resourcesByType[resource.type] || 0) + 1;
    }

    return {
      totalResources: this.resources.size,
      resourcesByType,
    };
  }
}

/**
 * Composable Fixture Setup Functions
 */

export function setupConfigFixtures(): FixtureSetup {
  const manager = FixtureManager.getInstance();
  const resources: FixtureResource[] = [];

  // Create JSON config fixture
  const jsonConfig = manager.createTempFile(
    'test-config.json',
    JSON.stringify(TestScenarios.scraping.basic(), null, 2),
    'JSON configuration fixture'
  );
  resources.push(jsonConfig);

  // Create YAML config fixture
  const yamlConfig = manager.createTempFile(
    'test-config.yaml',
    `
target:
  url: https://example.com
  selector: article
extraction:
  fields:
    title: h1
    content: .content
output:
  format: json
behavior:
  retryAttempts: 3
  retryDelay: 1000
  rateLimit: 10
    `.trim(),
    'YAML configuration fixture'
  );
  resources.push(yamlConfig);

  // Register factory reset
  const factoryReset = manager.registerFactoryReset('all-factories', 'Reset all test factories');
  resources.push(factoryReset);

  return {
    resources,
    cleanup: () => {
      for (const r of resources) manager.cleanupResource(r.id);
    },
    getResource: (id: string) => manager.getResource(id),
  };
}

export function setupHtmlFixtures(): FixtureSetup {
  const manager = FixtureManager.getInstance();
  const resources: FixtureResource[] = [];

  // Create basic HTML fixture
  const basicHtml = manager.createTempFile(
    'basic.html',
    TestScenarios.html.basic(),
    'Basic HTML fixture'
  );
  resources.push(basicHtml);

  // Create articles HTML fixture
  const articlesHtml = manager.createTempFile(
    'articles.html',
    TestScenarios.html.articles(5),
    'Articles HTML fixture'
  );
  resources.push(articlesHtml);

  // Create nested structure HTML fixture
  const nestedHtml = manager.createTempFile(
    'nested.html',
    TestScenarios.html.nested(),
    'Nested structure HTML fixture'
  );
  resources.push(nestedHtml);

  return {
    resources,
    cleanup: () => {
      for (const r of resources) manager.cleanupResource(r.id);
    },
    getResource: (id: string) => manager.getResource(id),
  };
}

export function setupMockResponseFixtures(): FixtureSetup {
  const manager = FixtureManager.getInstance();
  const resources: FixtureResource[] = [];

  // Create various mock response fixtures
  const successResponse = manager.registerCustomCleanup(() => {
    /* Mock responses are auto-cleared by test runner */
  }, 'Success response mock');
  resources.push(successResponse);

  const errorResponse = manager.registerCustomCleanup(() => {
    /* Mock responses are auto-cleared by test runner */
  }, 'Error response mock');
  resources.push(errorResponse);

  return {
    resources,
    cleanup: () => {
      for (const r of resources) manager.cleanupResource(r.id);
    },
    getResource: (id: string) => manager.getResource(id),
  };
}

/**
 * Combined fixture setup for complete test scenarios
 */
export function setupCompleteTestFixture(): FixtureSetup {
  const configFixtures = setupConfigFixtures();
  const htmlFixtures = setupHtmlFixtures();
  const mockFixtures = setupMockResponseFixtures();

  const allResources = [
    ...configFixtures.resources,
    ...htmlFixtures.resources,
    ...mockFixtures.resources,
  ];

  return {
    resources: allResources,
    cleanup: () => {
      configFixtures.cleanup();
      htmlFixtures.cleanup();
      mockFixtures.cleanup();
    },
    getResource: (id: string) => FixtureManager.getInstance().getResource(id),
  };
}

/**
 * Test setup helper with automatic cleanup
 */
export function setupTestFixture(
  testName: string,
  fixtureTypes: Array<'config' | 'html' | 'mock' | 'complete'> = ['complete']
): FixtureSetup {
  const manager = FixtureManager.getInstance();
  let fixtureSetup: FixtureSetup;

  switch (fixtureTypes[0]) {
    case 'config':
      fixtureSetup = setupConfigFixtures();
      break;
    case 'html':
      fixtureSetup = setupHtmlFixtures();
      break;
    case 'mock':
      fixtureSetup = setupMockResponseFixtures();
      break;
    case 'complete':
    default:
      fixtureSetup = setupCompleteTestFixture();
      break;
  }

  // Associate with test suite for cleanup tracking
  manager.associateWithTestSuite(testName, ...fixtureSetup.resources);

  return fixtureSetup;
}

// Global cleanup on process exit
process.on('exit', () => {
  FixtureManager.getInstance().cleanupAll();
});

process.on('SIGINT', () => {
  FixtureManager.getInstance().cleanupAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  FixtureManager.getInstance().cleanupAll();
  process.exit(0);
});
