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
  overrides, and the in-block labels are the recording's 01–06 step numbers
  (wave-1 report art_v4jVdTnp §1, frame t=7.9). The palette override carries
  the measured two-tone split — blocks 1–3 blue #3599fb, blocks 4–6 cyan
  #1fd0ea — mapped through per-step `tone` roles. AutoAdvance is renderless
  deck-level wiring: the `a` key toggles a hands-free run and `?autoplay=N`
  in the URL starts one on slide enter.
-->

<div class="sf-demo-stage">

<StairChain
  title="THE DATA ENGINEERING"
  title-accent="LIFECYCLE"
  :palette="{ accent: '#3599fb', accentTertiary: '#1fd0ea' }"
  :callout="{ text: '= 3×', xFrac: 0.026, yFrac: 0.528 }"
  :steps="[
    { id: 'ingest', title: '01', caption: 'SOURCE SYSTEMS', lift: 0 },
    { id: 'transform', title: '02', caption: 'CLEAN + MODEL', lift: 0.0603 },
    { id: 'retry', title: '03', caption: 'EXPECT FAILURE', lift: 0.0227 },
    { id: 'quality', title: '04', tone: 'tertiary', caption: 'TESTS GATE DEPLOYS', lift: 0.1346 },
    { id: 'serve', title: '05', tone: 'tertiary', caption: 'DASHBOARDS + APIS', lift: 0.2028 },
    { id: 'govern', title: '06', tone: 'tertiary', caption: 'LINEAGE + ACCESS', lift: 0.271 },
  ]"
/>

<AutoAdvance :duration-sec="4" />

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
  for the status square). Each click pops one node (clicks 1-6, ~70ms), then
  pops one edge (7-13, ~80ms — measured from the recording at native fps:
  edges reach full ink 1-2 frames after onset, a pop, not a dashoffset
  draw). Node positions are DATA (canvas fractions), never computed. The
  red ambient wash behind the network zone and the terminal readout are
  static chrome, not click-bound. Palette seed: the recording's measured
  blue #33a5cd, amber #e6b434, dim-red track #5a1e1e. AutoAdvance is
  renderless deck-level wiring: the `a` key toggles a hands-free run and
  `?autoplay=N` in the URL starts one on slide enter.
-->

<div class="sf-demo-stage">

<NodeEdge
  title="DATA MESH CORE"
  title-accent="PLATFORM"
  :palette="{ accent: '#33a5cd', accentAlt: '#e6b434', track: '#5a1e1e' }"
  :terminal="['LAST DEPLOY 14M AGO', 'VER 2.4.1']"
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

<AutoAdvance :duration-sec="5" />

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
  captions, and finally the gray footer row (per-column lines + dim rule).
  Cards are outlined plates — cyan #24cce5 left, blue #3891e3 right via the
  palette accentAlt — with big card-colored captions (wave-1 report §3).
  Data order IS the click order; an empty title + side 'center' renders the
  marker. AutoAdvance is renderless deck-level wiring (`a` key, ?autoplay=N
  on the URL).
-->

<div class="sf-demo-stage">

<VerticalSpine
  title="CENTER AXIS"
  titleAccent="RHYTHM"
  :palette="{ accent: '#24cce5', accentAlt: '#3891e3' }"
  :footer="{ left: 'MEASURED FROM THE RECORDING', right: 'ONE CLICK PER ELEMENT' }"
  :nodes="[
    { id: 'marker', title: '', tone: 'alt', side: 'center' },
    { id: 'label', title: 'TRANSPARENCY IN ACTION', tone: 'alt', side: 'center' },
    { id: 'left-stat', title: '4X', caption: 'faster pipelines', tone: 'accent', side: 'left' },
    { id: 'right-stat', title: '50%', caption: 'less toil', tone: 'accent', side: 'right', titleScale: 0.84 },
  ]"
/>

