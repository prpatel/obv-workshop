<script setup lang="ts">
import { computed } from 'vue'
import { spineLayout, type SpineNode, type SpineOptions } from './stepflow/spine'
import { chainBlue, orangeSpine, resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'
import { V7_MARKER_GLYPH } from './stepflow/icons'
import { pinAttrs, titleFontSize, type TitleToken } from './stepflow/chrome'
import TitleChrome from './stepflow/TitleChrome.vue'

const props = withDefaults(defineProps<{
  /** Spine elements in reveal order (top → bottom); data order is the click order. */
  nodes: SpineNode[]
  /** Card-family palette, merged over the measured `chainBlue` preset. */
  palette?: StepFlowPaletteOverride
  /** Spine-accent palette (glyph + label rows), merged over `orangeSpine`. */
  accentPalette?: StepFlowPaletteOverride
  /** Optional geometry overrides; defaults are the measured fractions. */
  geometry?: SpineOptions
  /** Mono header line, e.g. 'CENTER AXIS'. */
  title?: string
  /** Header tail rendered in chrome green (titleAccent convention). */
  titleAccent?: string
  /**
   * Sheet-measured header tokens (art_mkVNxsft §3 Title row): one condensate
   * entry per ink run, with per-token position/width/cap band. Supersedes the
   * centered two-tone default when present.
   */
  titleTokens?: TitleToken[]
  /** Gray footer chrome: one short line per card column, revealed second-to-last. */
  footer?: { left: string; right: string }
}>(), { palette: () => ({}), accentPalette: () => ({}) })

// Cards read the cool chainBlue family; the axis glyph + label rows read the
// v7 orange — two presets composed, one accentPalette prop to retune each side.
const p = computed(() => resolvePalette({ ...chainBlue, ...props.palette }))
const spine = computed(() => resolvePalette({ ...orangeSpine, ...props.accentPalette }))

// Side-card slots are data-independent; center slots count glyph + label rows.
const centerCount = computed(() => props.nodes.filter((n) => n.side === 'center').length)
const layout = computed(() => spineLayout(centerCount.value, props.geometry))

// All measured constants are 1920×1080 canvas px (art_mkVNxsft §3); k rescales
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

// Outlined-card plate (wave-1 report §3): near-black, never the accent fill.
const CARD_PLATE = '#0b0a11'
// Axis + footer chrome, sampled off the settled v7 frame (art_mkVNxsft §3):
// orange stub, burnt-orange axis rule, cool-gray bottom rule, mid-gray lines.
const STUB = '#bd521e'
const AXIS_RULE = '#b35526'
const FOOTER_RULE = '#403f48'
const FOOTER_LINE = '#8b8a92'

// Typography measured from the settled v7 spine frame (art_mkVNxsft §3),
// expressed as cap heights and sized through the shared chrome ratio:
// axis label cap 25.5, captions cap 38.7 (left card scales up ×1.2429 via
// captionScale), gray footer lines cap 19.8. The label's tracking is set to
// the measured 'DATA ENGINEERS' run (≈0.11em at the measured size).
const type = computed(() => {
  const scale = k.value
  return {
    labelSize: titleFontSize(25.5) * scale,
    labelTracking: '0.11em',
    captionSize: titleFontSize(38.7) * scale,
    footerSize: titleFontSize(19.8) * scale,
  }
})

// Card glyphs (art_mkVNxsft §3.4): solid tone strokes at full border
// brightness — NOT dimmed. Left card: two full-width bars crossed by two
// drop verticals; right card: two verticals piercing the outline plus two
// inner verticals between the borders. Measured 1080-canvas px, scaled by k.
interface StrokeRect { x: number; y: number; w: number; h: number }
const CARD_GLYPHS: Record<'left' | 'right', { bars: StrokeRect[]; studs: StrokeRect[] }> = {
  left: {
    bars: [
      { x: 403.0, y: 730.7, w: 130.0, h: 5.7 },
      { x: 403.0, y: 765.1, w: 130.0, h: 5.7 },
    ],
    studs: [
      { x: 445.5, y: 730.7, w: 9.4, h: 69.9 },
      { x: 485.0, y: 730.7, w: 9.5, h: 69.9 },
    ],
  },
  right: {
    bars: [],
    studs: [
      { x: 1313.5, y: 709.4, w: 9.0, h: 79.3 },
      { x: 1397.5, y: 709.4, w: 9.0, h: 79.3 },
      { x: 1327.5, y: 728.8, w: 9.0, h: 41.6 },
      { x: 1376.5, y: 728.8, w: 9.0, h: 41.6 },
    ],
  },
}

// Two-tone cards: the left card reads the family accent (cyan #21cfe9 in the
// demo), the right card the accentAlt override (blue #3698fb).
function cardTone(side: 'left' | 'right'): string {
  return side === 'right' ? (p.value.accentAlt ?? p.value.accent) : p.value.accent
}

function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}

