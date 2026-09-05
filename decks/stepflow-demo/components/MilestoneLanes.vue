<script setup lang="ts">
import { computed, inject, ref, watch, type InjectionKey, type Ref } from 'vue'
import type { ClicksContext } from '@slidev/client/constants'

/**
 * Mirrors `injectionClicksContext` from @slidev/client/constants — the same
 * branded string, restated locally. The runtime import is a build hazard:
 * the subpath resolves to constants.ts, which the production bundler cannot
 * load; the type comes in type-only (erased) and the string is the protocol.
 */
const injectionClicksContext = '$$slidev-clicks-context' as unknown as InjectionKey<Ref<ClicksContext>>
import {
  milestoneLanesLayout,
  LANE_LABEL_X_FRAC,
  LANE_LABEL_SIZE_PX,
  LANE_LABEL_TRACKING_EM,
  BAR_TEXT_INSET_PX,
  BAR_TEXT_SIZE_PX,
  BAR_TEXT_FILL,
  HEADER_ROW_X_FRAC,
  HEADER_ROW_Y_FRAC,
  HEADER_ROW_SIZE_PX,
  HEADER_ICON_X_FRAC,
  HEADER_ICON_Y_FRAC,
  FOOTER_CHIP_X_FRAC,
  FOOTER_CHIP_Y_FRAC,
  FOOTER_CHIP_W_FRAC,
  FOOTER_CHIP_H_FRAC,
  FOOTER_ROW_X_FRAC,
  FOOTER_ROW_Y_FRAC,
  FOOTER_ROW_SIZE_PX,
  DIAMOND_GLOW_OPACITY,
  PLATE_FILL,
  PLATE_TOP_FILL,
  type LaneBarLayout,
  type Lane,
  type MilestoneDiamond,
} from './stepflow/lanes'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'
import { pinAttrs } from './stepflow/chrome'
import { resolvePalette, statusAmber, type StepFlowPaletteOverride } from './stepflow/palettes'
import TitleChrome from './stepflow/TitleChrome.vue'

const props = withDefaults(defineProps<{
  /** Lanes in reveal order; bar offsets, lane tops and sizes are data (canvas fractions). */
  lanes: Lane[]
  /** Grid fallback: bar top of the first lane, as a fraction of the canvas height. */
  y0Frac: number
  /** Grid fallback: vertical lane pitch, as a fraction of the canvas height. */
  lanePitchFrac: number
  /** Default bar height, as a fraction of the canvas height (per-bar `hFrac` overrides). */
  barHFrac: number
  /** Milestone diamonds on the marker column, revealed on their own beats. */
  diamonds?: MilestoneDiamond[]
  /** Partial palette merged over the family's measured preset (verbatim unless overridden). */
  palette?: StepFlowPaletteOverride
  /** Mono header line, e.g. 'DATA'. */
  title?: string
  /** Header tail rendered in chrome green after `title` (two-tone chrome convention). */
  titleAccent?: string
  /**
   * Pinned title ink extent in px at 1920 scale — forwarded to TitleChrome's
   * `titleTextLength` (spacing-only SVG textLength pin). The reference title
   * measures 798px, which the mono face cannot reach naturally at cap 78.
   */
  titleTextLength?: number
  /** Label row above lane 1 (ref: 'WHERE THE WORK GOES'). Renders only when provided. */
  headerLabel?: string
  /** Icon key for the header row's amber leading glyph. */
  headerIcon?: string
  /** Footer row text (ref: 'YOUR JUDGEMENT DECIDES THE DESIGN'). Renders only when provided. */
  footerLabel?: string
  /** Icon key for the footer row's teal chip glyph. */
  footerIcon?: string
}>(), {
  diamonds: () => [],
  palette: () => ({}),
  headerIcon: 'database',
  footerIcon: 'map-pin',
})

// Measured fills (true settled reference frame, exact-trace sheet
// art_kYBddwt9): amber #F9BB21, red #ED4342 — the preset's dimmer goldenrod
// tones diverged. resolvePalette merges the `cyanOnBlack` default underneath,
// so an override can still re-tint any field.
const p = computed(() => resolvePalette({ ...statusAmber, accent: '#f9bb21', accentAlt: '#ed4342', ...props.palette }))

const layout = computed(() =>
  milestoneLanesLayout({
    lanes: props.lanes,
    y0Frac: props.y0Frac,
    lanePitchFrac: props.lanePitchFrac,
    barHFrac: props.barHFrac,
    diamonds: props.diamonds,
  }),
)

