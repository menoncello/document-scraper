import { existsSync, readdirSync, rmSync, unlinkSync } from 'node:fs';
import { DebugUtils } from '../../../../src/core/debug';

export function setupDebugUtils() {
  const outputDir = 'test-debug-utils-output';
  const debugUtils = new DebugUtils(outputDir);
  return { debugUtils, outputDir };
}

export function cleanupDebugUtils(outputDir: string) {
  // Clean up test directory and files
  if (existsSync(outputDir)) {
    const files = readdirSync(outputDir);
    for (const file of files) {
      unlinkSync(`${outputDir}/${file}`);
    }
    rmSync(outputDir, { recursive: true });
  }
}
