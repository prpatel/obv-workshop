<script setup lang="ts">
import { computed } from 'vue'
import { stairLayout, type StairCallout, type StairStep } from './stepflow/stair'
import { chainBlue, resolvePalette, type StepFlowPalette, type StepFlowPaletteOverride } from './stepflow/palettes'

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

// Typography as fractions of the viewBox height. In-block labels are the
// recording's 28–40px glyph band at source height 1144 (wave-1 report
// art_v4jVdTnp §1 — the v1 blocks carry '01'–'06'-style step numbers); captions
// ≈19–23px glyphs; the header reuses StepFlow's measured 34px-at-848 formula
// for family consistency.
const type = computed(() => {
  const height = layout.value.viewBox.height
  return {
    headerSize: 34 * (height / 848),
    labelSize: 0.037 * height,
    captionSize: 0.022 * height,
    calloutSize: 0.055 * height,
    captionGap: 0.028 * height,
    blockRadius: 0.01 * height,
    // Ambient layer fractions (wave-1 report §1, frame t=7.9): the slate
    // shadow masses sit beside each blue block (ref example x236–405
    // y812–877 — one block-width right, ~40% of block height, a nudge
    // down); the dark-teal ambience feathers around each cyan block at
    // roughly the block's own footprint.
    shadowHeightFrac: 0.42, // × block height
    shadowOffsetXFrac: 0.01, // × width — just past the block's right edge
    shadowOffsetYFrac: 0.01, // × height
    ambienceRXFrac: 0.095, // × width
    ambienceRYFrac: 0.115, // × height
    ambienceDXFrac: 0.2, // × block width — toward the block's left edge (ref ambience x1709–1881 around block x1748–1906)
  }
})

function captionBaseline(blockY: number, blockH: number): number {
  return blockY + blockH + type.value.captionGap
}

// Chrome constants: white in-block labels and header, chrome-green title tail
// (titleAccent convention — a constant, never a palette field). The ambient
// classes are measured from the recording's settle frame (t=7.9): slate
// #363946 shadow masses beside the blue blocks, dark-teal ambience around the
// cyan ones (wave-1 report art_v4jVdTnp §1) — like the chrome green, ambient
// tones are family constants, not palette roles.
const LABEL_FILL = '#ffffff'
const HEADER_FILL = '#ffffff'
const CHROME_GREEN = '#66fb00'
const SHADOW_SLATE = '#363946'
const AMBIENCE_TEAL = '#1fd0ea'

/** Fill for one block: the tone role maps through the resolved palette. */
function blockFill(step: StairStep, palette: StepFlowPalette): string {
  return step.tone === 'tertiary' ? (palette.accentTertiary ?? palette.accent) : palette.accent
}
</script>

<template>
  <svg
    class="stairchain"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${steps.length}-step staircase diagram`"
  >
    <!-- Ambient layer, beneath the blocks and revealed with them: slate
         shadow masses beside the blue blocks, teal ambience feathers around
         the cyan ones (measured classes, wave-1 report §1). -->
    <defs>
      <radialGradient id="sf-stair-teal-ambience">
        <stop offset="0" :stop-color="AMBIENCE_TEAL" stop-opacity="0.5" />
        <stop offset="0.45" :stop-color="AMBIENCE_TEAL" stop-opacity="0.32" />
        <stop offset="1" :stop-color="AMBIENCE_TEAL" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- One sibling group per block: ambient shapes + block + in-block label
         + caption rise together on the block's click (no draw-on — blocks
         fade/scale). -->
    <g
      v-for="(step, i) in steps"
      :key="step.id"
      v-click="blockClick(i)"
      class="sf-step"
    >
      <ellipse
        v-if="step.tone === 'tertiary'"
        class="sf-ambience"
        :cx="layout.blocks[i].x + layout.blocks[i].w / 2 - layout.blocks[i].w * type.ambienceDXFrac"
        :cy="layout.blocks[i].y + layout.blocks[i].h / 2"
        :rx="type.ambienceRXFrac * layout.viewBox.width"
        :ry="type.ambienceRYFrac * layout.viewBox.height"
        fill="url(#sf-stair-teal-ambience)"
      />
      <rect
        v-else
        class="sf-shadow"
        :x="layout.blocks[i].x + layout.blocks[i].w + type.shadowOffsetXFrac * layout.viewBox.width"
        :y="layout.blocks[i].y + type.shadowOffsetYFrac * layout.viewBox.height"
        :width="layout.blocks[i].w"
        :height="type.shadowHeightFrac * layout.blocks[i].h"
        :rx="type.blockRadius"
        :fill="SHADOW_SLATE"
        opacity="0.8"
      />
      <rect
        class="sf-block"
        :x="layout.blocks[i].x"
        :y="layout.blocks[i].y"
        :width="layout.blocks[i].w"
        :height="layout.blocks[i].h"
        :rx="type.blockRadius"
        :fill="blockFill(step, p)"
      />
      <text
        class="sf-label"
        :x="layout.blocks[i].x + layout.blocks[i].w / 2"
        :y="layout.blocks[i].y + layout.blocks[i].h / 2"
        text-anchor="middle"
        dominant-baseline="central"
        :font-size="type.labelSize"
        :fill="LABEL_FILL"
        font-weight="700"
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
 * Measured motion (wave-1 report art_v4jVdTnp §1 60fps walk: block 1 reaches
 * 37% of final mass one frame after onset and settles ≈66ms — a pop, not a
 * rise). 80ms ease-out keeps the pop within a frame or two. Transition is
 * taken from the destination state: forward reveal runs the rise, the hidden
 * state's transition:none makes backward nav instant — the locked decision,
 * zero JS. Scoped selectors (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease } — no source-order reliance.
 */
.sf-step {
  transition:
    opacity 80ms ease-out,
    transform 80ms cubic-bezier(0, 0, 0.2, 1);
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
