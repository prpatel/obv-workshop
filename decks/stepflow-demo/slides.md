---
theme: default
title: StepFlow — house-style animated diagrams
info: Animated diagram system for Slidev — house style, one step per click.
canvasWidth: 1920
---

<!-- Title slide — house chrome: mono type, black canvas, one cyan accent. -->

<div class="sf-title">

<p class="sf-title-kicker">SLIDEV DIAGRAM SYSTEM</p>

<h1 class="sf-title-main">StepFlow <span class="sf-title-accent">—</span> house-style<br>animated diagrams</h1>

<p class="sf-title-presenter">Pratik Patel</p>

<p class="sf-title-note">one step per click · measured on a 1920×1080 canvas · authorable by agents over MCP</p>

</div>

<style>
/*
 * Style blocks written on a slide are global CSS — every class below is
 * sf-title-prefixed so the title slide cannot leak into other slides. The
 * black canvas and mono base come from the deck-wide styles/index.css
 * (single source, no switching).
 */
.sf-title {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 9%;
}

.sf-title-kicker {
  color: #23d7ed;
  font-size: 28px;
  letter-spacing: 0.35em;
  margin: 0 0 30px;
}

.sf-title-main {
  color: #ffffff;
  font-size: 96px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: 0.01em;
  margin: 0;
}

.sf-title-accent {
  color: #23d7ed;
}

.sf-title-presenter {
  color: #23d7ed;
  font-size: 36px;
  margin: 48px 0 0;
}

.sf-title-note {
  color: #a6a8ae;
  font-size: 24px;
  margin: 14px 0 0;
}
</style>

---

<!--
  Demo slide: each click pops one node and draws its track segment (six v-clicks,
  owned by the component). The stage div gives the SVG the full slide canvas.
  Step data is inline so MCP write-back and hand edits follow the same path.
  AutoAdvance is renderless deck-level wiring: the `a` key toggles a hands-free
  run over 7s and `?autoplay=N` in the URL starts one on slide enter.
-->

<div class="sf-demo-stage">

<StepFlow
  title="SHIP FASTER"
  :steps="[
    { id: 'branch', title: 'BRANCH', subtext: 'feature branches from main', icon: 'git-branch' },
    { id: 'code', title: 'MODULAR CODE', subtext: 'small reusable pieces', icon: 'square-terminal' },
    { id: 'test', title: 'TEST', subtext: 'guard the edge cases', icon: 'flask-conical' },
    { id: 'lint', title: 'LINT', subtext: 'enforce house style', icon: 'braces' },
    { id: 'ci', title: 'CI/CD', subtext: 'ship on every merge', icon: 'rotate-cw' },
    { id: 'infra', title: 'INFRA AS CODE', subtext: 'servers defined in git', icon: 'server' },
  ]"
/>

<AutoAdvance />

</div>

<style>
/* Stage fills the 1920×1080 canvas; the black canvas lives in styles/index.css
   (the deck is black-canvas by design — build-scope boundary: no theme switching). */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>

---

<!--
  StairChain demo slide: the amber callout reveals on click 1, then one block
  per click — seven v-clicks total, owned by the component. The seed mirrors
  the reference recording (THE DATA ENGINEERING LIFECYCLE): the rhythm, circle
  blocks, punched numbers, captions, and wedges are all measured constants in
  stair.ts now, so the seed carries only content — the 01–06 step numbers and
  captions (sheet art_4A7yguGJ) — plus the two-tone split (blocks 1–3 blue
  #3599fb, blocks 4–6 cyan #1fd0ea) through per-step `tone` roles, and the
  callout amber pinned to the frame's #f4ba23. AutoAdvance pins the measured
  beats (sheet art_4A7yguGJ §1.3): the recording holds a static header for
  3.43s, then the callout fires at 3.43s and blocks 01–06 at
  3.73/4.03/4.3/4.6/5.23/5.7s (≈300–630ms stagger, inside the measured
  400–500ms band once the hold is honored);
  renderless deck-level wiring: the `a` key toggles a hands-free run and
  `?autoplay=N` in the URL starts one on slide enter.
-->

<div class="sf-demo-stage">

<StairChain
  title="THE DATA"
  title-accent="SYSTEMS LIFECYCLE"
  :callout="{ text: '3×', xFrac: 0.02656, yFrac: 0.526, textLengthFrac: 0.04427 }"
  :palette="{ accent: '#3599fb', accentTertiary: '#1fd0ea', accentAlt: '#f4ba23' }"
  :steps="[
    { id: 'ingest', title: '01', caption: 'SOURCE SYSTEMS' },
    { id: 'transform', title: '02', caption: 'CLEAN + MODEL' },
    { id: 'retry', title: '03', caption: 'EXPECT FAILURE' },
    { id: 'quality', title: '04', tone: 'tertiary', caption: 'TESTS GATE DEPLOYS' },
    { id: 'serve', title: '05', tone: 'tertiary', caption: 'DASHBOARDS + APIS' },
    { id: 'govern', title: '06', tone: 'tertiary', caption: 'LINEAGE + ACCESS' },
  ]"
