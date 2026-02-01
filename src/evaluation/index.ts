/**
 * Evaluation CLI
 * 
 * Command-line interface for running evaluations
 */

import 'dotenv/config';
import { evaluationDataset } from './dataset.js';
import { runEvaluation } from './runner.js';
import { formatReport, exportJSON, generateReportFilename } from './reporter.js';
import type { EvaluationOptions } from './types.js';

/**
 * Parse command line arguments
 */
function parseArgs(): EvaluationOptions {
  const args = process.argv.slice(2);
  const options: EvaluationOptions = {
    exportJson: true,
    exportPath: generateReportFilename()
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--tags' || arg === '-t') {
      const tags = args[++i];
      if (tags) {
        options.filterTags = tags.split(',').map(t => t.trim());
      }
    } else if (arg === '--max' || arg === '-m') {
      const max = parseInt(args[++i] ?? '0', 10);
      if (max > 0) {
        options.maxCases = max;
      }
    } else if (arg === '--no-export') {
      options.exportJson = false;
    } else if (arg === '--output' || arg === '-o') {
      const output = args[++i];
      if (output) {
        options.exportPath = output;
      }
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
LegalBot RAG - Evaluation CLI

Usage:
  pnpm eval [options]

Options:
  -t, --tags <tags>       Filter cases by tags (comma-separated)
                          Example: --tags LAU,rental

  -m, --max <number>      Run only first N cases
                          Example: --max 5

  -o, --output <path>     Output path for JSON report
                          Default: reports/eval-YYYY-MM-DD.json

  --no-export            Don't export JSON report

  -h, --help             Show this help message

Examples:
  pnpm eval                          # Run all cases
  pnpm eval --tags LAU               # Run only LAU cases
  pnpm eval --max 5                  # Run first 5 cases
  pnpm eval --tags refusal --max 3   # Run first 3 refusal cases
  pnpm eval --no-export              # Don't save JSON report
`);
}

/**
 * Main evaluation function
 */
async function main(): Promise<void> {
  console.log('Starting LegalBot RAG Evaluation...\n');

  const options = parseArgs();

  // Validate OpenAI API key
  if (!process.env['OPENAI_API_KEY']) {
    console.error('Error: OPENAI_API_KEY environment variable is not set.');
    console.error('Please set it in your .env file or environment.');
    process.exit(1);
  }

  try {
    // Run evaluation
    const results = await runEvaluation(evaluationDataset, options);

    // Display results in console
    formatReport(results);

    // Export to JSON if enabled
    if (options.exportJson && options.exportPath) {
      exportJSON(results, options.exportPath);
    }

    // Exit with appropriate code
    const failedCount = results.filter(r => !r.passed).length;
    if (failedCount > 0) {
      console.log(`⚠️  ${failedCount} case(s) failed.\n`);
      process.exit(1);
    } else {
      console.log('✅ All cases passed!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error running evaluation:', error);
    process.exit(1);
  }
}

// Run the CLI
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
