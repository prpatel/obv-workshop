<script setup lang="ts">
import { computed, useId } from 'vue'
import { serpentineLayout, type NodeLayout, type SerpentineOptions } from './stepflow/geometry'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'
import type { StepFlowStep } from './stepflow/steps'

const props = withDefaults(defineProps<{
  /** One entry per node; content travels with the slide. */
  steps: StepFlowStep[]
  /** Partial palette merged over the measured `cyanOnBlack` preset. */
  palette?: StepFlowPaletteOverride
  /** Optional geometry overrides; defaults are the measured fractions. */
  geometry?: SerpentineOptions
  /** Mono header line, e.g. 'SHIP FASTER'. */
  title?: string
}>(), { palette: () => ({}) })

const p = computed(() => resolvePalette(props.palette))
const layout = computed(() => serpentineLayout(props.steps.length, props.geometry))

// Glow halo: radial gradient at palette luminance, outer radius scaled by spread.
const glowId = useId()
const glowOuterR = computed(() => layout.value.discR + p.value.glow.spread)
const glowEdgeFrac = computed(() => layout.value.discR / glowOuterR.value)

// Typography measured at source height 848px (visual-spec §6: 34px title, 28px
// subtext, gaps 28/19px, cap ≈ 24.5px) — rescaled to the layout height so custom
// viewBox sizes stay proportional.
const type = computed(() => {
  const k = layout.value.viewBox.height / 848
  return {
    titleSize: 34 * k,
    subtextSize: 28 * k,
    titleBaselineGap: 28 * k + 24.5 * k,
    subtextBaselineGap: (19 + 20) * k,
  }
})

function titleBaseline(node: NodeLayout): number {
  return node.cy + layout.value.discR + type.value.titleBaselineGap
}

function subtextBaseline(node: NodeLayout): number {
  return titleBaseline(node) + type.value.subtextBaselineGap
}

// Icons render in a 24-unit Lucide space (§7: box ≈ 0.4 × disc diameter).
const ICON_BOX = 24
function iconTransform(node: NodeLayout): string {
  const size = 0.8 * layout.value.discR
  const s = size / ICON_BOX
  return `translate(${fmt(node.cx - size / 2)} ${fmt(node.cy - size / 2)}) scale(${fmt(s)})`
}

function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}

function px(n: number): string {
  return `${fmt(n)}px`
}

// Unknown key renders the visible fallback (never undefined into v-html) and
// names the bad key in dev so the author fixes the string.
function resolveIcon(key: string): string {
  const path = iconPath(key)
  if (!path && import.meta.env?.DEV) {
    console.warn(`[StepFlow] unknown icon key "${key}" — rendering the fallback icon`)
  }
  return path ?? ICON_FALLBACK
}

// Header chrome is white on every measured family preset (visual-spec §13).
const HEADER_FILL = '#ffffff'
</script>

<template>
  <svg
    class="stepflow"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${steps.length}-step flow diagram`"
    :style="{ '--sf-len': px(layout.track.totalLength) }"
  >
    <defs>
      <radialGradient :id="glowId">
        <stop offset="0" :stop-color="p.accent" :stop-opacity="p.glow.peak" />
        <stop :offset="glowEdgeFrac" :stop-color="p.accent" :stop-opacity="p.glow.peak" />
        <stop offset="1" :stop-color="p.accent" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- Dim base track: the full serpentine, always visible. -->
    <path
      class="sf-track-base"
      :d="layout.track.d"
      fill="none"
      :stroke="p.track"
      :stroke-width="layout.trackWidth"
      stroke-linecap="round"
    />

    <!--
      Reveal binding (spike art_7Q2OtXCm, verified in-browser): N stacked accent
      copies of the one track path; copy i carries v-click="i" and is pre-set via
      --sf-drawn to draw exactly up to node i. Slidev toggles each element's OWN
      slidev-vclick-hidden class — hidden = fully retracted + transition:none
      (backward nav snaps), revealed = 300ms ease-out draw.
    -->
    <template v-for="i in steps.length" :key="`fill-${i}`">
      <path
        v-click="i"
        class="sf-track-fill"
        :d="layout.track.d"
        fill="none"
        :stroke="p.accent"
        :stroke-width="layout.trackWidth"
        stroke-linecap="round"
        :style="{ '--sf-drawn': px(layout.track.nodeDistances[i - 1]) }"
      />
    </template>

    <!-- One sibling group per step (never nested v-clicks): node + its segment
         arrive together on click i + 1. -->
    <g
      v-for="(step, i) in steps"
      :key="step.id"
      v-click="i + 1"
      class="sf-node"
    >
      <circle class="glow" :cx="layout.nodes[i].cx" :cy="layout.nodes[i].cy" :r="glowOuterR" :fill="`url(#${glowId})`" />
      <circle class="disc" :cx="layout.nodes[i].cx" :cy="layout.nodes[i].cy" :r="layout.discR" :fill="p.accent" />
      <g
        class="icon"
        :transform="iconTransform(layout.nodes[i])"
        fill="none"
        :stroke="p.iconStroke"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        v-html="resolveIcon(step.icon)"
      />
      <text
        class="title"
        :x="layout.nodes[i].cx"
        :y="titleBaseline(layout.nodes[i])"
        text-anchor="middle"
        :font-size="type.titleSize"
        :fill="p.accent"
        letter-spacing="0.06em"
      >{{ step.title }}</text>
      <text
        class="subtext"
        :x="layout.nodes[i].cx"
        :y="subtextBaseline(layout.nodes[i])"
        text-anchor="middle"
        :font-size="type.subtextSize"
        :fill="p.subtext"
      >{{ step.subtext }}</text>
    </g>

    <text
      v-if="title"
      class="header"
      :x="layout.viewBox.width * 0.033"
      :y="layout.viewBox.height * 0.075"
      :font-size="type.titleSize"
      :fill="HEADER_FILL"
      letter-spacing="0.06em"
    >{{ title }}</text>
  </svg>
</template>

<style scoped>
.stepflow {
  display: block;
  width: 100%;
  height: auto;
}

.stepflow text {
  /* Open question #1 (font family): mono stack until the face is confirmed. */
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Measured motion (visual-spec §9, spike §2). Transition is taken from the
 * destination state: forward reveal runs the draw/fade, the hidden state's
 * transition:none makes backward nav instant — the locked decision, zero JS.
 * Scoped selectors (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease } — no source-order reliance.
 */
.sf-track-fill {
  stroke-dasharray: var(--sf-len);
  stroke-dashoffset: var(--sf-drawn);
  transition:
    stroke-dashoffset 300ms cubic-bezier(0, 0, 0.2, 1),
    opacity 120ms ease-out;
}

.sf-track-fill.slidev-vclick-hidden {
  stroke-dashoffset: var(--sf-len);
  transition: none;
}

.sf-node {
  transition: opacity 150ms ease-out;
}

.sf-node.slidev-vclick-hidden {
  transition: none;
}

.disc {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 120ms cubic-bezier(0, 0, 0.2, 1), opacity 150ms ease-out;
}

.glow {
  transition: opacity 150ms ease-out;
}

.sf-node.slidev-vclick-hidden .disc {
  transform: scale(0.6);
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-track-fill,
  .sf-node,
  .disc,
  .glow {
    transition: none;
  }
}
</style>