/>

<AutoAdvance :duration-sec="5.7" :step-schedule-sec="[3.433, 3.733, 4.033, 4.3, 4.6, 5.233, 5.7]" />

</div>

<style>
/* Same stage contract as the StepFlow demo slide; re-declared here because a
   slide's styles are global only once that slide's chunk has loaded. */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>

---

<!--
  Demo slide: NodeEdge — free-position nodes and polyline edges. The node
  primitive (fidelity report art_v4jVdTnp §2, re-measured against the src-3
  settle frame t=4.0) is a ~100px square — #0b0a11 plate, 6px tone-colored
  border, 3-line ~20px tone-colored label inside — plus one taller solid
  bright-red status square; edges are dim red ~6px (bright red is reserved
  for the status square). Exact-trace sheet art_4A7yguGJ §2: the network is
  the MID-state — the reference hard-cuts it out at f265/t≈4417ms and settles
  on a terminal/log composition (traffic-light title bar, `$ meshctl status
  --verbose`, teal cursor + `nodes : 6 healthy · 2`, a dim late center
  element, right third and bottom empty of CONTENT — the recording's ambience
  (dark floor, soft band behind the terminal row, left glow plateau) is
  measured in TERMINAL_LOG_AMBIENCE and ships with the panel). The title pins
  the reference-measured ink extent (x366–1461) via titleTextLength — the
  mono face runs ~37% wider than the recording's condensed face at cap 77.
  So: nodes pop on clicks 1-6, edges
  7-12 (the two replay hookups share beat 12), then click 13 IS the hard cut
  — the whole scene (nodes, edges, red wash) vanishes instantly via native
  Slidev click ranges `[reveal, 13)`, backward nav restores it. AutoAdvance
  pins the measured beats (sheet art_4A7yguGJ §2.3): the 12 network events
  fire across the recording's 2.53–3.23s build window, and the cut lands at
  4.417s. The
  terminal/log panel is static chrome at every click count; only the dim
  center element arrives with the cut. Palette seed: the recording's measured
  blue #33a5cd, amber #e6b434, dim-red track #5a1e1e. AutoAdvance is
  renderless deck-level wiring: the `a` key toggles a hands-free run and
  `?autoplay=N` in the URL starts one on slide enter.
-->

<div class="sf-demo-stage">

<NodeEdge
  title="DATA MESH CORE"
  title-accent="PLATFORM"
  :title-text-length="1453"
  :palette="{ accent: '#33a5cd', accentAlt: '#e6b434', track: '#5a1e1e' }"
  :terminal-log="{ command: 'meshctl status --verbose', stat: 'nodes : 6 healthy · 2' }"
  :nodes="[
    { id: 'ingest', xFrac: 0.515, yFrac: 0.524, tone: 'accent', label: ['INGEST', 'EVENTS', '12K/S'] },
    { id: 'lake', xFrac: 0.756, yFrac: 0.524, tone: 'accent', label: ['LAKE', 'BRONZE', '4.1TB'] },
    { id: 'catalog', xFrac: 0.516, yFrac: 0.772, tone: 'alt', label: ['CATALOG', 'TABLES', '1204'] },
    { id: 'serve', xFrac: 0.756, yFrac: 0.772, tone: 'plain', label: ['SERVE', 'API', '84MS'] },
    { id: 'replay', xFrac: 0.636, yFrac: 0.896, tone: 'accent', label: ['REPLAY', 'CDC', 'V2.4'] },
    { id: 'lag', xFrac: 0.159, yFrac: 0.605, tone: 'status', label: ['SLOW', '5M'] },
  ]"
  :edges="[
    { from: 'lake', to: 'serve', points: [[0.756, 0.524], [0.756, 0.772]] },
    { from: 'ingest', to: 'catalog', points: [[0.515, 0.524], [0.516, 0.772]] },
    { from: 'ingest', to: 'lake', points: [[0.515, 0.524], [0.515, 0.36], [0.756, 0.36], [0.756, 0.524]] },
    { from: 'catalog', to: 'serve', points: [[0.516, 0.772], [0.756, 0.772]] },
    { from: 'ingest', to: 'serve', points: [[0.515, 0.524], [0.756, 0.772]] },
    { from: 'catalog', to: 'replay', points: [[0.516, 0.772], [0.636, 0.896]] },
    { from: 'serve', to: 'replay', points: [[0.756, 0.772], [0.636, 0.896]] },
  ]"
/>

<AutoAdvance
  :duration-sec="4.417"
  :step-schedule-sec="[2.53, 2.59, 2.66, 2.72, 2.78, 2.85, 2.91, 2.97, 3.04, 3.1, 3.17, 3.23, 4.417]"
/>

</div>

<style>
/* Stage fills the 1920×1080 canvas; the black canvas lives in styles/index.css. */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>

