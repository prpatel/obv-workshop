<script setup lang="ts">
import { computed } from 'vue'
import { tileGridLayout, TILE_PLAIN, TILE_STATUS, type Tile } from './stepflow/tiles'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'

const props = defineProps<{
  /** Tiles in row-major reveal order — one native v-click per tile. */
  tiles: Tile[]
  /** Columns per row; tile i wraps to the next row every `cols` tiles. */
  cols: number
  /** Default tile size, canvas fractions (per-tile `wFrac`/`hFrac` override). */
  tileWFrac: number
  tileHFrac: number
  /** Column/row pitch, canvas fractions. */
  pitchXFrac: number
  pitchYFrac: number
  /** Top-left corner of the first tile, canvas fractions. */
  x0Frac: number
  y0Frac: number
  /** Partial palette merged over the measured `cyanOnBlack` preset. */
  palette?: StepFlowPaletteOverride
  /** Mono header line, e.g. 'DATA'. */
  title?: string
  /** Header tail rendered in chrome green after `title` (two-tone chrome convention). */
  titleAccent?: string
}>()

const p = computed(() => resolvePalette(props.palette))
const layout = computed(() => tileGridLayout({
  tiles: props.tiles,
  cols: props.cols,
  tileWFrac: props.tileWFrac,
  tileHFrac: props.tileHFrac,
  pitchXFrac: props.pitchXFrac,
  pitchYFrac: props.pitchYFrac,
  x0Frac: props.x0Frac,
  y0Frac: props.y0Frac,
}))

// Measured matrix tones that have no palette slot ship as chrome-class
// constants (see tiles.ts) — the wave adds no palette fields.
function tileColor(tone: Tile['tone']): string {
  if (tone === 'alt') return p.value.accentAlt ?? p.value.accent
  if (tone === 'tertiary') return p.value.accentTertiary ?? p.value.accent
  if (tone === 'status') return TILE_STATUS
  if (tone === 'plain') return TILE_PLAIN
  return p.value.accent
}

// Measured inner layout (research §3.5: small teal icon + white text per tile;
// the 1fps read leaves the exact glyph placement [I]-confidence — resolved to
// a centered icon over a centered label, matching the tilegrid crop).
const ICON_BOX = 24
const ICON_SIZE = 36 // 24px glyphs at the 1280-wide source, rescaled to 1920
const ICON_CENTER_FRAC = 0.38 // icon center at 38% of tile height
const LABEL_CENTER_FRAC = 0.76 // label center at 76% of tile height

function iconTransform(tile: { x: number; y: number; w: number; h: number }): string {
  const cx = tile.x + tile.w / 2
  const cy = tile.y + tile.h * ICON_CENTER_FRAC
  const s = ICON_SIZE / ICON_BOX
  return `translate(${fmt(cx - ICON_SIZE / 2)} ${fmt(cy - ICON_SIZE / 2)}) scale(${fmt(s)})`
}

// Teal icons on the cyan/amber/red tiles (measured); dark icons where the
// fill is already light (plain white tile) or is the teal itself.
function iconColor(tone: Tile['tone']): string {
  if (tone === 'plain' || tone === 'tertiary') return p.value.iconStroke
  return p.value.accentTertiary ?? p.value.accent
}

// Labels are white on filled tiles (measured); dark on the plain tile.
function labelColor(tone: Tile['tone']): string {
  return tone === 'plain' ? p.value.iconStroke : '#ffffff'
}

// Unknown key renders the visible fallback (never undefined into v-html) and
// names the bad key in dev so the author fixes the string.
function resolveIcon(key: string): string {
  const path = iconPath(key)
  if (!path && import.meta.env?.DEV) {
    console.warn(`[TileGrid] unknown icon key "${key}" — rendering the fallback icon`)
  }
  return path ?? ICON_FALLBACK
}

// Typography on the StepFlow scale: 34px title at source height 848, rescaled
// so custom viewBox sizes stay proportional (NodeEdge.vue pattern).
const type = computed(() => {
  const k = layout.value.viewBox.height / 848
  return { titleSize: 34 * k, labelSize: 14 }
})

const CHROME_GREEN = '#66fb00'

function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}
</script>

<template>
  <svg
    class="tilegrid"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${tiles.length}-tile grid diagram`"
  >
    <!--
      One group per tile, arriving on click i + 1 (row-major — the recording's
      build order). Slidev toggles each group's OWN slidev-vclick-hidden class:
      hidden = pre-reveal scale + transition:none (backward nav snaps),
      revealed = 150ms fade / 120ms rise.
    -->
    <g
      v-for="(tile, i) in layout.tiles"
      :key="tile.id"
      v-click="i + 1"
      class="sf-tg-tile"
    >
      <rect
        class="sf-tg-rect"
        :x="tile.x"
        :y="tile.y"
        :width="tile.w"
        :height="tile.h"
        rx="10"
        :fill="tileColor(tile.tone)"
      />
      <g
        v-if="tile.icon"
        class="sf-tg-icon"
        :transform="iconTransform(tile)"
        fill="none"
        :stroke="iconColor(tile.tone)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        v-html="resolveIcon(tile.icon)"
      />
      <text
        v-if="tile.label"
        class="sf-tg-label"
        :x="tile.x + tile.w / 2"
        :y="tile.y + tile.h * LABEL_CENTER_FRAC"
        text-anchor="middle"
        dominant-baseline="central"
        :font-size="type.labelSize"
        :fill="labelColor(tile.tone)"
        letter-spacing="0.08em"
      >{{ tile.label }}</text>
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
.tilegrid {
  display: block;
  width: 100%;
  height: auto;
}

.tilegrid text {
  /* Open question #1 (font family): mono stack until the face is confirmed. */
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Measured motion (visual-spec §9 pattern). Transition is taken from the
 * destination state: forward reveal runs the fade/rise, the hidden state's
 * transition:none makes backward nav instant — the locked decision, zero JS.
 * Scoped selectors (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease } — no source-order reliance.
 */
.sf-tg-tile {
  transition: opacity 150ms ease-out;
}

.sf-tg-tile.slidev-vclick-hidden {
  transition: none;
}

.sf-tg-rect {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 120ms cubic-bezier(0, 0, 0.2, 1), opacity 150ms ease-out;
}

.sf-tg-tile.slidev-vclick-hidden .sf-tg-rect {
  transform: scale(0.6);
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-tg-tile,
  .sf-tg-rect {
    transition: none;
  }
}
</style>
