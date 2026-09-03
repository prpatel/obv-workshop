<script setup lang="ts">
import { computed } from 'vue'
import { spineLayout, type SpineNode, type SpineOptions } from './stepflow/spine'
import { chainBlue, orangeSpine, resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'

const props = withDefaults(defineProps<{
  /** Spine elements in reveal order (top → bottom); data order is the click order. */
  nodes: SpineNode[]
  /** Card-family palette, merged over the measured `chainBlue` preset. */
  palette?: StepFlowPaletteOverride
  /** Spine-accent palette (marker + label rows), merged over `orangeSpine`. */
  accentPalette?: StepFlowPaletteOverride
  /** Optional geometry overrides; defaults are the measured fractions. */
  geometry?: SpineOptions
  /** Mono header line, e.g. 'CENTER AXIS'. */
  title?: string
  /** Header tail rendered in chrome green (titleAccent convention). */
  titleAccent?: string
}>(), { palette: () => ({}), accentPalette: () => ({}) })

// Cards read the cool chainBlue family; the marker + label rows read the v7
// orange — two presets composed, one accentPalette prop to retune each side.
const p = computed(() => resolvePalette({ ...chainBlue, ...props.palette }))
const spine = computed(() => resolvePalette({ ...orangeSpine, ...props.accentPalette }))

// Side-card slots are data-independent; center slots count marker + label rows.
const centerCount = computed(() => props.nodes.filter((n) => n.side === 'center').length)
const layout = computed(() => spineLayout(centerCount.value, props.geometry))

// Chrome green of the two-tone recording headers — a convention constant,
// never a palette field (README: title chrome convention).
const CHROME_GREEN = '#66fb00'
const HEADER_FILL = '#ffffff'

// Typography measured at source height 1144px (research §F6: label row ≈ 27px,
// card title ≈ 40px, caption ≈ 24px), rescaled with the layout height; the
// header matches StepFlow's house chrome scale (34px at 848).
const type = computed(() => {
  const h = layout.value.viewBox.height
  const chrome = h / 848
  const src = h / 1144
  return {
    headerSize: 34 * chrome,
    labelSize: 27 * src,
    cardTitleSize: 40 * src,
    captionSize: 24 * src,
    flankSize: 15 * src,
  }
})

// Card icons render in a 24-unit Lucide space at ≈ 0.3 × card height.
const ICON_BOX = 24
function iconTransform(cx: number, cy: number, size: number): string {
  const box = 0.3 * size
  const s = box / ICON_BOX
  return `translate(${fmt(cx - box / 2)} ${fmt(cy - box / 2)}) scale(${fmt(s)})`
}

function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}

// Unknown key renders the visible fallback (never undefined into v-html) and
// names the bad key in dev so the author fixes the string.
function resolveIcon(key: string): string {
  const path = iconPath(key)
  if (!path && import.meta.env?.DEV) {
    console.warn(`[VerticalSpine] unknown icon key "${key}" — rendering the fallback icon`)
  }
  return path ?? ICON_FALLBACK
}

/**
 * Marker rhombus corners (solid diamond, measured 90×98 at source).
 */
function markerPoints(cx: number, cy: number): string {
  const { markerW: w, markerH: h } = layout.value
  return `${fmt(cx)},${fmt(cy - h / 2)} ${fmt(cx + w / 2)},${fmt(cy)} ${fmt(cx)},${fmt(cy + h / 2)} ${fmt(cx - w / 2)},${fmt(cy)}`
}

/**
 * Flanking diamonds sit just outside the label text's measured run. Mono
 * advance ≈ 0.62em per glyph — an approximation (no DOM text measuring), good
 * enough for decorative glyphs and deterministic for tests.
 */
function flankOffset(title: string): number {
  const textHalfWidth = (title.length * 0.62 * type.value.labelSize) / 2
  return textHalfWidth + 0.8 * type.value.labelSize + type.value.flankSize
}

function flankPoints(cx: number, cy: number): string {
  const s = type.value.flankSize
  return `${fmt(cx)},${fmt(cy - s / 2)} ${fmt(cx + s / 2)},${fmt(cy)} ${fmt(cx)},${fmt(cy + s / 2)} ${fmt(cx - s / 2)},${fmt(cy)}`
}

// Center slots are consumed in data order: the first center node is the
// marker, subsequent ones are label rows — matching the measured top→bottom
// rhythm (marker @3.0s → label row → cards).
interface CenterRow {
  node: SpineNode
  slot: { cx: number; cy: number }
}
const centerRows = computed<CenterRow[]>(() => {
  let i = 0
  return props.nodes
    .filter((n) => n.side === 'center')
    .map((node) => ({ node, slot: layout.value.elements[i++] }))
})

const slotById = computed(() => new Map(centerRows.value.map((r) => [r.node.id, r.slot])))

