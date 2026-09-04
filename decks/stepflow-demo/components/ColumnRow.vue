<script setup lang="ts">
import { computed } from 'vue'
import {
  BADGE_ICON_AT_1080,
  columnRowLayout,
  headingLayout,
  RISE_FRAC,
  TINTED_LABEL_SIZE_SOURCE,
  typeScale,
  type Column,
  type ColumnRowHeading,
  type LabelRowInput,
  type LabelRowLayout,
} from './stepflow/columns'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'
import { orangeSpine, resolvePalette, statusAmber, stepBlue, type StepFlowPaletteOverride } from './stepflow/palettes'

const props = withDefaults(defineProps<{
  /** One entry per column; content travels with the slide. */
  columns: Column[]
  /** Top edge of every column, as a fraction of stage height (measured 51.4%h). */
  yFrac: number
  /** Column height, as a fraction of stage height (measured 23.3%h). */
  hFrac: number
  /** Optional text rows below the columns — plain rows or `{ texts, tone: 'column' }` tinted rows. */
  labelRows?: LabelRowInput[]
  /** Measured heading chrome above the field: amber bar-chip, white icon badge, white caption. */
  heading?: ColumnRowHeading
  /** Partial palette merged over the measured `cyanOnBlack` preset. */
  palette?: StepFlowPaletteOverride
  /** Mono header line, e.g. 'PIPELINE'. */
  title?: string
  /** Header tail rendered in chrome green after `title` (two-tone chrome convention). */
  titleAccent?: string
}>(), { labelRows: () => [], palette: () => ({}) })

const p = computed(() => resolvePalette(props.palette))
const layout = computed(() => columnRowLayout({ columns: props.columns, yFrac: props.yFrac, hFrac: props.hFrac, labelRows: props.labelRows }))

// Heading chrome resolves with the viewBox; the data (icon key + caption text)
// travels with the geometry so the template needs a single guarded object.
const headingView = computed(() => {
  if (!props.heading) return null
  return {
    ...headingLayout(layout.value.viewBox),
    icon: resolveIcon(props.heading.icon),
    // The caption string rides as captionText so the layout's caption geometry
    // (x / baseline y / size) survives the spread above.
    captionText: props.heading.caption,
  }
})
const iconSize = computed(() => BADGE_ICON_AT_1080 * (layout.value.viewBox.height / 1080))

// Tone → token: measured hues reach the component through the existing preset
// tokens — `accent` reads the palette prop (house cyan), `alt` reads the
// accentAlt override with the orangeSpine accent as fallback, `tertiary` reads
// the accentTertiary field (falling back to accent per the contract), and
// `status` reads the statusAmber accent. Palette-neutral wave: no new presets,
// no new fields.
function toneColor(tone: Column['tone']): string {
  if (tone === 'alt') return p.value.accentAlt ?? orangeSpine.accent
  if (tone === 'tertiary') return p.value.accentTertiary ?? p.value.accent
  if (tone === 'status') return statusAmber.accent
  if (tone === 'blue') return stepBlue
  return p.value.accent
}

// Row cell fill: a 'column'-toned row tints every cell with its host column's
// tone (the ref's tinted label row); plain string rows stay white.
function rowFill(row: LabelRowLayout, index: number): string {
  const col = row.tone === 'column' ? layout.value.columns[index] : undefined
  return col ? toneColor(col.tone) : ROW_FILL
}

// Unknown icon key renders the visible fallback (never undefined into v-html)
// and names the bad key in dev — TwoBarCompare's resolveIcon pattern.
function resolveIcon(key: string): string {
  const path = iconPath(key)
  if (!path && import.meta.env?.DEV) {
    console.warn(`[ColumnRow] unknown icon key "${key}" — rendering the fallback icon`)
  }
  return path ?? ICON_FALLBACK
}

// The underline and chip bars ride the same amber status token as the measured
// middle-column mark; the heading chrome reads the report's measured heading
// hex and the plate outlines the measured near-black rim tone.
const UNDERLINE_FILL = statusAmber.accent
const HEADING_FILL = '#f4f4f6'
const PLATE_FILL = '#0d1a26'

// Chrome constants: white column labels and header, chrome-green title tail
// (titleAccent convention — a constant, never a palette field).
const LABEL_FILL = '#ffffff'
const ROW_FILL = '#ffffff'
const HEADER_FILL = '#ffffff'
const CHROME_GREEN = '#66fb00'

// Typography: the two text rows measured at source height 720 (dot glyphs
// ≈10px, label glyphs ≈13px) rescale with the stage; the header reuses
// StepFlow's measured 34px-at-848 formula for family consistency.
const type = computed(() => {
  const height = layout.value.viewBox.height
  const k = typeScale(layout.value.viewBox)
  return {
    titleSize: 34 * (height / 848),
    dotSize: 10 * k,
    labelSize: 13 * k,
    tintedSize: TINTED_LABEL_SIZE_SOURCE * k,
  }
})

// Bottom→top rise distance for the column entrance (hidden columns sit this
// far below their resting position); carried per group as a CSS variable.
const risePx = computed(() => RISE_FRAC * layout.value.viewBox.height)

function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}

function px(n: number): string {
  return `${fmt(n)}px`
}
</script>

