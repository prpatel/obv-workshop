# StepFlow demo deck

Slidev deck for the StepFlow animated-diagram demo (`decks/stepflow-demo`): a house-style
title slide, a six-step demo slide that reveals one node per click, and the
family built-in demo slides appended after it — all on the 1920×1080 black canvas.

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
├─ slides.md                      # slides: title · StepFlow (6 v-clicks) · StairChain (7) · NodeEdge (9) · VerticalSpine (4) · HeroTile (1) · SchematicRows (8) · TwoBarCompare (3) · ColumnRow (6) · TileGrid (6) · RatioStrip (2) · SegmentTimeline (3) · StackPanels (4) · MilestoneLanes (5)
├─ components/
│  ├─ StepFlow.vue                # the serpentine flow diagram (auto-imported by Slidev)
│  ├─ StairChain.vue              # family built-in: animated staircase (amber callout + rising blocks)
│  ├─ NodeEdge.vue                # free-position network diagram component (diagram-family spec)
│  ├─ VerticalSpine.vue           # family built-in: center-axis rhythm (marker, label row, side cards)
│  ├─ HeroTile.vue                # family built-in: single-click section-divider tile
│  ├─ SchematicRows.vue           # terminal-style token listing with an embedded thin-line schematic
│  ├─ TwoBarCompare.vue           # family built-in: two left-anchored comparison bars (icon chips + annotation click)
│  ├─ ColumnRow.vue               # family built-in: tone-coded column row (rising columns + label rows)
│  ├─ TileGrid.vue                # family built-in: tone-coded icon-tile grid (row-major build)
│  ├─ RatioStrip.vue              # family built-in: proportional band with a live re-proportion (wave 2)
│  ├─ SegmentTimeline.vue         # family built-in: proportional sweep bar with milestone ticks
│  ├─ StackPanels.vue             # family built-in: measured panel mosaic (sweep band + pop panels)
│  ├─ MilestoneLanes.vue          # family built-in: four-lane Gantt/milestone chart (offset bars + tick markers)
│  ├─ AutoAdvance.vue             # renderless deck wiring: ?autoplay=N / a-key auto-advance
│  └─ stepflow/
│     ├─ geometry.ts              # pure serpentine layout math (viewBox-relative)
│     ├─ stair.ts                 # pure staircase layout math (uniform ramp + per-block lift overrides)
│     ├─ nodeEdge.ts              # NodeEdge contract + pure layout math
│     ├─ compare.ts               # TwoBarCompare contract + pure left-anchored pair layout
│     ├─ timeline.ts              # pure proportional-timeline layout math (bar, segments, ticks, chip)
│     ├─ paths.ts                 # shared polylinePath/polylineLength (StepFlow track, NodeEdge edges, rows schematic)
│     ├─ rows.ts                  # SchematicRows contract + pure token-row/schematic layout math
│     ├─ spine.ts                 # pure spine + hero-tile layout math + family contracts
│     ├─ columns.ts               # ColumnRow contract + pure column-row layout math
│     ├─ strip.ts                 # pure ratio-strip layout math (initial + final width states)
│     ├─ lanes.ts                 # MilestoneLanes contract + pure lane-grid layout math
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

## Shared contract: palettes, icons, title chrome

Foundation conventions for the diagram-family components (StairChain, NodeEdge,
StackPanels, HexCluster, SchematicRows, VerticalSpine, HeroTile, SegmentTimeline). StepFlow ships
today; each family component adopts these in its own PR — with zero visual
change to existing slides.

### Palette presets (`components/stepflow/palettes.ts`)

Pass a preset as the `palette` prop (or merge fields over it with
`resolvePalette`). Blue-family hues normalize to `#349aea`; the black canvas is
the deck style, not a palette field.

| Preset        | `accent`  | `accentAlt` | Measured from                                   |
| ------------- | --------- | ----------- | ----------------------------------------------- |
| `cyanOnBlack` | `#23d7ed` | —           | default house style (visual spec §2–§7)         |
| `orangeSpine` | `#f85721` | —           | v7 spine marker / hero tile                     |
| `statusAmber` | `#f7ba20` | `#e5413f`   | v3 node-edge status recording                   |
| `chainBlue`   | `#349aea` | `#f7ba20`   | v1 staircase recording (amber = locked default) |

