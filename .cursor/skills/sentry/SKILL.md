---
name: sentry
description: Use when the user asks to inspect Sentry issues or events, summarize recent production errors, or pull basic Sentry health data. Read-only queries via Sentry API; require SENTRY_AUTH_TOKEN.
---

# Sentry (Read-only Observability)

## Authentication

- Require a valid `SENTRY_AUTH_TOKEN` (read-only scopes: `project:read`, `event:read`, `org:read`). Never ask the user to paste the full token in chat; they set it locally and confirm when ready.
- Optional env: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_BASE_URL`.
- Defaults: org/project from env or `{your-org}`/`{your-project}`, time range `24h`, environment `prod`, limit 20 (max 50).

If the token is missing, direct the user to:

1. Create a token: https://sentry.io/settings/account/api/auth-tokens/
2. Use read-only scopes (`project:read`, `event:read`, `org:read`).
3. Set `SENTRY_AUTH_TOKEN` in their environment.

## Script (optional)

If the Sentry skill script is installed (e.g. from Codex skills at `%USERPROFILE%\.codex\skills\sentry\scripts\sentry_api.py` or `~/.codex/skills/sentry/scripts/sentry_api.py`), use it for deterministic API calls:

- List issues: `python3 "<path>/sentry_api.py" list-issues --org <org> --project <project> --environment prod --time-range 24h --limit 20 --query "is:unresolved"`
- Issue detail: `python3 "<path>/sentry_api.py" issue-detail <issue_id>`
- Issue events: `python3 "<path>/sentry_api.py" issue-events <issue_id> --limit 20`
- Event detail: `python3 "<path>/sentry_api.py" event-detail --org <org> --project <project> <event_id>`

## API (GET only)

- List issues: `/api/0/projects/{org_slug}/{project_slug}/issues/`
- Issue detail: `/api/0/issues/{issue_id}/`
- Events for issue: `/api/0/issues/{issue_id}/events/`
- Event detail: `/api/0/projects/{org_slug}/{project_slug}/events/{event_id}/`

## Output rules

- Issue list: title, short_id, status, first_seen, last_seen, count, environments, top_tags; order by most recent.
- Event detail: culprit, timestamp, environment, release, url.
- Redact PII (emails, IPs). Do not print raw stack traces or auth tokens.
