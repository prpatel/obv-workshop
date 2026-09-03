<script setup lang="ts">
import { computed } from 'vue'
import { nodeEdgeLayout, type FlowEdge, type FlowNode, type FlowStatus } from './stepflow/nodeEdge'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'

const props = withDefaults(defineProps<{
  /** Free-position nodes; positions are data (canvas fractions), never computed. */
  nodes: FlowNode[]
  /** Polyline edges between node ids; fractions of the canvas. */
  edges: FlowEdge[]
  /** Optional status layer — one click per element, revealed after nodes and edges. */
  status?: FlowStatus[]
  /** Partial palette merged over the measured `cyanOnBlack` preset. */
  palette?: StepFlowPaletteOverride
  /** Mono header line, e.g. 'DATA'. */
  title?: string
  /** Header tail rendered in chrome green after `title` (two-tone chrome convention). */
  titleAccent?: string
}>(), { status: () => [], palette: () => ({}) })

const p = computed(() => resolvePalette(props.palette))
const layout = computed(() => nodeEdgeLayout({ nodes: props.nodes, edges: props.edges, status: props.status }))

// Node tones map to palette roles; the plain tone is chrome white (measured
// node stroke #f5f4f7) — chrome, not a palette field, like the header fill.
const PLAIN_STROKE = '#f5f4f7'
const CHROME_GREEN = '#66fb00'

function toneColor(tone: FlowNode['tone']): string {
  if (tone === 'accent') return p.value.accent
  if (tone === 'alt') return p.value.accentAlt ?? p.value.accent
  return PLAIN_STROKE
}

// Status elements reuse the same tone mapping (their tone enum is narrower).
function statusColor(tone: FlowStatus['tone']): string {
  return toneColor(tone)
}

// Icons render in a 24-unit Lucide space; the icon box fits the inner square
// chip measured inside plain nodes (~40px of the 66px square).
const ICON_BOX = 24
const ICON_SIZE = 40
function iconTransform(cx: number, cy: number): string {
  const s = ICON_SIZE / ICON_BOX
  return `translate(${fmt(cx - ICON_SIZE / 2)} ${fmt(cy - ICON_SIZE / 2)}) scale(${fmt(s)})`
}

// Unknown key renders the visible fallback (never undefined into v-html) and
// names the bad key in dev so the author fixes the string.
function resolveIcon(key: string): string {
  const path = iconPath(key)
  if (!path && import.meta.env?.DEV) {
    console.warn(`[NodeEdge] unknown icon key "${key}" — rendering the fallback icon`)
  }
  return path ?? ICON_FALLBACK
}

// Typography on the StepFlow scale: 34px title at source height 848, rescaled
// so custom viewBox sizes stay proportional (StepFlow.vue pattern).
const type = computed(() => {
  const k = layout.value.viewBox.height / 848
  return { titleSize: 34 * k, labelSize: 13, statusSize: 15 }
})

// Chunky down-arrow glyph for status kind 'arrow', centered on (cx, cy).
function arrowPath(cx: number, cy: number, h: number): string {
  const top = cy - h / 2
  const stemW = 18
  const headW = 46
  const stemH = h - 40
  return `M ${fmt(cx - stemW / 2)} ${fmt(top)} h ${stemW} v ${stemH} h ${(headW - stemW) / 2} L ${fmt(cx)} ${fmt(top + h)} L ${fmt(cx - headW / 2)} ${fmt(top + stemH)} h ${(headW - stemW) / 2} z`
}

function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}

function px(n: number): string {
  return `${fmt(n)}px`
}
</script>

