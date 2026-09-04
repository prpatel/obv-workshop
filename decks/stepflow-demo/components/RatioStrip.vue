<script setup lang="ts">
import { computed } from 'vue'
import {
  BAND_FIELD_END,
  BAND_FIELD_START,
  HEADING1_BASELINE_FRAC,
  HEADING1_CAP_PX,
  HEADING1_WIDTH_PX,
  HEADING1_X_FRAC,
  HEADING2_BASELINE_FRAC,
  HEADING2_CAP_PX,
  HEADING2_WIDTH_PX,
  HEADING2_X_FRAC,
  HEADING_COLOR,
  IN_BAND_CAP_PX,
  IN_BAND_CAP_TOP_PX,
  IN_BAND_COLOR,
  IN_BAND_RIGHT_FRAC,
  IN_BAND_SWEEP_SPLIT_FRAC,
  IN_BAND_X_FRAC,
  MINT_SETTLE_DELAY_MS,
  RED_GRADIENT_END,
  TICK_COLOR,
  TICK_H_PX,
  TICK_W_PX,
  TICK_X_CENTERS,
  TICK_Y_FRAC,
  ratioStripLayout,
  tealBurstWidths,
  type StripSegment,
  type StripSegmentLayout,
} from './stepflow/strip'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import { titleBaseline, titleFontSize } from './stepflow/chrome'
import TitleChrome from './stepflow/TitleChrome.vue'

const props = withDefaults(defineProps<{
  /** Proportional segments; `wFrac` is the click-1 width, `wFracFinal` the re-flow destination. */
  segments: StripSegment[]
  /** Band top edge as a fraction of the canvas height. */
  yFrac: number
  /** Band height as a fraction of the canvas height. */
  hFrac: number
  /** Optional single caption line at the band's left edge (author labels XOR caption). */
  caption?: string
  /** Caption ink override — the sheet measures a red caption row (default: chrome-dim subtext). */
  captionColor?: string
  /** Partial palette merged over the measured `cyanOnBlack` preset. */
  palette?: StepFlowPaletteOverride
  /** White lead line, e.g. 'RUNTIME SHARE'. */
  title?: string
  /** Header tail rendered in chrome green after `title` (two-tone chrome convention). */
  titleAccent?: string
  /** Plate heading row 1 — gray tracked caps inside the plate (13px cap). */
  heading?: string
  /** Heading row 2 under the plate — gray tracked caps (16px cap). */
  heading2?: string
  /** In-band dark display text, e.g. 'PLATFORM · 75.7%' (digits sheet-verified). */
  bandText?: string
}>(), { palette: () => ({}) })

const p = computed(() => resolvePalette(props.palette))
const layout = computed(() => ratioStripLayout({ segments: props.segments, yFrac: props.yFrac, hFrac: props.hFrac, caption: props.caption }))

// Tone fills map to palette roles; the plain tone is chrome white (NodeEdge
// precedent) — chrome, not a palette field. Title chrome lives in the shared
// TitleChrome component.
const PLAIN_FILL = '#f5f4f7'

// Measured settled medians (sheet art_7bTnqSB3 §RatioStrip): panel plate
// #19181d and the caption-row red (sheet #e84442). Segment fills are measured
// gradients, not flats: the red segment runs accentAlt → salmon #f98c8c (the
// "salmon segment" earlier research read as a separate amber block is this
// gradient's tail — no amber exists in the source), and the mint + teal
// segments sample ONE continuous gradient field (native reads show no
// discontinuity at the x760 boundary — the sheet's per-region medians are
// that ramp's slice medians).
const PLATE_FILL = '#19181d'
const MINT_TEXT = '#70e8c0'

// Tone fills: `alt` ramps per-rect (objectBoundingBox — the click-1 wide copy
// carries the full red→salmon ramp across itself); `mint` and `tertiary`
// sample the one shared userSpaceOnUse field anchored to the settled band so
// every burst copy and segment slice reveals the same unchanging ramp.
function toneFill(seg: StripSegmentLayout): string {
  if (seg.tone === 'alt') return 'url(#sf-rs-grad-alt)'
  if (seg.tone === 'mint' || seg.tone === 'tertiary') return 'url(#sf-rs-field)'
  if (seg.tone === 'accent') return p.value.accent
  return PLAIN_FILL
}

