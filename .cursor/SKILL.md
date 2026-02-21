# 🛠 Project Skills & Tool Orchestration

This file defines the procedural "skills" for the agent. Use these runbooks when specific domains (Security, Sentry, OpenAI) are triggered.

## 🛡 Skill: Security-First Development
**Trigger**: Any new API route, Supabase RLS change, or authentication logic.
**Runbook**:
1. [cite_start]**Tool Use**: Consult `security-best-practices` MCP to audit the proposed implementation[cite: 5, 18].
2. **Rules**:
    - [cite_start]Validate all inputs with Zod[cite: 18, 34].
    - [cite_start]Ensure `HttpOnly` and `SameSite` flags for all cookie-based logic[cite: 18].
    - [cite_start]Zero-Hardcoding: Verify no secrets are in the diff; use `@.env.local`[cite: 20, 52].
3. [cite_start]**Verification**: Explicitly ask the `verifier` subagent to check for OWASP Top 10 vulnerabilities[cite: 1, 10].

## 📈 Skill: Error Monitoring & Debugging (Sentry)
**Trigger**: Resolving bugs or implementing production-ready features.
**Runbook**:
1. [cite_start]**Tool Use**: Call the `sentry` MCP to retrieve recent stack traces or issue IDs[cite: 33].
2. **Procedure**:
    - [cite_start]Map the Sentry trace to local source code using source maps[cite: 33].
    - [cite_start]Use the `debugger` subagent to instrument the code with telemetry[cite: 1, 31].
3. [cite_start]**Validation**: Once fixed, verify the error is handled gracefully with a UI Error Boundary[cite: 31, 35].

## 🤖 Skill: OpenAI Integration & AI Features
**Trigger**: Modifying AI prompts, model configurations, or streaming routes.
**Runbook**:
1. [cite_start]**Tool Use**: Consult `openai-docs` MCP for the latest parameter limits and SDK syntax.
2. **Implementation**:
    - [cite_start]Use Next.js (or Vite equivalent) API routes to proxy all AI requests[cite: 15, 20].
    - [cite_start]Implement streaming responses where UX allows to minimize perceived latency[cite: 11, 20].
3. [cite_start]**Consistency**: Ensure model names and token limits match the documentation provided by the MCP.

## 📝 Skill: Documentation & Maintenance
**Trigger**: Completing a feature or refactoring.
**Runbook**:
1. [cite_start]**Auto-Doc**: Use JSDoc for all new public functions and components to improve IDE Intellisense[cite: 38, 39].
2. [cite_start]**README**: Update the root `README.md` if the setup process or environment variables change[cite: 40].