<script setup lang="ts">
import { computed } from 'vue'
import {
  revealPlan,
  stepPanelLayout,
  STEP_PANEL_BADGE,
  STEP_PANEL_TITLE_WHITE,
  STEP_PANEL_BADGE_GRAY,
  STEP_PANEL_BADGE_LIME,
  STEP_PANEL_DIGIT_DIM,
  STEP_PANEL_DIGIT_GOLD,
  STEP_PANEL_DIM_TEXT,
  STEP_PANEL_ORANGE,
  STEP_PANEL_PALETTE,
  STEP_PANEL_PLATE_STROKE,
  STEP_PANEL_ROW_FILL,
  STEP_PANEL_ROW_TEXT,
  STEP_PANEL_SEED,
  type Box,
  type MeasuredBox,
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
  /** White title run (sheet: 'trend, actual'). */
  title?: string
  /** Chrome-green title run, rendered FIRST (sheet: 'TUI skin'). */
  titleAccent?: string
  /** White chip label (sheet: 'VIBE CODING'). */
  chipLabel?: string
}>(), {
  data: () => STEP_PANEL_SEED,
  palette: () => ({}),
  title: 'trend, actual',
  titleAccent: 'TUI skin',
  chipLabel: 'VIBE CODING',
})

const p = computed(() => resolvePalette({ ...STEP_PANEL_PALETTE, ...props.palette }))
const l = computed(() => stepPanelLayout(props.data))
const plan = computed(() => revealPlan(props.data.rows.length))

/** Per-token title splits: 'TUI skin' → ['TUI','skin']; 'trend, actual' → ['trend,','actual']. Each token pins its own measured box. */
const accentWords = computed<[string, string]>(() => {
  const parts = props.titleAccent.trim().split(/\s+/)
  return [parts[0] ?? '', parts.slice(1).join(' ')]
})
const whiteWords = computed<[string, string]>(() => {
  const idx = props.title.indexOf(',')
  if (idx < 0) return [props.title, '']
  return [props.title.slice(0, idx + 1), props.title.slice(idx + 1).trim()]
})

// The settled frame's top-right badge is static corner ink (no pill): two
// lime glyph bars + a pale gray mark, measured in STEP_PANEL_BADGE.
function badgeBox(b: MeasuredBox): Box {
  return { x: b.xFrac * 1920, y: b.yFrac * 1080, w: b.wFrac * 1920, h: b.hFrac * 1080 }
}
const badge = {
  bars: [badgeBox(STEP_PANEL_BADGE.bars[0]), badgeBox(STEP_PANEL_BADGE.bars[1])],
  mark: badgeBox(STEP_PANEL_BADGE.mark),
}

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

/**
 * Measured gold digit pair left of the date run: frame column/row profiles
 * decode a flag+stem+serif '1' and a two-loop '8' at cap ≈72px — glyph
 * digits, not the solid bars the draft rendered.
 */
const GOLD_PAIR = '18'

// Settled ink runs ~20% denser than default mono bold renders; a hairline
// same-color stroke under paint-order fattens each run to measured weight.
// (glyph-condensing textLength squeeze was measured and rejected: it starves ink
// and drops band SSIM — the G7 wave's no-glyph-squeezing decision holds.)
function fatten<T extends Record<string, unknown>>(attrs: T, fill: string, width: number, strokeOpacity?: number) {
  return {
    ...attrs,
    stroke: fill,
    'stroke-width': width,
    ...(strokeOpacity === undefined ? {} : { 'stroke-opacity': strokeOpacity }),
    'paint-order': 'stroke fill',
  }
}

// Sheet-measured terminal glyph → SVG transform mapping the 24-unit Lucide
// box onto the measured ink bbox.
const glyphTransform = computed(() => {
  const g = l.value.annotation.leftGlyph
  return `translate(${g.x} ${g.y}) scale(${g.w / 24} ${g.h / 24})`
})

// Closing-burst glow box: the full title band plus a soft margin.
const burstBox = computed(() => {
  const { accentWord1, whiteWord2 } = l.value.title
  const margin = 32
  return {
    x: accentWord1.x - margin,
    y: accentWord1.y - margin,
    w: whiteWord2.x + whiteWord2.w - accentWord1.x + margin * 2,
    h: accentWord1.h + margin * 2,
  }
})

