/**
 * Evaluation Runner
 * 
 * Executes evaluation cases against the RAG pipeline
 */

import { query, retrieve } from '../rag.js';
import type { ChatResponse } from '../types.js';
import type {
  EvaluationCase,
  EvaluationResult,
  EvaluationMetrics,
  EvaluationReport,
  EvaluationConfig,
  AggregatedMetrics,
} from './types.js';
import { goldenDataset, DATASET_VERSION } from './dataset.js';

/**
 * Normalize citation string for comparison
 */
function normalizeCitation(citation: string): string {
  return citation
    .toLowerCase()
    .replace(/artículo|art\.?/gi, 'articulo')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two citations match
 */
function citationsMatch(expected: string, actual: string): boolean {
  const normalizedExpected = normalizeCitation(expected);
  const normalizedActual = normalizeCitation(actual);
  
  // Extract article number and law
  const expectedParts = normalizedExpected.match(/articulo\s*(\d+(?:\s*bis)?)[,\s]+(.+)/);
  const actualParts = normalizedActual.match(/articulo\s*(\d+(?:\s*bis)?)[,\s]+(.+)/);
  
  if (!expectedParts || !actualParts) {
    return normalizedExpected.includes(normalizedActual) || 
           normalizedActual.includes(normalizedExpected);
  }
  
  const expectedArticle = expectedParts[1] ?? '';
  const expectedLaw = expectedParts[2] ?? '';
  const actualArticle = actualParts[1] ?? '';
  const actualLaw = actualParts[2] ?? '';
  
  // Check if article numbers match
  const articlesMatch = expectedArticle === actualArticle;
  
  // Check if law names match (fuzzy - LAU vs Ley 29/1994)
  const lawsMatch = expectedLaw.includes(actualLaw) || 
                    actualLaw.includes(expectedLaw) ||
                    (expectedLaw.includes('lau') && actualLaw.includes('lau')) ||
                    (expectedLaw.includes('lph') && actualLaw.includes('lph'));
  
  return articlesMatch && lawsMatch;
}

/**
 * Calculate citation metrics
 */
function calculateCitationMetrics(
  expectedCitations: string[] | undefined,
  response: ChatResponse
): {
  citationAccuracy: number;
  citationCoverage: number;
  citationPrecision: number;
} {
  if (!expectedCitations || expectedCitations.length === 0) {
    return {
      citationAccuracy: 1.0,
      citationCoverage: 1.0,
      citationPrecision: response.sources.length > 0 ? 1.0 : 0.0,
    };
  }
  
  const actualCitations = response.sources.map(s => `${s.article}, ${s.law}`);
  
  // Citation Accuracy: % of expected citations that were found
  let foundCount = 0;
  for (const expected of expectedCitations) {
    const found = actualCitations.some(actual => citationsMatch(expected, actual));
    if (found) foundCount++;
  }
  const citationAccuracy = foundCount / expectedCitations.length;
  
  // Citation Coverage: How many citations were retrieved vs expected
  const citationCoverage = actualCitations.length / expectedCitations.length;
  
  // Citation Precision: % of returned citations that are valid (all are valid in our system)
  const citationPrecision = actualCitations.length > 0 ? 1.0 : 0.0;
  
  return {
    citationAccuracy,
    citationCoverage,
    citationPrecision,
  };
}

/**
 * Run a single evaluation case
 */
export async function runEvaluationCase(
  testCase: EvaluationCase
): Promise<EvaluationResult> {
  const startTime = Date.now();
  
  // Run the RAG pipeline
  const response = await query(testCase.question);
  
  // Get retrieval results for similarity score
  const retrievalResults = await retrieve(testCase.question);
  const retrievalSimilarityTop1 = retrievalResults[0]?.score ?? 0;
  
  const latencyMs = Date.now() - startTime;
  
  // Calculate citation metrics
  const citationMetrics = calculateCitationMetrics(
    testCase.expectedCitations,
    response
  );
  
  // Check refusal correctness
  const actualRefusal = response.confidence === 'none' || 
                        response.answer.includes('No dispongo de información') ||
                        response.answer.includes('No he encontrado información');
  const expectedRefusal = testCase.shouldRefuse ?? false;
  const refusalCorrectness = actualRefusal === expectedRefusal;
  
  // Determine if case passed
  let passed = true;
  
  // If should refuse, check refusal
  if (testCase.shouldRefuse) {
    passed = refusalCorrectness;
  } 
  // If expects citations, check accuracy
  else if (testCase.expectedCitations && testCase.expectedCitations.length > 0) {
    // Pass if at least 50% of expected citations are found
    passed = citationMetrics.citationAccuracy >= 0.5;
  }
  
  const metrics: EvaluationMetrics = {
    ...citationMetrics,
    refusalCorrectness,
    retrievalSimilarityTop1,
    latencyMs,
    passed,
  };
  
  return {
    caseId: testCase.id,
    question: testCase.question,
    response,
    metrics,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate aggregated metrics from results
 */
function calculateAggregatedMetrics(results: EvaluationResult[]): AggregatedMetrics {
  const totalCases = results.length;
  const passedCases = results.filter(r => r.metrics.passed).length;
  const failedCases = totalCases - passedCases;
  const passRate = totalCases > 0 ? passedCases / totalCases : 0;
  
  const avgCitationAccuracy = results.reduce((sum, r) => sum + r.metrics.citationAccuracy, 0) / totalCases;
  const avgCitationCoverage = results.reduce((sum, r) => sum + r.metrics.citationCoverage, 0) / totalCases;
  const avgCitationPrecision = results.reduce((sum, r) => sum + r.metrics.citationPrecision, 0) / totalCases;
  const avgRetrievalSimilarity = results.reduce((sum, r) => sum + r.metrics.retrievalSimilarityTop1, 0) / totalCases;
  const avgLatencyMs = results.reduce((sum, r) => sum + r.metrics.latencyMs, 0) / totalCases;
  
  const latencies = results.map(r => r.metrics.latencyMs);
  const minLatencyMs = Math.min(...latencies);
  const maxLatencyMs = Math.max(...latencies);
  
  return {
    totalCases,
    passedCases,
    failedCases,
    passRate,
    avgCitationAccuracy,
    avgCitationCoverage,
    avgCitationPrecision,
    avgRetrievalSimilarity,
    avgLatencyMs,
    minLatencyMs,
    maxLatencyMs,
  };
}

/**
 * Run evaluation on entire dataset
 */
export async function runEvaluation(
  config: EvaluationConfig = {}
): Promise<EvaluationReport> {
  const startTime = Date.now();
  const results: EvaluationResult[] = [];
  
  console.log(`🔍 Running evaluation on ${goldenDataset.length} cases...\n`);
  
  // Run cases sequentially to avoid rate limiting
  for (const testCase of goldenDataset) {
    if (config.verbose) {
      console.log(`Running case ${testCase.id}: ${testCase.question.slice(0, 60)}...`);
    }
    
    try {
      const result = await runEvaluationCase(testCase);
      results.push(result);
      
      if (config.verbose) {
        const status = result.metrics.passed ? '✅' : '❌';
        console.log(`  ${status} ${result.metrics.passed ? 'PASSED' : 'FAILED'}`);
      }
    } catch (error) {
      console.error(`  ❌ ERROR running case ${testCase.id}:`, error);
      // Create a failed result
      results.push({
        caseId: testCase.id,
        question: testCase.question,
        response: {
          answer: 'ERROR',
          sources: [],
          confidence: 'none',
        },
        metrics: {
          citationAccuracy: 0,
          citationCoverage: 0,
          citationPrecision: 0,
          refusalCorrectness: false,
          retrievalSimilarityTop1: 0,
          latencyMs: 0,
          passed: false,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  const totalDuration = Date.now() - startTime;
  const aggregated = calculateAggregatedMetrics(results);
  
  const report: EvaluationReport = {
    timestamp: new Date().toISOString(),
    results,
    aggregated,
    metadata: {
      totalDuration,
      datasetVersion: DATASET_VERSION,
    },
  };
  
  return report;
}
