# ATDD Implementation Checklist - Story 1.2: CLI Interface and Export

**Generated**: 2025-10-31
**Story**: 1.2 - CLI Interface and Export
**Primary Test Level**: Unit Tests (CLI logic) + Integration Tests (end-to-end workflows)
**Status**: RED Phase Complete - Tests Ready for Implementation

---

## Story Summary

**As a developer working with web scraping, I want a CLI interface with export capabilities for the scraping library, so that I can easily scrape websites and export data to JSON/CSV formats from the command line.**

### Acceptance Criteria Covered

1. ✅ CLI framework accepts scrape commands with URL and output parameters
2. ✅ Configuration file support enables complex scraping scenarios via YAML/JSON
3. ✅ JSON export functionality outputs structured data correctly
4. ✅ CSV export functionality creates properly formatted spreadsheets
5. ✅ Error handling provides clear user feedback for failures
6. ✅ CLI tool is fully tested with comprehensive test coverage

---

## Test Files Created (RED Phase)

### Unit Tests
- `tests/unit/cli/cli-commands.test.ts` - 9 tests covering CLI commands, config, errors, and exports
- `tests/unit/cli/config-validation.test.ts` - 4 tests covering configuration validation

### Integration Tests
- `tests/integration/cli-workflows.test.ts` - 5 tests covering end-to-end CLI workflows

### Supporting Infrastructure
- `tests/factories/cli-factories.ts` - Factory functions for CLI data generation
- `tests/fixtures/cli-fixtures.ts` - Test fixtures with auto-cleanup

**Total Tests**: 18 tests (all currently failing - RED phase confirmed)

---

## Implementation Checklist

### Phase 1: Core CLI Infrastructure

#### ✅ Test: TC-CLI-001-01 - Accept URL Parameter
**File**: `tests/unit/cli/cli-commands.test.ts:15`

- [ ] Install Commander.js dependency
- [ ] Create `src/cli/index.ts` - Main CLI entry point
- [ ] Create `src/cli/commands/scrape.ts` - Scrape command implementation
- [ ] Implement basic command parsing with URL argument
- [ ] Add `bin/docs-scrape` executable script
- [ ] Configure package.json for CLI distribution
- [ ] **Run test**: `bun test tests/unit/cli/cli-commands.test.ts`

#### ✅ Test: TC-CLI-001-02 - JSON Output Configuration
**File**: `tests/unit/cli/cli-commands.test.ts:28`

- [ ] Add `--format` option support to scrape command
- [ ] Implement JSON format validation
- [ ] Create output format configuration structure
- [ ] **Run test**: `bun test tests/unit/cli/cli-commands.test.ts`

#### ✅ Test: TC-CLI-001-03 - CSV Output Configuration
**File**: `tests/unit/cli/cli-commands.test.ts:41`

- [ ] Add CSV format support to output options
- [ ] Implement format selection logic
- [ ] **Run test**: `bun test tests/unit/cli/cli-commands.test.ts`

### Phase 2: Configuration File Support

#### ✅ Test: TC-CLI-002-01 - YAML Configuration Loading
**File**: `tests/unit/cli/cli-commands.test.ts:56`

- [ ] Install YAML parsing dependency (js-yaml or similar)
- [ ] Create `src/cli/commands/config.ts` - Config command handling
- [ ] Implement YAML file loading and parsing
- [ ] Add `--config` option to CLI commands
- [ ] **Run test**: `bun test tests/unit/cli/cli-commands.test.ts`

#### ✅ Test: TC-CLI-002-02 - JSON Configuration Loading
**File**: `tests/unit/cli/cli-commands.test.ts:71`

- [ ] Implement JSON configuration file loading
- [ ] Add configuration file format detection
- [ ] Merge command-line args with config file settings
- [ ] **Run test**: `bun test tests/unit/cli/cli-commands.test.ts`

### Phase 3: Error Handling

#### ✅ Test: TC-CLI-003-01 - Invalid URL Error Message
**File**: `tests/unit/cli/cli-commands.test.ts:86`

- [ ] Create `src/cli/utils/validation.ts` - URL validation utilities
- [ ] Implement URL format validation
- [ ] Add clear error messages for invalid URLs
- [ ] Implement CLI error output formatting
- [ ] **Run test**: `bun test tests/unit/cli/cli-commands.test.ts`

#### ✅ Test: TC-CLI-003-02 - Missing Parameter Help
**File**: `tests/unit/cli/cli-commands.test.ts:101`

- [ ] Add required parameter validation
- [ ] Implement usage help display
- [ ] Create command help text
- [ ] **Run test**: `bun test tests/unit/cli/cli-commands.test.ts`

#### ✅ Test: TC-CLI-003-03 - Network Timeout Handling
**File**: `tests/unit/cli/cli-commands.test.ts:116`

- [ ] Add `--timeout` option support
- [ ] Implement timeout configuration passing to scraper
- [ ] Add graceful timeout error handling
- [ ] **Run test**: `bun test tests/unit/cli/cli-commands.test.ts`