<AutoAdvance :duration-sec="5" />

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
  with a dark icon, ringed by a tight red halo that reveals with the tile —
  the section-divider card. Single click; the label is optional and omitted
  here to match the recording, while the secondary white header line rides
  below the primary chrome at recording scale. Palette is the measured
  orangeSpine preset verbatim (#f85721); the halo derives from the accent.
-->

<div class="sf-demo-stage">

<HeroTile
  title="SECTION"
  titleAccent="DIVIDER"
  subtitle="STEPFLOW HOUSE STYLE"
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
  one row up into place (10 clicks, owned by the component); the brace-shaped
  schematic strokes draw via the StepFlow dashoffset draw within their
  attached row's click (clicks 5-7), and the dim highlight band behind the
  `ctx` row fades in on that row's click. Measured deviation (locked): the v6
  recording's continuous auto-run (a typewriter effect) is re-paced to one
  click per row — no typewriter is built. Rows re-transcribed for the wave-1
  fidelity rework (report art_v4jVdTnp §5): 10 rows of 60-110 chars reaching
  ~94% of the canvas width, token tones weighted white > green > amber > blue
  to the measured t=14.1 ratios (42,920 / 14,008 / 8,419 / 3,210 px); the
  palette override carries the recording's measured cool #2f95b9 and amber
  #f2ba1f. AutoAdvance is renderless deck-level wiring: the `a` key toggles a
  hands-free run and ?autoplay=N in the URL starts one on slide enter.
-->

<div class="sf-demo-stage">

<SchematicRows
  title="HARDER TO"
  title-accent="MAINTAIN"
  :palette="{ accent: '#2f95b9', accentAlt: '#f2ba1f' }"
  :rows="[
    { id: 'banner', tokens: [{ text: '# ── answer_service.py', tone: 'plain' }, { text: ' · streaming answers ', tone: 'plain' }, { text: 'over the orders graph', tone: 'chrome' }, { text: ' · ', tone: 'plain' }, { text: 'uv run uvicorn', tone: 'chrome' }, { text: ' :8443 --reload', tone: 'plain' }] },
    { id: 'imports', tokens: [{ text: 'from ', tone: 'accent' }, { text: 'dataclasses ', tone: 'plain' }, { text: 'import ', tone: 'accent' }, { text: 'dataclass, field', tone: 'plain' }, { text: '  # persisted answer', tone: 'chrome' }, { text: ' + citation spans, keyed by question hash', tone: 'plain' }] },
    { id: 'signature', tokens: [{ text: 'def ', tone: 'accent' }, { text: 'stream_answer(', tone: 'plain' }, { text: 'question: ', tone: 'plain' }, { text: 'str', tone: 'chrome' }, { text: ', ctx: ', tone: 'plain' }, { text: 'ServiceContext', tone: 'alt' }, { text: ') -> ', tone: 'plain' }, { text: 'Iterator', tone: 'alt' }, { text: '[', tone: 'plain' }, { text: 'AnswerChunk', tone: 'alt' }, { text: ']:', tone: 'plain' }] },
    { id: 'comment', tokens: [{ text: '# ', tone: 'plain' }, { text: 'guard:', tone: 'alt' }, { text: ' auth + rate-limit first — the cheap rejections before the expensive calls fan out', tone: 'plain' }] },
    { id: 'api', indent: 1, tokens: [{ text: 'api = ', tone: 'plain' }, { text: 'service(', tone: 'alt' }, { text: '&quot;answer-api&quot;', tone: 'chrome' }, { text: ', llm=', tone: 'plain' }, { text: '&quot;qwen3-27b&quot;', tone: 'chrome' }, { text: ', stream=', tone: 'plain' }, { text: 'True', tone: 'alt' }, { text: ', cache=', tone: 'plain' }, { text: '&quot;warm&quot;', tone: 'chrome' }, { text: ', tag=', tone: 'plain' }, { text: '&quot;v2&quot;', tone: 'alt' }, { text: ')', tone: 'plain' }] },
    { id: 'ctx', indent: 1, tokens: [{ text: 'ctx = ', tone: 'plain' }, { text: 'depends(', tone: 'alt' }, { text: '&quot;mart.orders&quot;', tone: 'chrome' }, { text: ', scopes=[', tone: 'plain' }, { text: '&quot;read:orders&quot;', tone: 'chrome' }, { text: ', ', tone: 'plain' }, { text: '&quot;read:customers&quot;', tone: 'plain' }, { text: '], ttl=', tone: 'plain' }, { text: '30', tone: 'alt' }, { text: ')', tone: 'plain' }] },
    { id: 'model', indent: 1, tokens: [{ text: 'model = ', tone: 'plain' }, { text: 'depends(', tone: 'alt' }, { text: '&quot;ai.answer_v2&quot;', tone: 'chrome' }, { text: ', route=', tone: 'plain' }, { text: '&quot;eu-west&quot;', tone: 'chrome' }, { text: ', fallback=', tone: 'plain' }, { text: '&quot;answer-v1-lat&quot;', tone: 'plain' }, { text: ', shadow=', tone: 'plain' }, { text: 'True', tone: 'alt' }, { text: ')', tone: 'plain' }] },
    { id: 'guard', indent: 1, tokens: [{ text: 'if ', tone: 'accent' }, { text: 'ctx.expired:', tone: 'plain' }, { text: ' raise ', tone: 'accent' }, { text: 'AuthError(', tone: 'alt' }, { text: '&quot;session expired&quot;', tone: 'chrome' }, { text: ', retry_after=', tone: 'plain' }, { text: '30', tone: 'alt' }, { text: ')', tone: 'plain' }, { text: '  # 401', tone: 'plain' }] },
    { id: 'stream', indent: 1, tokens: [{ text: 'async for ', tone: 'accent' }, { text: 'chunk ', tone: 'plain' }, { text: 'in ', tone: 'plain' }, { text: 'llm.stream(prompt, ctx): ', tone: 'plain' }, { text: 'yield ', tone: 'plain' }, { text: 'AnswerChunk', tone: 'alt' }, { text: '(chunk.text, meta=ctx)', tone: 'plain' }] },
    { id: 'footer', tokens: [{ text: '# ', tone: 'plain' }, { text: 'p95 412ms', tone: 'chrome' }, { text: ' · ', tone: 'plain' }, { text: '98.7% grounded', tone: 'chrome' }, { text: ' · tokens 1.2k in / 380 out · ', tone: 'plain' }, { text: '$0.0042', tone: 'chrome' }, { text: ' / answer · cache 86%', tone: 'plain' }] },
  ]"
  :highlight="{ row: 'ctx' }"
  :schematic="[
    { attach: 'api', tone: 'accent',
      points: [[0.0287, 0.5699], [0.024, 0.5778], [0.0226, 0.5865], [0.0226, 0.611], [0.024, 0.6171], [0.028, 0.6224]] },
    { attach: 'ctx', tone: 'accent',
      points: [[0.0287, 0.6276], [0.024, 0.6355], [0.0226, 0.6442], [0.0226, 0.6687], [0.024, 0.6748], [0.028, 0.6801]] },
    { attach: 'model', tone: 'accent',
      points: [[0.0287, 0.6844], [0.024, 0.6923], [0.0226, 0.701], [0.0226, 0.7255], [0.024, 0.7316], [0.028, 0.7369]] },
  ]"
