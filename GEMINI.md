---
description: "Foundational mandates and project-specific hooks for Gemini CLI."
paths:
  - "./GEMINI.md"
---

# Project Mandates

## Mandatory Retrieval Gate
- **Pre-Task Retrieval:** BEFORE starting a new task or sub-task, you MUST query Open Brain via `list_thoughts` or `search_thoughts` for relevant learnings based on the current topic, domain (e.g., `[topic:work-coding]`), or technology stack (e.g., `[topic:stack-nextjs]`).
- **Ingestion:** If relevant learnings are found, you MUST ingest them into your current context and apply the insights to the task at hand to avoid repeating past mistakes or to leverage established shortcuts.

## Context Compression Hook
- **Mandatory Learning Capture:** BEFORE you compress your context (e.g., by delegating to a sub-agent, summarizing a session, or ending a major task), you MUST perform a final "learning scan" and capture any new insights, bug fixes, or workflow improvements to Open Brain using the `capture_thought` tool.
- **Tagging Strategy:** Use the tagging protocol defined in the global context, starting with `[topic:learning]` and including project-specific tags like `[topic:project-empatify]`.
