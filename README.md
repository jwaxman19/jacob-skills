# jacob-skills

Agent Skills for coding agents (Cursor, Claude Code, and others that follow the [Agent Skills](https://agentskills.io/specification.md) layout). Inspired by [marketingskills](https://github.com/coreyhaines31/marketingskills) and [gstack](https://github.com/garrytan/gstack): small, copyable `skills/<name>/SKILL.md` trees you can symlink, submodule, or paste into your agent config.

**Repository:** [github.com/jwaxman19/jacob-skills](https://github.com/jwaxman19/jacob-skills)

## Skills

| Skill | Summary |
| ----- | ------- |
| [google-tac-tier2-casa-audit-prep](skills/google-tac-tier2-casa-audit-prep/) | Code-first prep for **Google TAC Tier 2** / **CASA Tier 2**–style app security assessments: map the 23-item SAQ to repo evidence, harden, and document traceability. |

## Install (Cursor)

Copy or symlink a skill into your personal skills directory:

```bash
mkdir -p ~/.cursor/skills
ln -s "$(pwd)/skills/google-tac-tier2-casa-audit-prep" ~/.cursor/skills/google-tac-tier2-casa-audit-prep
```

Or clone this repo anywhere and point Cursor at `skills/<skill-name>` via your workflow (project `.cursor/skills/`, etc.).

## Install (Claude Code plugin)

If you use Claude Code marketplaces, add this repo as a marketplace and install the bundled plugin (see `.claude-plugin/marketplace.json`; `metadata.repository` points at this GitHub repo).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md).

## License

MIT — see [LICENSE](LICENSE).
