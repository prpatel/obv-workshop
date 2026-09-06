<script setup lang="ts">
import { computed } from 'vue'
import {
  panelsLayout,
  panelPath,
  plateLayout,
  revealPlan,
  STACKPANELS_BADGE,
  STACKPANELS_CAPTION,
  STACKPANELS_FRAME,
  STACKPANELS_HEADER,
  SWEEP_FRAC,
  type PanelRect,
  type StackPanel,
} from './stepflow/panels'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'
import { CAP_HEIGHT_RATIO, CHROME_GREEN, TITLE_WHITE, pinAttrs } from './stepflow/chrome'

const props = withDefaults(defineProps<{
  /** The panel mosaic, in reveal order: TL → TR → BL → BR on the measured seed. */
  panels: StackPanel[]
  /** Partial palette merged over the measured `cyanOnBlack` preset. */
  palette?: StepFlowPaletteOverride
  /** White caption line under the composition; lands on the closing beat. */
  caption?: string
  /** Caption ink color (seg08 settled frame: gray #616161; legacy trace keeps
       the white #f5f5f5 default). */
  captionColor?: string
  /** White lead of the two-tone header (sheet: 'One'). */
  title?: string
  /** Header tail rendered in chrome green (sheet: 'unified environment'). */
  titleAccent?: string
  /** Render the light backing plate (art_mkVNxsft light trace). The dark
       source-truth mosaic sits directly on the black canvas — pass false. */
  plate?: boolean
  /** Seg08 settled-truth mode: the white perimeter frame + chamfer patches,
       the in-panel icon/title groups, and the caption all ride the FINAL
       panel click with the recording's measured late-annotation delays
       (labels ~933ms, frame 933–1200ms, caption 1400ms after click 4) —
       the clip draws them at 2.13–2.9s, a full second after the last panel. */
  annotateOnLastPanel?: boolean
  /** Olive top-right source mark, raster-faithful over black (seg08). Static
       from frame 1 — the reference mark never animates. */
  badge?: boolean
}>(), {
  palette: () => ({}),
  plate: true,
  captionColor: '#f5f5f5',
  annotateOnLastPanel: false,
  badge: false,
})

const p = computed(() => resolvePalette(props.palette))
const layout = computed(() => panelsLayout(props.panels))

