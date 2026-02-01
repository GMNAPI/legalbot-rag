# GitHub Project Setup Guide

This document provides instructions for creating the milestones and issues for the Evaluation System project.

## Milestones to Create

### 1. eval-mvp-cli
**Description**: Basic evaluation infrastructure with CLI and golden dataset

**Due Date**: Set based on your timeline

**Issues**: #1, #2

---

### 2. eval-metrics-and-flakiness
**Description**: Add deterministic metrics and flakiness detection for stable evaluation

**Due Date**: 1 week after Milestone 1

**Issues**: #3, #4

---

### 3. eval-quality-gate-and-reports
**Description**: Add quality gates with thresholds and comprehensive documentation

**Due Date**: 1 week after Milestone 2

**Issues**: #5, #6

---

### 4. eval-ci-integration
**Description**: Integrate evaluation system into CI/CD pipeline

**Due Date**: 1 week after Milestone 3

**Issues**: #7

---

## Issues to Create

### Issue #1: Add evaluation module skeleton + CLI (pnpm eval)
**Milestone**: eval-mvp-cli  
**Labels**: `evaluation`, `good-first-issue`  
**Assignees**: (assign as needed)

**Description**:
Create the basic evaluation system infrastructure with a CLI interface.

**Context**:
We need an automated way to test the RAG pipeline quality. This issue creates the foundation for the evaluation system.

**Tasks**:
- [ ] Create `src/evaluation/` directory structure
- [ ] Add TypeScript types in `types.ts`
- [ ] Create CLI entry point in `index.ts`
- [ ] Add dataset structure in `dataset.ts`
- [ ] Add runner skeleton in `runner.ts`
- [ ] Add reporter skeleton in `reporter.ts`
- [ ] Add `"eval": "tsx src/evaluation/index.ts"` to package.json scripts
- [ ] Add `reports/` to .gitignore

**Acceptance Criteria**:
- ✅ `pnpm eval` executes successfully (even with stub data)
- ✅ Console output shows basic execution flow
- ✅ `src/evaluation/` directory exists with all required files
- ✅ Build passes: `pnpm build`
- ✅ Tests pass: `pnpm test`
- ✅ Type check passes: `pnpm typecheck`

---

### Issue #2: Create initial golden dataset (15-20 cases)
**Milestone**: eval-mvp-cli  
**Labels**: `evaluation`, `tests`  
**Assignees**: (assign as needed)

**Description**:
Create a comprehensive golden dataset with real-world test cases covering LAU, LPH, refusals, and edge cases.

**Context**:
The dataset is the foundation of our evaluation system. It should cover the most important use cases and failure modes.

**Tasks**:
- [ ] Add 5-8 LAU (rental law) test cases
- [ ] Add 3-5 LPH (community property) test cases
- [ ] Add 3-5 refusal cases (out-of-scope questions)
- [ ] Add 2-3 ambiguous cases
- [ ] Add 2-3 edge cases
- [ ] Document expected citations for each case
- [ ] Add tags and difficulty levels
- [ ] Document how to add new test cases

**Acceptance Criteria**:
- ✅ Dataset has 15-20 test cases minimum
- ✅ Each case has: id, question, tags, expectedCitations or shouldRefuse
- ✅ Coverage includes: LAU, LPH, refusals, ambiguous, edge cases
- ✅ Documentation explains how to add new cases
- ✅ Dataset version is specified

**Example Test Case**:
```typescript
{
  id: 'lau-001',
  question: '¿Cuánto preaviso necesito para no renovar un contrato de alquiler?',
  tags: ['LAU', 'preaviso', 'renovación'],
  expectedCitations: ['Artículo 10, LAU'],
  difficulty: 'easy',
  notes: 'Classic LAU question about notice period',
}
```

---

### Issue #3: Implement deterministic metrics
**Milestone**: eval-metrics-and-flakiness  
**Labels**: `evaluation`, `tests`  
**Assignees**: (assign as needed)

**Description**:
Implement core evaluation metrics for measuring RAG pipeline quality.

**Context**:
We need objective, deterministic metrics to measure system performance and detect regressions.