### Phase 4: Export Functionality

#### ✅ Test: TC-CLI-004-01 - JSON Export Implementation
**File**: `tests/unit/cli/cli-commands.test.ts:135`

- [ ] Create `src/exporters/json.ts` - JSON export functionality
- [ ] Implement scraped data JSON serialization
- [ ] Add file writing with proper error handling
- [ ] Integrate JSON exporter with CLI workflow
- [ ] **Run test**: `bun test tests/unit/cli/cli-commands.test.ts`

#### ✅ Test: TC-CLI-004-02 - CSV Export Implementation
**File**: `tests/unit/cli/cli-commands.test.ts:150`

- [ ] Create `src/exporters/csv.ts` - CSV export functionality
- [ ] Implement CSV formatting with headers
- [ ] Handle data serialization to CSV format
- [ ] Integrate CSV exporter with CLI workflow
- [ ] **Run test**: `bun test tests/unit/cli/cli-commands.test.ts`

#### ✅ Test: TC-CLI-004-03 - Invalid Directory Error
**File**: `tests/unit/cli/cli-commands.test.ts:165`

- [ ] Add output directory validation
- [ ] Implement directory creation if needed
- [ ] Add clear error messages for invalid paths
- [ ] **Run test**: `bun test tests/unit/cli/cli-commands.test.ts`

### Phase 5: Configuration Validation

#### ✅ Test: TC-CLI-005-01 - Valid Config Validation
**File**: `tests/unit/cli/config-validation.test.ts:7`

- [ ] Create `src/cli/validators/config-validator.ts`
- [ ] Implement configuration schema validation
- [ ] Add required field checking
- [ ] **Run test**: `bun test tests/unit/cli/config-validation.test.ts`

#### ✅ Test: TC-CLI-005-02 - Missing Required Field Error
**File**: `tests/unit/cli/config-validation.test.ts:21`

- [ ] Implement specific error messages for missing fields
- [ ] Add scrapeUrl requirement validation
- [ ] **Run test**: `bun test tests/unit/cli/config-validation.test.ts`

#### ✅ Test: TC-CLI-005-03 - Invalid Format Error
**File**: `tests/unit/cli/config-validation.test.ts:35`

- [ ] Add output format validation
- [ ] Implement whitelist of supported formats
- [ ] **Run test**: `bun test tests/unit/cli/config-validation.test.ts`

#### ✅ Test: TC-CLI-005-04 - Invalid CSS Selector Error
**File**: `tests/unit/cli/config-validation.test.ts:49`

- [ ] Implement CSS selector validation
- [ ] Add selector syntax checking
- [ ] **Run test**: `bun test tests/unit/cli/config-validation.test.ts`

### Phase 6: Integration Workflows

#### ✅ Test: TC-CLI-006-01 - End-to-End Simple Scrape
**File**: `tests/integration/cli-workflows.test.ts:26`

- [ ] Connect CLI commands to core DocumentScraper from Story 1.1
- [ ] Implement complete workflow integration
- [ ] Add progress indicators for long-running operations
- [ ] **Run test**: `bun test tests/integration/cli-workflows.test.ts`

#### ✅ Test: TC-CLI-006-02 - Configuration File Workflow
**File**: `tests/integration/cli-workflows.test.ts:42`

- [ ] Implement config file loading in CLI execution
- [ ] Add configuration override logic
- [ ] **Run test**: `bun test tests/integration/cli-workflows.test.ts`

#### ✅ Test: TC-CLI-006-03 - Complex Multi-Selector Workflow
**File**: `tests/integration/cli-workflows.test.ts:58`

- [ ] Support multiple CSS selectors in configuration
- [ ] Implement structured data extraction for multiple selectors
- [ ] Add nested data structure output
- [ ] **Run test**: `bun test tests/integration/cli-workflows.test.ts`

#### ✅ Test: TC-CLI-006-04 - Database Export Workflow
**File**: `tests/integration/cli-workflows.test.ts:80`

- [ ] Create `src/exporters/database.ts` - Database export functionality
- [ ] Add SQLite support for local database export
- [ ] Implement table creation and data insertion
- [ ] Add database connection management
- [ ] **Run test**: `bun test tests/integration/cli-workflows.test.ts`

#### ✅ Test: TC-CLI-006-05 - Network Error Handling
**File**: `tests/integration/cli-workflows.test.ts:100`

- [ ] Implement comprehensive error handling in CLI workflow
- [ ] Add retry logic with exponential backoff
- [ ] Provide informative error messages for different failure types
- [ ] **Run test**: `bun test tests/integration/cli-workflows.test.ts`

---

## Red-Green-Refactor Workflow

### RED Phase ✅ COMPLETE
- ✅ All 18 tests written and failing
- ✅ Factories and fixtures created with faker for parallel safety
- ✅ Auto-cleanup fixtures implemented
- ✅ Mock requirements documented for DEV team

