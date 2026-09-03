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
  the v1 reference recording (THE DATA ENGINEERING LIFECYCLE): the RETRY block
  dips below TRANSFORM, reproduced through the measured per-step `lift`
  overrides. AutoAdvance is renderless deck-level wiring: the `a` key toggles a
  hands-free run and `?autoplay=N` in the URL starts one on slide enter.
-->

<div class="sf-demo-stage">

<StairChain
  title="THE DATA ENGINEERING"
  title-accent="LIFECYCLE"
  :callout="{ text: '= 3×', xFrac: 0.026, yFrac: 0.528 }"
  :steps="[
    { id: 'ingest', title: 'INGEST', caption: 'SOURCE SYSTEMS', lift: 0 },
    { id: 'transform', title: 'TRANSFORM', caption: 'CLEAN + MODEL', lift: 0.0603 },
    { id: 'retry', title: 'RETRY', caption: 'EXPECT FAILURE', lift: 0.0227 },
    { id: 'quality', title: 'QUALITY', caption: 'TESTS GATE DEPLOYS', lift: 0.1346 },
    { id: 'serve', title: 'SERVE', caption: 'DASHBOARDS + APIS', lift: 0.2028 },
    { id: 'govern', title: 'GOVERN', caption: 'LINEAGE + ACCESS', lift: 0.271 },
  ]"
/>

<AutoAdvance />

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
  Demo slide: NodeEdge — free-position nodes and polyline edges. Each click
  pops one node (clicks 1-4), then draws one polyline edge via the StepFlow
  dashoffset draw (5-6; the status edge in accentAlt red), then one status
  element per click (7-9). Measured deviation (locked): the v3 recording's
  amber→red swap is modeled appearance-only — status reveals additively,
  nothing is removed. Node positions are DATA (canvas fractions), never
  computed. AutoAdvance is renderless deck-level wiring: the `a` key toggles a
  hands-free run and `?autoplay=N` in the URL starts one on slide enter.
-->

<div class="sf-demo-stage">

<NodeEdge
  title="DATA"
  title-accent="PLATFORM"
  :palette="{ accent: '#349aea', accentAlt: '#e5413f' }"
  :nodes="[
    { id: 'ingest', xFrac: 0.6363, yFrac: 0.4017, tone: 'alt', label: 'INGEST' },
    { id: 'lake', xFrac: 0.7569, yFrac: 0.5245, tone: 'accent', label: 'LAKEHOUSE' },
    { id: 'catalog', xFrac: 0.7569, yFrac: 0.7723, tone: 'plain', icon: 'database' },
    { id: 'serve', xFrac: 0.6363, yFrac: 0.8972, tone: 'accent', label: 'SERVE' },
  ]"
  :edges="[
    { from: 'ingest', to: 'serve', status: true,
      points: [[0.6363, 0.4476], [0.6363, 0.8462]] },
    { from: 'lake', to: 'catalog',
      points: [[0.7569, 0.549], [0.7569, 0.7478]] },
  ]"
  :status="[
    { attach: 'lake', text: 'SLOW 5m', tone: 'alt', kind: 'block' },
    { attach: 'catalog', text: 'DRIFT', tone: 'alt', kind: 'outline' },
    { attach: 'serve', text: 'REPLAY', tone: 'accent', kind: 'arrow' },
  ]"
/>

<AutoAdvance />

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
  VerticalSpine demo (v7 family): the center axis is the rhythm — no drawn
  spine line. One click per element, top → bottom: the orange diamond marker,
  then the label row (with flanking diamonds), then the two side cards with
  captions. Data order IS the click order; an empty title + side 'center'
  renders the marker. AutoAdvance is renderless deck-level wiring (`a` key,
  ?autoplay=N on the URL).
-->

<div class="sf-demo-stage">

