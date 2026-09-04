<script setup lang="ts">
import { computed } from 'vue'
import {
  DATA_TEXT_COLOR,
  RULE_COLOR,
  SUBHEAD_SIZE,
  twoBarCompareLayout,
  type CompareBar,
  type DataTextBlock,
} from './stepflow/compare'
import { resolvePalette, statusAmber, type StepFlowPaletteOverride } from './stepflow/palettes'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'

const props = withDefaults(defineProps<{
  /** The comparison bars, in reveal order — one pop click each. */
  bars: CompareBar[]
  /** Optional text for the top-right chip (reveals with the annotation click). */
  chip?: string
  /** The big light-cyan data-text block above the bars (reveals with the annotation click). */
  dataText?: DataTextBlock
  /** Partial palette merged over the family's measured `statusAmber` preset. */
  palette?: StepFlowPaletteOverride
  /** Mono header line, e.g. 'INFRA'. */
  title?: string
  /** Header tail rendered in chrome green after `title` (two-tone chrome convention). */
  titleAccent?: string
  /** Centered white headline row under the header band (measured composition). */
  subhead?: string
  /** Chrome-green tail rendered after `subhead` (two-tone chrome convention). */
  subheadAccent?: string
}>(), { palette: () => ({}) })

// statusAmber is this family's locked recording base (accent = amber, accentAlt
// = red); the rework adds the recording's teal top-chip tone as accentTertiary
// (measured #1cd797 on the ref frame — report art_iHm120ov §TwoBarCompare).
// A `palette` prop still overrides any field, per the shared contract.
const p = computed(() => resolvePalette({
  ...statusAmber,
  accentTertiary: '#1cd797',
  ...props.palette,
}))
const layout = computed(() => twoBarCompareLayout({
  bars: props.bars,
  chip: props.chip,
  dataText: props.dataText,
  subhead: props.subhead,
  subheadAccent: props.subheadAccent,
}))

// Icon chips carry the family amber with dark icon strokes, the top chip the
// recording's teal plate — measured ref tones, not chrome constants anymore.
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
// so custom viewBox sizes stay proportional (StepFlow.vue pattern). Label
// sizes are the rework's measured classes (ref t=168.7s: ~23px dark on-bar
// glyphs ≈ 32px font; ~28px under-bar class) — ~2× the pre-rework rows.
const type = computed(() => {
  const k = layout.value.viewBox.height / 848
  return { titleSize: 34 * k, labelSize: 32, subSize: 28, chipSize: 26 }
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
          :fill="p.accent"
        />
        <g
          class="sf-tbc-chip-icon"
          :transform="iconTransform(bar.chip.cx, bar.chip.cy)"
          fill="none"
          :stroke="p.iconStroke"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          v-html="resolveIcon(bar.icon!)"
        />
      </template>
    </g>

    <!--
      Annotation layer: the data-text block, the glyphs on/under each bar and
      the top-right chip — one shared click after the bars (the recording's
      labels arrive late, ColumnRow-style). Hidden entirely until that click.
    -->
    <g
      v-if="layout.bars.some((b) => b.label || b.sub) || chip || layout.dataText.length || layout.caption || layout.note || layout.rules.length"
      v-click="layout.bars.length + 1"
      class="sf-tbc-annot"
    >
      <text
        v-for="(line, i) in layout.dataText"
        :key="`data-${i}`"
        class="sf-tbc-dataline"
        :x="line.x"
        :y="line.y"
        :font-size="line.size"
        :fill="DATA_TEXT_COLOR"
        font-weight="700"
        letter-spacing="0.04em"
      >{{ line.text }}</text>
      <!-- Divider rules + the between-the-bars caption/note rows: the second
           evidence pass's measured layers (ref t=168.7s y722/752/789/970). -->
      <rect
        v-for="(rule, i) in layout.rules"
        :key="`rule-${i}`"
        class="sf-tbc-rule"
        :x="rule.x"
        :y="rule.y"
        :width="rule.w"
        :height="rule.h"
        :fill="RULE_COLOR"
      />
      <text
        v-if="layout.caption"
        class="sf-tbc-caption"
        :x="layout.caption.x"
        :y="layout.caption.y"
        :font-size="layout.caption.size"
        :fill="p.subtext"
        letter-spacing="0.06em"
      >{{ layout.caption.text }}</text>
      <text
        v-if="layout.note"
        class="sf-tbc-note"
        :x="layout.note.x"
        :y="layout.note.y"
        :font-size="layout.note.size"
        fill="#ffffff"
        font-weight="700"
        letter-spacing="0.06em"
      >{{ layout.note.text }}</text>
      <template v-for="bar in layout.bars" :key="`annot-${bar.id}`">
        <text
          v-if="bar.label"
          class="sf-tbc-label"
          :x="bar.labelX"
          :y="bar.labelY"
          dominant-baseline="central"
          :font-size="type.labelSize"
          :fill="p.iconStroke"
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
          :fill="p.accentTertiary ?? p.accent"
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

    <!--
      Centered two-tone headline row — header chrome like the title, always
      visible (measured ref composition: white lead + chrome-green tail,
      baseline y161 at 1080p).
    -->
    <text
      v-if="layout.subhead"
      class="sf-tbc-subhead"
      :x="layout.subhead.x"
      :y="layout.subhead.y"
      text-anchor="middle"
      :font-size="SUBHEAD_SIZE"
      fill="#ffffff"
      font-weight="700"
      letter-spacing="0.04em"
    >{{ layout.subhead.text }}<tspan v-if="layout.subhead.accent" :fill="CHROME_GREEN">&nbsp;{{ layout.subhead.accent }}</tspan></text>

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