// Live Slidev click state — the same context the v-click directive reads,
// provided per slide. Outside Slidev (tests, static renders) it's undefined
// and every bar renders settled: geometry is complete, only animation hides.
const clicksCtx = inject(injectionClicksContext, undefined)
const clicks = computed(() => clicksCtx?.value.current ?? Number.POSITIVE_INFINITY)

// Backward navigation snaps instantly (locked decision): when the last click
// step went backward, the next geometry update suppresses all transitions.
const instant = ref(true)
watch(clicks, (next, prev) => {
  instant.value = next < prev
})

type BarPhase = 'hidden' | 'popped' | 'settled'

// Phase machine per bar (sheet §5 motion table): every bar reveals on its
// reveal click and settles on the next one; the reveal STYLE decides what the
// hidden/popped rects look like (resolved in the layout).
function barPhase(bar: LaneBarLayout): BarPhase {
  if (clicks.value < bar.click) return 'hidden'
  if (clicks.value < bar.settleClick) return 'popped'
  return 'settled'
}

function barRect(bar: LaneBarLayout): { x: number; w: number } {
  switch (barPhase(bar)) {
    case 'hidden': return bar.hidden
    case 'popped': return bar.popped
    default: return bar.settled
  }
}

// The `pop` reveal keeps its final geometry throughout — its hidden state is
// a fade, not a collapse (class-driven, transitioned with the bar's opacity).
function barVeiled(bar: LaneBarLayout): boolean {
  return bar.reveal === 'pop' && barPhase(bar) === 'hidden'
}

function barColor(tone: Lane['bars'][number]['tone']): string {
  return tone === 'accent' ? p.value.accent : (p.value.accentAlt ?? p.value.accent)
}

// Lane labels: white tracked mono, left-aligned at the measured x404,
// vertically centered on the lane band.
const labelX = computed(() => LANE_LABEL_X_FRAC * layout.value.viewBox.width)

// Header/footer rows: leading glyph centered in its measured box, text at the
// measured left edge with the row top as the hanging baseline.
const headerPos = computed(() => {
  const vb = layout.value.viewBox
  return {
    iconCx: HEADER_ICON_X_FRAC * vb.width + ICON_SIZE / 2,
    iconCy: HEADER_ICON_Y_FRAC * vb.height + ICON_SIZE / 2,
    textX: HEADER_ROW_X_FRAC * vb.width,
    textY: HEADER_ROW_Y_FRAC * vb.height,
  }
})

const footerPos = computed(() => {
  const vb = layout.value.viewBox
  const chipW = FOOTER_CHIP_W_FRAC * vb.width
  const chipH = FOOTER_CHIP_H_FRAC * vb.height
  return {
    iconCx: FOOTER_CHIP_X_FRAC * vb.width + chipW / 2,
    iconCy: FOOTER_CHIP_Y_FRAC * vb.height + chipH / 2,
    textX: FOOTER_ROW_X_FRAC * vb.width,
    textY: FOOTER_ROW_Y_FRAC * vb.height,
  }
})

// Typography on the StepFlow scale: measured at 1920 and rescaled by width so
// custom viewBox sizes stay proportional (StepFlow.vue pattern).
const type = computed(() => {
  const kw = layout.value.viewBox.width / 1920
  return {
    labelSize: LANE_LABEL_SIZE_PX * kw,
    headerSize: HEADER_ROW_SIZE_PX * kw,
    footerSize: FOOTER_ROW_SIZE_PX * kw,
    textSize: BAR_TEXT_SIZE_PX * kw,
  }
})

// Chrome constants: white lane labels (title chrome lives in the shared
// TitleChrome component), the teal of the footer chip, and ~48px icon glyphs
// in 24-unit Lucide space.
const LABEL_FILL = '#ffffff'
const CHROME_TEAL = '#1cd797'
const ICON_BOX = 24
const ICON_SIZE = 48

function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}

// Rotated milestone squares: a 45°-rotated rect around its measured center,
// plus a soft radial glow behind it (per-element, not a lane-wide wash).
function diamondTransform(cx: number, cy: number): string {
  return `rotate(45 ${fmt(cx)} ${fmt(cy)})`
}

function iconTransform(cx: number, cy: number): string {
  const s = ICON_SIZE / ICON_BOX
  return `translate(${fmt(cx - ICON_SIZE / 2)} ${fmt(cy - ICON_SIZE / 2)}) scale(${fmt(s)})`
}

// Unknown key renders the visible fallback (never undefined into v-html) and
// names the bad key in dev so the author fixes the string.
function resolveIcon(key: string): string {
  const path = iconPath(key)
  if (!path && import.meta.env?.DEV) {
    console.warn(`[MilestoneLanes] unknown icon key "${key}" — rendering the fallback icon`)
  }
  return path ?? ICON_FALLBACK
}
</script>

