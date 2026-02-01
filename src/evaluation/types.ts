/**
 * Evaluation System Types
 */

import type { ChatResponse } from '../types.js';

/**
 * Single evaluation case in the golden dataset
 */
export interface EvaluationCase {
  id: string;
  question: string;
  tags: string[];
  
  // Expected behavior
  expectedCitations?: string[]; // e.g., ["Artículo 9, LAU", "Artículo 10, LAU"]
  shouldRefuse?: boolean; // True if the bot should respond "No dispongo de información"
  
  // Optional metadata
  notes?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

/**
 * Result of running a single evaluation case
 */
export interface EvaluationResult {
  caseId: string;
  question: string;
  response: ChatResponse;
  metrics: EvaluationMetrics;
  timestamp: string;
}

/**
 * Metrics for a single evaluation run
 */
export interface EvaluationMetrics {
  // Citation metrics
  citationAccuracy: number; // % of expected citations that were found
  citationCoverage: number; // % of retrieved citations vs expected
  citationPrecision: number; // % of returned citations that are valid
  
  // Refusal correctness
  refusalCorrectness: boolean; // True if shouldRefuse matches actual behavior
  
  // Retrieval quality
  retrievalSimilarityTop1: number; // Similarity score of top result (0-1)
  
  // Performance
  latencyMs: number;
  
  // Overall
  passed: boolean; // True if all critical checks passed
}

/**
 * Aggregated metrics across multiple runs
 */
export interface AggregatedMetrics {
  totalCases: number;
  passedCases: number;
  failedCases: number;
  passRate: number;
  
  // Average metrics
  avgCitationAccuracy: number;
  avgCitationCoverage: number;
  avgCitationPrecision: number;
  avgRetrievalSimilarity: number;
  avgLatencyMs: number;
  
  // Min/Max
  minLatencyMs: number;
  maxLatencyMs: number;
}

/**
 * Complete evaluation report
 */
export interface EvaluationReport {
  timestamp: string;
  results: EvaluationResult[];
  aggregated: AggregatedMetrics;
  metadata: {
    totalDuration: number;
    datasetVersion: string;
  };
}

/**
 * Configuration for evaluation runner
 */
export interface EvaluationConfig {
  maxConcurrency?: number; // Number of parallel evaluations
  verbose?: boolean;
  outputPath?: string; // Path to save JSON report
}
