<script setup lang="ts">
import { computed } from 'vue'
import { panelsLayout, revealPlan, SWEEP_FRAC, type StackPanel } from './stepflow/panels'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'

const props = withDefaults(defineProps<{
  /** The panel mosaic, in reveal order: the sweep band first, then sub-panels. */
  panels: StackPanel[]
  /** Partial palette merged over the measured `cyanOnBlack` preset. */
  palette?: StepFlowPaletteOverride
  /** White caption line under the composition. */
  caption?: string
  /** Mono header line, rendered centered (white lead). */
  title?: string
  /** Header tail rendered in chrome-green #66fb00 (the two-tone recording chrome). */
  titleAccent?: string
}>(), { palette: () => ({}) })

const p = computed(() => resolvePalette(props.palette))
const layout = computed(() => panelsLayout(props.panels))
const plan = computed(() => revealPlan(props.panels, !!props.caption))

// Tone → token: `alt`/`tertiary` fall back to `accent` when the override omits
// them, so a plain `cyanOnBlack` slide still renders every panel (measured
// hues reach the slide through the palette prop, never hardcoded here).
function fill(tone: StackPanel['tone']): string {
  if (tone === 'alt') return p.value.accentAlt ?? p.value.accent
  if (tone === 'tertiary') return p.value.accentTertiary ?? p.value.accent
  return p.value.accent
}

// Typography measured from the v4 recording: header cap ≈ 6%h (baseline
// 0.117·h), caption glyphs y1099–1127 ≈ 0.036·h. Panel text sizes are [I]
// approximations anchored to the measured text-block heights (band block
// y511–587 ≈ 77px source for title + 2 body rows, amber 831–911, green
// 852–897) — tightly-leaded, centered in their panels.
const type = computed(() => ({
  header: 0.088 * layout.value.viewBox.height,
  panelTitle: 0.038 * layout.value.viewBox.height,
  row: 0.025 * layout.value.viewBox.height,
  caption: 0.036 * layout.value.viewBox.height,
}))

// The recording's panels have rounded corners (visual inspection); the radius
// reads ≈1% of stage height.
const rx = computed(() => 0.011 * layout.value.viewBox.height)

interface Label {
  key: string
  text: string
  x: number
  y: number
  size: number
  fill: string
  anchor: 'start' | 'middle'
  delay: number
}

// Measured label fade (recording 5.53–6.07s ≈ 0.54s over several text
// elements) → one shared click with a ~90ms per-element cascade.
const LABEL_STEP_MS = 90

// All text reveals together on the final click: every panel text block centers
// in its panel (measured: band block center x1004/y549 vs band center
// x970/y544; amber and green centers within 2px), the caption centers under
// the composition (measured center x965 vs x970). Panel text renders dark
// (iconStroke — the recording has no light glyphs inside any panel); only the
// caption is white.
const labels = computed<Label[]>(() => {
  const out: Label[] = []
  for (const panel of layout.value.panels) {
    const cy = panel.y + panel.h / 2
    if (panel.title) {
      out.push({
        key: `${panel.id}-title`,
        text: panel.title,
        x: panel.x + panel.w / 2,
        y: cy + type.value.panelTitle * 0.35,
        size: type.value.panelTitle,
        fill: p.value.iconStroke,
        anchor: 'middle',
        delay: out.length * LABEL_STEP_MS,
      })
    }
    if (panel.rows?.length) {
      const lineH = type.value.row * 1.45
      const first = cy - ((panel.rows.length - 1) * lineH) / 2 + type.value.row * 0.35
      panel.rows.forEach((row, r) => {
        out.push({
          key: `${panel.id}-row-${r}`,
          text: row,
          x: panel.x + panel.w / 2,
          y: first + r * lineH,
          size: type.value.row,
          fill: p.value.iconStroke,
          anchor: 'middle',
          delay: out.length * LABEL_STEP_MS,
        })
      })
    }
  }
  if (props.caption) {
    const xs = layout.value.panels.map((panel) => panel.x)
    const rights = layout.value.panels.map((panel) => panel.x + panel.w)
    const bottoms = layout.value.panels.map((panel) => panel.y + panel.h)
    out.push({
      key: 'caption',
      text: props.caption,
      x: (Math.min(...xs) + Math.max(...rights)) / 2,
      y: Math.max(...bottoms) + 0.075 * layout.value.viewBox.height,
      size: type.value.caption,
      fill: '#ffffff',
      anchor: 'middle',
      delay: out.length * LABEL_STEP_MS,
    })
  }
  return out
})

