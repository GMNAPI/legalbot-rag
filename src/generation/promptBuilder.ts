/**
 * Prompt Builder
 *
 * Constructs prompts with legal context for the LLM.
 * Key principles:
 * 1. Force citations to reduce hallucinations
 * 2. Limit scope to provided context
 * 3. Use clear, professional language
 */

import type { RetrievalResult, ChatMessage } from '../types.js';

/**
 * System prompt that defines the assistant's behavior
 */
const SYSTEM_PROMPT = `Eres un asistente legal especializado en derecho inmobiliario español.

REGLAS ESTRICTAS:
1. SOLO responde basándote en los artículos del CONTEXTO LEGAL proporcionado
2. SIEMPRE cita la fuente usando el formato: [Artículo X, Ley Y]
3. Si la información NO está en el contexto, responde: "No dispongo de información sobre este tema en mi base de conocimiento legal."
4. Usa lenguaje claro y accesible, evitando jerga legal innecesaria
5. Si hay varios artículos relevantes, cita todos los aplicables
6. NO inventes artículos ni información que no esté en el contexto

FORMATO DE RESPUESTA:
- Responde de forma directa y concisa
- Incluye las citas entre corchetes al final de cada afirmación legal
- Si aplica, menciona excepciones o matices importantes`;

/**
 * Build the full prompt with context and question
 */
export function buildPrompt(
  question: string,
  retrievedChunks: RetrievalResult[],
  conversationHistory?: ChatMessage[]
): ChatMessage[] {
  const messages: ChatMessage[] = [];

  // System message
  messages.push({
    role: 'system',
    content: SYSTEM_PROMPT,
  });

  // Add conversation history (if any, condensed)
  if (conversationHistory && conversationHistory.length > 0) {
    // Only keep last 4 turns to manage context window
    const recentHistory = conversationHistory.slice(-4);
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push(msg);
      }
    }
  }

  // Build context from retrieved chunks
  const context = buildContext(retrievedChunks);

  // User message with context
  const userMessage = `CONTEXTO LEGAL:
${context}

---

PREGUNTA DEL USUARIO:
${question}

Responde basándote EXCLUSIVAMENTE en el contexto legal proporcionado.`;

  messages.push({
    role: 'user',
    content: userMessage,
  });

  return messages;
}

/**
 * Build the context string from retrieved chunks
 */
function buildContext(chunks: RetrievalResult[]): string {
  if (chunks.length === 0) {
    return '[No se encontraron artículos relevantes]';
  }

  return chunks
    .map((result, index) => {
      const { chunk, score } = result;
      const { article, law, lawFullName, articleTitle } = chunk.metadata;

      // Include relevance indicator for debugging (can be removed in production)
      const relevanceMarker = score >= 0.8 ? '⚖️' : score >= 0.6 ? '📋' : '📄';

      return `${relevanceMarker} [${article}, ${law}] - ${lawFullName}
${articleTitle ? `Título: ${articleTitle}` : ''}

${chunk.text}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Build a condensed version of conversation history for context
 */
export function condenseHistory(history: ChatMessage[]): string {
  if (history.length === 0) return '';

  return history
    .filter(msg => msg.role !== 'system')
    .map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content.slice(0, 200)}...`)
    .join('\n');
}

/**
 * Generate a standalone question from conversation context
 * This helps when the user's question references previous messages
 */
export function buildStandaloneQuestion(
  currentQuestion: string,
  history: ChatMessage[]
): string {
  if (history.length === 0) return currentQuestion;

  // Simple heuristic: if question contains pronouns or references,
  // it might need context
  const needsContext = /\b(esto|eso|lo|la|el mismo|anterior|mencionado)\b/i.test(currentQuestion);

  if (!needsContext) return currentQuestion;

  // Get the last exchange for context
  const lastAssistantMsg = [...history].reverse().find(m => m.role === 'assistant');
  const lastUserMsg = [...history].reverse().find(m => m.role === 'user');

  if (lastUserMsg) {
    return `Contexto de la pregunta anterior: "${lastUserMsg.content.slice(0, 150)}..."

Pregunta actual: ${currentQuestion}`;
  }

  return currentQuestion;
}
