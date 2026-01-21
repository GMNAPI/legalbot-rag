/**
 * Chat API endpoint
 *
 * Exposes the RAG system through a REST API
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query, queryStream, retrieve } from '../rag.js';
import { getStats } from '../retrieval/index.js';
import type { ChatRequest, ChatResponse, ChatMessage } from '../types.js';

interface ChatBody {
  question: string;
  history?: ChatMessage[];
  stream?: boolean;
}

interface RetrieveBody {
  question: string;
}

/**
 * Register chat routes
 */
export async function registerChatRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /chat - Main chat endpoint
   */
  app.post<{ Body: ChatBody }>(
    '/chat',
    {
      schema: {
        body: {
          type: 'object',
          required: ['question'],
          properties: {
            question: { type: 'string', minLength: 1 },
            history: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['user', 'assistant', 'system'] },
                  content: { type: 'string' },
                },
              },
            },
            stream: { type: 'boolean', default: false },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: ChatBody }>, reply: FastifyReply) => {
      const { question, history, stream } = request.body;

      try {
        if (stream) {
          // Streaming response
          reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          });

          const response = await queryStream(
            question,
            history,
            (chunk) => {
              reply.raw.write(`data: ${JSON.stringify({ chunk })}\n\n`);
            }
          );

          // Send final response with metadata
          reply.raw.write(`data: ${JSON.stringify({ done: true, response })}\n\n`);
          reply.raw.end();
        } else {
          // Regular response
          const response = await query(question, history);
          return response;
        }
      } catch (error) {
        request.log.error(error, 'Chat query failed');
        reply.status(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * POST /retrieve - Get relevant chunks without generation (for debugging)
   */
  app.post<{ Body: RetrieveBody }>(
    '/retrieve',
    {
      schema: {
        body: {
          type: 'object',
          required: ['question'],
          properties: {
            question: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: RetrieveBody }>, reply: FastifyReply) => {
      const { question } = request.body;

      try {
        const results = await retrieve(question);
        return {
          question,
          results: results.map(r => ({
            score: r.score,
            article: r.chunk.metadata.article,
            law: r.chunk.metadata.law,
            title: r.chunk.metadata.articleTitle,
            text: r.chunk.text.slice(0, 500) + '...',
          })),
        };
      } catch (error) {
        request.log.error(error, 'Retrieve failed');
        reply.status(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /health - Health check endpoint
   */
  app.get('/health', async () => {
    try {
      const stats = await getStats();
      return {
        status: 'healthy',
        vectorStore: {
          connected: true,
          documentCount: stats.count,
        },
      };
    } catch {
      return {
        status: 'degraded',
        vectorStore: {
          connected: false,
          documentCount: 0,
        },
      };
    }
  });

  /**
   * GET /stats - Get system statistics
   */
  app.get('/stats', async () => {
    const stats = await getStats();
    return {
      documentCount: stats.count,
      models: {
        embedding: process.env['EMBEDDING_MODEL'] ?? 'text-embedding-3-small',
        chat: process.env['CHAT_MODEL'] ?? 'gpt-4-turbo-preview',
      },
    };
  });
}
