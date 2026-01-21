/**
 * Types for the LegalBot RAG system
 */

export interface LegalChunk {
  id: string;
  text: string;
  metadata: LegalMetadata;
}

export interface LegalMetadata {
  law: string;
  lawFullName: string;
  title?: string;
  chapter?: string;
  article: string;
  articleTitle: string;
  sourceFile: string;
}

export interface EmbeddedChunk extends LegalChunk {
  embedding: number[];
}

export interface RetrievalResult {
  chunk: LegalChunk;
  score: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  question: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  answer: string;
  sources: SourceCitation[];
  confidence: 'high' | 'medium' | 'low' | 'none';
}

export interface SourceCitation {
  article: string;
  law: string;
  excerpt: string;
}

export interface RAGConfig {
  embeddingModel: string;
  chatModel: string;
  maxChunks: number;
  similarityThreshold: number;
}
