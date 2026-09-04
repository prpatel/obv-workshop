<script setup lang="ts">
import { computed, useId } from 'vue'
import {
  EDGE_STROKE,
  LABEL_PITCH_FRAC,
  LABEL_SIZE_FRAC,
  NODE_PLATE,
  NODE_RX,
  NODE_STROKE,
  STATUS_RED,
  nodeEdgeLayout,
  type FlowEdge,
  type FlowNode,
  type FlowStatus,
} from './stepflow/nodeEdge'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import TitleChrome from './stepflow/TitleChrome.vue'

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
  /** Terminal readout lines, bottom-left (the recording's "LAST DEPLOY 14m AGO" row). */
  terminal?: string[]
}>(), { status: () => [], palette: () => ({}) })

const p = computed(() => resolvePalette(props.palette))
const layout = computed(() => nodeEdgeLayout({ nodes: props.nodes, edges: props.edges, status: props.status }))
const washId = useId()

// Node tones map to palette roles; the plain tone is chrome white (the
// recording's white-bordered node) — chrome, not a palette field. Title
// chrome lives in the shared TitleChrome component. The status tone is the
// solid bright-red status square.
const PLAIN_STROKE = '#f5f4f7'

function toneColor(tone: FlowNode['tone']): string {
  if (tone === 'accent') return p.value.accent
  if (tone === 'alt') return p.value.accentAlt ?? p.value.accent
  if (tone === 'status') return STATUS_RED
  return PLAIN_STROKE
}

// Status elements reuse the same tone mapping (their tone enum is narrower).
function statusColor(tone: FlowStatus['tone']): string {
  return toneColor(tone)
}

// Round to 4 decimals so computed px values render clean (0.072 × 1080 → 77.76, not 77.75999999999999).
function round4(n: number): number {
  return Number(n.toFixed(4))
}

// Typography on the recording's chrome scale: the header cap measures 7.2%h
// (82px at the 1144-tall source), node labels ~20px with ~26px line pitch at
// 1080 — all as height fractions so custom viewBox sizes stay proportional.
const type = computed(() => {
  const h = layout.value.viewBox.height
  return {
    labelSize: round4(LABEL_SIZE_FRAC * h),
    labelPitch: round4(LABEL_PITCH_FRAC * h),
    terminalSize: round4(0.0209 * h),
  }
})

// Vertical label line centers: n lines pitched around the square center.
function labelY(cy: number, line: number, count: number): number {
  return round4(cy + (line - (count - 1) / 2) * type.value.labelPitch)
}

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
</script>

