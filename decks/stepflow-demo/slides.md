---
theme: default
title: StepFlow — reference-faithful restart deck
info: The eight-segment StepFlow restart, rebuilt from measured 2560×1440 source recordings — one beat per click on the 1920×1080 black canvas.
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
  seg01 slide — StairChain split-ascent (user8 seg01, 14–18s @2560×1440).
  Two-tone run: blocks 1–3 blue (accent), blocks 4–6 cyan (tertiary), with the
  recording's interleaved build order — blue blocks land on clicks 2/4/6, cyan
  on 3/5/7 — expressed via per-step `click` overrides. The steps array stays
  POSITIONAL (stair.ts contract: geometry walks left → right; only `click`
  remaps), so tones and punched numbers ride array position while the reveal
  sequence interleave. Geometry is the explicit SEG01_PLACEMENT
  (measured connected-component lefts/tops from report.json, imported verbatim;
  the default uniform walk is bypassed):

    block  1      2       3       4       5       6
    left  0.1391  0.2797  0.4172  0.5516  0.6855  0.7992
    top   0.625   0.5757  0.6062  0.5153  0.4611  0.4056

  The amber '3×' callout reveals on click 1 at its measured seg01 box
  (x 0.135–0.170, y 0.449–0.482 ink; yFrac is the baseline). Three late
  annotation waves land on clicks 8/9/10 as teal marks — each box is the
  settled-frame union of its wave's micro-components (tiny dim-teal glyphs at
  2560×1440 are not resolvable to copy; the measured extents are pinned, the
  specPanel precedent). Palette: the chainBlue family preset with the settled
  medians pinned as slide-level props — blue #3799fb, cyan #1fd0ea, amber
  #f9bb1f (per the seg01 PR). Glow-trace follows the locked user decision:
  the reference's per-block glow is a capture artifact, so blocks render flat.

  AutoAdvance pins the 10-beat measured schedule (callout 0.27, interleaved
  blocks 0.53–1.27, annotation waves 2.07/2.67/3.07); `a` toggles a hands-free
  run, `?autoplay=N` starts one on enter.
-->

<div class="sf-demo-stage">

<StairChain
  title="THE DATA"
  title-accent="SYSTEMS LIFECYCLE"
  :placement="{ blockFrac: 0.1085, leftsFrac: [0.1391, 0.2797, 0.4172, 0.5516, 0.6855, 0.7992], topsFrac: [0.625, 0.5757, 0.6062, 0.5153, 0.4611, 0.4056] }"
  :palette="{ accent: '#3799fb', accentTertiary: '#1fd0ea', accentAlt: '#f9bb1f' }"
  :callout="{ text: '3×', xFrac: 0.1352, yFrac: 0.4806, textLengthFrac: 0.0343 }"
  :annotations="[
    { id: 'wave-1', xFrac: 0.5516, yFrac: 0.5153, wFrac: 0.0324, hFrac: 0.1396, click: 8 },
    { id: 'wave-2', xFrac: 0.6992, yFrac: 0.4944, wFrac: 0.0274, hFrac: 0.1049, click: 9 },
    { id: 'wave-3', xFrac: 0.8234, yFrac: 0.5097, wFrac: 0.0227, hFrac: 0.0354, click: 10 },
  ]"
  :steps="[
    { id: 'ingest', title: '01', caption: 'SOURCE SYSTEMS', click: 2 },
    { id: 'transform', title: '02', caption: 'CLEAN + MODEL', click: 4 },
    { id: 'retry', title: '03', caption: 'EXPECT FAILURE', click: 6 },
    { id: 'quality', title: '04', tone: 'tertiary', caption: 'TESTS GATE DEPLOYS', click: 3 },
    { id: 'serve', title: '05', tone: 'tertiary', caption: 'DASHBOARDS + APIS', click: 5 },
    { id: 'govern', title: '06', tone: 'tertiary', caption: 'LINEAGE + ACCESS', click: 7 },
  ]"
/>

