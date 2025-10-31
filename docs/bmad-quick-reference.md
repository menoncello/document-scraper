# BMAD Quick Reference - Document Scrape Project

**Project**: Document Scrape (Bun + TypeScript web scraping library)
**BMAD Version**: 6.0.0-alpha.3
**Quality Gates**: TypeScript 0 ✅ | ESLint 0 ✅ | Tests 100% ✅ | Mutation 70%+ ✅

---

## 🔄 Story Development Loop

### 1. Planning
```bash
# Start new epic or analyze requirements
/bmad:bmm:agents:analyst
*product-brief                 # Create/refine product requirements
*research                      # Market/technical research
```

### 2. Architecture
```bash
# Design system architecture
/bmad:bmm:agents:architect
*solution-architecture         # Create technical architecture
*architecture                  # Make architectural decisions with ADRs
```

### 3. Story Creation
```bash
# Draft and refine user stories
/bmad:bmm:agents:sm
*create-story                  # Create next story from epic
*story-ready                   # Mark drafted story as ready for development
```

### 4. Implementation
```bash
# Implement story with mandatory quality gates
/bmad:bmm:agents:dev
*develop                       # Implement story (automatic quality validation)
*quality-check                 # Manual quality gates validation
```

**Quality Gates (Automatic)**:
- TypeScript compilation: 0 errors (strict mode)
- ESLint validation: 0 errors (no eslint-disable allowed)
- Test execution: 100% pass rate
- Mutation testing: 70%+ score (Stryker)
- Code formatting: 100% Prettier compliance

### 5. Review
```bash
# Code review and quality validation
/bmad:bmm:agents:dev
*code-review                   # Senior developer code review

# Test quality review
/bmad:bmm:agents:tea
*test-review                   # Review test quality and coverage
```

### 6. Completion
```bash
# Mark story complete
/bmad:bmm:agents:dev
*story-done                    # Mark story as done after DoD complete

# Check overall progress
/bmad:bmm:workflows:workflow-status    # Check project status and next steps
```

---

## 🎯 Quality Checks

### Automated Quality Gates
```bash
# Run complete quality validation
bun run quality-check         # TypeScript + ESLint + Tests + Formatting

# Individual quality checks
bun run typecheck             # TypeScript compilation (0 errors)
bun run lint                  # ESLint validation (0 errors)
bun test                      # Test execution (100% pass rate)
bun run format:check          # Code formatting validation
bun run mutation              # Stryker mutation testing (70%+ threshold)
```

### Code Review Standards
- **No eslint-disable comments** - Fix underlying code issues
- **No @ts-ignore/@ts-expect-error** - Fix TypeScript errors
- **100% test coverage** for new functionality
- **Mutation score 70%+** for robust testing

---

## 🚀 Quick Commands

### Story Management
```bash
# Create new story
/bmad:bmm:workflows:create-story

# Generate story context (recommended before dev)
/bmad:bmm:workflows:story-context

# Check what to work on next
/bmad:bmm:workflows:workflow-status
```

### Quality Assurance
```bash
# Comprehensive quality check
/bmad:bmm:agents:dev
*quality-check

# Security audit
/bmad:bmm:agents:dev
*security-audit

# Test architecture review
/bmad:bmm:agents:tea
*test-review
```

### Project Management
```bash
# Sprint planning
/bmad:bmm:workflows:sprint-planning

# Epic retrospectives
/bmad:bmm:workflows:retrospective

# Solution architecture
/bmad:bmm:workflows:solution-architecture
```

---

## 📋 Project-Specific Standards

### Technology Stack
- **Runtime**: Bun 1.3.1+
- **Language**: TypeScript 5.9.3+ (strict mode)
- **Testing**: Bun Test runner
- **Mutation**: Stryker 9.2.0+
- **Linting**: ESLint 9.38.0+ (zero tolerance)

### Quality Rules
1. **Zero ESLint errors** - No eslint-disable comments allowed
2. **Zero TypeScript errors** - Strict mode, no @ts-ignore
3. **100% test pass rate** - All tests must pass
4. **70%+ mutation score** - Robust test coverage
5. **Proper formatting** - 100% Prettier compliance

### Code Patterns
- Use Bun's built-in APIs (fetch, test runner, etc.)
- Async/await throughout - no floating promises
- Proper TypeScript types - no 'any' allowed
- Error handling with try/catch and proper types
- Configuration-driven architecture

---

## 🎖️ Agent Specializations

### DEV Agent (Amelia)
- **Quality Enforcement**: Zero-tolerance quality gates
- **Focus**: Production-ready code with comprehensive testing
- **Special Commands**: `*quality-check`, `*security-audit`

### TEA Agent (Test Architect)
- **Testing Framework**: Bun Test + Stryker mutation testing
- **Quality Focus**: 70%+ mutation scores, comprehensive coverage
- **Standards**: No eslint-disable in tests, proper async handling

### SM Agent (Scrum Master)
- **Story Quality**: Templates with production-ready examples
- **Standards**: Quality gates referenced in stories
- **Focus**: Clear acceptance criteria and DoD checklists

### Architect Agent
- **Code Examples**: Production-quality, compilable code
- **Standards**: TypeScript strict mode, ESLint compliance
- **Focus**: ADRs with working code examples

---

## 🔧 Troubleshooting

### Quality Gate Failures
```bash
# TypeScript errors
bun run typecheck              # Check specific errors
# Fix: Update types, add proper interfaces, remove @ts-ignore

# ESLint errors
bun run lint                   # Check specific violations
# Fix: Refactor code to satisfy rules, remove eslint-disable

# Test failures
bun test                       # Check failing tests
# Fix: Update expectations, fix implementation, improve coverage

# Mutation score low
bun run mutation               # Check mutation report
# Fix: Add edge case tests, improve assertions, target surviving mutants
```

### Common Issues
- **Import errors**: Check TypeScript paths and module resolution
- **Async issues**: Use proper async/await patterns
- **Type errors**: Add proper type definitions, avoid 'any'
- **Test flakes**: Use deterministic test data, proper isolation

---

## 📚 Tips for Success

1. **Never skip quality gates** - They're mandatory for a reason
2. **Fix root causes** - Don't use eslint-disable or @ts-ignore
3. **Write tests first** - TDD approach reduces rework
4. **Review mutation reports** - They show test gaps
5. **Use project patterns** - Follow established conventions
6. **Ask for clarification** - If requirements are unclear, ask before implementing

---

**Remember**: Quality gates are automatically enforced in workflows. Focus on writing clean, well-tested code that meets the project's high standards.