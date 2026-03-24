---
name: imessage-screenshot-generator
description: >-
  Generates realistic iPhone Messages (iMessage) screenshots as retina-quality PNG at 3×
  resolution from a JSON conversation config. Use for mockups, storytelling, presentations,
  or any context where you need an iMessage screenshot without a real phone. Trigger phrases:
  iMessage screenshot, mock Messages, fake text thread, iPhone Messages PNG generator.
---

# iMessage Screenshot Generator

Generates realistic iPhone Messages screenshots (retina-quality PNG at 3× resolution) from a JSON conversation config. Useful for mockups, storytelling, presentations, or any context where you need a realistic iMessage screenshot without using a real phone.

## Requirements

- **Node.js** (v18+)
- **Chrome or Chromium** installed on the system. Common paths are auto-detected on macOS, Linux, and Windows. If detection fails, install Chromium via `npx playwright install chromium`.

## Setup

```bash
npm install
```

## Workflow

1. **Create a JSON config** describing the conversation (see schema below or use an example as a starting point).
2. **Run the generator**:
   ```bash
   node generate.js --config conversation.json --output screenshot.png
   ```
3. The output is a crisp, retina-quality PNG (3× device scale factor, ~316×684 logical pixels).

### Debugging

Dump the rendered HTML for inspection:
```bash
node generate.js --config conversation.json --output screenshot.png --html-output debug.html
```

---

## Examples

Pre-built examples live in the [`./examples/`](./examples/) folder. Each has a `.json` config and a matching `.png` screenshot.

| Example | Config | Screenshot | Description |
|---------|--------|------------|-------------|
| Simple 1-on-1 | [`simple.json`](./examples/simple.json) | [`simple.png`](./examples/simple.png) | Light mode, basic conversation with Mom, delivery receipt |
| Group chat | [`group.json`](./examples/group.json) | [`group.png`](./examples/group.png) | Multi-recipient chat with avatars, name labels, timestamps, unreads badge |
| Dark mode | [`dark.json`](./examples/dark.json) | [`dark.png`](./examples/dark.png) | Dark theme, low battery, read receipt, late-night vibe |

To regenerate all examples:
```bash
node generate.js --config examples/simple.json --output examples/simple.png
node generate.js --config examples/group.json  --output examples/group.png
node generate.js --config examples/dark.json   --output examples/dark.png
```

Or via npm:
```bash
npm run examples
```

---

## Config Schema

```jsonc
{
  // ── Participants ──────────────────────────────────────────────────────────

  // Option A: 1-on-1 chat (no avatars next to messages, no name labels)
  "recipient": { "name": "Mom", "avatar": "/path/to/photo.jpg" },

  // Option B: group chat (shows avatars + name labels per sender)
  "recipients": [
    { "id": "alice", "name": "Alice", "avatar": "/path/to/alice.jpg" },
    { "id": "bob",   "name": "Bob" }
  ],

  // Header display name (defaults to recipient name or comma-joined names)
  "title": "Alice & Bob",

  // ── Messages ──────────────────────────────────────────────────────────────
  "messages": [
    {
      "actor":  "sender",              // "sender" = right-aligned blue bubbles
                                       // "recipient" for 1-on-1 chats
                                       // or a recipient id (e.g. "alice") for group chats
      "text":   "Hey!",               // message body — supports \n for line breaks
      "date":   "2026-01-15T14:30:00", // ISO datetime — drives grouping & timestamp labels
                                       // omit to auto-space messages 1 min apart
      "method": "data",               // "data" = iMessage blue (default) | "text" = SMS green
      "status": "default",            // sender only: "default"|"delivered"|"read"|"not_delivered"
      "gap":    6                     // optional px override for bottom padding after this message
                                      // use 8–12 for a subtle "time passed" effect
    }
  ],

  // ── Display ───────────────────────────────────────────────────────────────
  "mode":             "light",    // "light" (default) | "dark"
  "time":             "9:41",     // status bar clock string
  "timeFormat":       "12h",      // "12h" (default) | "24h"
  "inputPlaceholder": "iMessage", // bottom input bar text

  // ── Status bar ────────────────────────────────────────────────────────────
  // All accept: "full" | "strong" | "medium" | "low" | "none"
  "signal":  "full",    // cellular bars  (full=4, strong=3, medium=2, low=1)
  "wifi":    "strong",  // wifi arcs      (full/strong=3, medium=2, low=1)
  "battery": "full",    // battery charge (full=100%, strong=75%, medium=50%, low=25%)

  // ── Back button ───────────────────────────────────────────────────────────
  "unreads": 0          // badge number on the back arrow (0 = no badge)
}
```

---

## Grouping & Spacing Rules

The generator automatically handles message grouping and timestamp dividers based on the `date` fields:

| Condition | Effect |
|-----------|--------|
| Same actor, ≤5 min apart | Tight group: no tail on middle bubbles, 2px gap |
| End of group (next message is different actor or >5 min later) | Tail + avatar shown on last bubble, 6px gap |
| >60 min between messages | Timestamp divider inserted automatically |
| `"gap": N` on a message | Overrides the automatic bottom padding to N px |

**Name labels** appear in group chats whenever the actor changes from the previous message.

**Avatars** appear on the last message in each group (group chats only).

---

## Parameter Reference

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `recipient` | object | — | `{ name, avatar? }` for 1-on-1 |
| `recipients` | array | — | `[{ id, name, avatar? }]` for group |
| `title` | string | auto | Header display name |
| `messages[].actor` | string | required | `"sender"`, `"recipient"`, or a recipient id |
| `messages[].text` | string | required | Message body |
| `messages[].date` | ISO string | auto (1 min apart) | Controls grouping & dividers |
| `messages[].method` | string | `"data"` | `"data"` (blue) or `"text"` (green) |
| `messages[].status` | string | `"default"` | `delivered`, `read`, `not_delivered` |
| `messages[].gap` | number | auto | Bottom padding override in px |
| `mode` | string | `"light"` | `"light"` or `"dark"` |
| `time` | string | `"9:41"` | Status bar clock |
| `timeFormat` | string | `"12h"` | `"12h"` or `"24h"` |
| `inputPlaceholder` | string | `"iMessage"` | Input bar placeholder |
| `signal` | string | `"full"` | `full`/`strong`/`medium`/`low`/`none` |
| `wifi` | string | `"strong"` | `full`/`strong`/`medium`/`low`/`none` |
| `battery` | string | `"full"` | `full`/`strong`/`medium`/`low`/`none` |
| `unreads` | number | `0` | Back button badge count |
