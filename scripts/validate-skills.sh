#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

errors=0

extract_frontmatter_block() {
  awk '
    /^---$/ { if (seen) exit; seen=1; next }
    seen { print }
  ' "$1"
}

for skill_md in skills/*/SKILL.md; do
  [[ -e "$skill_md" ]] || continue
  dir="$(dirname "$skill_md")"
  dirname="$(basename "$dir")"

  if ! head -n 1 "$skill_md" | grep -q '^---$'; then
    echo "ERROR: $skill_md must start with YAML frontmatter (---)" >&2
    ((errors += 1)) || true
    continue
  fi

  fm="$(extract_frontmatter_block "$skill_md")"
  if [[ -z "$fm" ]]; then
    echo "ERROR: could not read frontmatter in $skill_md" >&2
    ((errors += 1)) || true
    continue
  fi

  if ! printf '%s\n' "$fm" | grep -q '^description:'; then
    echo "ERROR: missing description: in frontmatter of $skill_md" >&2
    ((errors += 1)) || true
  fi

  name_val="$(printf '%s\n' "$fm" | grep '^name:' | head -n 1 | sed 's/^name:[[:space:]]*//;s/[[:space:]]*$//;s/\r$//')"
  if [[ -z "$name_val" ]]; then
    echo "ERROR: missing name: in frontmatter of $skill_md" >&2
    ((errors += 1)) || true
    continue
  fi

  if [[ "$name_val" != "$dirname" ]]; then
    echo "ERROR: name '$name_val' must match directory '$dirname' ($skill_md)" >&2
    ((errors += 1)) || true
  fi

  # Approximate description size: frontmatter without name line (folded/block descriptions included)
  desc_blob="$(printf '%s\n' "$fm" | grep -v '^name:')"
  len="${#desc_blob}"
  if (( len < 10 || len > 1200 )); then
    echo "ERROR: description block looks wrong (length $len, expected roughly 10-1200) in $skill_md" >&2
    ((errors += 1)) || true
  fi

  lines="$(wc -l < "$skill_md" | tr -d ' ')"
  if (( lines > 500 )); then
    echo "WARN: $skill_md has $lines lines (recommended <= 500)" >&2
  fi
done

shopt -s nullglob
skill_count=(skills/*/SKILL.md)
if (( ${#skill_count[@]} == 0 )); then
  echo "ERROR: no skills found under skills/*/" >&2
  exit 1
fi

if (( errors > 0 )); then
  echo "Validation failed with $errors error(s)." >&2
  exit 1
fi

echo "OK: all skills passed basic checks."
