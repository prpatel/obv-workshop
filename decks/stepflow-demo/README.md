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
├─ slides.md                      # slides: title · StepFlow (6 v-clicks) · StairChain (7) · NodeEdge (13) · VerticalSpine (4) · HeroTile (1) · SchematicRows (10) · TwoBarCompare (3) · ColumnRow (6) · TileGrid (6) · RatioStrip (3) · SegmentTimeline (3) · StackPanels (4) · MilestoneLanes (5) · HexCluster (3)
├─ components/
│  ├─ StepFlow.vue                # the serpentine flow diagram (auto-imported by Slidev)
│  ├─ StairChain.vue              # family built-in: animated staircase (amber callout + rising blocks)
│  ├─ NodeEdge.vue                # bordered-square network diagram component (diagram-family spec)
│  ├─ VerticalSpine.vue           # family built-in: center-axis rhythm (marker, label row, side cards)
│  ├─ HeroTile.vue                # family built-in: single-click section-divider tile
│  ├─ SchematicRows.vue           # terminal-style token listing with an embedded thin-line schematic
│  ├─ TwoBarCompare.vue           # family built-in: two left-anchored comparison bars (data text, chips, annotation click)
│  ├─ ColumnRow.vue               # family built-in: tone-coded column row (heading chrome + rising columns + tinted labels)
│  ├─ TileGrid.vue                # family built-in: hex-tile grid with glow, connector track, and label rows (row-major build)
│  ├─ RatioStrip.vue              # family built-in: proportional band, two-phase pop + three-burst teal re-flow (wave 2)
│  ├─ SegmentTimeline.vue         # family built-in: thin track, bright fills between glowing nodes (sweep-then-pop)
│  ├─ StackPanels.vue             # family built-in: measured panel mosaic (sweep band + pop panels)
│  ├─ MilestoneLanes.vue          # family built-in: four-lane Gantt/milestone chart (offset bars + tick markers)
│  ├─ HexCluster.vue              # family built-in: hexagon cluster (outline pop + content fade)
│  ├─ AutoAdvance.vue             # renderless deck wiring: ?autoplay=N / a-key auto-advance + per-slide durationSec beats
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
│     ├─ hex.ts                   # pure hex-cluster layout + HexNodeData contract
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
| `accentAlt`      | `string` | — (stays undefined)  | status tones; NodeEdge amber `alt` nodes |
| `accentTertiary` | `string` | `accent`             | teal-green (`#1cd798` family): StackPanels green panel, HexCluster green icon and text |

`accentTertiary` merges with the same override-wins rule as every top-level
field. When omitted it resolves absent, and consumers read
`palette.accentTertiary ?? palette.accent` — so an `accent` override flows
into the fallback.

### Icon registry keys (`components/stepflow/icons.ts`)

