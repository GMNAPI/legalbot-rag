/**
 * Vector Store - Chroma integration for storing and retrieving embeddings
 *
 * Supports two modes:
 * 1. Server mode: Connects to Chroma server (production)
 * 2. Ephemeral mode: In-memory storage (development/demo without Docker)
 */

import { ChromaClient, Collection, IncludeEnum } from 'chromadb';
import { chromaConfig } from '../config.js';
import type { LegalChunk, EmbeddedChunk, RetrievalResult } from '../types.js';

let client: ChromaClient | null = null;
let collection: Collection | null = null;
let isEphemeral = false;

/**
 * Initialize the Chroma client and collection
 * Falls back to ephemeral mode if server is unavailable
 */
export async function initVectorStore(): Promise<void> {
  // Try server mode first
  try {
    client = new ChromaClient({
      path: `http://${chromaConfig.host}:${chromaConfig.port}`,
    });

    // Test connection
    await client.heartbeat();

    collection = await client.getOrCreateCollection({
      name: chromaConfig.collection,
      metadata: {
        description: 'Spanish real estate legal documents',
        'hnsw:space': 'cosine',
      },
    });

    isEphemeral = false;
    console.log(`Vector store initialized (server mode): "${chromaConfig.collection}"`);
  } catch {
    // Fall back to ephemeral mode
    console.log('Chroma server not available, using ephemeral mode (in-memory)');

    client = new ChromaClient();

    collection = await client.getOrCreateCollection({
      name: chromaConfig.collection,
      metadata: {
        description: 'Spanish real estate legal documents',
        'hnsw:space': 'cosine',
      },
    });

    isEphemeral = true;
    console.log(`Vector store initialized (ephemeral mode): "${chromaConfig.collection}"`);
    console.log('Note: Data will be lost when the process exits.');
  }
}

/**
 * Check if running in ephemeral mode
 */
export function isEphemeralMode(): boolean {
  return isEphemeral;
}

/**
 * Get the current collection (initialize if needed)
 */
async function getCollection(): Promise<Collection> {
  if (!collection) {
    await initVectorStore();
  }
  if (!collection) {
    throw new Error('Failed to initialize vector store');
  }
  return collection;
}

/**
 * Add embedded chunks to the vector store
 */
export async function addChunks(chunks: EmbeddedChunk[]): Promise<void> {
  const coll = await getCollection();

  const ids = chunks.map(c => c.id);
  const embeddings = chunks.map(c => c.embedding);
  const documents = chunks.map(c => c.text);
  const metadatas = chunks.map(c => ({
    law: c.metadata.law,
    lawFullName: c.metadata.lawFullName,
    title: c.metadata.title ?? '',
    chapter: c.metadata.chapter ?? '',
    article: c.metadata.article,
    articleTitle: c.metadata.articleTitle,
    sourceFile: c.metadata.sourceFile,
  }));

  // Upsert to handle duplicates
  await coll.upsert({
    ids,
    embeddings,
    documents,
    metadatas,
  });

  console.log(`Added ${chunks.length} chunks to vector store`);
}

/**
 * Query the vector store for similar chunks
 */
export async function queryChunks(
  queryEmbedding: number[],
  topK: number = 5,
  filter?: Record<string, string>
): Promise<RetrievalResult[]> {
  const coll = await getCollection();

  const results = await coll.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    where: filter,
    include: [IncludeEnum.Documents, IncludeEnum.Metadatas, IncludeEnum.Distances],
  });

  const retrievalResults: RetrievalResult[] = [];

  const documents = results.documents?.[0] ?? [];
  const metadatas = results.metadatas?.[0] ?? [];
  const distances = results.distances?.[0] ?? [];
  const ids = results.ids?.[0] ?? [];

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const meta = metadatas[i];
    const distance = distances[i];
    const id = ids[i];

    if (doc && meta && distance !== undefined && id) {
      // Convert distance to similarity (Chroma uses L2 distance by default)
      // For cosine space: similarity = 1 - distance
      const score = 1 - distance;

      retrievalResults.push({
        chunk: {
          id,
          text: doc,
          metadata: {
            law: String(meta['law'] ?? ''),
            lawFullName: String(meta['lawFullName'] ?? ''),
            title: meta['title'] ? String(meta['title']) : undefined,
            chapter: meta['chapter'] ? String(meta['chapter']) : undefined,
            article: String(meta['article'] ?? ''),
            articleTitle: String(meta['articleTitle'] ?? ''),
            sourceFile: String(meta['sourceFile'] ?? ''),
          },
        },
        score,
      });
    }
  }

  return retrievalResults;
}

/**
 * Delete all chunks from a specific law
 */
export async function deleteByLaw(lawCode: string): Promise<void> {
  const coll = await getCollection();

  await coll.delete({
    where: { law: lawCode },
  });

  console.log(`Deleted all chunks for law: ${lawCode}`);
}

/**
 * Get collection statistics
 */
export async function getStats(): Promise<{ count: number }> {
  const coll = await getCollection();
  const count = await coll.count();
  return { count };
}

/**
 * Clear all data from the collection
 */
export async function clearCollection(): Promise<void> {
  if (!client) {
    await initVectorStore();
  }
  if (client) {
    await client.deleteCollection({ name: chromaConfig.collection });
    collection = null;
    console.log('Collection cleared');
  }
}
