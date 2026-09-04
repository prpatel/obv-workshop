<script setup lang="ts">
import { computed } from 'vue'
import {
  panelsLayout,
  panelPath,
  plateLayout,
  revealPlan,
  STACKPANELS_CAPTION,
  STACKPANELS_HEADER,
  SWEEP_FRAC,
  type PanelRect,
  type StackPanel,
} from './stepflow/panels'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'
import { CAP_HEIGHT_RATIO, CHROME_GREEN, TITLE_WHITE } from './stepflow/chrome'

const props = withDefaults(defineProps<{
  /** The panel mosaic, in reveal order: TL → TR → BL → BR on the measured seed. */
  panels: StackPanel[]
  /** Partial palette merged over the measured `cyanOnBlack` preset. */
  palette?: StepFlowPaletteOverride
  /** White caption line under the composition; lands on the closing beat. */
  caption?: string
  /** White lead of the two-tone header (sheet: 'One'). */
  title?: string
  /** Header tail rendered in chrome green (sheet: 'unified environment'). */
  titleAccent?: string
}>(), { palette: () => ({}) })

const p = computed(() => resolvePalette(props.palette))
const layout = computed(() => panelsLayout(props.panels))
const plate = computed(() => plateLayout(layout.value.viewBox))
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

// Sheet §1.2 header geometry (art_mkVNxsft): two ink spans pinned to their
// measured extents — 'One' 324.9–518.9, 'unified environment' 545.3–1506.8 at
// cap height 69.9, shared baseline ≈y127. The recording header is a
// proportional face while the deck mono runs wider at equal cap (the chrome
// foundation's systemic note), so each segment renders textLength +
// spacingAndGlyphs: extent and the white→green split point land exactly.
const header = computed(() => {
  const { width } = layout.value.viewBox
  return {
    fontSize: STACKPANELS_HEADER.capHeight / CAP_HEIGHT_RATIO,
    baseline: STACKPANELS_HEADER.baseline,
    lead: {
      x: STACKPANELS_HEADER.leadBox.xFrac * width,
      w: STACKPANELS_HEADER.leadBox.wFrac * width,
    },
    accent: {
      x: STACKPANELS_HEADER.accentBox.xFrac * width,
      w: STACKPANELS_HEADER.accentBox.wFrac * width,
    },
  }
})

// Plate border: left/right/bottom only — the sheet sees no top border line.
// Coords round to 1/10000 px so the rendered path stays readable.
const plateBorder = computed(() => {
  const q = (v: number) => Number(v.toFixed(4))
  const { x, y, w, h } = plate.value
  return `M ${q(x)} ${q(y)} V ${q(y + h)} H ${q(x + w)} V ${q(y)}`
})

// One click drives the plate's first beat (the dim margin rides the blue
// fade, ~200ms behind its onset); the brighten lands with the caption.
const plateFirstClick = computed(() => plan.value.panelClicks[0] ?? 1)
const plateFullClick = computed(() => plan.value.labelClick || plan.value.panelClicks.length || 1)

/** Sheet-measured icon → SVG transform mapping the 24-unit Lucide box onto the
 * measured ink bbox (art_mkVNxsft §1.2). */
function iconTransform(panel: PanelRect): string | undefined {
  if (!panel.iconBox) return undefined
  const { width, height } = layout.value.viewBox
  const x = panel.iconBox.xFrac * width
  const y = panel.iconBox.yFrac * height
  const w = panel.iconBox.wFrac * width
  const h = panel.iconBox.hFrac * height
  return `translate(${x} ${y}) scale(${w / 24} ${h / 24})`
}

/** Dark centered panel title pinned to the sheet's measured ink box. */
interface TitleAttrs {
  x: number
  y: number
  fontSize: number
  textLength: number
  text: string
}

