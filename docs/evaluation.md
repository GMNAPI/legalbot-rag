# LegalBot RAG - Evaluation System

## Overview

The evaluation system provides a comprehensive framework for testing and validating the RAG pipeline's performance on Spanish real estate law questions.

## Quick Start

### Prerequisites

1. Set your OpenAI API key:
   ```bash
   export OPENAI_API_KEY=your-key-here
   # or add to .env file
   ```

2. Ensure the Chroma vector database is running with legal documents:
   ```bash
   docker compose up -d chroma
   pnpm ingest
   ```

### Running Evaluations

```bash
# Run all test cases
pnpm eval

# Run only LAU (rental law) cases
pnpm eval --tags LAU

# Run first 5 cases only (for quick testing)
pnpm eval --max 5

# Run refusal cases only
pnpm eval --tags refusal

# Show help
pnpm eval --help
```

## Dataset

The evaluation dataset includes **19 test cases** across different categories:

### LAU Cases (7 cases)
Spanish rental law (Ley de Arrendamientos Urbanos):
- Minimum rental duration
- Contract termination causes
- Repair responsibilities
- Contract extensions
- Rent updates
- Tenant withdrawal
- Deposit returns

### LPH Cases (4 cases)
Spanish horizontal property law (Ley de Propiedad Horizontal):
- Common elements
- Owner obligations
- Community meetings
- Voting majorities

### Refusal Cases (5 cases)
Out-of-scope questions that should be refused:
- Unrelated topics (restaurants, cooking)
- Other legal areas (criminal law)
- Market prices
- Financial advice

### Ambiguous Cases (3 cases)
Edge cases with informal phrasing:
- Vague questions
- Colloquial language
- Implicit questions

## Metrics

Each test case is evaluated using five metrics:

### 1. Citation Accuracy (0-1)
Ratio of valid citations to total citations in the response.
- Valid citation: Referenced article exists in retrieved chunks
- Score = Valid Citations / Total Citations

### 2. Citation Coverage (0-1)
Ratio of expected citations that appear in the response.
- Score = Found Expected Citations / Total Expected Citations

### 3. Refusal Correctness (0 or 1)
Whether the system correctly refused or answered a question.
- 1 = Correct behavior (refused when should refuse, answered when should answer)
- 0 = Incorrect behavior

### 4. Retrieval Similarity Top-1 (0-1)
Cosine similarity score of the most relevant retrieved chunk.
- Higher scores indicate better retrieval quality

### 5. Latency (milliseconds)
Time taken to process the entire query.
- Includes retrieval, generation, and validation

## Report Format

### Console Output

```
════════════════════════════════════════════════════════════════════════════════
              LegalBot RAG - Evaluation Report
════════════════════════════════════════════════════════════════════════════════

Evaluation Results:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Case ID         │ Citation Acc │ Cite Cov   │ Latency   │ Status   │
├──────────────────────────────────────────────────────────────────────────────┤
│ LAU-001         │ 100%         │ 100%       │ 245ms     │ ✓ PASS   │
│ LAU-002         │ 80%          │ 100%       │ 312ms     │ ✓ PASS   │
│ REFUSAL-001     │ 0%           │ 100%       │ 189ms     │ ✓ PASS   │
...

Summary:
  Total Cases:              19
  Passed:                   18 (95%)
  Failed:                   1 (5%)

  Avg Citation Accuracy:    92%
  Avg Citation Coverage:    88%
  Refusal Correctness:      100%
  Avg Retrieval Sim (Top1): 0.78
  Avg Latency:              287ms
  Min Latency:              189ms
  Max Latency:              456ms

Report exported to: reports/eval-2026-02-01.json
```

### JSON Export

Results are automatically exported to `reports/eval-YYYY-MM-DD.json` with full details:

```json
{
  "timestamp": "2026-02-01T16:47:06.098Z",
  "totalCases": 19,
  "passedCases": 18,
  "failedCases": 1,
  "metrics": {
    "avgCitationAccuracy": 0.92,
    "avgCitationCoverage": 0.88,
    "refusalCorrectness": 1.0,
    "avgRetrievalSimilarityTop1": 0.78,
    "avgLatencyMs": 287,
    "minLatencyMs": 189,
    "maxLatencyMs": 456
  },
  "results": [
    {
      "case": { ... },
      "metrics": { ... },
      "response": { ... },
      "retrievedChunks": [ ... ],
      "duration": 245,
      "passed": true
    },
    ...
  ]
}
```

## Pass Criteria

A test case passes if:

**For refusal cases:**
- System correctly refuses to answer (confidence = 'none' or refusal message)

**For normal cases:**
- Citation coverage > 0 (at least one expected citation found)
- Citation accuracy ≥ 0.5 (at least half of citations are valid)

## Architecture

The evaluation system consists of:

### `src/evaluation/types.ts`
Type definitions for:
- `EvaluationCase`: Test case structure
- `EvaluationMetrics`: Metric definitions
- `EvaluationResult`: Single case result
- `EvaluationReport`: Aggregated report

### `src/evaluation/dataset.ts`
Test case dataset with 19 cases categorized by:
- Law type (LAU, LPH)
- Case type (normal, refusal, ambiguous)
- Tags for filtering

### `src/evaluation/runner.ts`
Evaluation execution engine:
- `evaluateCase()`: Run single case against RAG pipeline
- `runEvaluation()`: Batch evaluation with filtering
- `calculateAggregatedMetrics()`: Aggregate results

### `src/evaluation/reporter.ts`
Result formatting and export:
- `formatReport()`: Console table output
- `exportJSON()`: JSON file export
- `buildEvaluationReport()`: Report structure

### `src/evaluation/index.ts`
CLI entry point with argument parsing and orchestration.

## Adding New Test Cases

Edit `src/evaluation/dataset.ts`:

```typescript
const newCase: EvaluationCase = {
  id: 'LAU-008',
  question: '¿Puede el inquilino subarrendar la vivienda?',
  expectedCitations: ['Artículo 8, LAU'],
  shouldRefuse: false,
  tags: ['LAU', 'rental', 'sublease'],
  metadata: {
    expectedKeywords: ['subarriendo', 'autorización'],
    notes: 'Question about sublease permissions'
  }
};

// Add to the appropriate array (lauCases, lphCases, etc.)
```

## Future Enhancements (Milestone 2+)

- **Flakiness handling**: Run each case twice, track standard deviation
- **Quality gates**: Configurable pass/fail thresholds
- **LLM-as-judge**: Semantic answer quality evaluation
- **CI integration**: GitHub Actions workflow
- **Parallel execution**: Speed up evaluation runs
- **Historical tracking**: Compare results over time

## Troubleshooting

### "Missing OPENAI_API_KEY"
Ensure your `.env` file contains:
```
OPENAI_API_KEY=sk-...
```

### "Connection refused" errors
Start the Chroma database:
```bash
docker compose up -d chroma
```

### "No chunks found"
Ingest legal documents first:
```bash
pnpm ingest
```

### Build errors
Ensure dependencies are installed:
```bash
pnpm install
pnpm build
```
