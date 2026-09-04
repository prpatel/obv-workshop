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
  BODY_FIELD_BOTTOM_FRAC,
  BODY_FIELD_COLOR,
  BODY_FIELD_Y_FRAC,
  CAPTION_CAP_PX,
  CAPTION_COLOR,
  CAPTION_RIGHT_COLOR,
  CAPTION_RIGHT_WIDTH_PX,
  CAPTION_RIGHT_X_FRAC,
  CAPTION_WIDTH_PX,
  CAPTION_X_FRAC,
  CHIP_FILL,
  CHIP_H_PX,
  CHIP_RADIUS_PX,
  CHIP_SWEEP_SPLIT_FRAC,
  CHIP_TEXT_BASELINE_FRAC,
  CHIP_TEXT_CAP_PX,
  CHIP_TEXT_COLOR,
  CHIP_Y_FRAC,
  CHIPS,
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
import { pinAttrs, titleFontSize } from './stepflow/chrome'
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
  /** Data-quality chip labels, left→right, riding the band ('LATE DATA', …). */
  chips?: string[]
  /** Right caption line at the band's right edge (measured mint 'ACTUAL DATA PROBLEMS'). */
  captionRight?: string
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
  caption: titleFontSize(CAPTION_CAP_PX),
  chipText: titleFontSize(CHIP_TEXT_CAP_PX),
}

// Chip labels resolve against the measured chip table (three boxes; extra
// labels would render at 0-width and are not a supported input).
const chipTexts = computed(() =>
  (props.chips ?? []).map((label, i) => ({ label, chip: CHIPS[i] ?? { x0: 0, x1: 0, ink0: 0, ink1: 0 } })),
)

// Chip geometry: absolute 1920×1080 px boxes riding the band; the label
// baseline is measured (cap band y663–683). Two sweep clip rects reveal the
// labels left→right, split at x1282 between boxes 2 and 3.
const chipGeom = computed(() => ({
  top: CHIP_Y_FRAC * layout.value.viewBox.height,
  height: CHIP_H_PX,
  baseline: CHIP_TEXT_BASELINE_FRAC * layout.value.viewBox.height,
  split: CHIP_SWEEP_SPLIT_FRAC * layout.value.viewBox.width,
  sweepX: CHIPS[0].x0 - 4,
  sweepEnd: CHIPS[CHIPS.length - 1].x1 + 4,
  sweepTop: 655,
  sweepHeight: 36,
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
    <rect
      class="sf-rs-bodyfield"
      :x="layout.plate.x"
      :y="BODY_FIELD_Y_FRAC * layout.viewBox.height"
      :width="layout.plate.w"
      :height="(BODY_FIELD_BOTTOM_FRAC - BODY_FIELD_Y_FRAC) * layout.viewBox.height"
      :fill="BODY_FIELD_COLOR"
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

      <!-- Data-quality chips: fixed settled positions, riding the final band. -->
      <rect
        v-for="(chip, i) in CHIPS"
        :key="`chip-${i}`"
        class="sf-rs-chip"
        :x="chip.x0"
        :y="chipGeom.top"
        :width="chip.x1 - chip.x0"
        :height="chipGeom.height"
        :rx="CHIP_RADIUS_PX"
        :fill="CHIP_FILL"
      />
    </g>

    <!-- Caption row + chip labels (click 3): the labels are clipped by two
         rects whose widths sweep left→right at the measured delays; the
         clipPath lives inside the group so the hidden-state selectors reach it. -->
    <g v-click="3" class="sf-rs-text">
      <defs>
        <clipPath id="sf-rs-band-sweep">
          <rect
            class="sf-rs-sweep sf-rs-sweep0"
            :x="chipGeom.sweepX"
            :y="chipGeom.sweepTop"
            :width="chipGeom.split - chipGeom.sweepX"
            :height="chipGeom.sweepHeight"
          />
          <rect
            class="sf-rs-sweep sf-rs-sweep1"
            :x="chipGeom.split"
            :y="chipGeom.sweepTop"
            :width="chipGeom.sweepEnd - chipGeom.split"
            :height="chipGeom.sweepHeight"
          />
        </clipPath>
      </defs>
      <g clip-path="url(#sf-rs-band-sweep)">
        <text
          v-for="t in chipTexts"
          :key="`chip-label-${t.label}`"
          class="sf-rs-bandtext"
          :x="t.chip.ink0"
          :y="chipGeom.baseline"
          :font-size="TYPE.chipText"
          :fill="CHIP_TEXT_COLOR"
          font-weight="700"
          v-bind="pinAttrs(t.label, TYPE.chipText, t.chip.ink1 - t.chip.ink0)"
        >{{ t.label }}</text>
      </g>
      <text
        v-if="caption"
        class="sf-rs-caption"
        :x="CAPTION_X_FRAC * layout.viewBox.width"
        :y="layout.captionY"
        :font-size="TYPE.caption"
        :fill="captionColor ?? CAPTION_COLOR"
        :textLength="CAPTION_WIDTH_PX"
        lengthAdjust="spacing"
      >{{ caption }}</text>
      <text
        v-if="captionRight"
        class="sf-rs-caption"
        :x="CAPTION_RIGHT_X_FRAC * layout.viewBox.width"
        :y="layout.captionY"
        :font-size="TYPE.caption"
        :fill="CAPTION_RIGHT_COLOR"
        :textLength="CAPTION_RIGHT_WIDTH_PX"
        lengthAdjust="spacing"
      >{{ captionRight }}</text>
    </g>

    <!-- Shared title chrome: frame-measured centered two-tone title
         ('Less time' + green 'connecting tools': cap 54 at y107–160, ink
         x450–1476 pinned via titleTextLength, centered ≈x963) plus the
         recording badge its sheet documents. -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :cap-height="53.2"
      :cap-top="108"
      :center-x="963"
      :title-text-length="1026"
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

.sf-rs-final.slidev-vclick-hidden .sf-rs-chip {
  opacity: 0;
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
