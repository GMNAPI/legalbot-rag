# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LegalBot RAG is a Retrieval-Augmented Generation system for Spanish real estate law. It uses semantic chunking by article (not fixed tokens), OpenAI embeddings, and GPT-4 with mandatory citations.

## Commands

```bash
# Development
pnpm dev                    # Start server with hot reload (tsx watch)
pnpm build                  # Compile TypeScript to dist/

# Testing
pnpm test                   # Run all tests
pnpm test:watch             # Watch mode
npx vitest run tests/chunker.test.ts  # Run single test file

# Data ingestion
docker compose up -d chroma # Start vector database
pnpm ingest                 # Ingest legal documents into Chroma
pnpm ingest --clear         # Clear and re-ingest
```

## Architecture

### RAG Pipeline Flow (`src/rag.ts`)

```
Question → buildStandaloneQuestion() → generateEmbedding()
         → queryChunks() → rerank() → filterByThreshold()
         → buildPrompt() → OpenAI completion
         → buildValidatedResponse() → addWarningsIfNeeded()
```

### Module Responsibilities

- **ingestion/**: Document loading, semantic chunking by article, OpenAI embeddings
- **retrieval/**: Chroma vector store operations, keyword-based reranking
- **generation/**: Prompt construction with mandatory citations, response validation
- **api/**: Fastify endpoints (`/chat`, `/retrieve`, `/health`, `/stats`)

### Key Design Patterns

1. **Semantic chunking**: Documents are split by `Artículo` boundaries using regex, preserving legal structure. IDs use format `{LAW}-art-{NUMBER}`.

2. **Mandatory citations**: System prompt forces `[Artículo X, Ley Y]` format. Response validator extracts and verifies citations exist in retrieved context.

3. **Confidence levels**: Responses are scored `high`/`medium`/`low`/`none` based on retrieval similarity scores and citation validity.

4. **Overlap context**: Adjacent articles are included as context via `addOverlapContext()` for cross-article queries.

## Environment Variables

Required: `OPENAI_API_KEY`

RAG tuning: `MAX_CHUNKS` (default 5), `SIMILARITY_THRESHOLD` (default 0.7)

## Adding New Legal Documents

1. Add `.txt` or `.pdf` to `data/laws/`
2. Register in `LAW_REGISTRY` in `src/ingestion/documentLoader.ts` for auto-detection
3. Run `pnpm ingest`
