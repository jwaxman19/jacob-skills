# jacob-skills

Random agent skills I actually use. I got tired of security reviews where the work was basically “find the thing in the repo and point at it,” and I kept ending up with long docs that didn’t help when someone asked where something lived. So these are written around that: start from code, map the questionnaire to files, say what’s missing for real.

Repo: https://github.com/jwaxman19/jacob-skills

Format is the usual [Agent Skills](https://agentskills.io/specification.md) thing — folder per skill, `SKILL.md` inside.

## What’s here

**[google-tac-tier2-casa-audit-prep](skills/google-tac-tier2-casa-audit-prep/)** — Google TAC Tier 2 / CASA-style SAQ prep. OAuth, webhooks, APIs, all the boring stuff. Not magic, just a structured way to tie each row to something in git instead of hand-waving.

## How to install

```bash
npx skills add jwaxman19/jacob-skills
```

Or symlink/copy the skill folder into wherever your agent reads skills (`~/.cursor/skills/`, project `.cursor/skills/`, etc.).

There’s also `.claude-plugin/marketplace.json` if you’re on Claude Code and use that flow.
