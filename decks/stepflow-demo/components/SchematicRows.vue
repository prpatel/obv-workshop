<script setup lang="ts">
import { computed } from 'vue'
import {
  SCHEMATIC_ROWS_SCENE,
  schematicRowsLayout,
  CLICK_BAND,
  CLICK_CHROME,
  CLICK_RAIL,
  CONNECTOR_RAIL,
  HIGHLIGHT_BAND,
  HIGHLIGHT_BANDS,
  ROW_BASELINE,
  ROW_FONT,
  ROW_NUMBER_STYLE,
  ROW_SCALE_X,
  STRING_EXTRA_TRACKING,
  TAB_TEXT,
  TOKEN_COLORS,
  TRAFFIC_DOTS,
  WINDOW_FRAME,
  WINDOW_PLATES,
  rowClick,
  type RowTokenTone,
  type SchematicRowsData,
} from './stepflow/rows'
import TitleChrome from './stepflow/TitleChrome.vue'

const props = withDefaults(defineProps<{
  /** White lead line after the green accent, e.g. 'to maintain'. */
  title?: string
  /** Green lead rendered FIRST (the sheet reads green 'Harder' before white). */
  titleAccent?: string
  /** Scene data; defaults to the sheet's verbatim seed (rows.ts). */
  data?: SchematicRowsData
}>(), {
  title: '',
  titleAccent: '',
  data: () => SCHEMATIC_ROWS_SCENE,
})

const layout = computed(() => schematicRowsLayout(props.data))

// Sheet §2.2 title row: green 'Harder' ink x476.5–793.9 + white 'to maintain'
// x816.5–1354.1 @1080 — combined extent 877.6, center 915.3, cap 78.4, top 48.1.
// The deck's mono runs wider at this cap height, so the extent is pinned via
// TitleChrome's titleTextLength (SVG textLength + spacingAndGlyphs).
const TITLE = {
  textLength: 877.6,
  capHeight: 78.4,
  capTop: 48.1,
  centerX: 915.3,
} as const

function tokenColor(tone: RowTokenTone): string {
  return TOKEN_COLORS[tone]
}

function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}

function px(n: number): string {
  return `${fmt(n)}px`
}
</script>