<AutoAdvance :duration-sec="3.07" :step-schedule-sec="[0.27, 0.53, 0.67, 0.80, 0.93, 1.07, 1.27, 2.07, 2.67, 3.07]" />

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
  PillarRow demo — measured seg05 (user8 seg05, 61–63s @2560×1440).
  Three near-black station plates (the V-3 correction: luma 6–40 plates on
  the black canvas, never light gray) on the measured 0.2613 pitch, each
  with a glyph cluster, a companion accent badge (ring + solid core), and a
  hue-matched label row; two summary text rows sit below the card band
  (salmon, then gray). Geometry is the pillars.ts measured table verbatim
  (report.json seg05_61s-63s structure classes; the crop→stage fit rule —
  content bbox → full stage, relative layout preserved — is documented in
  the module docblock, R-2). Station hues are the settled medians, applied
  by the component from its per-index measured table. Label and summary
  copy is integration-supplied (the recording's text is sub-resolution):
  legible-in-spirit strings pinned spacing-only to the measured ink extents
  (the specPanel precedent).

  AutoAdvance pins the complete six-beat measured schedule (f15 progressive
  frames — glyph+label 1 @0.067, badge 1 @0.267, glyph+label 2 @0.600,
  badge 2 @0.733, glyph+label 3 @1.000 (its badge rides the card), summary
  rows @1.467; R-6: one entry per click, no repeated tail interval); `a`
  toggles a hands-free run, `?autoplay=N` starts one on enter.
-->

<div class="sf-demo-stage">

<PillarRow
  title="MEASURED"
  title-accent="PIPELINE"
  :cards="[
    { id: 'fetch', label: 'FETCH', icon: 'cassette-tape' },
    { id: 'query', label: 'QUERY', icon: 'table-2' },
    { id: 'ship', label: 'SHIP', icon: 'navigation-2' },
  ]"
  :summary-rows="[
    'THREE STATIONS, SIX MEASURED BEATS, EVERY BOX CITED TO ITS FRAME',
    'geometry, palette, and onsets pinned to the settled frame pixels',
  ]"
/>

<AutoAdvance :duration-sec="1.467" :step-schedule-sec="[0.067, 0.267, 0.6, 0.733, 1.0, 1.467]" />

</div>

<style>
/* Stage contract as the seg01 slide; re-declared per slide because a
   slide's styles are global only once that slide's chunk has loaded. */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>

---

<!--
  StackPanels demo — dark source-truth variant (user8 seg08, 91–94s @2560×1440).
  The source mosaic is FOUR ABUTTING PANELS directly on the black canvas — no
  white plate, no gutters, square corners:
    blue  #3799fb  x0.209–0.510  y0.326–0.556   (top-left, probed)
    cyan  #1fd0ea  x0.510–0.790  y0.326–0.556   (top-right, probed)
    amber #f9bb1f  x0.209–0.431  y0.558–0.785   (bottom-left, probed)
    teal  #1ed798  x0.431–0.790  y0.557–0.786   (bottom-right, probed)
  Reveal order measured from the 15fps event trace: blue @0.07s, cyan @0.2s,
  teal @0.33s, amber @0.87s — re-paced to four native clicks, one ~300ms
  full-size opacity fade each. In-panel icon+title groups ride their panel's
  click. `:plate="false"` opts out of the light backing plate (art_mkVNxsft
  light-trace variant keeps the default). AutoAdvance pins the complete
  four-beat measured schedule (0.07 / 0.2 / 0.33 / 0.87 — one onset per panel;
  no caption beat); `a` toggles a hands-free run, `?autoplay=N` starts one on
  enter.
-->

<div class="sf-demo-stage">

<StackPanels
  title="One"
  titleAccent="unified environment"
  :plate="false"
  :palette="{ accent: '#3799fb', accentAlt: '#1fd0ea', accentTertiary: '#f9bb1f', accentQuaternary: '#1ed798' }"
  :panels="[
    { id: 'blue', xFrac: 0.209, yFrac: 0.326, wFrac: 0.301, hFrac: 0.230, tone: 'accent', bandReveal: 'fade', icon: 'dash-grid', iconBox: { xFrac: 0.290, yFrac: 0.375, wFrac: 0.039, hFrac: 0.045 }, title: 'INGESTION', titleBox: { xFrac: 0.255, yFrac: 0.470, wFrac: 0.160, hFrac: 0.034 } },
    { id: 'cyan', xFrac: 0.510, yFrac: 0.326, wFrac: 0.280, hFrac: 0.230, tone: 'alt', bandReveal: 'fade', icon: 'filter', iconBox: { xFrac: 0.600, yFrac: 0.375, wFrac: 0.038, hFrac: 0.067 }, title: 'TRANSFORM', titleBox: { xFrac: 0.565, yFrac: 0.470, wFrac: 0.160, hFrac: 0.034 } },
    { id: 'teal', xFrac: 0.431, yFrac: 0.557, wFrac: 0.359, hFrac: 0.229, tone: 'quaternary', bandReveal: 'fade', icon: 'navigation-2', iconBox: { xFrac: 0.565, yFrac: 0.600, wFrac: 0.037, hFrac: 0.035 }, title: 'MONITORING', titleBox: { xFrac: 0.530, yFrac: 0.690, wFrac: 0.180, hFrac: 0.035 } },
    { id: 'amber', xFrac: 0.209, yFrac: 0.558, wFrac: 0.222, hFrac: 0.227, tone: 'tertiary', bandReveal: 'fade', icon: 'database', iconBox: { xFrac: 0.276, yFrac: 0.600, wFrac: 0.033, hFrac: 0.069 }, title: 'STORAGE', titleBox: { xFrac: 0.240, yFrac: 0.690, wFrac: 0.120, hFrac: 0.035 } },
  ]"
