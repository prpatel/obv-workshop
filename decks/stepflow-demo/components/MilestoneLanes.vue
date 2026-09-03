<script setup lang="ts">
import { computed } from 'vue'
import { milestoneLanesLayout, type Lane } from './stepflow/lanes'
import { resolvePalette, statusAmber, type StepFlowPaletteOverride } from './stepflow/palettes'

const props = withDefaults(defineProps<{
  /** Lanes top-to-bottom; bar offsets and sizes are data (canvas fractions). */
  lanes: Lane[]
  /** Bar top of the first lane, as a fraction of the canvas height. */
  y0Frac: number
  /** Vertical lane pitch, as a fraction of the canvas height. */
  lanePitchFrac: number
  /** Default bar height, as a fraction of the canvas height (per-bar `hFrac` overrides). */
  barHFrac: number
  /** Partial palette merged over the family's `statusAmber` preset (verbatim unless overridden). */
  palette?: StepFlowPaletteOverride
  /** Mono header line, e.g. 'DATA'. */
  title?: string
  /** Header tail rendered in chrome green after `title` (two-tone chrome convention). */
  titleAccent?: string
}>(), { palette: () => ({}) })

// statusAmber is MilestoneLanes' family preset, verbatim (wave-2 spec):
// amber accent bars, red accentAlt. resolvePalette merges the default
// `cyanOnBlack` underneath, so an override can re-tint any field.
const p = computed(() => resolvePalette({ ...statusAmber, ...props.palette }))

const layout = computed(() =>
  milestoneLanesLayout({
    lanes: props.lanes,
    y0Frac: props.y0Frac,
    lanePitchFrac: props.lanePitchFrac,
    barHFrac: props.barHFrac,
  }),
)

function barColor(tone: Lane['bars'][number]['tone']): string {
  return tone === 'accent' ? p.value.accent : (p.value.accentAlt ?? p.value.accent)
}

// Label rail: right-aligned left of the measured tick rail (x208/1280), with
// a 24px gap so the two never touch.
const labelX = computed(() => layout.value.ticks[0].x - 24)

// Typography on the StepFlow scale: 34px title at source height 848, rescaled
// so custom viewBox sizes stay proportional (StepFlow.vue pattern).
const type = computed(() => {
  const k = layout.value.viewBox.height / 848
  return { titleSize: 34 * k, labelSize: 15 }
})

// Chrome constants: white header and lane labels, chrome-green title tail
// (titleAccent convention — a constant, never a palette field).
const HEADER_FILL = '#ffffff'
const LABEL_FILL = '#ffffff'
const CHROME_GREEN = '#66fb00'
</script>

<template>
  <svg
    class="milestonelanes"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${lanes.length}-lane milestone chart`"
  >
    <!-- Lane labels: white mono, right-aligned left of the tick rail. Each
         label rides its lane's first bar click — nothing reveals alone. -->
    <template v-for="lane in layout.lanes" :key="`label-${lane.id}`">
      <text
        v-if="lane.label"
        v-click="lane.firstClick"
        class="sf-ml-label"
        :x="labelX"
        :y="lane.y + lane.bars[0].h / 2"
        text-anchor="end"
        dominant-baseline="central"
        :font-size="type.labelSize"
        :fill="LABEL_FILL"
        letter-spacing="0.08em"
      >{{ lane.label }}</text>
    </template>

    <!--
      Reveal binding: one click per bar (lanes then bars in data order), a
      single width reveal per bar — the recording's pop-then-re-proportion
      simplified to one width transition (accepted re-pace deviation, same
      class as StackPanels'). Slidev toggles each bar's OWN
      slidev-vclick-hidden class — hidden = collapsed to its left edge +
      transition:none (backward nav snaps), revealed = 300ms ease-out grow.
    -->
    <g v-for="lane in layout.lanes" :key="lane.id">
      <rect
        v-for="(bar, bi) in lane.bars"
        :key="`${lane.id}-${bi}`"
        v-click="bar.click"
        class="sf-ml-bar"
        :x="bar.x"
        :y="bar.y"
        :width="bar.w"
        :height="bar.h"
        rx="4"
        :fill="barColor(bar.tone)"
      />
    </g>

    <!-- Tick markers: amber ticks at the measured left-edge rail, spreading
         across lanes on the final click. -->
    <g v-click="layout.clickCount" class="sf-ml-ticks">
      <line
        v-for="(tick, i) in layout.ticks"
        :key="`tick-${i}`"
        :x1="tick.x"
        :x2="tick.x"
        :y1="tick.y - tick.h / 2"
        :y2="tick.y + tick.h / 2"
        :stroke="p.accent"
        :stroke-width="3"
        stroke-linecap="round"
      />
    </g>

    <text
      v-if="title"
      class="header"
      :x="layout.viewBox.width * 0.033"
      :y="layout.viewBox.height * 0.075"
      :font-size="type.titleSize"
      :fill="HEADER_FILL"
      letter-spacing="0.06em"
    >{{ title }}<tspan v-if="titleAccent" :fill="CHROME_GREEN">&nbsp;{{ titleAccent }}</tspan></text>
  </svg>
</template>

<style scoped>
.milestonelanes {
  display: block;
  width: 100%;
  height: auto;
}

.milestonelanes text {
  /* Open question #1 (font family): mono stack until the face is confirmed. */
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Measured motion (visual-spec §9 pattern). Transition is taken from the
 * destination state: forward reveal grows each bar from its left edge (the
 * single width reveal), the hidden state's transition:none makes backward
 * nav instant — the locked decision, zero JS. Scoped selectors (0,2,0 +
 * attribute) beat Slidev's built-in .slidev-vclick-target
 * { transition: all .1s ease } — no source-order reliance.
 */
.sf-ml-bar {
  transform-box: fill-box;
  transform-origin: left center;
  transition: transform 300ms cubic-bezier(0, 0, 0.2, 1), opacity 150ms ease-out;
}

.sf-ml-bar.slidev-vclick-hidden {
  transform: scaleX(0);
  transition: none;
}

.sf-ml-label {
  transition: opacity 150ms ease-out;
}

.sf-ml-label.slidev-vclick-hidden {
  transition: none;
}

.sf-ml-ticks {
  transition: opacity 150ms ease-out;
}

.sf-ml-ticks.slidev-vclick-hidden {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-ml-bar,
  .sf-ml-label,
  .sf-ml-ticks {
    transition: none;
  }
}
</style>
