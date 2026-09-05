<script setup lang="ts">
import { computed } from 'vue'
import {
  BAR_ORANGE,
  CONVERGE_SEED,
  FOOTER_GRAY,
  FUNNEL_ORANGE,
  LABEL_WHITE,
  convergeDrawPaths,
  convergeLayout,
  convergePalette,
} from './stepflow/converge'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import TitleChrome from './stepflow/TitleChrome.vue'
import { CAP_HEIGHT_RATIO, pinAttrs } from './stepflow/chrome'

const props = withDefaults(defineProps<{
  /** White title tail, e.g. 'EVERYTHING CONVERGES'. */
  title?: string
  /** Chrome-green title LEAD — this family's sheet reads the green phrase first ('ETL'). */
  titleAccent?: string
  /** White base labels under the two columns. */
  labels?: { left?: string; right?: string }
  /** Orange numeric tick row under the funnel cone. */
  funnelLabel?: string
  /** Optional text inside the left main box (sub-resolution in the reference). */
  leftBoxText?: string
  /** Optional text inside the left lower box. */
  leftLowerText?: string
  /** Optional text inside the right main box. */
  rightBoxText?: string
  /** Partial palette merged over the family's `convergePalette` preset. */
  palette?: StepFlowPaletteOverride
}>(), {
  title: CONVERGE_SEED.title,
  titleAccent: CONVERGE_SEED.titleAccent,
  labels: () => ({ ...CONVERGE_SEED.labels }),
  funnelLabel: CONVERGE_SEED.funnelLabel,
  leftBoxText: '',
  leftLowerText: '',
  rightBoxText: CONVERGE_SEED.rightBoxText,
  palette: () => ({}),
})

// convergePalette is ConvergeFlow's family preset: measured right-column blue
// as `accent`, left-column cyan as `accentTertiary`. resolvePalette merges the
// default `cyanOnBlack` underneath, so an override can re-tint any field.
const p = computed(() => resolvePalette({ ...convergePalette, ...props.palette }))

// Geometry, schedule, and tones all come from the measured layout module —
// the seed carries content, not geometry (StairChain convention).
const layout = computed(() => convergeLayout())
const draws = computed(() => convergeDrawPaths(layout.value))

// Title chrome, measured off the seg11 settled frame: green lead ink
// x402.048–555.072 (153.024 wide), white tail ink x572.928–1489.536
// (916.608 wide), cap band y104.22–161.244 (cap 57.024). Token mode pins
// each ink run independently — the short lead measures ~11% wider than its
// natural mono run, the tail ~2% narrow (natural).
const TITLE = {
  capHeight: 57.024,
  capTop: 104.22,
} as const
const titleTokens = computed(() => [
  { text: props.titleAccent, x: 402.048, width: 153.024, accent: true },
  { text: props.title, x: 572.928, width: 916.608 },
])

// Typography through the deck's measured cap ratio; text inside the boxes is
// centered on each box (the reference's in-box glyph rows are sub-resolution).
const type = computed(() => {
  const c = layout.value.columns
  return {
    labelSize: layout.value.labels.left.capHeight / CAP_HEIGHT_RATIO,
    funnelLabelSize: layout.value.funnel.label.capHeight / CAP_HEIGHT_RATIO,
    boxCap: 16,
    leftBoxCenter: { x: c.left.x + c.left.w / 2, baseline: c.left.y + c.left.h / 2 + 8 },
    leftLowerCenter: { x: c.leftLower.x + c.leftLower.w / 2, baseline: c.leftLower.y + c.leftLower.h / 2 + 6 },
    rightBoxCenter: { x: c.right.x + c.right.w / 2, baseline: c.right.y + c.right.h / 2 + 9 },
  }
})

function boxFontSize(h: number): number {
  return h / CAP_HEIGHT_RATIO
}

