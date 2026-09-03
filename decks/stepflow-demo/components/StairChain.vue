<script setup lang="ts">
import { computed } from 'vue'
import { stairLayout, type StairCallout, type StairStep } from './stepflow/stair'
import { chainBlue, resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'

const props = withDefaults(defineProps<{
  /** One entry per block; content travels with the slide. */
  steps: StairStep[]
  /** Amber callout floating above-left; reveals on click 1, before the first block. */
  callout?: StairCallout
  /** Partial palette merged over the family's `chainBlue` preset. */
  palette?: StepFlowPaletteOverride
  /** Mono header line, e.g. 'THE DATA ENGINEERING'. */
  title?: string
  /** Optional title tail rendered in chrome green (title chrome convention). */
  titleAccent?: string
}>(), { palette: () => ({}) })

// chainBlue is StairChain's family preset (art_3VsrSvLm): cool blue blocks with
// the locked amber as accentAlt for the callout. resolvePalette merges the
// default `cyanOnBlack` underneath, so an override can re-tint any field.
const p = computed(() => resolvePalette({ ...chainBlue, ...props.palette }))

// Per-step lift overrides ride on the step data (StairStep.lift); everything
// else is the measured uniform ascent.
const layout = computed(() =>
  stairLayout(props.steps.length, { lifts: props.steps.map((s) => s.lift) }),
)

// Click choreography: callout = click 1, block k = click k + 1. Without a
// callout the blocks shift down to clicks 1…n so the sequence stays contiguous.
const blockClick = (i: number): number => i + 1 + (props.callout ? 1 : 0)

// Typography as fractions of the viewBox height. In-block labels ≈22px and
// captions ≈19–23px glyphs at source height 1144 (art_0AzKGXnD §2/F1); the
// header reuses StepFlow's measured 34px-at-848 formula for family consistency.
const type = computed(() => {
  const height = layout.value.viewBox.height
  return {
    headerSize: 34 * (height / 848),
    labelSize: 0.026 * height,
    captionSize: 0.022 * height,
    calloutSize: 0.055 * height,
    captionGap: 0.028 * height,
    blockRadius: 0.01 * height,
  }
})

function captionBaseline(blockY: number, blockH: number): number {
  return blockY + blockH + type.value.captionGap
}

// Chrome constants: white in-block labels and header, chrome-green title tail
// (titleAccent convention — a constant, never a palette field).
const LABEL_FILL = '#ffffff'
const HEADER_FILL = '#ffffff'
const CHROME_GREEN = '#66fb00'
</script>

<template>
  <svg
    class="stairchain"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${steps.length}-step staircase diagram`"
  >
    <!-- One sibling group per block: block + in-block label + caption rise
         together on the block's click (no draw-on — blocks fade/scale). -->
    <g
      v-for="(step, i) in steps"
      :key="step.id"
      v-click="blockClick(i)"
      class="sf-step"
    >
      <rect
        class="sf-block"
        :x="layout.blocks[i].x"
        :y="layout.blocks[i].y"
        :width="layout.blocks[i].w"
        :height="layout.blocks[i].h"
        :rx="type.blockRadius"
        :fill="p.accent"
      />
      <text
        class="sf-label"
        :x="layout.blocks[i].x + layout.blocks[i].w / 2"
        :y="layout.blocks[i].y + layout.blocks[i].h / 2"
        text-anchor="middle"
        dominant-baseline="central"
        :font-size="type.labelSize"
        :fill="LABEL_FILL"
        letter-spacing="0.06em"
      >{{ step.title }}</text>
      <text
        class="sf-caption"
        :x="layout.blocks[i].x + layout.blocks[i].w / 2"
        :y="captionBaseline(layout.blocks[i].y, layout.blocks[i].h)"
        text-anchor="middle"
        :font-size="type.captionSize"
        :fill="p.accent"
        letter-spacing="0.04em"
      >{{ step.caption }}</text>
    </g>

    <!-- Amber callout, first click of the sequence (measured before block 1). -->
    <text
      v-if="callout"
      v-click="1"
      class="sf-callout"
      :x="callout.xFrac * layout.viewBox.width"
      :y="callout.yFrac * layout.viewBox.height"
      :font-size="type.calloutSize"
      :fill="p.accentAlt"
    >{{ callout.text }}</text>

    <!-- Two-tone header chrome: white title, chrome-green accent tail. -->
    <text
      v-if="title"
      class="header"
      :x="layout.viewBox.width * 0.033"
      :y="layout.viewBox.height * 0.075"
      :font-size="type.headerSize"
      :fill="HEADER_FILL"
      letter-spacing="0.06em"
    ><tspan>{{ title }}</tspan><tspan
      v-if="titleAccent"
      dx="0.35em"
      :fill="CHROME_GREEN"
    >{{ titleAccent }}</tspan></text>
  </svg>
</template>

<style scoped>
.stairchain {
  display: block;
  width: 100%;
  height: auto;
}

.stairchain text {
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Measured motion (art_0AzKGXnD §2/F1: blocks rise to full in ~130–200ms,
 * scale/fade, no draw-on). Transition is taken from the destination state:
 * forward reveal runs the rise, the hidden state's transition:none makes
 * backward nav instant — the locked decision, zero JS. Scoped selectors
 * (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease } — no source-order reliance.
 */
.sf-step {
  transition:
    opacity 180ms ease-out,
    transform 180ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-step.slidev-vclick-hidden {
  transform: translateY(12px) scale(0.85);
  transition: none;
}

.sf-callout {
  transition: opacity 150ms ease-out;
}

.sf-callout.slidev-vclick-hidden {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-step,
  .sf-callout {
    transition: none;
  }
}
</style>
