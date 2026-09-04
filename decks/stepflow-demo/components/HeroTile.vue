<script setup lang="ts">
import { computed } from 'vue'
import { heroTileLayout, type HeroTileOptions } from './stepflow/spine'
import { orangeSpine, resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import { iconPath, ICON_FALLBACK, V7_MARKER_GLYPH } from './stepflow/icons'
import { type TitleToken } from './stepflow/chrome'
import TitleChrome from './stepflow/TitleChrome.vue'

const props = withDefaults(defineProps<{
  /**
   * Lucide icon rendered dark inside the tile; unknown keys render the
   * fallback. Omitted → the traced V7 marker glyph (the v7 tile's cutout,
   * art_mkVNxsft §4.2) at its measured box.
   */
  icon?: string
  /** Optional mono line beneath the tile. */
  label?: string
  /** Palette merged over the measured `orangeSpine` preset (the v7 tile color, verbatim). */
  palette?: StepFlowPaletteOverride
  /** Optional geometry overrides; defaults are the measured fractions. */
  geometry?: HeroTileOptions
  /** Mono header line, e.g. 'SECTION'. */
  title?: string
  /** Header tail rendered in chrome green (titleAccent convention). */
  titleAccent?: string
  /**
   * Sheet-measured header tokens (art_mkVNxsft §4 Title row): one condensate
   * entry per ink run, with per-token position/width. Supersedes the centered
   * two-tone default when present.
   */
  titleTokens?: TitleToken[]
}>(), { palette: () => ({}) })

const p = computed(() => resolvePalette({ ...orangeSpine, ...props.palette }))
const layout = computed(() => heroTileLayout(props.geometry))

// All measured constants are 1920×1080 canvas px (art_mkVNxsft §4); k rescales
// them for a custom viewBox height.
const k = computed(() => layout.value.viewBox.height / 1080)

// Sheet-measured header tokens, rescaled to the active viewBox.
const headerTokens = computed<TitleToken[]>(() =>
  (props.titleTokens ?? []).map((t) => ({
    ...t,
    x: t.x * k.value,
    width: t.width * k.value,
    // Absent per-token caps stay absent — they fall through to the chrome's
    // family defaults downstream (0 would trip titleFontSize's guard).
    capHeight: t.capHeight !== undefined ? t.capHeight * k.value : undefined,
    capTop: t.capTop !== undefined ? t.capTop * k.value : undefined,
  })),
)

// White for label text (title chrome lives in the shared TitleChrome component).
const HEADER_FILL = '#ffffff'

// Gradient id is component-unique (one HeroTile per slide by contract).
const GLOW_ID = 'sf-hero-glow-gradient'

// Halo stops (objectBoundingBox on the halo circle), fitted to the settled
// frame's horizontal profile through the tile center: ≈0.30 accent opacity at
// the tile edge, linear to 0 by r≈161.5px (plateau held to 0.703R — the tile
// covers the interior, so its exact value is invisible).
const glowStops = [
  { offset: 0, opacity: 0.3 },
  { offset: 0.703, opacity: 0.3 },
  { offset: 1, opacity: 0 },
]

// The tile's corner radius, measured ≈55px at 1080 on the 227px tile.
const TILE_RX = 0.2423

// The cutout glyph occupies its measured ≈95×107.5 box (art_mkVNxsft §4.2),
// centered on the tile. The v7 cutout renders pure black — the tile is cut
// through to the deck background.
const iconTransform = computed(() => {
  const l = layout.value
  const sx = l.iconW / V7_MARKER_GLYPH.width
  const sy = l.iconH / V7_MARKER_GLYPH.height
  return `translate(${fmt(l.cx - l.iconW / 2)} ${fmt(l.cy - l.iconH / 2)}) scale(${fmt(sx)} ${fmt(sy)})`
})

// Registry-icon override renders in the 24-unit Lucide space at ≈0.19 × tile
// side (legacy contract).
const ICON_BOX = 24
const lucideTransform = computed(() => {
  const l = layout.value
  const box = 0.19 * l.size
  const s = box / ICON_BOX
  return `translate(${fmt(l.cx - box / 2)} ${fmt(l.cy - box / 2)}) scale(${fmt(s)})`
})

// Label baseline rides one gap below the tile edge.
const labelY = computed(() => layout.value.cy + layout.value.size / 2 + layout.value.viewBox.height * 0.055)

function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}

