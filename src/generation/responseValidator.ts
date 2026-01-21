/**
 * Response Validator
 *
 * Validates that generated responses:
 * 1. Contain proper citations
 * 2. Citations reference articles in the context
 * 3. Response indicates low confidence when appropriate
 */

import type { RetrievalResult, SourceCitation, ChatResponse } from '../types.js';

/**
 * Extract citations from a response text
 */
export function extractCitations(response: string): SourceCitation[] {
  // Match patterns like [Artículo 9, LAU] or [Art. 21, Ley 29/1994]
  const citationRegex = /\[(?:Artículo|Art\.?)\s*(\d+(?:\s*bis)?),\s*([^\]]+)\]/gi;
  const citations: SourceCitation[] = [];
  const seen = new Set<string>();

  let match;
  while ((match = citationRegex.exec(response)) !== null) {
    const article = `Artículo ${match[1]}`;
    const law = match[2]?.trim() ?? '';
    const key = `${article}-${law}`;

    if (!seen.has(key)) {
      seen.add(key);
      citations.push({
        article,
        law,
        excerpt: '', // Will be filled by validateCitations
      });
    }
  }

  return citations;
}

/**
 * Validate that citations exist in the retrieved context
 */
export function validateCitations(
  citations: SourceCitation[],
  context: RetrievalResult[]
): { valid: SourceCitation[]; invalid: SourceCitation[] } {
  const valid: SourceCitation[] = [];
  const invalid: SourceCitation[] = [];

  for (const citation of citations) {
    const matchingChunk = context.find(result => {
      const meta = result.chunk.metadata;
      return (
        meta.article.toLowerCase() === citation.article.toLowerCase() ||
        meta.article.toLowerCase().includes(citation.article.split(' ')[1] ?? '')
      );
    });

    if (matchingChunk) {
      valid.push({
        ...citation,
        excerpt: matchingChunk.chunk.text.slice(0, 200) + '...',
      });
    } else {
      invalid.push(citation);
    }
  }

  return { valid, invalid };
}

/**
 * Determine confidence level based on retrieval scores and citations
 */
export function determineConfidence(
  context: RetrievalResult[],
  citations: SourceCitation[],
  responseText: string
): 'high' | 'medium' | 'low' | 'none' {
  // No context found
  if (context.length === 0) {
    return 'none';
  }

  // Check if response indicates no information
  if (responseText.includes('No dispongo de información') ||
      responseText.includes('no tengo información')) {
    return 'none';
  }

  // Calculate average relevance score
  const avgScore = context.reduce((sum, r) => sum + r.score, 0) / context.length;
  const topScore = context[0]?.score ?? 0;

  // No citations in response (suspicious)
  if (citations.length === 0) {
    return 'low';
  }

  // High confidence: top chunk is very relevant and has citations
  if (topScore >= 0.8 && citations.length > 0) {
    return 'high';
  }

  // Medium confidence: decent relevance with citations
  if (avgScore >= 0.6 && citations.length > 0) {
    return 'medium';
  }

  return 'low';
}

/**
 * Build the final response object with validation
 */
export function buildValidatedResponse(
  answer: string,
  context: RetrievalResult[]
): ChatResponse {
  const citations = extractCitations(answer);
  const { valid } = validateCitations(citations, context);
  const confidence = determineConfidence(context, valid, answer);

  return {
    answer,
    sources: valid,
    confidence,
  };
}

/**
 * Post-process response to add warnings if needed
 */
export function addWarningsIfNeeded(response: ChatResponse): ChatResponse {
  if (response.confidence === 'low') {
    return {
      ...response,
      answer: response.answer + '\n\n_Nota: Esta respuesta tiene confianza baja. Se recomienda verificar con un profesional._',
    };
  }

  if (response.confidence === 'none') {
    return {
      ...response,
      answer: 'No he encontrado información relevante en mi base de conocimiento legal para responder a esta pregunta. Te recomiendo consultar con un abogado especializado en derecho inmobiliario.',
    };
  }

  return response;
}