/>

<AutoAdvance :duration-sec="4" />

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
  reveals the big light-cyan data-text block, the glyph rows on/under the
  bars, and the top-right chip (click 3). Bar lengths are the measured wFracs
  (bar 1 ends 49.2%w, bar 2 51.1%w); the shared anchor, bar height, and bar
  tops default to the module's measured composition. The centered INFRA COST
  subhead carries the ref frame's headline row; the INFRA COST title is the
  family's top-left header chrome (removing it regresses the composition's
  measured extents — census pass 2). Palette: statusAmber verbatim — the
  component's family default, so no palette prop is needed. AutoAdvance is renderless deck-level wiring:
  the `a` key toggles a hands-free run and ?autoplay=N in the URL starts one
  on slide enter.
-->

<div class="sf-demo-stage">

<TwoBarCompare
  title="INFRA"
  title-accent=" COST"
  chip="FY26"
  subhead="INFRA"
  subhead-accent=" COST · FY26 SPLIT"
  :data-text="{ lines: ['1.9M VCPU INSTALLED', '0.12M VCPU HOURS ACROSS 12 CLUSTERS · Q3'], subline: 'SELF-MANAGED RACKS VS MANAGED CLOUD REGIONS.', caption: 'RACK-SPACE VS MGMT OVERHEAD', note: 'SELF-MANAGED VS MANAGED CLOUD', rules: true }"
  :bars="[
    { id: 'on-prem', wFrac: 0.325, tone: 'alt', icon: 'server', label: 'ON-PREM', sub: 'SELF-MANAGED' },
    { id: 'cloud', wFrac: 0.34375, tone: 'accent', icon: 'cloud', label: 'CLOUD', sub: 'MANAGED' },
  ]"
