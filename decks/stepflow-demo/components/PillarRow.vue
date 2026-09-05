<script setup lang="ts">
import { computed } from 'vue'
import { pillarRowLayout, type PillarCard } from './stepflow/pillars'
import TitleChrome from './stepflow/TitleChrome.vue'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'
import { pinAttrs, type TitleToken } from './stepflow/chrome'

const props = withDefaults(defineProps<{
  /** One entry per station; content travels with the slide. */
  cards: PillarCard[]
  /** Mono header line, e.g. 'THE DATA ENGINEERING' (used when no tokens). */
  title?: string
  /** Optional title tail rendered in chrome green (title chrome convention). */
  titleAccent?: string
  /** Measured per-token title runs — supersedes the centered lead/tail pair. */
  titleTokens?: TitleToken[]
  /** Sheet-measured title cap height in 1920×1080 px. */
  titleCapHeight?: number
  /** Sheet-measured title cap-band top in 1920×1080 px. */
  titleCapTop?: number
}>(), {
  title: '',
  titleAccent: '',
  titleTokens: () => [],
  titleCapHeight: 60,
  titleCapTop: 101.3,
})

// Geometry, plates, badges, labels, and caption clusters all come from the
// measured layout module (settled-frame census) — the seed carries content,
// not geometry.
const layout = computed(() => pillarRowLayout(props.cards))

// Measured station hues (settled-frame cores, this rebuild's census): the
// plates are near-black knockouts with per-station tint, the glyphs carry one
// stroke per station, and the badges render as thin circle outlines carrying
// a bright mini-icon (settled ASCII maps — no pin tail, no core disc).
// Caption row 1 is hue-matched to its badge; caption row 2 and label row B
// are the dim grays.
const PLATE_FILLS = ['#0e0d0f', '#0c0e14', '#0d0e11']
const GLYPH_STROKES = ['#d8d8da', '#32a4ca', '#50b79b']
const BADGE_ACCENTS = ['#f96200', '#fb3929', '#bb0278']
const LABEL_FILLS = ['#a8a8a9', '#5b9aad', '#579f8b']
const SUBLABEL_FILL = '#676767'
const CAPTION_FILLS = ['#d07b42', '#d46058', '#b74588']
const META_FILLS = ['#6c6c6d', '#6b6b6c', '#5f5f5f']
// Corner radius is unresolvable at video scale (the plates read as soft dim
// bands) — a stylistic constant, not a measured value.
const PLATE_RX = 14
// JetBrains Mono cap-height ratio (title chrome convention) turns measured cap
// bands into font sizes.
const CAP_RATIO = 0.73
// Reference scanline stroke, canvas px (divided by each station's effective
// transform scale below — the group transform scales the stroke too).
const GLYPH_STROKE_PX = 3.5
// Badge ring stroke, canvas px (settled ASCII maps ~3.5px).
const BADGE_STROKE_PX = 3.5
// Reference glyph anatomy (settled ASCII maps): every station glyph is a big
// circle outline (~93–98px) with a SMALL pictogram (~25–28% of the box —
// measured ~20×30px of sparse ink) centered inside it. The earlier 45% reading
// drew 2–2.5× the reference's pictogram ink.
const GLYPH_CIRCLE_R = 11
const GLYPH_ICON_SCALE = 0.28

// Click choreography (measured f15 onsets, REVEAL_BEATS_SEC): card k pops at
// beat 2k+1 and badge k at 2k+2 — except station 3's badge rides its card's
// beat (too dim for its own beat in the recording), so the min() clamps
// stations ≥ 3 onto beat 5, and beat 6 reveals the caption clusters.
const cardClick = (i: number): number => Math.min(i * 2 + 1, 5)
const badgeClick = (i: number): number => Math.min(i * 2 + 2, 5)
const captionsClick = 6

// Icon resolution: registry lookup with the visible generic fallback on a miss
// (never undefined into v-html). The warn surfaces wrong keys in dev.
function iconFor(card: PillarCard): string {
  const path = iconPath(card.icon)
  if (path) return path
  console.warn(`[PillarRow] unknown icon key "${card.icon}" — rendering ICON_FALLBACK`)
  return ICON_FALLBACK
}

