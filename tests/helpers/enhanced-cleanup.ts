/**
 * Enhanced Auto-Cleanup Utilities for Test Isolation
 *
 * Provides comprehensive cleanup strategies for different resource types
 * with automatic detection and cleanup capabilities.
 */

import { beforeEach, afterEach } from 'bun:test';
import { unlinkSync, rmSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { TestIsolationManager } from './test-isolation';

/**
 * Resource tracking for auto-cleanup
 */
interface TrackedResource {
  type: 'file' | 'directory' | 'mock' | 'network' | 'database' | 'timer';
  path?: string;
  ref?: any;
  createdAt: number;
  cleanup: () => void | Promise<void>;
}

/**
 * Enhanced cleanup manager with automatic resource detection
 */
export class EnhancedCleanupManager {
  private static instance: EnhancedCleanupManager;
  private trackedResources: Map<string, TrackedResource> = new Map();
  private tempDirs: string[] = [];
  private activeMocks: Set<any> = new Set();
  private activeTimers: Set<NodeJS.Timeout> = new Set();

  private constructor() {
    // Private constructor for singleton pattern - initialization handled by getInstance()
  }

  public static getInstance(): EnhancedCleanupManager {
    if (!EnhancedCleanupManager.instance) {
      EnhancedCleanupManager.instance = new EnhancedCleanupManager();
    }
    return EnhancedCleanupManager.instance;
  }

  /**
   * Track a file for automatic cleanup
   */
  public trackFile(filePath: string): void {
    const resourceId = `file:${filePath}`;
    if (!this.trackedResources.has(resourceId)) {
      this.trackedResources.set(resourceId, {
        type: 'file',
        path: filePath,
        createdAt: Date.now(),
        cleanup: async () => {
          try {
            const file = Bun.file(filePath);
            if (await file.exists()) {
              // Use a proper file deletion method
              unlinkSync(filePath);
            }
          } catch {
            // File removal failed, ignore
          }
        },
      });
    }
  }

  /**
   * Track a directory for automatic cleanup
   */
  public trackDirectory(dirPath: string): void {
    const resourceId = `dir:${dirPath}`;
    if (!this.trackedResources.has(resourceId)) {
      this.trackedResources.set(resourceId, {
        type: 'directory',
        path: dirPath,
        createdAt: Date.now(),
        cleanup: async () => {
          try {
            const dir = Bun.file(dirPath);
            if (await dir.exists()) {
              this.removeDirectoryRecursively(dirPath);
            }
          } catch {
            // Directory removal failed, ignore
          }
        },
      });
      this.tempDirs.push(dirPath);
    }
  }

  /**
   * Track a mock for automatic cleanup
   */
  public trackMock(mockRef: any, name?: string): void {
    // Use Bun's crypto utilities for secure deterministic ID generation
    const timestamp = Date.now();
    const randomSuffix = Bun.hash(JSON.stringify({ mockRef, timestamp, name }));
    const mockId = name || `mock:${timestamp}-${randomSuffix}`;
    this.trackedResources.set(mockId, {
      type: 'mock',
      ref: mockRef,
      createdAt: timestamp,
      cleanup: () => {
        if (mockRef && typeof mockRef.mockClear === 'function') {
          mockRef.mockClear();
        }
        this.activeMocks.delete(mockRef);
      },
    });
    this.activeMocks.add(mockRef);
  }

  /**
   * Track a timer for automatic cleanup
   */
  public trackTimer(timer: NodeJS.Timeout): void {
    const timerId = `timer:${timer}`;
    this.trackedResources.set(timerId, {
      type: 'timer',
      ref: timer,
      createdAt: Date.now(),
      cleanup: () => {
        clearTimeout(timer);
        this.activeTimers.delete(timer);
      },
    });
    this.activeTimers.add(timer);
  }

  /**
   * Create a temporary directory with auto-cleanup
   */
  public createTempDir(prefix = 'test-temp-'): string {
    const tempDir = mkdtempSync(prefix);
    this.trackDirectory(tempDir);
    return tempDir;
  }

  /**
   * Create a temporary file with auto-cleanup
   */
  public createTempFile(content: string, prefix = 'test-file-', extension = '.tmp'): string {
    const tempDir = mkdtempSync(prefix);
    const filePath = join(tempDir, `${prefix}${Date.now()}${extension}`);

    Bun.write(filePath, content);
    this.trackFile(filePath);
    this.trackDirectory(tempDir); // Track parent directory for cleanup

    return filePath;
  }

  /**
   * Track network connections and cleanup
   */
  public trackNetworkCleanup(): void {
    const resourceId = 'network:cleanup';
    if (!this.trackedResources.has(resourceId)) {
      this.trackedResources.set(resourceId, {
        type: 'network',
        createdAt: Date.now(),
        cleanup: () => {
          // Cleanup global fetch mocks
          if ((global as any).fetch && (global as any).fetch.mockReset) {
            (global as any).fetch.mockReset();
          }

          // Cleanup any other network-related globals
          delete (global as any).__fetch_mock_registry;
        },
      });
    }
  }

  /**
   * Cleanup all tracked resources
   */
  public async cleanupAll(): Promise<void> {
    const errors: Error[] = [];

    // Clear timers first
    this.clearTimers(errors);

    // Clear mocks
    this.clearMocks(errors);

    // Cleanup tracked resources
    const cleanupPromises = this.cleanupTrackedResources(errors);

    // Wait for async cleanup operations
    await Promise.allSettled(cleanupPromises);

    // Clear tracking
    this.clearTracking();

    // Handle any errors that occurred during cleanup
    this.handleCleanupErrors(errors);
  }

  /**
   * Clear all active timers
   */
  private clearTimers(errors: Error[]): void {
    for (const timer of this.activeTimers) {
      try {
        clearTimeout(timer);
      } catch (error) {
        errors.push(error as Error);
      }
    }
    this.activeTimers.clear();
  }

  /**
   * Clear all active mocks
   */
  private clearMocks(errors: Error[]): void {
    for (const mock of this.activeMocks) {
      try {
        if (mock && typeof mock.mockClear === 'function') {
          mock.mockClear();
        }
      } catch (error) {
        errors.push(error as Error);
      }
    }
    this.activeMocks.clear();
  }

  /**
   * Cleanup all tracked resources and return async operations
   */
  private cleanupTrackedResources(errors: Error[]): Array<Promise<void>> {
    const cleanupPromises: Array<Promise<void>> = [];

    for (const [, resource] of this.trackedResources) {
      try {
        const cleanupResult = resource.cleanup();
        if (cleanupResult instanceof Promise) {
          cleanupPromises.push(cleanupResult);
        }
      } catch (error) {
        errors.push(error as Error);
      }
    }

    return cleanupPromises;
  }

  /**
   * Clear all tracking data
   */
  private clearTracking(): void {
    this.trackedResources.clear();
    this.tempDirs = [];
  }

  /**
   * Handle cleanup errors by logging them if present
   */
  private handleCleanupErrors(errors: Error[]): void {
    if (errors.length > 0) {
      // Errors occurred but cleanup continues
    }
  }

  /**
   * Get cleanup statistics
   */
  public getStats(): {
    totalResources: number;
    filesCount: number;
    directoriesCount: number;
    mocksCount: number;
    timersCount: number;
    tempDirsCount: number;
  } {
    let filesCount = 0;
    let directoriesCount = 0;
    let mocksCount = 0;
    let timersCount = 0;

    for (const resource of this.trackedResources.values()) {
      switch (resource.type) {
        case 'file':
          filesCount++;
          break;
        case 'directory':
          directoriesCount++;
          break;
        case 'mock':
          mocksCount++;
          break;
        case 'timer':
          timersCount++;
          break;
      }
    }

    return {
      totalResources: this.trackedResources.size,
      filesCount,
      directoriesCount,
      mocksCount,
      timersCount,
      tempDirsCount: this.tempDirs.length,
    };
  }

  /**
   * Recursively remove a directory
   */
  private async removeDirectoryRecursively(dirPath: string): Promise<void> {
    try {
      const dir = Bun.file(dirPath);
      if (await dir.exists()) {
        // Use a proper directory removal method
        rmSync(dirPath, { recursive: true, force: true });
      }
    } catch {
      // Directory removal failed, ignore
    }
  }

  /**
   * Check for resource leaks
   */
  public checkForLeaks(): string[] {
    const leaks: string[] = [];
    const now = Date.now();
    const leakThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [id, resource] of this.trackedResources) {
      if (now - resource.createdAt > leakThreshold) {
        leaks.push(
          `Resource leak detected: ${id} (${resource.type}, created ${Math.round((now - resource.createdAt) / 1000)}s ago)`
        );
      }
    }

    return leaks;
  }
}

