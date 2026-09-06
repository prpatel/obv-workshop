<script setup lang="ts">
import { computed } from 'vue'
import {
  revealPlan,
  tileSummaryLayout,
  TILE_SUMMARY_BADGES,
  TILE_SUMMARY_BADGE_FILL,
  TILE_SUMMARY_GLYPHS,
  TILE_SUMMARY_PLATE_FILL,
  TILE_SUMMARY_TITLE_STROKE,
  TILE_SUMMARY_RX,
  TILE_SUMMARY_SEED,
  TILE_SUMMARY_GLYPH_STROKE,
  TILE_SUMMARY_SUMMARY_OPACITY,
  type TileSummaryRect,
  type TileSummaryTile,
} from './stepflow/tileSummary'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'
import { CAP_HEIGHT_RATIO, CHROME_GREEN, TITLE_WHITE, pinAttrs } from './stepflow/chrome'

const props = withDefaults(defineProps<{
  /** The tile row, in reveal order (measured seg16 seed: EXTRACT → MOVE → LOAD). */
  seed?: TileSummaryTile[]
  /** Partial palette merged over the measured `cyanOnBlack` preset. */
  palette?: StepFlowPaletteOverride
  /** White lead of the two-tone header. */
  title?: string
  /** Header tail rendered in chrome green. */
  titleAccent?: string
  /**
   * Dim summary line under the bar — the measured text box pins the extent;
   * the copy is resolved from the f0030 ghost (integration slide supplies it).
   * Empty (default) renders nothing.
   */
  summary?: string
}>(), { palette: () => ({}), summary: '' })

const p = computed(() => resolvePalette(props.palette))
const layout = computed(() => tileSummaryLayout(props.seed ?? TILE_SUMMARY_SEED))
const plan = computed(() => revealPlan(props.seed ?? TILE_SUMMARY_SEED, !!props.summary))

// Header: two ink spans pinned to their measured extents (lead 0.3016–0.4477,
// accent 0.4590–0.7004) at the shared baseline — spacing-only textLength pins
// (generation-7 typography lock; glyphs never squeeze).
const header = computed(() => {
  const h = layout.value.header
  return {
    fontSize: h.capHeight / CAP_HEIGHT_RATIO,
    baseline: h.baseline,
    lead: { x: h.lead.x, w: h.lead.w },
    accent: { x: h.accent.x, w: h.accent.w },
  }
})

// Summary line: the measured box is authoritative even when the copy is
// pending — the element renders only when text exists.
const summarySpec = computed(() => {
  if (!props.summary) return undefined
  return layout.value.summaryBox
})

/** Dark punch-through glyph mapped onto its measured per-tile ink band
 * (traced seg16 marks; a tile's `icon` registry key overrides the trace). */
function iconTransform(tile: TileSummaryRect): string {
  const box = tile.iconBox
  return `translate(${box.x} ${box.y}) scale(${box.w / 24} ${box.h / 24})`
}

