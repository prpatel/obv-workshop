# StepFlow demo deck

Slidev deck for the StepFlow animated-diagram demo (`decks/stepflow-demo`): the
house-style title slide plus all eight reference-faithful family slides —
seg01 StairChain, seg05 PillarRow, seg08 StackPanels, seg11 ConvergeFlow,
seg12 CompareBadge, seg14 SpecPanel, seg15 StepPanel, seg16 TileSummary —
on the 1920×1080 black canvas. Nine slides total.

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
├─ slides.md                      # slides: title + 8 family slides (seg01 · seg05 · seg08 · seg11 · seg12 · seg14 · seg15 · seg16)
├─ components/
│  ├─ StairChain.vue              # family: settled-truth seg01 traced-ink staircase (traced title/marker/badge/icons, measured circles+wedges, 7-beat reveal)
│  ├─ StackPanels.vue             # family: measured seg08 four-panel dark mosaic (per-panel 300ms fades)
│  ├─ PillarRow.vue               # family: measured seg05 three-card icon row
│  ├─ ConvergeFlow.vue            # family: measured seg11 converge-branch flow
│  ├─ CompareBadge.vue            # family: measured seg12 plate-and-badge comparison
│  ├─ SpecPanel.vue               # family: measured seg14 progressive spec panel
│  ├─ StepPanel.vue               # family: measured seg15 four-step panel
│  ├─ TileSummary.vue             # family: measured seg16 three-tile summary
│  ├─ AutoAdvance.vue             # renderless deck wiring: ?autoplay=N / a-key auto-advance + per-slide measured beats
│  └─ stepflow/
│     ├─ stair.ts                 # pure staircase layout math + settled-truth traces (SEG01_PLACEMENT, SEG01_INK, wedges, captions + default gap/delta walk)
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
(one beat per click — the seg01 slide has seven). The inline props are the exact
shape an MCP agent writes:

```md
<div class="sf-demo-stage">

<StairChain
  :palette="{ accent: '#3799fb', accentTertiary: '#1fd0ea' }"
  :steps="[
    { id: 'ingest', caption: 'PIPELINES' },
    { id: 'quality', tone: 'tertiary', caption: 'GIT' },
  ]"
/>

<AutoAdvance :duration-sec="3.133" :step-schedule-sec="[0.2, 0.533, 0.8, 1.067, 2.067, 2.733, 3.133]" />

</div>
```