**Tasks**:
- [ ] Implement citationAccuracy metric (% expected citations found)
- [ ] Implement citationCoverage metric (ratio of returned vs expected)
- [ ] Implement citationPrecision metric (% valid citations)
- [ ] Implement refusalCorrectness metric (binary pass/fail)
- [ ] Implement retrievalSimilarityTop1 metric (top chunk score)
- [ ] Implement latencyMs metric (end-to-end timing)
- [ ] Calculate per-case metrics
- [ ] Calculate aggregated metrics (avg, min, max)
- [ ] Export metrics to JSON: `reports/eval-YYYY-MM-DD.json`

**Acceptance Criteria**:
- ✅ All 6 metrics implemented and calculated correctly
- ✅ Per-case metrics stored in results
- ✅ Aggregated metrics calculated (avg, min, max, pass rate)
- ✅ JSON report exported to `reports/` directory
- ✅ JSON report includes timestamp and metadata
- ✅ Metrics are deterministic (same input = same output)

**Metrics Definition**:
- **citationAccuracy**: `(found citations / expected citations) * 100`
- **citationCoverage**: `(returned citations / expected citations) * 100`
- **citationPrecision**: `(valid citations / returned citations) * 100`
- **refusalCorrectness**: `actual_refused == expected_refused`
- **retrievalSimilarityTop1**: `top_retrieved_chunk.score`
- **latencyMs**: `end_time - start_time`

---

### Issue #4: Add flakiness handling
**Milestone**: eval-metrics-and-flakiness  
**Labels**: `evaluation`, `tests`  
**Assignees**: (assign as needed)

**Description**:
Add multiple runs per case to detect and flag unstable test results.

**Context**:
LLM responses can vary between runs. We need to detect flakiness to ensure evaluation reliability.

**Tasks**:
- [ ] Add configuration for number of runs per case (default: 2)
- [ ] Execute N runs for each test case
- [ ] Calculate avg, min, max, stddev for each metric
- [ ] Flag cases as `unstable` if stddev > threshold (default: 0.08)
- [ ] Display stability information in report
- [ ] Make thresholds configurable

**Acceptance Criteria**:
- ✅ Runner executes 2+ runs per case (configurable)
- ✅ Calculates avg/min/max/stddev for metrics
- ✅ Marks cases as `unstable` if stddev > 0.08
- ✅ Unstable flag shown in console output
- ✅ Threshold is configurable
- ✅ Documentation updated with flakiness info

**Configuration**:
```typescript
{
  runsPerCase: 2,        // Number of runs per case
  flakinessThreshold: 0.08  // Stddev threshold for unstable flag
}
```

---

### Issue #5: Add quality gates with thresholds
**Milestone**: eval-quality-gate-and-reports  
**Labels**: `evaluation`, `critical`  
**Assignees**: (assign as needed)

**Description**:
Add configurable quality thresholds and exit codes for CI/CD integration.

**Context**:
The evaluation system needs to enforce quality standards and provide clear pass/fail signals for automation.

**Tasks**:
- [ ] Define threshold configuration structure
- [ ] Add minimum thresholds (hard fail)
- [ ] Add target thresholds (warning)
- [ ] Implement threshold checking logic
- [ ] Exit with code 1 if below minimum
- [ ] Show warning if between min and target
- [ ] Exit with code 0 if above target
- [ ] Display threshold status in console

**Acceptance Criteria**:
- ✅ Configurable thresholds for: citationAccuracy, retrievalSimilarity (minimum)
- ✅ Exit code 1 if any metric below minimum threshold
- ✅ Warning shown if metric between min and target
- ✅ Exit code 0 if all metrics above minimum
- ✅ Thresholds documented and easy to modify

**Example Thresholds**:
```typescript
{
  citationAccuracy: {
    minimum: 0.7,   // Fail if below 70%
    target: 0.85    // Warn if below 85%
  },
  retrievalSimilarity: {
    minimum: 0.6,   // Fail if below 60%
    target: 0.75    // Warn if below 75%
  }
}
```

---

### Issue #6: Add evaluation documentation
**Milestone**: eval-quality-gate-and-reports  
**Labels**: `evaluation`, `docs`  
**Assignees**: (assign as needed)

**Description**:
Create comprehensive documentation for the evaluation system.

**Context**:
Users need clear instructions on how to use the evaluation system and interpret results.

**Tasks**:
- [ ] Create `docs/evaluation.md`
- [ ] Document how to run evaluation locally
- [ ] Explain each metric and its purpose
- [ ] Document JSON report format
- [ ] Explain how to add new test cases
- [ ] Document how to edit thresholds
- [ ] Add troubleshooting section
- [ ] Update main README with evaluation section