<VerticalSpine
  title="CENTER AXIS"
  titleAccent="RHYTHM"
  :nodes="[
    { id: 'marker', title: '', tone: 'alt', side: 'center' },
    { id: 'label', title: 'TRANSPARENCY IN ACTION', tone: 'alt', side: 'center' },
    { id: 'left-stat', title: '4X', caption: 'faster pipelines', tone: 'accent', side: 'left' },
    { id: 'right-stat', title: '50%', caption: 'less toil', tone: 'accent', side: 'right' },
  ]"
/>

<AutoAdvance />

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
  HeroTile demo (v7 segment 2): one solid orange tile dead on the spine axis
  with a dark icon — the section-divider card. Single click; the label is
  optional and omitted here to match the recording. Palette is the measured
  orangeSpine preset verbatim (#f85721).
-->

<div class="sf-demo-stage">

<HeroTile
  title="SECTION"
  titleAccent="DIVIDER"
  icon="user-round"
/>

<AutoAdvance />

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
  Demo slide: SchematicRows — terminal-style token listing. Each click fades
  one row up into place (8 clicks, owned by the component); the brace-shaped
  schematic strokes draw via the StepFlow dashoffset draw within their
  attached row's click (clicks 5-7). Measured deviation (locked): the v6
  recording's continuous auto-run (a typewriter effect) is re-paced to one
  click per row — no typewriter is built. Seed strings are transcribed from
  the settled v6 frame (research art_0AzKGXnD §F5 crops); the palette override
  carries the recording's measured cool #2f95b9 and amber #f2ba1f. AutoAdvance
  is renderless deck-level wiring: the `a` key toggles a hands-free run and
  ?autoplay=N in the URL starts one on slide enter.
-->

<div class="sf-demo-stage">

<SchematicRows
  title="HARDER TO"
  title-accent="MAINTAIN"
  :palette="{ accent: '#2f95b9', accentAlt: '#f2ba1f' }"
  :rows="[
    { id: 'file', indent: 1, tokens: [{ text: 'answer_service.py', tone: 'plain' }] },
    { id: 'imports', tokens: [{ text: 'from ', tone: 'accent' }, { text: 'mrk ', tone: 'plain' }, { text: 'import ', tone: 'accent' }, { text: 'service, depends', tone: 'plain' }] },
    { id: 'signature', tokens: [{ text: 'def ', tone: 'accent' }, { text: 'answer(question: ', tone: 'plain' }, { text: 'str', tone: 'chrome' }, { text: ') → ', tone: 'plain' }, { text: 'str:', tone: 'chrome' }] },
    { id: 'comment', tokens: [{ text: '# the AI application', tone: 'plain' }] },
    { id: 'api', indent: 1, tokens: [{ text: 'api = ', tone: 'plain' }, { text: 'service(', tone: 'accent' }, { text: '&quot;answer-api&quot;)', tone: 'alt' }] },
    { id: 'ctx', indent: 1, tokens: [{ text: 'ctx = ', tone: 'plain' }, { text: 'depends(', tone: 'accent' }, { text: '&quot;mart.orders&quot;)', tone: 'alt' }] },
    { id: 'model', indent: 1, tokens: [{ text: 'model = ', tone: 'plain' }, { text: 'depends(', tone: 'accent' }, { text: '&quot;ai.answer_v2&quot;)', tone: 'alt' }] },
    { id: 'return', indent: 1, tokens: [{ text: 'return ', tone: 'accent' }, { text: 'model.ask(question, ctx)', tone: 'plain' }] },
  ]"
  :schematic="[
    { attach: 'api', tone: 'accent',
      points: [[0.0287, 0.5699], [0.024, 0.5778], [0.0226, 0.5865], [0.0226, 0.611], [0.024, 0.6171], [0.028, 0.6224]] },
    { attach: 'ctx', tone: 'accent',
      points: [[0.0287, 0.6276], [0.024, 0.6355], [0.0226, 0.6442], [0.0226, 0.6687], [0.024, 0.6748], [0.028, 0.6801]] },
    { attach: 'model', tone: 'accent',
      points: [[0.0287, 0.6844], [0.024, 0.6923], [0.0226, 0.701], [0.0226, 0.7255], [0.024, 0.7316], [0.028, 0.7369]] },
  ]"
