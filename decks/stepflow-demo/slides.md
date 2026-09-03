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
