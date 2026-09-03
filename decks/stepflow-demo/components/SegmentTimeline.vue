<script setup lang="ts">
import { computed } from 'vue'
import {
  CHIP_LABEL_SIZE,
  CHIP_RADIUS,
  CHIP_STROKE,
  SEG_LABEL_SIZE,
  TICK_LABEL_SIZE,
  TICK_STROKE,
  segmentTimelineLayout,
  type TimelineSegment,
  type TimelineTick,
} from './stepflow/timeline'
import { chainBlue, orangeSpine, resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'

const props = withDefaults(defineProps<{
  /** Contiguous bar segments, left → right; sweeps ride one native v-click each. */
  segments: TimelineSegment[]
  /** Tick markers below the bar; they fade in with the labels layer. */
  ticks?: TimelineTick[]
  /** Right-side label chip text (legend tag); omit for no chip. */
  chip?: string
  /** Bar geometry as canvas fractions; defaults are the measured composition. */
  yFrac?: number
  hFrac?: number
  x0Frac?: number
  x1Frac?: number
  /** Partial palette merged over the family's chainBlue + orangeSpine composition. */
  palette?: StepFlowPaletteOverride
  /** Mono header line, e.g. 'MIGRATION'. */
  title?: string
  /** Header tail rendered in chrome green after `title` (two-tone chrome convention). */
  titleAccent?: string
}>(), {
  ticks: () => [],
  // Measured source composition (research art_2kSBGNmJ §3.1): bar x208–972,
  // y297–365 of the 1280×720 frame.
  yFrac: 0.4125,
  hFrac: 0.09444444444444444,
  x0Frac: 0.1625,
  x1Frac: 0.759375,
})

// The family preset composes the two measured presets as-is — chainBlue's
// cool blue for `accent` segments, orangeSpine's orange for `alt`. No new
// preset (wave-2 palette neutrality); an override can still re-tint any field.
const p = computed(() => resolvePalette({ ...chainBlue, accentAlt: orangeSpine.accent, ...props.palette }))

const layout = computed(() => segmentTimelineLayout({
  segments: props.segments,
  ticks: props.ticks,
  chip: props.chip,
  yFrac: props.yFrac,
  hFrac: props.hFrac,
  x0Frac: props.x0Frac,
  x1Frac: props.x1Frac,
}))

// Segment tones map to palette roles; `alt` falls back to accent when a
// custom palette omits accentAlt (NodeEdge tone system).
function toneColor(tone: TimelineSegment['tone']): string {
  return tone === 'accent' ? p.value.accent : (p.value.accentAlt ?? p.value.accent)
}

// The labels layer (segment labels, ticks, tick labels, chip) is one reveal —
// the recording fades all lettering in together after both sweeps. It only
// mounts when it has content, so an unlabeled timeline consumes no click.
const hasLabels = computed(() =>
  props.chip !== undefined
  || props.ticks.length > 0
  || props.segments.some((segment) => segment.label !== undefined),
)
const labelsClick = computed(() => props.segments.length + 1)

// Chrome constants: white in-segment labels and header, chrome-white tick
// lines, chrome-green title tail (titleAccent convention — a constant, never
// a palette field). Tick labels are the family's dim caption color.
const LABEL_FILL = '#ffffff'
const TICK_COLOR = '#f5f4f7'
const CHROME_GREEN = '#66fb00'

// Typography on the StepFlow scale: 34px title at source height 848, rescaled
// so custom viewBox sizes stay proportional (NodeEdge.vue pattern).
const type = computed(() => {
  const k = layout.value.viewBox.height / 848
  return { titleSize: 34 * k }
})

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
    <!--
      Reveal binding (the .sf-track-fill pattern applied to a rect): one sweep
      rect per segment, carrying v-click i + 1. Slidev toggles each rect's OWN
      slidev-vclick-hidden class — hidden = width 0 + transition:none (backward
      nav snaps), revealed = 300ms ease-out left→right width sweep. No
      path-length math: the sweep is a revealed-state width transition.
    -->
    <rect
      v-for="(seg, i) in layout.segments"
      :key="seg.id"
      v-click="i + 1"
      class="sf-tl-seg"
      :x="seg.x"
      :y="layout.bar.y"
      :width="seg.width"
      :height="layout.bar.height"
      :fill="toneColor(seg.tone)"
      :style="{ '--seg-w': px(seg.width) }"
    />

    <!-- Labels layer: segment labels, tick lines, tick labels, and the chip
         fade in together on the final click (source: labels/ticks @+8.6s). -->
    <g
      v-if="hasLabels"
      v-click="labelsClick"
      class="sf-tl-labels"
    >
      <text
        v-for="seg in layout.segments.filter((s) => s.label !== undefined)"
        :key="`label-${seg.id}`"
        class="sf-tl-seg-label"
        :x="seg.labelCx"
        :y="seg.labelCy"
        text-anchor="middle"
        dominant-baseline="central"
        :font-size="SEG_LABEL_SIZE"
        :fill="LABEL_FILL"
        letter-spacing="0.08em"
      >{{ seg.label }}</text>

      <line
        v-for="(tick, i) in layout.ticks"
        :key="`tick-${i}`"
        class="sf-tl-tick"
        :x1="tick.x"
        :x2="tick.x"
        :y1="tick.y0"
        :y2="tick.y0 + tick.len"
        :stroke="TICK_COLOR"
        :stroke-width="TICK_STROKE"
      />
      <text
        v-for="(tick, i) in layout.ticks"
        :key="`tick-label-${i}`"
        class="sf-tl-tick-label"
        :x="tick.labelX"
        :y="tick.labelBaseline"
        text-anchor="middle"
        :font-size="TICK_LABEL_SIZE"
        :fill="p.subtext"
        letter-spacing="0.08em"
      >{{ tick.label }}</text>

      <g v-if="layout.chip" class="sf-tl-chip">
        <rect
          :x="layout.chip.x"
          :y="layout.chip.y"
          :width="layout.chip.width"
          :height="layout.chip.height"
          :rx="CHIP_RADIUS"
          fill="none"
          :stroke="p.accent"
          :stroke-width="CHIP_STROKE"
        />
        <text
          :x="layout.chip.x + layout.chip.width / 2"
          :y="layout.chip.y + layout.chip.height / 2"
          text-anchor="middle"
          dominant-baseline="central"
          :font-size="CHIP_LABEL_SIZE"
          :fill="p.accent"
          letter-spacing="0.06em"
        >{{ layout.chip.text }}</text>
      </g>
    </g>

    <text
      v-if="title"
      class="header"
      :x="layout.viewBox.width * 0.033"
      :y="layout.viewBox.height * 0.075"
      :font-size="type.titleSize"
      fill="#ffffff"
      letter-spacing="0.06em"
    >{{ title }}<tspan v-if="titleAccent" :fill="CHROME_GREEN">&nbsp;{{ titleAccent }}</tspan></text>
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
 * Measured motion (the .sf-track-fill locked decision, applied to a rect).
 * Transition is taken from the destination state: forward reveal runs the
 * width sweep, the hidden state's transition:none makes backward nav instant
 * — zero JS. Scoped selectors (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease } — no source-order reliance.
 */
.sf-tl-seg {
  width: var(--seg-w);
  transition: width 300ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-tl-seg.slidev-vclick-hidden {
  width: 0;
  transition: none;
}

.sf-tl-labels {
  transition: opacity 150ms ease-out;
}

.sf-tl-labels.slidev-vclick-hidden {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-tl-seg,
  .sf-tl-labels {
    transition: none;
  }
}
</style>
