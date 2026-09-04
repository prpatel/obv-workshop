<script setup lang="ts">
import { computed, useId } from 'vue'
import {
  LABEL_SIZE,
  LABEL_WHITE,
  LEAD_WHITE,
  NODE_BLUE,
  NODE_CYAN,
  NODE_RED,
  SUBLABEL_SIZE,
  TICK_STROKE,
  TRACK_DIM,
  GLOW_SPREAD,
  segmentTimelineLayout,
  type SegmentLayout,
  type TimelineSegment,
  type TimelineTone,
} from './stepflow/timeline'
import { chainBlue, resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import TitleChrome from './stepflow/TitleChrome.vue'

const props = withDefaults(defineProps<{
  /** Track segments, left → right; node i pops and fill i sweeps on click i. */
  segments: TimelineSegment[]
  /** Track geometry as canvas fractions; defaults are the measured composition. */
  yFrac?: number
  hFrac?: number
  x0Frac?: number
  x1Frac?: number
  /** Partial palette merged over the family's measured blue/cyan/red composition. */
  palette?: StepFlowPaletteOverride
  /** Mono header line, e.g. 'MIGRATION'. */
  title?: string
  /** Header tail rendered in chrome green after `title` (two-tone chrome convention). */
  titleAccent?: string
}>(), {
  // Measured composition (art_iHm120ov §SegmentTimeline, ref t=220.5 of the
  // 1920×1080 read): track x306–1653, y490–502.
  yFrac: 490 / 1080,
  hFrac: 12 / 1080,
  x0Frac: 306 / 1920,
  x1Frac: 1653 / 1920,
})

// The family's measured trio — blue/cyan/red nodes, dim track, tight glow —
// composed over chainBlue so unmeasured fields keep house values. No new
// preset (wave-2 palette neutrality); an override can still re-tint any field.
const p = computed(() => resolvePalette({
  ...chainBlue,
  accent: NODE_BLUE,
  accentTertiary: NODE_CYAN,
  accentAlt: NODE_RED,
  track: TRACK_DIM,
  // Measured halo: 35px reach at peak 0.34 — the ref's halos register in the
  // census glow band (lum 41–110), which the family's 0.28 default misses.
  glow: { peak: 0.34, spread: GLOW_SPREAD },
  ...props.palette,
}))

const layout = computed(() => segmentTimelineLayout({
  segments: props.segments,
  yFrac: props.yFrac,
  hFrac: props.hFrac,
  x0Frac: props.x0Frac,
  x1Frac: props.x1Frac,
}))

// Segment tones map to palette roles; `tertiary`/`alt` fall back to accent
// when a custom palette omits them (NodeEdge tone system).
function toneColor(tone: TimelineTone): string {
  if (tone === 'accent') return p.value.accent
  if (tone === 'tertiary') return p.value.accentTertiary ?? p.value.accent
  return p.value.accentAlt ?? p.value.accent
}

// Per-node glow gradients (the StepFlow radialGradient pattern) — one per
// segment because each halo takes its node's color. useId keeps SSR safe.
const glowId = useId()
function glowRef(seg: SegmentLayout): string {
  return `${glowId}-${seg.id}`
}
function glowEdgeFrac(seg: SegmentLayout): number {
  return seg.nodeR / seg.glowR
}

// Chrome constants: white in label rows (title chrome lives in the shared
// TitleChrome component).
const LEAD_FILL = LEAD_WHITE

function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}

function px(n: number): string {
  return `${fmt(n)}px`
}
</script>