<template>
  <svg
    class="columnrow"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${columns.length}-column row diagram`"
  >
    <!-- Measured outline layer: the thin dark plate rim behind each column and
         the field base rail. Near-black chrome — effectively invisible against
         the slide background until the columns light up, so it renders without
         a click of its own. -->
    <g class="sf-col-plates">
      <rect
        class="sf-col-rail"
        :x="layout.rail.x"
        :y="layout.rail.y"
        :width="layout.rail.w"
        :height="layout.rail.h"
        :fill="PLATE_FILL"
      />
      <rect
        v-for="col in layout.columns"
        :key="`plate-${col.id}`"
        class="sf-col-plate"
        :x="col.plate.x"
        :y="col.plate.y"
        :width="col.plate.w"
        :height="col.plate.h"
        :fill="PLATE_FILL"
      />
    </g>

    <!-- One sibling group per column: block + optional amber underline + inside
         label, rising bottom→top on the column's click (clicks 1…n). -->
    <g
      v-for="(col, i) in layout.columns"
      :key="col.id"
      v-click="i + 1"
      class="sf-col"
      :style="{ '--sf-rise': px(risePx) }"
    >
      <rect
        class="sf-col-block"
        :x="col.x"
        :y="col.y"
        :width="col.w"
        :height="col.h"
        :fill="toneColor(col.tone)"
      />
      <rect
        v-if="col.underlineRect"
        class="sf-col-underline"
        :x="col.underlineRect.x"
        :y="col.underlineRect.y"
        :width="col.underlineRect.w"
        :height="col.underlineRect.h"
        :fill="UNDERLINE_FILL"
      />
      <text
        class="sf-col-label"
        :x="col.x + col.w / 2"
        :y="col.y + col.h / 2"
        text-anchor="middle"
        dominant-baseline="central"
        :font-size="type.labelSize"
        :fill="LABEL_FILL"
        letter-spacing="0.08em"
      >{{ col.label }}</text>
    </g>

    <!-- Measured heading chrome: amber bar-chip (four bars on a baseline) and
         white icon badge over the middle column, with the white caption line
         underneath. Static chrome — the recording shows chip and badge already
         present when the first column pops. -->
    <g v-if="headingView" class="sf-col-heading">
      <rect
        v-for="(bar, bi) in headingView.bars"
        :key="`chip-bar-${bi}`"
        :x="bar.x"
        :y="bar.y"
        :width="bar.w"
        :height="bar.h"
        :fill="UNDERLINE_FILL"
      />
      <rect
        class="sf-col-chip-baseline"
        :x="headingView.chip.x"
        :y="headingView.baseline.y"
        :width="headingView.chip.w"
        :height="headingView.baseline.h"
        :fill="UNDERLINE_FILL"
      />
      <circle
        class="sf-col-badge"
        :cx="headingView.badge.cx"
        :cy="headingView.badge.cy"
        :r="headingView.badge.r"
        :fill="HEADING_FILL"
      />
      <g
        class="sf-col-heading-icon"
        :transform="`translate(${fmt(headingView.badge.cx - iconSize / 2)} ${fmt(headingView.badge.cy - iconSize / 2)}) scale(${fmt(iconSize / 24)})`"
        fill="none"
        stroke="#000000"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        v-html="headingView.icon"
      />
      <text
        class="sf-col-caption"
        :x="headingView.caption.x"
        :y="headingView.caption.y"
        text-anchor="middle"
        :font-size="headingView.caption.size"
        :fill="HEADING_FILL"
        letter-spacing="0.08em"
      >{{ headingView.captionText }}</text>
    </g>

    <!-- Label rows: one shared click after the columns (n + 1). Plain rows keep
         the legacy white dot/label sizing; tinted rows render at the measured
         size with every cell filled in its column's tone. -->
    <g
      v-if="layout.labelRows.length"
      v-click="layout.columns.length + 1"
      class="sf-col-rows"
    >
      <template v-for="(row, r) in layout.labelRows" :key="`row-${r}`">
        <text
          v-for="(cell, c) in row.cells"
          :key="`row-${r}-cell-${c}`"
          class="sf-col-row-text"
          :x="cell.x"
          :y="row.y"
          text-anchor="middle"
          dominant-baseline="hanging"
          :font-size="row.tone === 'column' ? type.tintedSize : (r === 0 ? type.dotSize : type.labelSize)"
          :fill="rowFill(row, c)"
          letter-spacing="0.06em"
        >{{ cell.text }}</text>
      </template>
    </g>

    <text
      v-if="title"
      class="header"
      :x="layout.viewBox.width * 0.033"
      :y="layout.viewBox.height * 0.075"
      :font-size="type.titleSize"
      :fill="HEADER_FILL"
      letter-spacing="0.06em"
    >{{ title }}<tspan v-if="titleAccent" :fill="CHROME_GREEN">&nbsp;{{ titleAccent }}</tspan></text>
  </svg>
</template>

<style scoped>
.columnrow {
  display: block;
  width: 100%;
  height: auto;
}

.columnrow text {
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Measured motion (research §3.2: columns pop in ~0.2s apart, each rising
 * bottom→top). Transition is taken from the destination state: forward reveal
 * runs the rise, the hidden state's transition:none makes backward nav
 * instant — the locked decision, zero JS. Scoped selectors (0,2,0 + attribute)
 * beat Slidev's built-in .slidev-vclick-target { transition: all .1s ease } —
 * no source-order reliance.
 */
.sf-col {
  transition:
    opacity 150ms ease-out,
    transform 180ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-col.slidev-vclick-hidden {
  opacity: 0;
  transform: translateY(var(--sf-rise));
  transition: none;
}

.sf-col-rows {
  transition: opacity 150ms ease-out;
}

.sf-col-rows.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-col,
  .sf-col-rows {
    transition: none;
  }
}
</style>
