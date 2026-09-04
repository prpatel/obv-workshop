<script setup lang="ts">
import { computed } from 'vue'
import {
  DATA_TEXT_COLOR,
  LABEL_COLOR,
  LEGEND_COLOR,
  MARK_BOX,
  MARK_COLOR,
  MINT_COLOR,
  RULE_COLOR,
  SIDE_RAILS,
  TOP_BAND,
  twoBarCompareLayout,
  type CompareBar,
  type DataTextBlock,
} from './stepflow/compare'
import { pinAttrs } from './stepflow/chrome'
import { resolvePalette, statusAmber, type StepFlowPaletteOverride } from './stepflow/palettes'
import { iconPath, ICON_FALLBACK } from './stepflow/icons'
import TitleChrome from './stepflow/TitleChrome.vue'

const props = withDefaults(defineProps<{
  /** The comparison bars, in reveal order — one pop click each. */
  bars: CompareBar[]
  /** Optional text for the top-right chip (reveals with the annotation click). */
  chip?: string
  /** The annotation text block around the bars (reveals with the annotation click). */
  dataText?: DataTextBlock
  /** Partial palette merged over the family's measured `statusAmber` preset. */
  palette?: StepFlowPaletteOverride
  /** White lead of the centered two-tone headline (TitleChrome band). */
  title?: string
  /** Chrome-green tail rendered after `title` (two-tone chrome convention). */
  titleAccent?: string
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
}))