<template>
  <svg
    class="milestonelanes"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${lanes.length}-lane milestone chart`"
  >
    <defs>
      <!-- Per-element diamond glows: soft radial falloff behind each milestone
           square (ref: ~52px glow haloing the marker column). -->
      <radialGradient id="sf-ml-glow-alt">
        <stop offset="0" stop-color="#ed4342" stop-opacity="0.9" />
        <stop offset="1" stop-color="#ed4342" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="sf-ml-glow-accent">
        <stop offset="0" stop-color="#f9bb21" stop-opacity="0.9" />
        <stop offset="1" stop-color="#f9bb21" stop-opacity="0" />
      </radialGradient>
      <!-- The plate brightens toward the top (~#19181d at its top edge) and
           settles to the flat dim tone by mid-height (ref-measured). -->
      <linearGradient id="sf-ml-plate" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="PLATE_TOP_FILL" />
        <stop offset="0.45" :stop-color="PLATE_FILL" />
        <stop offset="1" :stop-color="PLATE_FILL" />
      </linearGradient>
    </defs>

    <!-- Dim ambience layer: the plate spans the chart zone only — the slide
         field outside it is pure black (ref-sampled at the true settled
         frame). Static chrome: no v-click, outside the accessibility tree. -->
    <g class="sf-ml-ambience" aria-hidden="true">
      <rect
        class="sf-ml-plate"
        :x="layout.plate.x"
        :y="layout.plate.y"
        :width="layout.plate.w"
        :height="layout.plate.h"
        fill="url(#sf-ml-plate)"
      />
    </g>

    <!-- Header label row above lane 1: amber leading glyph + dim gray mono
         text (static chrome, present from the ref's first settled frame). -->
    <g v-if="headerLabel" class="sf-ml-header">
      <g
        class="sf-ml-header-icon"
        fill="none"
        :stroke="p.accent"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        :transform="iconTransform(headerPos.iconCx, headerPos.iconCy)"
        v-html="resolveIcon(headerIcon)"
      />
      <text
        :x="headerPos.textX"
        :y="headerPos.textY"
        dominant-baseline="hanging"
        :font-size="type.headerSize"
        :fill="p.subtext"
        letter-spacing="0.08em"
      >{{ headerLabel }}</text>
    </g>

    <!-- Lane labels: white tracked mono, left-aligned inside the marker
         column (measured x404). Each label rides its lane's first beat unless
         the data overrides labelClick (the ref's STREAMING label brightens
         with the opening sweep, one beat before its own bar). -->
    <template v-for="lane in layout.lanes" :key="`label-${lane.id}`">
      <text
        v-if="lane.label"
        v-click="lane.labelClick"
        class="sf-ml-label"
        :x="labelX"
        :y="lane.y + lane.bars[0].h / 2"
        dominant-baseline="central"
        :font-size="type.labelSize"
        :fill="LABEL_FILL"
        :letter-spacing="`${LANE_LABEL_TRACKING_EM}em`"
      >{{ lane.label }}</text>
    </template>

    <!--
      Four reveal styles (sheet §5 motion table), one per bar:
      - sweep (bar 2): grows along the rail past its final width, then
        re-proportions on the next click;
      - pop (bar 1): appears at final width — a fade, no geometry change;
      - grow (bar 4): ease-out growth along the rail to the final width;
      - center (bar 3): expands from its centerline outward.
      Transition lives in the destination state and is styled per reveal; a
      backward step sets .sf-ml-instant so every phase snaps back with zero
      animation (locked decision).
    -->
    <g
      v-for="lane in layout.lanes"
      :key="lane.id"
      class="sf-ml-lane"
    >
      <g
        v-for="(bar, bi) in lane.bars"
        :key="`${lane.id}-${bi}`"
        v-click="bar.click"
        class="sf-ml-bar-group"
      >
        <rect
          class="sf-ml-bar"
          :class="[
            `sf-ml-reveal-${bar.reveal}`,
            { 'sf-ml-settled': barPhase(bar) === 'settled', 'sf-ml-veiled': barVeiled(bar), 'sf-ml-instant': instant },
          ]"
          :x="barRect(bar).x"
          :y="bar.y"
          :width="barRect(bar).w"
          :height="bar.h"
          rx="15"
          :fill="barColor(bar.tone)"
        />
        <text
          v-if="bar.text"
          class="sf-ml-bar-text"
          :x="bar.x + BAR_TEXT_INSET_PX"
          :y="bar.y + bar.h / 2"
          dominant-baseline="central"
          :font-size="type.textSize"
          :fill="BAR_TEXT_FILL"
          letter-spacing="0.06em"
          v-bind="pinAttrs(bar.text, type.textSize, bar.textLength ? bar.textLength * (layout.viewBox.width / 1920) : undefined)"
        >{{ bar.text }}</text>
      </g>
    </g>

    <!-- Milestone diamonds: 45°-rotated hollow squares with a soft radial
         glow, popped on their measured beats (ref: lane 1's red diamond with
         the opening sweep; lane 3's amber double ring on clicks 4 and 8). -->
    <g
      v-for="diamond in layout.diamonds"
      :key="`diamond-${diamond.id}`"
      v-click="diamond.click"
      class="sf-ml-diamond"
    >
      <circle
        class="sf-ml-diamond-glow"
        :cx="diamond.cx"
        :cy="diamond.cy"
        :r="diamond.glowRadius"
        :fill="`url(#sf-ml-glow-${diamond.tone})`"
        :opacity="DIAMOND_GLOW_OPACITY"
      />
      <rect
        class="sf-ml-diamond-core"
        :x="diamond.cx - diamond.side / 2"
        :y="diamond.cy - diamond.side / 2"
        :width="diamond.side"
        :height="diamond.side"
        :transform="diamondTransform(diamond.cx, diamond.cy)"
        fill="none"
        :stroke="barColor(diamond.tone)"
        :stroke-width="diamond.stroke"
        stroke-linejoin="miter"
      />
    </g>

    <!-- Closing beat: the footer row — teal chip glyph + dim gray mono text —
         lands on the final click and fades last (ref: settle ≈5.6s). -->
    <g v-if="footerLabel" v-click="layout.clickCount" class="sf-ml-footer">
      <g
        class="sf-ml-chip-icon"
        fill="none"
        :stroke="CHROME_TEAL"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        :transform="iconTransform(footerPos.iconCx, footerPos.iconCy)"
        v-html="resolveIcon(footerIcon)"
      />
      <text
        :x="footerPos.textX"
        :y="footerPos.textY"
        dominant-baseline="hanging"
        :font-size="type.footerSize"
        :fill="p.subtext"
        letter-spacing="0.08em"
      >{{ footerLabel }}</text>
    </g>

    <!-- Shared title chrome: sheet-measured centered two-tone title
         (MilestoneLanes Title row: cap 78 in the band y98–176, centered ≈x960,
         ink extent pinned to the measured 798px) plus the recording badge its
         sheet documents. -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :cap-height="57"
      :cap-top="104.2"
      :title-text-length="titleTextLength"
      badge
    />
  </svg>
</template>

<style scoped>
.milestonelanes {
  display: block;
  width: 100%;
  height: auto;
}

.milestonelanes text {
  /* Open question #1 (font family): mono stack until the face is confirmed. */
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Measured motion per reveal style (sheet §5 motion table): sweep 250ms pop
 * + 500ms re-proportion (fidelity report art_iHm120ov: 175.80→176.05s,
 * 176.35→176.80s ≈ 470ms), grow 733ms ease-out (measured 2683→3416ms),
 * center and the pop fade 120–350ms. Transition is taken from the
 * destination state; .sf-ml-instant — backward navigation, last rule wins —
 * snaps every phase with zero animation (locked decision). Scoped selectors
 * (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease }.
 */
.sf-ml-reveal-sweep {
  transition: x 250ms cubic-bezier(0, 0, 0.2, 1), width 250ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-ml-reveal-sweep.sf-ml-settled {
  transition: x 500ms cubic-bezier(0, 0, 0.2, 1), width 500ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-ml-reveal-grow {
  transition: width 733ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-ml-reveal-center {
  transition: x 120ms cubic-bezier(0, 0, 0.2, 1), width 120ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-ml-reveal-pop {
  transition: opacity 120ms ease-out;
}

.sf-ml-veiled {
  opacity: 0;
}

.sf-ml-bar.sf-ml-instant {
  transition: none;
}

.sf-ml-label {
  transition: opacity 150ms ease-out;
}

.sf-ml-label.slidev-vclick-hidden {
  transition: none;
}

.sf-ml-diamond {
  transition: opacity 350ms ease-out;
}

.sf-ml-diamond.slidev-vclick-hidden {
  transition: none;
}

.sf-ml-footer {
  transition: opacity 150ms ease-out;
}

.sf-ml-footer.slidev-vclick-hidden {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-ml-bar,
  .sf-ml-label,
  .sf-ml-diamond,
  .sf-ml-footer {
    transition: none;
  }
}
</style>