---

<!--
  VerticalSpine demo (v7 family, exact-trace sheet art_mkVNxsft §3): the center
  axis is the rhythm — no drawn spine line. Reveal groups (5 clicks, GT beats from
  sheet art_mkVNxsft §3.3): ① traced axis glyph + DATA ENGINEERS label
  together (@2.83s), ② cyan card + caption (@4.1s), ③ blue card + caption
  (@5.4s), ④ gray footer lines, ⑤ axis chrome (orange stub, #b35526 rule,
  #403f48 bottom rule fading last; stub+rule from 5.58s). Known divergence:
  the recording reveals the footer texts (4.5–5.0s) before the blue card,
  but the footer is fixed second-to-last in the component contract — pinned
  at 5.5s. Cards are outlined
  plates with solid tone-tone glyph strokes (NOT dimmed) — cyan #21cfe9 left,
  blue #3698fb right via the palette accentAlt — and card-colored captions at
  the measured ink runs (SQL 110.2px, PIPELINES 285.4px). The header tokens
  carry the sheet's measured condensation: the recordings' condensed mono face
  runs narrower than the deck mono at equal cap, so each token is fitted to its
  measured extent via textLength (green SQL first at cap 84, white tail sized
  from its 52.9px x-height band). Data order IS the click order; withPrevious
  folds the label into the glyph's click.
-->

<div class="sf-demo-stage">

<VerticalSpine
  :palette="{ accent: '#21cfe9', accentAlt: '#3698fb' }"
  :title-tokens="[
    { text: 'SQL', accent: true, x: 229.9, width: 187.5, capHeight: 65.9, capTop: 60.3 },
    { text: 'and pipelines still matter', x: 440.0, width: 1162.5, capHeight: 68.8, capTop: 56.5 },
  ]"
  :footer="{ left: 'QUERIES DRAFTED IN SECONDS', right: 'WHAT MOVES THE DATA EVERY DAY' }"
  :nodes="[
    { id: 'marker', title: '', tone: 'alt', side: 'center' },
    { id: 'label', title: 'DATA ENGINEERS', tone: 'alt', side: 'center', withPrevious: true },
    { id: 'left-card', caption: 'SQL', captionWidth: 110.2, captionScale: 1.2429, tone: 'accent', side: 'left' },
    { id: 'right-card', caption: 'PIPELINES', captionWidth: 285.4, tone: 'accent', side: 'right' },
  ]"
/>

<AutoAdvance
  :duration-sec="5.583"
  :step-schedule-sec="[2.833, 4.1, 5.4, 5.5, 5.583]"
/>

</div>

<style>
/* Same stage contract as the StairChain demo slide; re-declared here because a
   slide's styles are global only once that slide's chunk has loaded. */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>

---

<!--
  HeroTile demo (v7 segment 2, exact-trace sheet art_mkVNxsft §4): one solid
  #f85721 tile dead on the spine axis with the traced black cutout glyph
  (ring / bar / splayed legs — the same mark as the VerticalSpine axis),
  ringed by a tight red halo that reveals with the tile — the section-divider
  card. Single click; no label and no secondary header line at the mapped
  state. The recording is one ~120ms global fade at 417–533ms (sheet
  art_mkVNxsft §4.3) — AutoAdvance fires the tile at 0.42s. Palette is the
  measured orangeSpine preset verbatim (#f85721); the
  halo derives from the accent (≈0.30 opacity at the tile edge, linear to 0
  by r≈161.5px). Header tokens carry the sheet's measured condensation to the
  condensed-face ink runs (APIs, / cloud / systems, / green AI at cap 70.8,
  band y55.7–126.5).
-->

<div class="sf-demo-stage">

<HeroTile
  :title-tokens="[
    { text: 'APIs,', x: 371.0, width: 241.2 },
    { text: 'cloud', x: 635.0, width: 197.5 },
    { text: 'systems,', x: 920.1, width: 413.4 },
    { text: 'AI', accent: true, x: 1353.2, width: 99.9 },
  ]"
/>

<AutoAdvance :duration-sec="0.42" :step-schedule-sec="[0.42]" />

</div>

<style>
/* Same stage contract as the VerticalSpine demo slide; re-declared here because
   a slide's styles are global only once that slide's chunk has loaded. */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>
---