/>

<AutoAdvance />

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
  reveals the small glyph rows on/under the bars plus the top-right chip
  (click 3). Bar lengths are the measured wFracs (bar 1 ends 49.2%w, bar 2
  51.1%w); the shared anchor, bar height, and bar tops default to the module's
  measured composition. Palette: statusAmber verbatim — the component's family
  default, so no palette prop is needed. AutoAdvance is renderless deck-level
  wiring: the `a` key toggles a hands-free run and ?autoplay=N in the URL
  starts one on slide enter.
-->

<div class="sf-demo-stage">

<TwoBarCompare
  title="INFRA"
  title-accent="COST"
  chip="FY26"
  :bars="[
    { id: 'on-prem', wFrac: 0.325, tone: 'alt', icon: 'server', label: 'ON-PREM', sub: 'SELF-MANAGED' },
    { id: 'cloud', wFrac: 0.34375, tone: 'accent', icon: 'cloud', label: 'CLOUD', sub: 'MANAGED' },
  ]"
/>

<AutoAdvance />

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
  ColumnRow demo (src 223–229s): five equal tone-coded columns rising
  bottom→top, left → right (clicks 1–5), then the dot + label rows below (6).
  Tones read the existing tokens: house cyan for the accent columns, the
  orangeSpine/statusAmber accents for the alt/status columns, and the
  accentTertiary teal (passed here — the field resolves absent by default).
  The recording's four-column comparison variant (230–237s) is the same
  component as seed data: fewer columns with `underline: true` on each.
  AutoAdvance is renderless deck-level wiring (`a` key, ?autoplay=N on the URL).
-->

<div class="sf-demo-stage">

<ColumnRow
  title="PIPELINE"
  title-accent="STAGES"
  :palette="{ accentTertiary: '#1cd798' }"
  :columns="[
    { id: 'extract', tone: 'accent', label: 'EXTRACT' },
    { id: 'load', tone: 'accent', label: 'LOAD' },
    { id: 'transform', tone: 'alt', label: 'TRANSFORM', underline: true },
    { id: 'orchestrate', tone: 'tertiary', label: 'ORCHESTRATE' },
    { id: 'serve', tone: 'status', label: 'SERVE' },
  ]"
  :yFrac="0.514"
  :hFrac="0.233"
  :labelRows="[
    ['· · · ·', '· ·', '· · · · · ·', '· · ·', '· · · · ·'],
    ['SOURCES', 'TABLES', 'JOBS', 'MODELS', 'DASHBOARDS'],
  ]"
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
  TileGrid demo (research §3.5, src 25–35s): six cyan tiles (6.2%w × 9.7%h,
  pitch 27.5%w × 31.25%h) on the black canvas, built row-major with six native
  v-clicks — one per tile. Measured cyanOnBlack tiles carry small teal icons
  (accentTertiary) and white mono labels; the two-tone header follows the
  family chrome convention. The matrix (src 57–60s) and flat-row (107–110s)
  variants are seed-data arrangements of the same contract, covered in tests.
  AutoAdvance is renderless deck-level wiring (`a` key, ?autoplay=N on the URL).
-->

<div class="sf-demo-stage">

