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
  on 3/5/7 — expressed via per-step `click` overrides so the steps array stays
  positional (left → right). Geometry is the explicit SEG01_PLACEMENT
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
    { id: 'quality', title: '04', tone: 'tertiary', caption: 'TESTS GATE DEPLOYS', click: 3 },
    { id: 'transform', title: '02', caption: 'CLEAN + MODEL', click: 4 },
    { id: 'serve', title: '05', tone: 'tertiary', caption: 'DASHBOARDS + APIS', click: 5 },
    { id: 'retry', title: '03', caption: 'EXPECT FAILURE', click: 6 },
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
