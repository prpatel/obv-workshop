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
  ambienceLayout,
  nodeEdgeClickPlan,
  nodeEdgeLayout,
  terminalLogLayout,
  type FlowEdge,
  type FlowNode,
  type FlowStatus,
  type TerminalLogData,
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
  /** Reference-measured title ink extent (canvas px) — condenses the mono
   * face via TitleChrome's textLength to match the recording's condensed face. */
  titleTextLength?: number
  /**
   * Terminal/log end-state panel content — the settled composition the
   * recording hard-cuts to (traffic lights, command line, stat row). Rendered
   * as static chrome at every click count; omit to render the bare network.
   */
  terminalLog?: TerminalLogData
}>(), { status: () => [], palette: () => ({}) })

const p = computed(() => resolvePalette(props.palette))
const layout = computed(() => nodeEdgeLayout({ nodes: props.nodes, edges: props.edges, status: props.status }))
const washId = useId()
const bandFilterId = useId()
const glowFilterId = useId()

/**
 * Click choreography (exact-trace sheet art_4A7yguGJ §2): nodes/edges/status
 * reveal one beat each (the final two edges share one), then the scene HARD
 * CUTS at `cutClick` — every network-scene element binds the native Slidev
 * range `[reveal, cutClick)` so it vanishes instantly at the cut (and
 * reappears on backward nav, preserving the v-click contract). `cutClick`
 * itself reveals the late center element; the slide's total clicks equals the
 * cut, so the saturated state is the settled terminal/log composition.
 */