### Optional palette fields

| Field            | Type     | Fallback             | Consumed by                              |
| ---------------- | -------- | -------------------- | ---------------------------------------- |
| `accentAlt`      | `string` | — (stays undefined)  | status tones; NodeEdge red edges          |
| `accentTertiary` | `string` | `accent`             | teal-green (`#1cd798` family): StackPanels green panel, HexCluster green icon |

`accentTertiary` merges with the same override-wins rule as every top-level
field. When omitted it resolves absent, and consumers read
`palette.accentTertiary ?? palette.accent` — so an `accent` override flows
into the fallback.

### Icon registry keys (`components/stepflow/icons.ts`)

`git-branch` · `square-terminal` · `flask-conical` · `braces` · `rotate-cw` ·
`server` · `database` · `cloud` · `user-round` — unknown keys render the visible
fallback and warn in dev, so a wrong identification degrades safely.

### Title chrome convention: `titleAccent`

Family components accept an optional `titleAccent?: string` prop: the mono
header renders `title` in white with the `titleAccent` tail in chrome-green
`#66fb00` (the recordings' two-tone header). `#66fb00` is a constant of this
convention, never a palette field. There is deliberately **no shared chrome
component** — each family component renders its own two-tone title (word order
varies per recording; arbitrary word-level coloring is out of scope).

### Family components

Each family built-in is a component + pure geometry module + one demo slide,
appended in merge order. The component owns its v-click choreography — a slide
consumes the listed click count, nothing more. The data contracts live in the
geometry modules (contract + layout are coupled by design) and seed data stays
inline on the demo slides; data order is the click order for every family.

| Component       | Data contract (`components/stepflow/`)                 | Clicks                              | Palette preset                                | Demo slide | Icons added |
| --------------- | ------------------------------------------------------- | ----------------------------------- | --------------------------------------------- | ---------- | ----------- |
| `StepFlow`      | `steps.ts` — `StepFlowStep[]`                           | 6 — one per step                    | `cyanOnBlack`                                 | 2          | —           |
| `StairChain`    | `stair.ts` — `StairStep[]` + optional `StairCallout`    | 1 + one per block                   | `chainBlue`                                   | 3          | —           |
| `NodeEdge`      | `nodeEdge.ts` — `NodeEdgeData` (nodes/edges/status)     | per node, then per edge, then per status | `cyanOnBlack` + `statusAmber` recording base | 4          | `database` · `cloud` |
| `VerticalSpine` | `spine.ts` — `SpineNode[]`; an empty-title center node renders the diamond marker, `side` picks the card slots | 4 — marker, label row, 2 side cards | `chainBlue` cards + `orangeSpine` spine/label | 5          | —           |
| `HeroTile`      | `spine.ts` — `HeroTileData` (tile + icon + optional label on the spine axis) | 1 — tile, icon, label together | `orangeSpine` verbatim (`#f85721`)            | 6          | `user-round` |
| `SchematicRows` | `rows.ts` — `SchematicRowsData` (rows + optional schematic) | one per row; schematic strokes share their attached row's click | override: v6-measured cool `#2f95b9` + amber `#f2ba1f` | 7          | —           |
| `TwoBarCompare` | `compare.ts` — `CompareBar[]` + `TwoBarCompareData` (bars/xFrac/barHFrac/yFracs) | 3 — bar 1, bar 2, then one shared annotation click for labels/chips | `statusAmber` (the component's family default) | 8          | —           |
| `ColumnRow`     | `columns.ts` — `ColumnRowData` (columns + `yFrac`/`hFrac` + optional `labelRows`) | 5 columns left→right, then the label rows | `cyanOnBlack` base + token mix (`orangeSpine`/`statusAmber` accents, `accentTertiary` teal) | 9          | —           |
| `TileGrid`      | `tiles.ts` — `TileGridData` (tiles/cols + tile & pitch fracs; per-tile `tone`/`wFrac`/`hFrac` overrides) | 6 — one per tile, row-major | `cyanOnBlack` (matrix/row tones via `accentAlt`/`accentTertiary` + status/plain constants) | 10         | `cpu` · `boxes` · `layers` (candidates; fallback covers a wrong guess) |
| `RatioStrip`    | `strip.ts` — `RatioStripData` (segments + `yFrac`/`hFrac` + optional caption) | 2 — build at initial proportions, then re-proportion + captions | `statusAmber` + `accentTertiary` recording base — hue decision in the notes below | 11         | —           |
| `SegmentTimeline` | `timeline.ts` — `TimelineSegment[]` (`tone` is `'accent'` or `'alt'`, optional proportional `wFrac`) + `TimelineTick[]` (`xFrac`, `label`) | 3 — one sweep per segment, then the labels layer | `chainBlue` + `orangeSpine` composed (no preset added) | 12         | —           |
| `StackPanels`   | `panels.ts` — `StackPanel[]` + optional `caption`       | one per panel + one label click     | `cyanOnBlack` + `accentTertiary`              | 13         | —           |
| `MilestoneLanes` | `lanes.ts` — `MilestoneLanesData` (lanes + measured y0/pitch/barH grid, per-bar `hFrac` override) | one per bar, then tick markers | `statusAmber` verbatim | 14         | —           |

StairChain authoring notes: each step carries `title` (uppercase white, rendered
inside the block), `caption` (one accent line below), and an optional `lift` —
the block's total rise above the base block as a fraction of canvas height;
omitted lifts follow the uniform 6.8%h-per-step ramp. The demo seed reproduces
the v1 recording's RETRY dip through measured `lift` overrides, and the optional
`callout` renders the amber floating annotation that reveals first.

VerticalSpine authoring notes: `side: 'center'` nodes stack down the spine axis
in data order — an empty-title node renders the solid orange diamond marker, a
titled one renders the label row (flanked by small accent diamonds); `side:
'left' | 'right'` nodes fill the two measured card slots with `title` inside and
`caption` beneath.

HeroTile authoring notes: single click — `icon` (Lucide key) plus an optional
`label` beneath the tile; the palette defaults to the measured `orangeSpine`
preset verbatim, so the tile color needs no override.

ColumnRow authoring notes: columns are equal-width at the measured 10.3%w ×
23.3%h, tops at 51.4%h, x-pitch 13.75%w, first column at 17.3%w — the row just
carries fewer columns for the four-column comparison variant (src 230–237s,
`underline: true` on each; its white underlines render in the family's amber
status token). Tones read the existing tokens: `accent` (house cyan via the
palette prop), `alt` (`accentAlt` override, else the `orangeSpine` accent),
`tertiary` (`accentTertiary`, else accent), `status` (the `statusAmber`
accent). The optional `labelRows` carry the measured dot row + label row below
the columns — one string per column, revealed together on the final click.
RatioStrip authoring notes (wave 2, research art_2kSBGNmJ §3.3 — source video
95–101s): one proportional band, 71.5%w × 21.9%h at y 51.4%h, that tells a
share-of-total story in two native clicks. Click 1 builds every segment at its
initial width (segments grow rightward in parallel); click 2 re-proportions the
band to the settled shares while the caption row and the teal region's
internals (a mint label chip at the region's left edge, a darker-teal sub-band
right-aligned) fade in. Segment widths are proportions — each state normalizes
over its own sum, so the band always reads as shares of 100%. `wFrac` is the
click-1 width, optional `wFracFinal` the click-2 destination (omit it and the
segment holds its width); both clicks are state-driven width transitions on
revealed-state classes — backward nav snaps, reduced-motion freezes. The final
state tiles the band exactly, so the settled copy stacks over the initial one
(the StepFlow dim-base + stacked-copy pattern) with no residue.

Hue decision (the wave-2 palette-neutral rule — no new preset): the settled
frame reads a large teal region with a salmon segment (`#f77c7b`) and a mint
chip (`#9dfbd6`). Teal maps to the `accentTertiary` token (the demo passes
`#1cd798`; blue/teal-family hues normalize to their token per the house
convention), red to `statusAmber.accentAlt`, and the salmon — the
compression-muddied-amber hypothesis; evidence crops were not available at
build time, so the research's guidance decides — maps to `statusAmber.accent`
(`#f7ba20`) rather than introducing a sixth hue. The mint chip stays a
documented local constant (`MINT` in `RatioStrip.vue`, chip fill only), and the
darker-teal sub-band renders as a 35% black overlay on the resolved teal token
so it stays darker than whatever teal the palette resolves to. Initial
proportions are [I]: the measured 22k→108k px teal re-flow seeds the teal at
~1/5 of its settled share with red/amber holding the rest.

Data contract (exported from `components/stepflow/strip.ts`):

```ts
interface StripSegment {
  id: string                       // stable key — Vue keys + test selectors
  tone: 'accent' | 'alt' | 'tertiary' | 'plain'
  wFrac: number                    // initial width, fraction of the band (click 1)
  wFracFinal?: number              // settled width after the re-proportion (click 2)
  label?: string                   // caption-row label under the segment's final left edge
}
interface RatioStripData {
  segments: StripSegment[]
  yFrac: number                    // band top edge, canvas-height fraction (measured 370/720)
  hFrac: number                    // band height, canvas-height fraction (measured 158/720)
  caption?: string                 // single dim caption line — author labels XOR caption
}
```

TileGrid authoring notes: tiles lay out row-major from `x0Frac`/`y0Frac` with
uniform `pitchXFrac`/`pitchYFrac` steps and `tileWFrac`/`tileHFrac` defaults —
geometry is a pure SSR-safe module with fraction and canvas-bound validation.
One click per tile in data order. The measured matrix (research src 57–60s:
tone-coded 3×3 incl. amber/red/plain) and flat-row (107–110s: eight tiles in
two tone groups of four) are seed-data arrangements, not extra components;
unknown icon keys render the visible fallback icon and warn in dev.

SegmentTimeline authoring notes: `segments` are proportional shares of the measured bar —
authored `wFrac` values (fractions of the source canvas width) are normalized to fill the span
exactly, and omitted shares default to equal widths. `tone: 'accent'` renders chainBlue and
`'alt'` renders orangeSpine (composed presets — this wave adds no palette preset). Ticks are
`xFrac` + `label`; tick lines, tick labels, and the optional right-side `chip` box are measured
constants derived from the bar. The sweep is a revealed-state width transition (the
`.sf-track-fill` pattern): no path-length math, instant snap on backward nav.

StackPanels authoring notes: list panels in reveal order — the sweep band first
(`bandReveal: 'sweep'`), then the sub-panels (`'pop'`, the default). `tone`
resolves against the palette (`'tertiary'` falls back to `accent` when the
palette omits `accentTertiary`). Panel `title`/`rows` render dark, centered in
their panels; the optional `caption` renders white, centered under the
composition. The recording's two-shade band fill (blue `#3599fb` left, cyan
`#1fd0ea` right) ships as one `accent` band — the contract carries no fourth
tone. Accepted deviation: the recording is a continuous auto-run, re-paced to
one click per panel plus one shared stepped-label click.

MilestoneLanes authoring notes: bar offsets and sizes are data — `(xFrac,
wFrac)` are canvas-width fractions, and the lane grid rides the measured
`y0Frac` / `lanePitchFrac` / `barHFrac` (a per-bar `hFrac` overrides the
default height; the seed's short lanes measure 24px at 720 vs 35px tall). One
click grows each bar from its left edge — the recording's pop-then-re-flow is
simplified to a single width reveal (accepted re-pace deviation) — then the
amber tick markers spread across lanes on the final click. The palette
defaults to the measured `statusAmber` preset verbatim: red bars are
`tone: 'alt'`.

## Family component: NodeEdge (`components/NodeEdge.vue`)

The free-position node-edge network built-in, on the shared contract
(v3 recording — research art_0AzKGXnD §F2, re-measured against frame crops).
Node positions are **data**, never computed: `(xFrac, yFrac)` are
canvas fractions of the 1920×1080 stage. Edges are polylines over the same
fractions, drawn with the StepFlow dim-base + stacked accent-copy dashoffset
draw; the optional status layer (solid blocks, outlined boxes, arrow glyphs)
hangs off a node and reveals additively — the recording's amber→red swap is
modeled **appearance-only** (locked deviation): nothing is ever removed.

Choreography: one click per node (data order), then one per edge, then one per
status element — all native `v-click`s, instant backward nav, reduced-motion
freezes reveals.

```md
<NodeEdge
  title="DATA"
  title-accent="PLATFORM"
  :palette="{ accent: '#349aea', accentAlt: '#e5413f' }"
  :nodes="[
    { id: 'ingest', xFrac: 0.6363, yFrac: 0.4017, tone: 'alt', label: 'INGEST' },
    { id: 'catalog', xFrac: 0.7569, yFrac: 0.7723, tone: 'plain', icon: 'database' },
  ]"
  :edges="[
    { from: 'ingest', to: 'catalog', status: true,
      points: [[0.6363, 0.4476], [0.6363, 0.8462]] },
  ]"
  :status="[
    { attach: 'catalog', text: 'SLOW 5m', tone: 'alt', kind: 'block' },
  ]"
/>
```

Component props:

| Prop          | Type                          | Purpose                                                        |
| ------------- | ----------------------------- | -------------------------------------------------------------- |
| `nodes`       | `FlowNode[]` (required)       | Free-position nodes; positions are data (canvas fractions)     |
| `edges`       | `FlowEdge[]` (required)       | Polylines between node ids; fractions of the canvas            |
| `status`      | `FlowStatus[]`                | Optional status layer, one click per element                   |
| `palette`     | `Partial<StepFlowPalette>`    | Merged over the measured `cyanOnBlack` preset (`statusAmber` is the recording's base) |
| `title`       | `string`                      | Mono header line rendered top-left (e.g. `DATA`)               |
| `titleAccent` | `string`                      | Header tail rendered in chrome green (two-tone chrome)         |

Data contract (exported from `components/stepflow/nodeEdge.ts`; the exact shape
an MCP agent writes):

```ts
interface FlowNode {
  id: string                       // stable key — edge endpoints + status attachment
  xFrac: number                    // circle-center x, canvas fraction [0, 1]
  yFrac: number                    // circle-center y, canvas fraction [0, 1]
  tone: 'accent' | 'alt' | 'plain' // accent/alt stroke; plain = chrome white + icon
  icon?: string                    // key into the icon registry (plain nodes)
  label?: string                   // short label rendered inside the circle
}
interface FlowEdge {
  from: string                     // FlowNode.id
  to: string                       // FlowNode.id
  points: [number, number][]       // polyline vertices, canvas fractions
  status?: boolean                 // red status edge → dim base + accentAlt draw
}
interface FlowStatus {
  attach: string                   // FlowNode.id this element hangs off
  text: string                     // short label inside block/outline, under the arrow
  tone: 'alt' | 'accent'           // palette role of the element's fill/stroke
  kind: 'block' | 'outline' | 'arrow'
}
```

Layout rules an author can rely on: nodes render as ~48px-radius outlined
circles (measured 5.0%w); block/outline status elements hang left of their
node, arrows hang below; edges must reference known node ids and stay inside
the canvas — violations throw `RangeError` (at build/authoring time), never
render blank. `polylinePath`/`polylineLength` now live in `paths.ts`, shared
by the NodeEdge edges and the SchematicRows schematic (the extraction
triggered when SchematicRows became the third consumer).

## Family component: SchematicRows (`components/SchematicRows.vue`)

The terminal-style token listing with an embedded thin-line schematic (v6
recording — research art_0AzKGXnD §F5, re-measured against the settled frame).
Rows render as **HTML** — token `<span>`s inside v-click'd row divs, mono,
`white-space: pre` — because SVG text makes per-token coloring awkward; the
schematic is SVG polylines drawn with the shared dim-base + dashoffset pattern
(`components/stepflow/paths.ts`).

Token tones: `accent` and `alt` map to palette fields; `plain` (chrome white
`#f5f4f7`) and `chrome` (terminal green `#66fb00`) are constants of the tone
convention, never palette fields. An omitted `accentAlt` falls back to `accent`.

Choreography: one click per row (data order); a schematic line carries no click
of its own — it draws within its **attached row's** click (`attach: '<rowId>'`;
unattached lines distribute in order over the last rows). Rows fade-and-rise
~150ms; strokes draw ~300ms — all native `v-click`s, instant backward nav,
reduced-motion freezes reveals.

Locked deviation: the recording's continuous auto-run (a typewriter effect) is
re-paced to one click per row — no typewriter is built. Layout constants: row
pitch 5.8%h, first row 31.5%h, code margin 6.5%w, indent step 4.1%w, mono size
2.5%h — all re-measured from the settled v6 frame.

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
