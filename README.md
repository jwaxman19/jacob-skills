# jacob-skills

Agent Skills for coding agents (Cursor, Claude Code, and others that follow the [Agent Skills](https://agentskills.io/specification.md) layout). Inspired by [marketingskills](https://github.com/coreyhaines31/marketingskills) and [gstack](https://github.com/garrytan/gstack): small, copyable `skills/<name>/SKILL.md` trees you can symlink, submodule, or paste into your agent config.

**Repository:** [github.com/jwaxman19/jacob-skills](https://github.com/jwaxman19/jacob-skills)

## Skills

| Skill | Summary |
| ----- | ------- |
| [google-tac-tier2-casa-audit-prep](skills/google-tac-tier2-casa-audit-prep/) | Code-first prep for **Google TAC Tier 2** / **CASA Tier 2**–style app security assessments: map the 23-item SAQ to repo evidence, harden, and document traceability. |

## Sharing & discoverability ([skills.sh](https://skills.sh))

There is **no app-store submission** or special publish command for [skills.sh](https://skills.sh). Vercel documents distribution as: **put the skill in a Git repo, share the repo**, and let people install with the Skills CLI. **Installs** can surface the skill on skills.sh **automatically via install telemetry**—so real usage, not a separate “publish” step, drives discoverability.

**Checklist for a public skill repo** (aligned with [Vercel’s Agent Skills guide](https://vercel.com/kb/guide/agent-skills-creating-installing-and-sharing-reusable-agent-context) and [skills.sh CLI docs](https://skills.sh/docs/cli)):

1. **Public** Git repository (or otherwise cloneable URL you’re happy to share).
2. **One folder per skill**, each containing a **`SKILL.md`**.
3. **`SKILL.md` frontmatter** includes **`name`** and **`description`**; **`name`** matches the parent directory and uses **lowercase letters, numbers, and hyphens only**.
4. **README**, **clear ownership**, and a **license**—strongly recommended for public skill repos.
5. **Install** with **`npx skills add`** using GitHub shorthand, a full GitHub URL, or (where supported) a path to a skill inside the repo—see the [CLI reference](https://skills.sh/docs/cli).
6. **Discovery:** test-install yourself, ask a few others to install, and share the repo link publicly if you want it to show up on skills.sh sooner.

## Install (Skills CLI)

```bash
npx skills add jwaxman19/jacob-skills
# or
npx skills add https://github.com/jwaxman19/jacob-skills
```

The CLI also supports other git URLs and, where documented, **paths to a single skill** inside a monorepo—check **`npx skills add --help`** and [skills.sh/docs/cli](https://skills.sh/docs/cli) for the exact forms your version accepts.

## Install (Cursor)

Copy or symlink a skill into your personal skills directory:

```bash
mkdir -p ~/.cursor/skills
ln -s "$(pwd)/skills/google-tac-tier2-casa-audit-prep" ~/.cursor/skills/google-tac-tier2-casa-audit-prep
```

Or clone this repo anywhere and point Cursor at `skills/<skill-name>` via your workflow (project `.cursor/skills/`, etc.).

## Optional: Claude Code plugin

If you use Claude Code marketplaces, this repo includes `.claude-plugin/marketplace.json` so you can add it as a marketplace source. That is **separate** from skills.sh discoverability (which is driven by **`npx skills add`** installs).

## License

MIT — see [LICENSE](LICENSE).
