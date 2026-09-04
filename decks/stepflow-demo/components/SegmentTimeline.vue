<script setup lang="ts">
import { computed } from 'vue'
import {
  ARROW_WHITE,
  DIGIT_INK,
  LABEL_SIZE,
  LABEL_WHITE,
  LEGEND_SIZE,
  NODE_BLUE,
  NODE_CYAN,
  NODE_DIGIT_SIZE,
  NODE_RED,
  NOTE_SIZE,
  SUBLABEL_SIZE,
  SUB_GRAY,
  TICK_STROKE,
  TRACK_DIM,
  segmentTimelineLayout,
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
  /** White lead line of the two-tone title. */
  title?: string
  /** Header tail rendered in chrome green after `title` (two-tone chrome convention). */
  titleAccent?: string
  /** Title cap height override (measured 54 for this family's title band). */
  capHeight?: number
  /** Title band top override (measured 122 — the white caps' top). */
  capTop?: number
  /** Pins the title's measured ink extent (x563–1358 = 795px) via TitleChrome's
   * SVG textLength — the mono face runs ~15–18% wider than the recording's
   * condensed face at the same 78px cap. */
  titleTextLength?: number
}>(), {
  // Measured composition (art_lYM2KXza §SegmentTimeline, settled ref frame of
  // the 1920×1080 read): track x315–1460, y494–499.
  yFrac: 494 / 1080,
  hFrac: 6 / 1080,
  x0Frac: 315 / 1920,
  x1Frac: 1460 / 1920,
  capHeight: 54,
  capTop: 122,
})