Component props (StairChain — the seg01 slide's family):

| Prop        | Type                            | Purpose                                                                        |
| ----------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `steps`     | `StairStep[]` (required)        | One entry per block: `id`, `caption`, optional `tone`/`click`                  |
| `placement` | `StairPlacement`                | Explicit per-block fractions (`SEG01_PLACEMENT`'s measured values) — omit for the measured walk |
| `palette`   | `Partial<StepFlowPalette>`      | Merged over the `chainBlue` preset (settled medians as slide-level props)       |

All other settled-frame ink — the two-tone traced title, the olive badge, the
amber `01` marker, the six dark icon glyphs — is `stair.ts`'s `SEG01_INK`
rendered as absolute-coordinate paths, not component props. The marker reveals
on click 1; blocks take clicks 2…7 (a per-step `click` overrides).

Icon keys resolve against the Lucide registry in `components/stepflow/icons.ts`
(see [Icon registry keys](#icon-registry-keys-componentsstepflowiconsts));
an unknown key renders a visible fallback and warns in dev.

## Shared contract: palettes, icons, title chrome

Foundation conventions for the eight restart family components (StairChain,
PillarRow, StackPanels, ConvergeFlow, CompareBadge, SpecPanel, StepPanel,
TileSummary). Every mounted family adopts them; the shared pieces predate
the restart slides and are unchanged by them.

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
| `accentAlt`      | `string` | — (stays undefined)  | amber tones — StepPanel's amber group |
| `accentTertiary` | `string` | `accent`             | teal-green (`#1cd798` family): StairChain's cyan block split, ConvergeFlow's cyan left column, StepPanel's teal cluster |
| `accentQuaternary` | `string` | `accent`           | fourth accent slot — StackPanels' four-tone mosaic (green) |

`accentTertiary` merges with the same override-wins rule as every top-level
field. When omitted it resolves absent, and consumers read
`palette.accentTertiary ?? palette.accent` — so an `accent` override flows
into the fallback.

### Icon registry keys (`components/stepflow/icons.ts`)

`git-branch` · `square-terminal` · `flask-conical` · `rotate-cw` · `map-pin` ·
`user-round` · `navigation-2` · `dash-grid` · `cassette-tape` · `table-2` —
unknown keys render the visible fallback and warn in dev, so a wrong
identification degrades safely. The mounted families use: PillarRow
(`cassette-tape`, `table-2`, `navigation-2`) and CompareBadge (`user-round`,
`flask-conical`, `rotate-cw`, `table-2`); the other families' in-composition
text and glyphs are measured seeds or sub-resolution integration-supplied
props.

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

Each family is a component + pure geometry module + one demo slide. The
component owns its v-click choreography — a slide consumes the listed click
count, nothing more. Data contracts live in the geometry modules (contract +
layout are coupled by design) and seed data stays inline on the demo slides;
data order is the click order for every family. Click counts below are the
`?clicks=N` capture contracts (see
[Capture contracts](#capture-contracts-clicksn-deep-links)).

| Component      | Source segment | Clicks | Choreography summary                                                   | Slide |
| -------------- | -------------- | ------ | ---------------------------------------------------------------------- | ----- |
| `StairChain`   | seg01          | 7      | amber `01` marker → six blocks (icons, wedges, captions ride their block) | 2 |
| `PillarRow`    | seg05          | 6      | per card: glyph+label, then badge (card 3's badge rides its card) → summary rows | 3 |
| `StackPanels`  | seg08          | 4      | per panel: full-size fade (blue → cyan → amber → green) + the late frame/label/caption annotation on the final click | 4 |
| `ConvergeFlow` | seg11          | 5      | left table → SQL + left label → right plate (+ pins / PIPELINES) → bar draw + right label → footer | 5 |
| `CompareBadge` | seg12          | 5      | badge pop (rim +70 ms) → four alternating plate rows (row ink trails +70 ms) | 6 |
| `SpecPanel`    | seg14          | 7      | plate → status row → heading+body → red accent → teal cluster → spec row → closing line | 7 |
| `StepPanel`    | seg15          | 7      | plate draw → three rows → left annotation → amber group → title burst  | 8 |
| `TileSummary`  | seg16          | 4      | three tiles → settled rail fill + right vertical + settled-extent bar, summary line at bar +0.266 s | 9 |

Every family mounts with the two-tone measured title (`title` white,
`titleAccent` chrome green, through `TitleChrome`) and pins its complete
measured beat list on the slide (`R-6`: one entry per click — every beat
listed, nothing repeated by convention). Exception: StairChain's settled
frame mounts its traced title ink instead (below).

#### StairChain — settled-truth traced staircase (seg01, slide 2)

Seven clicks: the traced amber `01` marker reveals first, then one block per
click (the settled frame's onsets 0.533/0.8/1.067/2.067/2.733/3.133 s) — icon,
wedge, and caption ride their block's beat. The settled-frame ink is traced,
not typeset: `stair.ts`'s `SEG01_INK` carries the title (white "More like " +
green "software engineering"), the olive badge, the amber marker, and the six
dark icon glyphs as absolute-coordinate SVG paths; geometry is explicit
placement (`stair.ts`'s `SEG01_PLACEMENT`, measured connected components).
The former glow-trace connector is dropped — the reference has no connector.

| Prop          | Type                       | Purpose                                                    |
| ------------- | -------------------------- | ---------------------------------------------------------- |
| `steps`       | `StairStep[]` (required)   | One entry per block: `id`, `caption`, optional `tone`/`click` |
| `placement`   | `StairPlacement`           | Explicit per-block fractions — defaults to `SEG01_PLACEMENT` |
| `palette`     | `Partial<StepFlowPalette>` | Merged over `chainBlue` (the slide pins the settled medians) |

#### PillarRow — three-card icon row (seg05, slide 3)

Six clicks: glyph+label then badge per card (cards 1–2; card 3's badge rides
its card), then the two summary rows. Geometry is the `pillars.ts` measured
table verbatim (pitch 0.2613, plate/badge/label bands from report.json
seg05_61s-63s); station hues are the component's per-index settled medians.
Crop→stage fit rule: content bbox → full stage, relative layout preserved
(`pillars.ts` docblock).

| Prop           | Type                       | Purpose                                                   |
| -------------- | -------------------------- | --------------------------------------------------------- |
| `cards`        | `PillarCard[]` (required)  | One entry per station: `id`, `label`, `icon` (registry key) |
| `summaryRows`  | `string[]`                 | Two text rows under the card band (salmon, then gray)     |
| `title` / `titleAccent` | `string`          | Two-tone mono header, pinned to the measured ink extent   |
| `palette`      | `Partial<StepFlowPalette>` | Optional override; the family medians are the default     |

#### StackPanels — dark four-panel mosaic (seg08, slide 4)

Four clicks: one ~300 ms full-size fade per panel (reveal order: blue,
cyan, amber, green — the measured onsets 0.067 / 0.267 / 0.867 / 1.2 s),
then the late annotation pass rides the final click: the white perimeter
frame draws clockwise with measured delays (933 → 1200 ms) and the
in-panel labels land with it, the gray caption follows at 1400 ms. Panels
abut directly on the black canvas — no plate, no gutters, 45° outer
chamfer corners with white patches behind (`panels.ts` seg08 seed;
`annotate-on-last-panel` + `caption-color` on the slide). Crop→stage
mapping is identity (the mosaic fills the stage). The settled state also
carries the reference's static olive mark at the top-right (`badge` prop) —
present from the first frame, outside the click choreography.

| Prop      | Type                      | Purpose                                                     |
| --------- | ------------------------- | ----------------------------------------------------------- |
| `panels`  | `StackPanel[]` (required) | List in reveal order: `id`, `title`, `rows`; seeded via `accent`…`accentQuaternary` |
| `caption` | `string`                  | Optional caption under the composition (ink via `caption-color`) |
| `badge`   | `boolean`                 | Static top-right olive mark, rendered raster-faithful and non-interactive |
| `title` / `titleAccent` | `string`    | Two-tone mono header                                        |

#### ConvergeFlow — converge-branch flow (seg11, slide 5)

Five clicks: the left cyan table (outline, then two dividers, then two
cell-bar pairs), the cyan `SQL` run + gray left label, the right blue plate
with its two through-pins + blue `PIPELINES` run, the dim-orange bar bracket
drawing across, then the gray footer band. The funnel assembly (ring, cone,
DATA ENGINEERS row, stem) is the clip's mid-state — it renders from f0001
and never animates. Tones are the re-measured set: bright funnel orange
`#f25726`, dim bar orange `#bf521c`, label gray `#a7a6ab` (`converge.ts`
family preset). Copy defaults to `CONVERGE_SEED` (OCR-confirmed); the left
table's cells render as measured bars — no in-box text props. Crop→stage:
content bbox → full stage (`converge.ts` docblock).

| Prop             | Type                       | Purpose                                              |
| ---------------- | -------------------------- | ---------------------------------------------------- |
| `title` / `titleAccent` | `string`            | Two-tone token header (green `SQL` lead first, per the sheet) |
| `labels`         | `{ left?, right? }`        | Gray base labels under the two columns               |
| `funnelLabel`    | `string`                   | The funnel's tracked row (seed: `DATA ENGINEERS`)    |
| `leftLowerText` / `slabText` | `string`       | The bare cyan run under the table / blue run across the right base |
| `palette`        | `Partial<StepFlowPalette>` | Optional override over the measured family preset    |

#### CompareBadge — plate-and-badge comparison (seg12, slide 6)

Five clicks, prop-less settled truth: the center badge pops (dark
red-brown radial glow ring around the settled `#f85721` core, rim
trailing the core ~70 ms), then the four plate rows fade in alternating
left/right, each row's ink trailing its plate ~70 ms (one 15fps reference
frame). The component takes no props: the recording's display face and
glyph shapes are unresolvable from compressed raster, so the settled
state renders the reference's own ink — title runs, the top-right
olive/pale mark, row text, icons, and the dark core glyph are
deterministic even-odd contours traced from the settled frame
(`SEG12_INK`, the seg01 StairChain precedent), each text/icon region
painted as an AA-skirt pass plus an opaque core pass. Geometry stays the
`compareBadge.ts` native-pixel constants (2560×1440 read, frame-scaled
to the stage); plates carry top/bottom accent lines with soft skirts —
the settled frame's left/right plate edges carry no line.

#### SpecPanel — progressive spec panel (seg14, slide 7)

Seven clicks: plate, status row, heading+body, red edge accent, teal accent
cluster, spec row, closing line — progressively fading text rows over one
huge near-black plate (settled luma ≈14). The crop frames the full 16:9
slide (identity mapping — crop fractions read as full-frame fractions;
`specPanel.ts` docblock). Seed copy is `SPEC_PANEL_SEED`
(resolution-limited read, integration-refined); the title band pins its
measured 634.56px ink extent.

| Prop      | Type                       | Purpose                                              |
| --------- | -------------------------- | ---------------------------------------------------- |
| `title` / `titleAccent` | `string` | Two-tone mono header, pinned to the measured ink extent |
| `seed`    | `Partial<SpecPanelSeed>`   | Merged over `SPEC_PANEL_SEED` (rows, accents, chrome copy) |
| `palette` | `Partial<StepFlowPalette>` | Optional override                                    |

#### StepPanel — four-step panel (seg15, slide 8)

Seven clicks: plate outline draw, three measured rows, the bottom-left orange
annotation, the amber group, and the chrome-green title burst. The header
chip is pre-clip state — it renders from f0001 without consuming a click.
Title runs read accent-first (green lead, white tail), each pinned to its
measured ink box (token mode). Seed content is `STEP_PANEL_SEED`
(OCR-approximate read); crop→stage mapping is documented in `stepPanel.ts`.

| Prop         | Type                       | Purpose                                         |
| ------------ | -------------------------- | ----------------------------------------------- |
| `title` / `titleAccent` | `string` | Two-tone token header (accent-first on this sheet) |
| `chipLabel`  | `string`                   | The pre-clip header chip copy                   |
| `data`       | `StepPanelData`            | Rows/annotations copy; defaults to `STEP_PANEL_SEED` |
| `palette`    | `Partial<StepFlowPalette>` | Optional override                               |

#### TileSummary — three-tile summary (seg16, slide 9)

Four clicks: three cyan tiles (EXTRACT → MOVE → LOAD) over near-black
backing plates, then the settled bracket — right vertical plus the
settled-extent bar (x 0.3152–0.8371) with the click-4 rail fill and left
terminus — with the dim-white summary line riding the bar onset +0.266 s
(`summaryDelaySec`). The clip STARTS MID-STATE (tile 1 already on-screen at
f0001): the slide's beat-1 click is pinned from the earliest frames, and the
settled frame's summary copy is an ~8% ghost. Crop→stage mapping is identity
(`tileSummary.ts` docblock). Sublabels are measured (OUT OF THE SOURCE /
ACROSS THE NETWORK / STRAIGHT INTO THE WAREHOUSE); in-tile glyphs are traced
vessel/rules/banded-box paths with the measured `TILE_SUMMARY_GLYPH_STROKE`.

| Prop      | Type                       | Purpose                                             |
| --------- | -------------------------- | --------------------------------------------------- |
| `seed`    | `TileSummarySeed[]` (required) | One entry per tile: `id`, `label`, `xFrac`, `wFrac` (measured), optional `sublabel` |
| `summary` | `string`                   | The dim-white summary line under the bracket bar    |
| `title` / `titleAccent` | `string` | Two-tone mono header, pinned to the measured ink extents |
| `palette` | `Partial<StepFlowPalette>` | Optional override (the family cyan is the default)  |

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

A slide passes `durationSec` (even spread) or `stepScheduleSec` (measured
beats) to `<AutoAdvance />` — pacing is set per slide from each segment's
f15 progressive-frame onsets instead of the 7 s default. Every list is
complete: one entry per click, in order (R-6).

| Slide | Family | Clicks | Measured beats (s) |
| ----- | ------ | ------ | ------------------ |
| 2 | StairChain (seg01) | 10 | 0.27 · 0.53 · 0.67 · 0.80 · 0.93 · 1.07 · 1.27 · 2.07 · 2.67 · 3.07 |
| 3 | PillarRow (seg05) | 6 | 0.067 · 0.267 · 0.600 · 0.733 · 1.000 · 1.467 |
| 4 | StackPanels (seg08) | 4 | 0.067 · 0.267 · 0.867 · 1.2 |
| 5 | ConvergeFlow (seg11) | 5 | 1.07 · 1.53 · 2.20 · 2.60 · 3.07 |
| 6 | CompareBadge (seg12) | 5 | 0.60 · 1.00 · 1.73 · 3.00 · 4.40 |
| 7 | SpecPanel (seg14) | 7 | 0.47 · 0.60 · 2.00 · 3.13 · 4.47 · 5.07 · 6.53 |
| 8 | StepPanel (seg15) | 7 | 1.20 · 1.667 · 2.40 · 3.133 · 3.667 · 4.60 · 5.867 |
| 9 | TileSummary (seg16) | 4 | 0.33 · 0.60 · 1.20 · 1.467 (summary line rides the bar +0.266 s) |

### Capture contracts (`?clicks=N` deep links)

Each family settles at its final click; `?clicks=N` renders exactly that
state for screenshots and SSIM/MAD diffs. N per family, in slide order:
seg01 → 10, seg05 → 6, seg08 → 4, seg11 → 5, seg12 → 5, seg14 → 7,
seg15 → 7, seg16 → 4. Mid-beat captures (`?clicks=k`, 1 ≤ k < N) document
each family's choreography; the `a` key plays the pinned schedule
end-to-end and stops at the final click (backward navigation snaps
instantly; reduced-motion collapses the run). Capture at 1920×1080 —
Slidev letterboxes at other sizes, compressing screen fractions ~0.80
horizontally — wait for `document.fonts.ready` before probing the title
band (headless Chrome can re-layout fonts after navigation), and deep-link
with `?clicks=N` rather than key presses.

### Recording workflow

1. `npm run dev -- --port 4321`
2. Open `http://localhost:4321/3?autoplay=1.5` — the run starts the moment the
   slide mounts (first click ≈0.167 s in, last click at 1.5 s).
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

A diagram description turns into inline component props on a slide. Given the
text *"a three-station measured pipeline: fetch, query, ship"*, an agent
generates:

```json
{
  "cards": [
    { "id": "fetch", "label": "FETCH", "icon": "cassette-tape" },
    { "id": "query", "label": "QUERY", "icon": "table-2" },
    { "id": "ship",  "label": "SHIP",  "icon": "navigation-2" }
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
    "content": "<div class=\"sf-demo-stage\">\n\n<PillarRow title=\"MEASURED\" title-accent=\"PIPELINE\" :cards=\"[\n  { id: 'fetch', label: 'FETCH', icon: 'cassette-tape' },\n  { id: 'query', label: 'QUERY', icon: 'table-2' },\n  { id: 'ship', label: 'SHIP', icon: 'navigation-2' }\n]\" />\n\n<AutoAdvance :duration-sec=\"1.467\" :step-schedule-sec=\"[0.067, 0.267, 0.6, 0.733, 1.0, 1.467]\" />\n\n</div>",
    "frontmatter": { "layout": "center" }
  }
}
```

Because the component reads props from markdown and MCP edits markdown, a generated
diagram slide is identical in kind to a hand-written one — there is no second render
path, and every write hot-reloads in the open browser.

### Notes for agent authors

- Describe the **diagram in plain text**: which family fits, each element's short
  uppercase label, and an icon intent. The agent maps icon intent to a Lucide key
  from the registry (see [Icon registry keys](#icon-registry-keys-componentsstepflowiconsts)).
- Keep labels short and uppercase — the measured typography sizes them for
  1920×1080, and long strings pin spacing-only against measured ink extents.
- Wrap the component in a full-canvas stage (`<div class="sf-demo-stage">` with
  `position: absolute; inset: 0`) so the composition fills the slide.
- Do not add `v-click` wrappers yourself — the component owns its clicks internally
  (the family table lists each count); match `<AutoAdvance>`'s schedule length to it.
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

## Restart family notes (settled-frame re-truth)

Notes supplementing the family sections above, from the restart program's
settled-frame re-measurements (2560×1440 sources, f15 progressive-frame
onset dumps, report.json structure classes).

### Two-tone title mechanics (all families)

Two condensation mechanisms coexist in `TitleChrome` and solve the same
problem — the deck's bundled JetBrains Mono advance is wider than the
recordings' condensed display faces — at different scopes:
`titleTextLength` pins a single-run two-tone title to its measured ink
extent (spacing-only; glyphs are never squeezed), and token mode renders
one textLength-condensed text per measured ink run for multi-run headers
(the seg15 slide's accent-first runs). Pass a pin only where the family
sheet documents an ink extent; within ~2% of the natural advance the pin
is skipped and the title renders at natural width.

### StairChain (seg01) — settled medians

The seg01 slide passes the settled-median palette as slide-level props
(`#3799fb` blue, `#1fd0ea` cyan, `#f9bb1f` amber) and seeds the two-tone
split through per-step `tone`s, leaving the component's `chainBlue` default
untouched. In-block labels are the punched step numbers; the ambient layer —
slate shadow masses beside blue blocks, dark-teal ambience feathers around
cyan ones — reveals with its block at the block's own click.

### StackPanels (seg08) — dark source-truth mosaic

The seg08 slide mounts the settled re-truth: four abutting panels directly
on the black canvas — blue `#3799fb` top-left, cyan `#1fd0ea` top-right,
amber `#f9bb1f` bottom-left, green `#1ed798` bottom-right, seeded via
`accent`/`accentAlt`/`accentTertiary`/`accentQuaternary`. Panels fade in
full-size (~300 ms) at the measured onsets 0.067 / 0.267 / 0.867 / 1.2 s;
the late annotation pass (white perimeter frame + in-panel labels, then
the gray caption) rides the final panel click with measured delays — four
clicks total (`?clicks=4`).

### Fidelity bar

Per-family acceptance is SSIM/MAD against the segment's settled reference
frame (2560×1440, LANCZOS-downscaled to the 1920×1080 capture): the gen-7
family bar is SSIM 0.9093 / MAD 7.63. A family below the bar ships with a
named cause (resolution-limited source text, sub-resolution glyph rows)
and its measured numbers recorded in the PR evidence.