// Headline condensation: the ref headline's measured ink extent is x565–1359
// (793px); TitleChrome.titleTextLength pins the advance there — the sheet's
// "condensed subhead face" without a separate type face (PR #42 mechanism).
const HEADLINE_TEXT_LENGTH = 796

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
  return { labelSize: 32, subSize: 28, chipSize: 26 }
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
      Annotation layer: the ambient frame (dim band + side rails), the legend
      row, the data-text block, the glyphs on/under each bar and the top-right
      chip — one shared click after the bars (the recording's labels arrive
      late). Hidden entirely until that click; the static layers fade in
      together, the on-bar labels fade later on the recording's windows.
    -->
    <g
      v-if="layout.bars.some((b) => b.label || b.sub) || chip || layout.dataText.length || layout.legend || layout.caption || layout.note || layout.rules.length"
      v-click="layout.bars.length + 1"
      class="sf-tbc-annot"
    >
      <g class="sf-tbc-annot-core">
        <!-- Ambient frame: measured dim band above the legend + side rails. -->
        <rect
          class="sf-tbc-topband"
          :x="TOP_BAND.x"
          :y="TOP_BAND.y"
          :width="TOP_BAND.w"
          :height="TOP_BAND.h"
          :fill="TOP_BAND.fill"
        />
        <rect
          v-for="(rail, i) in SIDE_RAILS"
          :key="`rail-${i}`"
          class="sf-tbc-rail"
          :x="rail.x"
          :y="rail.y"
          :width="rail.w"
          :height="rail.h"
          :fill="rail.fill"
        />
        <!-- Legend: three tone chips on the measured pitch + gray caps text. -->
        <template v-if="layout.legend">
          <rect
            v-for="(chipRect, i) in layout.legend.chips"
            :key="`legend-chip-${i}`"
            class="sf-tbc-legend-chip"
            :x="chipRect.x"
            :y="chipRect.y"
            :width="chipRect.w"
            :height="chipRect.h"
            :fill="chipRect.fill"
          />
          <text
            class="sf-tbc-legend-text"
            :x="layout.legend.text.x"
            :y="layout.legend.text.y"
            :font-size="layout.legend.text.size"
            :fill="LEGEND_COLOR"
            letter-spacing="0.1em"
          >{{ layout.legend.text.text }}</text>
        </template>
        <text
          v-for="(line, i) in layout.dataText"
          :key="`data-${i}`"
          class="sf-tbc-dataline"
          :x="line.x"
          :y="line.y"
          :font-size="line.size"
          :fill="DATA_TEXT_COLOR"
          font-weight="700"
        >{{ line.text }}</text>
        <!-- Divider rules + the between-the-bars caption/mint rows: the
             second/third evidence passes' measured layers (ref t=168.7s
             y722/752/789/970). -->
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
          letter-spacing="0.15em"
        >{{ layout.caption.text }}</text>
        <!-- Mint note row: the traced teal mark (glyph unresolved at 1080p —
             traced from the ref bitmap: stem + crossed arms + hourglass X)
             introduces the mint sentence. -->
        <template v-if="layout.note">
          <path
            class="sf-tbc-mark"
            :d="`M ${MARK_BOX.x + 20} ${MARK_BOX.y} L ${MARK_BOX.x + 20} ${MARK_BOX.y + MARK_BOX.h}
                 M ${MARK_BOX.x + 5} ${MARK_BOX.y + 10} L ${MARK_BOX.x + 34} ${MARK_BOX.y + 38}
                 M ${MARK_BOX.x + 34} ${MARK_BOX.y + 10} L ${MARK_BOX.x + 5} ${MARK_BOX.y + 38}
                 M ${MARK_BOX.x + 36} ${MARK_BOX.y + 2} L ${MARK_BOX.x + MARK_BOX.w} ${MARK_BOX.y + 44}
                 M ${MARK_BOX.x + MARK_BOX.w} ${MARK_BOX.y + 2} L ${MARK_BOX.x + 36} ${MARK_BOX.y + 44}`"
            fill="none"
            :stroke="MARK_COLOR"
            stroke-width="5"
          />
          <text
            class="sf-tbc-note"
            :x="layout.note.x"
            :y="layout.note.y"
            :font-size="layout.note.size"
            :fill="MINT_COLOR"
            font-weight="700"
            letter-spacing="0.02em"
          >{{ layout.note.text }}</text>
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
        On-bar labels fade LATER than the static annotation layers — the
        recording's measured windows: label 1 at 2800–2983ms, label 2 at
        7467–7667ms (delay + fade) over the already-settled composition.
      -->
      <template v-for="(bar, bi) in layout.bars" :key="`annot-${bar.id}`">
        <text
          v-if="bar.label"
          :class="['sf-tbc-label', `sf-tbc-label-${bi + 1}`]"
          :x="bar.labelX"
          :y="bar.labelY"
          dominant-baseline="central"
          :font-size="type.labelSize"
          :fill="LABEL_COLOR"
          v-bind="pinAttrs(bar.label, type.labelSize, bar.labelLength ?? undefined)"
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
    </g>

    <!-- Shared title chrome: the ref frame's single headline row — centered
         two-tone title (TwoBarCompare Title row: cap 53 in the band y98–151,
         centered ≈x962) condensed to the measured x565–1359 extent, plus the
         recording badge its sheet documents. -->
    <TitleChrome
      :title="title"
      :title-accent="titleAccent"
      :cap-height="53.2"
      :cap-top="108"
      :center-x="962"
      :title-text-length="HEADLINE_TEXT_LENGTH"
      badge
    />
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
 * destination state: forward reveal runs the fades, the hidden state's
 * transition:none makes backward nav instant — the locked decision, zero JS.
 * Scoped selectors (0,2,0 + attribute) beat Slidev's built-in
 * .slidev-vclick-target { transition: all .1s ease } — no source-order reliance.
 *
 * The annotation GROUP flips state instantly; its children own the fades.
 * The static layers fade together on the click; the two on-bar labels fade
 * later on the recording's measured windows (2800–2983ms / 7467–7667ms) —
 * intra-click CSS delays, not clicks (the sheet locks ?clicks=3 with the
 * labels visible in the settled state), so AutoAdvance's stepScheduleMs
 * does not apply here and there are no hand-rolled timers.
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
  transition: none;
}

.sf-tbc-annot-core {
  transition: opacity 150ms ease-out;
}

.sf-tbc-label {
  /* Label 1: fade window 2800–2983ms after the annotation click (delay +
   * duration) — the composition settles first, the label arrives late. */
  transition: opacity 183ms ease-out;
  transition-delay: 2800ms;
}

.sf-tbc-label-2 {
  /* Label 2: fade window 7467–7667ms after the annotation click. */
  transition-duration: 200ms;
  transition-delay: 7467ms;
}

.sf-tbc-annot.slidev-vclick-hidden .sf-tbc-annot-core,
.sf-tbc-annot.slidev-vclick-hidden .sf-tbc-label {
  transition: none;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .sf-tbc-bar,
  .sf-tbc-bar-rect,
  .sf-tbc-annot-core,
  .sf-tbc-label {
    transition: none;
  }
}
</style>