/>

<AutoAdvance :duration-sec="0.87" :step-schedule-sec="[0.07, 0.2, 0.33, 0.87]" />

</div>

<style>
/* Same stage contract as the seg01 slide; re-declared here because a
   slide's styles are global only once that slide's chunk has loaded. */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>

---

<!--
  ConvergeFlow demo — measured seg11 (user8 seg11, 130–134s @2560×1440).
  The funnel assembly (ring, cone, tick row, stem) is the clip's mid-state —
  it renders from f0001 and never animates. The build: left cyan column,
  right blue column with its six-box base row, the dim-orange bar bracket
  drawing across, the white base labels, then the gray footer band. Tones
  are the family's re-measured pair (V-4): bright funnel orange #f25726 vs
  the dim bar orange #bf521c — settled-frame medians, locked in converge.ts.
  Title chrome is the sheet's measured token runs (green 'ETL' lead first);
  copy follows CONVERGE_SEED (the component defaults carry it), and the
  in-box glyph rows stay sub-resolution props (left boxes empty). Crop→stage
  mapping: content bbox → full stage, documented in the module docblock (R-2).

  AutoAdvance pins the complete five-beat schedule (f15 onsets 1.07 / 1.53 /
  2.2 / 2.6 / 3.07 — left column, right column, bar + labels, base + row
  bits, footer band; R-6 complete list); `a` toggles a hands-free run,
  `?autoplay=N` starts one on enter.
-->

<div class="sf-demo-stage">

<ConvergeFlow
  title-accent="ETL"
  title="EVERYTHING CONVERGES"
/>

<AutoAdvance :duration-sec="3.07" :step-schedule-sec="[1.07, 1.53, 2.2, 2.6, 3.07]" />

</div>

<style>
/* Stage contract as the seg01 slide; re-declared per slide because a
   slide's styles are global only once that slide's chunk has loaded. */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>

---

<!--
  CompareBadge demo — measured seg12 (user8 seg12, 134–139s @2560×1440).
  Two near-black plate columns (the V-3 correction) flank a center badge —
  a dark red-brown halo ring around the settled #f85721 orange core —
  joined by four dim leader lines. Choreography: the badge pops on click 1,
  then the four plate rows fade in alternating left/right (clicks 2–5,
  ROW_CLICK_BASE). Row copy is integration-supplied (the recording's plate
  text is sub-resolution): legible-in-spirit strings over the measured
  bright/dim bands, each row's icon riding its measured tone. Geometry is
  the compareBadge.ts native-pixel constants (2560×1440 read frame-scaled
  to the stage — the crop fits content-bbox → full stage, module docblock
  R-2). CompareBadge renders its title band at natural mono width (no
  measured ink extent on this sheet).

  AutoAdvance pins the complete five-beat schedule (f15 frame dumps: core
  fade onset f0009 @0.6; waves first visible f0015/f0026/f0045/f0066 →
  1.0 / 1.73 / 3.0 / 4.4; R-6 complete list); `a` toggles a hands-free run,
  `?autoplay=N` starts one on enter.
-->

<div class="sf-demo-stage">

<CompareBadge
  title="TWO WAYS"
  title-accent="TO SHIP"
  badge-icon="square-terminal"
  :rows="[
    { id: 'leftTop', bright: 'VIBE CODING', dim: 'ad-hoc prompts', icon: 'user-round' },
    { id: 'rightTop', bright: 'SPEC-DRIVEN', dim: 'spec, tasks, then build', icon: 'flask-conical' },
    { id: 'leftBottom', bright: 'HAND-ROLLED', dim: 'every move rebuilt', icon: 'rotate-cw' },
    { id: 'rightBottom', bright: 'MEASURED', dim: 'cites the frame', icon: 'table-2' },
  ]"
/>

<AutoAdvance :duration-sec="4.4" :step-schedule-sec="[0.6, 1.0, 1.73, 3.0, 4.4]" />

</div>

<style>
/* Stage contract as the seg01 slide; re-declared per slide because a
   slide's styles are global only once that slide's chunk has loaded. */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>

---