<template>
  <svg
    class="nodeedge"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${nodes.length}-node network diagram`"
  >
    <!-- Dim base edges: the full polylines, always visible. -->
    <path
      v-for="(edge, j) in layout.edges"
      :key="`base-${j}`"
      class="sf-ne-edge-base"
      :d="edge.d"
      fill="none"
      :stroke="p.track"
      :stroke-width="6"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!--
      Reveal binding (StepFlow.vue pattern, spike art_7Q2OtXCm): one stacked
      accent copy per edge, pre-set via --sf-drawn to draw the whole polyline.
      Status edges draw in accentAlt (the red status color); plain edges in
      accent. Slidev toggles each copy's OWN slidev-vclick-hidden class —
      hidden = fully retracted + transition:none (backward nav snaps),
      revealed = 300ms ease-out draw.
    -->
    <path
      v-for="(edge, j) in layout.edges"
      :key="`fill-${j}`"
      v-click="nodes.length + j + 1"
      class="sf-ne-edge-fill"
      :d="edge.d"
      fill="none"
      :stroke="edge.status ? (p.accentAlt ?? p.accent) : p.accent"
      :stroke-width="6"
      stroke-linecap="round"
      stroke-linejoin="round"
      :style="{ '--sf-len': px(edge.length), '--sf-drawn': px(edge.length) }"
    />

    <!-- One group per node: outline circle (+ inner chip + icon on plain nodes)
         or its label, arriving on click i + 1. -->
    <g
      v-for="(node, i) in layout.nodes"
      :key="node.id"
      v-click="i + 1"
      class="sf-ne-node"
    >
      <circle
        class="sf-ne-node-ring"
        :cx="node.cx"
        :cy="node.cy"
        :r="node.r"
        fill="none"
        :stroke="toneColor(node.tone)"
        :stroke-width="3"
      />
      <template v-if="node.tone === 'plain' && node.icon">
        <!-- Measured inner square chip behind the icon (v3 white node). -->
        <rect
          class="sf-ne-node-chip"
          :x="node.cx - node.r * 0.6875"
          :y="node.cy - node.r * 0.6875"
          :width="node.r * 1.375"
          :height="node.r * 1.375"
          rx="6"
          fill="none"
          :stroke="toneColor(node.tone)"
          :stroke-width="3"
        />
        <g
          class="sf-ne-node-icon"
          :transform="iconTransform(node.cx, node.cy)"
          fill="none"
          :stroke="p.iconStroke"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          v-html="resolveIcon(node.icon)"
        />
      </template>
      <text
        v-else-if="node.label"
        class="sf-ne-node-label"
        :x="node.cx"
        :y="node.cy"
        text-anchor="middle"
        dominant-baseline="central"
        :font-size="type.labelSize"
        :fill="PLAIN_STROKE"
        letter-spacing="0.08em"
      >{{ node.label }}</text>
    </g>

    <!-- Status layer: one click per element, after nodes and edges. The
         recording's amber→red swap is modeled appearance-only — elements
         reveal additively, nothing is ever removed. -->
    <g
      v-for="(el, k) in layout.status"
      :key="`status-${k}`"
      v-click="nodes.length + edges.length + k + 1"
      class="sf-ne-status"
    >
      <rect
        v-if="el.kind === 'block'"
        :x="el.cx - el.w / 2"
        :y="el.cy - el.h / 2"
        :width="el.w"
        :height="el.h"
        rx="8"
        :fill="statusColor(el.tone)"
      />
      <rect
        v-else-if="el.kind === 'outline'"
        :x="el.cx - el.w / 2"
        :y="el.cy - el.h / 2"
        :width="el.w"
        :height="el.h"
        rx="8"
        fill="none"
        :stroke="statusColor(el.tone)"
        :stroke-width="3"
      />
      <path
        v-else
        :d="arrowPath(el.cx, el.cy, el.h)"
        :fill="statusColor(el.tone)"
      />
      <text
        v-if="el.kind !== 'arrow'"
        :x="el.cx"
        :y="el.cy"
        text-anchor="middle"
        dominant-baseline="central"
        :font-size="type.statusSize"
        :fill="el.kind === 'block' ? '#000000' : statusColor(el.tone)"
        letter-spacing="0.06em"
      >{{ el.text }}</text>
      <text
        v-else
        :x="el.cx"
        :y="el.cy + el.h / 2 + 24"
        text-anchor="middle"
        :font-size="type.statusSize"
        :fill="statusColor(el.tone)"
        letter-spacing="0.06em"
      >{{ el.text }}</text>
    </g>

    <text
      v-if="title"
      class="header"
      :x="layout.viewBox.width * 0.033"
      :y="layout.viewBox.height * 0.075"
      :font-size="type.titleSize"
      fill="#ffffff"
      letter-spacing="0.06em"
    >{{ title }}<tspan v-if="titleAccent" :fill="CHROME_GREEN">&nbsp;{{ titleAccent }}</tspan></text>
  </svg>
</template>

<style scoped>
.nodeedge {
  display: block;
  width: 100%;
  height: auto;
}

.nodeedge text {
  /* Open question #1 (font family): mono stack until the face is confirmed. */
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Measured motion (visual-spec §9 pattern). Transition is taken from the
 * destination state: forward reveal runs the draw/fade, the hidden state's
 * transition:none makes backward nav instant — the locked decision, zero JS.
 * Scoped selectors (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease } — no source-order reliance.
 */
.sf-ne-edge-fill {
  stroke-dasharray: var(--sf-len);
  /* Dash phase: a --sf-len dash at offset o paints the span [0, len − o], so
   * the offset must be the REMAINING length. Each edge carries its full
   * analytic length in both vars — revealed = offset 0 = the whole polyline.
   */
  stroke-dashoffset: calc(var(--sf-len) - var(--sf-drawn));
  transition:
    stroke-dashoffset 300ms cubic-bezier(0, 0, 0.2, 1),
    opacity 120ms ease-out;
}

.sf-ne-edge-fill.slidev-vclick-hidden {
  stroke-dashoffset: var(--sf-len);
  transition: none;
}

.sf-ne-node {
  transition: opacity 150ms ease-out;
}

.sf-ne-node.slidev-vclick-hidden {
  transition: none;
}

.sf-ne-node-ring {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 120ms cubic-bezier(0, 0, 0.2, 1), opacity 150ms ease-out;
}

.sf-ne-node.slidev-vclick-hidden .sf-ne-node-ring {
  transform: scale(0.6);
  transition: none;
}

.sf-ne-status {
  transition: opacity 150ms ease-out;
}

.sf-ne-status.slidev-vclick-hidden {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-ne-edge-fill,
  .sf-ne-node,
  .sf-ne-node-ring,
  .sf-ne-status {
    transition: none;
  }
}
</style>