<TileGrid
  title="DATA"
  title-accent="TOOLING"
  :tiles="[
    { id: 'extract', icon: 'database', label: 'EXTRACT' },
    { id: 'transform', icon: 'cpu', label: 'TRANSFORM' },
    { id: 'load', icon: 'boxes', label: 'LOAD' },
    { id: 'orchestrate', icon: 'git-branch', label: 'ORCHESTRATE' },
    { id: 'quality', icon: 'layers', label: 'QUALITY' },
    { id: 'serve', icon: 'server', label: 'SERVE' },
  ]"
  :cols="3"
  :tile-w-frac="0.062"
  :tile-h-frac="0.097"
  :pitch-x-frac="0.275"
  :pitch-y-frac="0.3125"
  :x0-frac="0.1953125"
  :y0-frac="0.384722"
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
  Demo slide: RatioStrip — one proportional band that builds at initial
  proportions (click 1, segments growing rightward in parallel), then
  re-proportions to the settled measured widths while the caption row fades in
  (click 2). Measured from the source video's 95–101s strip (research
  art_2kSBGNmJ §3.3): band x 14.4–85.9%w × y 51.4–73.3%h; settled shares red
  16% / amber 10% / teal 76% (146/92/696 px of a 915px band — the layout
  normalizes). Hue decision (no new preset — palette-neutral wave): the salmon
  #f77c7b read maps to statusAmber.accent (compression-muddied amber), the
  mint chip #9dfbd6 stays a documented local constant, and the darker-teal
  sub-band is a black overlay on the accentTertiary token. Initial proportions
  are [I]: the teal region starts at ~1/5 of its settled share (the measured
  22k→108k px re-flow), red/amber holding the rest. Both v-clicks are pure
  revealed-state width transitions — backward nav snaps instantly.
-->

<div class="sf-demo-stage">

<RatioStrip
  title="RUNTIME"
  title-accent="SHARE"
  :palette="{ accent: '#f7ba20', accentAlt: '#e5413f', accentTertiary: '#1cd798' }"
  :y-frac="0.513889"
  :h-frac="0.219444"
  :segments="[
    { id: 'sources', tone: 'alt', wFrac: 0.52, wFracFinal: 0.159563, label: 'INGEST' },
    { id: 'model', tone: 'accent', wFrac: 0.33, wFracFinal: 0.100546, label: 'TRANSFORM' },
    { id: 'platform', tone: 'tertiary', wFrac: 0.15, wFracFinal: 0.760656, label: 'PLATFORM' },
  ]"
/>

<AutoAdvance />

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
  Demo slide: SegmentTimeline — one proportional bar sweeping left→right in
  two contiguous tone-coded segments (clicks 1-2), then all lettering —
  segment labels, milestone ticks with their labels, and the right-side chip —
  fades in together (click 3). Segment shares are the source recording's
  measured canvas-width fractions (research art_2kSBGNmJ §3.1, src 211–222s);
  the layout normalizes them to fill the measured bar span exactly. Tick x
  positions are authored data; tick lines, labels, and the chip position are
  derived from the bar. AutoAdvance is renderless deck-level wiring: the `a`
  key toggles a hands-free run and `?autoplay=N` in the URL starts one on
  slide enter.
-->

<div class="sf-demo-stage">

<SegmentTimeline
  title="MIGRATION"
  title-accent="TIMELINE"
  :segments="[
    { id: 'batch', tone: 'accent', label: 'BATCH', wFrac: 0.3640625 },
    { id: 'stream', tone: 'alt', label: 'STREAMING', wFrac: 0.23125 },
  ]"
  :ticks="[
    { xFrac: 0.265625, label: 'KICKOFF' },
    { xFrac: 0.49921875, label: 'CUTOVER' },
    { xFrac: 0.7328125, label: 'DONE' },
  ]"
  chip="FY25"
  :y-frac="0.4125"
  :h-frac="0.09444444444444444"
  :x0-frac="0.1625"
  :x1-frac="0.759375"
/>