<!--
  Demo slide: SchematicRows — exact-trace window chrome + the verbatim 7-row
  listing with the right-hand callout ladder (10 clicks, owned by the
  component): the window pops on click 1, callout 1 (DEPENDENCIES TO
  MAINTAIN) on 2, rows 1–3 type on 3/4/5, the cyan rail draws down on 6, then
  rows 4–7 land on 7/8/9/10 with the teal band + callouts 2–4 keyed to their
  target rows. The seven verbatim rows and all measured geometry are the
  component's sheet-authoritative seed (art_mkVNxsft) — no inline data. The
  recording's continuous ≈9.8s typewriter is re-paced as per-character CSS
  over the same row windows; AutoAdvance fires the measured cumulative
  schedule (chrome 2.8s, callout 1 4.2s, rows through 12.9s, ≈14.3s settle;
  callout landings within ≈1s of their measured anchors). The mixed-case
  title pins the measured combined ink extent (877.6px) via the shared
  titleTextLength condensation (PRs #42/#43 pattern). AutoAdvance is
  renderless deck-level wiring: the `a` key toggles a hands-free run and
  ?autoplay=N in the URL starts one on slide enter.
-->

<div class="sf-demo-stage">

<!-- Measured click-fire beats (s from run start) — rows.ts typewriter re-pace:
     chrome 2817, callout-1 4170, rows 4500→12900, settle ≈14300ms. -->
<SchematicRows
  title="to maintain"
  title-accent="Harder"
  accent-first
  :title-text-length="877.6"
/>

<AutoAdvance
  :duration-sec="1.4"
  :step-schedule-sec="[2.8, 4.2, 4.5, 5.9, 7.3, 8.0, 8.7, 10.1, 11.5, 12.9]"
/>

</div>

<style>
/* Stage fills the 1920×1080 canvas; the black canvas lives in styles/index.css.
   Re-declared here because a slide's styles are global only once that slide's
   chunk has loaded (the sibling demo slides do the same). */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>

---

<!--
  Demo slide: TwoBarCompare — two large left-anchored comparison bars from the
  wave-2 recording (src 161–169s). Bar 1 (red, tone 'alt') pops whole on click
  1, bar 2 (amber, tone 'accent') on click 2, and one shared annotation click
  reveals the legend row, the SQL data-text block, the divider rules, the
  caption/mint rows, the on-bar labels, and the top-right chip (click 3).
  Bar lengths are the measured wFracs (bar 1 ends 49.2%w, bar 2 51.1%w); the
  shared anchor, bar height, and bar tops default to the module's measured
  composition. Strings are the ref frame's third-pass read (settled frame,
  2026-09-04): the wave-2 sheet's spec-derived strings appear nowhere in the
  source recording, so the slide typesets the frame's actual SQL/backfill
  content. The headline row is the shared TitleChrome (title + title-accent,
  cap 53 / top 98, condensed via title-text-length to the measured
  x565–1359 extent). Palette: statusAmber verbatim — the component's family
  default, so no palette prop is needed. AutoAdvance is renderless
  deck-level wiring: the `a` key toggles a hands-free run and ?autoplay=N in
  the URL starts one on slide enter. The clip window starts post-pop (bars
  and annotations already present; sheet art_7bTnqSB3 §1.3), so AutoAdvance
  compresses the 3-click build into the first 0.3s and lets the label fades
  land at ≈3.1s/7.8s — the measured 2800–2983/7467–7667ms clip-relative
  windows.
-->

<div class="sf-demo-stage">

<TwoBarCompare
  title="Is it"
  title-accent=" actually correct?"
  chip="GENERATED"
  :data-text="{
    legend: 'mart_revenue.sql',
    lines: ['select c.id, sum(o.total)', 'from customers c join orders o on c.id = o.customer_id'],
    subline: 'join refunds r on r.order_id = o.id group by 1',
    caption: 'SUGGESTED PIPELINE DESIGN',
    note: 'backfill the whole table every night',
    rules: true,
  }"
  :bars="[
    { id: 'red-bar', wFrac: 0.325, tone: 'alt', icon: 'server', label: 'EVERY CUSTOMER COMES BACK TWICE' },
    { id: 'amber-bar', wFrac: 0.34375, tone: 'accent', icon: 'cloud', label: 'THIS BACKFILLS THE SAME DAY TWICE' },
  ]"
/>

<AutoAdvance :duration-sec="0.3" :step-schedule-sec="[0.1, 0.2, 0.3]" />

</div>

<style>
/* Same stage contract as the StepFlow demo slide; re-declared here because a
   slide's styles are global only once that slide's chunk has loaded (the
   sibling demo slides do the same). */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>

---

<!--
  ColumnRow exact-trace demo (src 223–229s; sheet art_7yZkdmCE): five opaque
  tone-coded plates rise bottom→top (clicks 1,2,3,4,6 — measured col order)
  carrying centered dark two-digit numerals that ride their plate. Column
  labels render BELOW each plate in the plate's hue on the measured y868
  baseline; columns 4–5's labels take private beats (5 and 7) per the motion
  trace, while columns 1–3's ride their column beats (their reveal cadence is
  unrecoverable from the source — kept on the shared beat, flagged
  unverifiable). The sub-heading (amber chip + white 5) lands with the col-5
  beat (click 6, measured 1833–2167ms); the amber note row is strictly the
  last beat (click 8, measured 5000–5500ms). Title: measured ink extent
  x411–1508 pinned via titleTextLength. The sheet reads the note as
  amber-lead + dim tokens; the settled pixels cluster uniformly amber, which
  the single amber fill follows. Tones read the existing tokens exactly as
  before. AutoAdvance is renderless deck-level wiring (`a` key, ?autoplay=N).
