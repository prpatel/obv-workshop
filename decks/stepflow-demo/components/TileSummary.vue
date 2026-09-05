<script setup lang="ts">
import { computed } from 'vue'
import {
  revealPlan,
  tileSummaryLayout,
  TILE_SUMMARY_PLATE_FILL,
  TILE_SUMMARY_RX,
  TILE_SUMMARY_SEED,
  type TileSummaryRect,
  type TileSummaryTile,
} from './stepflow/tileSummary'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'
import { CAP_HEIGHT_RATIO, CHROME_GREEN, TITLE_WHITE, pinAttrs } from './stepflow/chrome'

const props = withDefaults(defineProps<{
  /** The tile row, in reveal order (measured seg16 seed: EXTRACT → TRANSFORM → LOAD). */
  seed?: TileSummaryTile[]
  /** Partial palette merged over the measured `cyanOnBlack` preset. */
  palette?: StepFlowPaletteOverride
  /** White lead of the two-tone header. */
  title?: string
  /** Header tail rendered in chrome green. */
  titleAccent?: string
  /**
   * Dim-white summary line under the bar — the measured text box pins the
   * extent; the copy itself was unreadable at capture resolution and lands
   * with the integration slide. Empty (default) renders nothing.
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

/** Dark punch-through glyph mapped onto the measured ink band (fallback icon
 * until the seg16 marks are identified — the TileGrid/seg05 precedent). */
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
        :fill="TITLE_WHITE"
      >{{ title }}</text>
      <text
        v-if="titleAccent"
        class="ts-chrome-accent"
        :x="header.accent.x"
        :y="header.baseline"
        :font-size="header.fontSize"
        v-bind="pinAttrs(titleAccent, header.fontSize, header.accent.w)"
        text-anchor="start"
        :fill="CHROME_GREEN"
      >{{ titleAccent }}</text>
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
          v-html="iconPath(tile.icon ?? '') ?? ICON_FALLBACK"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
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
        fill="#f3f3f3"
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
      >{{ tile.sublabel }}</text>
    </g>

    <!-- Rail segments join their tile's wave: segment 1 rides tile 2, segment
         2 rides tile 3 (measured arrivals t≈0.533–0.6 and t≈1.133). -->
    <g
      v-for="seg in layout.rail.filter(s => s.click !== plan.bracketClick)"
      :key="`rail-${seg.x}`"
      v-click="seg.click"
      :data-sf-click="seg.click"
      class="ts-rail"
    >
      <rect :x="seg.x" :y="seg.y" :width="seg.w" :height="seg.h" :fill="p.accent" />
    </g>

    <!-- Bracket beat (click 4): right vertical + bar first, left vertical
         ~200ms behind (t≈1.667), summary text ~266ms behind (t≈1.733) —
         white text last, inside the locked 4-click contract. -->
    <g v-click="plan.bracketClick" :data-sf-click="plan.bracketClick" class="ts-bracket">
      <rect class="ts-vert ts-vert--right" :x="layout.verticals.right.x" :y="layout.verticals.right.y" :width="layout.verticals.right.w" :height="layout.verticals.right.h" :fill="p.accent" />
      <rect class="ts-bar" :x="layout.bar.x" :y="layout.bar.y" :width="layout.bar.w" :height="layout.bar.h" :fill="p.accent" />
      <rect class="ts-vert ts-vert--left" :x="layout.verticals.left.x" :y="layout.verticals.left.y" :width="layout.verticals.left.w" :height="layout.verticals.left.h" :fill="p.accent" />
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

.ts-tile.slidev-vclick-hidden .ts-plate {
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

.ts-rail rect {
  transition: opacity 300ms ease-out;
}

.ts-rail.slidev-vclick-hidden rect {
  opacity: 0;
  transition: none;
}

/* Bracket: right vertical + bar with the click; left vertical ~200ms behind
   (t≈1.667); summary text ~266ms behind (t≈1.733) — white text last. */
.ts-vert--right,
.ts-bar {
  transition: opacity 300ms ease-out;
}

.ts-vert--left {
  transition: opacity 300ms ease-out;
  transition-delay: 200ms;
}

.ts-summary {
  transition: opacity 300ms ease-out;
  transition-delay: 266ms;
}

.ts-bracket.slidev-vclick-hidden .ts-vert--right,
.ts-bracket.slidev-vclick-hidden .ts-bar,
.ts-bracket.slidev-vclick-hidden .ts-vert--left,
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
  .ts-rail rect,
  .ts-vert--right,
  .ts-vert--left,
  .ts-bar,
  .ts-summary {
    transition: none;
  }
}
</style>
