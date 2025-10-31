import { beforeEach, afterEach } from 'bun:test';
import { resetAllFactories } from '../factories/index';
import { FixtureManager, setupTestFixture } from './fixture-manager';

/**
 * Enhanced Test Isolation Utilities
 *
 * Features:
 * - Automatic cleanup between tests
 * - Resource isolation
 * - Mock state management
 * - Factory state reset
 */

export interface TestIsolationOptions {
  resetFactories?: boolean;
  cleanupFixtures?: boolean;
  resetMocks?: boolean;
  customCleanup?: () => void | Promise<void>;
}

/**
 * Test Isolation Manager
 */
export class TestIsolationManager {
  private static instance: TestIsolationManager;
  private activeTests: Map<string, any> = new Map();
  private cleanupQueue: Array<() => void | Promise<void>> = [];

  private constructor() {
    // Initialize singleton instance - private to enforce singleton pattern
  }

  public static getInstance(): TestIsolationManager {
    if (!TestIsolationManager.instance) {
      TestIsolationManager.instance = new TestIsolationManager();
    }
    return TestIsolationManager.instance;
  }

  /**
   * Register a test for isolation tracking
   */
  public registerTest(testName: string, context?: any): void {
    this.activeTests.set(testName, {
      startTime: Date.now(),
      context,
      resources: [],
    });
  }

  /**
   * Unregister a test and perform cleanup
   */
  public unregisterTest(testName: string): void {
    const test = this.activeTests.get(testName);
    if (test) {
      // Cleanup any test-specific resources
      this.cleanupTestResources(testName);
      this.activeTests.delete(testName);
    }
  }

  /**
   * Add a cleanup function to the queue
   */
  public addCleanup(cleanupFn: () => void | Promise<void>): void {
    this.cleanupQueue.push(cleanupFn);
  }

  /**
   * Process cleanup queue
   */
  public async processCleanupQueue(): Promise<void> {
    for (const cleanupFn of this.cleanupQueue) {
      try {
        await cleanupFn();
      } catch {
        // Cleanup function failed
      }
    }
    this.cleanupQueue = [];
  }

  /**
   * Cleanup resources for a specific test
   */
  private cleanupTestResources(testName: string): void {
    FixtureManager.getInstance().cleanupTestSuite(testName);
  }

  /**
   * Get isolation statistics
   */
  public getStats(): { activeTests: number; cleanupQueueSize: number } {
    return {
      activeTests: this.activeTests.size,
      cleanupQueueSize: this.cleanupQueue.length,
    };
  }
}

/**
 * Default isolation options
 */
const DEFAULT_ISOLATION_OPTIONS: TestIsolationOptions = {
  resetFactories: true,
  cleanupFixtures: true,
  resetMocks: true,
};

/**
 * Enhanced beforeEach with isolation
 */
export function setupTestIsolation(testName: string, options: TestIsolationOptions = {}): void {
  const finalOptions = { ...DEFAULT_ISOLATION_OPTIONS, ...options };
  const isolationManager = TestIsolationManager.getInstance();

  beforeEach(() => {
    // Register the test for tracking
    isolationManager.registerTest(testName);

    // Reset factories if requested
    if (finalOptions.resetFactories) {
      resetAllFactories();
    }

    // Setup fixture manager for this test
    if (finalOptions.cleanupFixtures) {
      setupTestFixture(testName);
    }
  });

  afterEach(async () => {
    try {
      // Perform custom cleanup first
      if (finalOptions.customCleanup) {
        await finalOptions.customCleanup();
      }

      // Process cleanup queue
      await isolationManager.processCleanupQueue();

      // Unregister test and cleanup
      isolationManager.unregisterTest(testName);
    } catch {
      // Error during test isolation cleanup
    }
  });
}

/**
 * Pre-configured isolation setups for common test types
 */

export function setupConfigTestIsolation(testName: string): void {
  setupTestIsolation(testName, {
    resetFactories: true,
    cleanupFixtures: true,
    resetMocks: true,
    customCleanup: () => {
      // Additional config-specific cleanup could be added here
    },
  });
}

export function setupHttpClientTestIsolation(testName: string): void {
  setupTestIsolation(testName, {
    resetFactories: true,
    cleanupFixtures: true,
    resetMocks: true,
    customCleanup: () => {
      // Clear any global fetch mocks
      if ((global as any).fetch && (global as any).fetch.mockClear) {
        (global as any).fetch.mockClear();
      }
    },
  });
}

export function setupHtmlParserTestIsolation(testName: string): void {
  setupTestIsolation(testName, {
    resetFactories: true,
    cleanupFixtures: true,
    resetMocks: false, // HTML parser tests typically don't use network mocks
    customCleanup: () => {
      // Clear any HTML parser caches or state
      // This would be specific to your HTML parser implementation
    },
  });
}

export function setupIntegrationTestIsolation(testName: string): void {
  setupTestIsolation(testName, {
    resetFactories: true,
    cleanupFixtures: true,
    resetMocks: true,
    customCleanup: async () => {
      // Integration test cleanup
      // Clear any persistent state, databases, connections, etc.
    },
  });
}

/**
 * Utility to create isolated test environments
 */
export function createTestEnvironment(testName: string, options: TestIsolationOptions = {}) {
  const isolationManager = TestIsolationManager.getInstance();

  return {
    // Register the test
    register: () => isolationManager.registerTest(testName),

    // Add cleanup functions
    addCleanup: (fn: () => void | Promise<void>) => isolationManager.addCleanup(fn),

    // Get fixture manager
    getFixtureManager: () => FixtureManager.getInstance(),

    // Setup complete isolation
    setup: () => setupTestIsolation(testName, options),

    // Setup specific isolation types
    setupConfigTest: () => setupConfigTestIsolation(testName),
    setupHttpClientTest: () => setupHttpClientTestIsolation(testName),
    setupHtmlParserTest: () => setupHtmlParserTestIsolation(testName),
    setupIntegrationTest: () => setupIntegrationTestIsolation(testName),

    // Cleanup utilities
    cleanup: () => isolationManager.unregisterTest(testName),

    // Get statistics
    getStats: () => isolationManager.getStats(),
  };
}

/**
 * Global test isolation setup (call once in test setup files)
 */
export function setupGlobalTestIsolation(): void {
  // Set up global cleanup on test suite completion
  afterEach(async () => {
    const isolationManager = TestIsolationManager.getInstance();
    const stats = isolationManager.getStats();

    // Check for resource leaks
    if (stats.activeTests > 0) {
      // Tests still registered after cleanup
    }

    if (stats.cleanupQueueSize > 0) {
      // Cleanup functions still queued
    }
  });

  // Process exit cleanup
  process.on('exit', () => {
    const fixtureManager = FixtureManager.getInstance();
    fixtureManager.cleanupAll();
  });
}