// Unknown key renders the visible fallback (never undefined into v-html) and
// names the bad key in dev so the author fixes the string.
const resolvedIcon = computed(() => {
  if (!props.icon) return undefined
  const path = iconPath(props.icon)
  if (!path && import.meta.env?.DEV) {
    console.warn(`[HeroTile] unknown icon key "${props.icon}" — rendering the fallback icon`)
  }
  return path ?? ICON_FALLBACK
})
</script>

<template>
  <svg
    class="hero-tile"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`hero tile diagram${label ? `: ${label}` : ''}`"
  >
    <defs>
      <radialGradient :id="GLOW_ID">
        <stop
          v-for="stop in glowStops"
          :key="stop.offset"
          :offset="stop.offset"
          :stop-color="p.accent"
          :stop-opacity="stop.opacity"
        />
      </radialGradient>
    </defs>

    <!-- Single click: tile + cutout + halo arrive together (one ~200ms event in v7). -->
    <g v-click="1" class="sf-hero">
      <!-- Ambient red halo under/around the tile (reveals with the tile). -->
      <circle
        class="sf-hero-glow"
        :cx="fmt(layout.cx)"
        :cy="fmt(layout.cy)"
        :r="fmt(layout.glowR)"
        :fill="`url(#${GLOW_ID})`"
      />
      <rect
        class="sf-hero-tile"
        :x="fmt(layout.cx - layout.size / 2)"
        :y="fmt(layout.cy - layout.size / 2)"
        :width="fmt(layout.size)"
        :height="fmt(layout.size)"
        :rx="fmt(layout.size * TILE_RX)"
        :fill="p.accent"
      />
      <!--
        Traced v7 cutout (ring / bar / splayed legs) in black — the recorded
        glyph is a cutout to the black deck background, not a stroked icon.
      -->
      <g
        v-if="!resolvedIcon"
        class="sf-hero-icon"
        :transform="iconTransform"
        color="#000000"
        v-html="V7_MARKER_GLYPH.markup"
      />
      <g
        v-else
        class="sf-hero-icon"
        :transform="lucideTransform"
        fill="none"
        :stroke="p.iconStroke"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        v-html="resolvedIcon"
      />
      <text
        v-if="label"
        class="sf-hero-label"
        :x="layout.cx"
        :y="labelY"
        text-anchor="middle"
        :font-size="layout.viewBox.height * (28 / 1144)"
        :fill="HEADER_FILL"
        letter-spacing="0.06em"
      >{{ label }}</text>
    </g>

    <!-- Shared title chrome: token mode when the slide carries measured runs
         (green AI last at cap 70.8, band y55.7–126.5), centered two-tone
         fallback otherwise. -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :cap-height="65"
      :cap-top="60.3"
      :center-x="912"
      :tokens="headerTokens"
    />
  </svg>
</template>

<style scoped>
.hero-tile {
  display: block;
  width: 100%;
  height: auto;
}

.hero-tile text {
  /* Open question #1 (font family): mono stack until the face is confirmed. */
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Single-pop reveal (v7: one ~200ms event). Transition lives on the
 * destination state; the hidden state's transition:none makes backward nav
 * instant — the locked decision, zero JS.
 */
.sf-hero {
  transition: opacity 150ms ease-out;
}

.sf-hero.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

.sf-hero-tile {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 150ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-hero.slidev-vclick-hidden .sf-hero-tile {
  transform: scale(0.6);
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-hero,
  .sf-hero-tile {
    transition: none;
  }
}
</style>
