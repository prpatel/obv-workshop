<script setup lang="ts">
import { computed } from 'vue'
import {
  SPEC_PANEL_SEED,
  specPanelLayout,
  specRowBaseline,
  specRowFont,
  type SpecPanelSeed,
  type SpecRow,
} from './stepflow/specPanel'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import TitleChrome from './stepflow/TitleChrome.vue'
import { pinAttrs } from './stepflow/chrome'

const props = withDefaults(defineProps<{
  /** Two-tone title lead (white). */
  title?: string
  /** Title tail rendered in chrome green. */
  titleAccent?: string
  /** Copy for the fading rows; defaults to the measured seed. */
  seed?: Partial<SpecPanelSeed>
  /** Partial palette merged over the family's `cyanOnBlack` default. */
  palette?: StepFlowPaletteOverride
}>(), {
  title: 'Using it',
  titleAccent: 'properly',
  seed: () => ({}),
})

// The seg14 recording settles on the default palette tokens for text tones;
// the teal marks route through accentTertiary when the slide overrides it.
const p = computed(() => resolvePalette(props.palette ?? {}))

// Every box, beat, and delay comes from the measured layout module
// (settled-truth packet fl_KbQNQoum + OCR reads) — the seed carries content,
// not geometry.
const layout = specPanelLayout()

const seed = computed<SpecPanelSeed>(() => ({ ...SPEC_PANEL_SEED, ...props.seed }))

/** Row text split into pinned spans: one per measured word when the seed's
 * space-split matches the word spans, else the whole row as a single span
 * (custom seeds keep row-level pinning). */
function rowSpans(row: SpecRow): { text: string; x: number; w: number }[] {
  const text = rowText(row)
  const words = text.split(' ')
  if (row.words.length === words.length && row.words.length > 0) {
    return row.words.map((span, i) => ({ text: words[i], x: span.box.x, w: span.box.w }))
  }
  return [{ text, x: row.box.x, w: row.box.w }]
}

/** Row id → its seed copy. */
function rowText(row: SpecRow): string {
  const s = seed.value
  switch (row.id) {
    case 'status':
      return s.status
    case 'statusTeal':
      return s.statusTeal
    case 'heading':
      return s.heading
    case 'bodyLine':
      return s.bodyLine
    case 'redLine':
      return s.redLine
    case 'tealLine':
      return s.tealLine
    case 'lastLine':
      return s.lastLine
  }
}

/** Ink fill for a row's measured tone. */
function rowFill(row: SpecRow): string {
  if (row.tone === 'teal') return TEAL_CLUSTER
  return row.tone === 'dim' ? p.value.subtext : SPEC_WHITE
}

// Family color constants measured off the settled frame (packet colors.json
// + settled-frame pixel medians). Ambient tones are family constants, not
// palette roles — only the text tones route through the palette above.
const SPEC_WHITE = '#f5f4f7' // settled bright rows, rgb(245,244,247)
const PLATE_FILL = '#0f0e11' // settled plate rgb(15,14,17), luma ≈14 (V-3)
const RED_EDGE = '#ec413f' // red strip median rgb(236,65,63)
// The settled frame's teal cluster inks (status text rgb(42,187,144), zap
// glyph rgb(45,183,142), tile ring rgb(42,198,152)) are all a muted teal —
// distinct from the brighter slide-token teal the accent strip keeps.
const TEAL_CLUSTER = '#2abc91'
const DOT_RED = '#f15e59' // traffic dot rgb(241,94,89)
const DOT_AMBER = '#f9b82c' // traffic dot rgb(249,184,44)
const DOT_GREEN = '#2ac441' // traffic dot rgb(42,196,65)

/** Sub-beat transition delay as a scoped custom property. */
function delayStyle(delayMs: number) {
  return { '--sf-delay': `${delayMs}ms` }
}

const teal = computed(() => p.value.accentTertiary ?? p.value.accent)
</script>

