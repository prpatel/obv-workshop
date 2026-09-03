<script setup lang="ts">
import { computed } from 'vue'
import { columnRowLayout, RISE_FRAC, typeScale, type Column } from './stepflow/columns'
import { orangeSpine, resolvePalette, statusAmber, type StepFlowPaletteOverride } from './stepflow/palettes'

const props = withDefaults(defineProps<{
  /** One entry per column; content travels with the slide. */
  columns: Column[]
  /** Top edge of every column, as a fraction of stage height (measured 51.4%h). */
  yFrac: number
  /** Column height, as a fraction of stage height (measured 23.3%h). */
  hFrac: number
  /** Optional text rows below the columns — the measured dot row + label row. */
  labelRows?: string[][]
  /** Partial palette merged over the measured `cyanOnBlack` preset. */
  palette?: StepFlowPaletteOverride
  /** Mono header line, e.g. 'PIPELINE'. */
  title?: string
  /** Header tail rendered in chrome green after `title` (two-tone chrome convention). */
  titleAccent?: string
}>(), { labelRows: () => [], palette: () => ({}) })

const p = computed(() => resolvePalette(props.palette))
const layout = computed(() => columnRowLayout({ columns: props.columns, yFrac: props.yFrac, hFrac: props.hFrac, labelRows: props.labelRows }))

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
  return p.value.accent
}

// The underline rides the same amber status token as the measured middle-column mark.
const UNDERLINE_FILL = statusAmber.accent

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

    <!-- Dot row + label row: one shared click after the columns (n + 1),
         white glyphs centered under their columns at the measured tops. -->
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
          :font-size="r === 0 ? type.dotSize : type.labelSize"
          :fill="ROW_FILL"
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
