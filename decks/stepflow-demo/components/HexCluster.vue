<script setup lang="ts">
import { computed, inject, ref, watch, type InjectionKey, type Ref } from 'vue'
import type { ClicksContext } from '@slidev/client/constants'

/**
 * Mirrors `injectionClicksContext` from @slidev/client/constants — the same
 * branded string, restated locally. The runtime import is a build hazard:
 * the subpath resolves to constants.ts, which the production bundler cannot
 * load; the type comes in type-only (erased) and the string is the protocol.
 */
const injectionClicksContext = '$$slidev-clicks-context' as unknown as InjectionKey<Ref<ClicksContext>>
import TitleChrome from './stepflow/TitleChrome.vue'
import { hexClusterLayout, HEX_COLORS, type HexClusterOptions, type HexPlateData } from './stepflow/hex'

const props = withDefaults(defineProps<{
  /** One plate per entry; the measured composition holds exactly two. */
  plates: HexPlateData[]
  /** Optional geometry overrides; defaults are the measured fractions. */
  geometry?: HexClusterOptions
  /** White lead line, e.g. 'DATA'. */
  title?: string
  /** Header tail rendered in chrome-green (two-tone chrome convention). */
  titleAccent?: string
}>(), { plates: () => [] })

const layout = computed(() => hexClusterLayout(props.geometry))

// Live Slidev click state — the same context the v-click directive reads,
// provided per slide. Outside Slidev (tests, static renders) it's undefined
// and every element renders settled: geometry is complete, only animation hides.
const clicksCtx = inject(injectionClicksContext, undefined)
const clicks = computed(() => clicksCtx?.value.current ?? Number.POSITIVE_INFINITY)

// Backward navigation snaps instantly (locked decision): when the last click
// step went backward, the next state change suppresses all transitions.
const instant = ref(true)
watch(clicks, (next, prev) => {
  instant.value = next < prev
})

/**
 * Choreography (sheet §3 + this session's frame walk): the left plate, its
 * web, and the INGESTION label arrive together on click 1; the right plate,
 * web, NODE label, and the pre-build core on click 2; click 3 runs the dim —
 * every bright web stroke and the core settle to the ~6–10%-white contract
 * over ~600ms (the 5.9–6.6s transition). The plate rects and labels persist.
 */
const DIM_CLICK = 3

const dimmed = computed(() => clicks.value >= DIM_CLICK)

function plateClick(index: number): number {
  return Math.min(index + 1, DIM_CLICK)
}

// Tone-colored contract lookups — the measured constants in hex.ts.
function labelColor(tone: HexPlateData['tone']): string {
  return tone === 'cyan' ? HEX_COLORS.label.cyan : HEX_COLORS.label.blue
}

function webStroke(plateId: string, tone: HexPlateData['tone']): string {
  return dimmed.value
    ? plateId === 'left' ? HEX_COLORS.settledStroke.left : HEX_COLORS.settledStroke.right
    : tone === 'cyan' ? HEX_COLORS.brightStroke.left : HEX_COLORS.brightStroke.right
}

const coreFill = computed(() => (dimmed.value ? HEX_COLORS.plateFill : HEX_COLORS.brightStroke.right))

// The title chrome centers on the measured header axis (≈ x916 — Direction-2
// foundation note), independent of the plate composition.
const TITLE_AXIS_X = 916
const TITLE_CAP_HEIGHT = 78
const TITLE_CAP_TOP = 49
</script>

<template>
  <svg
    class="hexcluster"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${layout.plates.length}-plate hex mesh diagram`"
  >
    <!-- Shared title chrome: centered two-tone title on the measured axis —
         the sheet reads cap 78 in the band y49–127 (Direction-2 foundation). -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :cap-height="TITLE_CAP_HEIGHT"
      :cap-top="TITLE_CAP_TOP"
      :center-x="TITLE_AXIS_X"
    />

    <!-- The dim beat: an invisible third click anchor. The slide carries only
         two visible v-clicks (plate builds), but the sheet's trace runs the
         5.9–6.6s dim as its own beat — this zero-size rect consumes click 3
         so the ?clicks=3 deep link lands on the settled state. -->
    <rect
      v-click="3"
      class="sf-hx-dim-beat"
      aria-hidden="true"
      x="0"
      y="0"
      width="0"
      height="0"
      fill="none"
    />

    <!-- One group per cluster plate: dim-fill rect, faint web, in-panel label.
         Nothing overflows the plate bounds, and the right third stays empty. -->
    <g
      v-for="(plate, i) in layout.plates"
      :key="plate.id"
      v-click="plateClick(i)"
      class="sf-hx-plate"
      :class="{ 'sf-hx-instant': instant }"
    >
      <rect
        class="sf-hx-plate-rect"
        :x="plate.x"
        :y="plate.y"
        :width="plate.width"
        :height="plate.height"
        :rx="plate.rx"
        :fill="HEX_COLORS.plateFill"
        :stroke="plate.id === 'left' ? HEX_COLORS.plateStroke.left : HEX_COLORS.plateStroke.right"
        :stroke-width="layout.strokeWidth"
      />

      <!-- Web cells: bright mid-sequence tones settle to the dim contract on
           the final click (stroke transition, no dash mechanics). -->
      <path
        v-for="(cell, k) in plate.cells"
        :key="`${plate.id}-cell-${k}`"
        class="sf-hx-cell"
        :d="cell.path"
        fill="none"
        :stroke="webStroke(plate.id, plate.data.tone)"
        :stroke-width="layout.strokeWidth"
      />

      <!-- The pre-build core: one filled cell, bright until the dim. -->
      <path
        v-if="plate.id === 'right'"
        class="sf-hx-core"
        :d="layout.cells[layout.cells.length - 1].path"
        :fill="coreFill"
      />

      <text
        class="sf-hx-label"
        :x="plate.label.cx"
        :y="plate.label.baseline"
        text-anchor="middle"
        :font-size="plate.label.capHeight / 0.752"
        letter-spacing="0.045em"
        :fill="labelColor(plate.data.tone)"
      >{{ plate.data.label }}</text>
    </g>
  </svg>
</template>

<style scoped>
.hexcluster {
  display: block;
  width: 100%;
  height: auto;
}

.hexcluster text {
  /* Mono stack until the face is confirmed (deck convention). */
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Direction-2 systemic note: the mono face renders titles ~15–18% wider than
 * the recordings' condensed face at the same cap height; this sheet's Title
 * row measures the green tail at 726px of ink (x673–1398) where uncondensed
 * mono renders 944px. Negative tracking, family-local via :deep (scoped
 * selectors can't reach the child chrome; the shared TitleChrome stays
 * untouched for the parallel family PRs).
 */
.hexcluster :deep(.sf-chrome-title) {
  letter-spacing: -0.09em;
}

/*
 * The dim is the recording's 5.9–6.6s transition: web strokes and the core
 * settle over ~600ms when the final click lands. Hidden plates wait fully
 * transparent + transition:none (backward nav snaps — locked decision).
 */
.sf-hx-cell,
.sf-hx-core {
  transition:
    stroke 600ms cubic-bezier(0.4, 0, 0.2, 1),
    fill 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sf-hx-plate.sf-hx-instant .sf-hx-cell,
.sf-hx-plate.sf-hx-instant .sf-hx-core {
  transition: none;
}

.sf-hx-plate {
  transition: opacity 150ms ease-out;
}

.sf-hx-plate.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-hx-cell,
  .sf-hx-core,
  .sf-hx-plate {
    transition: none;
  }
}
</style>