<template>
  <svg
    class="specpanel"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    aria-label="Specification panel diagram"
  >
    <!-- The huge near-black plate, revealed in two waves (click 1: dim wash at
         the measured luma ≈3.8; click 2: full fill, luma ≈14, V-3). -->
    <rect
      v-click="1"
      class="sf-fade"
      :x="layout.plate.x"
      :y="layout.plate.y"
      :width="layout.plate.w"
      :height="layout.plate.h"
      :fill="PLATE_FILL"
      :opacity="layout.plateDimOpacity"
    />
    <rect
      v-click="2"
      class="sf-fade"
      :x="layout.plate.x"
      :y="layout.plate.y"
      :width="layout.plate.w"
      :height="layout.plate.h"
      :fill="PLATE_FILL"
    />

    <!-- Traffic dots (window chrome) lead the status row on click 2. -->
    <circle
      v-for="dot in layout.dots"
      :key="dot.id"
      v-click="dot.click"
      class="sf-fade"
      :cx="dot.cx"
      :cy="dot.cy"
      :r="dot.r"
      :fill="dot.id === 'red' ? DOT_RED : dot.id === 'amber' ? DOT_AMBER : DOT_GREEN"
    />

    <!-- One text element per measured word span (the recording's word gaps
         deviate from a uniform mono advance), each pinned spacing-only to its
         measured extent and faux-bolded to the row's measured stroke. -->
    <template v-for="row in layout.rows" :key="row.id">
      <text
        v-for="(span, si) in rowSpans(row)"
        :key="`${row.id}-${si}`"
        v-click="row.click"
        class="sf-fade"
        :x="span.x"
        :y="specRowBaseline(row)"
        text-anchor="start"
        :font-size="specRowFont(row)"
        :font-weight="row.weight"
        :fill="rowFill(row)"
        :stroke="rowFill(row)"
        :stroke-width="row.strokePx"
        :style="delayStyle(row.delayMs)"
        v-bind="pinAttrs(span.text, specRowFont(row), span.w)"
      >{{ span.text }}</text>
    </template>

    <!-- The teal cluster's `<zap>` mark: chevron + bolt + chevron, read off
         the settled frame at 2560. Rides the statusTeal beat. -->
    <g
      v-click="2"
      class="sf-fade"
      :style="delayStyle(66)"
      :fill="TEAL_CLUSTER"
      :stroke="TEAL_CLUSTER"
    >
      <path
        :d="`M ${layout.statusGlyph.x} ${layout.statusGlyph.y + layout.statusGlyph.h * 0.32}
             l ${-layout.statusGlyph.w * 0.28} ${layout.statusGlyph.h * 0.18}
             l ${layout.statusGlyph.w * 0.28} ${layout.statusGlyph.h * 0.18}`"
        fill="none"
        stroke-width="5"
      />
      <path
        :d="`M ${layout.statusGlyph.x + layout.statusGlyph.w * 0.78} ${layout.statusGlyph.y + layout.statusGlyph.h * 0.32}
             l ${layout.statusGlyph.w * 0.28} ${layout.statusGlyph.h * 0.18}
             l ${-layout.statusGlyph.w * 0.28} ${layout.statusGlyph.h * 0.18}`"
        fill="none"
        stroke-width="5"
      />
      <path
        :d="`M ${layout.statusGlyph.x + layout.statusGlyph.w * 0.58} ${layout.statusGlyph.y}
             L ${layout.statusGlyph.x + layout.statusGlyph.w * 0.34} ${layout.statusGlyph.y + layout.statusGlyph.h * 0.55}
             h ${layout.statusGlyph.w * 0.14}
             L ${layout.statusGlyph.x + layout.statusGlyph.w * 0.42} ${layout.statusGlyph.h + layout.statusGlyph.y}
             L ${layout.statusGlyph.x + layout.statusGlyph.w * 0.68} ${layout.statusGlyph.y + layout.statusGlyph.h * 0.4}
             h ${-layout.statusGlyph.w * 0.14}
             Z`"
        stroke="none"
      />
    </g>

    <!-- Edge accents and glyph marks on their measured beats: the white
         cursor-over-square icon (click 3), the red strip (click 4), the teal
         smile tile + strip (click 5). The recording's one-frame red→orange
         flash (t3.133→t3.2) settles at the strip's median — rendered flat,
         noted as a sub-frame simplification. -->
    <template v-for="accent in layout.accents" :key="accent.id">
      <!-- Cursor-over-square: rounded square outline with two content dots
           and a bar, cursor arrow entering from the top. -->
      <g
        v-if="accent.kind === 'cursorSquare'"
        v-click="accent.click"
        class="sf-fade"
        :style="delayStyle(accent.delayMs)"
        :fill="SPEC_WHITE"
        :stroke="SPEC_WHITE"
      >
        <rect
          :x="accent.box.x + accent.box.w * 0.08"
          :y="accent.box.y + accent.box.h * 0.38"
          :width="accent.box.w * 0.85"
          :height="accent.box.h * 0.6"
          :rx="8"
          fill="none"
          stroke-width="4"
        />
        <path
          :d="`M ${accent.box.x + accent.box.w * 0.5} ${accent.box.y}
               L ${accent.box.x + accent.box.w * 0.38} ${accent.box.y + accent.box.h * 0.14}
               L ${accent.box.x + accent.box.w * 0.62} ${accent.box.y + accent.box.h * 0.14}
               L ${accent.box.x + accent.box.w * 0.5} ${accent.box.y + accent.box.h * 0.08}
               Z`"
          stroke="none"
        />
        <rect
          :x="accent.box.x + accent.box.w * 0.44"
          :y="accent.box.y + accent.box.h * 0.1"
          :width="accent.box.w * 0.12"
          :height="accent.box.h * 0.3"
          stroke="none"
        />
        <circle
          :cx="accent.box.x + accent.box.w * 0.36"
          :cy="accent.box.y + accent.box.h * 0.67"
          r="4"
          stroke="none"
        />
        <circle
          :cx="accent.box.x + accent.box.w * 0.64"
          :cy="accent.box.y + accent.box.h * 0.67"
          r="4"
          stroke="none"
        />
        <rect
          :x="accent.box.x + accent.box.w * 0.34"
          :y="accent.box.y + accent.box.h * 0.88"
          :width="accent.box.w * 0.34"
          height="5"
          stroke="none"
        />
      </g>

      <!-- Teal smile tile: dark interior, teal ring, eyes + smile inside. -->
      <g
        v-else-if="accent.kind === 'smileTile'"
        v-click="accent.click"
        class="sf-fade"
        :style="delayStyle(accent.delayMs)"
        :fill="TEAL_CLUSTER"
        :stroke="TEAL_CLUSTER"
      >
        <rect
          :x="accent.box.x"
          :y="accent.box.y"
          :width="accent.box.w"
          :height="accent.box.h"
          :rx="accent.box.h / 2"
          fill="none"
          stroke-width="5"
        />
        <g v-if="accent.glyph">
          <circle
            :cx="accent.glyph.x + accent.glyph.w * 0.25"
            :cy="accent.glyph.y + accent.glyph.h * 0.3"
            r="3.5"
            stroke="none"
          />
          <circle
            :cx="accent.glyph.x + accent.glyph.w * 0.75"
            :cy="accent.glyph.y + accent.glyph.h * 0.3"
            r="3.5"
            stroke="none"
          />
          <path
            :d="`M ${accent.glyph.x + accent.glyph.w * 0.15} ${accent.glyph.y + accent.glyph.h * 0.45}
                 q ${accent.glyph.w * 0.35} ${accent.glyph.h * 0.55} ${accent.glyph.w * 0.7} 0`"
            fill="none"
            stroke-width="5"
          />
        </g>
      </g>

      <!-- Solid edge strips. -->
      <rect
        v-else
        v-click="accent.click"
        class="sf-fade"
        :x="accent.box.x"
        :y="accent.box.y"
        :width="accent.box.w"
        :height="accent.box.h"
        :rx="2"
        :fill="accent.id === 'redStrip' ? RED_EDGE : teal"
        :style="delayStyle(accent.delayMs)"
      />
    </template>

    <!-- Shared title chrome: measured two-tone title (white "Using it" lead,
         green "properly" tail from x0.4984 — TitleChrome splits on the
         accent string; ink extent pinned to the measured 634.9px). -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :cap-height="layout.title.capHeight"
      :cap-top="layout.title.capTop"
      :center-x="layout.title.centerX"
      :title-text-length="layout.title.inkWidth"
    />
  </svg>
</template>

<style scoped>
.specpanel {
  display: block;
  width: 100%;
  height: auto;
}

.specpanel text {
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
  /* Per-row weight and faux-bold stroke come from the measured ink plan in
     specPanel.ts (bundled 400/500/700 faces; stroke interpolates stem width
     against the settled frame) — no deck-wide weight here, the attributes
     carry it. */
}

/* Title density note: the recording's title face is heavier than the shared
 * chrome's bundled-bold rendering, but no slide-local CSS can thicken SVG
 * text (see NOTE below) — the shared TitleChrome renders as measured and the
 * remaining density gap is accepted. */
/* NOTE: `-webkit-text-stroke` is inert on SVG <text> in Chromium — the
 * property computes but never paints (verified via a CDP style probe), so
 * the shared title renders at its natural bundled-bold density here. */

/*
 * Measured motion (R-4: rows FADE — every row reaches its full x-extent in
 * the first reveal frame and ramps opacity over 2–4 frames; no typewriter).
 * The fade runs 300ms with the row's sub-beat delay; the hidden state's
 * transition:none makes backward nav instant — the locked decision. Scoped
 * specificity (0,2,0 + attribute) beats Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease }.
 */
.sf-fade {
  transition: opacity 300ms ease-out;
  transition-delay: var(--sf-delay, 0ms);
}

.sf-fade.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-fade {
    transition: none;
  }
}
</style>
