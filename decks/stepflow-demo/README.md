# StepFlow demo deck

Slidev deck for the StepFlow animated-diagram demo (`decks/stepflow-demo`): the
house-style title slide plus the reference-faithful restart slides — seg01
(StairChain split-ascent) and seg08 (StackPanels dark mosaic) are mounted, and
the remaining six family slides land with the integration PRs — all on the
1920×1080 black canvas.

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
├─ slides.md                      # slides: title · StairChain seg01 (10 v-clicks) · StackPanels seg08 (4)
├─ components/
│  ├─ StairChain.vue              # family: measured seg01 split-ascent staircase (explicit placement, interleaved clicks, annotation waves)
│  ├─ StackPanels.vue             # family: measured seg08 four-panel dark mosaic (per-panel 300ms fades)
│  ├─ PillarRow.vue               # family: measured seg05 three-card icon row
│  ├─ ConvergeFlow.vue            # family: measured seg11 converge-branch flow
│  ├─ CompareBadge.vue            # family: measured seg12 plate-and-badge comparison
│  ├─ SpecPanel.vue               # family: measured seg14 progressive spec panel
│  ├─ StepPanel.vue               # family: measured seg15 four-step panel
│  ├─ TileSummary.vue             # family: measured seg16 three-tile summary
│  ├─ AutoAdvance.vue             # renderless deck wiring: ?autoplay=N / a-key auto-advance + per-slide measured beats
│  └─ stepflow/
│     ├─ stair.ts                 # pure staircase layout math (explicit SEG01_PLACEMENT + default gap/delta walk)
│     ├─ panels.ts                # StackPanels contract + pure mosaic layout (dark re-truth)
│     ├─ pillars.ts               # PillarRow contract + pure card-row layout math
│     ├─ converge.ts              # ConvergeFlow contract + pure layout math
│     ├─ compareBadge.ts          # CompareBadge contract + pure layout math
│     ├─ specPanel.ts             # SpecPanel contract + pure layout math
│     ├─ stepPanel.ts             # StepPanel contract + pure layout math
│     ├─ tileSummary.ts           # TileSummary contract + pure layout math
│     ├─ TitleChrome.vue          # shared two-tone title SVG fragment
│     ├─ chrome.ts                # title-chrome constants + geometry helpers
│     ├─ palettes.ts              # StepFlowPalette presets + resolvePalette merge
│     ├─ icons.ts                 # named Lucide path registry + visible fallback
│     └─ useAutoAdvance.ts        # pure click-cadence runner (nav boundary injected)
└─ styles/index.css               # deck-wide house style: black canvas, mono base font
```

`components/` is auto-imported, so a slide can use `<StairChain … />` with zero registration
code. Slide data travels with the slide as props — the component holds no global state.

## Authoring a diagram slide

A diagram is data-in via props; reveal state is owned by Slidev's native `v-click`
(one beat per click — the seg01 slide has ten). The inline props are the exact
shape an MCP agent writes:

```md
<div class="sf-demo-stage">

<StairChain
  title="THE DATA"
  title-accent="SYSTEMS LIFECYCLE"
  :palette="{ accent: '#3799fb', accentTertiary: '#1fd0ea', accentAlt: '#f9bb1f' }"
  :steps="[
    { id: 'ingest', title: '01', caption: 'SOURCE SYSTEMS', click: 2 },
    { id: 'quality', title: '04', tone: 'tertiary', caption: 'TESTS GATE DEPLOYS', click: 3 },
  ]"
/>

<AutoAdvance :duration-sec="3.07" :step-schedule-sec="[0.27, 0.53, 0.67, 0.80, 0.93, 1.07, 1.27, 2.07, 2.67, 3.07]" />

