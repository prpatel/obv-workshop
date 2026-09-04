<script setup lang="ts">
import { computed } from 'vue'
import {
  CHIP_WFRAC,
  HEADING_Y_FRAC,
  RED_GRADIENT_END,
  TEAL_GRADIENT_START,
  ratioStripLayout,
  tealBurstWidths,
  type StripSegment,
  type StripSegmentLayout,
} from './stepflow/strip'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
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
  /** Partial palette merged over the measured `cyanOnBlack` preset. */
  palette?: StepFlowPaletteOverride
  /** Mono header line, e.g. 'RUNTIME'. */
  title?: string
  /** Header tail rendered in chrome green after `title` (two-tone chrome convention). */
  titleAccent?: string
  /** White heading row above the band (measured glyph baseline ~y490 at 1080p). */
  heading?: string
}>(), { palette: () => ({}) })

const p = computed(() => resolvePalette(props.palette))
const layout = computed(() => ratioStripLayout({ segments: props.segments, yFrac: props.yFrac, hFrac: props.hFrac, caption: props.caption }))

// Tone fills map to palette roles; the plain tone is chrome white (NodeEdge
// precedent) — chrome, not a palette field. Title chrome lives in the shared
// TitleChrome component.
const PLAIN_FILL = '#f5f4f7'

// Measured settled medians (report art_iHm120ov §RatioStrip, frame t=99.1s):
// mint chip #a0fcd9 (chip fill + label accent), panel plate #18181b, and the
// caption-row mint text (report range #50e0b0–#90f0d0, midpoint). Segment
// fills are measured gradients, not flats: the red segment runs accentAlt →
// salmon #f98c8c (the "salmon segment" earlier research read as a separate
// amber block is this gradient's tail — no amber exists in the source), and
// the teal region runs bright-mint #76eec5 → the teal token (no dark
// sub-band — that earlier read was a misread tone, dropped entirely).
const MINT = '#a0fcd9'
const PLATE_FILL = '#18181b'
const MINT_TEXT = '#70e8c0'

// Tone fills: `alt` ramps per-rect (objectBoundingBox — the click-1 wide copy
// carries the full red→salmon ramp across itself), `tertiary` samples a fixed
// userSpaceOnUse field anchored to the segment's FINAL region so every burst
// copy reveals the same unchanging gradient.
function toneFill(seg: StripSegmentLayout): string {
  if (seg.tone === 'alt') return 'url(#sf-rs-grad-alt)'
  if (seg.tone === 'tertiary') return `url(#sf-rs-grad-tertiary-${seg.id})`
  if (seg.tone === 'accent') return p.value.accent
  return PLAIN_FILL
}

// Caption labels adopt their segment's tone family (measured: the red label
// under the red segment, mint/green text under the teal region); accent stays
// the accent, plain stays chrome-dim.
function labelColor(seg: StripSegmentLayout): string {
  if (seg.tone === 'alt') return p.value.accentAlt ?? p.value.accent
  if (seg.tone === 'tertiary') return MINT_TEXT
  if (seg.tone === 'accent') return p.value.accent
  return p.value.subtext
}

// Teal-region internals anchor to every tertiary segment (the recording has
// one): the mint chip at the region's left edge, sized as a fraction of that
// segment's FINAL width.
const tertiaries = computed(() => layout.value.segments.filter((s) => s.tone === 'tertiary'))

// Three-burst re-flow (click 2): two stacked teal rects reveal the fixed
// gradient field at the measured waypoints; the segment's own final rect
// carries burst 3 (the settled width) at the last delay.
function tealBursts(seg: StripSegmentLayout): number[] {
  const [b1, b2] = tealBurstWidths(layout.value.band.w, seg.w1)
  return [b1, b2]
}

