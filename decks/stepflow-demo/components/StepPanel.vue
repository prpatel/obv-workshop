<script setup lang="ts">
import { computed } from 'vue'
import {
  revealPlan,
  stepPanelLayout,
  STEP_PANEL_ORANGE,
  STEP_PANEL_PALETTE,
  STEP_PANEL_PLATE_STROKE,
  STEP_PANEL_ROW_FILL,
  STEP_PANEL_SEED,
  type Box,
  type StepPanelData,
  type StepRowRect,
  type StepTone,
} from './stepflow/stepPanel'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'
import { CHROME_GREEN, pinAttrs, TITLE_WHITE, titleFontSize } from './stepflow/chrome'

/**
 * The seg15 four-step panel family: blue+white header chip (pre-clip state,
 * pops on slide entry without consuming a click), plate outline sweep, three
 * numbered sub-block rows each followed by its text within the beat window,
 * orange bottom-left and amber bottom-right annotation groups, and a
 * chrome-green closing burst over the two-tone title (green run FIRST —
 * the accentFirst convention). Geometry and click mapping come from the
 * measured module (stepPanel.ts); the reveal is zero-JS destination-state
 * CSS with instant backward nav.
 */
const props = withDefaults(defineProps<{
  /** Row payloads in reveal order (the measured plate holds 1..3). */
  data?: StepPanelData
  /** Partial palette merged over the deck preset. */
  palette?: StepFlowPaletteOverride
  /** White title run (sheet: 'to spec-driven shipping'). */
  title?: string
  /** Chrome-green title run, rendered FIRST (sheet: 'vibe coding'). */
  titleAccent?: string
  /** White chip label (sheet: 'VIBE CODING'). */
  chipLabel?: string
}>(), {
  data: () => STEP_PANEL_SEED,
  palette: () => ({}),
  title: 'to spec-driven shipping',
  titleAccent: 'vibe coding',
  chipLabel: 'VIBE CODING',
})

const p = computed(() => resolvePalette({ ...STEP_PANEL_PALETTE, ...props.palette }))
const l = computed(() => stepPanelLayout(props.data))
const plan = computed(() => revealPlan(props.data.rows.length))

// Tone → token: measured family hues are the defaults (STEP_PANEL_PALETTE),
// and an explicit palette prop overrides any slot (override wins). Optional
// slots fall back to `accent` when overridden to undefined.
function toneFill(tone: StepTone): string {
  if (tone === 'alt') return p.value.accentAlt ?? p.value.accent
  if (tone === 'tertiary') return p.value.accentTertiary ?? p.value.accent
  if (tone === 'quaternary') return p.value.accentQuaternary ?? p.value.accent
  return p.value.accent
}

// Cap band bottoms are baselines; cap heights size the mono runs. Each run
// pins spacing-only to its measured ink extent (glyphs never squeeze).
function fontSizeOf(box: Box): number {
  return titleFontSize(box.h)
}

function baselineOf(box: Box): number {
  return box.y + box.h
}

// Sublines are seed-level (not trace-measured): ~72% of the line's size,
// riding just below its baseline inside the band.
function subBaseline(box: Box, bandH: number): number {
  return baselineOf(box) + bandH * 0.18
}

// Sheet-measured terminal glyph → SVG transform mapping the 24-unit Lucide
// box onto the measured ink bbox.
const glyphTransform = computed(() => {
  const g = l.value.annotation.leftGlyph
  return `translate(${g.x} ${g.y}) scale(${g.w / 24} ${g.h / 24})`
})

// Closing-burst glow box: the full title band plus a soft margin.
const burstBox = computed(() => {
  const { accentInk, whiteInk } = l.value.title
  const margin = 32
  return {
    x: accentInk.x - margin,
    y: accentInk.y - margin,
    w: whiteInk.x + whiteInk.w - accentInk.x + margin * 2,
    h: accentInk.h + margin * 2,
  }
})

function rowPin(row: StepRowRect, key: 'label' | 'title') {
  const box = key === 'label' ? row.label : row.title
  return pinAttrs(row[key], fontSizeOf(box), box.w)
}
</script>

