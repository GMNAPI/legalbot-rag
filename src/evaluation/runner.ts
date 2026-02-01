/**
 * Evaluation runner
 * 
 * Executes evaluation cases against the real RAG pipeline
 * and calculates metrics
 */

import { query, retrieve } from '../rag.js';
import { extractCitations } from '../generation/responseValidator.js';
import type {
  EvaluationCase,
  EvaluationMetrics,
  EvaluationResult,
  EvaluationOptions,
  AggregatedMetrics
} from './types.js';
import type { RetrievalResult } from '../types.js';

/**
 * Calculate citation accuracy
 * Ratio of valid citations to total citations in the response
 */
function calculateCitationAccuracy(
  responseCitations: string[],
  retrievedChunks: RetrievalResult[]
): number {
  if (responseCitations.length === 0) {
    return 0;
  }

  let validCount = 0;
  for (const citation of responseCitations) {
    // Extract article number from citation string like "Artículo 9, LAU"
    const articleMatch = citation.match(/Artículo\s+(\d+(?:\s*bis)?)/i);
    if (!articleMatch) continue;

    const articleNum = articleMatch[1];
    
    // Check if any retrieved chunk matches this article
    const isValid = retrievedChunks.some(result => {
      const chunkArticle = result.chunk.metadata.article;
      return chunkArticle.toLowerCase().includes(articleNum?.toLowerCase() ?? '');
    });

    if (isValid) {
      validCount++;
    }
  }

  return validCount / responseCitations.length;
}

/**
 * Calculate citation coverage
 * Ratio of expected citations that appear in the response
 */
function calculateCitationCoverage(
  responseCitations: string[],
  expectedCitations: string[]
): number {
  if (expectedCitations.length === 0) {
    return 1; // No citations expected, so coverage is perfect
  }

  let foundCount = 0;
  for (const expected of expectedCitations) {
    // Normalize expected citation (e.g., "Artículo 9, LAU")
    const expectedArticleMatch = expected.match(/Artículo\s+(\d+(?:\s*bis)?)/i);
    if (!expectedArticleMatch) continue;

    const expectedArticleNum = expectedArticleMatch[1];

    // Check if response contains this article
    const found = responseCitations.some(respCitation => {
      const respArticleMatch = respCitation.match(/Artículo\s+(\d+(?:\s*bis)?)/i);
      if (!respArticleMatch) return false;
      return respArticleMatch[1]?.toLowerCase() === expectedArticleNum?.toLowerCase();
    });

    if (found) {
      foundCount++;
    }
  }

  return foundCount / expectedCitations.length;
}

/**
 * Calculate refusal correctness
 * 1 if the refusal behavior matches expectation, 0 otherwise
 */
function calculateRefusalCorrectness(
  shouldRefuse: boolean,
  responseText: string,
  confidence: string
): number {
  const isRefusal = 
    confidence === 'none' ||
    responseText.includes('No he encontrado información') ||
    responseText.includes('no tengo información') ||
    responseText.includes('No dispongo de información');

  return (shouldRefuse === isRefusal) ? 1 : 0;
}

/**
 * Evaluate a single test case
 */
export async function evaluateCase(
  testCase: EvaluationCase
): Promise<EvaluationResult> {
  const startTime = performance.now();

  try {
    // Execute the real RAG pipeline
    const response = await query(testCase.question);
    
    // Get retrieval results for analysis
    const retrievedChunks = await retrieve(testCase.question);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Extract citations from response
    const responseCitations = extractCitations(response.answer);
    const citationStrings = responseCitations.map(c => `${c.article}, ${c.law}`);

    // Calculate metrics
    const citationAccuracy = calculateCitationAccuracy(
      citationStrings,
      retrievedChunks
    );

    const citationCoverage = calculateCitationCoverage(
      citationStrings,
      testCase.expectedCitations
    );

    const refusalCorrectness = calculateRefusalCorrectness(
      testCase.shouldRefuse,
      response.answer,
      response.confidence
    );

    const retrievalSimilarityTop1 = retrievedChunks[0]?.score ?? 0;

    const metrics: EvaluationMetrics = {
      citationAccuracy,
      citationCoverage,
      refusalCorrectness,
      retrievalSimilarityTop1,
      latencyMs: duration
    };

    // Determine if the case passed
    // A case passes if:
    // - For refusal cases: refusal was correct
    // - For normal cases: citation coverage > 0 and accuracy > 0.5
    let passed: boolean;
    if (testCase.shouldRefuse) {
      passed = refusalCorrectness === 1;
    } else {
      passed = citationCoverage > 0 && citationAccuracy >= 0.5;
    }

    return {
      case: testCase,
      metrics,
      response,
      retrievedChunks,
      duration,
      passed
    };
  } catch (error) {
    // Handle errors gracefully
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.error(`Error evaluating case ${testCase.id}:`, error);

    // Return a failed result
    return {
      case: testCase,
      metrics: {
        citationAccuracy: 0,
        citationCoverage: 0,
        refusalCorrectness: 0,
        retrievalSimilarityTop1: 0,
        latencyMs: duration
      },
      response: {
        answer: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sources: [],
        confidence: 'none'
      },
      retrievedChunks: [],
      duration,
      passed: false
    };
  }
}

/**
 * Run evaluation on multiple test cases
 */
export async function runEvaluation(
  cases: EvaluationCase[],
  options: EvaluationOptions = {}
): Promise<EvaluationResult[]> {
  let filteredCases = cases;

  // Filter by tags if specified
  if (options.filterTags && options.filterTags.length > 0) {
    filteredCases = cases.filter(c =>
      options.filterTags!.some(tag => c.tags.includes(tag))
    );
  }

  // Limit number of cases if specified
  if (options.maxCases) {
    filteredCases = filteredCases.slice(0, options.maxCases);
  }

  console.log(`Running evaluation on ${filteredCases.length} cases...`);

  const results: EvaluationResult[] = [];

  // Run cases sequentially to avoid rate limiting
  for (const testCase of filteredCases) {
    console.log(`Evaluating: ${testCase.id} - ${testCase.question.slice(0, 60)}...`);
    const result = await evaluateCase(testCase);
    results.push(result);
  }

  return results;
}

/**
 * Calculate aggregated metrics from results
 */
export function calculateAggregatedMetrics(
  results: EvaluationResult[]
): AggregatedMetrics {
  if (results.length === 0) {
    return {
      avgCitationAccuracy: 0,
      avgCitationCoverage: 0,
      refusalCorrectness: 0,
      avgRetrievalSimilarityTop1: 0,
      avgLatencyMs: 0,
      minLatencyMs: 0,
      maxLatencyMs: 0
    };
  }

  const citationAccuracies = results.map(r => r.metrics.citationAccuracy);
  const citationCoverages = results.map(r => r.metrics.citationCoverage);
  const refusalResults = results.map(r => r.metrics.refusalCorrectness);
  const retrievalScores = results.map(r => r.metrics.retrievalSimilarityTop1);
  const latencies = results.map(r => r.metrics.latencyMs);

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const avg = (arr: number[]) => arr.length > 0 ? sum(arr) / arr.length : 0;

  return {
    avgCitationAccuracy: avg(citationAccuracies),
    avgCitationCoverage: avg(citationCoverages),
    refusalCorrectness: avg(refusalResults),
    avgRetrievalSimilarityTop1: avg(retrievalScores),
    avgLatencyMs: avg(latencies),
    minLatencyMs: Math.min(...latencies),
    maxLatencyMs: Math.max(...latencies)
  };
}
