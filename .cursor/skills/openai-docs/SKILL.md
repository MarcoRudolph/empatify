---
name: openai-docs
description: Use when the user asks how to build with OpenAI products or APIs and needs up-to-date official documentation with citations (e.g. Chat Completions, Apps SDK, Realtime, model capabilities). Prefer OpenAI docs MCP tools; fallback to official OpenAI domains only.
---

# OpenAI Docs

Provide authoritative, current guidance from OpenAI developer docs. Prefer the developers.openai.com MCP server when available. Only if MCP returns no meaningful results, fall back to web search restricted to official OpenAI domains (developers.openai.com, platform.openai.com).

## Workflow

1. Clarify the product scope (OpenAI API, ChatGPT Apps SDK, etc.) and the task.
2. Search docs with a precise query (via MCP if installed: `mcp__openaiDeveloperDocs__search_openai_docs` / `mcp__openaiDeveloperDocs__fetch_openai_doc`).
3. Answer with concise guidance and cite the doc source.
4. Provide code snippets only when the docs support them.

## Quality rules

- Treat OpenAI docs as the source of truth; avoid speculation.
- Keep quotes short; prefer paraphrase with citations.
- If multiple pages differ, call out the difference and cite both.
- If docs do not cover the user's need, say so and offer next steps.