<template>
  <svg
    class="nodeedge"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${nodes.length}-node network diagram`"
  >
    <defs>
      <!--
        Red ambient wash behind the network zone (the recording's red haze).
        Tuned to the report's census: the haze's visible ink must sit almost
        entirely in the glow band (lum 41-110, chroma>25) at ~19% of
        non-black, with only a thin 24-41 tail — hence the steep falloff.
      -->
      <radialGradient :id="washId" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#781e1e" stop-opacity="1" />
        <stop offset="0.21" stop-color="#781e1e" stop-opacity="0.68" />
        <stop offset="0.45" stop-color="#781e1e" stop-opacity="0.40" />
        <stop offset="0.68" stop-color="#781e1e" stop-opacity="0.06" />
        <stop offset="1" stop-color="#781e1e" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- Ambient layer: static chrome, not click-bound. -->
    <ellipse
      class="sf-ne-wash"
      :cx="layout.viewBox.width * 0.635"
      :cy="layout.viewBox.height * 0.68"
      :rx="layout.viewBox.width * 0.16"
      :ry="layout.viewBox.height * 0.215"
      :fill="`url(#${washId})`"
    />

    <!--
      Edges: one dim-red polyline per edge, revealed as a fast pop. Measured
      from the src-3 recording at native fps: the probe zone is empty until the
      edge's onset frame and the edge reaches full ink 1–2 frames later (~55–80ms)
      — a pop, not a stroke draw, and no dim base edge exists before reveal.
    -->
    <path
      v-for="(edge, j) in layout.edges"
      :key="`edge-${j}`"
      v-click="nodes.length + j + 1"
      class="sf-ne-edge"
      :d="edge.d"
      fill="none"
      :stroke="p.track"
      :stroke-width="EDGE_STROKE"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- One group per node: the bordered plate square with its 3-line
         tone-colored label inside (or the solid bright-red status square),
         arriving on click i + 1. -->
    <g
      v-for="(node, i) in layout.nodes"
      :key="node.id"
      v-click="i + 1"
      class="sf-ne-node"
    >
      <rect
        class="sf-ne-node-plate"
        :x="node.cx - node.w / 2"
        :y="node.cy - node.h / 2"
        :width="node.w"
        :height="node.h"
        :rx="NODE_RX"
        :fill="node.tone === 'status' ? STATUS_RED : NODE_PLATE"
        :stroke="toneColor(node.tone)"
        :stroke-width="NODE_STROKE"
      />
      <text
        v-if="node.label.length"
        class="sf-ne-node-label"
        text-anchor="middle"
        :font-size="type.labelSize"
        :fill="node.tone === 'status' ? '#000000' : toneColor(node.tone)"
        letter-spacing="0.04em"
      ><tspan
        v-for="(line, l) in node.label"
        :key="l"
        :x="node.cx"
        :y="labelY(node.cy, l, node.label.length)"
        dominant-baseline="central"
      >{{ line }}</tspan></text>
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
        stroke-width="3"
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
        :font-size="type.labelSize"
        :fill="el.kind === 'block' ? '#000000' : statusColor(el.tone)"
        letter-spacing="0.06em"
      >{{ el.text }}</text>
      <text
        v-else
        :x="el.cx"
        :y="el.cy + el.h / 2 + 24"
        text-anchor="middle"
        :font-size="type.labelSize"
        :fill="statusColor(el.tone)"
        letter-spacing="0.06em"
      >{{ el.text }}</text>
    </g>

    <!-- Terminal readout, bottom-left: the recording's white mono row. -->
    <text
      v-for="(line, l) in terminal"
      :key="`terminal-${l}`"
      class="sf-ne-terminal"
      :x="layout.viewBox.width * 0.087"
      :y="layout.viewBox.height * (0.738 + 0.026 * l)"
      dominant-baseline="central"
      :font-size="type.terminalSize"
      fill="#ffffff"
      letter-spacing="0.05em"
    >{{ line }}</text>

    <!-- Shared title chrome: sheet-measured centered two-tone title
         (NodeEdge Title row: cap 77 in the band y49–126, centered ≈x914). -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :cap-height="77"
      :cap-top="49"
      :center-x="914"
    />
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
 * Measured motion (visual-spec §9 pattern; pops re-measured from the src-3
 * recording at native fps — status square full in ~2–3 frames, edges in 1–2).
 * Transition is taken from the destination state: forward reveal runs the pop,
 * the hidden state's transition:none makes backward nav instant — the locked
 * decision, zero JS. Scoped selectors (0,2,0 + attribute) beat Slidev's
 * built-in .slidev-vclick-target { transition: all .1s ease }.
 */
.sf-ne-edge {
  transition: opacity 80ms ease-out;
}

.sf-ne-edge.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

.sf-ne-node {
  transition: opacity 70ms ease-out;
}

.sf-ne-node.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

.sf-ne-node-plate {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 70ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-ne-node.slidev-vclick-hidden .sf-ne-node-plate {
  transform: scale(0.92);
  transition: none;
}

.sf-ne-status {
  transition: opacity 70ms ease-out;
}

.sf-ne-status.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-ne-edge,
  .sf-ne-node,
  .sf-ne-node-plate,
  .sf-ne-status {
    transition: none;
  }
}
</style>
