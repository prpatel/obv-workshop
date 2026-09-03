<script setup lang="ts">
import { computed } from 'vue'
import { twoBarCompareLayout, type CompareBar } from './stepflow/compare'
import { resolvePalette, statusAmber, type StepFlowPaletteOverride } from './stepflow/palettes'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'

const props = withDefaults(defineProps<{
  /** The comparison bars, in reveal order — one pop click each. */
  bars: CompareBar[]
  /** Optional text for the top-right chip (reveals with the annotation click). */
  chip?: string
  /** Partial palette merged over the family's measured `statusAmber` preset. */
  palette?: StepFlowPaletteOverride
  /** Mono header line, e.g. 'INFRA'. */
  title?: string
  /** Header tail rendered in chrome green after `title` (two-tone chrome convention). */
  titleAccent?: string
}>(), { palette: () => ({}) })

// statusAmber is this family's locked recording base (accent = amber, accentAlt
// = red); a `palette` prop still overrides any field, per the shared contract.
const p = computed(() => resolvePalette({ ...statusAmber, ...props.palette }))
const layout = computed(() => twoBarCompareLayout({ bars: props.bars, chip: props.chip }))

// Icon chips are chrome (the recordings' white outlined chip + light icon),
// not palette fields — same treatment as NodeEdge's plain tone.
const CHROME = '#f5f4f7'
const CHROME_GREEN = '#66fb00'

function toneColor(tone: CompareBar['tone']): string {
  return tone === 'accent' ? p.value.accent : p.value.accentAlt ?? p.value.accent
}

// Icons render in a 24-unit Lucide space; the chip is 34.5×42px, the icon ~22px.
const ICON_BOX = 24
const ICON_SIZE = 22
function iconTransform(cx: number, cy: number): string {
  const s = ICON_SIZE / ICON_BOX
  return `translate(${fmt(cx - ICON_SIZE / 2)} ${fmt(cy - ICON_SIZE / 2)}) scale(${fmt(s)})`
}

// Unknown key renders the visible fallback (never undefined into v-html) and
// names the bad key in dev so the author fixes the string.
function resolveIcon(key: string): string {
  const path = iconPath(key)
  if (!path && import.meta.env?.DEV) {
    console.warn(`[TwoBarCompare] unknown icon key "${key}" — rendering the fallback icon`)
  }
  return path ?? ICON_FALLBACK
}

// Typography on the StepFlow scale: 34px title at source height 848, rescaled
// so custom viewBox sizes stay proportional (StepFlow.vue pattern).
const type = computed(() => {
  const k = layout.value.viewBox.height / 848
  return { titleSize: 34 * k, labelSize: 16, subSize: 13, chipSize: 13 }
})

function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}
</script>

<template>
  <svg
    class="twobarcompare"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${bars.length}-bar comparison diagram`"
  >
    <!--
      One group per bar: the bar pops WHOLE on click i + 1 — no width sweep,
      the recording's bar lands in a single burst — with its icon chip riding
      the same click. Slidev toggles each group's OWN slidev-vclick-hidden
      class: hidden = instant retract + transition:none (backward nav snaps),
      revealed = 150ms pop from the left anchor.
    -->
    <g
      v-for="(bar, i) in layout.bars"
      :key="bar.id"
      v-click="i + 1"
      class="sf-tbc-bar"
    >
      <rect
        class="sf-tbc-bar-rect"
        :x="bar.x"
        :y="bar.y"
        :width="bar.w"
        :height="bar.h"
        rx="6"
        :fill="toneColor(bar.tone)"
      />
      <template v-if="bar.chip">
        <rect
          class="sf-tbc-chip"
          :x="bar.chip.x"
          :y="bar.chip.y"
          :width="bar.chip.w"
          :height="bar.chip.h"
          rx="6"
          fill="none"
          :stroke="CHROME"
          :stroke-width="3"
        />
        <g
          class="sf-tbc-chip-icon"
          :transform="iconTransform(bar.chip.cx, bar.chip.cy)"
          fill="none"
          :stroke="CHROME"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          v-html="resolveIcon(bar.icon!)"
        />
      </template>
    </g>

    <!--
      Annotation layer: the small glyphs on/under each bar plus the optional
      top-right chip, one shared click after the bars (the recording's labels
      arrive late, ColumnRow-style). Hidden entirely until that click.
    -->
    <g v-if="layout.bars.some((b) => b.label || b.sub) || chip" v-click="layout.bars.length + 1" class="sf-tbc-annot">
      <template v-for="bar in layout.bars" :key="`annot-${bar.id}`">
        <text
          v-if="bar.label"
          class="sf-tbc-label"
          :x="bar.labelX"
          :y="bar.labelY"
          dominant-baseline="central"
          :font-size="type.labelSize"
          fill="#ffffff"
          letter-spacing="0.06em"
        >{{ bar.label }}</text>
        <text
          v-if="bar.sub"
          class="sf-tbc-sub"
          :x="bar.subX"
          :y="bar.subY"
          dominant-baseline="hanging"
          :font-size="type.subSize"
          :fill="p.subtext"
          letter-spacing="0.06em"
        >{{ bar.sub }}</text>
      </template>
      <template v-if="chip">
        <rect
          class="sf-tbc-topchip"
          :x="layout.topChip.x"
          :y="layout.topChip.y"
          :width="layout.topChip.w"
          :height="layout.topChip.h"
          rx="6"
          :fill="p.track"
        />
        <text
          class="sf-tbc-topchip-text"
          :x="layout.topChip.x + layout.topChip.w / 2"
          :y="layout.topChip.y + layout.topChip.h / 2"
          text-anchor="middle"
          dominant-baseline="central"
          :font-size="type.chipSize"
          fill="#ffffff"
          letter-spacing="0.08em"
        >{{ chip }}</text>
      </template>
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
.twobarcompare {
  display: block;
  width: 100%;
  height: auto;
}

.twobarcompare text {
  /* Open question #1 (font family): mono stack until the face is confirmed. */
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Measured motion (visual-spec §9 pattern). Transition is taken from the
 * destination state: forward reveal runs the pop, the hidden state's
 * transition:none makes backward nav instant — the locked decision, zero JS.
 * Scoped selectors (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease } — no source-order reliance.
 */
.sf-tbc-bar {
  transition: opacity 150ms ease-out;
}

.sf-tbc-bar.slidev-vclick-hidden {
  transition: none;
}

.sf-tbc-bar-rect {
  transform-box: fill-box;
  transform-origin: left center;
  transition: transform 150ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-tbc-bar.slidev-vclick-hidden .sf-tbc-bar-rect {
  transform: scale(0.85);
  transition: none;
}

.sf-tbc-annot {
  transition: opacity 150ms ease-out;
}

.sf-tbc-annot.slidev-vclick-hidden {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-tbc-bar,
  .sf-tbc-bar-rect,
  .sf-tbc-annot {
    transition: none;
  }
}
</style>