-->

<div class="sf-demo-stage">

<ColumnRow
  title="PIPELINE"
  title-accent="DISRUPTION"
  :title-text-length="1097"
  :palette="{ accentTertiary: '#1cd798' }"
  :columns="[
    { id: 'practices', tone: 'blue', label: 'SOFTWARE PRACTICES' },
    { id: 'integration', tone: 'accent', label: 'DEEPER INTEGRATION' },
    { id: 'collaboration', tone: 'alt', label: 'CLOSER COLLABORATION' },
    { id: 'assisted', tone: 'tertiary', label: 'AI ASSISTED' },
    { id: 'products', tone: 'status', label: 'DATA PRODUCTS' },
  ]"
  :yFrac="0.514"
  :hFrac="0.233"
  label-position="below"
  numerals
  :late-labels="[3, 4]"
  note="SHAPE OF THE WORK, NOT THE TOOL LIST"
  :heading="{ numeral: '5', caption: 'TRENDS RESHAPING THE WORK' }"
/>

<AutoAdvance />

</div>

<style>
/* Same stage contract as the HeroTile demo slide; re-declared here because a
   slide's styles are global only once that slide's chunk has loaded. */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>

---

<!--
  TileGrid demo (research §3.5, src 25–35s; wave-2 fidelity rework, report
  art_iHm120ov §TileGrid): six pointed hexagonal tiles (6.2%w × 9.7%h boxes,
  pitch 27.5%w × 31.25%h) on the black canvas, built row-major with six native
  v-clicks — one per tile, fired on the sheet-measured growing stagger
  (art_7bTnqSB3 §2.3: 550ms after entrance, then gaps 400/1383/1434/1050/
  1800ms — the stepScheduleSec beats below; uniform spacing cannot express
  them) — followed by two connector-track v-click beats (generation-7 wave,
  art_cRMBx282): the recording's 1500/2483ms intra-click track delays became
  discrete beats 7–8, so manual stepping plays the identical measured rhythm
  as autoplay. Measured anatomy: saturated #1ed0e8 hex cores with a soft glow
  halo, a ~12px #353642 connector track through tile centers that stays dark
  until after tile 6 (source 8117–9117ms; row 2 trails row 1 by ~983ms), a
  #a0ecfb sheen at the first tile's lit vertex, ~40px near-black icons, and
  below-tile double label rows (cyan mini over the white label, both ~16px).
  The two-tone header follows the family chrome convention. The matrix
  (src 57–60s) and flat-row (107–110s) variants are seed-data arrangements of
  the same contract, covered in tests. AutoAdvance is renderless deck-level
  wiring (`a` key, ?autoplay=N on the URL).
-->

<div class="sf-demo-stage">

<TileGrid
  title="DATA"
  title-accent="TOOLING"
  :tiles="[
    { id: 'extract', icon: 'database', label: 'EXTRACT', mini: '01' },
    { id: 'transform', icon: 'cpu', label: 'TRANSFORM', mini: '02' },
    { id: 'load', icon: 'boxes', label: 'LOAD', mini: '03' },
    { id: 'orchestrate', icon: 'git-branch', label: 'ORCHESTRATE', mini: '04' },
    { id: 'quality', icon: 'layers', label: 'QUALITY', mini: '05' },
    { id: 'serve', icon: 'server', label: 'SERVE', mini: '06' },
  ]"
  :cols="3"
  :tile-w-frac="0.062"
  :tile-h-frac="0.097"
  :pitch-x-frac="0.275"
  :pitch-y-frac="0.3125"
  :x0-frac="0.1953125"
  :y0-frac="0.384722"
/>

<!-- Measured beat-fire times (s from run start) — tiles.ts
     tileBeatSchedule(6): tiles k at 550 + Σ gaps ms, then the track beats at
     8117ms (row 1) and 9100ms (row 2) — one press per beat, no intra-click
     lag on manual stepping. -->
<AutoAdvance
  :duration-sec="9.2"
  :step-schedule-sec="[0.55, 0.95, 2.333, 3.767, 4.817, 6.617, 8.117, 9.1]"
/>

</div>

<style>
/* Same stage contract as the HeroTile demo slide; re-declared here because a
   slide's styles are global only once that slide's chunk has loaded. */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>
---

