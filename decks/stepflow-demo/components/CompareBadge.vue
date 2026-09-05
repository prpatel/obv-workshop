<script setup lang="ts">
import { computed } from 'vue'
import {
  BRIGHT_INK,
  DIM_INK,
  HALO_FILL,
  ICON_TONES,
  LEADER_STROKE,
  PLATE_FILL,
  compareBadgeLayout,
  type BadgeRowContent,
  type BadgeRowId,
  type BadgeRect,
} from './stepflow/compareBadge'
import { CAP_HEIGHT_RATIO, X_HEIGHT_RATIO, naturalInkExtent, spacingPin } from './stepflow/chrome'
import { orangeSpine, resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import TitleChrome from './stepflow/TitleChrome.vue'
import { ICON_FALLBACK, iconPath } from './stepflow/icons'

const props = withDefaults(
  defineProps<{
    /** White lead line of the title row. */
    title?: string
    /** Tail of the title rendered in chrome green (title chrome convention). */
    titleAccent?: string
    /** Per-row content: bright/dim lines + optional icon key, keyed by row id. */
    rows?: BadgeRowContent[]
    /** Optional icons.ts registry key for the dark glyph inside the core. */
    badgeIcon?: string
    /** Partial palette merged over the measured `orangeSpine` preset. */
    palette?: StepFlowPaletteOverride
  }>(),
  {
    title: '',
    titleAccent: '',
    rows: () => [],
    badgeIcon: undefined,
    palette: () => ({}),
  },
)

// orangeSpine is this family's preset: its accent is the settled core sample
// #f85721, its iconStroke the dark glyph inside the core. resolvePalette
// merges the deck defaults underneath so an override can re-tint any field.
const p = computed(() => resolvePalette({ ...orangeSpine, ...props.palette }))

// Measured seg12 composition resolved on the 1920×1080 stage (module docblock
// carries the settled-frame provenance).
const layout = computed(() => compareBadgeLayout())

// Title chrome: the seg12 title band reads y 0.0965–0.1493 on the settled
// frame → 57px caps on the 1080 stage, matching the deck chrome convention.
const TITLE_CAP_TOP = 0.0965 * 1080
const TITLE_CAP_HEIGHT = 0.0528 * 1080

// Row typography from the measured ink bands: bright rows run a 36px cap band
// native (27px on the stage → font 27/0.730); dim rows a 20px x-height band
// (15px → font 15/0.55) — same mono face, dim color, smaller size.
const brightFont = computed(() => layout.value.rows[0]!.bright.bandHeight / CAP_HEIGHT_RATIO)
const dimFont = computed(() => layout.value.rows[0]!.dim.bandHeight / X_HEIGHT_RATIO)

interface RowView {
  id: BadgeRowId
  click: number
  plate: BadgeRect
  icon: BadgeRect
  iconTone: string
  bright: { x: number; baseline: number }
  brightText: string
  brightPin?: number
  dim: { x: number; baseline: number }
  dimText: string
  dimPin?: number
}

const rowViews = computed<RowView[]>(() =>
  layout.value.rows.map((row) => {
    const content = props.rows.find((r) => r.id === row.id)
    const brightPin = content?.brightInkFrac
      ? spacingPin(naturalInkExtent(content.bright, brightFont.value), content.brightInkFrac * layout.value.viewBox.width)
      : undefined
    const dimPin = content?.dimInkFrac
      ? spacingPin(naturalInkExtent(content.dim, dimFont.value), content.dimInkFrac * layout.value.viewBox.width)
      : undefined
    return {
      id: row.id,
      click: row.click,
      plate: row.plate,
      icon: row.icon,
      iconTone: ICON_TONES[row.id],
      bright: { x: row.bright.x, baseline: row.bright.baseline },
      brightText: content?.bright ?? '',
      brightPin,
      dim: { x: row.dim.x, baseline: row.dim.baseline },
      dimText: content?.dim ?? '',
      dimPin,
    }
  }),
)

/** 24×24 registry glyphs land in a measured box via translate+scale. */
function iconTransform(box: BadgeRect): string {
  return `translate(${box.x} ${box.y}) scale(${box.w / 24} ${box.h / 24})`
}
</script>

<template>
  <svg
    class="comparebadge"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    aria-label="Two near-black panels compared against a central orange badge"
  >
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :cap-top="TITLE_CAP_TOP"
      :cap-height="TITLE_CAP_HEIGHT"
    />

    <!-- Center badge — click 1. The orange core pops on the rim beat; the
         dark red-brown halo and leader lines trail ~70ms later (measured
         onsets 0.600 → 0.667). -->
    <g v-click="1" class="sf-badge">
      <circle
        class="sf-badge-halo"
        :cx="layout.halo.cx"
        :cy="layout.halo.cy"
        :r="layout.halo.r"
        :fill="HALO_FILL"
      />
      <line
        v-for="(l, i) in layout.leaders"
        :key="`leader-${i}`"
        class="sf-badge-leader"
        :x1="l.x1"
        :y1="l.y1"
        :x2="l.x2"
        :y2="l.y2"
        :stroke="LEADER_STROKE"
        stroke-width="3"
      />
      <rect
        class="sf-badge-core"
        :x="layout.core.x"
        :y="layout.core.y"
        :width="layout.core.w"
        :height="layout.core.h"
        :rx="layout.core.corner"
        :fill="p.accent"
      />
      <g
        v-if="badgeIcon"
        class="sf-badge-glyph"
        :transform="iconTransform(layout.glyph)"
        v-html="iconPath(badgeIcon) ?? ICON_FALLBACK"
        fill="none"
        :stroke="p.iconStroke"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>

    <!-- Four plate rows — clicks 2–5, alternating left/right on the measured
         waves (1.00 left-top, 1.73 right-top, 3.00 left-bottom, 4.40
         right-bottom). Each wave fades plate, icon, and both lines together. -->
    <g v-for="row in rowViews" :key="row.id" v-click="row.click" class="sf-badge-row">
      <rect
        class="sf-badge-plate"
        :x="row.plate.x"
        :y="row.plate.y"
        :width="row.plate.w"
        :height="row.plate.h"
        :fill="PLATE_FILL"
      />
      <g
        v-if="row.icon"
        class="sf-badge-icon"
        :transform="iconTransform(row.icon)"
        v-html="iconPath(row.icon) ?? ICON_FALLBACK"
        fill="none"
        :stroke="row.iconTone"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <text
        class="sf-badge-bright"
        :x="row.bright.x"
        :y="row.bright.baseline"
        :font-size="brightFont"
        :fill="BRIGHT_INK"
        :textLength="row.brightPin"
        :lengthAdjust="row.brightPin ? 'spacing' : undefined"
      >{{ row.brightText }}</text>
      <text
        class="sf-badge-dim"
        :x="row.dim.x"
        :y="row.dim.baseline"
        :font-size="dimFont"
        :fill="DIM_INK"
        :textLength="row.dimPin"
        :lengthAdjust="row.dimPin ? 'spacing' : undefined"
      >{{ row.dimText }}</text>
    </g>
  </svg>
</template>

<style scoped>
/* Destination-state transitions: visible state carries the animation;
   hidden state is the same composition at opacity 0 with transitions off,
   so back-navigation snaps and re-entering replays the beat. */

.comparebadge text {
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/* Core pops first: fade + slight scale (measured 0.600 → 0.80). */
.sf-badge-core {
  opacity: 1;
  transform: scale(1);
  transform-box: fill-box;
  transform-origin: center;
  transition: opacity 250ms ease-out, transform 250ms ease-out;
}

/* Rim (halo + leaders) trails the core onset by ~70ms (0.600 → 0.667). */
.sf-badge-halo,
.sf-badge-leader {
  opacity: 1;
  transition: opacity 300ms ease-out 70ms;
}

.sf-badge.slidev-vclick-hidden .sf-badge-core {
  opacity: 0;
  transform: scale(0.85);
  transition: none;
}

.sf-badge.slidev-vclick-hidden .sf-badge-halo,
.sf-badge.slidev-vclick-hidden .sf-badge-leader {
  opacity: 0;
  transition: none;
}

/* Row waves: plate + icon + both lines fade together (~320ms, measured). */
.sf-badge-row {
  opacity: 1;
  transition: opacity 320ms ease-out;
}

.sf-badge-row.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-badge-core,
  .sf-badge-halo,
  .sf-badge-leader,
  .sf-badge-row {
    transition: none;
    animation: none;
  }
}
</style>