// Caption labels adopt their segment's tone family (measured: the red label
// under the red segment, mint/green text under the teal region); accent stays
// the accent, plain stays chrome-dim.
function labelColor(seg: StripSegmentLayout): string {
  if (seg.tone === 'alt') return p.value.accentAlt ?? p.value.accent
  if (seg.tone === 'mint' || seg.tone === 'tertiary') return MINT_TEXT
  if (seg.tone === 'accent') return p.value.accent
  return p.value.subtext
}

// The shared field spans the first mint/tertiary segment's final left edge to
// the band's right edge — the measured ramp's extent.
const field = computed(() => {
  const rampSegments = layout.value.segments.filter((s) => s.tone === 'mint' || s.tone === 'tertiary')
  if (rampSegments.length === 0) return null
  return {
    x0: Math.min(...rampSegments.map((s) => s.x1)),
    x1: layout.value.band.x + layout.value.band.w,
  }
})

// Teal-region internals anchor to every tertiary segment (the recording has
// one): the three-burst re-flow sweeps the fixed field at the measured
// waypoints. The mint segment settles on its own delay, after burst 3.
const tertiaries = computed(() => layout.value.segments.filter((s) => s.tone === 'tertiary'))

// Three-burst re-flow (click 2): two stacked teal rects reveal the fixed
// gradient field at the measured waypoints; the segment's own final rect
// carries burst 3 (the settled width) at the last delay.
function tealBursts(seg: StripSegmentLayout): number[] {
  const [b1, b2] = tealBurstWidths(layout.value.band.w, seg.w1)
  return [b1, b2]
}

// Typography: every row is a sheet-measured cap height mapped through the
// shared chrome ratio (titleFontSize), kept absolute so the measured rows
// stay measured. In-band display text: cap 90px on the y628–718 band,
// baseline on the band bottom (chrome convention).
const TYPE = {
  heading1: titleFontSize(HEADING1_CAP_PX),
  heading2: titleFontSize(HEADING2_CAP_PX),
  caption: titleFontSize(22),
  bandText: titleFontSize(IN_BAND_CAP_PX),
}

// In-band display text geometry: measured ink box x706–1659, two-sweep reveal
// split at x1282 (between '·' and the digits — the measured sweep windows).
const bandTextGeom = computed(() => ({
  x: IN_BAND_X_FRAC * layout.value.viewBox.width,
  width: (IN_BAND_RIGHT_FRAC - IN_BAND_X_FRAC) * layout.value.viewBox.width,
  split: IN_BAND_SWEEP_SPLIT_FRAC * layout.value.viewBox.width,
  sweepTop: IN_BAND_CAP_TOP_PX - 8,
  sweepHeight: IN_BAND_CAP_PX + 24,
  baseline: titleBaseline(IN_BAND_CAP_TOP_PX, IN_BAND_CAP_PX),
}))
</script>

