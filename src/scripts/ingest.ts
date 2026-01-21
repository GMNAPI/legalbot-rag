/**
 * Ingestion Script
 *
 * Loads legal documents, chunks them, generates embeddings,
 * and stores them in the vector database.
 *
 * Usage: pnpm ingest
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  loadDocumentsFromDirectory,
  detectLawInfo,
  chunkLegalDocument,
  addOverlapContext,
  embedChunks,
} from '../ingestion/index.js';
import { initVectorStore, addChunks, getStats, clearCollection } from '../retrieval/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data/laws');

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════');
  console.log('       LegalBot RAG - Document Ingestion           ');
  console.log('═══════════════════════════════════════════════════\n');

  // Check for --clear flag
  const shouldClear = process.argv.includes('--clear');

  // Initialize vector store
  console.log('1. Initializing vector store...');
  await initVectorStore();

  if (shouldClear) {
    console.log('   Clearing existing collection...');
    await clearCollection();
    await initVectorStore();
  }

  // Load documents
  console.log(`\n2. Loading documents from ${DATA_DIR}...`);
  const documents = await loadDocumentsFromDirectory(DATA_DIR);

  if (documents.length === 0) {
    console.log('   No documents found! Add .txt or .pdf files to data/laws/');
    console.log('   Example: data/laws/LAU.txt');
    process.exit(1);
  }

  console.log(`   Found ${documents.length} document(s)`);

  // Process each document
  let totalChunks = 0;

  for (const doc of documents) {
    console.log(`\n3. Processing: ${doc.filename}`);

    // Detect law info
    const lawInfo = detectLawInfo(doc.filename, doc.content);
    console.log(`   Detected law: ${lawInfo.code} - ${lawInfo.fullName}`);

    // Chunk the document
    let chunks = chunkLegalDocument(doc.content, lawInfo, doc.filename);
    console.log(`   Created ${chunks.length} chunks`);

    // Add overlap context
    chunks = addOverlapContext(chunks, 150);
    console.log('   Added overlap context');

    // Generate embeddings
    console.log('   Generating embeddings...');
    const embeddedChunks = await embedChunks(chunks);

    // Store in vector database
    console.log('   Storing in vector database...');
    await addChunks(embeddedChunks);

    totalChunks += chunks.length;
  }

  // Final stats
  const stats = await getStats();
  console.log('\n═══════════════════════════════════════════════════');
  console.log('                    Summary                        ');
  console.log('═══════════════════════════════════════════════════');
  console.log(`   Documents processed: ${documents.length}`);
  console.log(`   Total chunks created: ${totalChunks}`);
  console.log(`   Chunks in vector store: ${stats.count}`);
  console.log('\n   Ready for queries! Run: pnpm dev');
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch((error) => {
  console.error('Ingestion failed:', error);
  process.exit(1);
});
