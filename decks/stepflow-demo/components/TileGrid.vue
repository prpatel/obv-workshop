<script setup lang="ts">
import { computed, inject, useId, type InjectionKey, type Ref } from 'vue'
import type { ClicksContext } from '@slidev/client/constants'
import {
  hexPath,
  tileGridLayout,
  tileTrackLines,
  TILE_CORE,
  TILE_MINI,
  TILE_PLAIN,
  TILE_SHEEN,
  TILE_STATUS,
  TILE_TRACK,
  type Tile,
} from './stepflow/tiles'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'
import TitleChrome from './stepflow/TitleChrome.vue'

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

// Mirrors `injectionClicksContext` from @slidev/client/constants — the same
// branded string, restated locally (MilestoneLanes.vue pattern): the runtime
// import is a build hazard outside Slidev, and tests inject the plain string.
const injectionClicksContext = '$$slidev-clicks-context' as unknown as InjectionKey<Ref<ClicksContext>>

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
const tracks = computed(() => tileTrackLines(layout.value.tiles))

// Live click state (MilestoneLanes.vue pattern): the connector track is not a
// v-click — the recording holds it until after tile 6 (art_7bTnqSB3 §2.3,
// track fades 8117–9117ms), so it fades in only when every tile is on stage
// and snaps back instantly on backward navigation. Outside Slidev (tests,
// static renders) the context is absent and the track renders settled.
const clicksCtx = inject(injectionClicksContext, undefined)
const clicks = computed(() => clicksCtx?.value.current ?? Number.POSITIVE_INFINITY)
const trackVisible = computed(() => clicks.value >= layout.value.tiles.length)

// Measured hex-tile anatomy (wave-2 fidelity rework — report art_iHm120ov
// §TileGrid, t=33.0s reads at the 1920×1080 reference scale):
// - the hex core spans ~0.825 × 0.93 of the tile box (~98×97px in the demo's
//   119×104 box), pointed left-right;
// - a soft glow halo (the same hex, blurred) reaches a ~155px footprint;
// - a ~12px #353642 connector track runs through tile centers behind the tiles;
// - icons are ~40px near-black strokes (~3px rendered) centered in the hex;
// - two label rows sit below each tile — cyan mini over the white label
//   (both ~16px glyphs).
const HEX_W_FRAC = 0.825
const HEX_H_FRAC = 0.93
const HALO_OPACITY = 0.6
const HALO_BLUR = 18
const SHEEN_LENGTH = 50 // px at the 1080 reference height
const SHEEN_GAP = 16 // px between the sheen dash and the hex's left vertex
const SHEEN_WIDTH = 7
const TRACK_WIDTH = 12
const MINI_OFFSET = 25.5 // cyan row center below the tile box bottom
const LABEL_OFFSET = 55.5 // white row center below the tile box bottom

// All measured constants anchor to the 1920×1080 reference read; k rescales
// them for custom viewBox sizes (NodeEdge.vue pattern).
const k = computed(() => layout.value.viewBox.height / 1080)

// Glow halo: blurred copy of the hex under the solid core (StepFlow.vue's
// useId pattern — two TileGrids on one page must not collide on filter ids).
const glowId = useId()

interface HexTileRender {
  index: number
  tile: (typeof layout.value.tiles)[number]
  d: string
  cx: number
  cy: number
  w: number
  h: number
}

const rendered = computed<HexTileRender[]>(() =>
  layout.value.tiles.map((tile, index) => {
    const w = tile.w * HEX_W_FRAC
    const h = tile.h * HEX_H_FRAC
    const cx = tile.x + tile.w / 2
    const cy = tile.y + tile.h / 2
    return { index, tile, d: hexPath(cx, cy, w, h), cx, cy, w, h }
  }),
)

// Measured matrix tones that have no palette slot ship as chrome-class
// constants (see tiles.ts) — the wave adds no palette fields. The accent tone
// resolves to the measured hex-core fill (the source's settled read of the
// cyan family, darker than the StepFlow-disc #23d7ed).
function tileColor(tone: Tile['tone']): string {
  if (tone === 'alt') return p.value.accentAlt ?? p.value.accent
  if (tone === 'tertiary') return p.value.accentTertiary ?? p.value.accent
  if (tone === 'status') return TILE_STATUS
  if (tone === 'plain') return TILE_PLAIN
  return TILE_CORE
}

// Icons: near-black strokes on every measured tile (t=33.0s rgb ≈ (2,4,0) —
// the wave-1 teal-on-cyan read rendered sub-visible contrast), ~40px, centered
// in the hexagon.
const ICON_BOX = 24
const ICON_SIZE = 40
const ICON_STROKE_UNITS = 2 // 24-unit Lucide convention → ~3.3px rendered

