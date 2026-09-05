<script setup lang="ts">
import {
  CORE_FILL,
  HALO_FILL,
  HALO_PEAK_FRAC,
  LEADER_STROKE,
  PLATE_EDGE,
  PLATE_FILL,
  SEG12_INK,
  compareBadgeLayout,
  type BadgeRowId,
  type InkPath,
} from './stepflow/compareBadge'

// Measured seg12 composition resolved on the 1920×1080 stage (module docblock
// carries the settled-frame provenance). Pure and static — no props: the
// composition renders the traced reference ink (SEG12_INK), not slide copy.
const layout = compareBadgeLayout()

// The recorded glow blooms far past the measured visible-ink radius
// (halo.r = where the settled sample read >=1 luma): fitted radial profile
// from the reference frame - full plateau to the core edge, then the faint
// far tail stays visible to ~300 stage px. Sampled at 1920x1080 against
// HALO_FILL luma 32.2. The gradient renders at GLOW_RENDER_FRAC x halo.r
// so the tail is drawable; peak offset keeps HALO_PEAK_FRAC meaningful.
const GLOW_RENDER_FRAC = 2.105
const GLOW_PEAK_OFFSET = HALO_PEAK_FRAC / GLOW_RENDER_FRAC
const GLOW_STOPS: { offset: number; alpha: number }[] = [
  { offset: 0.42, alpha: 0.4 },
  { offset: 0.5, alpha: 0.116 },
  { offset: 0.567, alpha: 0.068 },
  { offset: 0.633, alpha: 0.054 },
  { offset: 0.7, alpha: 0.05 },
  { offset: 0.8, alpha: 0.035 },
  { offset: 0.9, alpha: 0.02 },
  { offset: 1, alpha: 0 },
]
const glowRadius = layout.halo.r * GLOW_RENDER_FRAC

interface RowView {
  id: BadgeRowId
  click: number
  plate: { x: number; y: number; w: number; h: number }
  brightInk: InkPath[]
  dimInk: InkPath[]
  iconInk: InkPath[]
}

const rowViews: RowView[] = layout.rows.map((row) => ({
  id: row.id,
  click: row.click,
  plate: row.plate,
  brightInk: SEG12_INK.rows[row.id].bright,
  dimInk: SEG12_INK.rows[row.id].dim,
  iconInk: SEG12_INK.rows[row.id].icon,
}))
</script>

