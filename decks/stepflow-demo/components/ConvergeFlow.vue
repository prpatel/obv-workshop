<script setup lang="ts">
import { computed } from 'vue'
import {
  BAR_ORANGE,
  CONVERGE_SEED,
  FOOTER_GRAY,
  FUNNEL_ORANGE,
  LABEL_GRAY,
  convergeDrawPaths,
  convergeLayout,
  convergePalette,
} from './stepflow/converge'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import TitleChrome from './stepflow/TitleChrome.vue'
import { CAP_HEIGHT_RATIO, pinAttrs, titleFontSizeFromXHeight } from './stepflow/chrome'

const props = withDefaults(defineProps<{
  /** White lowercase title tail, e.g. 'and pipelines still matter'. */
  title?: string
  /** Chrome-green title LEAD — the sheet reads the green phrase first ('SQL'). */
  titleAccent?: string
  /** Gray base labels under the two columns. */
  labels?: { left?: string; right?: string }
  /** Orange tracked row under the funnel cone. */
  funnelLabel?: string
  /** The bare cyan text run under the left table. */
  leftLowerText?: string
  /** The blue text run across the right column's base. */
  slabText?: string
  /** Partial palette merged over the family's `convergePalette` preset. */
  palette?: StepFlowPaletteOverride
}>(), {
  title: CONVERGE_SEED.title,
  titleAccent: CONVERGE_SEED.titleAccent,
  labels: () => ({ ...CONVERGE_SEED.labels }),
  funnelLabel: CONVERGE_SEED.funnelLabel,
  leftLowerText: CONVERGE_SEED.leftLowerText,
  slabText: CONVERGE_SEED.slabText,
  palette: () => ({}),
})

// convergePalette is ConvergeFlow's family preset: settled right-column blue
// as `accent`, left-column cyan as `accentTertiary`. resolvePalette merges the
// default `cyanOnBlack` underneath, so an override can re-tint any field.
const p = computed(() => resolvePalette({ ...convergePalette, ...props.palette }))

// Geometry, schedule, and tones all come from the measured layout module —
// the seed carries content, not geometry (StairChain convention).
const layout = computed(() => convergeLayout())
const draws = computed(() => convergeDrawPaths(layout.value))

// Title chrome, measured off the seg11 settled frame: green 'SQL' lead ink
// x402.048–555.072 (153.024 wide, cap band y107–161.5) over the white
// lowercase tail 'and pipelines still matter'. The tail runs in the
// recording's PROPORTIONAL face — per-glyph boxes from the settled frame
// (layout.charRuns.titleTail) replace the old single pinned run, because
// JBM's mono advance cannot follow the ref rhythm ('I' pitch 15px vs 'P'
// 31px). The tail is sized from its measured x-height band (y118.5–161,
// 43px) with baseline 161. Token mode pins each ink run independently; the
// render weight is 700 with a fill-colored stroke (see the :deep rules).
const TITLE = {
  capHeight: 54.5,
  capTop: 107,
} as const

// Tail sizing through the deck's measured x-height ratio: the ref tail band
// is x-height 43px on baseline 161.
const TAIL = { xHeight: 43, baseline: 161 } as const
const tailFontSize = titleFontSizeFromXHeight(TAIL.xHeight)
const TAIL_TOKEN = {
  capHeight: tailFontSize * CAP_HEIGHT_RATIO,
  baseline: TAIL.baseline,
} as const

// Same proportional-face treatment for PIPELINES.
const slabChars = computed(() =>
  props.slabText === CONVERGE_SEED.slabText ? layout.value.charRuns.pipelines : [],
)
const titleTokens = computed(() => {
  const lead = { text: props.titleAccent, x: 402.048, width: 153.024, accent: true }
  if (props.title !== CONVERGE_SEED.title) {
    // Non-seed copy: no measured boxes — fall back to one uniform pin.
    return [lead, { text: props.title, x: 573, width: 948, capHeight: 51.1, capTop: 105.4 }]
  }
  return [
    lead,
    ...layout.value.charRuns.titleTail.map((c) => ({
      text: c.char,
      x: c.x,
      width: c.width,
      capHeight: TAIL_TOKEN.capHeight,
      capTop: TAIL_TOKEN.baseline - TAIL_TOKEN.capHeight,
    })),
  ]
})