// Header chrome is white with a chrome-green tail (titleAccent convention —
// the constant is the convention's, never a palette field).
const HEADER_FILL = '#ffffff'
const CHROME_GREEN = '#66fb00'
</script>

<template>
  <svg
    class="stackpanels"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${panels.length}-panel stack diagram`"
  >
    <!-- One sibling group per panel (never nested v-clicks): the band sweeps,
         sub-panels pop — one click each, in data order. -->
    <g
      v-for="(panel, i) in layout.panels"
      :key="panel.id"
      v-click="plan.panelClicks[i]"
      :data-sf-click="plan.panelClicks[i]"
      class="sf-panel"
      :class="panel.bandReveal === 'sweep' ? 'sf-panel--sweep' : 'sf-panel--pop'"
    >
      <rect
        class="sf-band"
        :x="panel.x"
        :y="panel.y"
        :width="panel.w * SWEEP_FRAC"
        :height="panel.h"
        :rx="rx"
        :fill="fill(panel.tone)"
      />
    </g>

    <!-- Labels fade stepped on the final click; the hidden state snaps back. -->
    <text
      v-for="label in labels"
      :key="label.key"
      v-click="plan.labelClick"
      :data-sf-click="plan.labelClick"
      class="sf-label"
      :x="label.x"
      :y="label.y"
      :font-size="label.size"
      :fill="label.fill"
      :text-anchor="label.anchor"
      :style="{ '--sf-label-delay': `${label.delay}ms` }"
    >{{ label.text }}</text>

    <!-- Two-tone header chrome, centered per the recording (measured header
         center x974 of 2038). Static — StepFlow's header carries no click. -->
    <text
      v-if="title || titleAccent"
      class="sf-header"
      :x="layout.viewBox.width / 2"
      :y="0.117 * layout.viewBox.height"
      text-anchor="middle"
      :font-size="type.header"
      :fill="HEADER_FILL"
      letter-spacing="0.06em"
    ><tspan v-if="title" :fill="HEADER_FILL">{{ title }}</tspan><tspan
        v-if="titleAccent"
        :fill="CHROME_GREEN"
        :dx="title ? type.header * 0.35 : 0"
      >{{ titleAccent }}</tspan></text>
  </svg>
</template>

<style scoped>
.stackpanels {
  display: block;
  width: 100%;
  height: auto;
}

.stackpanels text {
  /* Mono stack until the face is confirmed (StepFlow's open question #1). */
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Measured motion (family blueprint F3, re-measured this session: band halves
 * at 3.40/3.67s, amber pop 4.13s, green fade 4.53s, stepped labels 5.53–6.07s).
 * Like StepFlow's .sf-track-fill, the transition lives on the destination
 * state and the hidden state's transition:none makes backward nav instant —
 * the locked decision, zero JS. Scoped selectors (0,2,0 + attribute) beat
 * Slidev's built-in .slidev-vclick-target transition.
 */

/* Sweep: .sf-track-fill applied to a region — scaleX on the revealed state
 * sweeps the fill left→right; transform-box: fill-box pins the origin to the
 * rect's own left edge. */
.sf-panel--sweep .sf-band {
  transform-box: fill-box;
  transform-origin: left center;
  transition:
    transform 300ms cubic-bezier(0, 0, 0.2, 1),
    opacity 120ms ease-out;
}

.sf-panel--sweep.slidev-vclick-hidden .sf-band {
  transform: scaleX(0);
  transition: none;
}

/* Pop: fade + slight scale-up — the disc-pop pattern at region scale. */
.sf-panel--pop .sf-band {
  transform-box: fill-box;
  transform-origin: center;
  transition:
    transform 150ms cubic-bezier(0, 0, 0.2, 1),
    opacity 150ms ease-out;
}

.sf-panel--pop.slidev-vclick-hidden .sf-band {
  opacity: 0;
  transform: scale(0.85);
  transition: none;
}

/* Stepped labels: one click, cascade via a per-element delay on the way in;
   the hidden state drops the delay entirely so backward nav snaps. */
.sf-label {
  transition: opacity 150ms ease-out;
  transition-delay: var(--sf-label-delay, 0ms);
}

.sf-label.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-panel--sweep .sf-band,
  .sf-panel--pop .sf-band,
  .sf-label {
    transition: none;
  }
}
</style>
