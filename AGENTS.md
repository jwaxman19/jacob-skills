# AGENTS.md

Guidelines for AI agents working in **jacob-skills**.

## Repository overview

- **Skills live under** `skills/<skill-name>/SKILL.md` (required).
- **Naming**: YAML `name` must match the parent directory exactly: lowercase `a-z`, digits, hyphens only; 1–64 characters; no leading/trailing hyphen; no `--`.
- **Description**: 1–1024 characters; include what the skill does and when to use it (trigger phrases for discovery).
- **Size**: Keep `SKILL.md` under ~500 lines; move deep reference material to `references/` at one level of indirection from `SKILL.md`.

## Distribution (skills.sh)

This repo is meant to be **installed from Git**, not “published” to a store. Per Vercel’s skills tooling, **`npx skills add <owner/repo>`** (or a repo URL) is the primary install path; **skills.sh** can reflect usage via **install telemetry** after real installs—not a separate publish command. See [README.md](README.md) for links to the CLI docs and Vercel’s guide.

## Spec

Follow the [Agent Skills specification](https://agentskills.io/specification.md) where applicable.

## Validation

From repo root:

```bash
./scripts/validate-skills.sh
```

## Commits

Prefer [Conventional Commits](https://www.conventionalcommits.org/), for example `feat: add google-tac-tier2-casa-audit-prep skill`.
