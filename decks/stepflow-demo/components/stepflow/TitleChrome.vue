<script setup lang="ts">
import { computed } from 'vue'
import {
  CHROME_GREEN,
  TITLE_WHITE,
  TOP_RIGHT_BADGE,
  titleBaseline,
  titleFontSize,
  type TitleToken,
} from './chrome'

/**
 * Shared family title chrome (the exact-trace sheets' consensus treatment):
 * a centered two-tone display title — white `title` lead + chrome-green
 * `titleAccent` tail — with the family's sheet-measured cap height and title
 * band, plus the optional top-right recording badge for the six families
 * whose sheets document it.
 *
 * Token mode: when `tokens` carries sheet-measured ink runs (art_mkVNxsft
 * Title rows), each token renders as its own condensate-fitted <text> — per-
 * token x, textLength, and cap band absorb the recordings' condensed-face
 * advance (the deck mono runs wider than the recorded face at equal cap).
 *
 * Renders an SVG fragment: mount it inside the family's 1920×1080 svg. Slide 2
 * (StepFlow) predates this chrome and does not consume it.
 */
const props = withDefaults(defineProps<{
  /** White lead line, e.g. 'DATA'. */
  title?: string
  /** Tail rendered in chrome green (titleAccent convention). */
  titleAccent?: string
  /** Sheet/reference-measured title ink extent in canvas px. The deck's mono
   * face runs wider than the recordings' condensed face at the same cap
   * height; families pin this to their sheet's Title-row extent and the SVG
   * condenses advances + glyphs to match (`textLength` +
   * `lengthAdjust="spacingAndGlyphs"`). Undefined = natural mono width. */
  titleTextLength?: number
  /** Sheet-measured cap height in 1920×1080 pixels (43–97 across the sheets). */
  capHeight: number
  /** Sheet-measured top of the title band in 1920×1080 pixels. */
  capTop: number
  /** Horizontal center of the title ink (canvas center by default; the wave-1
   * sheets measure ≈912–918 for the src-1..7 recordings). */
  centerX?: number
  /** Vertical order flip for the two families whose sheets read the green
   * phrase FIRST (VerticalSpine 'SQL…', SchematicRows 'Harder…'). */
  accentFirst?: boolean
  /** Render the top-right recording badge (only the six families whose
   * sheets document it pass this). */
  badge?: boolean
  /** Per-token measured ink runs; supersedes the centered lead/tail pair. */
  tokens?: TitleToken[]
}>(), {
  title: '',
  titleAccent: '',
  centerX: 960,
  accentFirst: false,
  badge: false,
  tokens: () => [],
})

const fontSize = computed(() => titleFontSize(props.capHeight))
const baseline = computed(() => titleBaseline(props.capTop, props.capHeight))
// Tail gap between the two-tone halves (the recordings' word gap ≈ 0.3em).
const tailGap = computed(() => `${(fontSize.value * 0.3).toFixed(4)}`)
</script>

<template>
  <g class="sf-title-chrome">
    <!-- Token mode: one condensate-fitted <text> per measured ink run. -->
    <template v-if="tokens.length">
      <text
        v-for="(t, i) in tokens"
        :key="`${t.text}-${i}`"
        class="sf-chrome-title"
        :x="t.x"
        :y="titleBaseline(t.capTop ?? capTop, t.capHeight ?? capHeight)"
        :font-size="titleFontSize(t.capHeight ?? capHeight)"
        :fill="t.accent ? CHROME_GREEN : TITLE_WHITE"
        :textLength="t.width"
        lengthAdjust="spacingAndGlyphs"
      >{{ t.text }}</text>
    </template>

    <text
      v-else-if="title || titleAccent"
      class="sf-chrome-title"
      :x="centerX"
      :y="baseline"
      text-anchor="middle"
      :font-size="fontSize"
      :fill="TITLE_WHITE"
      :textLength="titleTextLength"
      :lengthAdjust="titleTextLength ? 'spacingAndGlyphs' : undefined"
      letter-spacing="0.06em"
    ><tspan
      v-if="accentFirst && titleAccent"
      :fill="CHROME_GREEN"
    >{{ titleAccent }}</tspan><tspan
      v-if="title"
      :dx="accentFirst && titleAccent ? tailGap : undefined"
      :fill="TITLE_WHITE"
    >{{ title }}</tspan><tspan
      v-if="!accentFirst && titleAccent"
      :dx="title ? tailGap : undefined"
      :fill="CHROME_GREEN"
    >{{ titleAccent }}</tspan></text>

    <!-- Recording badge: solid green pill (sheet glyph is not resolvable at 1080p). -->
    <rect
      v-if="badge"
      class="sf-top-right-badge"
      :x="TOP_RIGHT_BADGE.x"
      :y="TOP_RIGHT_BADGE.y"
      :width="TOP_RIGHT_BADGE.width"
      :height="TOP_RIGHT_BADGE.height"
      :rx="TOP_RIGHT_BADGE.height / 2"
      :fill="TOP_RIGHT_BADGE.fill"
    />
  </g>
</template>

<style scoped>
.sf-title-chrome text {
  /* Same mono stack as the family components (scoped here because this is a
     child component — the families' scoped `svg text` selectors don't reach
     into it). */
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}
</style>
