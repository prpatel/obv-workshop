<script setup lang="ts">
import { computed } from 'vue'
import {
  schematicRowsLayout,
  ROW_FONT_FRAC,
  type CodeRow,
  type RowTokenTone,
  type SchematicLine,
  type SchematicLineTone,
} from './stepflow/rows'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'

const props = withDefaults(defineProps<{
  /** Mono token rows, revealed one per click in data order. */
  rows: CodeRow[]
  /** Optional thin-line schematic; each line draws within its attached row's click. */
  schematic?: SchematicLine[]
  /** Partial palette merged over the measured `cyanOnBlack` preset. */
  palette?: StepFlowPaletteOverride
  /** Mono header line, e.g. 'ANSWER SERVICE'. */
  title?: string
  /** Header tail rendered in chrome green after `title` (two-tone chrome convention). */
  titleAccent?: string
}>(), { schematic: () => [], palette: () => ({}) })

const p = computed(() => resolvePalette(props.palette))
const layout = computed(() => schematicRowsLayout({ rows: props.rows, schematic: props.schematic }))

// Token tone colors. `accent`/`alt` come from the palette; `plain` is chrome
// white (measured #f5f4f7) and `chrome` is the recordings' terminal green —
// both constants of the tone convention, never palette fields (the NodeEdge
// chrome precedent).
const PLAIN_TEXT = '#f5f4f7'
const CHROME_GREEN = '#66fb00'

function tokenColor(tone: RowTokenTone): string {
  if (tone === 'accent') return p.value.accent
  if (tone === 'alt') return p.value.accentAlt ?? p.value.accent
  if (tone === 'chrome') return CHROME_GREEN
  return PLAIN_TEXT
}

function lineColor(tone: SchematicLineTone): string {
  return tone === 'plain' ? PLAIN_TEXT : p.value.accent
}

// Typography on the StepFlow scale: 34px title at source height 848, rescaled
// so custom viewBox sizes stay proportional (StepFlow.vue pattern). Rows use
// the measured mono size at the canvas height.
const type = computed(() => ({
  titleSize: 34 * (layout.value.viewBox.height / 848),
  rowSize: ROW_FONT_FRAC * layout.value.viewBox.height,
}))

// Header band aligned with the SVG siblings: left ≈3.3%w, the 0.075h baseline
// lifted to a top offset for HTML (glyph top ≈ baseline − 0.8em).
const header = computed(() => ({
  left: layout.value.viewBox.width * 0.033,
  top: layout.value.viewBox.height * 0.044,
}))

function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}

function px(n: number): string {
  return `${fmt(n)}px`
}
</script>

<template>
  <div class="sf-rows" role="img" :aria-label="`${rows.length}-row schematic listing`">
    <div
      v-if="title"
      class="sf-rows-header"
      :style="{ left: px(header.left), top: px(header.top), fontSize: px(type.titleSize) }"
    >{{ title }}<span v-if="titleAccent" class="sf-rows-header-accent"> {{ titleAccent }}</span></div>

    <!--
      Embedded schematic: the dim base strokes are always visible; one stacked
      accent copy per line draws the full polyline on its attached row's click
      (the NodeEdge edge pattern, fed by the shared paths.ts helpers). Slidev
      toggles each copy's OWN slidev-vclick-hidden class — hidden = fully
      retracted + transition:none (backward nav snaps), revealed = 300ms
      ease-out draw.
    -->
    <svg
      class="sf-rows-schematic"
      :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
      aria-hidden="true"
    >
      <path
        v-for="(line, k) in layout.schematic"
        :key="`base-${k}`"
        class="sf-rows-line-base"
        :d="line.d"
        fill="none"
        :stroke="p.track"
        :stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        v-for="(line, k) in layout.schematic"
        :key="`fill-${k}`"
        v-click="line.atIndex + 1"
        class="sf-rows-line-fill"
        :d="line.d"
        fill="none"
        :stroke="lineColor(line.tone)"
        :stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        :style="{ '--sf-len': px(line.length), '--sf-drawn': px(line.length) }"
      />
    </svg>

    <!-- One div per row: its tokens arrive together on click i + 1 — one
         click per row (the recording's auto-run re-paced, locked deviation:
         no typewriter is built). The rise is 4px, the fade 150ms. -->
    <div
      v-for="(row, i) in layout.rows"
      :key="row.id"
      v-click="i + 1"
      class="sf-rows-row"
      :style="{ left: px(row.x), top: px(row.y), fontSize: px(type.rowSize) }"
    >
      <span
        v-for="(tok, j) in row.tokens"
        :key="j"
        class="sf-rows-token"
        :class="`sf-rows-token-${tok.tone}`"
        :style="{ color: tokenColor(tok.tone) }"
      >{{ tok.text }}</span>
    </div>
  </div>
</template>

<style scoped>
.sf-rows {
  position: absolute;
  inset: 0;
}

.sf-rows-header {
  position: absolute;
  color: #ffffff;
  letter-spacing: 0.06em;
}

.sf-rows-header-accent {
  color: #66fb00;
}

.sf-rows-schematic {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.sf-rows-row {
  position: absolute;
  line-height: 1;
  letter-spacing: 0.02em;
  white-space: pre;
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
  transition:
    opacity 150ms ease-out,
    transform 150ms ease-out;
}

/*
 * Measured motion (visual-spec §9 pattern). Transition is taken from the
 * destination state: forward reveal runs the fade-and-rise, the hidden
 * state's transition:none makes backward nav instant — the locked decision,
 * zero JS. Slidev's built-in .slidev-vclick-hidden supplies opacity: 0.
 * Scoped selectors (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease } — no source-order reliance.
 */
.sf-rows-row.slidev-vclick-hidden {
  transform: translateY(4px);
  transition: none;
}

.sf-rows-line-fill {
  stroke-dasharray: var(--sf-len);
  /* Dash phase: a --sf-len dash at offset o paints the span [0, len − o], so
   * the offset must be the REMAINING length. Each line carries its full
   * analytic length in both vars — revealed = offset 0 = the whole polyline.
   */
  stroke-dashoffset: calc(var(--sf-len) - var(--sf-drawn));
  transition:
    stroke-dashoffset 300ms cubic-bezier(0, 0, 0.2, 1),
    opacity 120ms ease-out;
}

.sf-rows-line-fill.slidev-vclick-hidden {
  stroke-dashoffset: var(--sf-len);
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-rows-row,
  .sf-rows-line-fill {
    transition: none;
  }
}
</style>