</div>
```

Component props (StairChain — the seg01 slide's family):

| Prop        | Type                            | Purpose                                                                        |
| ----------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `steps`     | `StairStep[]` (required)        | One entry per block: `id`, punched-number `title`, `caption`, optional `tone`/`click` |
| `callout`   | `StairCallout`                  | The amber floating annotation revealed on click 1                              |
| `placement` | `StairPlacement`                | Explicit per-block fractions (`SEG01_PLACEMENT`'s measured values) — omit for the default walk |
| `annotations` | `StairAnnotation[]`           | Late mark/text waves, each at its own 1-based click                             |
| `palette`   | `Partial<StepFlowPalette>`      | Merged over the `chainBlue` preset (settled medians as slide-level props)       |
| `title` / `titleAccent` | `string`           | Two-tone mono header through the shared `TitleChrome`                           |

Icon keys resolve against the Lucide registry in `components/stepflow/icons.ts`
(`git-branch`, `flask-conical`, `server`, `database`, `dash-grid`, …);
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
| `accentQuaternary` | `string` | `accent`           | fourth accent slot — the v4 StackPanels recording's four-tone mosaic (green) |

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
convention, never a palette field.

As of the shared chrome rework, families render the two-tone title through the
shared `components/stepflow/TitleChrome.vue` SVG fragment (geometry helpers in
`components/stepflow/chrome.ts`): a **centered** two-tone display title in the
sheet band y≈97–176 at 1920×1080, sized from each family's sheet-measured cap
height (`cap-height`/`cap-top` props, one decimal where the sheet measures one),
on the family's measured center axis (`center-x`, default canvas center).
Word order varies per recording (`accent-first` when the sheet shows the green
phrase first; arbitrary word-level coloring is out of scope). Families whose
sheets document the recording pill pass `badge` and get the green TopRightBadge
(x1850–1901, y19–61) drawn by the same component.

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
| `VerticalSpine` | `spine.ts` — `SpineNode[]` + optional `footer`; an empty-title center node renders the diamond marker, `side` picks the card slots | 5 — marker, label row, 2 side cards, footer row | outlined two-tone cards — accent `#24cce5` left / `accentAlt` `#3891e3` right (demo seed), `orangeSpine` spine/label | 5          | —           |
| `HeroTile`      | `spine.ts` — `HeroTileData` (tile + icon + optional label on the spine axis) | 1 — halo, tile, icon, label together | `orangeSpine` verbatim (`#f85721`), accent-derived halo | 6          | `user-round` |
| `SchematicRows` | `rows.ts` — `SchematicRowsData` (rows + callouts; defaults to the sheet-authoritative 7-row seed) | 10 — chrome, callout 1, rows 1–3, rail, then rows 4–7 with the band + callouts 2–4 keyed to their rows | sheet-sampled tones — keywords `#4298f2`, near-white idents, dim comments `#888791`, teal band `#08272c`, cyan rail `#35c2ea` | 7          | —           |
| `TwoBarCompare` | `compare.ts` — `CompareBar[]` + `TwoBarCompareData` (bars/xFrac/barHFrac/yFracs + optional `dataText` block — `lines`/`subline`/`caption`/`note`/`rules` — and centered `subhead`) | 5 — bar 1, bar 2, one shared annotation beat for the data-text block, caption/note rows, divider rules and chips, then the on-bar labels as their own measured beats 4–5 (2800–2983/7467–7667ms windows) | `statusAmber` (the component's family default; rework adds the measured teal `#1cd797` top-chip tone) | 8          | —           |
| `ColumnRow`     | `columns.ts` — `ColumnRowData` (columns + `yFrac`/`hFrac` + optional `heading`/`labelRows`/`labelPosition`/`numerals`/`lateLabels`/`note`) | 8 (exact trace): columns 1,2,3,4,6 — deferred below-labels 5,7 — heading numeral with col-5 (6) — note row last (8); legacy compositions stay at 5 + label rows | `cyanOnBlack` base + token mix (`stepBlue` ship endpoint, `orangeSpine`/`statusAmber` accents, `accentTertiary` teal) | 9          | —           |
| `TileGrid`      | `tiles.ts` — `TileGridData` (tiles/cols + tile & pitch fracs; per-tile `tone`/`wFrac`/`hFrac`/`mini` overrides) | 8 — six tiles row-major, then the two connector-track beats (7: row 1, 8: row 2) | `cyanOnBlack` (measured hex core `#1ed0e8` + matrix/row tones via `accentAlt`/`accentTertiary` + status/plain constants) | 10         | `cpu` · `boxes` · `layers` (candidates; fallback covers a wrong guess) |
| `RatioStrip`    | `strip.ts` — `RatioStripData` (segments + `yFrac`/`hFrac` + optional heading/caption) | 6 — band pop at initial proportions, settled layer + burst 1, burst 2, final segments, mint settle, then chip + tone-colored caption row (generation-7 decomposition of the 1133/2967/3433ms intra-click delays into explicit beats) | measured gradients on the `accentAlt`/`accentTertiary` tokens — hue decisions in the notes below | 11         | —           |
| `SegmentTimeline` | `timeline.ts` — `TimelineSegment[]` (`tone` is `'accent'`/`'tertiary'`/`'alt'`, optional proportional `wFrac`, optional `label`/`sublabel`) | 3 — one per segment: node pop + fill sweep together | measured blue/cyan/red trio over `chainBlue` (no preset added) | 12         | —           |
| `StackPanels`   | `panels.ts` — `StackPanel[]` + optional `caption`       | one per panel + one label click     | four-accent seed (`accent`…`accentQuaternary` = the recorded blue/cyan/amber/green) | 13         | —           |
| `MilestoneLanes` | `lanes.ts` — `MilestoneLanesData` (lanes + optional `diamonds`, per-lane `yFrac` override, measured y0/pitch/barH grid) | one reveal click + one settle click per bar, footer last | measured fills `#ED4342`/`#F9BB21` (no preset) | 14         | `map-pin`   |
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
'left' | 'right'` nodes fill the two measured card slots as outlined plates —
near-black `#0b0a11` fill with a 4–5px (source-scale) card-colored stroke, a
big bold card-tone `title` inside (the glyph mass is the measured 42–45% ink
of the card bbox; an optional `titleScale` node field tunes per-card glyph
ink for titles with more glyphs) and a 44px (1080-canvas) card-colored
`caption` underneath. The two-tone demo cards come from the palette: `accent` on the
left, `accentAlt` on the right. The optional `footer` prop reveals one last
gray row — a 75.2%-wide dim `#202020` rule centered on the spine axis plus
two `#a0a0a0` 24px lines centered under the card columns.

HeroTile authoring notes: single click — `icon` (Lucide key) plus an optional
`label` beneath the tile; an accent-derived radial halo (`glowR`, 8.13%w) sits
under/around the tile and reveals with it. The optional `subtitle` prop adds a
secondary white header line (~40px at 1080) below the recording-scale primary
header. The palette defaults to the measured `orangeSpine` preset verbatim, so
the tile color needs no override.

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

ColumnRow authoring notes (exact-trace composition, sheet art_7yZkdmCE):
`labelPosition: 'below'` moves each label under its plate as tone-colored text
on the measured y868 baseline; `numerals` centers dark two-digit numerals
(`01`…) inside the plates riding their rise; `lateLabels` (ascending, unique
indices) gives those columns' below-labels a private beat right after their
column's; `note` renders a centered amber row under the field on the strictly
final beat; `heading: { numeral, caption }` swaps the badge disc for a white
display numeral gated to the last column's beat (chip bars land with it); the
caption carries the measured 0.135em tracking. `titleTextLength` pins the
title's measured ink extent (slide 9: 1097px). Columns 1–3's label cadence is
unrecoverable from the source — they ride their column beats, flagged
unverifiable.
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

StackPanels authoring notes: list panels in reveal order — the wave-1
re-measured mosaic is blue `#3599fb` top-left, cyan `#1fd0ea` top-right,
amber `#f7ba20` bottom-left, green `#1cd798` bottom-right, seeded via
`accent`/`accentAlt`/`accentTertiary`/`accentQuaternary` (the fourth slot was
added when the former one-shade band split; a missing slot falls back to
`accent`). Panels pop in ~60ms bursts (`'pop'`, the recording's mechanism;
`'sweep'` stays available at ~80ms). Panel `title` renders white (~40px at
1080) at the panel's top-left; `rows` render dark, left-aligned under it;
the optional `caption` renders white (~26px), centered under the
composition. Accepted deviation: the recording is a continuous auto-run,
re-paced to one click per panel plus one shared stepped-label click.

MilestoneLanes authoring notes: bar offsets and sizes are data — `(xFrac,
wFrac)` are canvas-width fractions, each lane takes an explicit `yFrac`
(non-uniform tops: y525/597/694/766 at 1080 in the demo), and the lane grid
rides the measured `y0Frac` / `lanePitchFrac` / `barHFrac` fallback (a
per-bar `hFrac` overrides the default height). Optional `diamonds` render
45°-rotated hollow squares with per-element radial glows on the marker
column (38px outer, 21px inner, 3.5px stroke); optional per-bar `text` with
`textLength` renders near-black captions inside long bars. Choreography
(exact-trace sheet art_kYBddwt9 §5): lane data is listed in reveal order and
bar k reveals on click 2k−1 in its own style — `sweep` (250ms rail sweep,
then a 500ms re-proportion to the seed on click 2k), `pop` (holds final
geometry, fades in), `grow` (733ms ease-out growth), `center` (120ms
center-out expansion) — and the closing beat 2n+1 lands the footer row.
Backward navigation snaps instantly (zero-animation). Lanes carry measured
fills (`tone: 'alt'` = #ED4342, `tone: 'accent'` = #F9BB21; no palette
preset). Measured text chrome: a header label row above lane 1 (34px,
amber glyph + dim gray mono `subtext`), a footer row with a teal `map-pin`
chip glyph (26px), and 35px lane labels tracked 0.4em left-aligned at x404
at 1920.

Dim ambience (true settled frame, clip 6600ms): the chart field is not
void black — the render carries a static neutral dim plate (`#0f0e11`) across
the full field. Bars and diamonds carry the glow instead of lane-wide
washes: each milestone diamond has its own radial glow (a radialGradient
sprite), and no per-lane tone washes or container frame remain in the
settled state. Static decorative chrome like the plate: no v-click, outside
the accessibility tree, and unchanged by reduced-motion (it never animates).

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

A slide can play its measured reveal by itself — built for screen recordings. Orchestration lives at deck level (`components/AutoAdvance.vue`
bridging the pure `components/stepflow/useAutoAdvance.ts` runner to Slidev's
navigation); the StepFlow component itself stays pure — no timers, no global
state reads.

| Surface | Behavior |
| ------- | -------- |
| `?autoplay=N` URL param | Auto-starts the run on slide enter, evenly spaced across N seconds (`/2?autoplay=4` → the slide's ten clicks evenly over 4 s, first click one interval in). Bare `?autoplay` or an invalid value falls back to the slide's own beat — its `durationSec`/`stepScheduleSec` props (the measured cadences below); 7 s where a slide sets none. |
| `a` key | Toggles a run over the slide's own beat — the per-slide `durationSec` (7 s demo default where a slide sets none; no modifier held; `A` works too). |
| Arrow keys / space / PageUp / PageDown | Cancel a running auto-advance — the native navigation still applies. |
| Final click reached | The run stops cleanly; it never skips ahead to the next slide. |
| Leaving the slide / unmount | All timers and key listeners are cleaned up; re-entering with `?autoplay` still in the URL replays the run. |

### Per-slide pacing beats

A slide passes `durationSec` (even spread) or `stepScheduleSec` (measured beats)
to `<AutoAdvance />` — pacing is set per slide from the fidelity reports'
measured onsets (art_v4jVdTnp, art_iHm120ov) instead of the 7 s default.

| Slide | Family | Clicks | Measured cadence | Pacing |
| ----- | ------ | ------ | ---------------- | ------- |
| 2 | StairChain (seg01) | 10 | callout + interleaved blocks 0.27–1.27s, annotation waves 2.07–3.07s | `stepScheduleSec` (10 measured beats) |
| 3 | StackPanels (seg08) | 4 | panel onsets 0.07 / 0.2 / 0.33 / 0.87s | `stepScheduleSec` (4 measured beats) |

The remaining six family slides (seg05/11/12/14/15/16) mount with the
integration PRs and pin their own measured schedules there.

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

## NodeEdge hard-cut end state (exact-trace rework)

Supplements the NodeEdge notes above: per the exact-trace sheet (art_4A7yguGJ
§2), the src recording's network is a MID-state — it hard-cuts out at
f265/t≈4417ms and the clip settles on a terminal/log composition (traffic
lights, `$ meshctl status --verbose`, a teal block cursor + `nodes : 6
healthy · 2` stat row, a very dim late center element, right third and bottom
empty). The demo slide therefore sequences 13 clicks: nodes pop on clicks
1–6, edges on 7–12 (the two replay hookups share beat 12), and click 13 IS
the hard cut. Every network-scene element — nodes, edges, and the red ambient
wash — binds a native Slidev click range `[reveal, 13)` (`v-click` array
values, Slidev ≥0.48): hidden at/after the cut, restored on backward nav, so
the v-click contract is preserved. `nodeEdgeClickPlan(nodeCount, edgeCount,
statusCount)` (in `stepflow/nodeEdge.ts`) derives the full beat map purely;
the component binds ranges from it. The terminal/log panel is the new
`terminal-log` prop (`{ command, stat }`) rendered as STATIC chrome at every
click count — it is both the recording's initial and settled state — and the
dim center element is the only element revealed BY the cut (`v-click="13"`).
Measured end-state geometry (lights, command line, stat row, cursor, center
element) lives in `TERMINAL_LOG_MEASURED` / `terminalLogLayout`. The old
bottom-left white `terminal` readout prop is removed (slide 4 was its only
consumer). Capture contract unchanged: `?clicks=13` is the settled end state.

## NodeEdge settled ambience + title condensation (exact-trace rework, cont.)

Two further measured treatments from the same rework: (1) the settled
reference is not pure black — dark-field profiles read a `#08070a` floor from
y≈330 down, a soft full-width `#141318` band behind the terminal row (y≈352–
414, uniform interior, ≈60px feathered edges), and a dimmer `#0f0e11` glow
plateau over the left half (y≈470–680). These ship as
`TERMINAL_LOG_AMBIENCE` / `ambienceLayout` and render inside the
terminal/log panel (Gaussian-feathered rects; static chrome, never
click-bound). The sheet's "right third and bottom empty" is empty of CONTENT;
the ambience is the recording's glow, measured where it actually is.
(2) The deck's mono face runs wider than the recording's condensed face, so
the slide pins the reference-measured ink extent via `TitleChrome`'s
`titleTextLength` — a spacing-only SVG `textLength` pin (additive prop,
undefined = natural mono width; glyphs are never squeezed). Slide 4 passes
`:title-text-length="1453"`; the captured title ink lands at x190–1643 vs the
reference's x190.3–1643.0.

## TileGrid measured-motion note (exact-trace rework)

Supplements the TileGrid authoring notes: the demo slide now plays the
sheet-measured cadence from the exact-trace reconstruction (art_7bTnqSB3
§2.3) instead of a uniform beat. Tile 1 fades in 550ms after the slide
entrance, then the remaining tiles land after gaps of 400 / 1383 / 1434 /
1050 / 1800ms — a GROWING row-major stagger (clicks fire at 550, 950, 2333,
3767, 4817, 6617ms), which uniform `durationSec` spacing cannot express.
The slide passes the measured beats to `<AutoAdvance :step-schedule-sec>`
(pure helper `tileStaggerSchedule` in `components/stepflow/tiles.ts` keeps
the numbers testable); `?autoplay` still triggers the run and a `runMs`
argument is ignored when the schedule covers every click. Each tile fades
~100ms (sheet-measured soft fade; the old 150/120ms reads were re-measured).
The #353642 connector track plays as two discrete v-click beats after tile 6
(generation-7 wave, art_cRMBx282): the source's 1500/2483ms intra-click CSS
delays became beats 7 and 8 (row 1 at 8117ms, row 2 at 9100ms), so manual
arrow-key stepping plays the identical measured rhythm as `?autoplay` — one
press, one beat, no intra-click lag. Pure helper `tileBeatSchedule` in
`components/stepflow/tiles.ts` extends `tileStaggerSchedule` with the two
track beats; the slide's `stepScheduleSec` carries all eight. Backward
navigation still snaps the track away instantly (hidden-state
`transition: none`). The two-tone header uses the shared chrome at the sheet-measured
glyph core (78px in the band y99–176, condensed to the measured 674px ink
extent via `titleTextLength`, the additive TitleChrome condensation prop
PR #42 introduced):: the trace sheet's "cap 52" read the
glow-inclusive band, the same correction PR #37 applied to StairChain and
HexCluster, and the mono face needs the explicit extent to match the
recordings' condensed title width.


## VerticalSpine + HeroTile measured note (exact-trace rework)

Supplements the slide 5/6 authoring notes with the measured rebuild from the
exact-trace sheet (art_mkVNxsft §3/§4). VerticalSpine: the center axis is the
vertical rhythm itself — the traced ring/bar/splayed-legs glyph (`V7_MARKER_GLYPH`
in `icons.ts`, shared with the HeroTile cutout) on slot 1, `DATA ENGINEERS` in
the spine-accent orange folded into the glyph's click (`withPrevious`), then
the outlined asymmetric cards (cyan 130×103.9 with two bars + two drop studs,
blue 135.5×55.5 with four piercing verticals), gray footer lines, and the
closing axis chrome: `#bd521e` stub, `#b35526` axis rule (4.7px core,
x464.3–1361.7), and the `#403f48` bottom rule (x192.1–1633.9, 5.7 thick)
fading last. There is no drawn center spine line and no flanking diamonds.

HeroTile: the `#f85721` tile is 227px square centered at (914, 700.5) with a
≈55px corner radius, the traced glyph renders as a black cutout at its
measured ≈95×107.5 box, and the halo is a radial gradient that plateaus at
0.30 opacity to 0.703R before dying at r ≈ 161.5px.

Both headers use TitleChrome's token mode: the slide passes one entry per
measured ink run (`x`/`width`/`capHeight`/`capTop`), each rendered as its own
textLength-condensed text — VerticalSpine's green `SQL` first at cap 84 on
its own baseline with the white tail fitted from its 52.9px x-height band,
and HeroTile's `APIs, cloud systems, AI` as four runs with the green `AI`
tail at the shared cap-70.8 baseline. Token mode absorbs the deck mono's
wider advance per run (the same condensation problem `titleTextLength`
solves for single-run headers), so the two mechanisms coexist: `titleTextLength`
for centered two-tone titles, tokens for measured multi-run headers.

Fidelity vs the settled reference frames at 1920×1080: VerticalSpine
SSIM 0.8843 → 0.9093 (MAD 10.38 → 7.63), HeroTile SSIM 0.9400 → 0.9602
(MAD 6.10 → 4.19).