</script>
<template>
  <svg
    class="tilesummary"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${layout.tiles.length}-tile summary diagram`"
  >
    <!-- Two-tone header: static, pinned to the measured ink extents. -->
    <g v-if="title || titleAccent" class="ts-chrome-title">
      <text
        v-if="title"
        class="ts-chrome-lead"
        :x="header.lead.x"
        :y="header.baseline"
        :font-size="header.fontSize"
        v-bind="pinAttrs(title, header.fontSize, header.lead.w)"
        text-anchor="start"
        font-weight="700"
        :fill="TITLE_WHITE"
        :stroke="TITLE_WHITE"
        :stroke-width="TILE_SUMMARY_TITLE_STROKE"
      >{{ title }}</text>
      <text
        v-if="titleAccent"
        class="ts-chrome-accent"
        :x="header.accent.x"
        :y="header.baseline"
        :font-size="header.fontSize"
        v-bind="pinAttrs(titleAccent, header.fontSize, header.accent.w)"
        text-anchor="start"
        font-weight="700"
        :fill="CHROME_GREEN"
        :stroke="CHROME_GREEN"
        :stroke-width="TILE_SUMMARY_TITLE_STROKE"
      >{{ titleAccent }}</text>
    </g>

    <!-- Left terminus chevron: a small thin '>' hugging tile 1's left
         edge — measured apex (0.2255, 0.4704), arm tips x 0.2135 at
         y 0.4593/0.4833, stroke ≈0.0029 (an earlier "bold '<'" read
         conflated the tile fill edge with the mark). Rides tile 1's wave
         (the t≈0.2 plate event covers its zone). -->
    <g
      v-click="layout.leftMark.click"
      :data-sf-click="layout.leftMark.click"
      class="ts-leftmark"
    >
      <polyline
        :points="layout.leftMark.points"
        fill="none"
        :stroke="p.accent"
        :stroke-width="layout.leftMark.strokeW"
        stroke-linecap="butt"
        stroke-linejoin="miter"
      />
    </g>

    <!-- One wave per tile (click i+1): the near-black plate leads, the cyan
         fill and bright label follow ~70ms behind, the dim line lands last
         (measured onsets: plate t≈0.2, fill+label t≈0.267, line 2 t≈0.333). -->
    <g
      v-for="(tile, i) in layout.tiles"
      :key="tile.id"
      v-click="plan.tileClicks[i]"
      :data-sf-click="plan.tileClicks[i]"
      class="ts-tile"
    >
      <rect
        class="ts-plate"
        :x="tile.plate.x"
        :y="tile.plate.y"
        :width="tile.plate.w"
        :height="tile.plate.h"
        :fill="TILE_SUMMARY_PLATE_FILL"
      />
      <!-- Amber traced badge above the plate — fades in with the tile's wave. -->
      <path
        v-if="TILE_SUMMARY_BADGES[i]"
        class="ts-badge"
        :d="TILE_SUMMARY_BADGES[i]"
        :fill="TILE_SUMMARY_BADGE_FILL"
      />
      <rect
        class="ts-fill"
        :x="tile.x"
        :y="tile.y"
        :width="tile.w"
        :height="tile.h"
        :rx="TILE_SUMMARY_RX"
        :fill="p.accent"
      />
      <g
        class="ts-icon"
        :transform="iconTransform(tile)"
        :style="{ color: p.iconStroke }"
      >
        <g
          v-html="iconPath(tile.icon ?? '') ?? TILE_SUMMARY_GLYPHS[tile.id] ?? ICON_FALLBACK"
          fill="none"
          stroke="currentColor"
          :stroke-width="TILE_SUMMARY_GLYPH_STROKE"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
      <text
        class="ts-label1"
        :x="tile.labelBox.centerX"
        :y="tile.labelBox.baseline"
        :font-size="tile.labelBox.capHeight / CAP_HEIGHT_RATIO"
        :textLength="tile.labelBox.inkW"
        lengthAdjust="spacing"
        text-anchor="middle"
        fill="#e7e7e7"
        font-weight="700"
      >{{ tile.label }}</text>
      <text
        v-if="tile.sublabelBox && tile.sublabel"
        class="ts-label2"
        :x="tile.sublabelBox.centerX"
        :y="tile.sublabelBox.baseline"
        :font-size="tile.sublabelBox.capHeight / CAP_HEIGHT_RATIO"
        :textLength="tile.sublabelBox.inkW"
        lengthAdjust="spacing"
        text-anchor="middle"
        :fill="p.subtext"
        font-weight="500"
      >{{ tile.sublabel }}</text>
    </g>

    <!-- Rail segments join their tile's wave: segment 1 rides tile 2,
         segment 2 rides tile 3, and the right stub (tile 3 → right vertical)
         rides the bracket beat (measured arrivals t≈0.533–0.6, t≈1.133,
         t≈1.467). -->
    <g
      v-for="seg in layout.rail"
      :key="`rail-${seg.x}`"
      v-click="seg.click"
      :data-sf-click="seg.click"
      class="ts-rail"
    >
      <rect :x="seg.x" :y="seg.y" :width="seg.w" :height="seg.h" :fill="p.accent" />
    </g>

    <!-- Bracket beat (click 4): the settled frame's single right vertical +
         the settled-extent bar; the rail gap-fill + stub ride the same beat
         from the rail loop above. Summary text follows ~266ms behind
         (t≈1.733), settling to the measured ~8% ghost opacity — white
         text last, inside the locked 4-click contract. -->
    <g v-click="plan.bracketClick" :data-sf-click="plan.bracketClick" class="ts-bracket">
      <rect class="ts-vert" :x="layout.vertical.x" :y="layout.vertical.y" :width="layout.vertical.w" :height="layout.vertical.h" :fill="p.accent" />
      <rect class="ts-bar" :x="layout.bar.x" :y="layout.bar.y" :width="layout.bar.w" :height="layout.bar.h" :fill="p.accent" />
      <text
        v-if="summarySpec"
        class="ts-summary"
        :x="layout.summaryBox.centerX"
        :y="layout.summaryBox.baseline"
        :font-size="layout.summaryBox.capHeight / CAP_HEIGHT_RATIO"
        :textLength="layout.summaryBox.inkW"
        lengthAdjust="spacing"
        text-anchor="middle"
        :fill="p.subtext"
        :opacity="TILE_SUMMARY_SUMMARY_OPACITY"
      >{{ summary }}</text>
    </g>
  </svg>
</template>

<style scoped>
.tilesummary {
  display: block;
  width: 100%;
  height: auto;
}

.tilesummary text {
  /* Mono stack until the face is confirmed (StepFlow's open question #1). */
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Measured motion (seg16 f15 dumps, 15fps, ±66.7ms): per tile the near-black
 * plate leads its click, the cyan fill and bright label land ~70ms behind
 * (plate t≈0.2, fill/label t≈0.267), the dim line ~140ms (t≈0.333). The
 * bracket beat fades the right vertical + bar at t≈1.467, the left vertical
 * at t≈1.667, and the summary text at t≈1.733 — white text last. The
 * transition lives on the destination state and the hidden state's
 * transition:none makes backward nav instant — the locked decision, zero JS.
 */

.ts-plate {
  transition: opacity 300ms ease-out;
}

.ts-tile.slidev-vclick-hidden .ts-plate,
.ts-tile.slidev-vclick-hidden .ts-badge {
  opacity: 0;
  transition: none;
}

.ts-fill,
.ts-label1 {
  transition: opacity 300ms ease-out;
  transition-delay: 70ms;
}

.ts-tile.slidev-vclick-hidden .ts-fill,
.ts-tile.slidev-vclick-hidden .ts-label1 {
  opacity: 0;
  transition: none;
}

.ts-icon {
  transition: opacity 300ms ease-out;
  transition-delay: 70ms;
}

.ts-tile.slidev-vclick-hidden .ts-icon {
  opacity: 0;
  transition: none;
}

.ts-label2 {
  transition: opacity 300ms ease-out;
  transition-delay: 140ms;
}

.ts-tile.slidev-vclick-hidden .ts-label2 {
  opacity: 0;
  transition: none;
}

.ts-leftmark polyline {
  transition: opacity 300ms ease-out;
}

.ts-leftmark.slidev-vclick-hidden polyline {
  opacity: 0;
  transition: none;
}

.ts-rail rect {
  transition: opacity 300ms ease-out;
}

.ts-rail.slidev-vclick-hidden rect {
  opacity: 0;
  transition: none;
}

/* Bracket: right vertical + bar with the click; summary text ~266ms behind
   (t≈1.733), settling at the measured ~8% ghost — white text last. */
.ts-vert,
.ts-bar {
  transition: opacity 300ms ease-out;
}

.ts-summary {
  transition: opacity 300ms ease-out;
  transition-delay: 266ms;
}

.ts-bracket.slidev-vclick-hidden .ts-vert,
.ts-bracket.slidev-vclick-hidden .ts-bar,
.ts-bracket.slidev-vclick-hidden .ts-summary {
  opacity: 0;
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .ts-plate,
  .ts-fill,
  .ts-label1,
  .ts-icon,
  .ts-label2,
  .ts-leftmark polyline,
  .ts-rail rect,
  .ts-vert,
  .ts-bar,
  .ts-summary {
    transition: none;
  }
}
</style>