// Typography: the heading and caption rows are measured glyph heights at the
// 1080px reference (25px / 20px caps → ~35px / ~28px em), kept absolute so the
// measured rows stay measured (report root-cause #2: the old 13px label row
// was 14–20px where the source reads 26–28px). Title chrome lives in the
// shared TitleChrome component.
const type = computed(() => ({
  headingSize: 35,
  labelSize: 28,
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
      <!-- Teal region gradient: measured bright mint → the teal token, fixed
           to the FINAL region (userSpaceOnUse) so the burst rects reveal one
           unchanging field. -->
      <linearGradient
        v-for="seg in tertiaries"
        :key="`grad-${seg.id}`"
        :id="`sf-rs-grad-tertiary-${seg.id}`"
        gradientUnits="userSpaceOnUse"
        :x1="seg.x1"
        y1="0"
        :x2="seg.x1 + seg.w1"
        y2="0"
      >
        <stop offset="0" :stop-color="TEAL_GRADIENT_START" />
        <stop offset="1" :stop-color="p.accentTertiary ?? p.accent" />
      </linearGradient>
    </defs>

    <!--
      Measured chrome (t=99.1s): the dark panel plate above the band and the
      white heading row under it. Both are present before the band pops —
      static, outside the click groups.
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
      :x="layout.band.x"
      :y="layout.viewBox.height * HEADING_Y_FRAC"
      :font-size="type.headingSize"
      fill="#ffffff"
      letter-spacing="0.06em"
    >{{ heading }}</text>

    <!--
      Reveal binding (3 native v-clicks), two-phase build: click 1 pops the
      band at initial proportions (~120ms width ease). Click 2 re-flows the
      teal region to its settled share in three bursts ~470ms apart (measured
      99.10 / 99.57 / 99.83s) — stacked burst rects with stepped
      transition-delays over the final copy, then the mint chip fades in at
      the region's left edge. Click 3 fades in the tone-colored caption row.
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
          :fill="`url(#sf-rs-grad-tertiary-${seg.id})`"
        />
        <!-- Mint label chip: full-height marker at the teal region's left edge. -->
        <rect
          class="sf-rs-chip"
          :x="seg.x1"
          :y="layout.band.y"
          :width="seg.w1 * CHIP_WFRAC"
          :height="layout.band.h"
          :fill="MINT"
        />
      </template>
    </g>

    <!-- Caption row (click 3): per-segment labels under their final left edge. -->
    <g v-click="3" class="sf-rs-text">
      <text
        v-for="seg in layout.segments.filter((s) => s.label)"
        :key="`label-${seg.id}`"
        class="sf-rs-caption"
        :x="seg.x1"
        :y="layout.captionY"
        :font-size="type.labelSize"
        :fill="labelColor(seg)"
        letter-spacing="0.08em"
      >{{ seg.label }}</text>
      <text
        v-if="caption"
        class="sf-rs-caption"
        :x="layout.band.x"
        :y="layout.captionY"
        :font-size="type.labelSize"
        :fill="p.subtext"
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
 * Measured motion, re-paced (report art_iHm120ov §RatioStrip): the band pops
 * ~100ms (click 1 — 120ms width ease), then the teal region re-flows in
 * three bursts ~470ms apart (measured 99.10 / 99.57 / 99.83s) — burst 0 at
 * 0ms, burst 1 at 470ms, burst 3 (the final copy) at 730ms, each a 140ms
 * width ease. The chip fades with the re-flow, the caption row on click 3.
 * Transition is taken from the destination state: forward reveal runs the
 * width transition, the hidden state's transition:none makes backward nav
 * instant — the locked decision, zero JS. Scoped selectors (0,2,0 +
 * attribute) beat Slidev's built-in .slidev-vclick-target transition.
 */
.sf-rs-seg0 {
  transition: width 120ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-rs-seg1,
.sf-rs-burst {
  transition: width 140ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-rs-burst0 {
  transition-delay: 0ms;
}

.sf-rs-burst1 {
  transition-delay: 470ms;
}

.sf-rs-seg1 {
  transition-delay: 730ms;
}

.sf-rs-build.slidev-vclick-hidden .sf-rs-seg0,
.sf-rs-final.slidev-vclick-hidden .sf-rs-seg1,
.sf-rs-final.slidev-vclick-hidden .sf-rs-burst {
  width: 0;
  transition: none;
}

.sf-rs-chip,
.sf-rs-caption {
  transition: opacity 150ms ease-out;
}

.sf-rs-final.slidev-vclick-hidden .sf-rs-chip,
.sf-rs-text.slidev-vclick-hidden .sf-rs-caption {
  opacity: 0;
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-rs-seg0,
  .sf-rs-seg1,
  .sf-rs-burst,
  .sf-rs-chip,
  .sf-rs-caption {
    transition: none;
  }
}
</style>
