<script setup lang="ts">
import { computed } from 'vue'
import { CHIP_WFRAC, SUBBAND_WFRAC, ratioStripLayout, type StripSegment, type StripTone } from './stepflow/strip'
import { resolvePalette, type StepFlowPaletteOverride } from './stepflow/palettes'

const props = withDefaults(defineProps<{
  /** Proportional segments; `wFrac` is the click-1 width, `wFracFinal` the click-2 destination. */
  segments: StripSegment[]
  /** Band top edge as a fraction of the canvas height. */
  yFrac: number
  /** Band height as a fraction of the canvas height. */
  hFrac: number
  /** Optional single caption line at the band's left edge (author labels XOR caption). */
  caption?: string
  /** Partial palette merged over the measured `cyanOnBlack` preset. */
  palette?: StepFlowPaletteOverride
  /** Mono header line, e.g. 'RUNTIME'. */
  title?: string
  /** Header tail rendered in chrome green after `title` (two-tone chrome convention). */
  titleAccent?: string
}>(), { palette: () => ({}) })

const p = computed(() => resolvePalette(props.palette))
const layout = computed(() => ratioStripLayout({ segments: props.segments, yFrac: props.yFrac, hFrac: props.hFrac, caption: props.caption }))

// Tone fills map to palette roles; the plain tone is chrome white (NodeEdge
// precedent) — chrome, not a palette field.
const PLAIN_FILL = '#f5f4f7'
const CHROME_GREEN = '#66fb00'

// Hue decisions (research art_2kSBGNmJ §3.3; evidence crops were not available
// this session, so the research's guidance decides — documented in the README
// row): the salmon #f77c7b read is compression-muddied amber → maps to
// `statusAmber.accent` (the demo's `accent`), never a new preset. The mint
// chip #9dfbd6 is a measured settled median → documented local constant, chip
// fill only. The darker-teal sub-band renders as a black overlay on the
// resolved teal token so it stays darker than whatever teal the palette
// resolves to.
const MINT = '#9dfbd6'
const SUBBAND_OVERLAY = 'rgba(0, 0, 0, 0.35)'

function toneColor(tone: StripTone): string {
  if (tone === 'accent') return p.value.accent
  if (tone === 'alt') return p.value.accentAlt ?? p.value.accent
  if (tone === 'tertiary') return p.value.accentTertiary ?? p.value.accent
  return PLAIN_FILL
}

// Teal-region internals anchor to every tertiary segment (the recording has
// one): the mint chip at the region's left edge, the darker-teal sub-band
// right-aligned — both sized as fractions of that segment's FINAL width.
const tertiaries = computed(() => layout.value.segments.filter((s) => s.tone === 'tertiary'))

// Typography on the StepFlow scale (NodeEdge pattern).
const type = computed(() => {
  const k = layout.value.viewBox.height / 848
  return { titleSize: 34 * k, labelSize: 13 }
})
</script>

<template>
  <svg
    class="ratiostrip"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    :aria-label="`${segments.length}-segment ratio strip`"
  >
    <!--
      Reveal binding (2 native v-clicks): click 1 builds the band at initial
      proportions — every segment grows rightward in parallel (width 0 → w0).
      Click 2 re-proportions: a second, fully-tiling copy of the band grows
      over it (width 0 → w1 per segment) while the caption row and the
      teal-region internals fade in. Hidden states snap (transition: none) so
      backward navigation is instant.
    -->
    <g v-click="1" class="sf-rs-build">
      <rect
        v-for="seg in layout.segments"
        :key="`init-${seg.id}`"
        class="sf-rs-seg0"
        :x="seg.x0"
        :y="layout.band.y"
        :width="seg.w0"
        :height="layout.band.h"
        :fill="toneColor(seg.tone)"
      />
    </g>

    <g v-click="2" class="sf-rs-final">
      <rect
        v-for="seg in layout.segments"
        :key="`final-${seg.id}`"
        class="sf-rs-seg1"
        :x="seg.x1"
        :y="layout.band.y"
        :width="seg.w1"
        :height="layout.band.h"
        :fill="toneColor(seg.tone)"
      />
      <template v-for="seg in tertiaries" :key="`teal-${seg.id}`">
        <!-- Darker-teal sub-band: right-aligned inside the teal region. -->
        <rect
          class="sf-rs-subband"
          :x="seg.x1 + seg.w1 * (1 - SUBBAND_WFRAC)"
          :y="layout.band.y"
          :width="seg.w1 * SUBBAND_WFRAC"
          :height="layout.band.h"
          :fill="SUBBAND_OVERLAY"
        />
        <!-- Mint label chip: full-height marker at the teal region's left edge. -->
        <rect
          class="sf-rs-chip"
          :x="seg.x1"
          :y="layout.band.y"
          :width="seg.w1 * CHIP_WFRAC"
          :height="layout.band.h"
          :fill="MINT"
        />
      </template>
      <!-- Caption row (click 2): per-segment labels under their final left edge. -->
      <text
        v-for="seg in layout.segments.filter((s) => s.label)"
        :key="`label-${seg.id}`"
        class="sf-rs-caption"
        :x="seg.x1"
        :y="layout.captionY"
        :font-size="type.labelSize"
        :fill="p.subtext"
        letter-spacing="0.08em"
      >{{ seg.label }}</text>
      <text
        v-if="caption"
        class="sf-rs-caption"
        :x="layout.band.x"
        :y="layout.captionY"
        :font-size="type.labelSize"
        :fill="p.subtext"
        letter-spacing="0.08em"
      >{{ caption }}</text>
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
.ratiostrip {
  display: block;
  width: 100%;
  height: auto;
}

.ratiostrip text {
  /* Open question #1 (font family): mono stack until the face is confirmed. */
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/*
 * Measured motion, re-paced (visual-spec §9 pattern): the recording builds
 * the band over ~0.8s (15fps, segments growing in parallel) and re-proportions
 * the teal region at +4.5s. Both moments re-pace to single clicks with a 600ms
 * width ease. Transition is taken from the destination state: forward reveal
 * runs the width transition, the hidden state's transition:none makes backward
 * nav instant — the locked decision, zero JS. Scoped selectors (0,2,0 +
 * attribute) beat Slidev's built-in .slidev-vclick-target transition.
 */
.sf-rs-seg0,
.sf-rs-seg1 {
  transition: width 600ms cubic-bezier(0, 0, 0.2, 1);
}

.sf-rs-build.slidev-vclick-hidden .sf-rs-seg0,
.sf-rs-final.slidev-vclick-hidden .sf-rs-seg1 {
  width: 0;
  transition: none;
}

.sf-rs-chip,
.sf-rs-subband,
.sf-rs-caption {
  transition: opacity 150ms ease-out;
}

.sf-rs-final.slidev-vclick-hidden .sf-rs-chip,
.sf-rs-final.slidev-vclick-hidden .sf-rs-subband,
.sf-rs-final.slidev-vclick-hidden .sf-rs-caption {
  opacity: 0;
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-rs-seg0,
  .sf-rs-seg1,
  .sf-rs-chip,
  .sf-rs-subband,
  .sf-rs-caption {
    transition: none;
  }
}
</style>
