# Contributing

1. Add a directory `skills/<skill-name>/` with a `SKILL.md` that includes valid YAML frontmatter (`name`, `description`).
2. Ensure `name` equals the directory name and meets the constraints in [AGENTS.md](AGENTS.md)—this matches what **`npx skills add`** and [skills.sh](https://skills.sh) indexing expect.
3. Run `./scripts/validate-skills.sh` before opening a PR.
4. Keep [README.md](README.md) accurate for anyone installing from the public repo.
5. **Optional:** If the skill should also appear in a Claude Code marketplace manifest, add its path to `.claude-plugin/marketplace.json` under `skills`.

Thank you for improving agent workflows.
