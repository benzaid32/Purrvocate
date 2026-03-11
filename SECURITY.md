# Security Model

This agent is designed to favor safety and auditability over maximum autonomy.

## Default posture

- `SECURITY_MODE=strict`
- `ALLOW_AUTONOMOUS_PUBLISHING=false`
- Public actions are queued unless policy explicitly allows them.
- Secret-like payloads are blocked from publication.
- All outbound decisions are written to `data/runtime/audits/public-actions.jsonl`.

## What this protects

- Accidental public posting with incomplete credentials or bad prompts
- Leakage of key-like material into public artifacts
- Silent autonomous actions that leave no operator trail
- Duplicate daily runs that create noisy or conflicting artifacts

## OpenClaw runtime baseline

- Use `OpenClaw 2026.3.8+` as the minimum runtime target.
- Prefer ACP provenance checks when the runtime exposes them so the agent can reason about who is actually talking to it.
- Take an `openclaw backup` before changing runtime config, skills, or deploy targets.
- Treat the recent OpenClaw security fixes as part of the trust model, not as optional upgrades.

## Autonomy escalation

Only relax defaults after:

1. Credentials are configured correctly.
2. Public destinations are tested with low-risk artifacts.
3. The audit log is being monitored.
4. The operator accepts responsibility for external actions.
