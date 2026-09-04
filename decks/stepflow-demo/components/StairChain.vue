<script setup lang="ts">
import { computed } from 'vue'
import { stairDips, stairLayout, type StairCallout, type StairStep } from './stepflow/stair'
import { chainBlue, resolvePalette, type StepFlowPalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import TitleChrome from './stepflow/TitleChrome.vue'

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

// Rhythm, punch geometry, and wedge bands all come from the measured layout
// module (exact-trace sheet art_4A7yguGJ) — the seed carries content, not
// geometry.
const layout = computed(() => stairLayout(props.steps.length))
const dipByIndex = computed(() => new Map(stairDips(layout.value.blocks).map((d) => [d.index, d.dipPx])))

// Click choreography: callout = click 1, block k = click k + 1. Without a
// callout the blocks shift down to clicks 1…n so the sequence stays contiguous.
const blockClick = (i: number): number => i + 1 + (props.callout ? 1 : 0)

// Typography as fractions of the viewBox height, from the settled-frame
// traces: captions are a 19–20px cap band (→ font 24.84) running a condensed
// ~10.5px advance per character; the punched numbers take the per-block
// measured caps through the mono's 0.752 cap ratio; the '3×' callout cap is
// 45.3px (→ font 60.2).
const type = computed(() => {
  const height = layout.value.viewBox.height
  return {
    punchCapRatio: 0.752, // JetBrains Mono cap-height ratio (title chrome convention)
    captionSize: 0.023 * height,
    captionAdvance: 10.5, // px per character at 1920 — the recording's condensed mono
    captionGap: 0.037 * height, // caption baseline sits 40px below the block's bottom edge
    captionDX: -2, // caption ink starts ~2px left of the block's left edge
    calloutSize: 0.0557 * height,
  }
})

function captionBaseline(blockY: number, blockH: number): number {
  return blockY + blockH + type.value.captionGap
}

// Family color constants measured off the settled frame (sheet §1 medians):
// the punched numbers are near-black knockouts; captions are dim blue under
// the blue blocks and light cyan under the cyan ones; the wedge is the soft
// slate mass right of blocks 1–5. Ambient tones are family constants, not
// palette roles.
const PUNCH_BLUE = '#041628'
const PUNCH_CYAN = '#011e23'
const CAPTION_BLUE = '#356eae'
const CAPTION_CYAN = '#37c2d4'
const WEDGE_SLATE = '#353743'

/** Fill for one block: the tone role maps through the resolved palette. */
function blockFill(step: StairStep, palette: StepFlowPalette): string {
  return step.tone === 'tertiary' ? (palette.accentTertiary ?? palette.accent) : palette.accent
}

/** Punched-number and caption inks follow the block's tone role. */
function punchFill(step: StairStep): string {
  return step.tone === 'tertiary' ? PUNCH_CYAN : PUNCH_BLUE
}

function captionFill(step: StairStep): string {
  return step.tone === 'tertiary' ? CAPTION_CYAN : CAPTION_BLUE
}
</script>

<template>
  <svg
    class="stairchain"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${steps.length}-step staircase diagram`"
  >
    <!-- Soft slate wedges: the settled frame feathers them over ~20–30px,
         so the bands render through a Gaussian blur. -->
    <defs>
      <filter id="sf-stair-wedge-blur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="10" />
      </filter>
    </defs>

    <!-- One sibling group per block: wedge + circle + punched number +
         caption rise together on the block's click (no draw-on — blocks
         fade/scale). Dip blocks (sitting below their left neighbor) play
         the down-then-up keyframe with the dip distance as a custom
         property. -->
    <g
      v-for="(step, i) in steps"
      :key="step.id"
      v-click="blockClick(i)"
      :class="['sf-step', dipByIndex.has(i) ? 'sf-dip' : '']"
      :style="dipByIndex.has(i) ? { '--sf-dip': `${dipByIndex.get(i) ?? 0}px` } : undefined"
    >
      <!-- Slate wedge right of the block (blocks 1–5 in the settled frame;
           block 6 shows none — the band would overflow the canvas edge). -->
      <rect
        v-if="layout.blocks[i].wedge"
        class="sf-wedge"
        :x="layout.blocks[i].wedge?.x"
        :y="layout.blocks[i].wedge?.y"
        :width="layout.blocks[i].wedge?.w"
        :height="layout.blocks[i].wedge?.h"
        rx="18"
        :fill="WEDGE_SLATE"
        opacity="0.6"
        filter="url(#sf-stair-wedge-blur)"
      />
      <!-- Blocks are circles (⌀ ≈ 146): rx = w/2, not rounded-square corners. -->
      <rect
        class="sf-block"
        :x="layout.blocks[i].x"
        :y="layout.blocks[i].y"
        :width="layout.blocks[i].w"
        :height="layout.blocks[i].h"
        :rx="layout.blocks[i].w / 2"
        :ry="layout.blocks[i].h / 2"
        :fill="blockFill(step, p)"
      />
      <!-- Punched step number: knocked out of the fill in near-black at the
           per-block measured cap, condensed to the measured ink width. -->
      <text
        class="sf-punch"
        :x="layout.blocks[i].x + layout.blocks[i].w / 2"
        :y="layout.blocks[i].punchBaseline"
        text-anchor="middle"
        :font-size="layout.blocks[i].punchCap / type.punchCapRatio"
        :textLength="layout.blocks[i].punchWidth"
        lengthAdjust="spacingAndGlyphs"
        :fill="punchFill(step)"
        font-weight="400"
      >{{ step.title }}</text>
      <!-- Two-tone caption: dim blue under blue blocks, light cyan under
           cyan; left-aligned a couple px left of the block's left edge,
           condensed to the measured ~10.5px/char advance. -->
      <text
        class="sf-caption"
        :x="layout.blocks[i].x + type.captionDX"
        :y="captionBaseline(layout.blocks[i].y, layout.blocks[i].h)"
        text-anchor="start"
        :font-size="type.captionSize"
        :textLength="step.caption.length * type.captionAdvance"
        lengthAdjust="spacingAndGlyphs"
        :fill="captionFill(step)"
      >{{ step.caption }}</text>
    </g>

    <!-- Amber callout, first click of the sequence (measured before block
         1: '3×' ink x51–136, baseline 568 — wider than the mono's natural
         advance, hence the pinned textLength). -->
    <text
      v-if="callout"
      v-click="1"
      class="sf-callout"
      :x="callout.xFrac * layout.viewBox.width"
      :y="callout.yFrac * layout.viewBox.height"
      :font-size="type.calloutSize"
      :fill="p.accentAlt"
      :textLength="callout.textLengthFrac ? callout.textLengthFrac * layout.viewBox.width : undefined"
      lengthAdjust="spacingAndGlyphs"
    >{{ callout.text }}</text>

    <!-- Shared title chrome: sheet-measured centered two-tone title
         (StairChain Title row: band y48–144 is glow-inclusive; the glyph core
         matches NodeEdge's — white y49–126, cap 77 ≈ 78, centered ≈x916). -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :cap-height="78"
      :cap-top="49"
      :center-x="916"
    />
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
 * Measured motion (sheet motion trace): the stagger runs 400–500ms strictly
 * in order 1→6, and block 3's dip is choreographed down-then-up — a keyed
 * animation with the dip distance as a custom property, not a transition
 * (zero JS; reduced-motion collapses both). Transition is taken from the
 * destination state: forward reveal runs the rise, the hidden state's
 * transition:none makes backward nav instant — the locked decision. Scoped
 * selectors (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease } — no source-order reliance.
 */
.sf-step {
  transition:
    opacity 450ms ease-out,
    transform 450ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-step.slidev-vclick-hidden {
  transform: translateY(12px) scale(0.85);
  transition: none;
}

/* Down-then-up dip for a block sitting below its left neighbor (block 3's
 * measured +41px): drop in to the dip line, then settle up to the final top. */
.sf-step.sf-dip:not(.slidev-vclick-hidden) {
  animation: sf-stair-dip 800ms cubic-bezier(0.45, 0, 0.55, 1);
}

@keyframes sf-stair-dip {
  0% {
    opacity: 0;
    transform: translateY(0) scale(0.85);
  }

  45% {
    opacity: 1;
    transform: translateY(var(--sf-dip, 0px)) scale(1);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.sf-callout {
  transition: opacity 250ms ease-out;
}

.sf-callout.slidev-vclick-hidden {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-step,
  .sf-callout {
    transition: none;
    animation: none;
  }
}
</style>