function rowPin(row: StepRowRect, key: 'label' | 'title') {
  const box = key === 'label' ? row.labelBox : row.titleBox
  const text = key === 'label' ? row.label : row.title
  const fill = key === 'label' ? toneFill(row.tone) : STEP_PANEL_ROW_TEXT
  return fatten(pinAttrs(text, fontSizeOf(box), box.w), fill, 0.45)
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

    <!-- Top-right badge: settled static corner ink (lime bars + gray mark). -->
    <g class="sf-badge">
      <rect :x="badge.bars[0].x" :y="badge.bars[0].y" :width="badge.bars[0].w" :height="badge.bars[0].h" :fill="STEP_PANEL_BADGE_LIME" />
      <rect :x="badge.bars[1].x" :y="badge.bars[1].y" :width="badge.bars[1].w" :height="badge.bars[1].h" :fill="STEP_PANEL_BADGE_LIME" />
      <rect
        :x="badge.mark.x"
        :y="badge.mark.y"
        :width="badge.mark.w"
        :height="badge.mark.h"
        rx="6"
        fill="none"
        :stroke="STEP_PANEL_BADGE_GRAY"
        stroke-width="2.5"
      />
    </g>

    <!-- Header chip: settled pre-clip state (f0001) — it pops on slide entry
         via CSS animation, consuming no click (the recording never shows it
         from empty; beat 1 is the plate). The mark is dark with blue
         terminal-grid strokes in the settled frame, not a solid blue fill. -->
    <g class="sf-chip">
      <rect
        class="sf-chip-mark"
        :x="l.chip.mark.x"
        :y="l.chip.mark.y"
        :width="l.chip.mark.w"
        :height="l.chip.mark.h"
        rx="8"
        fill="#0e0e12"
        :stroke="p.accent"
        stroke-width="2.5"
      />
      <line
        :x1="l.chip.mark.x + l.chip.mark.w * 0.18" :y1="l.chip.mark.y + l.chip.mark.h * 0.38"
        :x2="l.chip.mark.x + l.chip.mark.w * 0.82" :y2="l.chip.mark.y + l.chip.mark.h * 0.38"
        :stroke="p.accent" stroke-width="2" opacity="0.55"
      />
      <line
        :x1="l.chip.mark.x + l.chip.mark.w * 0.18" :y1="l.chip.mark.y + l.chip.mark.h * 0.62"
        :x2="l.chip.mark.x + l.chip.mark.w * 0.82" :y2="l.chip.mark.y + l.chip.mark.h * 0.62"
        :stroke="p.accent" stroke-width="2" opacity="0.55"
      />
      <text
        class="sf-chip-label"
        :x="l.chip.label.x"
        :y="baselineOf(l.chip.label)"
        :font-size="fontSizeOf(l.chip.label)"
        v-bind="pinAttrs(chipLabel, fontSizeOf(l.chip.label), l.chip.label.w)"
        text-anchor="start"
        :fill="STEP_PANEL_TITLE_WHITE"
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
        :x="row.labelBox.x"
        :y="baselineOf(row.labelBox)"
        :font-size="fontSizeOf(row.labelBox)"
        v-bind="rowPin(row, 'label')"
        text-anchor="start"
        :fill="toneFill(row.tone)"
      >{{ row.label }}</text>
      <text
        class="sf-rowtext"
        :x="row.titleBox.x"
        :y="baselineOf(row.titleBox)"
        :font-size="fontSizeOf(row.titleBox)"
        v-bind="rowPin(row, 'title')"
        text-anchor="start"
        :fill="STEP_PANEL_ROW_TEXT"
      >{{ row.title }}</text>
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
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
      <text
        class="sf-annotation-part"
        :x="l.annotation.leftText.x"
        :y="baselineOf(l.annotation.leftText)"
        :font-size="fontSizeOf(l.annotation.leftText)"
        v-bind="fatten(pinAttrs(data.annotationLeft.line, fontSizeOf(l.annotation.leftText), l.annotation.leftText.w), TITLE_WHITE, 0.6)"
        text-anchor="start"
        :fill="TITLE_WHITE"
      >{{ data.annotationLeft.line }}</text>
    </g>

    <!-- Bottom-right amber annotation group: the gold '18' digit pair, the
         dim-gold date run, and the white line — one pop on its click. -->
    <g v-click="plan.amberClick" :data-sf-click="plan.amberClick" class="sf-annotation">
      <text
        class="sf-annotation-part"
        :x="l.annotation.goldPair.x"
        :y="baselineOf(l.annotation.goldPair)"
        :font-size="fontSizeOf(l.annotation.goldPair)"
        v-bind="fatten(pinAttrs(GOLD_PAIR, fontSizeOf(l.annotation.goldPair), l.annotation.goldPair.w), STEP_PANEL_DIGIT_GOLD, 2)"
        text-anchor="start"
        :fill="STEP_PANEL_DIGIT_GOLD"
      >{{ GOLD_PAIR }}</text>
      <text
        class="sf-annotation-part"
        :x="l.annotation.digits.x"
        :y="baselineOf(l.annotation.digits)"
        :font-size="fontSizeOf(l.annotation.digits)"
        v-bind="fatten(pinAttrs(data.dateDigits, fontSizeOf(l.annotation.digits), l.annotation.digits.w), STEP_PANEL_DIGIT_DIM, 0.45)"
        text-anchor="start"
        :fill="STEP_PANEL_DIGIT_DIM"
      >{{ data.dateDigits }}</text>
      <text
        class="sf-annotation-part"
        :x="l.annotation.rightText.x"
        :y="baselineOf(l.annotation.rightText)"
        :font-size="fontSizeOf(l.annotation.rightText)"
        v-bind="fatten(pinAttrs(data.annotationRight.line, fontSizeOf(l.annotation.rightText), l.annotation.rightText.w), STEP_PANEL_DIM_TEXT, 0.45)"
        text-anchor="start"
        :fill="STEP_PANEL_DIM_TEXT"
      >{{ data.annotationRight.line }}</text>
    </g>
    <!-- Chrome-green closing burst: a blurred glow painted BEHIND the title
         band (the settled frame keeps a faint halo while the white tail stays
         white). It flashes and decays on the final click (5.867s rebrighten). -->
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

    <!-- Two-tone title: chrome-green words FIRST (with their trailing
         comma), then white words — every token pinned to its own measured
         ink box so cell pitch never drifts. The green words carry a soft
         halo copy behind them (wide faint stroke + blur): the reference
         compression bleed sits around the green glyphs only. Static
         (from f0001). -->
    <g class="sf-title">
      <text
        class="sf-title-halo"
        :x="l.title.accentWord1.x"
        :y="baselineOf(l.title.accentWord1)"
        :font-size="fontSizeOf(l.title.accentWord1)"
        v-bind="pinAttrs(accentWords[0], fontSizeOf(l.title.accentWord1), l.title.accentWord1.w)"
        text-anchor="start"
        fill="none"
        :stroke="CHROME_GREEN"
        stroke-width="8"
        stroke-opacity="0.22"
        filter="url(#sf-step-burst-blur)"
      >{{ accentWords[0] }}</text>
      <text
        class="sf-title-halo"
        :x="l.title.accentWord2.x"
        :y="baselineOf(l.title.accentWord2)"
        :font-size="fontSizeOf(l.title.accentWord2)"
        v-bind="pinAttrs(accentWords[1], fontSizeOf(l.title.accentWord2), l.title.accentWord2.w)"
        text-anchor="start"
        fill="none"
        :stroke="CHROME_GREEN"
        stroke-width="8"
        stroke-opacity="0.22"
        filter="url(#sf-step-burst-blur)"
      >{{ accentWords[1] }}</text>
      <text
        class="sf-title-run"
        :x="l.title.accentWord1.x"
        :y="baselineOf(l.title.accentWord1)"
        :font-size="fontSizeOf(l.title.accentWord1)"
        v-bind="fatten(pinAttrs(accentWords[0], fontSizeOf(l.title.accentWord1), l.title.accentWord1.w), CHROME_GREEN, 3.6)"
        text-anchor="start"
        :fill="CHROME_GREEN"
      >{{ accentWords[0] }}</text>
      <text
        class="sf-title-run"
        :x="l.title.accentWord2.x"
        :y="baselineOf(l.title.accentWord2)"
        :font-size="fontSizeOf(l.title.accentWord2)"
        v-bind="fatten(pinAttrs(accentWords[1], fontSizeOf(l.title.accentWord2), l.title.accentWord2.w), CHROME_GREEN, 3.6)"
        text-anchor="start"
        :fill="CHROME_GREEN"
      >{{ accentWords[1] }}</text>
      <text
        class="sf-title-run"
        :x="l.title.accentComma.x"
        :y="baselineOf(l.title.accentWord1)"
        :font-size="fontSizeOf(l.title.accentWord1)"
        :fill="CHROME_GREEN"
      >,</text>
      <text
        class="sf-title-run"
        :x="l.title.whiteWord1.x"
        :y="baselineOf(l.title.whiteWord1)"
        :font-size="fontSizeOf(l.title.whiteWord1)"
        v-bind="fatten(pinAttrs(whiteWords[0], fontSizeOf(l.title.whiteWord1), l.title.whiteWord1.w), STEP_PANEL_TITLE_WHITE, 0.8)"
        text-anchor="start"
        :fill="STEP_PANEL_TITLE_WHITE"
      >{{ whiteWords[0] }}</text>
      <text
        class="sf-title-run"
        :x="l.title.whiteWord2.x"
        :y="baselineOf(l.title.whiteWord2)"
        :font-size="fontSizeOf(l.title.whiteWord2)"
        v-bind="fatten(pinAttrs(whiteWords[1], fontSizeOf(l.title.whiteWord2), l.title.whiteWord2.w), STEP_PANEL_TITLE_WHITE, 0.8)"
        text-anchor="start"
        :fill="STEP_PANEL_TITLE_WHITE"
      >{{ whiteWords[1] }}</text>
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
  /* Mono stack until the face is confirmed (StepFlow's open question #1).
   * Every settled seg15 run measures bold at equal cap height. */
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
  font-weight: 700;
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
  /* The settled frame keeps a faint green rim hugging the glyph cores
   * (~2.3k faint pixels in the title band) — carried by the per-glyph
   * stroke rims, not a rect wash. The rect only adds ambience. */
  100% {
    opacity: 0.06;
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
