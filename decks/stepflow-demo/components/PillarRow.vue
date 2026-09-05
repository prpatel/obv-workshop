<script setup lang="ts">
import { computed } from 'vue'
import { pillarRowLayout, type PillarCard } from './stepflow/pillars'
import TitleChrome from './stepflow/TitleChrome.vue'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'
import { pinAttrs } from './stepflow/chrome'

const props = withDefaults(defineProps<{
  /** One entry per station; content travels with the slide. */
  cards: PillarCard[]
  /** Content for the two measured summary rows below the card band; any text
   * is condensed to the measured ink extents. */
  summaryRows?: string[]
  /** Mono header line, e.g. 'THE DATA ENGINEERING'. */
  title?: string
  /** Optional title tail rendered in chrome green (title chrome convention). */
  titleAccent?: string
}>(), { summaryRows: () => [] })

// Geometry, plates, badges, labels, and summary rows all come from the measured
// layout module (report.json seg05 settled structure) — the seed carries
// content, not geometry.
const layout = computed(() => pillarRowLayout(props.cards))

// Measured station hues (settled-frame medians, report.json seg05 structure):
// the plates are near-black knockouts on the canvas (V-3 — never light gray),
// the glyphs carry one stroke per station, and the badges render as a ring
// around a solid core. Station 2's badge ring reads red around a red-orange
// core; station 3's badge is the dim magenta that survived the hue classifier.
const GLYPH_STROKES = ['#efeff0', '#37a9cd', '#3bbe9e']
const BADGE_FILLS = ['#f96300', '#e34b26', '#8f0b5d']
const BADGE_STROKES = ['#ea6513', '#e5342b', '#8f0b5d']
const LABEL_FILLS = ['#eeeff0', '#51bdda', '#44d0a8']
const ROW_FILLS = ['#d16157', '#686868']
const PLATE_FILL = '#0b0b0b'
const PLATE_STROKE = '#1e1e23'
// Corner radius is unresolvable at video scale (the plates read as soft dim
// bands) — a stylistic constant, not a measured value.
const PLATE_RX = 14
// JetBrains Mono cap-height ratio (title chrome convention) turns measured cap
// bands into font sizes.
const CAP_RATIO = 0.73

// Click choreography (measured f15 onsets, REVEAL_BEATS_SEC): card k pops at
// beat 2k+1 and badge k at 2k+2 — except station 3's badge rides its card's
// beat (too dim for its own beat in the recording), so the min() clamps
// stations ≥ 3 onto beat 5, and beat 6 reveals the summary rows.
const cardClick = (i: number): number => Math.min(i * 2 + 1, 5)
const badgeClick = (i: number): number => Math.min(i * 2 + 2, 5)
const rowsClick = 6

// Icon resolution: registry lookup with the visible generic fallback on a miss
// (never undefined into v-html). The warn surfaces wrong keys in dev.
function iconFor(card: PillarCard): string {
  const path = iconPath(card.icon)
  if (path) return path
  console.warn(`[PillarRow] unknown icon key "${card.icon}" — rendering ICON_FALLBACK`)
  return ICON_FALLBACK
}

// Lucide 24-box → measured glyph square.
function glyphTransform(i: number): string {
  const g = layout.value.cards[i]!.glyph
  const half = g.size / 2
  return `translate(${g.cx - half} ${g.cy - half}) scale(${g.size / 24})`
}
</script>