<AutoAdvance />

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
  StackPanels demo (v4 family): the recording is a continuous auto-run;
  native v-clicks re-pace it to four clicks — band sweep, amber panel, green
  panel, stepped labels (accepted deviation per the family spec). Panel
  geometry is the measured v4 mosaic in stage fractions; the band's recorded
  two-shade fill (blue #3599fb left, cyan #1fd0ea right) ships as one accent
  band — the palette contract carries no fourth tone. AutoAdvance is
  per-slide opt-in: `a` toggles a hands-free run, `?autoplay=N` starts one on
  slide enter.
-->

<div class="sf-demo-stage">

<StackPanels
  title="STACK PANELS"
  titleAccent="FAMILY 3"
  caption="band sweep, panel pops, stepped label fade — one click each"
  :palette="{ accentAlt: '#f7ba20', accentTertiary: '#1cd798' }"
  :panels="[
    { id: 'band', xFrac: 0.1178, yFrac: 0.3330, wFrac: 0.7168, hFrac: 0.2850, tone: 'accent', bandReveal: 'sweep', title: 'ONE CANVAS', rows: ['GEOMETRY AS FRACTIONS', 'REVEALS AS NATIVE CLICKS'] },
    { id: 'amber', xFrac: 0.1178, yFrac: 0.6189, wFrac: 0.2738, hFrac: 0.2858, tone: 'alt', bandReveal: 'pop', rows: ['MEASURED FROM', 'THE RECORDING'] },
    { id: 'green', xFrac: 0.3916, yFrac: 0.6189, wFrac: 0.4431, hFrac: 0.2858, tone: 'tertiary', bandReveal: 'pop', rows: ['ACCENT_TERTIARY', 'FALLS BACK TO ACCENT'] },
  ]"
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
  Demo slide: MilestoneLanes — a four-lane Gantt/milestone chart (src
  174–181s, research art_2kSBGNmJ §3.4). Each click grows one lane bar from
  its left edge (clicks 1-4; the recording's pop-then-re-proportion is
  simplified to a single width reveal — accepted re-pace deviation), then
  the amber tick markers spread across lanes (click 5). Bar offsets and
  sizes are DATA: lanes 1-2 red (alt), 3-4 amber (accent) under the
  statusAmber preset verbatim. AutoAdvance is renderless deck-level wiring:
  the `a` key toggles a hands-free run and `?autoplay=N` in the URL starts
  one on slide enter.
-->

<div class="sf-demo-stage">

<MilestoneLanes
  title="DATA"
  title-accent="ROADMAP"
  :lanes="[
    { id: 'streaming', label: 'STREAMING', bars: [{ xFrac: 0.634, wFrac: 0.202, tone: 'alt' }] },
    { id: 'pipeline', label: 'PIPELINE', bars: [{ xFrac: 0.219, wFrac: 0.18, tone: 'alt', hFrac: 0.0333333 }] },
    { id: 'quality', label: 'QUALITY', bars: [{ xFrac: 0.68, wFrac: 0.156, tone: 'accent' }] },
    { id: 'lakehouse', label: 'LAKEHOUSE', bars: [{ xFrac: 0.219, wFrac: 0.522, tone: 'accent', hFrac: 0.0333333 }] },
  ]"
  :y0-frac="0.4861111"
  :lane-pitch-frac="0.0694444"
  :bar-h-frac="0.0486111"
/>

<AutoAdvance />

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
  Demo slide: each click draws one hexagon outline and fades in its inner content
  (three v-clicks, owned by the component). Node data is inline so MCP write-back
  and hand edits follow the same path. AutoAdvance is renderless deck-level wiring
  (see the StepFlow demo slide for the ?autoplay=N / a-key contract).
-->

<div class="sf-hex-stage">

<HexCluster
  title="THE MODERN DATA STACK"
  titleAccent="AT A GLANCE"
  arrangement="v"
  :palette="{ accent: '#349aea', accentTertiary: '#20c88c' }"
  :nodes="[
    { id: 'sources', title: 'SOURCES', caption: 'streams, lakes & warehouses', icon: 'database' },
    { id: 'models', title: 'TRANSFORM', caption: 'sql models compiled in git', icon: 'braces' },
    { id: 'agents', title: 'AI AGENTS', caption: 'agents act on trusted data', icon: 'bot', tone: 'tertiary' },
  ]"
/>

<AutoAdvance />

</div>

<style>
/* Stage fills the 1920×1080 canvas; the black canvas lives in styles/index.css
   (the deck is black-canvas by design — build-scope boundary: no theme switching). */
.sf-hex-stage {
  position: absolute;
  inset: 0;
}
</style>
