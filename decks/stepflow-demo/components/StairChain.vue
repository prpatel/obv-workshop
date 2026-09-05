<script setup lang="ts">
import { computed } from 'vue'
import {
  SEG01_CAPTIONS,
  SEG01_INK,
  SEG01_PLACEMENT,
  SEG01_WEDGES,
  stairDips,
  stairLayout,
  type StairPlacement,
  type StairStep,
} from './stepflow/stair'
import { chainBlue, resolvePalette, type StepFlowPalette, type StepFlowPaletteOverride } from './stepflow/palettes'

const props = withDefaults(defineProps<{
  /** One entry per block; content travels with the slide. */
  steps: StairStep[]
  /** Partial palette merged over the family's `chainBlue` preset. */
  palette?: StepFlowPaletteOverride
  /**
   * Explicit measured block placement (canvas fractions) passed through to
   * stairLayout. When omitted, the module's default gap/delta walk applies.
   */
  placement?: StairPlacement
}>(), { palette: () => ({}) })

// chainBlue is StairChain's family preset (art_3VsrSvLm): cool blue blocks with
// the amber accentAlt. resolvePalette merges the default `cyanOnBlack`
// underneath, so an override can re-tint any field.
const p = computed(() => resolvePalette({ ...chainBlue, ...props.palette }))

// Geometry comes from the measured layout module (settled_full.png connected
// components); the seed carries content, not geometry. The seg01 slide always
// pins the measured SEG01_PLACEMENT; an absent prop falls back to it so a
// missing placement can never silently mis-layout the demo.
const layout = computed(() => stairLayout(props.steps.length, props.placement ?? SEG01_PLACEMENT))
const dipByIndex = computed(() => new Map(stairDips(layout.value.blocks).map((d) => [d.index, d.dipPx])))

// Click choreography: the amber '01' marker is click 1, block k = click k + 1
// (the reference onsets: marker t≈0.2, blocks 0.533/0.8/1.067/2.067/2.733/3.133).
// A per-step `click` override wins; the marker keeps click 1.
const blockClick = (i: number): number => props.steps[i]?.click ?? i + 2

// Caption geometry from the settled-frame measures: centered under the block,
// baseline gapPx below the block's bottom edge, mono at the measured size,
// ink width pinned to the measured advance (spacing-only).
const caption = computed(() => ({
  size: SEG01_CAPTIONS.sizeFrac * layout.value.viewBox.height,
  gap: SEG01_CAPTIONS.gapPx,
  textLengths: SEG01_CAPTIONS.textLengthsPx,
}))

/** Fill for one block: the tone role maps through the resolved palette. */
function blockFill(step: StairStep, palette: StepFlowPalette): string {
  return step.tone === 'tertiary' ? (palette.accentTertiary ?? palette.accent) : palette.accent
}

/** Caption ink follows the block's tone role (measured core samples). */
function captionFill(step: StairStep): string {
  return step.tone === 'tertiary' ? SEG01_CAPTIONS.cyan : SEG01_CAPTIONS.blue
}

/** Slate wedge fill — a family constant measured off the settled frame. */
const WEDGE_SLATE = '#353743'
</script>