/>

<AutoAdvance :duration-sec="5" />

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
  bottom→top, left → right (clicks 1–5), then the tinted label row below (6).
  Tones read the existing tokens: the measured step-blue constant for the
  ship endpoint, house cyan for the accent column, the orangeSpine/statusAmber
  accents for the alt/status columns, and the accentTertiary teal (passed here
  — the field resolves absent by default). Heading chrome (amber bar-chip,
  white icon badge, white caption) is static — no click of its own, matching
  the recording. The four-column comparison variant (230–237s) is the same
  component as seed data: fewer columns with `underline: true` on each.
  AutoAdvance is renderless deck-level wiring (`a` key, ?autoplay=N on the URL).
-->

<div class="sf-demo-stage">

<ColumnRow
  title="PIPELINE"
  title-accent="STAGES"
  :palette="{ accentTertiary: '#1cd798' }"
  :columns="[
    { id: 'extract', tone: 'blue', label: 'EXTRACT' },
    { id: 'load', tone: 'accent', label: 'LOAD' },
    { id: 'transform', tone: 'alt', label: 'TRANSFORM', underline: true },
    { id: 'orchestrate', tone: 'tertiary', label: 'ORCHESTRATE' },
    { id: 'serve', tone: 'status', label: 'SERVE' },
  ]"
  :yFrac="0.514"
  :hFrac="0.233"
  :heading="{ icon: 'flask-conical', caption: 'FIVE STAGES · ONE PIPELINE' }"
  :labelRows="[
    { texts: ['SOURCES', 'TABLES', 'JOBS', 'MODELS', 'DASHBOARDS'], tone: 'column' },
    { texts: ['· ·', '·', '· · ·', '·', '· ·'], tone: 'column' },
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
  TileGrid demo (research §3.5, src 25–35s; wave-2 fidelity rework, report
  art_iHm120ov §TileGrid): six pointed hexagonal tiles (6.2%w × 9.7%h boxes,
  pitch 27.5%w × 31.25%h) on the black canvas, built row-major with six native
  v-clicks — one per tile. Measured anatomy: saturated #1ed0e8 hex cores with
  a soft glow halo, a ~12px #353642 connector track through tile centers, a
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