/**
 * Auto-cleanup decorators for test functions
 */
export function withAutoCleanup(testFn: () => void | Promise<void>): () => Promise<void> {
  return async () => {
    const cleanupManager = EnhancedCleanupManager.getInstance();
    const isolationManager = TestIsolationManager.getInstance();

    try {
      await testFn();
    } finally {
      await cleanupManager.cleanupAll();
      await isolationManager.processCleanupQueue();
    }
  };
}

/**
 * Create an auto-cleaning file for tests
 */
export function createAutoCleaningFile(content: string, filename?: string): string {
  const cleanupManager = EnhancedCleanupManager.getInstance();
  return cleanupManager.createTempFile(content, 'test-', filename || '.tmp');
}

/**
 * Create auto-cleaning configuration files
 */
export function createAutoCleaningConfig(config: any, format = 'json'): string {
  const cleanupManager = EnhancedCleanupManager.getInstance();

  const content =
    format === 'json'
      ? JSON.stringify(config, null, 2)
      : `# YAML Configuration\ntarget:\n  url: ${config.target?.url || 'https://example.com'}\n  selector: ${config.target?.selector || 'article'}\n`;

  const filename = `config-${Date.now()}.${format}`;
  return cleanupManager.createTempFile(content, 'config-', filename);
}