// Lucide 24-box → measured glyph square (the enclosing circle fills it).
function glyphTransform(i: number): string {
  const g = layout.value.cards[i]!.glyph
  const half = g.size / 2
  const scale = Number((g.size / 24).toFixed(6))
  return `translate(${g.cx - half} ${g.cy - half}) scale(${scale})`
}

// The group transform scales stroke widths with the content, so the measured
// ~3.5px canvas ink weight must be divided by the station's effective scale.
function glyphStroke(i: number): number {
  const g = layout.value.cards[i]!.glyph
  return Number((GLYPH_STROKE_PX / (g.size / 24)).toFixed(6))
}

// Circle-enclosed pictogram: big circle outline + the registry icon scaled
// into the center; the inner group carries its own stroke so the pictogram
// keeps the same canvas-px ink weight at its reduced scale.
function glyphMarkup(card: PillarCard, i: number): string {
  const icon = iconFor(card)
  const inner = Number((glyphStroke(i) / GLYPH_ICON_SCALE).toFixed(6))
  const pad = Number(((24 - 24 * GLYPH_ICON_SCALE) / 2).toFixed(6))
  const rot = card.iconRotate ? ` rotate(${card.iconRotate} 12 12)` : ''
  return (
    `<circle cx="12" cy="12" r="${GLYPH_CIRCLE_R}"/>` +
    `<g transform="translate(${pad} ${pad}) scale(${GLYPH_ICON_SCALE})${rot}" stroke-width="${inner}">${icon}</g>`
  )
}

// Pin attributes for a measured run at its rendered font size.
function runPin(text: string, capHeight: number, textLength: number) {
  return pinAttrs(text, capHeight / CAP_RATIO, textLength)
}
</script>