function iconTransform(hex: { cx: number; cy: number }): string {
  const size = ICON_SIZE * k.value
  const s = size / ICON_BOX
  return `translate(${fmt(hex.cx - size / 2)} ${fmt(hex.cy - size / 2)}) scale(${fmt(s)})`
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

// Typography on the StepFlow scale, rescaled so custom viewBox sizes stay
// proportional (NodeEdge.vue pattern). Label rows measure ~16px glyphs at the
// 1920×1080 read; title chrome lives in the shared TitleChrome component.
const type = computed(() => ({
  labelSize: 16 * k.value,
}))

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
    <defs>
      <filter :id="glowId" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur in="SourceGraphic" :stdDeviation="HALO_BLUR * k" />
      </filter>
    </defs>

    <!--
      Connector track behind the tiles (t=33.0s: #353642, ~12px, through tile
      centers — the source renders it under both rows). NOT a v-click: the
      recording fades it in only after tile 6 (art_7bTnqSB3 §2.3), so its
      visibility derives from the live click state; row 2 trails row 1 by the
      measured ~983ms (sf-tg-track-late).
    -->
    <line
      v-for="(line, i) in tracks"
      :key="`track-${i}`"
      class="sf-tg-track"
      :class="{ 'sf-tg-track-hidden': !trackVisible, 'sf-tg-track-late': i > 0 }"
      :x1="line.x1"
      :y1="line.y"
      :x2="line.x2"
      :y2="line.y"
      :stroke="TILE_TRACK"
      :stroke-width="TRACK_WIDTH * k"
    />

    <!--
      One group per tile, arriving on click i + 1 (row-major — the recording's
      build order). Slidev toggles each group's OWN slidev-vclick-hidden class:
      hidden = pre-reveal scale + transition:none (backward nav snaps),
      revealed = 150ms fade / 120ms rise.
    -->
    <g
      v-for="hex in rendered"
      :key="hex.tile.id"
      v-click="hex.index + 1"
      class="sf-tg-tile"
    >
      <!-- Glow halo first (under the core): the same hex path, blurred. -->
      <path
        class="sf-tg-halo"
        :d="hex.d"
        :fill="tileColor(hex.tile.tone)"
        :opacity="HALO_OPACITY"
        :filter="`url(#${glowId})`"
      />
      <path
        class="sf-tg-hex"
        :d="hex.d"
        :fill="tileColor(hex.tile.tone)"
      />
      <!--
        Lit-vertex sheen (t=33.0s): a bright light-cyan dash on the track just
        before the first tile's left vertex — the track's entry into the grid.
      -->
      <line
        v-if="hex.index === 0"
        class="sf-tg-sheen"
        :x1="hex.cx - hex.w / 2 - (SHEEN_GAP + SHEEN_LENGTH) * k"
        :y1="hex.cy"
        :x2="hex.cx - hex.w / 2 - SHEEN_GAP * k"
        :y2="hex.cy"
        :stroke="TILE_SHEEN"
        :stroke-width="SHEEN_WIDTH * k"
        stroke-linecap="round"
      />
      <g
        v-if="hex.tile.icon"
        class="sf-tg-icon"
        :transform="iconTransform(hex)"
        fill="none"
        :stroke="p.iconStroke"
        :stroke-width="ICON_STROKE_UNITS"
        stroke-linecap="round"
        stroke-linejoin="round"
        v-html="resolveIcon(hex.tile.icon)"
      />
      <text
        v-if="hex.tile.mini"
        class="sf-tg-mini"
        :x="hex.cx"
        :y="hex.tile.y + hex.tile.h + MINI_OFFSET * k"
        text-anchor="middle"
        dominant-baseline="central"
        :font-size="type.labelSize"
        :fill="TILE_MINI"
        letter-spacing="0.08em"
      >{{ hex.tile.mini }}</text>
      <text
        v-if="hex.tile.label"
        class="sf-tg-label"
        :x="hex.cx"
        :y="hex.tile.y + hex.tile.h + LABEL_OFFSET * k"
        text-anchor="middle"
        dominant-baseline="central"
        :font-size="type.labelSize"
        :fill="p.subtext"
        letter-spacing="0.08em"
      >{{ hex.tile.label }}</text>
    </g>

    <!-- Shared title chrome: sheet-measured centered two-tone title plus the
         recording badge its sheet documents. Measured on the settled reference
         frame (art_7bTnqSB3 §2.2, verified by pixel read): glyph core 78px
         spanning y99–176 (the sheet's "cap 52" read the glow-inclusive band —
         the same correction PR #37 applied to StairChain/HexCluster), ink
         x625–1298 = 674px centered ≈x961.5, near-zero tracking (condensed to
         the measured extent via textLength). -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :cap-height="78"
      :cap-top="99"
      :center-x="962"
      :title-text-length="674"
      badge
    />
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
  transition: opacity 100ms ease-out;
}

.sf-tg-tile.slidev-vclick-hidden {
  transition: none;
}

.sf-tg-hex {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 100ms cubic-bezier(0, 0, 0.2, 1), opacity 100ms ease-out;
}

.sf-tg-tile.slidev-vclick-hidden .sf-tg-hex {
  transform: scale(0.6);
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-tg-tile,
  .sf-tg-hex,
  .sf-tg-track {
    transition: none;
  }
}

/*
 * Connector track (art_7bTnqSB3 §2.3): dark until every tile is revealed —
 * the recording fades it in ~1.5s after tile 6 (track 8117ms vs tile 6 at
 * 6617ms), then ~100ms fades; row 2 trails row 1 by ~983ms (9100 vs 8117).
 * Measured constants live in tiles.ts (TRACK_*_DELAY_MS); the hidden state's
 * transition:none snaps backward navigation instantly — the locked decision.
 */
.sf-tg-track {
  transition: opacity 100ms ease-out;
  transition-delay: 1500ms;
}

.sf-tg-track-late {
  transition-delay: 2483ms;
}

.sf-tg-track-hidden {
  opacity: 0;
  transition: none;
}
</style>
