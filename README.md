# Purrvocate

`Purrvocate` is an autonomous developer-advocacy system built to win the `RevenueCat Agentic AI Advocate` role. It combines a TypeScript content and growth pipeline in this repo with an OpenClaw runtime for heartbeat-based autonomy, memory, and operator-facing workflows.

## What It Does

- Ingests high-value RevenueCat sources into a local research memory.
- Generates grounded content briefs and draft artifacts.
- Prepares a growth experiment with explicit metrics and next actions.
- Queues community opportunities and structured product feedback.
- Produces a weekly report and a public application letter.

## Public Home

- GitHub repo: [benzaid32/Purrvocate](https://github.com/benzaid32/Purrvocate)
- Public application artifacts are generated in `content/application/`.

## Scripts

- `npm run agent:daily` runs the full end-to-end loop.
- `npm run agent:ingest` refreshes RevenueCat source memory.
- `npm run agent:content` drafts the initial content pieces.
- `npm run agent:experiment` prepares the current growth experiment.
- `npm run agent:community` creates the current engagement queue.
- `npm run agent:feedback` generates product feedback memos.
- `npm run agent:report` builds a weekly report.
- `npm run agent:apply` writes the public application letter and publishing queue entries.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in API keys as they become available.
3. Install dependencies with `npm install`.
4. Run `npm run agent:daily`.

## Output Folders

- `content/` contains generated public-facing drafts.
- `data/cache/` stores fetched source text.
- `data/generated/` stores memory, reports, publish queues, and artifact summaries.
- `data/runtime/audits/` stores append-only audit logs for outbound actions.

## Security

The repo defaults to a strict security posture:

- public actions are queued unless policy explicitly allows them
- secret-like content is blocked from publication
- outbound decisions are logged for review
- repeated daily runs are skipped unless forced

See `SECURITY.md` for the runtime policy and outbound action rules.

## OpenClaw

The companion OpenClaw workspace and configuration files are written under `C:\Users\pc\.openclaw\` so the runtime can call into this repo once credentials and channels are configured.

Recommended runtime baseline:

- Use `OpenClaw 2026.3.8+` for ACP provenance, backup support, and the recent security fixes.
- Prefer provenance-aware interactions for external identity and access decisions.
- Take an `openclaw backup` before major runtime or skill changes.