<!--
  Demo slide: RatioStrip — one proportional band with a two-phase build:
  click 1 pops the band at initial proportions (~120ms), click 2 re-flows the
  mint + teal regions to their settled shares in three bursts ~1.1s apart
  (measured 650 / 1783 / 3617ms after the burst trigger), click 3 sweeps the
  chip labels left→right in two strokes (4567–4950ms clip time) and fades in
  the caption row. AutoAdvance pins the measured clip anchors (sheet
  art_7bTnqSB3 §3.3): band 0.3s, burst trigger 0.65s (the internal stepped
  delays then carry bursts 2–3 and the mint settle), chip sweep 4.567s.
  Measured from the settled clip frame t≈5.97s at
  1920×1080 (art_7bTnqSB3 §3; band x 14.4–85.9%w × y 51.4–73.3%h): settled
  shares red 24% (330px, red→salmon gradient) / mint 11.3% (155px) / teal
  64.7% (888px), with the mint and teal regions reading as ONE continuous
  bright ramp #a0fbd9→#1ed496 (shared userSpaceOnUse field; the teal
  gradient starts at the mint's left edge x605, crossing the x760 mint/teal
  boundary with no discontinuity). Above the band: a two-tone panel —
  #19181d plate bar y333–411 holding the mixed-case URL heading
  'data.mrk.shop/workspace', then a #0f0e11 body field y412–936 — with the
  gray caps row 'TIME IN ONE WORKING DAY' (y465–481) and a 9-tick
  measurement row (4×25px, y510–534, pitch ≈171.6px, #3a3b42). Three dark
  data-quality chips ride the band (#020404, y628–718): 'LATE DATA' |
  'DUPLICATE ROWS' | 'WRONG TOTALS' with mint #21d697 labels, revealed last
  in two left→right sweeps split at x1282. The caption row is the measured
  pair 'CONNECTING TOOLS' (red #e94343, x277–609) + 'ACTUAL DATA PROBLEMS'
  (mint #23d598, x1224–1643) at y836–858. TEXT CORRECTION: the sheet's
  prose strings ('PLATFORM · 75.7%', 'COMPUTE UNITS · FY26', 'SHARE OF
  COMPUTE', 'RUNTIME SHARE · FY26 SPLIT') do not appear in the source
  video — its own band-right crop reads 'DUPLICATE ROWS'/'WRONG TOTALS';
  the video is the scoring target, so this slide typesets the
  video-verified strings. Initial proportions are [I]: the teal region
  starts at ~1/5 of its settled share and the mint segment near-closed; red
  holds the rest. All three v-clicks are pure revealed-state transitions
  — backward nav snaps instantly.
-->

<div class="sf-demo-stage">

<RatioStrip
  title="Less time"
  title-accent="connecting tools"
  heading="data.mrk.shop/workspace"
  heading2="TIME IN ONE WORKING DAY"
  :chips="['LATE DATA', 'DUPLICATE ROWS', 'WRONG TOTALS']"
  caption="CONNECTING TOOLS"
  caption-color="#e94343"
  caption-right="ACTUAL DATA PROBLEMS"
  :palette="{ accentAlt: '#ec423f' }"
  :y-frac="0.513889"
  :h-frac="0.219444"
  :segments="[
    { id: 'sources', tone: 'alt', wFrac: 0.84, wFracFinal: 0.24 },
    { id: 'mint', tone: 'mint', wFrac: 0.03, wFracFinal: 0.113 },
    { id: 'platform', tone: 'tertiary', wFrac: 0.13, wFracFinal: 0.647 },
  ]"
/>

<AutoAdvance :duration-sec="4.567" :step-schedule-sec="[0.3, 0.65, 4.567]" />

</div>

<style>
/* Stage fills the 1920×1080 canvas; the black canvas lives in styles/index.css. */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>

---

<!--
  Demo slide: SegmentTimeline — a thin dim track (x315–1460, y494–499)
  carries three contiguous bright fills that tile it node-edge → node-edge,
  one solid hue disc (d≈103, dark 01/02/03 step number) per segment, a 4px
  hue-matched tick dropping 142px to a two-row label block (bold white row 1
  offset 27px right of the node, dim row 2 on nodes 1–2 only), a white end
  arrow past the track's right end, and a legend column on node 3's axis
  (three hue words + bars + dim note) that fades in LAST. One click per
  segment: the node pops ~100ms while its fill sweeps ~150ms ease-out with a
  hard hold, the tick + row-1 label cascade ~400ms after the pop, the row-2
  dim label ~1300ms after it. Geometry and strings are the source recording's
  measured canvas fractions (art_lYM2KXza §SegmentTimeline, settled ref frame
  of the 1920×1080 read; OCR-confirmed labels); node centers (511/960/1408)
  drive every tick, label, fill boundary, and the legend column, so they can
  never drift. AutoAdvance is renderless deck-level wiring: the `a` key
  toggles a hands-free run and `?autoplay=N` in the URL starts one on slide
  enter. stepScheduleSec pins the three clicks to the measured pops
  2300/4730/6880ms exactly (0ms drift vs the recording), and the legend lands
  8400–10000 with a ≈10.1s settle exactly on the recording.
-->

<div class="sf-demo-stage">

<SegmentTimeline
  title="Where is it"
  title-accent="heading?"
  :title-text-length="795"
  :segments="[
    { id: 'practices', tone: 'accent', nodeFrac: 511 / 1920, label: 'SOFTWARE PRACTICES', sublabel: 'GIT, TESTS AND REVIEW ON PIPELINES' },
    { id: 'integration', tone: 'tertiary', nodeFrac: 960 / 1920, label: 'BETTER INTEGRATION', sublabel: 'ONE PLATFORM INSTEAD OF SIX TOOLS' },
    { id: 'collaboration', tone: 'alt', nodeFrac: 1408 / 1920, label: 'CLOSER COLLABORATION' },
  ]"
/>

<AutoAdvance :step-schedule-sec="[2.3, 4.73, 6.88]" />

</div>

<style>
/* Stage fills the 1920×1080 canvas; the black canvas lives in styles/index.css. */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>


---

<!--
  StackPanels demo (v4 family, exact-trace art_mkVNxsft §1): the recording is
  a continuous auto-run; native v-clicks re-pace it to five clicks — four
  ~300ms full-size opacity fades (blue, cyan, amber, green — TL→TR→BL→BR),
  then the plate brighten + caption landing on the closing beat (the sheet's
  f351–360 window). The white plate (#f5f5f5, 1px #989898 border, no top
  line) enters dim (~33% white) with click 1; every panel cuts one 45°
  corner (~10px) showing plate white; dark icon+title groups center per
  panel; the green panel is empty below its title. Geometry is the sheet's
  measured mosaic in stage fractions — title boxes are the sheet's native
  ink bboxes × the 2038→1920 (0.94171) / 1144→1080 (0.944055) conversion
  factors, so the numbers stay traceable to the sheet. AutoAdvance paces
  the run; `a` toggles a hands-free run, `?autoplay=N` starts one on enter.
-->

<div class="sf-demo-stage">

<StackPanels
  title="One"
  titleAccent="unified environment"
  caption="ONE ENVIRONMENT"
  :palette="{ accent: '#3599fb', accentAlt: '#1fd0ea', accentTertiary: '#f9bc1d', accentQuaternary: '#1cd798' }"
  :panels="[
    { id: 'blue', xFrac: 229.8 / 1920, yFrac: 364.4 / 1080, wFrac: 748.6 / 1920, hFrac: 301.2 / 1080, tone: 'accent', bandReveal: 'fade', cutCorner: 'tl', icon: 'dash-grid', iconBox: { xFrac: 398.3 / 1920, yFrac: 489.0 / 1080, wFrac: 74.4 / 1920, hFrac: 49.1 / 1080 }, title: 'INGESTION', titleBox: { xFrac: 550 * 0.94171 / 1920, yFrac: 526 * 0.944055 / 1080, wFrac: 304 * 0.94171 / 1920, hFrac: 37 * 0.944055 / 1080 } },
    { id: 'cyan', xFrac: 981.3 / 1920, yFrac: 364.4 / 1080, wFrac: 615.0 / 1920, hFrac: 301.2 / 1080, tone: 'alt', bandReveal: 'fade', cutCorner: 'tr', icon: 'filter', iconBox: { xFrac: 1086.9 / 1920, yFrac: 482.4 / 1080, wFrac: 73.3 / 1920, hFrac: 72.7 / 1080 }, title: 'TRANSFORM', titleBox: { xFrac: 1279 * 0.94171 / 1920, yFrac: 526 * 0.944055 / 1080, wFrac: 308 * 0.94171 / 1920, hFrac: 37 * 0.944055 / 1080 } },
    { id: 'amber', xFrac: 229.8 / 1920, yFrac: 670.3 / 1080, wFrac: 520.8 / 1920, hFrac: 301.1 / 1080, tone: 'tertiary', bandReveal: 'fade', cutCorner: 'bl', icon: 'database', iconBox: { xFrac: 323.0 / 1920, yFrac: 784.5 / 1080, wFrac: 64.0 / 1920, hFrac: 74.6 / 1080 }, title: 'STORAGE', titleBox: { xFrac: 464 * 0.94171 / 1920, yFrac: 852 * 0.944055 / 1080, wFrac: 234 * 0.94171 / 1920, hFrac: 38 * 0.944055 / 1080 } },
    { id: 'green', xFrac: 753.4 / 1920, yFrac: 668.7 / 1080, wFrac: 842.9 / 1920, hFrac: 302.7 / 1080, tone: 'quaternary', bandReveal: 'fade', cutCorner: 'br', icon: 'navigation-2', iconBox: { xFrac: 958.7 / 1920, yFrac: 809.0 / 1080, wFrac: 70.5 / 1920, hFrac: 37.8 / 1080 }, title: 'MONITORING', titleBox: { xFrac: 1141 * 0.94171 / 1920, yFrac: 852 * 0.944055 / 1080, wFrac: 342 * 0.94171 / 1920, hFrac: 38 * 0.944055 / 1080 } },
  ]"
/>

<AutoAdvance :duration-sec="0.6" />

</div>

<style>
/* Same stage contract as the HeroTile demo slide; re-declared here because a
   slide's styles are global only once that slide's chunk has loaded. */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>

---

<!--
  Demo slide: MilestoneLanes — a four-lane Gantt/milestone chart rebuilt to
  the exact-trace sheet (art_kYBddwt9; true settled frame = clip 6600ms).
  Bars are measured DATA at non-uniform lane tops (y525/597/694/766 at 1080)
  with the measured fills #ED4342 (alt) / #F9BB21 (accent); milestone
  diamonds (45°-rotated squares with radial glows) sit on the marker column
  at (347,551) and (347,719); the long bars carry near-black captions.
  Choreography (sheet §5): bar 2 sweeps its full rail then re-proportions
  (clicks 1-2), bar 1 pops at final width (3-4), bar 4 grows ease-out (5-6),
  bar 3 expands center-out (7-8), the footer fades last (9). Lanes are
  listed in reveal order; lane tops are explicit yFrac. AutoAdvance pins the
  sheet's measured beat schedule (stepScheduleSec, PR #43's shared
  mechanism); the `a` key toggles a hands-free run and `?autoplay=N` in the
  URL starts one on slide enter.
-->

<div class="sf-demo-stage">

<MilestoneLanes
  title="DATA"
  title-accent="ROADMAP"
  :title-text-length="798"
  header-label="WHERE THE WORK GOES"
  header-icon="database"
  footer-label="YOUR JUDGEMENT DECIDES THE DESIGN"
  footer-icon="map-pin"
  :diamonds="[
    { id: 'streaming-milestone', centerXFrac: 347 / 1920, centerYFrac: 551 / 1080, tone: 'alt', click: 1 },
    { id: 'quality-milestone-outer', centerXFrac: 347 / 1920, centerYFrac: 719 / 1080, tone: 'accent', click: 4 },
    { id: 'quality-milestone-inner', centerXFrac: 347 / 1920, centerYFrac: 719 / 1080, tone: 'accent', click: 8, inner: true },
  ]"
  :lanes="[
    { id: 'pipeline', yFrac: 597 / 1080, bars: [{ xFrac: 420 / 1920, wFrac: 343 / 1920, hFrac: 35 / 1080, tone: 'alt', reveal: 'sweep', sweepToFrac: 1511 / 1920 }] },
    { id: 'streaming', label: 'STREAMING', labelClick: 1, yFrac: 525 / 1080, bars: [{ xFrac: 1218 / 1920, wFrac: 386 / 1920, hFrac: 50 / 1080, tone: 'alt', reveal: 'pop', text: 'HARDER TO THE ASSISTANT', textLength: 292 }] },
    { id: 'lakehouse', yFrac: 766 / 1080, bars: [{ xFrac: 420 / 1920, wFrac: 1003 / 1920, hFrac: 36 / 1080, tone: 'accent', reveal: 'grow' }] },
    { id: 'quality', label: 'QUALITY LANE', yFrac: 694 / 1080, bars: [{ xFrac: 1307 / 1920, wFrac: 297 / 1920, hFrac: 51 / 1080, tone: 'accent', reveal: 'center', text: 'HARDER TO REPLACE', textLength: 240 }] },
  ]"
  :y0-frac="0.4861111"
  :lane-pitch-frac="0.0694444"
  :bar-h-frac="0.0462963"