<template>
  <svg
    class="steppanel"
    :viewBox="`0 0 ${l.viewBox.width} ${l.viewBox.height}`"
    role="img"
    :aria-label="`${l.rows.length}-step process panel`"
  >
    <defs>
      <filter id="sf-step-burst-blur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="18" />
      </filter>
    </defs>

    <!-- Header chip: settled pre-clip state (f0001) — it pops on slide entry
         via CSS animation, consuming no click (the recording never shows it
         from empty; beat 1 is the plate). -->
    <g class="sf-chip">
      <rect
        class="sf-chip-mark"
        :x="l.chip.mark.x"
        :y="l.chip.mark.y"
        :width="l.chip.mark.w"
        :height="l.chip.mark.h"
        rx="8"
        :fill="p.accent"
      />
      <text
        class="sf-chip-label"
        :x="l.chip.label.x"
        :y="baselineOf(l.chip.label)"
        :font-size="fontSizeOf(l.chip.label)"
        v-bind="pinAttrs(chipLabel, fontSizeOf(l.chip.label), l.chip.label.w)"
        text-anchor="start"
        font-weight="700"
        :fill="TITLE_WHITE"
      >{{ chipLabel }}</text>
    </g>

    <!-- Plate outline: the 1.2s left→right top-edge draw re-paced to one
         click (sweep on the destination state). -->
    <g v-click="plan.plateClick" :data-sf-click="plan.plateClick" class="sf-plate">
      <rect
        class="sf-plate-outline"
        :x="l.plate.x"
        :y="l.plate.y"
        :width="l.plate.w"
        :height="l.plate.h"
        fill="none"
        :stroke="STEP_PANEL_PLATE_STROKE"
        stroke-width="2"
      />
    </g>

    <!-- One sibling group per row (never nested v-clicks): the band lands
         instantly on its click and its label/title/sub fade in within the
         beat window (~150ms behind, the f15 trace's text-after-band lag). -->
    <g
      v-for="(row, i) in l.rows"
      :key="row.id"
      v-click="plan.rowClicks[i]"
      :data-sf-click="plan.rowClicks[i]"
      class="sf-row"
    >
      <rect
        class="sf-band"
        :x="row.band.x"
        :y="row.band.y"
        :width="row.band.w"
        :height="row.band.h"
        rx="8"
        :fill="STEP_PANEL_ROW_FILL"
      />
      <text
        class="sf-rowtext"
        :x="row.label.x"
        :y="baselineOf(row.label)"
        :font-size="fontSizeOf(row.label)"
        v-bind="rowPin(row, 'label')"
        text-anchor="start"
        :fill="toneFill(row.tone)"
      >{{ row.label }}</text>
      <text
        class="sf-rowtext"
        :x="row.title.x"
        :y="baselineOf(row.title)"
        :font-size="fontSizeOf(row.title)"
        v-bind="rowPin(row, 'title')"
        text-anchor="start"
        :fill="TITLE_WHITE"
      >{{ row.title }}</text>
      <text
        v-if="row.sub"
        class="sf-rowtext sf-sub"
        :x="row.title.x"
        :y="subBaseline(row.title, row.band.h)"
        :font-size="fontSizeOf(row.title) * 0.72"
        text-anchor="start"
        :fill="p.subtext"
      >{{ row.sub }}</text>
    </g>

    <!-- Bottom-left orange annotation group: edge bar, terminal glyph, white
         line (+ dim seed subline), one pop on its click. -->
    <g v-click="plan.annotationClick" :data-sf-click="plan.annotationClick" class="sf-annotation">
      <rect
        class="sf-annotation-part"
        :x="l.annotation.leftBar.x"
        :y="l.annotation.leftBar.y"
        :width="l.annotation.leftBar.w"
        :height="l.annotation.leftBar.h"
        :fill="STEP_PANEL_ORANGE"
      />
      <g
        class="sf-annotation-part"
        :transform="glyphTransform"
        :style="{ color: STEP_PANEL_ORANGE }"
      >
        <g
          v-html="iconPath('square-terminal') ?? ICON_FALLBACK"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
      <text
        class="sf-annotation-part"
        :x="l.annotation.leftText.x"
        :y="baselineOf(l.annotation.leftText)"
        :font-size="fontSizeOf(l.annotation.leftText)"
        v-bind="pinAttrs(data.annotationLeft.line, fontSizeOf(l.annotation.leftText), l.annotation.leftText.w)"
        text-anchor="start"
        :fill="TITLE_WHITE"
      >{{ data.annotationLeft.line }}</text>
      <text
        v-if="data.annotationLeft.sub"
        class="sf-annotation-part sf-sub"
        :x="l.annotation.leftText.x"
        :y="subBaseline(l.annotation.leftText, l.annotation.leftBar.h)"
        :font-size="fontSizeOf(l.annotation.leftText) * 0.72"
        text-anchor="start"
        :fill="p.subtext"
      >{{ data.annotationLeft.sub }}</text>
    </g>

    <!-- Bottom-right amber annotation group: the '11' bar pair, the amber
         digit run, and the white line — one pop on its click. -->
    <g v-click="plan.amberClick" :data-sf-click="plan.amberClick" class="sf-annotation">
      <rect
        class="sf-annotation-part"
        :x="l.annotation.amberBars[0].x"
        :y="l.annotation.amberBars[0].y"
        :width="l.annotation.amberBars[0].w"
        :height="l.annotation.amberBars[0].h"
        :fill="toneFill('quaternary')"
      />
      <rect
        class="sf-annotation-part"
        :x="l.annotation.amberBars[1].x"
        :y="l.annotation.amberBars[1].y"
        :width="l.annotation.amberBars[1].w"
        :height="l.annotation.amberBars[1].h"
        :fill="toneFill('quaternary')"
      />
      <text
        class="sf-annotation-part"
        :x="l.annotation.digits.x"
        :y="baselineOf(l.annotation.digits)"
        :font-size="fontSizeOf(l.annotation.digits)"
        v-bind="pinAttrs(data.dateDigits, fontSizeOf(l.annotation.digits), l.annotation.digits.w)"
        text-anchor="start"
        :fill="toneFill('quaternary')"
      >{{ data.dateDigits }}</text>
      <text
        class="sf-annotation-part"
        :x="l.annotation.rightText.x"
        :y="baselineOf(l.annotation.rightText)"
        :font-size="fontSizeOf(l.annotation.rightText)"
        v-bind="pinAttrs(data.annotationRight.line, fontSizeOf(l.annotation.rightText), l.annotation.rightText.w)"
        text-anchor="start"
        :fill="TITLE_WHITE"
      >{{ data.annotationRight.line }}</text>
    </g>

    <!-- Two-tone title: chrome-green run FIRST, white tail, both pinned to
         their measured inks. Static (present from f0001). -->
    <g class="sf-title">
      <text
        class="sf-title-run"
        :x="l.title.accentInk.x"
        :y="baselineOf(l.title.accentInk)"
        :font-size="fontSizeOf(l.title.accentInk)"
        v-bind="pinAttrs(titleAccent, fontSizeOf(l.title.accentInk), l.title.accentInk.w)"
        text-anchor="start"
        :fill="CHROME_GREEN"
      >{{ titleAccent }}</text>
      <text
        class="sf-title-run"
        :x="l.title.whiteInk.x"
        :y="baselineOf(l.title.whiteInk)"
        :font-size="fontSizeOf(l.title.whiteInk)"
        v-bind="pinAttrs(title, fontSizeOf(l.title.whiteInk), l.title.whiteInk.w)"
        text-anchor="start"
        :fill="TITLE_WHITE"
      >{{ title }}</text>
    </g>

    <!-- Chrome-green closing burst: a blurred glow over the title band that
         flashes and decays on the final click (the 5.867s re-brighten). -->
    <g v-click="plan.burstClick" :data-sf-click="plan.burstClick" class="sf-burst">
      <rect
        class="sf-burst-glow"
        :x="burstBox.x"
        :y="burstBox.y"
        :width="burstBox.w"
        :height="burstBox.h"
        :fill="CHROME_GREEN"
        filter="url(#sf-step-burst-blur)"
      />
    </g>
  </svg>
</template>

<style scoped>
.steppanel {
  display: block;
  width: 100%;
  height: auto;
}

.steppanel text {
  /* Mono stack until the face is confirmed (StepFlow's open question #1). */
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Measured motion (seg15 f15 trace): the plate outline sweeps left→right on
 * click 1 (the 1.2–1.333s draw); each row band lands instantly on its click
 * with its text fading in ~150ms behind (the text-after-band beat lag);
 * annotation groups pop on clicks 5–6; the title glow flashes and decays on
 * click 7. The transition lives on the destination state and the hidden
 * state's transition:none makes backward nav instant — the locked decision,
 * zero JS. Scoped selectors (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target transition.
 */

/* Plate: scaleX sweep from the left edge (transform-box pins the origin to
 * the outline's own left). */
.sf-plate {
  transition: none;
}

.sf-plate.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

.sf-plate-outline {
  transform-box: fill-box;
  transform-origin: left;
  transition: transform 300ms ease-out;
}

.sf-plate.slidev-vclick-hidden .sf-plate-outline {
  transform: scaleX(0);
  transition: none;
}

/* Rows: instant group toggle; the band is there on reveal, the texts ride
 * the beat window ~150ms behind. */
.sf-row {
  transition: none;
}

.sf-row.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

.sf-rowtext {
  transition: opacity 250ms ease-out 150ms;
}

.sf-row.slidev-vclick-hidden .sf-rowtext {
  opacity: 0;
  transition: none;
}

/* Annotation groups: quick 250ms pop on their clicks. */
.sf-annotation {
  transition: opacity 250ms ease-out;
}

.sf-annotation.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

/* Chip: pre-clip state — pops once on slide entry (display:none → visible
 * restarts the animation, so re-entering the slide replays the pop).
 * The burst glow decays via keyframes on the revealed state. */
.sf-chip {
  transform-box: fill-box;
  transform-origin: center;
  animation: sf-chip-pop 400ms ease-out both;
}

@keyframes sf-chip-pop {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.sf-burst {
  transition: none;
}

.sf-burst.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

.sf-burst-glow {
  animation: sf-burst-flash 900ms ease-out both;
}

@keyframes sf-burst-flash {
  0% {
    opacity: 0;
  }
  25% {
    opacity: 0.32;
  }
  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .steppanel *,
  .steppanel {
    animation: none !important;
    transition: none !important;
  }
}
</style>
