<script setup lang="ts">
import { computed } from 'vue'
import { hexLayout, type HexCell, type HexNodeData, type HexOptions, type HexArrangement } from './stepflow/hex'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'
import TitleChrome from './stepflow/TitleChrome.vue'

const props = withDefaults(defineProps<{
  /** One entry per cell; content travels with the slide. */
  nodes: HexNodeData[]
  /** Partial palette merged over the measured `cyanOnBlack` preset. */
  palette?: StepFlowPaletteOverride
  /** Optional geometry overrides; defaults are the measured fractions. */
  geometry?: HexOptions
  /** 'v' honeycomb (default, the recording's shape) or a single 'row'. */
  arrangement?: HexArrangement
  /** Mono header line, e.g. 'THE MODERN DATA STACK'. */
  title?: string
  /** Optional header tail rendered in chrome-green (the recordings' two-tone header). */
  titleAccent?: string
  /** Short amber legend line rendered above the center column's top vertex (the v5 recording's legend glyphs). */
  legend?: string
}>(), { palette: () => ({}), arrangement: 'v' })

const p = computed(() => resolvePalette(props.palette))
const layout = computed(() => hexLayout(props.nodes.length, props.arrangement, props.geometry))

// House type scale, height fractions. Header cap ≈ 0.082·h (the recordings'
// chrome is a design element — wave-1 cause #4); inner text rows ≈ 34px at 1080
// (the v5 recording's glyph rows).
const type = computed(() => {
  const h = layout.value.viewBox.height
  return { titleSize: 0.0315 * h, captionSize: 0.0315 * h, legendSize: 0.0315 * h }
})

// Inner content placement, in hexagon-radius units (measured: the v5 icon center
// sits ≈ 0.55R above the cell center with tone-colored text rows below it).
const ICON_SIZE_FRAC = 0.6
const ICON_CENTER_FRAC = -0.55
const TITLE_BASELINE_FRAC = 0.32
const CAPTION_PITCH_FRAC = 0.21

// Bottom chrome rule (measured: 67.8%w × ~6px at y 0.894–0.900·h, centered on
// the cluster axis — the report's "y1023–1028" pixels at native 1144 height).
const RULE_WIDTH_FRAC = 0.678
const RULE_Y_FRAC = 0.8944
const RULE_HEIGHT_FRAC = 0.00556

// Legend glyphs sit just above the center cell's top vertex (measured gap 71/1144).
const LEGEND_GAP_FRAC = 0.062

const ICON_BOX = 24
function iconTransform(cell: HexCell): string {
  const size = ICON_SIZE_FRAC * layout.value.hexR
  const s = size / ICON_BOX
  const cy = cell.cy + ICON_CENTER_FRAC * layout.value.hexR
  return `translate(${fmt(cell.cx - size / 2)} ${fmt(cy - size / 2)}) scale(${fmt(s)})`
}

function titleBaseline(cell: HexCell): number {
  return cell.cy + TITLE_BASELINE_FRAC * layout.value.hexR
}

function captionBaseline(cell: HexCell, row: number): number {
  return cell.cy + (TITLE_BASELINE_FRAC + CAPTION_PITCH_FRAC * (row + 1)) * layout.value.hexR
}

// Captions may carry '\n' breaks — each becomes one rendered row (the v5 cells
// hold multi-row tone-colored text, not a single caption line).
function captionRows(node: HexNodeData): string[] {
  return node.caption.split('\n')
}

// The legend anchors above the middle column: the cell closest to the cluster
// axis (the center hex of the settled row, the bottom cell of the V).
const legendCell = computed(() => {
  const axis = layout.value.axisX
  return layout.value.cells.reduce((a, b) =>
    Math.abs(b.cx - axis) < Math.abs(a.cx - axis) ? b : a,
  )
})

const legendBaseline = computed(
  () => legendCell.value.cy - layout.value.hexR - LEGEND_GAP_FRAC * layout.value.viewBox.height,
)

function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}

// Unknown key renders the visible fallback (never undefined into v-html) and
// names the bad key in dev so the author fixes the string.
function resolveIcon(key: string): string {
  const path = iconPath(key)
  if (!path && import.meta.env?.DEV) {
    console.warn(`[HexCluster] unknown icon key "${key}" — rendering the fallback icon`)
  }
  return path ?? ICON_FALLBACK
}

// 'tertiary' tone consumes the optional accentTertiary field (deep-merged like
// every palette field); omitted, it falls back to the accent — the documented
// resolvePalette contract. The v5 cells carry tone-colored text (blue cells →
// blue rows, teal-green cell → green rows); no gray inside the outlines.
function toneColor(node: HexNodeData): string {
  return node.tone === 'tertiary' ? (p.value.accentTertiary ?? p.value.accent) : p.value.accent
}