<template>
  <svg
    class="pillar-row"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${cards.length}-pillar card row`"
  >
    <defs>
      <!-- The reference settled frame is a Lanczos-downscaled video still:
           every edge is slightly soft. A sub-pixel Gaussian blur reproduces
           that softness; crisp SVG edges otherwise read as halo ghosts in
           the diff. -->
      <filter id="sf-video-soft" x="-5%" y="-5%" width="110%" height="110%">
        <feGaussianBlur stdDeviation="0.55" />
      </filter>
    </defs>
    <g filter="url(#sf-video-soft)">
    <!-- One sibling group per station: plate + icon glyph + label rows rise
         together on the card's beat (fade/rise per StairChain convention). -->
    <g
      v-for="(card, i) in cards"
      :key="card.id"
      v-click="cardClick(i)"
      class="sf-card"
    >
      <!-- Near-black organizing plate: the settled frame's plates are solid
           dim knockouts (dim-mask means ≈ luma 13) with per-station tint and
           no visible stroke — never a light-gray card. -->
      <rect
        class="sf-plate"
        :x="layout.cards[i]!.plate.x"
        :y="layout.cards[i]!.plate.y"
        :width="layout.cards[i]!.plate.w"
        :height="layout.cards[i]!.plate.h"
        :rx="PLATE_RX"
        :fill="PLATE_FILLS[i]!"
      />
      <!-- Icon glyph: circle-enclosed pictogram (settled ASCII maps) in the
           station's measured hue at the measured ~3.5px canvas ink weight. -->
      <g
        class="sf-glyph"
        :transform="glyphTransform(i)"
        fill="none"
        :stroke="GLYPH_STROKES[i]!"
        :stroke-width="glyphStroke(i)"
        stroke-linecap="round"
        stroke-linejoin="round"
        v-html="glyphMarkup(card, i)"
      />
      <!-- Label row A (hue-matched, bold) and row B (dim gray secondary) —
           both fade on their card's tail (no extra click). -->
      <text
        class="sf-label"
        :x="layout.cards[i]!.label.x"
        :y="layout.cards[i]!.label.baselineY"
        text-anchor="start"
        font-weight="700"
        :font-size="layout.cards[i]!.label.capHeight / CAP_RATIO"
        v-bind="runPin(card.label, layout.cards[i]!.label.capHeight, layout.cards[i]!.label.textLength)"
        :fill="LABEL_FILLS[i]!"
      >{{ card.label }}</text>
      <text
        class="sf-sublabel"
        :x="layout.cards[i]!.sublabel.x"
        :y="layout.cards[i]!.sublabel.baselineY"
        text-anchor="start"
        :font-size="layout.cards[i]!.sublabel.capHeight / CAP_RATIO"
        v-bind="runPin(card.sublabel, layout.cards[i]!.sublabel.capHeight, layout.cards[i]!.sublabel.textLength)"
        :fill="SUBLABEL_FILL"
      >{{ card.sublabel }}</text>
    </g>

    <!-- Companion accent badges: thin circle outlines straddling the plate's
         right edge, each carrying a bright mini-icon at its center (measured
         markup from the layout module, currentColor = the station accent);
         each pops on its own beat (station 3 rides beat 5). -->
    <g
      v-for="(card, i) in cards"
      :key="`${card.id}-badge`"
      v-click="badgeClick(i)"
      class="sf-badge"
    >
      <circle
        class="sf-badge-ring"
        :cx="layout.cards[i]!.badge.cx"
        :cy="layout.cards[i]!.badge.cy"
        :r="layout.cards[i]!.badge.r"
        fill="none"
        :stroke="BADGE_ACCENTS[i]!"
        :stroke-width="BADGE_STROKE_PX"
      />
      <g
        class="sf-badge-icon"
        :transform="`translate(${layout.cards[i]!.badge.cx} ${layout.cards[i]!.badge.cy})`"
        :color="BADGE_ACCENTS[i]!"
        v-html="layout.cards[i]!.badge.icon"
      />
    </g>

    <!-- Measured caption clusters below the card band (per station): row 1
         (badge-hued) on the caption beat, row 2 (gray) staggering ~466ms
         after (onsets 1.467s → ≈1.933s). -->
    <g v-click="captionsClick" class="sf-rows">
      <text
        v-for="(card, i) in cards"
        :key="`caption-${card.id}`"
        class="sf-row"
        :x="layout.cards[i]!.caption.x"
        :y="layout.cards[i]!.caption.baselineY"
        text-anchor="start"
        font-weight="700"
        :font-size="layout.cards[i]!.caption.capHeight / CAP_RATIO"
        v-bind="runPin(card.caption, layout.cards[i]!.caption.capHeight, layout.cards[i]!.caption.textLength)"
        :fill="CAPTION_FILLS[i]!"
      >{{ card.caption }}</text>
      <text
        v-for="(card, i) in cards"
        :key="`meta-${card.id}`"
        class="sf-row sf-row-2"
        :x="layout.cards[i]!.captionMeta.x"
        :y="layout.cards[i]!.captionMeta.baselineY"
        text-anchor="start"
        :font-size="layout.cards[i]!.captionMeta.capHeight / CAP_RATIO"
        v-bind="runPin(card.captionMeta, layout.cards[i]!.captionMeta.capHeight, layout.cards[i]!.captionMeta.textLength)"
        :fill="META_FILLS[i]!"
      >{{ card.captionMeta }}</text>
    </g>
    <!-- Shared title chrome: seg05 title band; white head x0.2809–0.4359,
         green tail x0.4359–0.7203 rendered as measured per-token runs. -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :tokens="titleTokens"
      :cap-height="titleCapHeight"
      :cap-top="titleCapTop"
    />
    </g>
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
 * badges interleaved, labels fade on their own tail, and the caption clusters
 * wave in last with row 2 lagging row 1 by ~466ms. Transition is taken from the
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

/* Label fades ride their card's beat on a short delay — their own tail, not
 * their own click (the f15 frames never show labels on independent beats). */
.sf-label,
.sf-sublabel {
  transition: opacity 300ms ease-out 120ms;
}

.sf-card.slidev-vclick-hidden .sf-label,
.sf-card.slidev-vclick-hidden .sf-sublabel {
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
  transition: opacity 400ms ease-out 466ms;
}

.sf-rows.slidev-vclick-hidden .sf-row-2 {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-card,
  .sf-badge,
  .sf-label,
  .sf-sublabel,
  .sf-rows,
  .sf-row,
  .sf-row-2 {
    transition: none;
    animation: none;
  }
}
</style>