<!--
  SpecPanel demo — measured seg14 (user8 seg14, 153–160s @2560×1440).
  One huge near-black plate (settled luma ≈14 — the V-3 near-black decision)
  carries progressively fading text rows; window-chrome dots ride click 2; a
  red edge accent and a teal accent cluster land on their own late beats.
  The crop frames the full 16:9 slide (R-2, documented in specPanel.ts):
  crop fractions map identity-onto-stage, so the title band and plate
  margins read as full-frame fractions. Seed copy is the module's
  SPEC_PANEL_SEED (resolution-limited read, integration-refined); the title
  band pins its measured 634.56px ink extent (specPanel.ts layout.title).

  AutoAdvance pins the complete seven-beat schedule (STEP_SCHEDULE_SEC:
  plate 0.47, status row 0.6, heading + body 2.0, red accent 3.13, teal
  cluster 4.47, spec row 5.07, closing line 6.53; R-6 complete list); `a`
  toggles a hands-free run, `?autoplay=N` starts one on enter.
-->

<div class="sf-demo-stage">

<SpecPanel
  title="SHIP"
  title-accent="THE SPEC"
/>

<AutoAdvance :duration-sec="6.53" :step-schedule-sec="[0.47, 0.6, 2.0, 3.13, 4.47, 5.07, 6.53]" />

</div>

<style>
/* Stage contract as the seg01 slide; re-declared per slide because a
   slide's styles are global only once that slide's chunk has loaded. */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>

---

<!--
  StepPanel demo — measured seg15 (user8 seg15, 200–206s @2560×1440).
  The header chip is pre-clip state (settled at f0001 — it pops on slide
  entry without consuming a click); the plate outline draws on click 1, the
  three measured rows land on clicks 2–4, the bottom-left orange annotation
  on click 5, the amber group on click 6, and the chrome-green title burst
  closes on click 7. Title runs read accent-FIRST (green 'vibe coding' lead,
  white tail) per the sheet, each run pinned to its measured ink box.
  Seed content is STEP_PANEL_SEED (OCR-approximate read of the recording);
  crop→stage mapping is documented in stepPanel.ts (R-2).

  AutoAdvance pins the complete seven-beat schedule (STEP_BEATS: plate
  1.2, rows 1.667 / 2.4 / 3.133, left annotation 3.667, amber group 4.6,
  title burst 5.867; R-6 complete list); `a` toggles a hands-free run,
  `?autoplay=N` starts one on enter.
-->

<div class="sf-demo-stage">

<StepPanel
  title="to spec-driven shipping"
  title-accent="vibe coding"
  chip-label="VIBE CODING"
/>

<AutoAdvance :duration-sec="5.867" :step-schedule-sec="[1.2, 1.667, 2.4, 3.133, 3.667, 4.6, 5.867]" />

</div>

<style>
/* Stage contract as the seg01 slide; re-declared per slide because a
   slide's styles are global only once that slide's chunk has loaded. */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>

---

<!--
  TileSummary demo — measured seg16 (user8 seg16, 206–208s @2560×1440).
  Three cyan tiles (EXTRACT → TRANSFORM → LOAD, the measured seed) over
  near-black backing plates (plate fill #0c0d0c, the locked V-3 decision),
  joined by a connector rail. The closing beat draws the bracket — right
  vertical, full-width bar, left vertical 200ms behind — and the dim-white
  summary line rides the bar onset +0.266s (the measured bar→text stagger,
  summaryDelaySec). The clip OPENS on title-only (f0001–f0003): the slide's
  pre-click empty state is the video's start state (R-5). Tile sublabels and
  in-tile glyphs are integration-supplied (sub-resolution; the ICON_FALLBACK
  precedent). Crop→stage mapping is IDENTITY (tileSummary.ts docblock, R-2).

  AutoAdvance pins the complete four-beat schedule — tiles 1/2/3 at the f15
  onsets 0.33 / 0.6 / 1.2, bracket 4 at the bar onset 1.467 with the text
  riding +0.266s (R-6 complete list); `a` toggles a hands-free run,
  `?autoplay=N` starts one on enter.
-->

<div class="sf-demo-stage">

<TileSummary
  title="ETL IN"
  title-accent="THREE MOVES"
  summary="three tiles, one measured run"
  :seed="[
    { id: 'extract', label: 'EXTRACT', xFrac: 0.2277, wFrac: 0.077 },
    { id: 'transform', label: 'TRANSFORM', xFrac: 0.4613, wFrac: 0.0774 },
    { id: 'load', label: 'LOAD', xFrac: 0.6953, wFrac: 0.077 },
  ]"
/>

<AutoAdvance :duration-sec="1.467" :step-schedule-sec="[0.33, 0.6, 1.2, 1.467]" />

</div>

<style>
/* Stage contract as the seg01 slide; re-declared per slide because a
   slide's styles are global only once that slide's chunk has loaded. */
.sf-demo-stage {
  position: absolute;
  inset: 0;
}
</style>
