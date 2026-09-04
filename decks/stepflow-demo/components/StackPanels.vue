<script setup lang="ts">
import { computed } from 'vue'
import { panelsLayout, revealPlan, SWEEP_FRAC, type StackPanel } from './stepflow/panels'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import TitleChrome from './stepflow/TitleChrome.vue'

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

// Tone → token: `alt`/`tertiary`/`quaternary` fall back to `accent` when the
// override omits them, so a plain `cyanOnBlack` slide still renders every panel
// (measured hues reach the slide through the palette prop, never hardcoded here).
function fill(tone: StackPanel['tone']): string {
  if (tone === 'alt') return p.value.accentAlt ?? p.value.accent
  if (tone === 'tertiary') return p.value.accentTertiary ?? p.value.accent
  if (tone === 'quaternary') return p.value.accentQuaternary ?? p.value.accent
  return p.value.accent
}

// Typography measured from the v4 recording (title chrome lives in the
// shared TitleChrome component): panel titles are the wave-1 fix list's
// ~40px-at-1080 white in-fill labels (0.038·h, as before); the caption glyphs
// y1099–1127 read ~26px at 1080 (0.024·h) — the fix list's caption size.
const type = computed(() => ({
  panelTitle: 0.038 * layout.value.viewBox.height,
  row: 0.025 * layout.value.viewBox.height,
  caption: 0.024 * layout.value.viewBox.height,
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

// All text reveals together on the final click. Titles render white (~40px
// at 1080 per the wave-1 fix list) at each panel's top-left inset (pad 23px,
// baseline 43px — design choices within the fix list's "top-left of fill";
// the recording's settled frame centers dark text blocks instead — accepted
// deviation, recorded in the PR). Rows render dark (iconStroke), left-aligned
// under their panel's title; the caption centers under the composition
// (measured caption center x965 vs mosaic center x970) in white.
const PAD_X = 0.012
const TITLE_BASELINE = 0.04
const labels = computed<Label[]>(() => {
  const out: Label[] = []
  for (const panel of layout.value.panels) {
    const left = panel.x + PAD_X * layout.value.viewBox.width
    if (panel.title) {
      out.push({
        key: `${panel.id}-title`,
        text: panel.title,
        x: left,
        y: panel.y + TITLE_BASELINE * layout.value.viewBox.height,
        size: type.value.panelTitle,
        fill: '#ffffff',
        anchor: 'start',
        delay: out.length * LABEL_STEP_MS,
      })
    }
    if (panel.rows?.length) {
      const lineH = type.value.row * 1.45
      const first = panel.y + TITLE_BASELINE * layout.value.viewBox.height + type.value.panelTitle * 1.75
      panel.rows.forEach((row, r) => {
        out.push({
          key: `${panel.id}-row-${r}`,
          text: row,
          x: left,
          y: first + r * lineH,
          size: type.value.row,
          fill: p.value.iconStroke,
          anchor: 'start',
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

    <!-- Shared title chrome: sheet-measured centered two-tone title
         (StackPanels Title row: cap 69.9 in the band y58.5–128.4, centered
         ≈x916). Static — the header carries no click. -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :cap-height="69.9"
      :cap-top="58.5"
      :center-x="916"
    />
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
 * Measured motion (family blueprint F3, re-measured per the wave-1 fix list:
 * each fill lands in a ~30–50ms burst — blue at 3.47s, cyan ~270ms later,
 * amber 4.13s, green 4.53s, stepped labels 5.53–6.07s — so panels pop at
 * 60ms and the legacy sweep runs 80ms). Like StepFlow's .sf-track-fill, the
 * transition lives on the destination state and the hidden state's
 * transition:none makes backward nav instant — the locked decision, zero JS.
 * Scoped selectors (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target transition.
 */

/* Sweep: .sf-track-fill applied to a region — scaleX on the revealed state
 * sweeps the fill left→right; transform-box: fill-box pins the origin to the
 * rect's own left edge. Kept for stylized use at the measured burst pace
 * (~80ms); the demo slide ships pops — the recording's mechanism. */
.sf-panel--sweep .sf-band {
  transform-box: fill-box;
  transform-origin: left center;
  transition:
    transform 80ms cubic-bezier(0, 0, 0.2, 1),
    opacity 60ms ease-out;
}

.sf-panel--sweep.slidev-vclick-hidden .sf-band {
  transform: scaleX(0);
  transition: none;
}

/* Pop: fade + slight scale-up — the disc-pop pattern at region scale. The
 * recording's fills land in ~30–50ms bursts (60fps walks: blue completes in
 * two ~30ms bursts); 60ms sits inside the fix list's 50–80ms window. */
.sf-panel--pop .sf-band {
  transform-box: fill-box;
  transform-origin: center;
  transition:
    transform 60ms cubic-bezier(0, 0, 0.2, 1),
    opacity 60ms ease-out;
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