<template>
  <svg
    class="comparebadge"
    :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
    role="img"
    aria-label="Two near-black panels compared against a central orange badge"
  >
    <defs>
      <linearGradient id="sf-badge-edge-top-outer" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="PLATE_EDGE.topOuterColor" stop-opacity="0" />
        <stop offset="1" :stop-color="PLATE_EDGE.topOuterColor" stop-opacity="0.95" />
      </linearGradient>
      <linearGradient id="sf-badge-edge-top-inner" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="PLATE_EDGE.coreColor" stop-opacity="0.75" />
        <stop offset="1" :stop-color="PLATE_EDGE.coreColor" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="sf-badge-edge-bottom-outer" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="PLATE_EDGE.bottomOuterColor" stop-opacity="0.95" />
        <stop offset="1" :stop-color="PLATE_EDGE.bottomOuterColor" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="sf-badge-edge-bottom-inner" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="PLATE_EDGE.coreColor" stop-opacity="0" />
        <stop offset="1" :stop-color="PLATE_EDGE.coreColor" stop-opacity="0.35" />
      </linearGradient>
    </defs>

    <!-- Settled title ink + top-right mark: traced from the reference frame
         (settled-truth convention — the recording face is unresolvable from
         the compressed raster, so the ink itself is the content). -->
    <g class="sf-badge-title-ink">
      <template v-for="(run, i) in SEG12_INK.title" :key="`title-${i}`">
        <path :d="run.d" :fill="run.fill" :fill-opacity="run.opacity ?? 1" fill-rule="evenodd" />
      </template>
      <template v-for="(run, i) in SEG12_INK.mark.olive" :key="`mark-olive-${i}`">
        <path :d="run.d" :fill="run.fill" :fill-opacity="run.opacity ?? 1" fill-rule="evenodd" />
      </template>
      <template v-for="(run, i) in SEG12_INK.mark.pale" :key="`mark-pale-${i}`">
        <path :d="run.d" :fill="run.fill" :fill-opacity="run.opacity ?? 1" fill-rule="evenodd" />
      </template>
    </g>

    <!-- Center badge — click 1. The orange core pops on the rim beat; the
         dark red-brown glow and leader lines trail ~70ms later (measured
         onsets 0.600 → 0.667). The glow is a radial gradient: settled rim
         sample peaking at the core edge (HALO_PEAK_FRAC), fading through the
         measured long tail. The dark glyph is the traced core mark. -->
    <g v-click="1" class="sf-badge">
      <defs>
        <radialGradient
          id="sf-badge-halo-grad"
          :cx="layout.halo.cx"
          :cy="layout.halo.cy"
          :r="glowRadius"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" :stop-color="HALO_FILL" stop-opacity="1" />
          <stop :offset="GLOW_PEAK_OFFSET" :stop-color="HALO_FILL" stop-opacity="1" />
          <stop
            v-for="(s, i) in GLOW_STOPS"
            :key="`glow-stop-${i}`"
            :offset="s.offset"
            :stop-color="HALO_FILL"
            :stop-opacity="s.alpha"
          />
        </radialGradient>
      </defs>
      <circle
        class="sf-badge-halo"
        :cx="layout.halo.cx"
        :cy="layout.halo.cy"
        :r="glowRadius"
        :fill="'url(#sf-badge-halo-grad)'"
      />
      <line
        v-for="(l, i) in layout.leaders"
        :key="`leader-${i}`"
        class="sf-badge-leader"
        :x1="l.x1"
        :y1="l.y1"
        :x2="l.x2"
        :y2="l.y2"
        :stroke="LEADER_STROKE"
        stroke-width="3"
      />
      <rect
        class="sf-badge-core"
        :x="layout.core.x"
        :y="layout.core.y"
        :width="layout.core.w"
        :height="layout.core.h"
        :rx="layout.core.corner"
        :fill="CORE_FILL"
      />
      <path
        v-for="(run, i) in SEG12_INK.coreGlyph"
        :key="`glyph-${i}`"
        class="sf-badge-glyph"
        :d="run.d"
        :fill="run.fill"
        :fill-opacity="run.opacity ?? 1"
        fill-rule="evenodd"
      />
    </g>

    <!-- Four plate rows — clicks 2–5, alternating left/right on the measured
         waves (1.00 left-top, 1.73 right-top, 3.00 left-bottom, 4.40
         right-bottom). Each wave fades plate, icon, and both ink runs
         together; the text and icon are traced reference ink. -->
    <g v-for="row in rowViews" :key="row.id" v-click="row.click" class="sf-badge-row">
      <rect
        class="sf-badge-plate"
        :x="row.plate.x"
        :y="row.plate.y"
        :width="row.plate.w"
        :height="row.plate.h"
        :fill="PLATE_FILL"
      />
      <!-- Top edge: core line, neutral inner fade, teal-tinted outer fade.
           The reference frame's left/right edges carry no line. -->
      <rect
        class="sf-badge-edge"
        :x="row.plate.x"
        :y="row.plate.y"
        :width="row.plate.w"
        :height="PLATE_EDGE.coreHeight"
        :fill="PLATE_EDGE.coreColor"
      />
      <rect
        class="sf-badge-edge"
        :x="row.plate.x"
        :y="row.plate.y + PLATE_EDGE.coreHeight"
        :width="row.plate.w"
        :height="PLATE_EDGE.innerFadeHeight"
        fill="url(#sf-badge-edge-top-inner)"
      />
      <rect
        class="sf-badge-edge"
        :x="row.plate.x"
        :y="row.plate.y - PLATE_EDGE.outerFadeHeight"
        :width="row.plate.w"
        :height="PLATE_EDGE.outerFadeHeight"
        fill="url(#sf-badge-edge-top-outer)"
      />
      <rect
        class="sf-badge-edge"
        :x="row.plate.x"
        :y="row.plate.y + row.plate.h - PLATE_EDGE.coreHeight"
        :width="row.plate.w"
        :height="PLATE_EDGE.coreHeight"
        :fill="PLATE_EDGE.coreColor"
      />
      <rect
        class="sf-badge-edge"
        :x="row.plate.x"
        :y="row.plate.y + row.plate.h - PLATE_EDGE.coreHeight - PLATE_EDGE.innerFadeHeight"
        :width="row.plate.w"
        :height="PLATE_EDGE.innerFadeHeight"
        fill="url(#sf-badge-edge-bottom-inner)"
      />
      <rect
        class="sf-badge-edge"
        :x="row.plate.x"
        :y="row.plate.y + row.plate.h"
        :width="row.plate.w"
        :height="PLATE_EDGE.outerFadeHeight"
        fill="url(#sf-badge-edge-bottom-outer)"
      />
      <path
        v-for="(run, i) in row.iconInk"
        :key="`icon-${i}`"
        class="sf-badge-icon"
        :d="run.d"
        :fill="run.fill"
        :fill-opacity="run.opacity ?? 1"
        fill-rule="evenodd"
      />
      <path
        v-for="(run, i) in row.brightInk"
        :key="`bright-${i}`"
        class="sf-badge-bright"
        :d="run.d"
        :fill="run.fill"
        :fill-opacity="run.opacity ?? 1"
        fill-rule="evenodd"
      />
      <path
        v-for="(run, i) in row.dimInk"
        :key="`dim-${i}`"
        class="sf-badge-dim"
        :d="run.d"
        :fill="run.fill"
        :fill-opacity="run.opacity ?? 1"
        fill-rule="evenodd"
      />
    </g>
  </svg>
