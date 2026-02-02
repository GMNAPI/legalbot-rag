/**
 * Reranker - Optional second-pass ranking for better precision
 *
 * This is a simple keyword-based reranker. For production, consider:
 * - Cohere Rerank API
 * - Cross-encoder models
 * - BM25 hybrid search
 */

import type { RetrievalResult } from '../types.js';

/**
 * Legal term boost mapping
 * Maps specific legal terms to their corresponding articles for targeted boosting
 */
const LEGAL_TERM_BOOST: Record<string, { article: string; law: string; boost: number }[]> = {
  // LAU - Subarriendo
  'subarrendar': [{ article: 'Artículo 8', law: 'LAU', boost: 0.15 }],
  'subarriendo': [{ article: 'Artículo 8', law: 'LAU', boost: 0.15 }],
  'subarrendamiento': [{ article: 'Artículo 8', law: 'LAU', boost: 0.15 }],

  // LAU - Preaviso y duración
  'preaviso': [{ article: 'Artículo 10', law: 'LAU', boost: 0.12 }],
  'renovación': [{ article: 'Artículo 10', law: 'LAU', boost: 0.10 }],
  'prórroga': [{ article: 'Artículo 10', law: 'LAU', boost: 0.12 }],
  'duración': [{ article: 'Artículo 9', law: 'LAU', boost: 0.10 }],

  // LAU - Reparaciones
  'reparaciones': [
    { article: 'Artículo 21', law: 'LAU', boost: 0.12 },
    { article: 'Artículo 22', law: 'LAU', boost: 0.10 },
  ],
  'conservación': [{ article: 'Artículo 21', law: 'LAU', boost: 0.12 }],
  'obras': [{ article: 'Artículo 22', law: 'LAU', boost: 0.12 }],

  // LPH - Coeficientes y cuotas
  'coeficiente': [{ article: 'Artículo 5', law: 'LPH', boost: 0.12 }],
  'coeficientes': [{ article: 'Artículo 5', law: 'LPH', boost: 0.12 }],
  'cuota': [{ article: 'Artículo 5', law: 'LPH', boost: 0.10 }],
  'participación': [{ article: 'Artículo 5', law: 'LPH', boost: 0.10 }],

  // LPH - Gastos comunidad
  'comunidad': [{ article: 'Artículo 9', law: 'LPH', boost: 0.08 }],
  'gastos': [{ article: 'Artículo 9', law: 'LPH', boost: 0.08 }],
};

/**
 * Rerank results based on keyword matching
 * Boosts chunks that contain exact query terms and legal term mappings
 */
export function rerank(
  results: RetrievalResult[],
  query: string
): RetrievalResult[] {
  const queryTerms = extractKeyTerms(query);

  const scored = results.map(result => {
    let boost = 0;

    // Boost for exact keyword matches
    for (const term of queryTerms) {
      const lowerText = result.chunk.text.toLowerCase();
      if (lowerText.includes(term)) {
        boost += 0.1;
      }

      // Extra boost for article title matches
      if (result.chunk.metadata.articleTitle.toLowerCase().includes(term)) {
        boost += 0.15;
      }

      // Legal term boost: boost specific articles for domain-specific terms
      const legalBoosts = LEGAL_TERM_BOOST[term];
      if (legalBoosts) {
        for (const legalBoost of legalBoosts) {
          const articleTitle = result.chunk.metadata.articleTitle;
          const law = result.chunk.metadata.law;

          // Match if this chunk is the target article
          if (
            articleTitle.includes(legalBoost.article) &&
            law === legalBoost.law
          ) {
            boost += legalBoost.boost;
          }
        }
      }
    }

    return {
      ...result,
      score: Math.min(1, result.score + boost), // Cap at 1
    };
  });

  // Sort by new score
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Extract key terms from a query (simple tokenization)
 */
function extractKeyTerms(query: string): string[] {
  // Remove common Spanish stopwords
  const stopwords = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'de', 'del', 'al', 'a', 'en', 'con', 'por', 'para',
    'que', 'qué', 'cual', 'cuál', 'como', 'cómo',
    'es', 'son', 'está', 'están', 'hay',
    'se', 'su', 'sus', 'mi', 'mis', 'tu', 'tus',
    'y', 'o', 'pero', 'si', 'no',
    'puedo', 'puede', 'debo', 'debe', 'necesito',
    'cuánto', 'cuántos', 'cuánta', 'cuántas',
  ]);

  return query
    .toLowerCase()
    .replace(/[¿?¡!.,;:()]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2 && !stopwords.has(term));
}

/**
 * Filter results below a similarity threshold
 */
export function filterByThreshold(
  results: RetrievalResult[],
  threshold: number
): RetrievalResult[] {
  return results.filter(r => r.score >= threshold);
}

/**
 * Deduplicate results that are too similar to each other
 * Useful when overlap context creates near-duplicate chunks
 */
export function deduplicateResults(
  results: RetrievalResult[],
  maxOverlap: number = 0.8
): RetrievalResult[] {
  const unique: RetrievalResult[] = [];

  for (const result of results) {
    const isDuplicate = unique.some(existing =>
      textSimilarity(existing.chunk.text, result.chunk.text) > maxOverlap
    );

    if (!isDuplicate) {
      unique.push(result);
    }
  }

  return unique;
}

/**
 * Simple text similarity based on word overlap (Jaccard)
 */
function textSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}
