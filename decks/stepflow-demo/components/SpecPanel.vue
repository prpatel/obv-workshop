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
  title: 'Universal spec-driven',
  titleAccent: 'agents in action',
  seed: () => ({}),
})

// The seg14 recording settles on the default palette tokens: dim rows at
// subtext #a6a8ae (sampled rgb(163,162,169)), teal at the family teal token.
const p = computed(() => resolvePalette(props.palette ?? {}))

// Every box, beat, and delay comes from the measured layout module
// (report.json seg14_153s-160s + settled-frame sampling) — the seed carries
// content, not geometry.
const layout = specPanelLayout()

const seed = computed<SpecPanelSeed>(() => ({ ...SPEC_PANEL_SEED, ...props.seed }))

// Single-line rows render in one pass; the body block renders its three lines
// with the block's measured pitch.
const singleRows = computed(() => layout.rows.filter((row) => row.id !== 'body'))

const bodyRow = computed<SpecRow>(() => {
  const row = layout.rows.find((row) => row.id === 'body')
  if (!row) throw new Error('specPanel layout must include the body row')
  return row
})

/** Row id → its seed copy (the body block renders its three lines). */
function rowLines(row: SpecRow): string[] {
  const s = seed.value
  switch (row.id) {
    case 'status':
      return [s.status]
    case 'statusTeal':
      return [s.statusTeal]
    case 'heading':
      return [s.heading]
    case 'body':
      return s.body
    case 'redLine':
      return [s.redLine]
    case 'tealLine':
      return [s.tealLine]
    case 'lastLine':
      return [s.lastLine]
  }
}

/** Ink fill for a row's measured tone. */
function rowFill(row: SpecRow): string {
  if (row.tone === 'teal') return p.value.accentTertiary ?? p.value.accent
  return row.tone === 'dim' ? p.value.subtext : SPEC_WHITE
}

// Family color constants measured off the settled frame (report.json §structure
// medians + pixel samples). Ambient tones are family constants, not palette
// roles — only the text tones route through the palette above.
const SPEC_WHITE = '#f5f4f7' // settled bright rows, rgb(245,244,247)
const PLATE_FILL = '#0d0d10' // settled plate rgb(13,13,16), luma ≈14 (V-3)
const RED_EDGE = '#ec413f' // red strip median rgb(236,65,63)
const TILE_FILL = '#0f0e11' // teal tile's dark interior rgb(15,14,17)
const DOT_RED = '#f55d54' // traffic dot rgb(245,93,84)
const DOT_AMBER = '#f9b82b' // traffic dot rgb(249,184,43)
const DOT_GREEN = '#29c541' // traffic dot rgb(41,197,65)

/** Sub-beat transition delay as a scoped custom property. */
function delayStyle(delayMs: number) {
  return { '--sf-delay': `${delayMs}ms` }
}
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

    <!-- One text element per measured row line, each pinned to the row's
         measured ink extent (spacing-only — glyphs never squeeze). -->
    <text
      v-for="row in singleRows"
      :key="row.id"
      v-click="row.click"
      class="sf-fade"
      :x="row.box.x"
      :y="specRowBaseline(row)"
      text-anchor="start"
      :font-size="specRowFont(row)"
      :fill="rowFill(row)"
      :style="delayStyle(row.delayMs)"
      v-bind="pinAttrs(rowLines(row)[0], specRowFont(row), row.box.w)"
    >{{ rowLines(row)[0] }}</text>

    <!-- Body block: the measured three-line zone. Only the block's width is
         measured (per-line extents are resolution-limited); every line is
         pinned to the block width. The sub-beat delay staggers it one frame
         after the heading. -->
    <text
      v-for="(line, i) in rowLines(bodyRow)"
      :key="`body-${i}`"
      v-click="bodyRow.click"
      class="sf-fade"
      :x="bodyRow.box.x"
      :y="specRowBaseline(bodyRow, i)"
      text-anchor="start"
      :font-size="specRowFont(bodyRow)"
      :fill="rowFill(bodyRow)"
      :style="delayStyle(bodyRow.delayMs + i * 60)"
      v-bind="pinAttrs(line, specRowFont(bodyRow), bodyRow.box.w)"
    >{{ line }}</text>

    <!-- Edge accents on their own late beats: red strip (click 4) then the
         teal strip + dark tile with centered teal glyph (click 5). The
         recording's one-frame red→orange flash (t3.133→t3.2) settles at the
         strip's median — rendered flat, noted as a sub-frame simplification. -->
    <rect
      v-for="accent in layout.accents"
      :key="accent.id"
      v-click="accent.click"
      class="sf-fade"
      :x="accent.box.x"
      :y="accent.box.y"
      :width="accent.box.w"
      :height="accent.box.h"
      :rx="accent.glyph ? 6 : 2"
      :fill="accent.id === 'redStrip' ? RED_EDGE : accent.id === 'tealStrip' ? (p.accentTertiary ?? p.accent) : TILE_FILL"
      :style="delayStyle(accent.delayMs)"
    />
    <rect
      v-if="layout.accents[2]?.glyph"
      v-click="layout.accents[2].click"
      class="sf-fade"
      :x="layout.accents[2].glyph.x"
      :y="layout.accents[2].glyph.y"
      :width="layout.accents[2].glyph.w"
      :height="layout.accents[2].glyph.h"
      :rx="6"
      fill="none"
      :stroke="p.accentTertiary ?? p.accent"
      :stroke-width="5"
      :style="delayStyle(120)"
    />

    <!-- Shared title chrome: measured two-tone title (white lead band
         y0.0993–0.150, green tail from x0.4984 — TitleChrome splits on the
         accent string; ink extent pinned to the measured 634.56px). -->
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
}

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