</template>

<style scoped>
/* Destination-state transitions: visible state carries the animation;
   hidden state is the same composition at opacity 0 with transitions off,
   so back-navigation snaps and re-entering replays the beat. */

/* Core pops first: fade + slight scale (measured 0.600 → 0.80). */
.sf-badge-core {
  opacity: 1;
  transform: scale(1);
  transform-box: fill-box;
  transform-origin: center;
  transition: opacity 250ms ease-out, transform 250ms ease-out;
}

/* Rim (halo + leaders) trails the core onset by ~70ms (0.600 → 0.667). */
.sf-badge-halo,
.sf-badge-leader {
  opacity: 1;
  transition: opacity 300ms ease-out 70ms;
}

.sf-badge.slidev-vclick-hidden .sf-badge-core {
  opacity: 0;
  transform: scale(0.85);
  transition: none;
}

.sf-badge.slidev-vclick-hidden .sf-badge-halo,
.sf-badge.slidev-vclick-hidden .sf-badge-leader {
  opacity: 0;
  transition: none;
}

/* Row waves: the plate lands on the beat (~320ms fade); the traced ink
   (icon + both text runs) trails by ~70ms — one 15fps reference frame
   (white/icon events at beat +0.067s on all four rows). */
.sf-badge-row {
  opacity: 1;
  transition: opacity 320ms ease-out;
}

.sf-badge-bright,
.sf-badge-dim,
.sf-badge-icon {
  opacity: 1;
  transition: opacity 250ms ease-out 70ms;
}

.sf-badge-row.slidev-vclick-hidden {
  opacity: 0;
  transition: none;
}

.sf-badge-row.slidev-vclick-hidden .sf-badge-bright,
.sf-badge-row.slidev-vclick-hidden .sf-badge-dim,
.sf-badge-row.slidev-vclick-hidden .sf-badge-icon {
  opacity: 0;
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .sf-badge-core,
  .sf-badge-halo,
  .sf-badge-leader,
  .sf-badge-row {
    transition: none;
    animation: none;
  }
}
</style>