<template>
  <div class="sf-rows" role="img" :aria-label="`${layout.rows.length}-row code listing with callout annotations`">
    <svg
      class="sf-rows-svg"
      :viewBox="`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`"
      aria-hidden="true"
    >
      <!-- Shared title chrome: green lead first, extent pinned to the sheet's
           measured ink span (Direction-2 condensation via textLength). -->
      <TitleChrome
        :title="title"
        :title-accent="titleAccent"
        :title-text-length="TITLE.textLength"
        :cap-height="TITLE.capHeight"
        :cap-top="TITLE.capTop"
        :center-x="TITLE.centerX"
        accent-first
      />

      <!--
        Window chrome (click 1): the single dim top rule (blurred to the frame's
        soft y299–305 profile), traffic dots, and the smaller tracked
        answer_service.py tab. The sheet's right-aligned path is not visible in
        the settled frame and is deliberately not rendered (see rows.ts). Pops in
        as one group — the sheet's largest single event (f170).
      -->
      <g v-click="CLICK_CHROME" class="sf-rows-window">
        <!-- Ambience plates first: the chrome band, code canvas, and callout
             column canvas (measured flat fills, see rows.ts WINDOW_PLATES). -->
        <rect
          v-for="(plate, k) in [WINDOW_PLATES.band, WINDOW_PLATES.main, WINDOW_PLATES.right]"
          :key="`plate-${k}`"
          :x="plate.x"
          :y="plate.y"
          :width="plate.w"
          :height="plate.h"
          :fill="plate.fill"
        />
        <rect
          v-for="(rule, k) in [WINDOW_FRAME.top]"
          :key="`rule-${k}`"
          class="sf-rows-rule"
          :x="rule.x"
          :y="rule.y"
          :width="rule.w"
          :height="rule.h"
          :fill="rule.fill"
        />
        <circle
          v-for="(dot, k) in TRAFFIC_DOTS"
          :key="`dot-${k}`"
          :cx="dot.cx"
          :cy="dot.cy"
          :r="dot.r"
          :fill="dot.fill"
        />
        <text
          class="sf-rows-chrome-text"
          :transform="`translate(${TAB_TEXT.x} ${TAB_TEXT.baseline})`"
          :font-size="TAB_TEXT.font"
          :letter-spacing="TAB_TEXT.tracking"
          :fill="TAB_TEXT.fill"
        >{{ TAB_TEXT.text }}</text>
      </g>

      <!--
        Teal highlight strips behind rows 4 and 5 (click 7, row 4's click — the
        frame shows two per-row strips with a 5px gap, not one solid band).
        Painted before the rows layer so they sit behind; fade-only reveal.
      -->
      <rect
        v-for="(strip, k) in HIGHLIGHT_BANDS"
        :key="`strip-${k}`"
        v-click="CLICK_BAND"
        class="sf-rows-band"
        :x="HIGHLIGHT_BAND.x"
        :y="strip.y"
        :width="HIGHLIGHT_BAND.w"
        :height="strip.h"
        :fill="HIGHLIGHT_BAND.fill"
      />

      <!--
        Cyan connector rail alongside rows 4–6 (click 6 — the sheet links it to the
        dependency rows). Draws top-down via the normalized dashoffset pattern.
      -->
      <line
        v-click="CLICK_RAIL"
        class="sf-rows-rail"
        :x1="CONNECTOR_RAIL.x + CONNECTOR_RAIL.w / 2"
        :y1="CONNECTOR_RAIL.y"
        :x2="CONNECTOR_RAIL.x + CONNECTOR_RAIL.w / 2"
        :y2="CONNECTOR_RAIL.y + CONNECTOR_RAIL.h"
        :stroke="CONNECTOR_RAIL.fill"
        :stroke-width="CONNECTOR_RAIL.w"
        pathLength="1"
      />

      <!--
        Four right-hand callouts: hand-drawn ellipse ring + optional tail + tracked
        label, each keyed to the click of the row it annotates (1 → click 2; 2/3/4 →
        their rows' clicks 7/8/9).
      -->
      <g
        v-for="callout in layout.callouts"
        :key="`callout-${callout.id}`"
        v-click="callout.click"
        class="sf-rows-callout"
      >
        <ellipse
          :cx="callout.ring.cx"
          :cy="callout.ring.cy"
          :rx="callout.ring.rx"
          :ry="callout.ring.ry"
          :transform="`rotate(${callout.ring.rot} ${callout.ring.cx} ${callout.ring.cy})`"
          fill="none"
          :stroke="callout.ring.fill"
          :stroke-width="callout.ring.stroke"
        />
        <polyline
          v-if="callout.tail.length"
          :points="callout.tail.map(([x, y]) => `${x},${y}`).join(' ')"
          fill="none"
          :stroke="callout.ring.fill"
          stroke-width="3.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <text
          class="sf-rows-label"
          :x="callout.ink.x"
          :y="callout.ink.baseline"
          :font-size="callout.ink.font"
          :letter-spacing="callout.ink.tracking"
          :fill="callout.ink.fill"
        >{{ callout.label }}</text>
      </g>

      <!-- Gutter numbers: each fades in with its row's click, on the shared baseline. -->
      <text
        v-for="(row, i) in layout.rows"
        :key="`num-${row.id}`"
        v-click="rowClick(i)"
        class="sf-rows-number"
        :x="ROW_NUMBER_STYLE.x"
        :y="row.inkTop + ROW_BASELINE"
        :font-size="ROW_NUMBER_STYLE.font"
        :fill="ROW_NUMBER_STYLE.fill"
      >{{ row.number }}</text>
    </svg>

    <!--
      The listing: one absolutely-positioned div per row at its measured x/ink-top.
      Rows type character by character (the recording's ≈9.8s typewriter re-paced to
      one row per click): each char's animation starts at ci × charDelay after the
      row's click removes .slidev-vclick-hidden; backward nav snaps via animation:none.
      No horizontal condensation (ROW_SCALE_X is 1 — the reference mono advance is
      the deck mono's natural 0.6em); string tokens carry the measured +2.1px/char
      tracking via per-span letter-spacing.
    -->
    <div
      v-for="row in layout.rows"
      :key="row.id"
      v-click="row.click"
      class="sf-rows-row"
      :style="{ left: px(row.x), top: px(row.y), fontSize: px(ROW_FONT), transform: `scaleX(${fmt(ROW_SCALE_X)})` }"
    >
      <span
        v-for="(char, ci) in row.chars"
        :key="ci"
        class="sf-rows-char"
        :style="{ color: tokenColor(char.tone), '--ci': String(ci), '--cd': `${fmt(row.charDelayMs)}ms`, letterSpacing: char.tone === 'string' ? px(STRING_EXTRA_TRACKING) : undefined }"
      >{{ char.ch }}</span>
    </div>
  </div>
</template>

<style scoped>
.sf-rows {
  position: absolute;
  inset: 0;
}

.sf-rows-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* Window chrome: one group pop (fade + 3px rise, 150ms); backward snap. Scoped
   selectors (0,2,0 + attribute) beat Slidev's .slidev-vclick-target default. */
.sf-rows-window {
  transition:
    opacity 150ms ease-out,
    transform 150ms ease-out;
}

.sf-rows-window.slidev-vclick-hidden {
  opacity: 0;
  transform: translateY(3px);
  transition: none;
}

.sf-rows-chrome-text,
.sf-rows-label,
.sf-rows-number {
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
}

/* The frame's top rule reads as a soft ~7px glow band (y299–305), not a crisp
   2.5px line — blur the core rect into that profile. */
.sf-rows-rule {
  filter: blur(1.3px);
}

/* Band and callouts: fade-only reveals (150ms), instant backward snap. */
.sf-rows-band,
.sf-rows-callout {
  transition: opacity 150ms ease-out;
}

.sf-rows-band.slidev-vclick-hidden,
.sf-rows-callout.slidev-vclick-hidden {
  transition: none;
}

/* Rail: normalized dashoffset draw, 300ms on, instant snap off. */
.sf-rows-rail {
  stroke-dasharray: 1;
  stroke-dashoffset: 0;
  transition:
    stroke-dashoffset 300ms cubic-bezier(0, 0, 0.2, 1),
    opacity 120ms ease-out;
}

.sf-rows-rail.slidev-vclick-hidden {
  stroke-dashoffset: 1;
  transition: none;
}

/* Rows: the div itself carries no transition — the typewriter is the reveal. */
.sf-rows-row {
  position: absolute;
  line-height: 1;
  letter-spacing: 0;
  white-space: pre;
  transform-origin: left top;
  font-family: var(--sf-font-mono, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace);
  transition: none;
}

.sf-rows-row.slidev-vclick-hidden {
  transition: none;
}

/* Typewriter: each char fades in at ci × charDelay once its row's click removes
   the hidden class (fresh animation each reveal); the hidden state resets to
   animation:none so backward nav snaps and re-reveals replay. */
.sf-rows-char {
  opacity: 0;
  /* fill forwards is load-bearing: the char's natural state is opacity 0, and
     the 1ms animation must HOLD opacity 1 after finishing. */
  animation: sf-rows-type 1ms linear forwards;
  animation-delay: calc(var(--ci) * var(--cd));
}

.sf-rows-row.slidev-vclick-hidden .sf-rows-char {
  animation: none;
  opacity: 0;
}

@keyframes sf-rows-type {
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sf-rows-window,
  .sf-rows-band,
  .sf-rows-callout,
  .sf-rows-rail,
  .sf-rows-row,
  .sf-rows-char {
    transition: none;
  }

  .sf-rows-char {
    animation: none;
    opacity: 1;
  }
}
</style>
