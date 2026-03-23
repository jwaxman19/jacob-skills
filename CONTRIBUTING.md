# Contributing

1. Add a directory `skills/<skill-name>/` with a `SKILL.md` that includes valid YAML frontmatter (`name`, `description`).
2. Ensure `name` equals the directory name and meets the constraints in [AGENTS.md](AGENTS.md).
3. Run `./scripts/validate-skills.sh` before opening a PR.
4. If the skill should appear in the Claude Code marketplace manifest, add its path to `.claude-plugin/marketplace.json` under `skills`.

Thank you for improving agent workflows.