// The family's measured trio — blue/cyan/red nodes and dim track — composed
// over chainBlue so unmeasured fields keep house values. No persistent glow:
// the settled ref frame shows crisp disc edges with no halo skirt.
const p = computed(() => resolvePalette({
  ...chainBlue,
  accent: NODE_BLUE,
  accentTertiary: NODE_CYAN,
  accentAlt: NODE_RED,
  track: TRACK_DIM,
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

// Chevron head polyline points for the white end arrow: apex at the shaft's
// right end, back corners `headDepth` left and `headHalf` above/below.
function arrowHeadPoints(): string {
  const arrow = layout.value.arrow
  const back = arrow.x1 - arrow.headDepth
  return `${back},${arrow.shaftY - arrow.headHalf} ${arrow.x1},${arrow.shaftY} ${back},${arrow.shaftY + arrow.headHalf}`
}

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
    <!-- Dim base track: always visible (the source shows the empty track axis
         before the first node pops). -->
    <rect
      class="sf-tl-track"
      :x="layout.track.x"
      :y="layout.track.y"
      :width="layout.track.width"
      :height="layout.track.height"
      :fill="p.track"
    />

    <!--
      Reveal binding (the .sf-track-fill pattern applied to a rect): one sweep
      rect per segment, carrying v-click i + 1. Slidev toggles each rect's OWN
      slidev-vclick-hidden class — hidden = width 0 + transition:none (backward
      nav snaps), revealed = a ~150ms ease-out sweep with a hard hold (measured
      ≈150ms per fill; the fill never drifts through the following beats).
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

    <!-- One sibling group per segment (never nested v-clicks): the solid node
         disc pops (~100ms scale/fade) with its dark step number, then its tick
         + row-1 label cascade in ~400ms after the pop, and the row-2 dim label
         ~1300ms after it (nodes 1–2 only in the measured composition). -->
    <g
      v-for="(seg, i) in layout.segments"
      :key="`node-${seg.id}`"
      v-click="i + 1"
      class="sf-tl-node"
    >
      <circle class="disc" :cx="seg.nodeCx" :cy="seg.nodeCy" :r="seg.nodeR" :fill="toneColor(seg.tone)" />
      <text
        class="sf-tl-digit"
        :x="seg.digitCx"
        :y="seg.digitBaseline"
        text-anchor="middle"
        :font-size="NODE_DIGIT_SIZE"
        :fill="DIGIT_INK"
      >{{ seg.digit }}</text>
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
      >{{ seg.label }}</text>
      <text
        v-if="seg.sublabel"
        class="sf-tl-sublabel"
        :x="seg.sublabelCx"
        :y="seg.sublabelBaseline"
        text-anchor="middle"
        :font-size="SUBLABEL_SIZE"
        :fill="SUB_GRAY"
        letter-spacing="0.06em"
      >{{ seg.sublabel }}</text>
    </g>

    <!-- White end arrow past the track's right end: 6px shaft on the track
         axis + open chevron head (always visible with the track). -->
    <g class="sf-tl-arrow" :stroke="ARROW_WHITE" fill="none">
      <line
        class="sf-tl-arrow-shaft"
        :x1="layout.arrow.x0"
        :x2="layout.arrow.x1"
        :y1="layout.arrow.shaftY"
        :y2="layout.arrow.shaftY"
        :stroke-width="layout.arrow.stroke"
      />
      <polyline
        class="sf-tl-arrow-head"
        :points="arrowHeadPoints()"
        :stroke-width="layout.arrow.stroke"
      />
    </g>

    <!-- Legend column centered on the last node's axis — fades in LAST, 1.5s
         after the final click over 1.6s (measured 8400–10000ms): three hue
         words, a 5px hue bar under each, then the dim note. Shares the final
         click with the last segment. -->
    <g
      v-click="layout.segments.length"
      class="sf-tl-legend"
    >
      <text
        v-for="word in layout.legend.words"
        :key="word.text"
        class="sf-tl-legend-word"
        :x="word.x"
        :y="layout.legend.wordsBaseline"
        :font-size="LEGEND_SIZE"
        :fill="word.color"
      >{{ word.text }}</text>
      <rect
        v-for="word in layout.legend.words"
        :key="`bar-${word.text}`"
        class="sf-tl-legend-bar"
        :x="word.x"
        :y="word.barY"
        :width="word.width"
        :height="word.barH"
        :fill="word.color"
      />
      <text
        class="sf-tl-legend-note"
        :x="layout.legend.noteCx"
        :y="layout.legend.noteBaseline"
        text-anchor="middle"
        :font-size="NOTE_SIZE"
        :fill="SUB_GRAY"
        letter-spacing="0.04em"
      >{{ layout.legend.note }}</text>
    </g>

    <!-- Shared title chrome: sheet-measured centered two-tone title
         (white caps ≈54px, baseline y176, measured ink extent x563–1358 →
         measured ink extent pinned via titleTextLength) plus the recording
         badge its sheet documents. -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :cap-height="capHeight"
      :cap-top="capTop"
      :title-text-length="titleTextLength"
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
 * Measured motion (art_lYM2KXza state machine): each click pops its node
 * (~100ms scale/fade), then its fill sweeps ~150ms ease-out with a hard hold;
 * the tick + row-1 label cascade ~400ms after the pop; the row-2 dim label
 * ~1300ms after the pop; the legend fades last, 1.5s after the final click
 * over 1.6s. The hidden states' transition:none makes backward nav snap —
 * zero JS. Scoped selectors (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease } — no source-order
 * reliance.
 */
.sf-tl-seg {
  width: var(--seg-w);
  transition: width 150ms cubic-bezier(0.22, 0.61, 0.36, 1) 100ms;
}

.sf-tl-seg.slidev-vclick-hidden {
  width: 0;
  transition: none;
}

/* Node pop: measured ~100ms scale/fade. */
.disc {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 100ms cubic-bezier(0, 0, 0.2, 1), opacity 100ms ease-out;
}

.sf-tl-digit {
  transition: opacity 100ms ease-out;
}

/* Tick + row-1 label cascade ~400ms after the pop. */
.sf-tl-tick,
.sf-tl-label {
  transition: opacity 250ms ease-out 400ms;
}

/* Row-2 dim label ≈900ms after the cascade → 1300ms after the pop. */
.sf-tl-sublabel {
  transition: opacity 250ms ease-out 1300ms;
}

/* Legend fades last: 1.5s after the final click, over 1.6s. */
.sf-tl-legend {
  transition: opacity 1600ms ease-in-out 1500ms;
}

.sf-tl-node.slidev-vclick-hidden .disc,
.sf-tl-node.slidev-vclick-hidden .sf-tl-digit {
  transition: none;
}

.sf-tl-node.slidev-vclick-hidden .disc {
  transform: scale(0.6);
}

.sf-tl-node.slidev-vclick-hidden .sf-tl-digit,
.sf-tl-node.slidev-vclick-hidden .sf-tl-tick,
.sf-tl-node.slidev-vclick-hidden .sf-tl-label,
.sf-tl-node.slidev-vclick-hidden .sf-tl-sublabel {
  opacity: 0;
  transition: none;
}

.sf-tl-legend.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-tl-seg,
  .sf-tl-node,
  .disc,
  .sf-tl-digit,
  .sf-tl-tick,
  .sf-tl-label,
  .sf-tl-sublabel,
  .sf-tl-legend {
    transition: none;
  }
}
</style>