<AutoAdvance :duration-sec="8.7" />

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
  teal region to its settled share in three bursts ~470ms apart (measured
  99.10 / 99.57 / 99.83s), click 3 fades in the mint chip and the
  tone-colored caption row. Measured from the source video's 95–101s strip
  (report art_iHm120ov §RatioStrip, settled frame t=99.1s at 1920×1080): band
  x 14.4–85.9%w × y 51.4–73.3%h; settled shares red 24.3% / teal 75.7% — the
  red segment is the measured 334px = 17.4%w, and its salmon tail is the red
  gradient's end (the earlier "amber segment" was a misread of that tail: no
  amber exists in the source). The teal region is the bright left-to-right
  gradient #76eec5→#1fd898 (no dark sub-band). A dark panel plate
  (y≈331–440, x≈234–1685) and a white heading row sit above the band.
  Initial proportions are [I]: the teal region starts at ~1/5 of its settled
  share (the measured 22k→108k px re-flow), red holding the rest. All three
  v-clicks are pure revealed-state transitions — backward nav snaps instantly.
-->

<div class="sf-demo-stage">

<RatioStrip
  title="RUNTIME"
  title-accent="SHARE"
  heading="SHARE OF TOTAL"
  :palette="{ accentAlt: '#ec423f', accentTertiary: '#1cd798' }"
  :y-frac="0.513889"
  :h-frac="0.219444"
  :segments="[
    { id: 'sources', tone: 'alt', wFrac: 0.85, wFracFinal: 0.2434, label: 'INGEST' },
    { id: 'platform', tone: 'tertiary', wFrac: 0.15, wFracFinal: 0.7566, label: 'PLATFORM' },
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
  Demo slide: SegmentTimeline — a thin dim track at the node axis with bright
  segment fills sweeping between glowing nodes (one click per segment: the
  node pops ~140ms while its fill starts a gradual ~2.4s sweep, then its
  tick + two-row white label block fades in after a beat — sweep-then-pop).
  Segment shares and track geometry are the source recording's measured
  canvas fractions (art_iHm120ov §SegmentTimeline, ref frame t=220.5 of the
  1920×1080 read, src 211–222s); nodes derive from the fills they cap, so
  ticks and labels can never drift. AutoAdvance is renderless deck-level
  wiring: the `a` key toggles a hands-free run and `?autoplay=N` in the URL
  starts one on slide enter.
-->

<div class="sf-demo-stage">

<SegmentTimeline
  title="MIGRATION"
  title-accent="TIMELINE"
  :segments="[
    { id: 'batch', tone: 'accent', label: 'BATCH', sublabel: 'nightly warehouse exports', wFrac: 227 / 1920 },
    { id: 'stream', tone: 'tertiary', label: 'STREAMING', sublabel: 'change-data-capture feed', wFrac: 400 / 1920 },
    { id: 'cutover', tone: 'alt', label: 'CUTOVER', sublabel: 'dual-write drain-down', wFrac: 480 / 1920 },
  ]"
/>

<AutoAdvance :duration-sec="7.5" />

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
  native v-clicks re-pace it to five clicks — one burst-pop per panel (blue,
  cyan, amber, green), then the stepped labels (accepted deviation per the
  family spec). Panel geometry is the wave-1 re-measured 2×2 mosaic in stage
  fractions: blue #3599fb top-left, cyan #1fd0ea top-right (abutting at the
  x≈1040 seam), amber #f7ba20 bottom-left, #1cd798 green bottom-right — the
  four recorded shades ride the palette's four accent slots, including the
  `accentQuaternary` fourth tone added for this split. AutoAdvance is
  per-slide opt-in: `a` toggles a hands-free run, `?autoplay=N` starts one on
  slide enter.
-->

<div class="sf-demo-stage">

