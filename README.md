# LegalBot RAG

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://legalbot-rag-production.up.railway.app)
[![GitHub](https://img.shields.io/github/license/GMNAPI/legalbot-rag)](LICENSE)

> Sistema RAG para derecho inmobiliario español con citas obligatorias y validación de fuentes.

## 🚀 Demo en Vivo

**URL**: https://legalbot-rag-production.up.railway.app

```bash
# Probar el endpoint de chat
curl -X POST https://legalbot-rag-production.up.railway.app/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Cuánto preaviso necesito para no renovar un contrato de alquiler?"}'
```

También disponible la [colección de Postman](./LegalBot-RAG.postman_collection.json) para pruebas interactivas.

---

## Overview

LegalBot is a Retrieval-Augmented Generation (RAG) system that answers questions about Spanish real estate law. It uses:

- **Semantic chunking** by article (not fixed tokens) to preserve legal structure
- **Vector embeddings** for semantic search (OpenAI text-embedding-3-small)
- **GPT-4** for response generation with mandatory citations
- **Response validation** to verify citations exist in retrieved context

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ INGESTION (offline)                                         │
│ Legal Docs → Chunker (by article) → Embeddings → Chroma     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ QUERY (runtime)                                             │
│ Question → Embedding → Similarity Search → Rerank           │
│ → Prompt with context → GPT-4 → Validated Response          │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- OpenAI API key

### Setup (Local Vector Store - Sin Docker)

```bash
# Clone and install
git clone https://github.com/GMNAPI/legalbot-rag.git
cd legalbot-rag
pnpm install

# Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start the server (usa vector store local pre-cargado)
pnpm dev
```

### Setup Alternativo (Con Chroma)

```bash
# Start Chroma (vector database)
docker-compose up -d chroma

# Ingest legal documents
pnpm ingest

# Start the server
pnpm dev
```

### API Usage

```bash
# Chat endpoint (local)
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Cuánto preaviso necesito para no renovar un contrato de alquiler?"}'

# Chat endpoint (producción)
curl -X POST https://legalbot-rag-production.up.railway.app/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Cuánto preaviso necesito para no renovar un contrato de alquiler?"}'

# Response includes citations and confidence level
{
  "answer": "Según la LAU, si eres arrendatario debes avisar con al menos 2 meses...",
  "sources": [
    { "article": "Artículo 10", "law": "LAU", "excerpt": "..." }
  ],
  "confidence": "high"
}
```

### Demo Questions

1. **"¿Cuánto preaviso necesito para no renovar un contrato de alquiler?"**
   - Should cite LAU Art. 10

2. **"¿Quién paga las obras de mantenimiento en un piso alquilado?"**
   - Should cite LAU Art. 21 and 22

3. **"¿Puedo poner un negocio en mi piso de una comunidad de propietarios?"**
   - Should cite LPH Art. 7

4. **"¿Cuánto es el ITP en Barcelona?"**
   - Should respond "No tengo información..." (validates guardrails)

## Project Structure

```
legalbot-rag/
├── src/
│   ├── ingestion/
│   │   ├── chunker.ts        # Semantic chunking by article
│   │   ├── embedder.ts       # OpenAI embeddings
│   │   └── documentLoader.ts # PDF/TXT loading
│   ├── retrieval/
│   │   ├── vectorStore.ts    # Chroma integration
│   │   └── reranker.ts       # Keyword-based reranking
│   ├── generation/
│   │   ├── promptBuilder.ts  # Prompt construction
│   │   └── responseValidator.ts # Citation validation
│   ├── api/
│   │   └── chat.ts           # Fastify endpoints
│   ├── rag.ts                # Main RAG pipeline
│   └── index.ts              # Server entry point
├── data/
│   └── laws/                 # Legal documents (LAU, LPH)
├── tests/
│   ├── chunker.test.ts
│   └── responseValidator.test.ts
├── docker-compose.yml
└── README.md
```

## Key Design Decisions

### 1. Semantic Chunking by Article

Instead of fixed-size token chunking, we chunk by legal article:

```typescript
// Bad: Fixed token chunks break legal meaning
"...plazo mínimo de cin" | "co años, o siete si..."

// Good: Semantic chunks preserve full articles
[Artículo 9] "La duración del arrendamiento será libremente pactada..."
```

### 2. Mandatory Citations

The system prompt forces citations to reduce hallucinations:

```
REGLAS ESTRICTAS:
1. SOLO responde basándote en el CONTEXTO LEGAL
2. SIEMPRE cita: [Artículo X, Ley Y]
3. Si no hay info, di "No dispongo de información..."
```

### 3. Response Validation

Every response is validated:
- Citations are extracted with regex
- Validated against retrieved chunks
- Confidence level assigned (high/medium/low/none)

### 4. Overlap Context

Adjacent articles are included as context to improve retrieval for questions spanning multiple articles.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Main chat endpoint |
| POST | `/retrieve` | Debug: get retrieved chunks |
| GET | `/health` | Health check |
| GET | `/stats` | System statistics |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | Required |
| `EMBEDDING_MODEL` | text-embedding-3-small | Embedding model |
| `CHAT_MODEL` | gpt-4-turbo-preview | Chat model |
| `MAX_CHUNKS` | 5 | Max chunks per query |
| `SIMILARITY_THRESHOLD` | 0.7 | Min similarity score |
| `CHROMA_HOST` | localhost | Chroma host |
| `CHROMA_PORT` | 8000 | Chroma port |

## Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Run evaluation system
pnpm eval

# Detailed evaluation output
pnpm eval --verbose
```

See [docs/evaluation.md](./docs/evaluation.md) for details on the evaluation system.

## Production Considerations

For a production system like MIKE, I would add:

1. **Observability**: OpenTelemetry + Grafana for tracing
2. **Feature Flags**: A/B test prompts without deployments
3. **LLM Evaluation**: Golden dataset + automatic quality metrics
4. **API Versioning**: OpenAPI contracts, auto-generated SDKs
5. **Caching**: Embeddings cache, response cache for common queries
6. **Rate Limiting**: Per-client rate limits, queue for heavy queries

## License

MIT - Technical demo for interview purposes.
