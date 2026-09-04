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
  WASH_BAND_H_FACTOR,
  WASH_CORE_H_FACTOR,
  WASH_RIGHT_INSET_FRAC,
  type Lane,
  type LaneBarLayout,
} from './stepflow/lanes'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'
import { resolvePalette, statusAmber, type StepFlowPaletteOverride } from './stepflow/palettes'
import TitleChrome from './stepflow/TitleChrome.vue'

const props = withDefaults(defineProps<{
  /** Lanes top-to-bottom; bar offsets and sizes are data (canvas fractions). */
  lanes: Lane[]
  /** Bar top of the first lane, as a fraction of the canvas height. */
  y0Frac: number
  /** Vertical lane pitch, as a fraction of the canvas height. */
  lanePitchFrac: number
  /** Default bar height, as a fraction of the canvas height (per-bar `hFrac` overrides). */
  barHFrac: number
  /** Partial palette merged over the family's `statusAmber` preset (verbatim unless overridden). */
  palette?: StepFlowPaletteOverride
  /** Mono header line, e.g. 'DATA'. */
  title?: string
  /** Header tail rendered in chrome green after `title` (two-tone chrome convention). */
  titleAccent?: string
  /** Label row above lane 1 (ref t=180.1s: 'WHERE THE WORK GOES'). Renders only when provided. */
  headerLabel?: string
  /** Icon key for the header row's amber leading glyph. */
  headerIcon?: string
  /** Footer row text (ref t=180.1s: 'YOUR JUDGEMENT DECIDES THE DESIGN'). Renders only when provided. */
  footerLabel?: string
  /** Icon key for the footer row's teal chip glyph. */
  footerIcon?: string
}>(), {
  palette: () => ({}),
  headerIcon: 'database',
  footerIcon: 'map-pin',
})

// statusAmber is MilestoneLanes' family preset, verbatim (wave-2 spec):
// amber accent bars, red accentAlt. resolvePalette merges the default
// `cyanOnBlack` underneath, so an override can re-tint any field.
const p = computed(() => resolvePalette({ ...statusAmber, ...props.palette }))