<template>
  <svg
    class="stairchain"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${steps.length}-step staircase diagram`"
  >
    <!-- The slate wedges feather over ~10px in the settled frame, so the
         bands render through a Gaussian blur. -->
    <defs>
      <filter id="sf-stair-wedge-blur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="8" />
      </filter>
    </defs>

    <!-- Traced title plate: the settled frame's own ink ("More like " white,
         "software engineering" green) as absolute-coordinate paths — static,
         no reveal beat. -->
    <path class="sf-title sf-title-white" :d="SEG01_INK.titleWhite.d" :fill="SEG01_INK.titleWhite.fill" />
    <path class="sf-title sf-title-green" :d="SEG01_INK.titleGreen.d" :fill="SEG01_INK.titleGreen.fill" />

    <!-- Traced top-right olive emblem — static plate ink. -->
    <path class="sf-badge" :d="SEG01_INK.badge.d" :fill="SEG01_INK.badge.fill" />

    <!-- Amber '01' marker, first click of the sequence (measured ink box
         x256–326, y484–522 — traced, not typeset). -->
    <g v-click="1" class="sf-marker">
      <path :d="SEG01_INK.amber01.d" :fill="SEG01_INK.amber01.fill" />
    </g>

    <!-- One sibling group per block: wedge + circle + traced icon + caption
         rise together on the block's click (no draw-on — blocks fade/scale).
         Dip blocks (sitting below their left neighbor) play the down-then-up
         keyframe with the dip distance as a custom property. -->
    <g
      v-for="(step, i) in steps"
      :key="step.id"
      v-click="blockClick(i)"
      :class="['sf-step', dipByIndex.has(i) ? 'sf-dip' : '', step.tone === 'tertiary' ? 'sf-tertiary' : '']"
      :style="[
        dipByIndex.has(i) ? { '--sf-dip': `${dipByIndex.get(i) ?? 0}px` } : undefined,
        step.tone === 'tertiary'
          ? {
              '--sf-flip-from': p.accent,
              '--sf-flip-to': p.accentTertiary ?? p.accent,
              '--sf-cap-from': SEG01_CAPTIONS.blue,
              '--sf-cap-to': SEG01_CAPTIONS.cyan,
            }
          : undefined,
      ]"
    >
      <!-- Slate wedge right of the block (blocks 1–5 in the settled frame;
           block 6 shows none). Absolute measured bands, revealed with the
           block. -->
      <rect
        v-if="SEG01_WEDGES[i]"
        class="sf-wedge"
        :x="SEG01_WEDGES[i]!.xFrac * layout.viewBox.width"
        :y="SEG01_WEDGES[i]!.yFrac * layout.viewBox.height"
        :width="SEG01_WEDGES[i]!.wFrac * layout.viewBox.width"
        :height="SEG01_WEDGES[i]!.hFrac * layout.viewBox.height"
        rx="18"
        :fill="WEDGE_SLATE"
        opacity="0.6"
        filter="url(#sf-stair-wedge-blur)"
      />
      <!-- Blocks are circles (⌀ ≈ 117): rx = ry = w/2. -->
      <rect
        class="sf-block"
        :x="layout.blocks[i]!.x"
        :y="layout.blocks[i]!.y"
        :width="layout.blocks[i]!.w"
        :height="layout.blocks[i]!.h"
        :rx="layout.blocks[i]!.w / 2"
        :ry="layout.blocks[i]!.h / 2"
        :fill="blockFill(step, p)"
      />
      <!-- Traced icon glyph punched into the fill (the frame's own ink). -->
      <path
        class="sf-icon"
        :d="SEG01_INK.icons[i]!.d"
        :fill="SEG01_INK.icons[i]!.fill"
      />
      <!-- Block-tinted caption: centered under the block, baseline at the
           measured gap below the bottom edge, mono at the measured size,
           ink pinned to the settled extent (spacing-only, glyphs never
           squeeze) — the shared pin threshold would drop these 2–4% pins,
           and the settled frame wants the measured extents exactly. -->
      <text
        class="sf-caption"
        :x="layout.blocks[i]!.x + layout.blocks[i]!.w / 2"
        :y="layout.blocks[i]!.y + layout.blocks[i]!.h + caption.gap"
        text-anchor="middle"
        :font-size="caption.size"
        :font-weight="500"
        :textLength="caption.textLengths[i]"
        lengthAdjust="spacing"
        :fill="captionFill(step)"
      >{{ step.caption }}</text>
    </g>
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
 * Measured motion: the reference frames pop each block fully-formed within
 * 1–2 frames (≤134ms at 15fps), so the rise runs 130ms — and block 3's dip is
 * choreographed down-then-up as a keyed animation with the dip distance as a
 * custom property, not a transition (zero JS; reduced-motion collapses both).
 * Transition is taken from the destination state: forward reveal runs the
 * rise, the hidden state's transition:none makes backward nav instant — the
 * locked decision. Scoped selectors (0,2,0 + attribute) beat Slidev's
 * built-in .slidev-vclick-target { transition: all .1s ease } — no
 * source-order reliance.
 */
.sf-step {
  transition:
    opacity 130ms ease-out,
    transform 130ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-step.slidev-vclick-hidden {
  transform: translateY(12px) scale(0.85);
  transition: none;
}

/* Down-then-up dip for a block sitting below its left neighbor (block 3's
 * measured +33px): drop in to the dip line, then settle up to the final top. */
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

.sf-marker {
  transition: opacity 250ms ease-out;
}

.sf-marker.slidev-vclick-hidden {
  transition: none;
}

/*
 * The cyan run lands blue first: frames f0031/f0033, f0041/f0042, f0047/f0048
 * show blocks 4–6 fully blue at their arrival beat and cyan one to two frames
 * later (~70–130ms). The fill flips from the palette accent to the tertiary
 * tone ~120ms after the block's reveal — a keyed animation, so the settled
 * state is untouched and backward nav never shows the from-color.
 */
.sf-tertiary:not(.slidev-vclick-hidden) .sf-block {
  animation: sf-cyan-flip 80ms ease-out 120ms both;
}

.sf-tertiary:not(.slidev-vclick-hidden) .sf-caption {
  animation: sf-caption-flip 80ms ease-out 120ms both;
}

@keyframes sf-cyan-flip {
  from {
    fill: var(--sf-flip-from, #3799fb);
  }

  to {
    fill: var(--sf-flip-to, #1fd0ea);
  }
}

@keyframes sf-caption-flip {
  from {
    fill: var(--sf-cap-from, #4999f2);
  }

  to {
    fill: var(--sf-cap-to, #3dcadc);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sf-step,
  .sf-marker {
    transition: none;
    animation: none;
  }

  .sf-tertiary .sf-block,
  .sf-tertiary .sf-caption {
    animation: none;
  }
}
</style>