const sideCards = computed(() => props.nodes.filter((n) => n.side === 'left' || n.side === 'right'))
</script>

<template>
  <svg
    class="vertical-spine"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${centerCount}-element spine diagram with ${sideCards.length} side cards`"
  >
    <!-- One sibling group per node (never nested v-clicks): data order = click order. -->
    <g
      v-for="(node, i) in nodes"
      :key="node.id"
      v-click="i + 1"
      class="sf-spine-item"
    >
      <!-- Center + empty title = the solid diamond marker. -->
      <polygon
        v-if="node.side === 'center' && node.title === ''"
        class="sf-spine-marker"
        :points="markerPoints(slotById.get(node.id)!.cx, slotById.get(node.id)!.cy)"
        :fill="spine.accent"
      />

      <!-- Center + title = orange label row with flanking diamonds. -->
      <template v-else-if="node.side === 'center'">
        <polygon
          v-for="side in [-1, 1]"
          :key="side"
          class="sf-spine-flank"
          :points="flankPoints(slotById.get(node.id)!.cx + side * flankOffset(node.title), slotById.get(node.id)!.cy)"
          :fill="p.accentAlt ?? spine.accent"
        />
        <text
          class="sf-spine-label"
          :x="slotById.get(node.id)!.cx"
          :y="slotById.get(node.id)!.cy"
          text-anchor="middle"
          dominant-baseline="central"
          :font-size="type.labelSize"
          :fill="spine.accent"
          letter-spacing="0.06em"
        >{{ node.title }}</text>
      </template>

      <!-- Side card: rounded block with the title inside, caption beneath. -->
      <template v-else>
        <rect
          class="sf-spine-card"
          :x="fmt(layout.cards[node.side].cx - layout.cards[node.side].w / 2)"
          :y="fmt(layout.cards[node.side].cy - layout.cards[node.side].h / 2)"
          :width="fmt(layout.cards[node.side].w)"
          :height="fmt(layout.cards[node.side].h)"
          :rx="fmt(layout.viewBox.height * 0.012)"
          :fill="p.accent"
        />
        <g
          v-if="node.icon"
          class="sf-spine-card-icon"
          :transform="iconTransform(layout.cards[node.side].cx, layout.cards[node.side].cy - layout.cards[node.side].h * 0.18, layout.cards[node.side].h)"
          fill="none"
          :stroke="p.iconStroke"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          v-html="resolveIcon(node.icon)"
        />
        <text
          class="sf-spine-card-title"
          :x="layout.cards[node.side].cx"
          :y="node.icon ? layout.cards[node.side].cy + layout.cards[node.side].h * 0.2 : layout.cards[node.side].cy"
          text-anchor="middle"
          dominant-baseline="central"
          :font-size="type.cardTitleSize"
          fill="#ffffff"
          letter-spacing="0.04em"
        >{{ node.title }}</text>
        <text
          v-if="node.caption"
          class="sf-spine-caption"
          :x="layout.cards[node.side].cx"
          :y="fmt(layout.cards[node.side].captionY)"
          text-anchor="middle"
          :font-size="type.captionSize"
          :fill="p.accent"
        >{{ node.caption }}</text>
      </template>
    </g>

    <text
      v-if="title"
      class="sf-spine-header"
      :x="layout.viewBox.width * 0.033"
      :y="layout.viewBox.height * 0.075"
      :font-size="type.headerSize"
      :fill="HEADER_FILL"
      letter-spacing="0.06em"
    ><tspan>{{ title }}</tspan><tspan
        v-if="titleAccent"
        :dx="type.headerSize * 0.28"
        :fill="CHROME_GREEN"
      >{{ titleAccent }}</tspan></text>
  </svg>
</template>

<style scoped>
.vertical-spine {
  display: block;
  width: 100%;
  height: auto;
}

.vertical-spine text {
  /* Open question #1 (font family): mono stack until the face is confirmed. */
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Measured motion (research §F6: per-element rises settle in ~130–250ms).
 * Transition lives on the destination state: forward reveal runs the rise,
 * the hidden state's transition:none makes backward nav instant — the locked
 * decision, zero JS. Scoped selectors (0,2,0 + attribute) beat Slidev's
 * built-in .slidev-vclick-target { transition: all .1s ease }.
 */
.sf-spine-item {
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}

.sf-spine-item.slidev-vclick-hidden {
  opacity: 0;
  transform: translateY(12px);
  transition: none;
}

.sf-spine-marker {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 120ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-spine-item.slidev-vclick-hidden .sf-spine-marker {
  transform: scale(0.6);
  transition: none;
}

.sf-spine-card {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 120ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-spine-item.slidev-vclick-hidden .sf-spine-card {
  transform: scale(0.85);
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-spine-item,
  .sf-spine-marker,
  .sf-spine-card {
    transition: none;
  }

  .sf-spine-item.slidev-vclick-hidden {
    transform: none;
  }
}
</style>