// Top-right source mark, resolved to absolute stage units (static raster).
const badgeSpec = computed(() => ({
  x: STACKPANELS_BADGE.box.xFrac * layout.value.viewBox.width,
  y: STACKPANELS_BADGE.box.yFrac * layout.value.viewBox.height,
  w: STACKPANELS_BADGE.box.wFrac * layout.value.viewBox.width,
  h: STACKPANELS_BADGE.box.hFrac * layout.value.viewBox.height,
}))
const plateSpec = computed(() => plateLayout(layout.value.viewBox))
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
// foundation's systemic note), so each segment renders spacing-only textLength
// pins: extent and the white→green split point land exactly. Glyphs never
// squeeze — pins redistribute spacing only (generation-7 typography lock).
const header = computed(() => {
  const { width } = layout.value.viewBox
  return {
    leadFontSize: STACKPANELS_HEADER.leadCapHeight / CAP_HEIGHT_RATIO,
    accentFontSize: STACKPANELS_HEADER.accentCapHeight / CAP_HEIGHT_RATIO,
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
  const { x, y, w, h } = plateSpec.value
  return `M ${q(x)} ${q(y)} V ${q(y + h)} H ${q(x + w)} V ${q(y)}`
})

// One click drives the plate's first beat (the dim margin rides the blue
// fade, ~200ms behind its onset); the brighten lands with the caption.
const plateFirstClick = computed(() => plan.value.panelClicks[0] ?? 1)
const plateFullClick = computed(() => plan.value.labelClick || plan.value.panelClicks.length || 1)

// Seg08 late annotation: the recording draws frame, labels, and caption a
// full second after the last panel (2.13–2.9s vs click 4 at 1.2s), so in
// annotate mode they all bind the FINAL panel click and stagger themselves
// with the measured transition delays.
const annotateClick = computed(() => plan.value.panelClicks[plan.value.panelClicks.length - 1] ?? 1)

/** 45° chamfer leg for the panel's outer corner: the seg08 frame patch
 * (17/1080) in annotate mode, the legacy plate cut otherwise. */
const cutFor = (panel: PanelRect): number => {
  if (!panel.cutCorner) return 0
  if (props.annotateOnLastPanel) return STACKPANELS_FRAME.cutFrac * layout.value.viewBox.height
  return plateSpec.value.cut
}

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
    <!-- Olive source mark, top-right: static from frame 1 (measured on the
         earliest reference frames — it never fades). Shipped as the ink
         raster so the render is pixel-faithful over the black canvas. -->
    <image
      v-if="badge"
      class="sf-badge"
      :x="badgeSpec.x"
      :y="badgeSpec.y"
      :width="badgeSpec.w"
      :height="badgeSpec.h"
      :href="STACKPANELS_BADGE.dataUri"
      aria-hidden="true"
    />
    <!-- White plate, two layers (art_mkVNxsft §1.3): the margin rides the
         first panel's click at ~33% white and brightens to full #f5f5f5 with
         the caption on the closing beat (the f351–360 window). -->
    <g v-if="plate" v-click="plateFirstClick" :data-sf-click="plateFirstClick" class="sf-plate sf-plate--dim">
      <rect :x="plateSpec.x" :y="plateSpec.y" :width="plateSpec.w" :height="plateSpec.h" :fill="plateSpec.fill" />
      <path :d="plateBorder" fill="none" :stroke="plateSpec.border" :stroke-width="plateSpec.borderWidth" />
    </g>
    <g v-if="plate" v-click="plateFullClick" :data-sf-click="plateFullClick" class="sf-plate sf-plate--full">
      <rect :x="plateSpec.x" :y="plateSpec.y" :width="plateSpec.w" :height="plateSpec.h" :fill="plateSpec.fill" />
      <path :d="plateBorder" fill="none" :stroke="plateSpec.border" :stroke-width="plateSpec.borderWidth" />
    </g>

    <!-- Seg08 settled-truth white frame (BEHIND the panels): four ~6px bars
         hugging the mosaic with open corners plus one white square per outer
         chamfer — the panel cuts reveal the patches as triangles. All land on
         the final panel click; per-segment delays replay the recording's
         clockwise perimeter draw (top→right→bottom→left, 2.13–2.53s). -->
    <g v-if="annotateOnLastPanel" v-click="annotateClick" :data-sf-click="annotateClick" class="sf-frame">
      <rect
        v-for="seg in STACKPANELS_FRAME.segments"
        :key="seg.id"
        class="sf-frame-seg"
        :class="`sf-frame-seg--${seg.id}`"
        :x="seg.xFrac * layout.viewBox.width"
        :y="seg.yFrac * layout.viewBox.height"
        :width="seg.wFrac * layout.viewBox.width"
        :height="seg.hFrac * layout.viewBox.height"
        :fill="STACKPANELS_FRAME.color"
      />
      <rect
        v-for="patch in STACKPANELS_FRAME.patches"
        :key="`patch-${patch.id}`"
        class="sf-frame-patch"
        :class="`sf-frame-patch--${patch.id}`"
        :x="patch.xFrac * layout.viewBox.width"
        :y="patch.yFrac * layout.viewBox.height"
        :width="STACKPANELS_FRAME.cutFrac * layout.viewBox.height"
        :height="STACKPANELS_FRAME.cutFrac * layout.viewBox.height"
        :fill="STACKPANELS_FRAME.color"
      />
    </g>

    <!-- One sibling group per panel (never nested auto-numbered v-clicks): a
         ~300ms full-size opacity fade on its click — no scale, no sweep. The
         measured seed replays the recording's onsets: blue → cyan → amber →
         green. -->
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
        :d="panelPath(panel, cutFor(panel), panel.cutCorner)"
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
        v-click="annotateOnLastPanel ? annotateClick : plan.panelClicks[i]"
        :data-sf-click="annotateOnLastPanel ? annotateClick : plan.panelClicks[i]"
        class="sf-icon"
        :class="{ 'sf-late': annotateOnLastPanel }"
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
        v-click="annotateOnLastPanel ? annotateClick : plan.panelClicks[i]"
        :data-sf-click="annotateOnLastPanel ? annotateClick : plan.panelClicks[i]"
        class="sf-title"
        :class="{ 'sf-late': annotateOnLastPanel }"
        :x="titles[panel.id]?.x"
        :y="titles[panel.id]?.y"
        :font-size="titles[panel.id]?.fontSize"
        :textLength="titles[panel.id]?.textLength"
        lengthAdjust="spacing"
        text-anchor="middle"
        :fill="p.iconStroke"
      >{{ titles[panel.id]?.text }}</text>
    </g>

    <!-- Caption: one opacity fade — on the closing beat (legacy trace) or
         the final panel click at the measured late delay (seg08). -->
    <text
      v-if="captionSpec"
      v-click="annotateOnLastPanel ? annotateClick : plan.labelClick"
      :data-sf-click="annotateOnLastPanel ? annotateClick : plan.labelClick"
      class="sf-caption"
      :class="{ 'sf-caption--late': annotateOnLastPanel }"
      :x="captionSpec.x"
      :y="captionSpec.y"
      :font-size="captionSpec.fontSize"
      :textLength="captionSpec.textLength"
      lengthAdjust="spacing"
      text-anchor="middle"
      :fill="captionColor"
    >{{ caption }}</text>

    <!-- Sheet §1.2 header: two ink spans pinned to their measured extents —
         white lead, chrome-green tail, shared baseline. Static, no click. -->
    <g v-if="title || titleAccent" class="sf-chrome-title">
      <text
        v-if="title"
        class="sf-chrome-lead"
        :x="header.lead.x"
        :y="header.baseline"
        :font-size="header.leadFontSize"
        v-bind="pinAttrs(title, header.leadFontSize, header.lead.w)"
        text-anchor="start"
        :fill="TITLE_WHITE"
      >{{ title }}</text>
      <text
        v-if="titleAccent"
        class="sf-chrome-accent"
        :x="header.accent.x"
        :y="header.baseline"
        :font-size="header.accentFontSize"
        v-bind="pinAttrs(titleAccent, header.accentFontSize, header.accent.w)"
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

/*
 * Seg08 late annotation (measured): the recording draws the annotation pass
 * a full second after the last panel lands — labels at 2.133s, frame drawn
 * clockwise top→right→bottom→left 2.133–2.533s, caption at 2.6s — replayed
 * here as transition delays after the final panel click (1.2s). The hidden
 * states keep transition:none so backward nav still snaps instantly.
 */
.sf-icon.sf-late,
.sf-title.sf-late {
  transition-delay: 933ms;
}

.sf-icon.slidev-vclick-hidden,
.sf-title.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

.sf-frame-seg,
.sf-frame-patch {
  transition: opacity 300ms ease-out;
}

.sf-frame.slidev-vclick-hidden .sf-frame-seg,
.sf-frame.slidev-vclick-hidden .sf-frame-patch {
  opacity: 0;
  transition: none;
}

.sf-frame-seg--top,
.sf-frame-patch--tl {
  transition-delay: 933ms;
}

.sf-frame-seg--right,
.sf-frame-patch--tr {
  transition-delay: 1000ms;
}

.sf-frame-seg--bottom,
.sf-frame-patch--br {
  transition-delay: 1067ms;
}

.sf-frame-seg--left,
.sf-frame-patch--bl {
  transition-delay: 1200ms;
}

.sf-caption--late {
  transition-delay: 1400ms;
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
  .sf-caption,
  .sf-frame-seg,
  .sf-frame-patch {
    transition: none;
  }
}
</style>