### GREEN Phase (DEV Team - Next Steps)
1. Pick one failing test
2. Implement minimal code to make it pass
3. Run test to verify green
4. Move to next test
5. Repeat until all tests pass

**Implementation Priority**:
1. **P0 Tests** (Critical): TC-CLI-001-01, TC-CLI-001-02, TC-CLI-001-03, TC-CLI-004-01, TC-CLI-004-02, TC-CLI-006-01
2. **P1 Tests** (High): TC-CLI-002-01, TC-CLI-002-02, TC-CLI-003-01, TC-CLI-003-02, TC-CLI-003-03, TC-CLI-004-03, TC-CLI-005-01, TC-CLI-005-02, TC-CLI-005-03, TC-CLI-006-02, TC-CLI-006-05
3. **P2 Tests** (Medium): TC-CLI-005-04, TC-CLI-006-03, TC-CLI-006-04

### REFACTOR Phase (DEV Team - After Green)
1. All tests passing (green)
2. Extract common CLI patterns
3. Optimize performance (parallel operations)
4. Improve code organization
5. Ensure tests still pass after refactoring

---

## Running Tests

### All CLI Tests
```bash
bun test tests/unit/cli/ tests/integration/cli-workflows.test.ts
```

### Specific Test Files
```bash
# CLI Commands Tests
bun test tests/unit/cli/cli-commands.test.ts

# Configuration Tests
bun test tests/unit/cli/config-validation.test.ts

# Integration Tests
bun test tests/integration/cli-workflows.test.ts
```

### Test with Coverage
```bash
bun test --coverage tests/unit/cli/ tests/integration/cli-workflows.test.ts
```

---

## Required Implementation Files

### New Files to Create
```
src/cli/
├── index.ts                 # Main CLI entry point
├── commands/
│   ├── scrape.ts           # Scrape command implementation
│   └── config.ts           # Config command handling
├── utils/
│   └── validation.ts       # URL and config validation
└── validators/
    └── config-validator.ts # Configuration schema validation

src/exporters/
├── json.ts                 # JSON export functionality
├── csv.ts                  # CSV export functionality
└── database.ts             # Database export functionality

bin/
└── docs-scrape             # Executable CLI script
```

### Files to Update
```
package.json                # Add CLI configuration and dependencies
tsconfig.json              # Include new CLI source files
```

---

## Mock Requirements for DEV Team

### Core Dependencies
- **Commander.js**: CLI framework for command parsing
- **js-yaml** or similar: YAML configuration file parsing
- **@faker-js/faker**: Already available for test data generation

### External Services
- **Network Requests**: Use existing DocumentScraper from Story 1.1
- **File System**: Node.js fs module for file operations
- **Database**: SQLite for local database export (no external services needed)

---

## Required data-testid Attributes

**No UI Components** - This is CLI functionality, no data-testid attributes required.

---

## Integration with Existing Codebase

### Reuse from Story 1.1
- `src/core/scraper.ts` - DocumentScraper.scrape() method
- `src/core/config.ts` - Configuration loading patterns
- `src/core/http-client.ts` - Network request handling
- `src/core/html-parser.ts` - HTML parsing and data extraction
- `src/core/data-extractor.ts` - Data extraction pipeline
- `src/core/logger.ts` - Logging infrastructure

### Existing Test Infrastructure
- Bun test runner and configuration
- ESLint rules and quality gates
- TC-XXX-001 test ID conventions
- P0-P3 priority markers
- Fixture patterns from `tests/helpers/`

---

## Implementation Estimates

- **Core CLI Infrastructure**: 1-2 days
- **Configuration File Support**: 0.5-1 day
- **Export Functionality (JSON/CSV)**: 1 day
- **Database Export**: 0.5-1 day
- **Error Handling & Validation**: 0.5 day
- **Integration Workflows**: 0.5-1 day
- **Testing & Refinement**: 0.5 day

**Total Estimated Effort**: 4-6 days (2-3 story points as expected)

---

## Next Steps for DEV Team

1. **Start with P0 Tests**: Begin with basic CLI command structure (TC-CLI-001-01)
2. **Follow Checklist**: Implement items in order from checklist above
3. **Run Tests Frequently**: After each implementation step, run relevant tests
4. **Reuse Existing Code**: Leverage DocumentScraper and core infrastructure from Story 1.1
5. **Maintain Quality Standards**: Ensure ESLint compliance and test coverage >90%
6. **Share Progress**: Update status in daily standups as tests turn green

**Output File**: `docs/atdd-checklist-1-2.md`

**Tests in RED Phase**: 18 tests ready for implementation ✅

**Knowledge Base References Applied**:
- Fixture architecture patterns with auto-cleanup
- Data factory patterns with faker for parallel safety
- Network-first patterns for deterministic CLI testing
- Test quality principles (isolated, explicit assertions, <300 lines, <1.5min)
- Selector resilience patterns (though CLI-focused, less relevant)