<StackPanels
  title="STACK PANELS"
  titleAccent="FAMILY 3"
  caption="measured 2×2 mosaic — panel bursts, stepped labels"
  :palette="{ accent: '#3599fb', accentAlt: '#1fd0ea', accentTertiary: '#f7ba20', accentQuaternary: '#1cd798' }"
  :panels="[
    { id: 'blue', xFrac: 0.1197, yFrac: 0.3374, wFrac: 0.3906, hFrac: 0.2815, tone: 'accent', bandReveal: 'pop', title: 'RUNTIME' },
    { id: 'cyan', xFrac: 0.5103, yFrac: 0.3374, wFrac: 0.3219, hFrac: 0.2815, tone: 'alt', bandReveal: 'pop', title: 'CANVAS' },
    { id: 'amber', xFrac: 0.1197, yFrac: 0.6206, wFrac: 0.2718, hFrac: 0.2797, tone: 'tertiary', bandReveal: 'pop', title: 'INGEST' },
    { id: 'green', xFrac: 0.3925, yFrac: 0.6189, wFrac: 0.4396, hFrac: 0.2815, tone: 'quaternary', bandReveal: 'pop', title: 'WAREHOUSE', rows: ['STREAMS REPLACE BATES', 'GOVERNED BY DEFAULT'] },
  ]"
/>

<AutoAdvance :duration-sec="1.8" />

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
  174–181s, research art_2kSBGNmJ §3.4). Two-phase choreography (fidelity
  report art_iHm120ov §MilestoneLanes): each bar pops WIDE on its pop click
  (clicks 1, 3, 5, 7 — a sweep anchored at the tick rail spanning to the
  bar's final right edge), then re-proportions to its measured seed width on
  the next click (2, 4, 6, 8); the closing beat (click 9) spreads the amber
  tick markers and lands the footer row. Measured text chrome: the header
  label row above lane 1 and the footer row with its teal chip glyph are
  reproduced from ref frame t=180.1s. Bar offsets and sizes are DATA: lanes
  1-2 red (alt), 3-4 amber (accent) under the statusAmber preset verbatim.
  AutoAdvance is renderless deck-level wiring: the `a` key toggles a
  hands-free run and `?autoplay=N` in the URL starts one on slide enter.
-->

<div class="sf-demo-stage">

<MilestoneLanes
  title="DATA"
  title-accent="ROADMAP"
  header-label="WHERE THE WORK GOES"
  header-icon="database"
  footer-label="YOUR JUDGEMENT DECIDES THE DESIGN"
  footer-icon="map-pin"
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
  Demo slide: each click pops one hexagon outline in (~60ms) and fades in its
  inner content (three v-clicks, owned by the component). Geometry ships the
  recording's SETTLED state — the V re-flows to a single row after its build-up
  (fidelity rework: centers 24.8/47.5/70.3%w, cy 0.603·h, span 13.4–81.7%w).
  Node data is inline so MCP write-back and hand edits follow the same path;
  captions carry '\n' row breaks rendered as multi-row cell text. AutoAdvance
  is renderless deck-level wiring (see the StepFlow demo slide for the
  ?autoplay=N / a-key contract).
-->

<div class="sf-hex-stage">

<HexCluster
  title="MODERN DATA STACK"
  titleAccent="█"
  legend="01"
  arrangement="row"
  :geometry="{ centerXFrac: 0.475, pitchXFrac: 0.2275, topFrac: 0.603 }"
  :palette="{ accent: '#349aea', accentTertiary: '#23d498' }"
  :nodes="[
    { id: 'sources', title: 'SOURCES', caption: 'streams, lakes\n& warehouses', icon: 'database' },
    { id: 'models', title: 'TRANSFORM', caption: 'sql models\ncompiled in git', icon: 'braces' },
    { id: 'agents', title: 'AI AGENTS', caption: 'agents act on\ntrusted data', icon: 'bot', tone: 'tertiary' },
  ]"
/>

<AutoAdvance :duration-sec="1.4" />

</div>

<style>
/* Stage fills the 1920×1080 canvas; the black canvas lives in styles/index.css
   (the deck is black-canvas by design — build-scope boundary: no theme switching). */
.sf-hex-stage {
  position: absolute;
  inset: 0;
}
</style>