/**
 * Reveal choreography: one click per node in data order, with `withPrevious`
 * folding a node into the previous node's click (the v7 recording reveals the
 * axis glyph and its label together, beat 1 @2.83s).
 */
const clickOf = computed(() => {
  const map = new Map<string, number>()
  let next = 0
  let prev = 0
  for (const node of props.nodes) {
    if (node.withPrevious && prev > 0) {
      map.set(node.id, prev)
    } else {
      next += 1
      prev = next
      map.set(node.id, next)
    }
  }
  return map
})
const revealGroups = computed(
  () => new Set(clickOf.value.values()).size,
)

// Center slots are consumed in data order: the first center node is the axis
// glyph, subsequent ones are label rows — the measured top→bottom rhythm
// (glyph + label @2.83s, then the cards).
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

// Axis glyph: the traced V7 marker (ring / bar / splayed legs), fitted to the
// measured 85.7×93.5 box centered on its slot.
function glyphTransform(cx: number, cy: number, w: number, h: number): string {
  const sx = w / V7_MARKER_GLYPH.width
  const sy = h / V7_MARKER_GLYPH.height
  return `translate(${fmt(cx - w / 2)} ${fmt(cy - h / 2)}) scale(${fmt(sx)} ${fmt(sy)})`
}

const sideCards = computed(() => props.nodes.filter((n) => n.side === 'left' || n.side === 'right'))
</script>