// Typography through the deck's measured cap ratio; the colored text runs
// render at their measured ink runs (spacing-pinned, glyphs never squeeze).
const type = computed(() => {
  const runs = layout.value.textRuns
  return {
    labelSize: layout.value.labels.left.capHeight / CAP_HEIGHT_RATIO,
    funnelLabelSize: layout.value.funnel.label.capHeight / CAP_HEIGHT_RATIO,
    leftLowerSize: runs.leftLower.capHeight / CAP_HEIGHT_RATIO,
    slabSize: runs.slab.capHeight / CAP_HEIGHT_RATIO,
  }
})

/** Stroke widths re-measured off the settled frame's ink bands: the funnel
 * ring/cone ≈4.5px, the table outline band y625–631 (6px), the plate walls
 * x1268–1273/x1372–1377 (6px). Text renders with a matching stroke under the
 * fill (paint-order) to reach the recording's heavier face — see styles. */
const STROKES = {
  funnel: 4.5,
  table: 6,
  plate: 6,
} as const

/** Text stroke-fattening (px): the recording's face inks heavier than JBM
 * Bold on the bright chrome and colored runs (title lead mass 2818 vs our
 * bold 1986), while the dim gray labels and the funnel row run LIGHTER than
 * bold (label mass 1542 vs our bold+stroke 3097) — those render at their
 * base weight with no stroke. Values tuned against settled-frame ink-mass
 * ratios and region MADs. */
const INK_STROKE = {
  run: 2.5,
  sqlRun: 3,
} as const
</script>