<template>
  <svg
    class="pillar-row"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${cards.length}-pillar card row`"
  >
    <!-- One sibling group per station: plate + icon glyph + label rise
         together on the card's beat (fade/rise per StairChain convention). -->
    <g
      v-for="(card, i) in cards"
      :key="card.id"
      v-click="cardClick(i)"
      class="sf-card"
    >
      <!-- Near-black organizing plate: the settled frame's plates are dim
           knockouts (luma 6–40), so the fill stays #0b0b0b with a barely
           lighter edge — never a light-gray card. -->
      <rect
        class="sf-plate"
        :x="layout.cards[i]!.plate.x"
        :y="layout.cards[i]!.plate.y"
        :width="layout.cards[i]!.plate.w"
        :height="layout.cards[i]!.plate.h"
        :rx="PLATE_RX"
        :fill="PLATE_FILL"
        :stroke="PLATE_STROKE"
        stroke-width="2"
      />
      <!-- Icon glyph: registry markup (or ICON_FALLBACK) stroked in the
           station's measured hue, scaled from the Lucide 24-box into the
           ~98px measured ink square. -->
      <g
        class="sf-glyph"
        :transform="glyphTransform(i)"
        fill="none"
        :stroke="GLYPH_STROKES[i]!"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        v-html="iconFor(card)"
      />
      <!-- Hue-matched label row: fades on its own tail after the card pop
           (labels ride their card's beat in the recording — no extra click). -->
      <text
        class="sf-label"
        :x="layout.cards[i]!.label.x"
        :y="layout.cards[i]!.label.baselineY"
        text-anchor="start"
        :font-size="layout.cards[i]!.label.capHeight / CAP_RATIO"
        v-bind="pinAttrs(card.label, layout.cards[i]!.label.capHeight / CAP_RATIO, layout.cards[i]!.label.textLength)"
        :fill="LABEL_FILLS[i]!"
      >{{ card.label }}</text>
    </g>

    <!-- Companion accent badges: ring + solid core, lower-right of each glyph;
         each pops on its own beat (station 3 rides beat 5). -->
    <g
      v-for="(card, i) in cards"
      :key="`${card.id}-badge`"
      v-click="badgeClick(i)"
      class="sf-badge"
    >
      <ellipse
        class="sf-badge-ring"
        :cx="layout.cards[i]!.badge.cx"
        :cy="layout.cards[i]!.badge.cy"
        :rx="layout.cards[i]!.badge.rx"
        :ry="layout.cards[i]!.badge.ry"
        fill="none"
        :stroke="BADGE_STROKES[i]!"
        stroke-width="3"
      />
      <ellipse
        class="sf-badge-core"
        :cx="layout.cards[i]!.badge.cx"
        :cy="layout.cards[i]!.badge.cy"
        :rx="layout.cards[i]!.badge.coreRx"
        :ry="layout.cards[i]!.badge.coreRy"
        :fill="BADGE_FILLS[i]!"
      />
    </g>

    <!-- Measured summary rows below the card band: one beat for the wave,
         row 2 staggering ~400ms after row 1 (onsets 1.467s → ≈1.933s). -->
    <g v-click="rowsClick" class="sf-rows">
      <text
        v-for="(row, r) in layout.textRows"
        :key="`row-${r}`"
        class="sf-row"
        :class="`sf-row-${r + 1}`"
        :x="row.x"
        :y="row.baselineY"
        text-anchor="start"
        :font-size="row.capHeight / CAP_RATIO"
        v-bind="pinAttrs(props.summaryRows[r] ?? '', row.capHeight / CAP_RATIO, row.textLength)"
        :fill="ROW_FILLS[r]!"
      >{{ props.summaryRows[r] ?? '' }}</text>
    </g>

    <!-- Shared title chrome: seg05 title band y0.0958–0.1493 (cap 57.78,
         cap-top 103.46), white head x0.2809 → green tail x0.7191, centered
         at x960, ink extent pinned to the measured 841.34px. -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :cap-height="57.78"
      :cap-top="103.46"
      :center-x="960"
      :title-text-length="841.34"
    />
  </svg>
</template>

<style scoped>
.pillar-row {
  display: block;
  width: 100%;
  height: auto;
}

.pillar-row text {
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Measured motion (f15 trace): cards pop/fade in station order 1→3 with their
 * badges interleaved, labels fade on their own tail, and the summary rows wave
 * in last with row 2 lagging row 1 by ~400ms. Transition is taken from the
 * destination state: forward reveal runs the rise/pop, the hidden state's
 * transition:none makes backward nav instant — the locked decision. Scoped
 * selectors (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease } — no source-order reliance.
 */
.sf-card {
  transform-box: fill-box;
  transform-origin: center;
  transition:
    opacity 450ms ease-out,
    transform 450ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-card.slidev-vclick-hidden {
  transform: translateY(12px) scale(0.85);
  transition: none;
}

/* Badges pop (slight overshoot) rather than rise — the recording plays them
 * as accent pops on their beats. */
.sf-badge {
  transform-box: fill-box;
  transform-origin: center;
  transition:
    opacity 350ms ease-out,
    transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sf-badge.slidev-vclick-hidden {
  transform: scale(0.5);
  transition: none;
}

/* Label fade rides its card's beat on a short delay — its own tail, not its
 * own click (the f15 frames never show labels on independent beats). */
.sf-label {
  transition: opacity 300ms ease-out 120ms;
}

.sf-card.slidev-vclick-hidden .sf-label {
  opacity: 0;
  transition: none;
}

.sf-rows {
  transition: opacity 400ms ease-out;
}

.sf-rows.slidev-vclick-hidden {
  transition: none;
}

.sf-rows.slidev-vclick-hidden .sf-row {
  opacity: 0;
}

.sf-row-2 {
  transition: opacity 400ms ease-out 400ms;
}

.sf-rows.slidev-vclick-hidden .sf-row-2 {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-card,
  .sf-badge,
  .sf-label,
  .sf-rows,
  .sf-row,
  .sf-row-2 {
    transition: none;
    animation: none;
  }
}
</style>