<template>
  <svg
    class="vertical-spine"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${revealGroups}-step spine diagram with ${sideCards.length} side cards`"
  >
    <!-- One sibling group per node (never nested v-clicks): data order = click order. -->
    <g
      v-for="node in nodes"
      :key="node.id"
      v-click="clickOf.get(node.id)"
      class="sf-spine-item"
    >
      <!-- Center + empty title = the traced axis glyph (no drawn spine line). -->
      <g
        v-if="node.side === 'center' && !node.title"
        class="sf-spine-marker"
        :transform="glyphTransform(slotById.get(node.id)!.cx, slotById.get(node.id)!.cy, layout.iconW, layout.iconH)"
        :color="spine.accent"
        v-html="V7_MARKER_GLYPH.markup"
      />

      <!-- Center + title = accent label row on the axis (no flanking diamonds). -->
      <text
        v-else-if="node.side === 'center'"
        class="sf-spine-label"
        :x="slotById.get(node.id)!.cx"
        :y="slotById.get(node.id)!.cy"
        text-anchor="middle"
        dominant-baseline="central"
        :font-size="type.labelSize"
        :fill="spine.accent"
        :letter-spacing="type.labelTracking"
      >{{ node.title }}</text>

      <!-- Side card: outlined plate with the measured glyph strokes, caption beneath. -->
      <template v-else>
        <rect
          class="sf-spine-card"
          :x="fmt(layout.cards[node.side].cx - layout.cards[node.side].w / 2)"
          :y="fmt(layout.cards[node.side].cy - layout.cards[node.side].h / 2)"
          :width="fmt(layout.cards[node.side].w)"
          :height="fmt(layout.cards[node.side].h)"
          :rx="fmt(9 * k)"
          :fill="CARD_PLATE"
          :stroke="cardTone(node.side)"
          :stroke-width="fmt(9 * k)"
        />
        <g class="sf-spine-card-glyph" :fill="cardTone(node.side)">
          <rect
            v-for="(bar, bi) in CARD_GLYPHS[node.side].bars"
            :key="`bar-${bi}`"
            :x="fmt(bar.x * k)"
            :y="fmt(bar.y * k)"
            :width="fmt(bar.w * k)"
            :height="fmt(bar.h * k)"
          />
          <rect
            v-for="(stud, si) in CARD_GLYPHS[node.side].studs"
            :key="`stud-${si}`"
            :x="fmt(stud.x * k)"
            :y="fmt(stud.y * k)"
            :width="fmt(stud.w * k)"
            :height="fmt(stud.h * k)"
          />
        </g>
        <text
          v-if="node.caption"
          class="sf-spine-caption"
          :x="fmt(layout.cards[node.side].cx)"
          :y="fmt(layout.cards[node.side].captionY)"
          text-anchor="middle"
          dominant-baseline="central"
          :font-size="fmt(type.captionSize * (node.captionScale ?? 1))"
          :fill="cardTone(node.side)"
          v-bind="pinAttrs(node.caption, type.captionSize * (node.captionScale ?? 1), node.captionWidth !== undefined ? node.captionWidth * k : undefined)"
        >{{ node.caption }}</text>
      </template>
    </g>

    <!--
      Footer chrome (measured beats: gray lines 5.75–6.0s, axis chrome
      6.17–7.17s): the two short gray lines centered under the card columns
      arrive second-to-last; the axis chrome — orange stub, burnt-orange axis
      rule crossing the axis, and the dim #403f48 bottom rule fading last —
      closes the slide.
    -->
    <g v-if="footer" v-click="revealGroups + 1" class="sf-spine-item sf-spine-footer">
      <text
        class="sf-spine-footer-line"
        :x="fmt(layout.cards.left.cx)"
        :y="fmt(layout.footer.lineY)"
        text-anchor="middle"
        :font-size="fmt(type.footerSize)"
        :fill="FOOTER_LINE"
        letter-spacing="0.06em"
      >{{ footer.left }}</text>
      <text
        class="sf-spine-footer-line"
        :x="fmt(layout.cards.right.cx)"
        :y="fmt(layout.footer.lineY)"
        text-anchor="middle"
        :font-size="fmt(type.footerSize)"
        :fill="FOOTER_LINE"
        letter-spacing="0.06em"
      >{{ footer.right }}</text>
    </g>

    <g v-click="revealGroups + 2" class="sf-spine-item sf-spine-axis-chrome">
      <rect
        class="sf-spine-axis-stub"
        :x="fmt(layout.axis.stubCx - layout.axis.stubW / 2)"
        :y="fmt(layout.axis.stubY)"
        :width="fmt(layout.axis.stubW)"
        :height="fmt(layout.axis.stubH)"
        :fill="STUB"
      />
      <rect
        class="sf-spine-axis-rule"
        :x="fmt(layout.axis.ruleX1)"
        :y="fmt(layout.axis.ruleY)"
        :width="fmt(layout.axis.ruleX2 - layout.axis.ruleX1)"
        :height="fmt(layout.axis.ruleH)"
        :fill="AXIS_RULE"
      />
      <rect
        class="sf-spine-footer-rule"
        :x="fmt(layout.footer.ruleCx - layout.footer.ruleW / 2)"
        :y="fmt(layout.footer.ruleCy - layout.footer.ruleH / 2)"
        :width="fmt(layout.footer.ruleW)"
        :height="fmt(layout.footer.ruleH)"
        :fill="FOOTER_RULE"
      />
    </g>

    <!-- Shared title chrome: token mode when the slide carries measured runs
         (green SQL first at cap 84 on its own baseline), centered two-tone
         fallback otherwise. -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :cap-height="68.8"
      :cap-top="56.5"
      :center-x="916"
      accent-first
      :tokens="headerTokens"
    />
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
 * Measured motion (art_mkVNxsft §3: per-element rises settle in ~130–250ms).
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