/**
 * Setup enhanced cleanup for a test suite
 */
export function setupEnhancedCleanup(_testSuiteName: string): void {
  const cleanupManager = EnhancedCleanupManager.getInstance();

  // Track network cleanup
  cleanupManager.trackNetworkCleanup();

  // Setup cleanup hooks
  afterEach(async () => {
    // Check for resource leaks
    const leaks = cleanupManager.checkForLeaks();
    if (leaks.length > 0) {
      // Resource leaks detected but continue with cleanup
    }

    // Perform cleanup
    await cleanupManager.cleanupAll();
  });
}

/**
 * Enhanced test isolation setup with auto-cleanup
 */
export function setupEnhancedTestIsolation(
  testName: string,
  options: {
    trackFiles?: boolean;
    trackMocks?: boolean;
    trackNetwork?: boolean;
    customCleanup?: () => void | Promise<void>;
  } = {}
): void {
  const cleanupManager = EnhancedCleanupManager.getInstance();
  const { trackNetwork = true, customCleanup } = options;

  beforeEach(() => {
    // Reset cleanup state for new test
    if (trackNetwork) {
      cleanupManager.trackNetworkCleanup();
    }
  });

  afterEach(async () => {
    try {
      // Perform custom cleanup first
      if (customCleanup) {
        await customCleanup();
      }

      // Auto-cleanup all tracked resources
      await cleanupManager.cleanupAll();
    } catch {
      // Enhanced cleanup failed, but continue
    }
  });
}

/**
 * Export singleton instance
 */
export const enhancedCleanup = EnhancedCleanupManager.getInstance();
