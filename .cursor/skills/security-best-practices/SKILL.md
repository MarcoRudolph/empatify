---
name: security-best-practices
description: Use when the user explicitly requests security best-practices guidance, a security review/report, or secure-by-default coding help. Supported: Python, JavaScript/TypeScript, Go. Do not trigger for general code review or non-security tasks.
---

# Security Best Practices

## Overview

Identify the languages and frameworks in the current project (frontend and backend), then use framework-specific security guidance to write secure-by-default code, passively flag major issues, or (on request) produce a prioritized vulnerability report and suggest fixes.

## Reference location

Security reference docs are in the installed skill directory. When performing a security review, read the relevant files from:

- **Windows:** `%USERPROFILE%\.codex\skills\security-best-practices\references\`
- **Mac/Linux:** `~/.codex/skills/security-best-practices/references/`

Filenames: `<language>-<framework>-<stack>-security.md` or `<language>-general-<stack>-security.md` (e.g. `javascript-typescript-nextjs-web-server-security.md`, `python-general-backend-security.md`). For full-stack web apps, check both frontend and backend references.

If no matching reference exists, use well-known best practices for the stack; if generating a report, note that concrete guidance for that stack is not in the references.

## Modes

1. **Secure by default:** Use the guidance when writing new code.
2. **Passive:** Flag critical/high-impact issues and secure-default violations while editing; offer to fix.
3. **On request:** Produce a security report (markdown, e.g. `security_best_practices_report.md`) with executive summary, severity sections, numeric IDs, impact statements for critical items, and line-number references. Then offer to fix findings one at a time.

## Report format

- Executive summary at top.
- Sections by severity; critical first.
- Each finding with numeric ID and (for critical) one-sentence impact.
- Code references with line numbers.
- After writing the file, summarize for the user and say where the report was written.

## Fixes

- Fix one finding at a time; add short comments citing the security practice.
- Avoid breaking existing behavior; consider regressions and test flows.
- Follow the user's change/commit flow; clear commit messages (e.g. "Align with security best practices").
- Do not bundle unrelated findings in one commit.

## Overrides

Respect project-specific docs or prompts that override a best practice. You may mention the override to the user but do not insist; suggest documenting the reason for the override in the project.

## General advice

- **Public resource IDs:** Prefer UUID4 or random hex; avoid small auto-incrementing IDs.
- **TLS / secure cookies:** Do not report missing TLS as an issue for local/dev. Recommend "secure" cookies only when the app is served over TLS; suggest an env flag to disable "secure" in non-TLS environments. Avoid recommending HSTS without clear understanding of long-term impact.