// Title chrome lives in the shared TitleChrome component (titleAccent
// convention, deck README). The legend glyphs are the v5 recording's amber
// (measured #ebb92a) — likewise a constant.
const HEADER_FILL = '#ffffff'
const LEGEND_AMBER = '#ebb92a'
</script>

<template>
  <svg
    class="hexcluster"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${nodes.length}-hex diagram`"
  >
    <!-- Chrome (header + bottom rule) centers on the cluster axis — the v5
         recording's header spans x 14.8–80.8%w, its rule x 13.7–81.5%w, both
         centered at ≈ 47.6%w. -->
    <!-- Shared title chrome: centered two-tone title on the cluster axis
         (HexCluster Title row: the sheet reads cap ≈72–86 in the band y45–145;
         the midpoint 79 is used, centered on the measured ≈47.6%w axis). -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :cap-height="79"
      :cap-top="45"
      :center-x="layout.axisX"
    />

    <rect
      class="sf-hex-rule"
      :x="layout.axisX - (layout.viewBox.width * RULE_WIDTH_FRAC) / 2"
      :y="layout.viewBox.height * RULE_Y_FRAC"
      :width="layout.viewBox.width * RULE_WIDTH_FRAC"
      :height="layout.viewBox.height * RULE_HEIGHT_FRAC"
      :fill="HEADER_FILL"
    />

    <text
      v-if="legend"
      class="legend"
      :x="layout.axisX"
      :y="legendBaseline"
      text-anchor="middle"
      :font-size="type.legendSize"
      :fill="LEGEND_AMBER"
      letter-spacing="0.06em"
    >{{ legend }}</text>

    <!-- One cell per node, never nested v-clicks: the outline pop and the inner
         content fade arrive together on click i + 1 (the two-phase pattern). -->
    <template v-for="(node, i) in nodes" :key="node.id">
      <!-- Dim base outline: always visible. -->
      <path
        class="sf-hex-base"
        :d="layout.cells[i].path"
        fill="none"
        :stroke="p.track"
        :stroke-width="layout.strokeWidth"
        stroke-linejoin="round"
      />

      <!--
        Reveal binding (StepFlow pattern, spike art_7Q2OtXCm): the accent copy
        pops in on its click — the v5 recording lands ~72% of final in one frame
        and settles ~50ms (60fps walk): a pop, not a stroke draw, so the
        dash-array mechanics are gone. Hidden = fully transparent +
        transition:none (backward nav snaps).
      -->
      <path
        v-click="i + 1"
        class="sf-hex-fill"
        :d="layout.cells[i].path"
        fill="none"
        :stroke="p.accent"
        :stroke-width="layout.strokeWidth"
        stroke-linejoin="round"
      />

      <g v-click="i + 1" class="sf-hex-content">
        <g
          class="icon"
          :transform="iconTransform(layout.cells[i])"
          fill="none"
          :stroke="toneColor(node)"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          v-html="resolveIcon(node.icon)"
        />
        <text
          class="title"
          :x="layout.cells[i].cx"
          :y="titleBaseline(layout.cells[i])"
          text-anchor="middle"
          :font-size="type.titleSize"
          :fill="toneColor(node)"
          letter-spacing="0.06em"
        >{{ node.title }}</text>
        <text
          v-for="(row, r) in captionRows(node)"
          :key="`${node.id}-row-${r}`"
          class="caption"
          :x="layout.cells[i].cx"
          :y="captionBaseline(layout.cells[i], r)"
          text-anchor="middle"
          :font-size="type.captionSize"
          :fill="toneColor(node)"
          fill-opacity="0.78"
        >{{ row }}</text>
      </g>
    </template>
  </svg>
</template>

<style scoped>
.hexcluster {
  display: block;
  width: 100%;
  height: auto;
}

.hexcluster text {
  /* Open question #1 (font family): mono stack until the face is confirmed. */
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Measured motion (StepFlow §9 pattern). The v5 outline is a POP, not a draw:
 * it lands ~72% of final in one frame and settles ~50ms (60fps walk, wave-1
 * report §6) — 60ms with cubic-bezier(0, 0, 0, 1) puts ≈ 0.72 on the first
 * frame. Transition is taken from the destination state: forward reveal runs
 * opacity 0→1 + scale 0.72→1, the hidden state's transition:none makes
 * backward nav instant — the locked decision, zero JS. Scoped selectors
 * (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease } — no source-order reliance.
 */
.sf-hex-fill {
  opacity: 1;
  transform-box: fill-box;
  transform-origin: center;
  transition:
    opacity 60ms cubic-bezier(0, 0, 0, 1),
    transform 60ms cubic-bezier(0, 0, 0, 1);
}

.sf-hex-fill.slidev-vclick-hidden {
  opacity: 0;
  transform: scale(0.72);
  transition: none;
}

.sf-hex-content {
  transition: opacity 150ms ease-out;
}

.sf-hex-content.slidev-vclick-hidden {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-hex-fill,
  .sf-hex-content {
    transition: none;
  }
}
</style>
