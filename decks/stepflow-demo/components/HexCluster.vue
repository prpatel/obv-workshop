<script setup lang="ts">
import { computed } from 'vue'
import { hexLayout, type HexCell, type HexNodeData, type HexOptions, type HexArrangement } from './stepflow/hex'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'

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
}>(), { palette: () => ({}), arrangement: 'v' })

const p = computed(() => resolvePalette(props.palette))
const layout = computed(() => hexLayout(props.nodes.length, props.arrangement, props.geometry))

// House type scale, height fractions (matches StepFlow's rendered sizes at 1080p).
const type = computed(() => {
  const h = layout.value.viewBox.height
  return { titleSize: 0.04 * h, captionSize: 0.026 * h }
})

// Inner content placement, in hexagon-radius units (measured: the v5 icon sits
// above center with text lines below it, all inside the outline).
const ICON_SIZE_FRAC = 0.6
const ICON_CENTER_FRAC = -0.28
const TITLE_BASELINE_FRAC = 0.3
const CAPTION_BASELINE_FRAC = 0.52

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

function captionBaseline(cell: HexCell): number {
  return cell.cy + CAPTION_BASELINE_FRAC * layout.value.hexR
}

function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}

function px(n: number): string {
  return `${fmt(n)}px`
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
// resolvePalette contract.
function iconStroke(node: HexNodeData): string {
  return node.tone === 'tertiary' ? (p.value.accentTertiary ?? p.value.accent) : p.value.accent
}

// Header chrome is white; the titleAccent tail is chrome-green — a constant of
// the titleAccent convention, never a palette field (deck README).
const HEADER_FILL = '#ffffff'
const CHROME_GREEN = '#66fb00'
</script>

<template>
  <svg
    class="hexcluster"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${nodes.length}-hex diagram`"
  >
    <text
      v-if="title"
      class="header"
      :x="layout.viewBox.width * 0.033"
      :y="layout.viewBox.height * 0.075"
      :font-size="type.titleSize"
      :fill="HEADER_FILL"
      letter-spacing="0.06em"
    >{{ title }} <tspan v-if="titleAccent" :fill="CHROME_GREEN">{{ titleAccent }}</tspan></text>

    <!-- One cell per node, never nested v-clicks: the outline draw and the inner
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
        pre-sets --sf-drawn to the full perimeter, so its click draws the whole
        outline (offset len → 0 over 300ms). Hidden = fully retracted +
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
        :style="{ '--sf-len': px(layout.cells[i].perimeter), '--sf-drawn': px(layout.cells[i].perimeter) }"
      />

      <g v-click="i + 1" class="sf-hex-content">
        <g
          class="icon"
          :transform="iconTransform(layout.cells[i])"
          fill="none"
          :stroke="iconStroke(node)"
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
          :fill="p.accent"
          letter-spacing="0.06em"
        >{{ node.title }}</text>
        <text
          class="caption"
          :x="layout.cells[i].cx"
          :y="captionBaseline(layout.cells[i])"
          text-anchor="middle"
          :font-size="type.captionSize"
          :fill="p.subtext"
        >{{ node.caption }}</text>
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
 * Measured motion (StepFlow §9 pattern). Transition is taken from the
 * destination state: forward reveal runs the draw/fade, the hidden state's
 * transition:none makes backward nav instant — the locked decision, zero JS.
 * Scoped selectors (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease } — no source-order reliance.
 */
.sf-hex-fill {
  stroke-dasharray: var(--sf-len);
  /* Dash phase: a --sf-len dash at offset o paints the span [0, len − o]; the
   * offset must be the REMAINING length. Revealed, --sf-drawn is the full
   * perimeter, so offset 0 paints the complete ring (StepFlow.test.ts's
   * union-coverage regression, applied per closed cell). */
  stroke-dashoffset: calc(var(--sf-len) - var(--sf-drawn));
  transition:
    stroke-dashoffset 300ms cubic-bezier(0, 0, 0.2, 1),
    opacity 120ms ease-out;
}

.sf-hex-fill.slidev-vclick-hidden {
  stroke-dashoffset: var(--sf-len);
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