const layout = computed(() =>
  milestoneLanesLayout({
    lanes: props.lanes,
    y0Frac: props.y0Frac,
    lanePitchFrac: props.lanePitchFrac,
    barHFrac: props.barHFrac,
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

// Two-phase choreography (fidelity report art_iHm120ov §MilestoneLanes):
// bar k pops wide on native click 2k−1 and re-proportions on click 2k.
function barPhase(bar: LaneBarLayout): BarPhase {
  if (clicks.value < bar.click) return 'hidden'
  if (clicks.value < bar.settleClick) return 'popped'
  return 'settled'
}

// Hidden bars wait collapsed at the tick rail so the pop sweep grows from it;
// popped holds the rail-anchored wide sweep; settled is the measured seed.
function barRect(bar: LaneBarLayout): { x: number; w: number } {
  switch (barPhase(bar)) {
    case 'hidden': return { x: bar.popX, w: 0 }
    case 'popped': return { x: bar.popX, w: bar.popW }
    default: return { x: bar.x, w: bar.w }
  }
}

function barColor(tone: Lane['bars'][number]['tone']): string {
  return tone === 'accent' ? p.value.accent : (p.value.accentAlt ?? p.value.accent)
}

// Lane labels: white mono, left-aligned at the measured x410 inside the tick
// rail, vertically centered on the lane band (ref y538–563 centered at 550).
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

// Typography on the StepFlow scale: 34px title at source height 848, rescaled
// so custom viewBox sizes stay proportional (StepFlow.vue pattern). Text rows
// and labels are measured at 1920 scale and rescale by width.
const type = computed(() => {
  const kw = layout.value.viewBox.width / 1920
  return {
    labelSize: LANE_LABEL_SIZE_PX * kw,
    headerSize: HEADER_ROW_SIZE_PX * kw,
    footerSize: FOOTER_ROW_SIZE_PX * kw,
  }
})

// Chrome constants: white lane labels (title chrome lives in the shared
// TitleChrome component), the teal of the footer chip (chrome like
// TwoBarCompare's chips; measured (32,208,152) ≈ the deck's teal token), and
// ~36px icon glyphs in 24-unit Lucide space.
const LABEL_FILL = '#ffffff'
const CHROME_TEAL = '#1cd797'
const ICON_BOX = 24
const ICON_SIZE = 48

function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}

// Dim ambience (final sweep, ref t=180.1s): the chart field sits on a neutral
// dim plate instead of void black, and each lane carries a soft tone wash
// behind its bars (dark red behind red lanes, warm amber behind amber lanes).
// Static chrome — it persists across the whole sequence like the frame.
const PLATE_FILL = '#0f0e11'
const WASH_BAND_OPACITY = 0.115
const WASH_CORE_OPACITY = 0.13

const washX = computed(() => LANE_LABEL_X_FRAC * layout.value.viewBox.width)
const washW = computed(
  () => layout.value.box.x + layout.value.box.w - washX.value - WASH_RIGHT_INSET_FRAC * layout.value.viewBox.width,
)

function washY(lane: { y: number; bars: LaneBarLayout[] }, factor: number): number {
  const center = lane.y + lane.bars[0].h / 2
  const h = washH(lane, factor)
  return center - h / 2
}

function washH(lane: { bars: LaneBarLayout[] }, factor: number): number {
  return factor * lane.bars[0].h
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
    <!-- Dim ambience layer (final sweep, ref t=180.1s): a neutral dim plate
         across the chart field plus a soft tone wash behind each lane's bars
         (dark red behind red lanes, warm amber behind amber lanes). Static
         chrome — present from the first frame like the container frame, no
         v-click, outside the accessibility tree (decorative). -->
    <g class="sf-ml-ambience" aria-hidden="true">
      <rect
        class="sf-ml-plate"
        :x="layout.box.x"
        :y="layout.box.y"
        :width="layout.box.w"
        :height="layout.box.h"
        :fill="PLATE_FILL"
      />
      <g filter="url(#sf-ml-wash-blur)">
        <template v-for="lane in layout.lanes" :key="`wash-${lane.id}`">
          <rect
            class="sf-ml-wash"
            :x="washX"
            :y="washY(lane, WASH_BAND_H_FACTOR)"
            :width="washW"
            :height="washH(lane, WASH_BAND_H_FACTOR)"
            :fill="barColor(lane.bars[0].tone)"
            :fill-opacity="WASH_BAND_OPACITY"
          />
          <rect
            class="sf-ml-wash-core"
            :x="washX"
            :y="washY(lane, WASH_CORE_H_FACTOR)"
            :width="washW"
            :height="washH(lane, WASH_CORE_H_FACTOR)"
            :fill="barColor(lane.bars[0].tone)"
            :fill-opacity="WASH_CORE_OPACITY"
          />
        </template>
      </g>
    </g>
    <defs>
      <filter id="sf-ml-wash-blur" x="-10%" y="-80%" width="120%" height="260%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>

    <!-- Dim warm container frame around the chart field — static chrome; the
         ref's frame (x281–1652, y377–954, amber at ~15%) persists across the
         whole sequence. -->
    <rect
      class="sf-ml-box"
      :x="layout.box.x"
      :y="layout.box.y"
      :width="layout.box.w"
      :height="layout.box.h"
      fill="none"
      :stroke="p.accent"
      stroke-opacity="0.15"
      :stroke-width="2"
    />

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

    <!-- Lane labels: white mono, left-aligned inside the tick rail (measured
         x410). Each label rides its lane's pop click — nothing reveals alone. -->
    <template v-for="lane in layout.lanes" :key="`label-${lane.id}`">
      <text
        v-if="lane.label"
        v-click="lane.firstClick"
        class="sf-ml-label"
        :x="labelX"
        :y="lane.y + lane.bars[0].h / 2"
        dominant-baseline="central"
        :font-size="type.labelSize"
        :fill="LABEL_FILL"
        letter-spacing="0.08em"
      >{{ lane.label }}</text>
    </template>

    <!--
      Two-phase reveal: bar k pops wide on click 2k−1 — a rail-anchored sweep
      to its final right edge (the ref frame t=180.1s caught this state) — and
      re-proportions on click 2k as the left edge retracts to the measured seed
      width. Transition lives in the destination state: forward pop 250ms,
      settle 500ms; a backward step sets .sf-ml-instant so both phases snap
      back with zero animation (locked decision).
    -->
    <g v-for="lane in layout.lanes" :key="lane.id">
      <rect
        v-for="(bar, bi) in lane.bars"
        :key="`${lane.id}-${bi}`"
        v-click="bar.click"
        class="sf-ml-bar"
        :class="{ 'sf-ml-settled': barPhase(bar) === 'settled', 'sf-ml-instant': instant }"
        :x="barRect(bar).x"
        :y="bar.y"
        :width="barRect(bar).w"
        :height="bar.h"
        rx="4"
        :fill="barColor(bar.tone)"
      />
    </g>

    <!-- Closing beat: tick markers spread across lanes and the footer row —
         teal chip glyph + dim gray mono text — land on the final click. -->
    <g v-click="layout.clickCount" class="sf-ml-ticks">
      <line
        v-for="(tick, i) in layout.ticks"
        :key="`tick-${i}`"
        :x1="tick.x"
        :x2="tick.x"
        :y1="tick.y - tick.h / 2"
        :y2="tick.y + tick.h / 2"
        :stroke="p.accent"
        :stroke-width="3"
        stroke-linecap="round"
      />
    </g>
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
         (MilestoneLanes Title row: cap 78 in the band y98–176, centered ≈x960)
         plus the recording badge its sheet documents. -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :cap-height="78"
      :cap-top="98"
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
 * Measured motion (fidelity report art_iHm120ov §MilestoneLanes): the pop is
 * 250ms ease-out (measured 175.80→176.05s), the re-proportion 500ms (measured
 * 176.35→176.80s ≈ 470ms). Transition is taken from the destination state:
 * the base rule pops wide, .sf-ml-settled re-proportions, and
 * .sf-ml-instant — backward navigation, last rule wins — snaps both phases
 * with zero animation (locked decision). Scoped selectors (0,2,0 + attribute)
 * beat Slidev's built-in .slidev-vclick-target { transition: all .1s ease }.
 */
.sf-ml-bar {
  transition: x 250ms cubic-bezier(0, 0, 0.2, 1), width 250ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-ml-bar.sf-ml-settled {
  transition: x 500ms cubic-bezier(0, 0, 0.2, 1), width 500ms cubic-bezier(0, 0, 0.2, 1);
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

.sf-ml-ticks {
  transition: opacity 150ms ease-out;
}

.sf-ml-ticks.slidev-vclick-hidden {
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
  .sf-ml-ticks,
  .sf-ml-footer {
    transition: none;
  }
}
</style>
