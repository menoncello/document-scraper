/**
 * Base test fixture with common setup, cleanup, and utilities
 * Provides isolated test environment with automatic resource cleanup
 */

import { test as base, expect } from 'bun:test';
import type { HttpClient } from '../../src/core/http-client';
import type { ScrapingConfig } from '../../src/types';

// Types for fixture context
interface TestResources {
  httpClient?: HttpClient;
  mockResponses: Map<string, any>;
  createdFiles: string[];
  createdConfigs: ScrapingConfig[];
  cleanupTasks: Array<() => Promise<void> | void>;
}

// Export base test from bun:test
// Note: Bun Test doesn't support extend() like Vitest
// Use helper functions and utilities below instead
export const test = base;

// Helper function to create test resources for each test
export function createTestResources(): TestResources {
  return {
    httpClient: undefined,
    mockResponses: new Map<string, any>(),
    createdFiles: [],
    createdConfigs: [],
    cleanupTasks: [],
  };
}

// Helper functions for resource tracking
export const ResourceTracker = {
  // Track HTTP client for cleanup
  trackHttpClient: (
    resources: TestResources,
    client: HttpClient
  ): HttpClient => {
    resources.httpClient = client;
    return client;
  },

  // Track mock response
  trackMockResponse: (
    resources: TestResources,
    key: string,
    response: any
  ): void => {
    resources.mockResponses.set(key, response);
  },

  // Track created file
  trackFile: (resources: TestResources, filePath: string): string => {
    resources.createdFiles.push(filePath);
    return filePath;
  },

  // Track created config
  trackConfig: (resources: TestResources, config: ScrapingConfig): ScrapingConfig => {
    resources.createdConfigs.push(config);
    return config;
  },

  // Add cleanup task
  addCleanupTask: (
    resources: TestResources,
    task: () => Promise<void> | void
  ): void => {
    resources.cleanupTasks.push(task);
  },

  // Execute all cleanup tasks
  executeCleanup: async (resources: TestResources): Promise<void> => {
    for (const task of [...resources.cleanupTasks].reverse()) {
      try {
        await task();
      } catch {
        // Cleanup task failed - continue silently
      }
    }
    resources.mockResponses.clear();
    resources.createdFiles.length = 0;
    resources.createdConfigs.length = 0;
    resources.cleanupTasks.length = 0;
  },

  // Cleanup created files
  cleanupFiles: async (resources: TestResources): Promise<void> => {
    for (const file of resources.createdFiles) {
      try {
        const { unlinkSync, existsSync } = await import('node:fs');
        if (existsSync(file)) {
          unlinkSync(file);
        }
      } catch {
        // File cleanup failed - continue silently
      }
    }
  },
};

// Common test utilities
export const TestUtils = {
  // Create deterministic wait using Promise.race with timeout
  waitForCondition: async <T>(
    condition: () => Promise<T> | T,
    timeoutMs = 5000,
    checkIntervalMs = 100
  ): Promise<T> => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        return await condition();
      } catch {
        // Condition not yet met, continue waiting
      }

      if (Date.now() - startTime < timeoutMs) {
        await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
      }
    }

    throw new Error(`Condition not met within ${timeoutMs}ms`);
  },

  // Create mock that tracks calls for verification
  createTrackedMock: <T extends (...args: any[]) => any>(
    implementation: T,
    resources: TestResources,
    mockKey: string
  ): T => {
    const trackedMock = implementation;
    ResourceTracker.trackMockResponse(resources, mockKey, trackedMock);
    return trackedMock;
  },

  // Verify timing without hard waits
  assertTimingReasonable: (
    startTime: number,
    endTime: number,
    minMs: number,
    maxMs: number
  ): void => {
    const elapsed = endTime - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(minMs);
    expect(elapsed).toBeLessThan(maxMs);
  },
};

// Re-export expect for convenience
export { expect };

/**
 * Usage example:
 *
 * import { test, expect, ResourceTracker, TestUtils, createTestResources } from '../fixtures/test-base-fixture';
 *
 * test('some test', async () => {
 *   // Create test resources
 *   const resources = createTestResources();
 *
 *   try {
 *     // Track resources
 *     const tempFile = ResourceTracker.trackFile(resources, '/tmp/test-file');
 *
 *     // Add custom cleanup
 *     ResourceTracker.addCleanupTask(resources, async () => {
 *       // Custom cleanup logic
 *     });
 *
 *     // Run test logic
 *     // ...
 *
 *   } finally {
 *     // Always cleanup
 *     await ResourceTracker.executeCleanup(resources);
 *   }
 * });
 */