/** Funnel strokes are thin (≈2.5px at 1920); the bar carries its measured 3px line. */
const STROKES = {
  funnel: 2.5,
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
        v-bind="pinAttrs(funnelLabel, type.funnelLabelSize, layout.funnel.label.width)"
      >{{ funnelLabel }}</text>
    </g>

    <!-- Click 1 (t1.07): left cyan main box pops. -->
    <g v-click="1" class="sf-col">
      <rect
        class="sf-box"
        :x="layout.columns.left.x"
        :y="layout.columns.left.y"
        :width="layout.columns.left.w"
        :height="layout.columns.left.h"
        fill="none"
        :stroke="p.accentTertiary"
        stroke-width="3"
      />
      <text
        v-if="leftBoxText"
        :x="type.leftBoxCenter.x"
        :y="type.leftBoxCenter.baseline"
        text-anchor="middle"
        :font-size="boxFontSize(type.boxCap)"
        :fill="p.accentTertiary"
      >{{ leftBoxText }}</text>
    </g>

    <!-- Click 2 (t1.53): left lower box pops, left label fades in (label's
         measured onset t1.667 rides the nearer 1.53 beat). -->
    <g v-click="2" class="sf-col">
      <rect
        class="sf-box"
        :x="layout.columns.leftLower.x"
        :y="layout.columns.leftLower.y"
        :width="layout.columns.leftLower.w"
        :height="layout.columns.leftLower.h"
        fill="none"
        :stroke="p.accentTertiary"
        stroke-width="3"
      />
      <text
        v-if="leftLowerText"
        :x="type.leftLowerCenter.x"
        :y="type.leftLowerCenter.baseline"
        text-anchor="middle"
        :font-size="boxFontSize(type.boxCap)"
        :fill="p.accentTertiary"
      >{{ leftLowerText }}</text>
      <text
        v-if="labels.left"
        class="sf-label"
        :x="layout.labels.left.x"
        :y="layout.labels.left.baseline"
        :font-size="type.labelSize"
        :fill="LABEL_WHITE"
        v-bind="pinAttrs(labels.left, type.labelSize, layout.labels.left.width)"
      >{{ labels.left }}</text>
    </g>

    <!-- Click 3 (t2.20): right blue main box + the row of six small boxes pop. -->
    <g v-click="3" class="sf-col">
      <rect
        class="sf-box"
        :x="layout.columns.right.x"
        :y="layout.columns.right.y"
        :width="layout.columns.right.w"
        :height="layout.columns.right.h"
        fill="none"
        :stroke="p.accent"
        stroke-width="3"
      />
      <text
        v-if="rightBoxText"
        :x="type.rightBoxCenter.x"
        :y="type.rightBoxCenter.baseline"
        text-anchor="middle"
        :font-size="boxFontSize(type.boxCap)"
        :fill="p.accent"
      >{{ rightBoxText }}</text>
      <rect
        v-for="(box, i) in layout.columns.rightRow"
        :key="i"
        class="sf-box sf-row-box"
        :x="box.x"
        :y="box.y"
        :width="box.w"
        :height="box.h"
        fill="none"
        :stroke="p.accent"
        stroke-width="2.5"
      />
    </g>

    <!-- Click 4 (t2.60): the bar bracket DRAWS — f15 evidence shows the stem
         dropping first, then the line sweeping left→right (a stroke draw,
         not a fade) — and the right label fades (measured onset t2.533). -->
    <g v-click="4" class="sf-fade">
      <path
        class="sf-draw sf-draw-stem"
        :d="draws.stem.d"
        :style="{ '--sf-len': `${draws.stem.len}` }"
        :stroke="BAR_ORANGE"
        :stroke-width="layout.bar.h"
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
        :fill="LABEL_WHITE"
        v-bind="pinAttrs(labels.right, type.labelSize, layout.labels.right.width)"
      >{{ labels.right }}</text>
    </g>

    <!-- Click 5 (t3.07): footer band + rising end ticks fade in last. -->
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
         y104.2–161.2, token-mode ink runs (see TITLE above). -->
    <TitleChrome
      :tokens="titleTokens"
      :cap-height="TITLE.capHeight"
      :cap-top="TITLE.capTop"
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

/*
 * Measured motion (seg11 f15 dumps): the columns pop on their clicks; the
 * bar bracket DRAWS — stem first (≈140ms), then the left→right sweep
 * (≈220ms) — via the StepFlow dashoffset pattern; labels and the footer
 * fade. Transition is taken from the destination state: forward reveal
 * plays, the hidden state's transition:none makes backward nav instant —
 * the locked decision. Scoped selectors (0,2,0 + attribute) beat Slidev's
 * built-in .slidev-vclick-target { transition: all .1s ease }.
 */
.sf-col {
  transition:
    opacity 450ms ease-out,
    transform 450ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-col.slidev-vclick-hidden {
  transform: translateY(12px) scale(0.85);
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
  .sf-col,
  .sf-fade,
  .sf-draw-stem,
  .sf-draw-bracket {
    transition: none;
    animation: none;
  }
}
</style>