<template>
  <svg
    class="convergeflow"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    aria-label="converge-branch flow diagram"
  >
    <!-- Funnel assembly: the clip opens mid-state (present from f0001), so
         this group renders in the INITIAL state and never animates. -->
    <g class="sf-funnel">
      <circle
        class="sf-funnel-ring"
        :cx="layout.funnel.ring.cx"
        :cy="layout.funnel.ring.cy"
        :r="layout.funnel.ring.r"
        fill="none"
        :stroke="FUNNEL_ORANGE"
        :stroke-width="STROKES.funnel"
      />
      <line
        class="sf-funnel-cone"
        :x1="layout.funnel.cone.left.x1"
        :y1="layout.funnel.cone.left.y1"
        :x2="layout.funnel.cone.left.x2"
        :y2="layout.funnel.cone.left.y2"
        :stroke="FUNNEL_ORANGE"
        :stroke-width="STROKES.funnel"
      />
      <line
        class="sf-funnel-cone"
        :x1="layout.funnel.cone.right.x1"
        :y1="layout.funnel.cone.right.y1"
        :x2="layout.funnel.cone.right.x2"
        :y2="layout.funnel.cone.right.y2"
        :stroke="FUNNEL_ORANGE"
        :stroke-width="STROKES.funnel"
      />
      <text
        v-if="funnelLabel"
        class="sf-funnel-label"
        :x="layout.funnel.label.x"
        :y="layout.funnel.label.baseline"
        :font-size="type.funnelLabelSize"
        :fill="FUNNEL_ORANGE"
        font-weight="500"
        v-bind="pinAttrs(funnelLabel, type.funnelLabelSize, layout.funnel.label.width)"
      >{{ funnelLabel }}</text>
    </g>

    <!-- Click 1 (t0.933): the left cyan table pops — outline first, then the
         interior dividers (≈+130ms) and cell-bar pairs (≈+200ms), matching
         the onsets.json build (outline 0.933 → contents 1.067/1.133). -->
    <g v-click="1" class="sf-col">
      <rect
        class="sf-el"
        :x="layout.columns.left.x"
        :y="layout.columns.left.y"
        :width="layout.columns.left.w"
        :height="layout.columns.left.h"
        fill="none"
        :stroke="p.accentTertiary"
        :stroke-width="STROKES.table"
      />
      <rect
        v-for="(divider, i) in layout.columns.leftTable.dividers"
        :key="`d${i}`"
        class="sf-el sf-d1"
        :x="divider.x"
        :y="divider.y"
        :width="divider.w"
        :height="divider.h"
        :fill="p.accentTertiary"
      />
      <rect
        v-for="(bar, i) in layout.columns.leftTable.bars"
        :key="`b${i}`"
        class="sf-el sf-d2"
        :x="bar.x"
        :y="bar.y"
        :width="bar.w"
        :height="bar.h"
        :fill="p.accentTertiary"
      />
    </g>

    <!-- Click 2 (t1.533): the bare cyan "SQL" run pops and the gray left
         label fades in (label's measured white onsets 1.667–1.8 ride ≈+130ms). -->
    <g v-click="2" class="sf-col">
      <text
        v-if="leftLowerText"
        class="sf-el"
        :x="layout.textRuns.leftLower.x"
        :y="layout.textRuns.leftLower.baseline"
        :font-size="type.leftLowerSize"
        :fill="p.accentTertiary"
        :stroke="p.accentTertiary"
        :stroke-width="INK_STROKE.sqlRun"
        paint-order="stroke"
        font-weight="700"
        v-bind="pinAttrs(leftLowerText, type.leftLowerSize, layout.textRuns.leftLower.width)"
      >{{ leftLowerText }}</text>
      <text
        v-if="labels.left"
        class="sf-el sf-d1"
        :x="layout.labels.left.x"
        :y="layout.labels.left.baseline"
        :font-size="type.labelSize"
        :fill="LABEL_GRAY"
        font-weight="500"
        v-bind="pinAttrs(labels.left, type.labelSize, layout.labels.left.width)"
      >{{ labels.left }}</text>
    </g>

    <!-- Click 3 (t2.2): the right blue plate pops, its two through-pins ride
         ≈+130ms (measured 2.267), the blue "PIPELINES" run ≈+200ms (2.4). -->
    <g v-click="3" class="sf-col">
      <rect
        class="sf-el"
        :x="layout.columns.right.plate.x"
        :y="layout.columns.right.plate.y"
        :width="layout.columns.right.plate.w"
        :height="layout.columns.right.plate.h"
        :rx="layout.columns.right.plate.rx"
        fill="none"
        :stroke="p.accent"
        :stroke-width="STROKES.plate"
      />
      <line
        v-for="pinX in [layout.columns.right.pins.x1, layout.columns.right.pins.x2]"
        :key="`p${pinX}`"
        class="sf-el sf-d1"
        :x1="pinX"
        :y1="layout.columns.right.pins.top"
        :x2="pinX"
        :y2="layout.columns.right.pins.bottom"
        :stroke="p.accent"
        :stroke-width="layout.columns.right.pins.width"
      />
      <line
        v-for="slotX in [layout.columns.right.slots.x1, layout.columns.right.slots.x2]"
        :key="`s${slotX}`"
        class="sf-el sf-d1"
        :x1="slotX"
        :y1="layout.columns.right.slots.top"
        :x2="slotX"
        :y2="layout.columns.right.slots.bottom"
        :stroke="p.accent"
        :stroke-width="layout.columns.right.slots.width"
      />
      <!-- PIPELINES runs in the recording's proportional face: one measured
           ink box per glyph (JBM's mono advance can't follow the ref rhythm). -->
      <text
        v-if="slabText && !slabChars.length"
        class="sf-el sf-d2"
        :x="layout.textRuns.slab.x"
        :y="layout.textRuns.slab.baseline"
        :font-size="type.slabSize"
        :fill="p.accent"
        :stroke="p.accent"
        :stroke-width="INK_STROKE.run"
        paint-order="stroke"
        font-weight="700"
        v-bind="pinAttrs(slabText, type.slabSize, layout.textRuns.slab.width)"
      >{{ slabText }}</text>
      <text
        v-for="(sc, i) in slabChars"
        v-else-if="slabChars.length"
        :key="`sc-${i}`"
        class="sf-el sf-d2"
        :x="sc.x"
        :y="layout.textRuns.slab.baseline"
        :font-size="type.slabSize"
        :fill="p.accent"
        :stroke="p.accent"
        :stroke-width="INK_STROKE.run"
        paint-order="stroke"
        font-weight="700"
      >{{ sc.char }}</text>
    </g>

    <!-- Click 4 (t2.533): the bar bracket DRAWS — f15 evidence shows the stem
         dropping first, then the line sweeping left→right (a stroke draw,
         not a fade) — and the gray right label fades (measured onset 2.533). -->
    <g v-click="4" class="sf-fade">
      <path
        class="sf-draw sf-draw-stem"
        :d="draws.stem.d"
        :style="{ '--sf-len': `${draws.stem.len}` }"
        :stroke="BAR_ORANGE"
        stroke-width="3.2"
      />
      <path
        class="sf-draw sf-draw-bracket"
        :d="draws.bracket.d"
        :style="{ '--sf-len': `${draws.bracket.len}` }"
        :stroke="BAR_ORANGE"
        :stroke-width="layout.bar.h"
      />
      <text
        v-if="labels.right"
        class="sf-label"
        :x="layout.labels.right.x"
        :y="layout.labels.right.baseline"
        :font-size="type.labelSize"
        :fill="LABEL_GRAY"
        font-weight="500"
        v-bind="pinAttrs(labels.right, type.labelSize, layout.labels.right.width)"
      >{{ labels.right }}</text>
    </g>

    <!-- Click 5 (t3.067): footer band + rising end ticks fade in last. -->
    <g v-click="5" class="sf-fade">
      <rect
        class="sf-footer-tick"
        :x="layout.footer.x"
        :y="layout.footer.tickTop"
        :width="layout.footer.tickW"
        :height="layout.footer.y + layout.footer.h - layout.footer.tickTop"
        :fill="FOOTER_GRAY"
      />
      <rect
        class="sf-footer-tick"
        :x="layout.footer.x + layout.footer.w - layout.footer.tickW"
        :y="layout.footer.tickTop"
        :width="layout.footer.tickW"
        :height="layout.footer.y + layout.footer.h - layout.footer.tickTop"
        :fill="FOOTER_GRAY"
      />
      <rect
        class="sf-footer-band"
        :x="layout.footer.x"
        :y="layout.footer.y"
        :width="layout.footer.w"
        :height="layout.footer.h"
        :fill="FOOTER_GRAY"
      />
    </g>

    <!-- Shared title chrome: seg11 measures the GREEN phrase first, cap band
         y104.2–161.2, token-mode ink runs (see TITLE above). The settled frame
         also carries the recording pill top-right (green, x≈1851 y≈23). -->
    <TitleChrome
      :tokens="titleTokens"
      :cap-height="TITLE.capHeight"
      :cap-top="TITLE.capTop"
      badge
    />
  </svg>
</template>

<style scoped>
.convergeflow {
  display: block;
  width: 100%;
  height: auto;
}

.convergeflow text {
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/* The recording's face is bold across the sheet — title runs included. The
   shared chrome renders weight 400 by default; this family overrides weight
   and adds a fill-colored stroke under the paint (the recording inks much
   heavier than JBM Bold) without touching the shared component (scoped
   :deep; the attribute selectors key on each token's bound fill). */
.convergeflow :deep(.sf-title-chrome text) {
  font-weight: 700;
  paint-order: stroke;
}

/* Bright tokens ink heavier: the green lead mass ratio is ≈1.42 over JBM
   Bold, the white tail ≈1.2. */
.convergeflow :deep(.sf-title-chrome text[fill='#66fb00']) {
  stroke: #66fb00;
  stroke-width: 6px;
}

.convergeflow :deep(.sf-title-chrome text[fill='#ffffff']) {
  stroke: #ffffff;
  stroke-width: 4.5px;
}

/*
 * Measured motion (seg11 onsets.json + f15 dumps): reveal elements pop on
 * their click; interior ink rides per-element delays (dividers ≈+130ms,
 * cell bars / PIPELINES ≈+200ms); the bar bracket DRAWS — stem first
 * (≈140ms), then the left→right sweep (≈220ms) — via the StepFlow dashoffset
 * pattern; labels and the footer fade. Transition is taken from the
 * destination state: forward reveal plays, the hidden state's transition:none
 * makes backward nav instant — the locked decision. Scoped selectors
 * (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease }.
 */
.sf-el {
  transition:
    opacity 450ms ease-out,
    transform 450ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-d1 {
  transition:
    opacity 450ms ease-out 130ms,
    transform 450ms cubic-bezier(0, 0, 0.2, 1) 130ms;
}

.sf-d2 {
  transition:
    opacity 450ms ease-out 200ms,
    transform 450ms cubic-bezier(0, 0, 0.2, 1) 200ms;
}

g.slidev-vclick-hidden .sf-el {
  opacity: 0;
  transform: translateY(12px) scale(0.85);
  transition: none;
}

.sf-col.slidev-vclick-hidden {
  transition: none;
}

.sf-fade {
  transition: opacity 250ms ease-out;
}

.sf-fade.slidev-vclick-hidden {
  transition: none;
}

.sf-draw {
  fill: none;
  stroke-linecap: butt;
}

.sf-draw-stem {
  stroke-dasharray: var(--sf-len);
  stroke-dashoffset: var(--sf-len);
  transition: stroke-dashoffset 140ms ease-out;
}

.sf-draw-bracket {
  stroke-dasharray: var(--sf-len);
  stroke-dashoffset: var(--sf-len);
  transition: stroke-dashoffset 220ms ease-out 140ms;
}

g:not(.slidev-vclick-hidden) .sf-draw-stem,
g:not(.slidev-vclick-hidden) .sf-draw-bracket {
  stroke-dashoffset: 0;
}

g.slidev-vclick-hidden .sf-draw-stem,
g.slidev-vclick-hidden .sf-draw-bracket {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-el,
  .sf-fade,
  .sf-draw-stem,
  .sf-draw-bracket {
    transition: none;
    animation: none;
  }
}
</style>