<template>
  <svg
    class="segment-timeline"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${segments.length}-segment timeline diagram`"
  >
    <defs>
      <radialGradient v-for="seg in layout.segments" :id="glowRef(seg)" :key="seg.id">
        <stop offset="0" :stop-color="toneColor(seg.tone)" :stop-opacity="p.glow.peak" />
        <stop :offset="glowEdgeFrac(seg)" :stop-color="toneColor(seg.tone)" :stop-opacity="p.glow.peak" />
        <stop offset="1" :stop-color="toneColor(seg.tone)" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- Dim base track + bright white lead: always visible (the source shows
         the track axis and its capped end before the first node pops). -->
    <rect
      class="sf-tl-track"
      :x="layout.track.x"
      :y="layout.track.y"
      :width="layout.track.width"
      :height="layout.track.height"
      :fill="p.track"
    />
    <rect
      class="sf-tl-lead"
      :x="layout.lead.x"
      :y="layout.lead.y"
      :width="layout.lead.width"
      :height="layout.lead.height"
      :fill="LEAD_FILL"
    />

    <!--
      Reveal binding (the .sf-track-fill pattern applied to a rect): one sweep
      rect per segment, carrying v-click i + 1. Slidev toggles each rect's OWN
      slidev-vclick-hidden class — hidden = width 0 + transition:none (backward
      nav snaps), revealed = a gradual ~2.4s ease left→right width sweep
      (measured: 10–90% over 2550ms). No path-length math.
    -->
    <rect
      v-for="(seg, i) in layout.segments"
      :key="seg.id"
      v-click="i + 1"
      class="sf-tl-seg"
      :x="seg.x"
      :y="layout.track.y"
      :width="seg.width"
      :height="layout.track.height"
      :fill="toneColor(seg.tone)"
      :style="{ '--seg-w': px(seg.width) }"
    />

    <!-- One sibling group per segment (never nested v-clicks): the glowing
         node pops (~140ms scale), then its tick + two-row white label block
         fade in after a beat (120ms delay) — the source reveals each node's
         lettering with the node, not in one end-of-run layer. -->
    <g
      v-for="(seg, i) in layout.segments"
      :key="`node-${seg.id}`"
      v-click="i + 1"
      class="sf-tl-node"
    >
      <circle class="glow" :cx="seg.nodeCx" :cy="seg.nodeCy" :r="seg.glowR" :fill="`url(#${glowRef(seg)})`" />
      <circle class="disc" :cx="seg.nodeCx" :cy="seg.nodeCy" :r="seg.nodeR" :fill="toneColor(seg.tone)" />
      <line
        class="sf-tl-tick"
        :x1="seg.tickX"
        :x2="seg.tickX"
        :y1="seg.tickY0"
        :y2="seg.tickY0 + seg.tickLen"
        :stroke="toneColor(seg.tone)"
        :stroke-width="TICK_STROKE"
      />
      <text
        v-if="seg.label"
        class="sf-tl-label"
        :x="seg.labelCx"
        :y="seg.labelBaseline"
        text-anchor="middle"
        :font-size="LABEL_SIZE"
        :fill="LABEL_WHITE"
        letter-spacing="0.08em"
      >{{ seg.label }}</text>
      <text
        v-if="seg.sublabel"
        class="sf-tl-sublabel"
        :x="seg.labelCx"
        :y="seg.sublabelBaseline"
        text-anchor="middle"
        :font-size="SUBLABEL_SIZE"
        :fill="LABEL_WHITE"
        letter-spacing="0.08em"
      >{{ seg.sublabel }}</text>
    </g>

    <!-- Shared title chrome: sheet-measured centered two-tone title
         (SegmentTimeline Title row: cap 78 in the band y98–176, centered ≈x960)
         plus the recording badge its sheet documents. -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :cap-height="78"
      :cap-top="98"
      badge
    />
  </svg>
</template>

<style scoped>
.segment-timeline {
  display: block;
  width: 100%;
  height: auto;
}

.segment-timeline text {
  /* Open question #1 (font family): mono stack until the face is confirmed. */
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Measured motion. The fill sweep is the destination-state width transition
 * (the .sf-track-fill locked decision): ~2.4s gradual ease so each fill
 * completes just before the next click pops the next node — sweep-then-pop,
 * never simultaneous. The hidden state's transition:none makes backward nav
 * snap — zero JS. Scoped selectors (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease } — no source-order
 * reliance.
 */
.sf-tl-seg {
  width: var(--seg-w);
  transition: width 2400ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sf-tl-seg.slidev-vclick-hidden {
  width: 0;
  transition: none;
}

/* Node pop: measured 100–150ms. */
.disc {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 140ms cubic-bezier(0, 0, 0.2, 1), opacity 120ms ease-out;
}

.glow {
  transition: opacity 150ms ease-out;
}

/* Tick + label rows fade in just after their node pops. */
.sf-tl-tick,
.sf-tl-label,
.sf-tl-sublabel {
  transition: opacity 250ms ease-out;
  transition-delay: 120ms;
}

.sf-tl-node.slidev-vclick-hidden .disc {
  transform: scale(0.6);
  transition: none;
}

.sf-tl-node.slidev-vclick-hidden .glow,
.sf-tl-node.slidev-vclick-hidden .sf-tl-tick,
.sf-tl-node.slidev-vclick-hidden .sf-tl-label,
.sf-tl-node.slidev-vclick-hidden .sf-tl-sublabel {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-tl-seg,
  .sf-tl-node,
  .disc,
  .glow,
  .sf-tl-tick,
  .sf-tl-label,
  .sf-tl-sublabel {
    transition: none;
  }
}
</style>