const plan = computed(() => nodeEdgeClickPlan(props.nodes.length, props.edges.length, props.status.length))
const tl = computed(() => (props.terminalLog ? terminalLogLayout(props.terminalLog, layout.value.viewBox) : undefined))
const ambience = computed(() => ambienceLayout(layout.value.viewBox))

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

      <!-- Gaussian feathers for the measured terminal ambience (band and
           glow read uniform in their interiors, falling to the floor across
           ~2 sigma edges). Generous filter regions — a blur spreads ~3sigma
           past the shape and the default -10%..120% region would clip it. -->
      <filter :id="bandFilterId" x="-20%" y="-300%" width="140%" height="700%">
        <feGaussianBlur :stdDeviation="ambience.band.blur" />
      </filter>
      <filter :id="glowFilterId" x="-40%" y="-150%" width="180%" height="400%">
        <feGaussianBlur :stdDeviation="ambience.glow.blur" />
      </filter>
    </defs>

    <!--
      Ambient layer: part of the network MID-state — bound to the same click
      range as the scene so the haze cuts out with it (the settled frame has
      no red haze).
    -->
    <ellipse
      v-click="[1, plan.cutClick]"
      class="sf-ne-wash"
      :cx="layout.viewBox.width * 0.635"
      :cy="layout.viewBox.height * 0.68"
      :rx="layout.viewBox.width * 0.16"
      :ry="layout.viewBox.height * 0.215"
      :fill="`url(#${washId})`"
    />

    <!--
      Edges: one dim-red polyline per edge, revealed as a fast pop and cut out
      at the hard cut. Measured from the src-3 recording at native fps: the
      probe zone is empty until the edge's onset frame and the edge reaches
      full ink 1–2 frames later (~55–80ms) — a pop, not a stroke draw, and no
      dim base edge exists before reveal.
    -->
    <path
      v-for="(edge, j) in layout.edges"
      :key="`edge-${j}`"
      v-click="[plan.edgeClicks[j], plan.cutClick]"
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
         arriving on its planned click and leaving at the hard cut. -->
    <g
      v-for="(node, i) in layout.nodes"
      :key="node.id"
      v-click="[plan.nodeClicks[i], plan.cutClick]"
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
         reveal additively within the scene, which then cuts as a whole. -->
    <g
      v-for="(el, k) in layout.status"
      :key="`status-${k}`"
      v-click="[plan.statusClicks[k], plan.cutClick]"
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

    <!--
      Terminal/log END-STATE panel (the settled composition): traffic-light
      title bar, `$ <command>` line, teal block cursor + stat row. Static
      chrome — visible at every click count (it is both the reference's
      initial and settled state), never click-bound.
    -->
    <g v-if="tl" class="sf-ne-terminal-log">
      <!-- Measured ambience (TERMINAL_LOG_AMBIENCE): dark floor below the
           title band, Gaussian-feathered full-width band behind the terminal
           row, dim glow plateau over the left half. Static chrome, like the
           panel it belongs to. -->
      <rect
        class="sf-ne-ambience-floor"
        :x="ambience.floor.x"
        :y="ambience.floor.y"
        :width="ambience.floor.w"
        :height="ambience.floor.h"
        :fill="ambience.floor.color"
      />
      <rect
        class="sf-ne-ambience-band"
        :x="ambience.band.x"
        :y="ambience.band.y"
        :width="ambience.band.w"
        :height="ambience.band.h"
        :rx="ambience.band.h / 2"
        :fill="ambience.band.color"
        :filter="`url(#${bandFilterId})`"
      />
      <rect
        class="sf-ne-ambience-glow"
        :x="ambience.glow.x"
        :y="ambience.glow.y"
        :width="ambience.glow.w"
        :height="ambience.glow.h"
        :rx="ambience.glow.h / 2"
        :fill="ambience.glow.color"
        :filter="`url(#${glowFilterId})`"
      />
      <circle
        v-for="(light, i) in tl.lights"
        :key="`light-${i}`"
        :cx="light.cx"
        :cy="light.cy"
        :r="light.r"
        :fill="light.color"
      />
      <text
        class="sf-ne-cmd-prompt"
        :x="tl.prompt.x"
        :y="tl.prompt.y"
        dominant-baseline="central"
        :font-size="tl.prompt.fontSize"
        :fill="tl.prompt.color"
      >{{ tl.prompt.text }}</text>
      <text
        class="sf-ne-cmd"
        :x="tl.command.x"
        :y="tl.command.y"
        dominant-baseline="central"
        :font-size="tl.command.fontSize"
        :fill="tl.command.color"
        :textLength="tl.command.textLength"
        lengthAdjust="spacingAndGlyphs"
      >{{ tl.command.text }}</text>
      <rect
        class="sf-ne-cursor"
        :x="tl.cursor.x"
        :y="tl.cursor.y"
        :width="tl.cursor.w"
        :height="tl.cursor.h"
        :fill="tl.cursor.color"
      />
      <text
        class="sf-ne-stat"
        :x="tl.stat.x"
        :y="tl.stat.y"
        dominant-baseline="central"
        :font-size="tl.stat.fontSize"
        :fill="tl.stat.color"
        :textLength="tl.stat.textLength"
        lengthAdjust="spacingAndGlyphs"
      >{{ tl.stat.text }}</text>
    </g>

    <!--
      Late dim center element (exact-trace sheet §2.2: x873–953, y540–642,
      ≈#16202a): a pill outline over a short bar, at the noise floor. It is
      the ONE element the cut reveals — bound to the cut click itself.
    -->
    <g v-if="tl" v-click="plan.cutClick" class="sf-ne-center">
      <rect
        :x="tl.center.x"
        :y="tl.center.y"
        :width="tl.center.w"
        :height="tl.center.h * 0.49"
        :rx="tl.center.w / 2"
        fill="none"
        :stroke="tl.center.color"
        stroke-width="6"
      />
      <rect
        :x="tl.center.x + tl.center.w * 0.24"
        :y="tl.center.y + tl.center.h * 0.71"
        :width="tl.center.w * 0.52"
        :height="tl.center.h * 0.29"
        rx="4"
        :fill="tl.center.color"
      />
    </g>

    <!-- Shared title chrome: sheet-measured centered two-tone title
         (NodeEdge Title row: cap 77 in the band y49–126, centered ≈x914). -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :title-text-length="titleTextLength"
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
 * the hidden state's transition:none makes disappearance instant — the hard
 * cut AND backward nav both snap, the locked decision, zero JS. Scoped
 * selectors (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease }.
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

.sf-ne-wash {
  transition: opacity 80ms ease-out;
}

.sf-ne-wash.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

.sf-ne-center {
  transition: opacity 120ms ease-out;
}

.sf-ne-center.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-ne-edge,
  .sf-ne-node,
  .sf-ne-node-plate,
  .sf-ne-status,
  .sf-ne-wash,
  .sf-ne-center {
    transition: none;
  }
}
</style>
