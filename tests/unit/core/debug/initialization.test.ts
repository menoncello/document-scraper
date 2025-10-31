import { test, expect, describe } from 'bun:test';
import { DebugUtils } from '../../../../src/core/debug';

describe('DebugUtils - Initialization', () => {
  test('should create DebugUtils instance with default output directory', () => {
    const defaultDebugUtils = new DebugUtils();
    expect(defaultDebugUtils).toBeInstanceOf(DebugUtils);
    expect(defaultDebugUtils.getOutputDirectory()).toBe('debug');
  });

  test('should create DebugUtils instance with custom output directory', () => {
    const outputDir = 'test-debug-utils-output';
    const debugUtils = new DebugUtils(outputDir);
    expect(debugUtils).toBeInstanceOf(DebugUtils);
    expect(debugUtils.getOutputDirectory()).toBe(outputDir);
  });
});
