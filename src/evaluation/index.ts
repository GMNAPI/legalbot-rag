#!/usr/bin/env node
/**
 * Evaluation CLI Entry Point
 * 
 * Usage:
 *   pnpm eval               # Run full evaluation
 *   pnpm eval --verbose     # Run with detailed output
 */

import 'dotenv/config';
import { runEvaluation } from './runner.js';
import { outputReport } from './reporter.js';

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const outputPath = args.find(arg => arg.startsWith('--output='))?.split('=')[1];
  
  console.log('🚀 LegalBot RAG Evaluation System');
  console.log('');
  
  try {
    // Run evaluation
    const report = await runEvaluation({ verbose });
    
    // Output results
    outputReport(report, { verbose, outputPath });
    
    // Exit with appropriate code
    const passRate = report.aggregated.passRate;
    if (passRate === 1.0) {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    } else if (passRate >= 0.7) {
      console.log('\n⚠️  Some tests failed, but pass rate is acceptable (>70%)');
      process.exit(0);
    } else {
      console.log('\n❌ Too many failures. Pass rate below 70%.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Evaluation failed with error:');
    console.error(error);
    process.exit(1);
  }
}

main();