**Acceptance Criteria**:
- ✅ `docs/evaluation.md` created with comprehensive guide
- ✅ Main README updated with evaluation section
- ✅ How to run: `pnpm eval`, `pnpm eval --verbose`
- ✅ JSON report format documented
- ✅ Instructions for adding test cases
- ✅ Instructions for editing thresholds
- ✅ Troubleshooting section included

---

### Issue #7: Add GitHub Actions CI workflow
**Milestone**: eval-ci-integration  
**Labels**: `evaluation`, `ci`, `critical`  
**Assignees**: (assign as needed)

**Description**:
Create GitHub Actions workflow for automated CI pipeline.

**Context**:
Automate quality checks on every push and PR to catch regressions early.

**Tasks**:
- [ ] Create `.github/workflows/ci.yml`
- [ ] Add checkout step
- [ ] Add Node.js setup (v20)
- [ ] Add pnpm setup
- [ ] Add dependency installation
- [ ] Add typecheck step
- [ ] Add test step
- [ ] Add build step
- [ ] Add eval step (conditional - only on main)
- [ ] Document CI design decisions

**Acceptance Criteria**:
- ✅ `.github/workflows/ci.yml` created
- ✅ Workflow includes: checkout, setup node, setup pnpm, install
- ✅ Workflow runs: typecheck, test, build (always)
- ✅ Workflow runs: eval (only on main branch or with flag)
- ✅ CI passes on main branch
- ✅ Documentation explains why eval is optional on PRs
- ✅ Workflow badge added to README

**Rationale for Optional Eval**:
Run `pnpm eval` only on main branch (not PRs) to:
- Avoid long PR check times (eval can take 1-2 minutes)
- Avoid OpenAI API rate limits on PRs
- Keep PR feedback fast

**Example Workflow**:
```yaml
name: CI

on: [push, pull_request]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
      - name: Run evaluation
        if: github.ref == 'refs/heads/main'
        run: pnpm eval
```

---

## Label Definitions

Create these labels in your GitHub repository:

| Label | Color | Description |
|-------|-------|-------------|
| `evaluation` | `#1d76db` | Related to evaluation system |
| `tests` | `#0e8a16` | Test infrastructure |
| `ci` | `#fbca04` | CI/CD related |
| `docs` | `#0075ca` | Documentation |
| `good-first-issue` | `#7057ff` | Good for newcomers |
| `critical` | `#d93f0b` | High priority |

---

## Creating Milestones and Issues

### Via GitHub Web UI

1. Go to https://github.com/GMNAPI/legalbot-rag/milestones
2. Click "New milestone"
3. Create each milestone with title and description above
4. Go to https://github.com/GMNAPI/legalbot-rag/issues
5. Click "New issue"
6. Create each issue using the templates above
7. Assign to appropriate milestone
8. Add labels

### Via GitHub CLI

```bash
# Create milestones
gh milestone create "eval-mvp-cli" --description "Basic evaluation infrastructure"
gh milestone create "eval-metrics-and-flakiness" --description "Add metrics and flakiness detection"
gh milestone create "eval-quality-gate-and-reports" --description "Add quality gates and docs"
gh milestone create "eval-ci-integration" --description "Integrate into CI/CD"

# Create labels
gh label create "evaluation" --color "1d76db" --description "Related to evaluation system"
gh label create "tests" --color "0e8a16" --description "Test infrastructure"
gh label create "ci" --color "fbca04" --description "CI/CD related"
gh label create "docs" --color "0075ca" --description "Documentation"
gh label create "good-first-issue" --color "7057ff" --description "Good for newcomers"
gh label create "critical" --color "d93f0b" --description "High priority"

# Create issues (using issue templates from this file)
# Note: You'll need to create these manually or use a script
```

---

## Implementation Order

1. **Milestone 1** (1 week)
   - Issue #1: Evaluation skeleton ✅ COMPLETED
   - Issue #2: Golden dataset ✅ COMPLETED

2. **Milestone 2** (1 week)
   - Issue #3: Deterministic metrics
   - Issue #4: Flakiness handling

3. **Milestone 3** (1 week)
   - Issue #5: Quality gates
   - Issue #6: Documentation ✅ COMPLETED (basic version)

4. **Milestone 4** (1 week)
   - Issue #7: CI integration

**Total Timeline**: ~4 weeks for full implementation