<template>
  <svg
    class="ratiostrip"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${segments.length}-segment ratio strip`"
  >
    <defs>
      <!-- Red segment gradient: accentAlt → measured salmon tail, per-rect
           (objectBoundingBox) so each copy ramps across its own width. -->
      <linearGradient id="sf-rs-grad-alt" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" :stop-color="p.accentAlt ?? p.accent" />
        <stop offset="1" :stop-color="RED_GRADIENT_END" />
      </linearGradient>
      <!-- Shared mint→teal field: ONE continuous ramp spanning the first
           ramp segment's final left edge to the band's right edge (measured:
           no discontinuity at the mint/teal boundary). -->
      <linearGradient
        v-if="field"
        id="sf-rs-field"
        gradientUnits="userSpaceOnUse"
        :x1="field.x0"
        y1="0"
        :x2="field.x1"
        y2="0"
      >
        <stop offset="0" :stop-color="BAND_FIELD_START" />
        <stop offset="1" :stop-color="BAND_FIELD_END" />
      </linearGradient>
    </defs>

    <!--
      Measured chrome (sheet §3.2): the dark panel plate above the band, the
      gray tracked heading row inside it, the second heading row under the
      plate, and the 9-tick measurement row — all present before the band
      pops — static, outside the click groups.
    -->
    <rect
      class="sf-rs-plate"
      :x="layout.plate.x"
      :y="layout.plate.y"
      :width="layout.plate.w"
      :height="layout.plate.h"
      :fill="PLATE_FILL"
    />
    <text
      v-if="heading"
      class="sf-rs-heading"
      :x="HEADING1_X_FRAC * layout.viewBox.width"
      :y="HEADING1_BASELINE_FRAC * layout.viewBox.height"
      :font-size="TYPE.heading1"
      :fill="HEADING_COLOR"
      :textLength="HEADING1_WIDTH_PX"
      lengthAdjust="spacing"
    >{{ heading }}</text>
    <text
      v-if="heading2"
      class="sf-rs-heading2"
      :x="HEADING2_X_FRAC * layout.viewBox.width"
      :y="HEADING2_BASELINE_FRAC * layout.viewBox.height"
      :font-size="TYPE.heading2"
      :fill="HEADING_COLOR"
      :textLength="HEADING2_WIDTH_PX"
      lengthAdjust="spacing"
    >{{ heading2 }}</text>
    <g class="sf-rs-ticks">
      <rect
        v-for="(cx, i) in TICK_X_CENTERS"
        :key="`tick-${i}`"
        :x="cx - TICK_W_PX / 2"
        :y="TICK_Y_FRAC * layout.viewBox.height"
        :width="TICK_W_PX"
        :height="TICK_H_PX"
        :fill="TICK_COLOR"
      />
    </g>

    <!--
      Reveal binding (3 native v-clicks), two-phase build: click 1 pops the
      band at initial proportions (~120ms width ease). Click 2 re-flows the
      band to its settled three-segment shares in three bursts (measured
      clip-relative windows 650–1350 / 1783–2133 / 3617–3967ms → stepped
      transition-delays over the final copies), then the mint segment
      settles (4083–4200ms). Click 3 reveals the in-band dark display text
      in two left→right sweeps (4567–4950ms) with the red caption row.
      Hidden states snap (transition: none) so backward navigation is instant.
    -->
    <g v-click="1" class="sf-rs-build">
      <rect
        v-for="seg in layout.segments"
        :key="`init-${seg.id}`"
        class="sf-rs-seg0"
        :x="seg.x0"
        :y="layout.band.y"
        :width="seg.w0"
        :height="layout.band.h"
        :fill="toneFill(seg)"
      />
    </g>

    <g v-click="2" class="sf-rs-final">
      <rect
        v-for="seg in layout.segments"
        :key="`final-${seg.id}`"
        class="sf-rs-seg1"
        :class="{ 'sf-rs-mint': seg.tone === 'mint' }"
        :x="seg.x1"
        :y="layout.band.y"
        :width="seg.w1"
        :height="layout.band.h"
        :fill="toneFill(seg)"
      />
      <template v-for="seg in tertiaries" :key="`teal-${seg.id}`">
        <!-- Burst copies 1–2: stepped reveal of the fixed gradient field. -->
        <rect
          v-for="(bw, i) in tealBursts(seg)"
          :key="`burst-${seg.id}-${i}`"
          class="sf-rs-burst"
          :class="`sf-rs-burst${i}`"
          :x="seg.x1"
          :y="layout.band.y"
          :width="bw"
          :height="layout.band.h"
          fill="url(#sf-rs-field)"
        />
      </template>
    </g>

    <!-- Caption row + in-band display text (click 3): the in-band text is
         clipped by two rects whose widths sweep left→right at the measured
         delays; the clipPath lives inside the group so the hidden-state
         selectors reach it. -->
    <g v-click="3" class="sf-rs-text">
      <defs>
        <clipPath id="sf-rs-band-sweep">
          <rect
            class="sf-rs-sweep sf-rs-sweep0"
            :x="bandTextGeom.x"
            :y="bandTextGeom.sweepTop"
            :width="bandTextGeom.split - bandTextGeom.x"
            :height="bandTextGeom.sweepHeight"
          />
          <rect
            class="sf-rs-sweep sf-rs-sweep1"
            :x="bandTextGeom.split"
            :y="bandTextGeom.sweepTop"
            :width="bandTextGeom.x + bandTextGeom.width - bandTextGeom.split"
            :height="bandTextGeom.sweepHeight"
          />
        </clipPath>
      </defs>
      <text
        v-if="bandText"
        class="sf-rs-bandtext"
        :x="bandTextGeom.x"
        :y="bandTextGeom.baseline"
        :font-size="TYPE.bandText"
        :fill="IN_BAND_COLOR"
        font-weight="700"
        :textLength="bandTextGeom.width"
        lengthAdjust="spacingAndGlyphs"
        clip-path="url(#sf-rs-band-sweep)"
      >{{ bandText }}</text>
      <text
        v-for="seg in layout.segments.filter((s) => s.label)"
        :key="`label-${seg.id}`"
        class="sf-rs-caption"
        :x="seg.x1"
        :y="layout.captionY"
        :font-size="TYPE.caption"
        :fill="labelColor(seg)"
        letter-spacing="0.08em"
      >{{ seg.label }}</text>
      <text
        v-if="caption"
        class="sf-rs-caption"
        :x="layout.band.x"
        :y="layout.captionY"
        :font-size="TYPE.caption"
        :fill="captionColor ?? p.subtext"
        letter-spacing="0.08em"
      >{{ caption }}</text>
    </g>

    <!-- Shared title chrome: sheet-measured centered two-tone title
         (RatioStrip Title row: cap 43 in the band y98–141, centered ≈x963)
         plus the recording badge its sheet documents. -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :cap-height="43"
      :cap-top="98"
      :center-x="963"
      badge
    />
  </svg>
</template>

<style scoped>
.ratiostrip {
  display: block;
  width: 100%;
  height: auto;
}

.ratiostrip text {
  /* Open question #1 (font family): mono stack until the face is confirmed. */
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Measured motion, re-paced to the clip-relative windows (sheet §3.3): the
 * band pops ~100ms (click 1 — 120ms width ease), then the re-flow runs in
 * three bursts — burst 0 at 0ms (700ms ease), burst 1 at 1133ms (350ms),
 * burst 3 (the final copies) at 2967ms (350ms) — and the mint segment
 * settles after burst 3 (measured 4083–4200ms → 3433ms delay, 120ms ease).
 * Click 3 sweeps the in-band text left→right in two steps (0ms / 283ms,
 * ~120ms each — measured 4567–4950ms) and fades the caption row.
 * Transition is taken from the destination state: forward reveal runs the
 * width transition, the hidden state's transition:none makes backward nav
 * instant — the locked decision, zero JS. Scoped selectors (0,2,0 +
 * attribute) beat Slidev's built-in .slidev-vclick-target transition.
 */
.sf-rs-seg0 {
  transition: width 120ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-rs-burst {
  transition: width 140ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-rs-burst0 {
  transition: width 700ms cubic-bezier(0, 0, 0.2, 1);
  transition-delay: 0ms;
}

.sf-rs-burst1 {
  transition: width 350ms cubic-bezier(0, 0, 0.2, 1);
  transition-delay: 1133ms;
}

.sf-rs-seg1 {
  transition: width 350ms cubic-bezier(0, 0, 0.2, 1);
  transition-delay: 2967ms;
}

.sf-rs-mint {
  transition: width 120ms cubic-bezier(0, 0, 0.2, 1);
  transition-delay: v-bind('`${MINT_SETTLE_DELAY_MS}ms`');
}

.sf-rs-sweep {
  transition: width 120ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-rs-sweep1 {
  transition-delay: 283ms;
}

.sf-rs-build.slidev-vclick-hidden .sf-rs-seg0,
.sf-rs-final.slidev-vclick-hidden .sf-rs-seg1,
.sf-rs-final.slidev-vclick-hidden .sf-rs-burst {
  width: 0;
  transition: none;
}

.sf-rs-text.slidev-vclick-hidden .sf-rs-sweep {
  width: 0;
  transition: none;
}

.sf-rs-chip,
.sf-rs-caption {
  transition: opacity 150ms ease-out;
}

.sf-rs-text.slidev-vclick-hidden .sf-rs-caption {
  opacity: 0;
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-rs-seg0,
  .sf-rs-seg1,
  .sf-rs-burst,
  .sf-rs-mint,
  .sf-rs-sweep,
  .sf-rs-caption {
    transition: none;
  }
}
</style>
