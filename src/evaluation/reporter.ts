/**
 * Evaluation reporter
 * 
 * Formats and exports evaluation results to console and JSON
 */

import fs from 'fs';
import path from 'path';
import type { EvaluationResult, EvaluationReport } from './types.js';
import { calculateAggregatedMetrics } from './runner.js';

/**
 * Format a number as a percentage
 */
function formatPercent(value: number): string {
  return (value * 100).toFixed(0) + '%';
}

/**
 * Format a number to 2 decimal places
 */
function formatNumber(value: number): string {
  return value.toFixed(2);
}

/**
 * Truncate text to a maximum length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format results as a console table
 */
export function formatReport(results: EvaluationResult[]): void {
  console.log('\n' + '═'.repeat(80));
  console.log('              LegalBot RAG - Evaluation Report');
  console.log('═'.repeat(80) + '\n');

  if (results.length === 0) {
    console.log('No results to display.\n');
    return;
  }

  // Individual results table
  console.log('Evaluation Results:\n');
  console.log('┌' + '─'.repeat(78) + '┐');
  console.log(
    '│ ' +
    'Case ID'.padEnd(15) +
    '│ ' +
    'Citation Acc'.padEnd(13) +
    '│ ' +
    'Cite Cov'.padEnd(10) +
    '│ ' +
    'Latency'.padEnd(9) +
    '│ ' +
    'Status'.padEnd(8) +
    '│'
  );
  console.log('├' + '─'.repeat(78) + '┤');

  for (const result of results) {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const statusColor = result.passed ? status : status;
    
    console.log(
      '│ ' +
      result.case.id.padEnd(15) +
      '│ ' +
      formatPercent(result.metrics.citationAccuracy).padEnd(13) +
      '│ ' +
      formatPercent(result.metrics.citationCoverage).padEnd(10) +
      '│ ' +
      `${Math.round(result.metrics.latencyMs)}ms`.padEnd(9) +
      '│ ' +
      statusColor.padEnd(8) +
      '│'
    );
  }

  console.log('└' + '─'.repeat(78) + '┘\n');

  // Summary statistics
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.length - passedCount;
  const aggregated = calculateAggregatedMetrics(results);

  console.log('Summary:\n');
  console.log(`  Total Cases:              ${results.length}`);
  console.log(`  Passed:                   ${passedCount} (${formatPercent(passedCount / results.length)})`);
  console.log(`  Failed:                   ${failedCount} (${formatPercent(failedCount / results.length)})`);
  console.log();
  console.log(`  Avg Citation Accuracy:    ${formatPercent(aggregated.avgCitationAccuracy)}`);
  console.log(`  Avg Citation Coverage:    ${formatPercent(aggregated.avgCitationCoverage)}`);
  console.log(`  Refusal Correctness:      ${formatPercent(aggregated.refusalCorrectness)}`);
  console.log(`  Avg Retrieval Sim (Top1): ${formatNumber(aggregated.avgRetrievalSimilarityTop1)}`);
  console.log(`  Avg Latency:              ${Math.round(aggregated.avgLatencyMs)}ms`);
  console.log(`  Min Latency:              ${Math.round(aggregated.minLatencyMs)}ms`);
  console.log(`  Max Latency:              ${Math.round(aggregated.maxLatencyMs)}ms`);
  console.log();

  // Failed cases details
  const failedCases = results.filter(r => !r.passed);
  if (failedCases.length > 0) {
    console.log('Failed Cases:\n');
    for (const result of failedCases) {
      console.log(`  ${result.case.id}: ${truncate(result.case.question, 60)}`);
      console.log(`    - Citation Accuracy: ${formatPercent(result.metrics.citationAccuracy)}`);
      console.log(`    - Citation Coverage: ${formatPercent(result.metrics.citationCoverage)}`);
      console.log(`    - Refusal Correct:   ${result.metrics.refusalCorrectness === 1 ? 'Yes' : 'No'}`);
      console.log();
    }
  }
}

/**
 * Build a complete evaluation report
 */
export function buildEvaluationReport(results: EvaluationResult[]): EvaluationReport {
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.length - passedCount;
  const aggregated = calculateAggregatedMetrics(results);

  return {
    timestamp: new Date().toISOString(),
    totalCases: results.length,
    passedCases: passedCount,
    failedCases: failedCount,
    metrics: aggregated,
    results
  };
}

/**
 * Export results to JSON file
 */
export function exportJSON(results: EvaluationResult[], filepath: string): void {
  const report = buildEvaluationReport(results);

  // Ensure directory exists
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write JSON file
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\nReport exported to: ${filepath}\n`);
}

/**
 * Generate a timestamped filename for the report
 */
export function generateReportFilename(): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `reports/eval-${timestamp}.json`;
}