const titles = computed<Record<string, TitleAttrs>>(() => {
  const out: Record<string, TitleAttrs> = {}
  const { width, height } = layout.value.viewBox
  for (const panel of layout.value.panels) {
    if (!panel.title || !panel.titleBox) continue
    const box = panel.titleBox
    out[panel.id] = {
      x: (box.xFrac + box.wFrac / 2) * width,
      y: (box.yFrac + box.hFrac) * height,
      fontSize: (box.hFrac * height) / CAP_HEIGHT_RATIO,
      textLength: box.wFrac * width,
      text: panel.title,
    }
  }
  return out
})

// Sheet §1.2 caption: white #f5f5f5, centered under the mosaic (x≈908.8, not
// canvas-centered), landing with the plate brighten on the closing beat.
const captionSpec = computed(() => {
  if (!props.caption) return undefined
  const { width, height } = layout.value.viewBox
  const box = STACKPANELS_CAPTION.box
  return {
    x: (box.xFrac + box.wFrac / 2) * width,
    y: (box.yFrac + box.hFrac) * height,
    fontSize: (box.hFrac * height) / CAP_HEIGHT_RATIO,
    textLength: box.wFrac * width,
  }
})

</script>
<template>
  <svg
    class="stackpanels"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${panels.length}-panel stack diagram`"
  >
    <!-- White plate, two layers (art_mkVNxsft §1.3): the margin rides the
         first panel's click at ~33% white and brightens to full #f5f5f5 with
         the caption on the closing beat (the f351–360 window). -->
    <g v-click="plateFirstClick" :data-sf-click="plateFirstClick" class="sf-plate sf-plate--dim">
      <rect :x="plate.x" :y="plate.y" :width="plate.w" :height="plate.h" :fill="plate.fill" />
      <path :d="plateBorder" fill="none" :stroke="plate.border" :stroke-width="plate.borderWidth" />
    </g>
    <g v-click="plateFullClick" :data-sf-click="plateFullClick" class="sf-plate sf-plate--full">
      <rect :x="plate.x" :y="plate.y" :width="plate.w" :height="plate.h" :fill="plate.fill" />
      <path :d="plateBorder" fill="none" :stroke="plate.border" :stroke-width="plate.borderWidth" />
    </g>

    <!-- One sibling group per panel (never nested v-clicks): a ~300ms
         full-size opacity fade on its click — no scale, no sweep
         (art_mkVNxsft §1.3). The dark icon+title group rides the same click. -->
    <g
      v-for="(panel, i) in layout.panels"
      :key="panel.id"
      v-click="plan.panelClicks[i]"
      :data-sf-click="plan.panelClicks[i]"
      class="sf-panel"
      :class="panel.bandReveal === 'sweep' ? 'sf-panel--sweep' : 'sf-panel--fade'"
    >
      <path
        v-if="panel.bandReveal !== 'sweep'"
        class="sf-band"
        :d="panelPath(panel, panel.cutCorner ? plate.cut : 0, panel.cutCorner)"
        :fill="fill(panel.tone)"
      />
      <rect
        v-else
        class="sf-band"
        :x="panel.x"
        :y="panel.y"
        :width="panel.w * SWEEP_FRAC"
        :height="panel.h"
        :fill="fill(panel.tone)"
      />

      <g
        v-if="panel.icon && iconTransform(panel)"
        class="sf-icon"
        :transform="iconTransform(panel)"
        :style="{ color: p.iconStroke }"
      >
        <g
          v-html="iconPath(panel.icon ?? '') ?? ICON_FALLBACK"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>

      <text
        v-if="titles[panel.id]"
        class="sf-title"
        :x="titles[panel.id]?.x"
        :y="titles[panel.id]?.y"
        :font-size="titles[panel.id]?.fontSize"
        :textLength="titles[panel.id]?.textLength"
        lengthAdjust="spacing"
        text-anchor="middle"
        :fill="p.iconStroke"
      >{{ titles[panel.id]?.text }}</text>
    </g>

    <!-- Caption: one opacity fade on the closing beat, next to the plate
         brighten. -->
    <text
      v-if="captionSpec"
      v-click="plan.labelClick"
      :data-sf-click="plan.labelClick"
      class="sf-caption"
      :x="captionSpec.x"
      :y="captionSpec.y"
      :font-size="captionSpec.fontSize"
      :textLength="captionSpec.textLength"
      lengthAdjust="spacing"
      text-anchor="middle"
      fill="#f5f5f5"
    >{{ caption }}</text>

    <!-- Sheet §1.2 header: two ink spans pinned to their measured extents —
         white lead, chrome-green tail, shared baseline. Static, no click. -->
    <g v-if="title || titleAccent" class="sf-chrome-title">
      <text
        v-if="title"
        class="sf-chrome-lead"
        :x="header.lead.x"
        :y="header.baseline"
        :font-size="header.fontSize"
        :textLength="header.lead.w"
        lengthAdjust="spacingAndGlyphs"
        text-anchor="start"
        :fill="TITLE_WHITE"
      >{{ title }}</text>
      <text
        v-if="titleAccent"
        class="sf-chrome-accent"
        :x="header.accent.x"
        :y="header.baseline"
        :font-size="header.fontSize"
        :textLength="header.accent.w"
        lengthAdjust="spacingAndGlyphs"
        text-anchor="start"
        :fill="CHROME_GREEN"
      >{{ titleAccent }}</text>
    </g>
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
 * Measured motion (art_mkVNxsft §1.3): each fill lands as a ~300ms full-size
 * opacity fade — blue at 3350ms, cyan 3583, amber 4083, green 4483 (re-paced
 * to one click each, TL→TR→BL→BR); the plate margin rides the first click at
 * ~33% white and brightens to full #f5f5f5 with the caption in the f351–360
 * window (the closing beat). The transition lives on the destination state and
 * the hidden state's transition:none makes backward nav instant — the locked
 * decision, zero JS. Scoped selectors (0,2,0 + attribute) beat Slidev's
 * built-in .slidev-vclick-target transition.
 */

/* Panels: opacity-only fade — no scale, no pop (the recording's mechanism;
 * the stylized legacy sweep keeps its own class below). */
.sf-panel--fade .sf-band {
  transition: opacity 300ms ease-out;
}

.sf-panel--fade.slidev-vclick-hidden .sf-band {
  opacity: 0;
  transition: none;
}

/* Icon+title group: same fade, onset ~50ms behind its fill ("appears with its
 * fill within 2–4 frames"). */
.sf-icon,
.sf-title {
  transition: opacity 300ms ease-out;
  transition-delay: 50ms;
}

.sf-panel.slidev-vclick-hidden .sf-icon,
.sf-panel.slidev-vclick-hidden .sf-title {
  opacity: 0;
  transition: none;
}

/* Plate: dim margin (~33% white) enters with the first panel ~200ms behind
 * its onset (f202 fill, f215 margin); the full plate brightens on the closing
 * beat next to the caption. */
.sf-plate--dim {
  opacity: 0.33;
  transition: opacity 300ms ease-out;
  transition-delay: 200ms;
}

.sf-plate--dim.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

.sf-plate--full {
  transition: opacity 300ms ease-out;
}

.sf-plate--full.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

.sf-caption {
  transition: opacity 300ms ease-out;
}

.sf-caption.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

/* Legacy stylized sweep (unused by the demo slide): scaleX on the revealed
 * state sweeps the fill left→right; transform-box: fill-box pins the origin
 * to the band's own left edge. */
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

@media (prefers-reduced-motion: reduce) {
  .sf-panel--sweep .sf-band,
  .sf-panel--fade .sf-band,
  .sf-icon,
  .sf-title,
  .sf-plate--dim,
  .sf-plate--full,
  .sf-caption {
    transition: none;
  }
}
</style>
