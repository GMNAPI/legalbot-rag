/**
 * Evaluation Reporter
 * 
 * Formats and outputs evaluation results
 */

import fs from 'fs';
import path from 'path';
import type { EvaluationReport, EvaluationResult } from './types.js';

/**
 * Print a summary table to console
 */
export function printConsoleSummary(report: EvaluationReport): void {
  const { aggregated, metadata } = report;
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 EVALUATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Dataset Version: ${metadata.datasetVersion}`);
  console.log(`Total Duration:  ${(metadata.totalDuration / 1000).toFixed(2)}s`);
  console.log(`Timestamp:       ${report.timestamp}`);
  console.log('');
  
  // Overall metrics
  console.log('📈 Overall Metrics:');
  console.log(`  Total Cases:    ${aggregated.totalCases}`);
  console.log(`  Passed:         ${aggregated.passedCases} (${(aggregated.passRate * 100).toFixed(1)}%)`);
  console.log(`  Failed:         ${aggregated.failedCases}`);
  console.log('');
  
  // Citation metrics
  console.log('📝 Citation Metrics:');
  console.log(`  Accuracy:       ${(aggregated.avgCitationAccuracy * 100).toFixed(1)}%`);
  console.log(`  Coverage:       ${(aggregated.avgCitationCoverage * 100).toFixed(1)}%`);
  console.log(`  Precision:      ${(aggregated.avgCitationPrecision * 100).toFixed(1)}%`);
  console.log('');
  
  // Retrieval metrics
  console.log('🔍 Retrieval Metrics:');
  console.log(`  Avg Similarity: ${(aggregated.avgRetrievalSimilarity * 100).toFixed(1)}%`);
  console.log('');
  
  // Performance metrics
  console.log('⚡ Performance Metrics:');
  console.log(`  Avg Latency:    ${aggregated.avgLatencyMs.toFixed(0)}ms`);
  console.log(`  Min Latency:    ${aggregated.minLatencyMs.toFixed(0)}ms`);
  console.log(`  Max Latency:    ${aggregated.maxLatencyMs.toFixed(0)}ms`);
  console.log('');
  
  console.log('='.repeat(70));
}

/**
 * Print detailed results for failed cases
 */
export function printFailedCases(report: EvaluationReport): void {
  const failedResults = report.results.filter(r => !r.metrics.passed);
  
  if (failedResults.length === 0) {
    console.log('\n✅ All cases passed!');
    return;
  }
  
  console.log(`\n❌ Failed Cases (${failedResults.length}):`);
  console.log('='.repeat(70));
  
  for (const result of failedResults) {
    console.log(`\n[${result.caseId}] ${result.question}`);
    console.log(`  Confidence: ${result.response.confidence}`);
    console.log(`  Citations:  ${result.response.sources.length} found`);
    console.log(`  Metrics:`);
    console.log(`    - Citation Accuracy: ${(result.metrics.citationAccuracy * 100).toFixed(1)}%`);
    console.log(`    - Refusal Correct:   ${result.metrics.refusalCorrectness}`);
    console.log(`    - Retrieval Score:   ${(result.metrics.retrievalSimilarityTop1 * 100).toFixed(1)}%`);
    
    if (result.response.sources.length > 0) {
      console.log(`  Found Citations:`);
      for (const source of result.response.sources) {
        console.log(`    - ${source.article}, ${source.law}`);
      }
    }
  }
  
  console.log('');
}

/**
 * Save report to JSON file
 */
export function saveReportToFile(report: EvaluationReport, outputPath?: string): void {
  const defaultPath = path.join(
    process.cwd(),
    'reports',
    `eval-${new Date().toISOString().split('T')[0]}.json`
  );
  
  const filePath = outputPath ?? defaultPath;
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write report
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');
  
  console.log(`\n💾 Report saved to: ${filePath}`);
}

/**
 * Generate a simple text report
 */
export function generateTextReport(report: EvaluationReport): string {
  const lines: string[] = [];
  
  lines.push('# Evaluation Report');
  lines.push(`Date: ${report.timestamp}`);
  lines.push(`Dataset: ${report.metadata.datasetVersion}`);
  lines.push('');
  
  lines.push('## Summary');
  lines.push(`- Total Cases: ${report.aggregated.totalCases}`);
  lines.push(`- Passed: ${report.aggregated.passedCases} (${(report.aggregated.passRate * 100).toFixed(1)}%)`);
  lines.push(`- Failed: ${report.aggregated.failedCases}`);
  lines.push('');
  
  lines.push('## Metrics');
  lines.push(`- Citation Accuracy: ${(report.aggregated.avgCitationAccuracy * 100).toFixed(1)}%`);
  lines.push(`- Citation Coverage: ${(report.aggregated.avgCitationCoverage * 100).toFixed(1)}%`);
  lines.push(`- Retrieval Similarity: ${(report.aggregated.avgRetrievalSimilarity * 100).toFixed(1)}%`);
  lines.push(`- Avg Latency: ${report.aggregated.avgLatencyMs.toFixed(0)}ms`);
  lines.push('');
  
  const failedResults = report.results.filter(r => !r.metrics.passed);
  if (failedResults.length > 0) {
    lines.push('## Failed Cases');
    for (const result of failedResults) {
      lines.push(`- [${result.caseId}] ${result.question}`);
      lines.push(`  - Citation Accuracy: ${(result.metrics.citationAccuracy * 100).toFixed(1)}%`);
      lines.push(`  - Confidence: ${result.response.confidence}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Full report output (console + file)
 */
export function outputReport(report: EvaluationReport, config?: { verbose?: boolean; outputPath?: string }): void {
  // Print console summary
  printConsoleSummary(report);
  
  // Print failed cases if verbose
  if (config?.verbose) {
    printFailedCases(report);
  }
  
  // Save to file
  saveReportToFile(report, config?.outputPath);
}