`git-branch` · `square-terminal` · `flask-conical` · `braces` · `rotate-cw` ·
`server` · `database` · `cloud` · `user-round` · `bot` — unknown keys render the
visible fallback and warn in dev, so a wrong identification degrades safely.

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
| `NodeEdge`      | `nodeEdge.ts` — `NodeEdgeData` (nodes/edges/status)     | per node, then per edge, then per status | `cyanOnBlack` + measured seed (`#33a5cd`/`#e6b434`/`#5a1e1e`) | 4          | — |
| `VerticalSpine` | `spine.ts` — `SpineNode[]`; an empty-title center node renders the diamond marker, `side` picks the card slots | 4 — marker, label row, 2 side cards | `chainBlue` cards + `orangeSpine` spine/label | 5          | —           |
| `HeroTile`      | `spine.ts` — `HeroTileData` (tile + icon + optional label on the spine axis) | 1 — tile, icon, label together | `orangeSpine` verbatim (`#f85721`)            | 6          | `user-round` |
| `SchematicRows` | `rows.ts` — `SchematicRowsData` (rows + optional schematic) | one per row; schematic strokes share their attached row's click | override: v6-measured cool `#2f95b9` + amber `#f2ba1f` | 7          | —           |
| `TwoBarCompare` | `compare.ts` — `CompareBar[]` + `TwoBarCompareData` (bars/xFrac/barHFrac/yFracs + optional `dataText` block — `lines`/`subline`/`caption`/`note`/`rules` — and centered `subhead`) | 3 — bar 1, bar 2, then one shared annotation click for the data-text block, caption/note rows, divider rules, labels, and chips | `statusAmber` (the component's family default; rework adds the measured teal `#1cd797` top-chip tone) | 8          | —           |
| `ColumnRow`     | `columns.ts` — `ColumnRowData` (columns + `yFrac`/`hFrac` + optional `heading`/`labelRows`) | 5 columns left→right, then the label rows | `cyanOnBlack` base + token mix (`stepBlue` ship endpoint, `orangeSpine`/`statusAmber` accents, `accentTertiary` teal) | 9          | —           |
| `TileGrid`      | `tiles.ts` — `TileGridData` (tiles/cols + tile & pitch fracs; per-tile `tone`/`wFrac`/`hFrac`/`mini` overrides) | 6 — one per tile, row-major | `cyanOnBlack` (measured hex core `#1ed0e8` + matrix/row tones via `accentAlt`/`accentTertiary` + status/plain constants) | 10         | `cpu` · `boxes` · `layers` (candidates; fallback covers a wrong guess) |
| `RatioStrip`    | `strip.ts` — `RatioStripData` (segments + `yFrac`/`hFrac` + optional heading/caption) | 3 — band pop at initial proportions, three-burst teal re-flow, then chip + tone-colored caption row | measured gradients on the `accentAlt`/`accentTertiary` tokens — hue decisions in the notes below | 11         | —           |
| `SegmentTimeline` | `timeline.ts` — `TimelineSegment[]` (`tone` is `'accent'`/`'tertiary'`/`'alt'`, optional proportional `wFrac`, optional `label`/`sublabel`) | 3 — one per segment: node pop + fill sweep together | measured blue/cyan/red trio over `chainBlue` (no preset added) | 12         | —           |
| `StackPanels`   | `panels.ts` — `StackPanel[]` + optional `caption`       | one per panel + one label click     | `cyanOnBlack` + `accentTertiary`              | 13         | —           |
| `MilestoneLanes` | `lanes.ts` — `MilestoneLanesData` (lanes + measured y0/pitch/barH grid, per-bar `hFrac` override) | one per bar, then tick markers | `statusAmber` verbatim | 14         | —           |
| `HexCluster`    | `hex.ts` — `HexNodeData[]` + `arrangement`              | one per cell                        | `chainBlue` + `accentTertiary`                | 15         | `bot`       |

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

ColumnRow authoring notes (reworked to the ref t=229.0 composition — wave 2):
columns are equal-width at the measured 10.3%w × 23.3%h, tops at 51.4%h,
x-pitch 13.75%w, first column at 17.3%w — the row just carries fewer columns
for the four-column comparison variant (src 230–237s, `underline: true` on
each; its white underlines render in the family's amber status token). Tones
read the existing tokens plus the measured step blue: `accent` (house cyan via
the palette prop), `alt` (`accentAlt` override, else the `orangeSpine`
accent), `tertiary` (`accentTertiary`, else accent), `status` (the
`statusAmber` accent), `blue` (the `stepBlue` constant measured off the
ref's ship endpoint). Thin dark plate outlines rim every column edge and a
base rail runs under the field — near-black chrome, no click of its own. The
optional `heading` renders the measured chrome above the middle column (amber
bar-chip, white icon badge, wide white caption; static like the title), and
the optional `labelRows` carry text rows below the columns — one string per
column, revealed together on the final click; plain rows keep the legacy white
dot/label sizing, while `{ texts, tone: 'column' }` rows render at the
measured tinted-label size with every cell filled in its column's tone.
RatioStrip authoring notes (wave 2, research art_2kSBGNmJ §3.3 — source video
95–101s; fidelity rework per report art_iHm120ov §RatioStrip, settled frame
t=99.1s at 1920×1080): one proportional band, 71.5%w × 21.9%h at y 51.4%h,
that tells a share-of-total story in three native clicks — a two-phase build.
Click 1 pops the band at its initial widths (~120ms width ease); click 2
re-flows the teal region to its settled share in three bursts ~470ms apart
(measured 99.10 / 99.57 / 99.83s — stacked burst rects with stepped
transition-delays over the final copy); click 3 fades in the mint chip and
the tone-colored caption row. Segment widths are proportions — each state
normalizes over its own sum, so the band always reads as shares of 100%.
`wFrac` is the click-1 width, optional `wFracFinal` the re-flow destination
(burst 3; omit it and the segment holds its width); all clicks are
state-driven transitions on revealed-state classes — backward nav snaps,
reduced-motion freezes. The final state tiles the band exactly, so the
settled copy stacks over the initial one (the StepFlow dim-base +
stacked-copy pattern) with no residue. Static chrome (present before the
band pops): a dark panel plate (y≈331–440, x≈234–1685) and the white
`heading` row above the band. Caption labels adopt their segment's tone
family; the optional `caption` renders chrome-dim.

Hue decisions (report art_iHm120ov §RatioStrip — measured, replacing the
wave-2 hypotheses): the red segment is a red→salmon gradient (`accentAlt` →
measured `#f98c8c`) — the earlier "salmon/amber segment" was a misread of
that gradient's tail; no amber exists in the source. The teal region is the
bright left-to-right gradient `#76eec5` → the `accentTertiary` token (the
demo passes `#1cd798`); the darker-teal sub-band was a misread tone and is
gone. The mint chip `#a0fcd9` and the panel plate `#18181b` stay documented
local constants. Initial proportions are [I]: the measured 22k→108k px teal
re-flow seeds the teal at ~1/5 of its settled share with red holding the
rest; the burst waypoints (band shares 0.35 / 0.55) are re-paced [I].

Data contract (exported from `components/stepflow/strip.ts`):

```ts
interface StripSegment {
  id: string                       // stable key — Vue keys + test selectors
  tone: 'accent' | 'alt' | 'tertiary' | 'plain'
  wFrac: number                    // initial width, fraction of the band (click 1)
  wFracFinal?: number              // settled width after the click-2 re-flow (burst 3)
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
geometry is a pure SSR-safe module with fraction and canvas-bound validation
(`hexPath` draws the pointed left-right hexagon inside each box; `tileTrackLines`
resolves the per-row connector track). Wave-2 measured anatomy (report
art_iHm120ov §TileGrid): saturated `#1ed0e8` hex cores (~0.825 × 0.93 of the
box) under a blurred glow halo, a ~12px `#353642` track through tile centers,
a `#a0ecfb` sheen dash at the first tile's lit vertex, ~40px near-black icons
(stroke ≈3px at 1920), and below-tile double label rows — cyan `mini` over the
white label, both ~16px. One click per tile in data order. The measured matrix
(research src 57–60s: tone-coded 3×3 incl. amber/red/plain) and flat-row
(107–110s: eight tiles in two tone groups of four) are seed-data arrangements,
not extra components; unknown icon keys render the visible fallback icon and
warn in dev.

SegmentTimeline authoring notes: `segments` are proportional shares of the fillable
track — authored `wFrac` values (fractions of the source canvas width) are normalized
over the span left of the white lead (minus the measured gaps), and omitted shares
default to equal widths. `tone: 'accent'` / `'tertiary'` / `'alt'` render the measured
blue / cyan / red trio (`tertiary`/`alt` fall back to `accent` when a custom palette
omits them; this wave adds no palette preset). Nodes derive from the fills they cap
(30px past each fill's right end), so the 2px node-colored ticks and the two-row white
`label`/`sublabel` blocks can never drift. The fill sweep is a revealed-state width
transition (~2.4s, the `.sf-track-fill` pattern): each fill completes just before the
next click pops the next node — sweep-then-pop, instant snap on backward nav.

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

The free-position node-edge network built-in, on the shared contract
(src-3 recording — re-measured against the settle frame t=4.0, fidelity
report art_v4jVdTnp §2, which corrects the earlier circular-outline read:
those were the bounding boxes). Node positions are **data**, never computed:
`(xFrac, yFrac)` are canvas fractions of the 1920×1080 stage. The node
primitive is a ~100px SQUARE — a `#0b0a11` plate, a 6px tone-colored border,
and a 3-line ~20px tone-colored label inside — plus the solid bright-red
status square (`tone: 'status'`, ~102×149px, bright red reserved for status
only). Edges are dim-red polylines over the same fractions (the palette
`track`, ~6px) that pop in — measured at the recording's native fps, an edge
reaches full ink 1–2 frames after onset (~55–80ms): a pop, not a dashoffset
draw, and no dim base edge exists before reveal. The optional status layer
(solid blocks, outlined boxes, arrow glyphs) hangs off a node and reveals
additively — the recording's amber→red swap is modeled **appearance-only**
(locked deviation): nothing is ever removed. Static chrome: a red ambient
wash behind the network zone, the two-line terminal readout bottom-left, and
the 7.2%h mono header.

Choreography: one click per node (data order, ~70ms pop), then one per edge
(~80ms pop), then one per status element — all native `v-click`s, instant
backward nav, reduced-motion freezes reveals.

```md
<NodeEdge
  title="DATA"
  title-accent="PLATFORM"
  :palette="{ accent: '#33a5cd', accentAlt: '#e6b434', track: '#5a1e1e' }"
  :terminal="['LAST DEPLOY 14M AGO', 'VER 2.4.1']"
  :nodes="[
    { id: 'ingest', xFrac: 0.515, yFrac: 0.524, tone: 'accent', label: ['INGEST', 'EVENTS', '12K/S'] },
    { id: 'lag', xFrac: 0.159, yFrac: 0.605, tone: 'status', label: ['SLOW', '5M'] },
  ]"
  :edges="[
    { from: 'ingest', to: 'lag', points: [[0.515, 0.524], [0.159, 0.605]] },
  ]"
/>
```

Component props:

| Prop          | Type                          | Purpose                                                        |
| ------------- | ----------------------------- | -------------------------------------------------------------- |
| `nodes`       | `FlowNode[]` (required)       | Free-position nodes; positions are data (canvas fractions)     |
| `edges`       | `FlowEdge[]` (required)       | Polylines between node ids; fractions of the canvas            |
| `status`      | `FlowStatus[]`                | Optional status layer, one click per element                   |
| `palette`     | `Partial<StepFlowPalette>`    | Merged over the measured `cyanOnBlack` preset (the demo seeds the recording's `#33a5cd`/`#e6b434`/`#5a1e1e`) |
| `title`       | `string`                      | Mono header line rendered top-left at 7.2%h (e.g. `DATA`)      |
| `titleAccent` | `string`                      | Header tail rendered in chrome green (two-tone chrome)         |
| `terminal`    | `string[]`                    | White mono readout lines, bottom-left (one row each)           |

Data contract (exported from `components/stepflow/nodeEdge.ts`; the exact shape
an MCP agent writes):

```ts
interface FlowNode {
  id: string                        // stable key — edge endpoints + status attachment
  xFrac: number                     // square-center x, canvas fraction [0, 1]
  yFrac: number                     // square-center y, canvas fraction [0, 1]
  tone: 'accent' | 'alt' | 'plain' | 'status'
  // accent/alt/plain = bordered plate; 'status' = solid bright-red status square
  label?: string | string[]         // label lines rendered inside the square (tone-colored)
}
interface FlowEdge {
  from: string                      // FlowNode.id
  to: string                        // FlowNode.id
  points: [number, number][]        // polyline vertices, canvas fractions — pops in dim red
}
interface FlowStatus {
  attach: string                    // FlowNode.id this element hangs off
  text: string                      // short label inside block/outline, under the arrow
  tone: 'alt' | 'accent'            // palette role of the element's fill/stroke
  kind: 'block' | 'outline' | 'arrow'
}
```

Layout rules an author can rely on: nodes render as ~96px squares (5.0%w,
rx 10, 6px border; the status square is ~102×149px); block/outline status
elements hang left of their node, arrows hang below; edges must reference
known node ids and stay inside the canvas — violations throw `RangeError`
(at build/authoring time), never render blank. `polylinePath` lives in
`paths.ts`, shared with the SchematicRows schematic (the extraction
triggered when SchematicRows became the third consumer); the dashoffset-era
`polylineLength` no longer has a NodeEdge consumer (edges pop, they don't
draw) and remains exported from `paths.ts` for SchematicRows.

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

#### HexCluster — hexagon cluster (v5)

One cell per node; each click pops one cell's outline in (~60ms ease-out
opacity/scale arrival — the v5 recording's one-frame pop, not a stroke draw)
and fades in its inner title, caption rows, and icon on the same click — the
two-phase pattern. The recording's settled state is a single TANGENT row
(the V re-flows after its build-up); the demo slide ships that composition
via `arrangement: 'row'` + the measured geometry overrides below.

| Prop | Type | Purpose |
| ---- | ---- | ------- |
| `nodes` | `HexNodeData[]` (required) | One entry per cell: `id`, `title`, `caption`, `icon`, `tone?` |
| `palette` | `Partial<StepFlowPalette>` | Merged over the measured `cyanOnBlack` preset — pass `{ accent: '#349aea', accentTertiary: '#20c88c' }` for the measured chainBlue/teal combination |
| `geometry` | `HexOptions` | Optional fraction overrides: `hexRFrac`, `pitchXFrac`, `dropFrac`, `topFrac`, `centerXFrac`, `strokeFrac` |
| `arrangement` | `'v' \| 'row'` | Honeycomb V (the build-up shape) or a single row — the recording's settled state |
| `geometry` note | — | The settled row ships `{ centerXFrac: 0.475, pitchXFrac: 0.2275, topFrac: 0.603 }` (measured: centers 24.8/47.5/70.3%w, cy 0.603·h, span 13.4–81.7%w) |
| `title` | `string` | Mono header line (white, oversized recording type ≈ 0.112·h, centered on the cluster axis) |
| `titleAccent` | `string` | Header tail in chrome green (the convention above) |
| `legend` | `string` | Short amber (`#ebb92a`, measured) legend line above the center column's top vertex |

Captions may carry `\n` breaks — each becomes one ~34px tone-colored text row
(the v5 cells hold multi-row text; no gray inside the outlines). Header chrome
also ships a white bottom rule: 67.8%w × ≈6px at y 0.8944·h, centered on the
cluster axis (measured x 13.7–81.5%w, y 1023–1029 at native 1144 height).

`tone: 'tertiary'` renders that cell's icon AND text rows in
`accentTertiary ?? accent` (the teal-green icon and text in the recording);
other cells' icon and text stay in the accent — the v5 cells carry
tone-colored text, no gray inside the outlines.
Geometry lives in `components/stepflow/hex.ts` (pure, SSR-safe, analytic
perimeter = 6·R); the demo slide is slide 15 with inline seed data.

Accepted deviation (measured this session): the v5 recording's three outlines
are geometrically **circles** (radial spread ≤ 2.5%, where a regular hexagon
varies ~15.5% between facet midpoints and vertices). The locked family design
— name, roster row, and contract — specifies hexagons, so the measured
across-diameter (≈ 0.406·canvas height) maps onto a pointy-top hexagon's
vertical extent. Flipping the family to circles is a one-constant change in
`hex.ts` if the design is amended.

## Hands-free playback (auto-advance)

The demo slide can play its six-click reveal by itself — built for screen
recordings. Orchestration lives at deck level (`components/AutoAdvance.vue`
bridging the pure `components/stepflow/useAutoAdvance.ts` runner to Slidev's
navigation); the StepFlow component itself stays pure — no timers, no global
state reads.

| Surface | Behavior |
| ------- | -------- |
| `?autoplay=N` URL param | Auto-starts the run on slide enter, evenly spaced across N seconds (`/2?autoplay=7` → the six clicks over 7 s, ≈1.17 s apart, first click one interval in). Bare `?autoplay` or an invalid value falls back to the slide's own beat — its `durationSec` prop (the measured cadences below); 7 s where a slide sets none. |
| `a` key | Toggles a run over the slide's own beat — the per-slide `durationSec` (7 s demo default where a slide sets none; no modifier held; `A` works too). |
| Arrow keys / space / PageUp / PageDown | Cancel a running auto-advance — the native navigation still applies. |
| Final click reached | The run stops cleanly; it never skips ahead to the next slide. |
| Leaving the slide / unmount | All timers and key listeners are cleaned up; re-entering with `?autoplay` still in the URL replays the run. |

### Per-slide pacing beats

A slide passes `durationSec` to `<AutoAdvance />` and the runner spreads the
slide's clicks evenly across it — pacing is set per slide from the fidelity
reports' measured inter-click cadences (art_v4jVdTnp, art_iHm120ov) instead of
the 7 s demo default. The runner has no per-click interval support (uniform
spacing only), so a varied recorded rhythm is encoded as its mean cadence.

| Slide | Family | Clicks | Measured cadence | `durationSec` | Spacing |
| ----- | ------ | ------ | ---------------- | ------------- | ------- |
| 3 | StairChain | 7 | 0.3–0.6 s/click (~300 ms block stagger early, 0.4–0.6 s late) | `4` | ≈0.57 s/click |
| 4 | NodeEdge | 9 | 0.3–0.9 s/click, mean ≈0.55 s (wave-1 family band) | `5` | ≈0.56 s/click |
| 5 | VerticalSpine | 4 | ~1.2–1.5 s between phases (marker 0.4 s → bottom rows 5.8 s) | `5` | 1.25 s/click |
| 7 | SchematicRows | 8 | 0.3–0.5 s/row | `4` | 0.5 s/row |
| 8 | TwoBarCompare | 3 | ≥1.5 s between bars | `5` | ≈1.67 s/click |
| 10 | TileGrid | 6 | ≈1.45 s/tile (measured 27.32→28.77 s) | `8.7` | 1.45 s/tile |
| 12 | SegmentTimeline | 3 | node pop ≈140ms, then ≈2.4s fill sweep per segment (measured 10–90% over 2.55s) | `7.5` | 2.5 s/click |
| 13 | StackPanels | 4 | 0.4–0.5 s burst cadence | `1.8` | 0.45 s/click |
| 15 | HexCluster | 3 | 0.4–0.5 s/click | `1.4` | ≈0.47 s/click |

Slides 2 (StepFlow, the endorsed calibration slide), 6 (HeroTile, single
click), 9 (ColumnRow), 11 (RatioStrip), and 14 (MilestoneLanes) keep the 7 s
default — the reports give them no measured inter-click cadence; their notes
are within-click choreography, which is component-level work, not click
pacing.

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

## StairChain two-tone fidelity note (wave-1 rework)

Supplements the StairChain authoring notes above: a step now also carries an
optional `tone` role — `'accent'` (the blue block fill, default) or
`'tertiary'` (the cyan fill, `accentTertiary ?? accent`). The v1 recording is
two-tone — blocks 1–3 blue `#3599fb`, blocks 4–6 cyan `#1fd0ea` (frame t=7.9,
wave-1 fidelity report) — so the demo slide passes
`:palette="{ accent: '#3599fb', accentTertiary: '#1fd0ea' }"` and seeds the
split through per-step tones, leaving the component's `chainBlue` default
untouched for the other chainBlue consumers. The recording's in-block labels
are the step numbers `01`–`06` (28–40px white mono, centered), so the demo
seeds those as the `title`s; the ambient layer — slate `#363946` shadow masses
beside blue blocks, dark-teal ambience feathers around cyan ones — is drawn
beside/behind each block and reveals with it. The block rise is a measured
80ms ease-out pop; the ~300ms block stagger stays owned by the slide's
AutoAdvance beat.
