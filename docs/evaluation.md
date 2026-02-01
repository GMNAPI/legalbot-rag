# Evaluation System

## Overview

The evaluation system provides automated quality assessment for the LegalBot RAG pipeline. It runs a golden dataset of test cases through the real RAG pipeline and measures performance using deterministic metrics.

## Quick Start

### Run Evaluation

```bash
# Run full evaluation with summary
pnpm eval

# Run with detailed output for failed cases
pnpm eval --verbose

# Save report to custom location
pnpm eval --output=./my-report.json
```

### Output

The evaluation produces:
1. **Console output**: Summary of pass/fail rates and key metrics
2. **JSON report**: Detailed results saved to `reports/eval-YYYY-MM-DD.json`

Example console output:
```
🔍 Running evaluation on 18 cases...

======================================================================
📊 EVALUATION SUMMARY
======================================================================
Dataset Version: 1.0.0
Total Duration:  45.23s
Timestamp:       2024-02-01T16:30:00.000Z

📈 Overall Metrics:
  Total Cases:    18
  Passed:         16 (88.9%)
  Failed:         2

📝 Citation Metrics:
  Accuracy:       85.3%
  Coverage:       92.1%
  Precision:      100.0%

🔍 Retrieval Metrics:
  Avg Similarity: 78.5%

⚡ Performance Metrics:
  Avg Latency:    2450ms
  Min Latency:    1823ms
  Max Latency:    4102ms

======================================================================

💾 Report saved to: reports/eval-2024-02-01.json
```

## Golden Dataset

The golden dataset (`src/evaluation/dataset.ts`) contains test cases covering:

- **LAU cases** (Ley de Arrendamientos Urbanos): rental law questions
- **LPH cases** (Ley de Propiedad Horizontal): community property law
- **Multi-law cases**: questions requiring both LAU and LPH knowledge
- **Refusal cases**: out-of-scope questions where bot should refuse
- **Ambiguous cases**: questions with context-dependent answers
- **Edge cases**: important corner cases

### Dataset Structure

Each test case includes:

```typescript
{
  id: 'lau-001',                              // Unique identifier
  question: '¿Cuánto preaviso necesito...',   // Test question
  tags: ['LAU', 'preaviso', 'renovación'],    // Categorization
  expectedCitations: ['Artículo 10, LAU'],    // Expected legal citations
  shouldRefuse: false,                         // Whether bot should refuse
  difficulty: 'easy',                          // easy | medium | hard
  notes: 'Classic LAU question...'            // Optional context
}
```

### Adding New Test Cases

1. Open `src/evaluation/dataset.ts`
2. Add a new case to the `goldenDataset` array:

```typescript
{
  id: 'lau-006',  // Use next available ID in sequence
  question: 'Your question here',
  tags: ['LAU', 'relevant-tag'],
  expectedCitations: ['Artículo X, LAU'],
  difficulty: 'medium',
}
```

3. Run evaluation to verify: `pnpm eval`

## Metrics

### Citation Metrics

- **Citation Accuracy**: Percentage of expected citations that were found in response
  - Formula: `(found citations / expected citations) * 100`
  - Target: ≥80%

- **Citation Coverage**: Ratio of returned citations vs expected
  - Formula: `(returned citations / expected citations) * 100`
  - Measures whether bot over/under-cites

- **Citation Precision**: Percentage of returned citations that are valid
  - All citations are validated against retrieved context
  - Should be 100% (system validates before returning)

### Retrieval Metrics

- **Retrieval Similarity Top 1**: Similarity score of the most relevant retrieved chunk
  - Range: 0-1 (higher is better)
  - Indicates how well the retrieval system found relevant context

### Behavioral Metrics

- **Refusal Correctness**: Whether the bot correctly refused or answered
  - For out-of-scope questions, bot should say "No dispongo de información"
  - Binary: pass or fail

### Performance Metrics

- **Latency**: End-to-end response time in milliseconds
  - Includes: embedding generation, retrieval, and LLM response
  - Reports: avg, min, max

## Report Format

JSON reports are saved to `reports/eval-YYYY-MM-DD.json`:

```json
{
  "timestamp": "2024-02-01T16:30:00.000Z",
  "results": [
    {
      "caseId": "lau-001",
      "question": "¿Cuánto preaviso necesito...",
      "response": {
        "answer": "Según la LAU...",
        "sources": [
          {
            "article": "Artículo 10",
            "law": "LAU",
            "excerpt": "..."
          }
        ],
        "confidence": "high"
      },
      "metrics": {
        "citationAccuracy": 1.0,
        "citationCoverage": 1.0,
        "citationPrecision": 1.0,
        "refusalCorrectness": true,
        "retrievalSimilarityTop1": 0.85,
        "latencyMs": 2340,
        "passed": true
      },
      "timestamp": "2024-02-01T16:30:05.000Z"
    }
  ],
  "aggregated": {
    "totalCases": 18,
    "passedCases": 16,
    "failedCases": 2,
    "passRate": 0.889,
    "avgCitationAccuracy": 0.853,
    "avgCitationCoverage": 0.921,
    "avgCitationPrecision": 1.0,
    "avgRetrievalSimilarity": 0.785,
    "avgLatencyMs": 2450,
    "minLatencyMs": 1823,
    "maxLatencyMs": 4102
  },
  "metadata": {
    "totalDuration": 45230,
    "datasetVersion": "1.0.0"
  }
}
```

## Continuous Integration

The evaluation system is designed to run in CI/CD pipelines. See Milestone 4 for GitHub Actions integration.

### Exit Codes

- `0`: All tests passed or pass rate ≥ 70%
- `1`: Pass rate < 70% or system error

## Architecture

```
src/evaluation/
├── types.ts          # TypeScript interfaces
├── dataset.ts        # Golden test cases
├── runner.ts         # Evaluation execution logic
├── reporter.ts       # Result formatting and output
└── index.ts          # CLI entry point
```

### Execution Flow

```
CLI → Runner → RAG Pipeline (for each case)
              ↓
            Metrics Calculation
              ↓
            Reporter → Console + JSON File
```

## Future Enhancements (Upcoming Milestones)

### Milestone 2: Flakiness Handling
- Run each case multiple times
- Calculate standard deviation
- Flag unstable cases

### Milestone 3: Quality Gates
- Configurable thresholds (min/target)
- Exit code based on threshold violations
- Visual indicators for warnings

### Milestone 4: CI Integration
- GitHub Actions workflow
- PR comments with results
- Trend tracking over time

## Troubleshooting

### "No such file or directory: reports/"
The reports directory is auto-created. If you see this error, ensure write permissions.

### High failure rate on first run
The evaluation requires:
- OpenAI API key configured in `.env`
- Vector database populated (run `pnpm ingest`)
- Internet connectivity for OpenAI API

### Timeout errors
Increase timeout if needed. Each case can take 2-5 seconds depending on OpenAI API response time.

## Best Practices

1. **Run before deployments**: `pnpm eval` before merging to main
2. **Track trends**: Compare reports over time to catch regressions
3. **Update dataset**: Add cases when bugs are found
4. **Review failures**: Always investigate failed cases before dismissing
5. **Version dataset**: Update `DATASET_VERSION` when making significant changes