/>

<AutoAdvance :step-schedule-sec="[0.2, 0.616, 1.116, 2.25, 2.683, 3.0, 3.4, 3.48, 3.8]" />

</div>

<style>
/* Same stage contract as the earlier demo slides; re-declared here because
   a slide's styles are global only once that slide's chunk has loaded. */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>

---

<!--
  Demo slide: exact-trace composition (sheet art_4A7yguGJ) — two bordered
  cluster plates on the black canvas, each with a faint flat-top honeycomb web
  and an in-panel label. Click 1 builds the left plate (INGESTION), click 2
  the right (NODE) with its pre-build core, click 3 dims every bright web
  stroke to the ~6–10%-white settled contract (the 5.9–6.6s transition).
  AutoAdvance pins the measured beats (sheet art_4A7yguGJ §3.3): left build
  3.68s, right build 4.23s, dim 5.93s — uniform pacing dimmed ~4.5s early.
  Header strings verified from the hx-h1/h2/h3 crops: white 'DATA' + green
  'MESH DATA GRID' on the measured ≈x916 axis.
-->

<div class="sf-hex-stage">

<HexCluster
  title="DATA"
  titleAccent="MESH DATA GRID"
  :plates="[
    { id: 'left', label: 'INGESTION', tone: 'cyan' },
    { id: 'right', label: 'NODE', tone: 'blue' },
  ]"
/>

<AutoAdvance :duration-sec="5.933" :step-schedule-sec="[3.683, 4.233, 5.933]" />

</div>

<style>
/* Stage fills the 1920×1080 canvas; the black canvas lives in styles/index.css
   (the deck is black-canvas by design — build-scope boundary: no theme switching). */
.sf-hex-stage {
  position: absolute;
  inset: 0;
}
</style>
