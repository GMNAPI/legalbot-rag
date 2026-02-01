/**
 * Types for the evaluation system
 */

import type { ChatResponse, RetrievalResult } from '../types.js';

/**
 * A single test case in the evaluation dataset
 */
export interface EvaluationCase {
  /** Unique identifier for the case */
  id: string;
  /** The question to ask the RAG system */
  question: string;
  /** Expected citations that should appear in the response (e.g., ["Artículo 9, LAU"]) */
  expectedCitations: string[];
  /** Whether the system should refuse to answer (for out-of-scope questions) */
  shouldRefuse: boolean;
  /** Tags for categorization (e.g., ["LAU", "rental", "duration"]) */
  tags: string[];
  /** Optional additional metadata */
  metadata?: {
    /** Expected answer pattern or keywords */
    expectedKeywords?: string[];
    /** Notes about the test case */
    notes?: string;
  };
}

/**
 * Metrics calculated for a single evaluation case
 */
export interface EvaluationMetrics {
  /** Accuracy of citations (0-1): ratio of valid citations to total citations */
  citationAccuracy: number;
  /** Coverage of expected citations (0-1): ratio of found expected citations */
  citationCoverage: number;
  /** Whether refusal was correct (1) or incorrect (0) */
  refusalCorrectness: number;
  /** Similarity score of the top-1 retrieved chunk */
  retrievalSimilarityTop1: number;
  /** Time taken to process the query in milliseconds */
  latencyMs: number;
}

/**
 * Result of evaluating a single case
 */
export interface EvaluationResult {
  /** The test case that was evaluated */
  case: EvaluationCase;
  /** Calculated metrics */
  metrics: EvaluationMetrics;
  /** The response from the RAG system */
  response: ChatResponse;
  /** Retrieved chunks from the vector store */
  retrievedChunks: RetrievalResult[];
  /** Total duration of the evaluation in milliseconds */
  duration: number;
  /** Whether the case passed quality checks */
  passed: boolean;
}

/**
 * Aggregated metrics across all evaluation cases
 */
export interface AggregatedMetrics {
  /** Average citation accuracy across all cases */
  avgCitationAccuracy: number;
  /** Average citation coverage across all cases */
  avgCitationCoverage: number;
  /** Percentage of correct refusals */
  refusalCorrectness: number;
  /** Average top-1 retrieval similarity */
  avgRetrievalSimilarityTop1: number;
  /** Average latency in milliseconds */
  avgLatencyMs: number;
  /** Minimum latency in milliseconds */
  minLatencyMs: number;
  /** Maximum latency in milliseconds */
  maxLatencyMs: number;
}

/**
 * Complete evaluation report
 */
export interface EvaluationReport {
  /** Timestamp when the evaluation was run */
  timestamp: string;
  /** Total number of test cases */
  totalCases: number;
  /** Number of cases that passed */
  passedCases: number;
  /** Number of cases that failed */
  failedCases: number;
  /** Aggregated metrics */
  metrics: AggregatedMetrics;
  /** Individual results for each case */
  results: EvaluationResult[];
}

/**
 * Options for running evaluation
 */
export interface EvaluationOptions {
  /** Filter cases by tags */
  filterTags?: string[];
  /** Maximum number of cases to run (for testing) */
  maxCases?: number;
  /** Export results to JSON file */
  exportJson?: boolean;
  /** Path to export JSON file */
  exportPath?: string;
}
