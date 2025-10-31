/**
 * Test suite for enhanced cleanup functionality
 */

import { test, expect, describe } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import {
  EnhancedCleanupManager,
  setupEnhancedCleanup,
  setupEnhancedTestIsolation,
  createAutoCleaningFile,
  createAutoCleaningConfig,
  enhancedCleanup,
} from '../../helpers/enhanced-cleanup';

describe('EnhancedCleanupManager', () => {
  test('should create singleton instance', () => {
    const instance1 = EnhancedCleanupManager.getInstance();
    const instance2 = EnhancedCleanupManager.getInstance();

    expect(instance1).toBe(instance2);
  });

  test('should track and cleanup files', () => {
    const manager = EnhancedCleanupManager.getInstance();
    const testContent = 'test content';
    const filePath = manager.createTempFile(testContent);

    expect(filePath).toBeDefined();
    expect(filePath).toContain('test-file-');

    // Check that file exists
    expect(existsSync(filePath)).toBe(true);

    // Track the file for cleanup
    manager.trackFile(filePath);

    // Verify stats
    const stats = manager.getStats();
    expect(stats.filesCount).toBeGreaterThan(0);
  });
});

describe('EnhancedCleanupManager directory operations', () => {
  test('should track and cleanup directories', () => {
    const manager = EnhancedCleanupManager.getInstance();
    const tempDir = manager.createTempDir('test-dir-');

    expect(tempDir).toBeDefined();
    expect(tempDir).toContain('test-dir-');

    // Check that directory exists
    expect(existsSync(tempDir)).toBe(true);

    // Verify stats
    const stats = manager.getStats();
    expect(stats.directoriesCount).toBeGreaterThan(0);
  });
});

describe('EnhancedCleanupManager auto-cleaning files', () => {
  test('should create auto-cleaning files', () => {
    const testContent = 'auto-cleaning test content';
    const filePath = createAutoCleaningFile(testContent, 'test.txt');

    expect(filePath).toBeDefined();
    expect(filePath).toContain('test.txt');

    // Check that file exists
    expect(existsSync(filePath)).toBe(true);
    expect(readFileSync(filePath, 'utf8')).toBe(testContent);
  });

  test('should create auto-cleaning configs', () => {
    const config = { target: { url: 'https://example.com', selector: 'article' } };
    const configPath = createAutoCleaningConfig(config, 'json');

    expect(configPath).toBeDefined();
    expect(configPath).toContain('config-');
    expect(configPath).toContain('.json');

    // Check that file exists and contains correct content
    expect(existsSync(configPath)).toBe(true);
    const content = readFileSync(configPath, 'utf8');
    expect(JSON.parse(content)).toEqual(config);
  });
});

describe('EnhancedCleanupManager resource management', () => {
  test('should check for resource leaks', () => {
    const manager = EnhancedCleanupManager.getInstance();
    const leaks = manager.checkForLeaks();

    expect(Array.isArray(leaks)).toBe(true);
    // No leaks should be detected for fresh resources
    expect(leaks.length).toBe(0);
  });

  test('should cleanup all resources', async () => {
    const manager = EnhancedCleanupManager.getInstance();

    // Create some resources
    const tempFile = manager.createTempFile('test');
    const tempDir = manager.createTempDir('test-dir-');

    // Verify resources exist
    expect(existsSync(tempFile)).toBe(true);
    expect(existsSync(tempDir)).toBe(true);

    // Verify stats show resources
    let stats = manager.getStats();
    expect(stats.totalResources).toBeGreaterThan(0);

    // Cleanup all resources
    await manager.cleanupAll();

    // Verify stats are reset
    stats = manager.getStats();
    expect(stats.totalResources).toBe(0);
    expect(stats.filesCount).toBe(0);
    expect(stats.directoriesCount).toBe(0);
    expect(stats.tempDirsCount).toBe(0);
  });
});

describe('Enhanced cleanup setup functions', () => {
  // Note: We can't test setupEnhancedCleanup and setupEnhancedTestIsolation
  // directly here because they call beforeEach/afterEach which must be
  // called at the top level of describe, not inside test cases

  test('enhanced cleanup singleton should be available', () => {
    expect(enhancedCleanup).toBeDefined();
    expect(typeof enhancedCleanup.cleanupAll).toBe('function');
    expect(typeof enhancedCleanup.getStats).toBe('function');
  });

  test('should be able to call setupEnhancedCleanup at describe level', () => {
    // This test verifies the function exists and is callable
    // We don't actually call it here since it would affect test execution
    expect(typeof setupEnhancedCleanup).toBe('function');
  });

  test('should be able to call setupEnhancedTestIsolation at describe level', () => {
    // This test verifies the function exists and is callable
    // We don't actually call it here since it would affect test execution
    expect(typeof setupEnhancedTestIsolation).toBe('function');
  });
});
