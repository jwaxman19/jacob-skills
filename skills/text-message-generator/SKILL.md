# Text Message Generator

Generates a realistic iPhone Messages screenshot (316×684px PNG) from a JSON conversation config.

## Requirements

Requires Chrome or Chromium to be installed. Common install paths are auto-detected (macOS, Linux, Windows). If none are found, install Chromium via:

```bash
npx playwright install chromium
```

## Setup

```bash
cd skills/text-message-generator
npm install
```

## Usage

```bash
node generate.js --config conversation.json --output screenshot.png

# Optionally dump the rendered HTML for debugging
node generate.js --config conversation.json --output screenshot.png --html-output debug.html
```

---

## Config Schema

```jsonc
{
  // ── Participants ────────────────────────────────────────────────────────────

  // 1-on-1 chat — no avatars next to messages, no name labels
  "recipient": { "name": "Mom", "avatar": "/path/to/photo.jpg" },

  // OR group chat — shows avatars + name labels per sender
  "recipients": [
    { "id": "alice", "name": "Alice", "avatar": "/path/to/alice.jpg" },
    { "id": "bob",   "name": "Bob" }
  ],

  // Header display name (defaults to recipient name or comma-joined names)
  "title": "Alice & Bob",

  // ── Messages ────────────────────────────────────────────────────────────────
  "messages": [
    {
      "actor":  "sender",              // "sender" = right-aligned blue bubbles
                                       // "recipient" = for 1-on-1 chats
                                       // or a recipient id for group chats
      "text":   "Hey!",               // supports \n for line breaks
      "date":   "2026-01-15T14:30:00", // ISO datetime — drives grouping & timestamp labels
                                       // omit to auto-space messages 1 min apart
      "method": "data",               // "data" = iMessage blue (default) | "text" = SMS green
      "status": "default",            // sender only: "default"|"delivered"|"read"|"not_delivered"
      "gap":    6                     // optional px override for bottom padding after this message
                                      // use 8–12 for a "time passed" effect without a full timestamp
    }
  ],

  // ── Display ─────────────────────────────────────────────────────────────────
  "mode":             "light",    // "light" (default) | "dark"
  "time":             "9:41",     // status bar clock string
  "timeFormat":       "12h",      // "12h" (default) | "24h"
  "inputPlaceholder": "iMessage", // bottom input bar text

  // ── Status bar ──────────────────────────────────────────────────────────────
  // All accept: "full" | "strong" | "medium" | "low" | "none"
  "signal":  "full",    // cellular bars  (full=4, strong=3, medium=2, low=1)
  "wifi":    "strong",  // wifi arcs      (full/strong=3, medium=2, low=1)
  "battery": "full",    // battery charge (full=100%, strong=75%, medium=50%, low=25%)

  // ── Back button ─────────────────────────────────────────────────────────────
  "unreads": 0          // badge number on the back arrow (0 = no badge)
}
```

---

## Grouping & Spacing

| Condition | Effect |
|-----------|--------|
| Same actor, ≤5 min apart | Tight group: no tail on middle bubbles, 2px gap |
| End of group | Tail shown on last bubble, 6px gap |
| >60 min between messages | Timestamp divider inserted automatically |
| `"gap": N` on a message | Overrides bottom padding to N px |

---

## Examples

### 1-on-1 conversation
```json
{
  "recipient": { "name": "Mom" },
  "messages": [
    { "actor": "recipient", "text": "Hey are you coming to dinner tonight?" },
    { "actor": "sender",    "text": "Yes! Be there around 7" },
    { "actor": "sender",    "text": "Should I bring anything?", "status": "delivered" },
    { "actor": "recipient", "text": "Just yourself 😊" }
  ],
  "time": "9:41"
}
```

### Group chat with time gap effect
```json
{
  "title": "Weekend Plans",
  "recipients": [
    { "id": "alice", "name": "Alice" },
    { "id": "bob",   "name": "Bob" }
  ],
  "messages": [
    { "actor": "sender", "text": "Anyone free Saturday?",      "date": "2026-03-20T10:00:00" },
    { "actor": "alice",  "text": "I am!",                      "date": "2026-03-20T10:00:30" },
    { "actor": "bob",    "text": "Same, I'm in",               "date": "2026-03-20T10:14:00", "gap": 10 },
    { "actor": "sender", "text": "Hiking at Marin Headlands?", "date": "2026-03-20T10:14:30" }
  ],
  "unreads": 3
}
```

### Dark mode
```json
{
  "recipient": { "name": "Alex" },
  "messages": [
    { "actor": "recipient", "text": "Still up?" },
    { "actor": "sender",    "text": "Yeah can't sleep" },
    { "actor": "sender",    "text": "Yes obviously", "status": "read" }
  ],
  "mode": "dark",
  "time": "2:14",
  "battery": "low"
}
```

---

## Parameter Reference

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `recipient` | object | — | `{ name, avatar? }` for 1-on-1 |
| `recipients` | array | — | `[{ id, name, avatar? }]` for group |
| `title` | string | recipient name | Header display name |
| `messages[].actor` | string | required | `"sender"`, `"recipient"`, or recipient id |
| `messages[].text` | string | required | Message body |
| `messages[].date` | ISO string | auto (1 min apart) | Controls grouping & dividers |
| `messages[].method` | string | `"data"` | `"data"` (blue) or `"text"` (green) |
| `messages[].status` | string | `"default"` | `delivered`, `read`, `not_delivered` |
| `messages[].gap` | number | auto | Bottom padding in px after this message |
| `mode` | string | `"light"` | `"light"` or `"dark"` |
| `time` | string | `"9:41"` | Status bar clock |
| `timeFormat` | string | `"12h"` | `"12h"` or `"24h"` |
| `inputPlaceholder` | string | `"iMessage"` | Input bar placeholder |
| `signal` | string | `"full"` | `full`/`strong`/`medium`/`low` |
| `wifi` | string | `"strong"` | `full`/`strong`/`medium`/`low` |
| `battery` | string | `"full"` | `full`/`strong`/`medium`/`low` |
| `unreads` | number | `0` | Back button badge count |
