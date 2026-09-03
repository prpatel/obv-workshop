<script setup lang="ts">
import { computed } from 'vue'
import { heroTileLayout, type HeroTileOptions } from './stepflow/spine'
import { orangeSpine, resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'

const props = withDefaults(defineProps<{
  /** Lucide icon rendered dark inside the tile; unknown keys render the fallback. */
  icon: string
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
}>(), { palette: () => ({}) })

const p = computed(() => resolvePalette({ ...orangeSpine, ...props.palette }))
const layout = computed(() => heroTileLayout(props.geometry))

// Chrome green of the two-tone recording headers — a convention constant,
// never a palette field (README: title chrome convention).
const CHROME_GREEN = '#66fb00'
const HEADER_FILL = '#ffffff'

// The dark icon occupies ≈ 0.19 of the tile side (measured 46×48 inside 244).
const ICON_BOX = 24
const iconSize = computed(() => 0.19 * layout.value.size)
const iconTransform = computed(() => {
  const s = iconSize.value / ICON_BOX
  return `translate(${fmt(layout.value.cx - iconSize.value / 2)} ${fmt(layout.value.cy - iconSize.value / 2)}) scale(${fmt(s)})`
})

// Label baseline rides one gap below the tile edge.
const labelY = computed(() => layout.value.cy + layout.value.size / 2 + layout.value.viewBox.height * 0.055)

function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}

// Unknown key renders the visible fallback (never undefined into v-html) and
// names the bad key in dev so the author fixes the string.
function resolveIcon(key: string): string {
  const path = iconPath(key)
  if (!path && import.meta.env?.DEV) {
    console.warn(`[HeroTile] unknown icon key "${key}" — rendering the fallback icon`)
  }
  return path ?? ICON_FALLBACK
}
</script>

<template>
  <svg
    class="hero-tile"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`hero tile diagram${label ? `: ${label}` : ''}`"
  >
    <!-- Single click: tile + icon + label arrive together (one ~200ms event in v7). -->
    <g v-click="1" class="sf-hero">
      <rect
        class="sf-hero-tile"
        :x="fmt(layout.cx - layout.size / 2)"
        :y="fmt(layout.cy - layout.size / 2)"
        :width="fmt(layout.size)"
        :height="fmt(layout.size)"
        :rx="fmt(layout.size * 0.1)"
        :fill="p.accent"
      />
      <g
        class="sf-hero-icon"
        :transform="iconTransform"
        fill="none"
        :stroke="p.iconStroke"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        v-html="resolveIcon(props.icon)"
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

    <text
      v-if="title"
      class="sf-hero-header"
      :x="layout.viewBox.width * 0.033"
      :y="layout.viewBox.height * 0.075"
      :font-size="layout.viewBox.height * (34 / 848)"
      :fill="HEADER_FILL"
      letter-spacing="0.06em"
    ><tspan>{{ title }}</tspan><tspan
        v-if="titleAccent"
        :dx="layout.viewBox.height * (34 / 848) * 0.28"
        :fill="CHROME_GREEN"
      >{{ titleAccent }}</tspan></text>
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
