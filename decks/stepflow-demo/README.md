# StepFlow demo deck

Slidev deck for the StepFlow animated-diagram demo (`decks/stepflow-demo`): a house-style
title slide and a six-step demo slide that reveals one node per click on the 1920×1080
black canvas.

## Run (dev server + hot reload)

```bash
npm install        # once, from the repo root
npm run dev                 # serves decks/stepflow-demo with hot reload (Slidev default port: 3030)
npm run dev -- --port 4321  # same, on port 4321 — the port used in this doc's MCP URLs
```

The dev server also exposes Slidev's built-in MCP server — see
[MCP: text descriptions become hot-reloading slides](#mcp-text-descriptions-become-hot-reloading-slides).

## Build (static SPA)

```bash
npm run build      # outputs decks/stepflow-demo/dist/
```

## Preview (built SPA)

```bash
npm run preview    # static-serves decks/stepflow-demo/dist/ (uses npx serve, no committed dep)
```

## Export (manual path)

PDF export requires `playwright-chromium`, which is intentionally **not** installed with the project:

```bash
npx playwright install chromium   # one-time browser download
npm run export                    # writes decks/stepflow-demo/export/deck.pdf
```

## Deck structure

```text
decks/stepflow-demo/
├─ slides.md                      # slide 1: title · slide 2: StepFlow demo (six v-clicks)
├─ components/
│  ├─ StepFlow.vue                # the diagram component (auto-imported by Slidev)
│  ├─ AutoAdvance.vue             # renderless deck wiring: ?autoplay=N / a-key auto-advance
│  └─ stepflow/
│     ├─ geometry.ts              # pure serpentine layout math (viewBox-relative)
│     ├─ palettes.ts              # StepFlowPalette presets + resolvePalette merge
│     ├─ icons.ts                 # named Lucide path registry + visible fallback
│     ├─ steps.ts                 # StepFlowStep contract + the measured six-step seed data
│     └─ useAutoAdvance.ts        # pure click-cadence runner (nav boundary injected)
└─ styles/index.css               # deck-wide house style: black canvas, mono base font
```

`components/` is auto-imported, so a slide can use `<StepFlow … />` with zero registration
code. Step data travels with the slide as props — the component holds no global state.

## Authoring a StepFlow slide

A diagram is data-in via props; reveal state is owned by Slidev's native `v-click`
(one click per step — the demo slide has six). The inline steps array is the exact
shape an MCP agent writes:

```md
<div class="stepflow-stage">

<StepFlow
  title="SHIP FASTER"
  :steps="[
    { id: 'branch', title: 'BRANCH', subtext: 'feature branches from main', icon: 'git-branch' },
    { id: 'infra', title: 'INFRA AS CODE', subtext: 'servers defined in git', icon: 'server' },
  ]"
/>

</div>
```

Component props:

| Prop       | Type                          | Purpose                                                        |
| ---------- | ----------------------------- | -------------------------------------------------------------- |
| `steps`    | `StepFlowStep[]` (required)   | One entry per node: `id`, `title`, `subtext`, `icon`           |
| `palette`  | `Partial<StepFlowPalette>`    | Merged over the measured `cyanOnBlack` preset (colors + glow)   |
| `geometry` | `SerpentineOptions`           | Optional viewBox-size / pitch / radius overrides                |
| `title`    | `string`                      | Mono header line rendered top-left (e.g. `SHIP FASTER`)         |

Icon keys resolve against the Lucide registry in `components/stepflow/icons.ts`
(`git-branch`, `square-terminal`, `flask-conical`, `braces`, `rotate-cw`, `server`, …);
an unknown key renders a visible fallback and warns in dev.

## Hands-free playback (auto-advance)

The demo slide can play its six-click reveal by itself — built for screen
recordings. Orchestration lives at deck level (`components/AutoAdvance.vue`
bridging the pure `components/stepflow/useAutoAdvance.ts` runner to Slidev's
navigation); the StepFlow component itself stays pure — no timers, no global
state reads.

| Surface | Behavior |
| ------- | -------- |
| `?autoplay=N` URL param | Auto-starts the run on slide enter, evenly spaced across N seconds (`/2?autoplay=7` → the six clicks over 7 s, ≈1.17 s apart, first click one interval in). Bare `?autoplay` or an invalid value falls back to the 7 s demo default. |
| `a` key | Toggles a run over the demo default of 7 seconds (no modifier held; `A` works too). |
| Arrow keys / space / PageUp / PageDown | Cancel a running auto-advance — the native navigation still applies. |
| Final click reached | The run stops cleanly; it never skips ahead to the next slide. |
| Leaving the slide / unmount | All timers and key listeners are cleaned up; re-entering with `?autoplay` still in the URL replays the run. |

### Recording workflow

1. `npm run dev -- --port 4321`
2. Open `http://localhost:4321/2?autoplay=7` — the run starts the moment the
   slide mounts (first click ≈1.17 s in, last click at 7 s).
3. Hit record. No UI chrome is added to the slide, so the capture stays clean.

Notes:

- The `a` key is verified free of built-in Slidev 52.19.1 shortcuts (the client
  binds space, arrows, PageUp/PageDown, `d`, `o`, backtick, `g`, `f`, escape).
- Pressing `a` at the final click is a no-op — navigate back first to replay.
- The runner drives Slidev's real click state, so URL `?clicks` sync, the
  per-segment ~300 ms draw animations, and backward navigation all keep working
  mid-run.

## MCP: text descriptions become hot-reloading slides

Slidev ships its own MCP (Model Context Protocol) server; the deck enables it by
default in dev mode (disable with `mcp: false` in the headmatter). Both modes serve
the same tool set:

| Mode  | Command / endpoint                               | For                                            |
| ----- | ------------------------------------------------ | ---------------------------------------------- |
| stdio | `npx slidev mcp decks/stepflow-demo`             | Local agents that spawn a process (Claude Code, Obvious coder, …) |
| HTTP  | `http://localhost:4321/__mcp` (dev server on port 4321) | Agents/tools that speak Streamable HTTP |

Tool inventory (verified on Slidev 52.19.1):

| Tool                  | Arguments                          | Effect                                   |
| --------------------- | ---------------------------------- | ---------------------------------------- |
| `slidev-get-info`     | —                                  | Deck overview: entry, title, slide count, live nav |
| `slidev-list-slides`  | —                                  | Slide numbers, titles, layouts, source file |
| `slidev-get-slide`    | `no`                               | Full source of one slide                 |
| `slidev-update-slide` | `no`, `content?`, `note?`, `frontmatter?` | Patch an existing slide           |
| `slidev-insert-slide` | `after`, `content`, `frontmatter?`, `note?` | Insert a new slide after `no`   |
| `slidev-remove-slide` | `no`                               | Delete a slide                           |
| `slidev-move-slide`   | `from`, `before?` / `after?`       | Reorder slides                           |
| `slidev-goto-slide`   | `page`, `clicks?`                  | Navigate every connected browser         |

### JSON slide data an agent would generate

A diagram description turns into an inline `:steps` array on a slide. Given the text
*"a four-step release flow: plan the scope, build behind a flag, canary to 5%, then
flip it wide"*, an agent generates:

```json
{
  "steps": [
    { "id": "plan",   "title": "PLAN",   "subtext": "scope the work",        "icon": "git-branch" },
    { "id": "build",  "title": "BUILD",  "subtext": "behind a flag",         "icon": "square-terminal" },
    { "id": "canary", "title": "CANARY", "subtext": "5% of traffic first",   "icon": "flask-conical" },
    { "id": "wide",   "title": "ROLL OUT","subtext": "flip it wide",         "icon": "rotate-cw" }
  ]
}
```

and writes it into the deck as a slide via `slidev-insert-slide` (or `slidev-update-slide`
to edit an existing diagram):

```json
{
  "name": "slidev-insert-slide",
  "arguments": {
    "after": 2,
    "content": "<div class=\"stepflow-stage\">\n\n<StepFlow title=\"RELEASE FLOW\" :steps=\"[\n  { id: 'plan', title: 'PLAN', subtext: 'scope the work', icon: 'git-branch' },\n  { id: 'build', title: 'BUILD', subtext: 'behind a flag', icon: 'square-terminal' },\n  { id: 'canary', title: 'CANARY', subtext: '5% of traffic first', icon: 'flask-conical' },\n  { id: 'wide', title: 'ROLL OUT', subtext: 'flip it wide', icon: 'rotate-cw' }\n]\" />\n\n</div>",
    "frontmatter": { "layout": "center" }
  }
}
```

Because the component reads props from markdown and MCP edits markdown, a generated
diagram slide is identical in kind to a hand-written one — there is no second render
path, and every write hot-reloads in the open browser.

### Notes for agent authors

- Describe the **flow in plain text**: number of steps, each step's short uppercase
  title, a one-line dim subtext, and an icon intent. The agent maps icon intent to a
  Lucide key from the registry (`git-branch`, `flask-conical`, `server`, …).
- Keep titles short and uppercase (they render in mono under each disc) and subtexts
  to one line — the measured typography sizes them for 1920×1080.
- Wrap the component in a full-canvas stage (`<div class="stepflow-stage">` with
  `position: absolute; inset: 0`) so the SVG fills the slide.
- Do not add `v-click` wrappers yourself — the component owns one click per step
  internally; a 6-step diagram consumes six clicks on the slide.
- Reveal styling is CSS-driven and reduced-motion aware; nothing to wire up per slide.
- One caution discovered during development: do not write a literal `<style>` tag
  inside CSS comments or prose on a slide — Slidev's slide-level style extraction
  splits on tag occurrences and the slide SFC becomes unbalanced (build fails with
  *"Element is missing end tag"*).

## MCP smoke test

```bash
npm run test:mcp   # local only — not wired into CI
```

The script (`scripts/mcp-smoke.mjs`) spins up a **disposable** Slidev dev server on a
free port, connects a minimal MCP client to `/__mcp` (stateless Streamable HTTP,
SSE-framed JSON-RPC), and asserts:

1. the MCP tools list is non-empty;
2. `slidev-insert-slide` lands a scratch slide in the deck markdown;
3. hot reload is observed — the dev server broadcasts its `file-changed` HMR event
   for `slides.md` without a restart;
4. `slidev-remove-slide` returns the deck **byte-identical** to the committed state.

Exit code 0 = pass (plus a check that the reported slide count grew and shrank).
It resolves the dev server's loopback family (Vite binds `localhost` to either
`127.0.0.1` or `[::1]` depending on runtime DNS resolution) and cleans the server up
(SIGTERM, then SIGKILL). CI stays lint + test + build; run the smoke test locally
when touching the deck, the MCP surface, or upgrade Slidev.
