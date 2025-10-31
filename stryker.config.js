export default {
  // Test runner configuration
  testRunner: 'command',
  testRunnerCommand: 'bun test',

  // Mutation testing configuration
  mutate: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts'
  ],

  // Coverage analysis
  coverageAnalysis: 'perTest',

  // Thresholds
  thresholds: {
    high: 90,
    low: 75,
    break: 70
  },

  // Reporters
  reporters: ['progress', 'clear-text', 'html', 'dashboard'],

  // Logging
  logLevel: 'info',

  // Temp directory
  tempDirName: '.stryker-tmp',

  // Files to include in test run sandbox
  files: [
    'src/**/*.ts',
    'tests/**/*.ts',
    'package.json',
    'tsconfig.json'
  ],

  // TypeScript configuration
  tsconfigFile: 'tsconfig.json',

  // Concurrency
  concurrency: Math.max(1, Math.floor(4 * 0.8)), // Assuming 4 cores

  // Max concurrent test runners
  maxConcurrentTestRunners: 2,

  // Timeout multiplier for mutation testing
  timeoutMS: 60000,
  timeoutFactor: 1.5,

  // Ignore patterns
  ignorePatterns: [
    'node_modules',
    'dist',
    '.stryker-tmp',
    'coverage'
  ]
};