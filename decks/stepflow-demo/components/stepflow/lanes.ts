/**
 * MilestoneLanes data contract + pure layout math (diagram-family spec, MilestoneLanes).
 *
 * A four-lane Gantt/milestone chart: horizontal lanes of offset bars in two
 * tones, with small tick markers at the left edge. Bar sizes and offsets are
 * DATA (canvas fractions), never computed — the recording's chart is
 * hand-placed. Pure and SSR-safe: no DOM access, no mutation of the inputs.
 *
 * Measured from the source video at 174–181s (research art_2kSBGNmJ §3.4,
 * crop milestone.png): four lanes at pitch ≈50px/720 (6.9%h), bar heights
 * 24–35px (3.3–4.9%h), lanes 1–2 red (accentAlt) and 3–4 amber (accent),
 * small tick marks at the left edge (x208/1280).
 *
 * Two-phase choreography (fidelity report art_iHm120ov §MilestoneLanes):
 * each bar pops WIDE — a sweep anchored at the tick rail spanning to the
 * bar's final right edge, the state the ref frame at t=180.1s caught —
 * then re-proportions to its measured seed width (the left edge retracts,
 * right edge fixed; measured retraction 176.35→176.80s ≈ 470ms ease-out).
 * The uniform rail-anchored sweep re-paces the recording's lane-specific
 * pop variants — an accepted re-pace deviation, same class as StackPanels'.
 */

/** One horizontal bar in a lane. `(xFrac, wFrac)` span the canvas width. */
export interface LaneBar {
  /** Left edge x as a fraction of the canvas width. */
  xFrac: number
  /** Bar width as a fraction of the canvas width. */
  wFrac: number
  /** Palette role: `accent` (amber) or `alt` (red) under the statusAmber preset. */
  tone: 'accent' | 'alt'
  /**
   * Optional bar-height override as a fraction of the canvas height; omitted
   * bars take the data-level `barHFrac` (the seed overrides the two short
   * lanes — measured heights span 24–35px at 720).
   */
  hFrac?: number
}

/** One horizontal lane: an id, its bars in click order, and an optional label. */
export interface Lane {
  /** Stable key — test selectors and template keys. */
  id: string
  /** Bars on this lane, revealed one click per bar in data order. */
  bars: LaneBar[]
  /** Short label rendered left of the tick rail, riding the lane's first bar click. */
  label?: string
}

/** The full MilestoneLanes chart: lanes plus the measured lane grid. */
export interface MilestoneLanesData {
  /** Lanes top-to-bottom; lane i's bar top sits at `y0Frac + i * lanePitchFrac`. */
  lanes: Lane[]
  /** Bar top of the first lane as a fraction of the canvas height. */
  y0Frac: number
  /** Vertical lane pitch as a fraction of the canvas height. */
  lanePitchFrac: number
  /** Default bar height as a fraction of the canvas height (per-bar `hFrac` overrides). */
  barHFrac: number
}

export interface Canvas {
  width: number
  height: number
}

/**
 * Measured geometry, source 174–181s (fractions of the 1920×1080 canvas;
 * source px are 1280×720 of the 2560×1440 video).
 */
export const LANE_Y0_FRAC = 350 / 720 // first lane's bar top: y350
export const LANE_PITCH_FRAC = 50 / 720 // lane pitch ≈50px (measured y-steps 48/64/49)
export const BAR_H_FRAC = 35 / 720 // default bar height 35px (lanes 1 & 3)
export const BAR_H_SHORT_FRAC = 24 / 720 // short bar height 24px (lanes 2 & 4)
export const TICK_X_FRAC = 208 / 1280 // left-edge tick rail: x208
export const TICK_H_FRAC = 12 / 720 // tick height 12px (y275–287)

/**
 * Measured text-row chrome (ref frame t=180.1s at 1920×1080, fidelity report
 * art_iHm120ov §MilestoneLanes fixes 1–2): a header label row above lane 1,
 * a footer row with a teal icon chip, 26–28px lane labels, and a dim warm
 * container frame around the chart field.
 */
export const HEADER_ROW_Y_FRAC = 412 / 1080 // header text row top (y412–439)
export const HEADER_ROW_X_FRAC = 364 / 1920 // header text left edge (x364, after the amber glyph)
export const HEADER_ICON_X_FRAC = 315 / 1920 // amber glyph left edge (x315–350, ~36px)
export const HEADER_ICON_Y_FRAC = 406 / 1080 // amber glyph top (y406–445)
export const FOOTER_CHIP_X_FRAC = 326 / 1920 // teal chip left edge (x326–362)
export const FOOTER_CHIP_Y_FRAC = 856 / 1080 // teal chip top (y856–901, 36×45)
export const FOOTER_CHIP_W_FRAC = 36 / 1920
export const FOOTER_CHIP_H_FRAC = 45 / 1080
export const FOOTER_ROW_Y_FRAC = 868 / 1080 // footer text row top (y868–888)
export const FOOTER_ROW_X_FRAC = 392 / 1920 // footer text left edge (x392)
export const LANE_LABEL_X_FRAC = 410 / 1920 // lane labels left-align here (measured x410, inside the rail)
export const LANE_LABEL_SIZE_PX = 28 // lane labels: 26–28px class at 1920 scale
export const HEADER_ROW_SIZE_PX = 28 // header row: measured ≈28.9px/char pitch
export const FOOTER_ROW_SIZE_PX = 26 // footer row: measured ≈26.6px/char pitch

/** Dim warm container frame around the chart field: borders x281–1652, y377–954. */
export const BOX_X_FRAC = 281 / 1920
export const BOX_Y_FRAC = 377 / 1080
export const BOX_W_FRAC = (1652 - 281) / 1920
export const BOX_H_FRAC = (954 - 377) / 1080

/** Resolved px geometry for one bar, ready to render. */
export interface LaneBarLayout {
  laneIndex: number
  barIndex: number
  /** Settled (final) rect: the measured seed geometry. */
  x: number
  y: number
  w: number
  h: number
  /** Pop-state rect: rail-anchored sweep to the bar's final right edge. */
  popX: number
  popW: number
  tone: LaneBar['tone']
  /** 1-based native v-click index of the WIDE POP (odd: 1, 3, 5, …). */
  click: number
  /** 1-based native v-click index of the re-proportion (pop click + 1). */
  settleClick: number
}

/** Resolved px geometry for one lane, ready to render. */
export interface LaneLayout {
  id: string
  index: number
  label?: string
  /** Bar top y in px (bars hang down from the lane line). */
  y: number
  bars: LaneBarLayout[]
  /** Click index of the lane's first bar — the optional label rides it. */
  firstClick: number
}

/** Resolved px geometry for one left-edge tick marker. */
export interface LaneTick {
  /** Tick center x in px. */
  x: number
  /** Tick center y in px — the vertical center of its lane's tallest bar. */
  y: number
  /** Tick length in px (a vertical mark). */
  h: number
}

/** Resolved px geometry for the dim warm container frame around the chart. */
export interface LaneBox {
  x: number
  y: number
  w: number
  h: number
}

export interface MilestoneLanesLayout {
  lanes: LaneLayout[]
  ticks: LaneTick[]
  /** Dim warm container frame around the chart field (ref x281–1652, y377–954). */
  box: LaneBox
  /** Total native v-clicks: pop + re-proportion per bar, then the closing beat. */
  clickCount: number
  viewBox: Canvas
}

/**
 * Resolve the full render layout for a MilestoneLanes chart.
 *
 * - Bar offsets and sizes are data; fractions must stay inside the canvas —
 *   violations throw RangeError, never render blank. A bar whose right edge
 *   sits at or left of the tick rail has no sweep to pop — also a RangeError.
 * - Click choreography (native v-clicks): bar k (lane by lane, bar by bar)
 *   pops wide on click 2k−1 and re-proportions on click 2k; the closing
 *   beat (tick markers + footer row) is the final click 2n+1.
 */
export function milestoneLanesLayout(data: MilestoneLanesData, viewBox: Canvas = { width: 1920, height: 1080 }): MilestoneLanesLayout {
  if (data.lanes.length === 0) {
    throw new RangeError('MilestoneLanes needs at least one lane')
  }
  if (!(data.y0Frac >= 0 && data.y0Frac <= 1) || !(data.lanePitchFrac > 0) || !(data.barHFrac > 0 && data.barHFrac <= 1)) {
    throw new RangeError(`lane grid (y0 ${data.y0Frac}, pitch ${data.lanePitchFrac}, barH ${data.barHFrac}) is outside the [0, 1] canvas-fraction range`)
  }

  let click = 0
  const lanes: LaneLayout[] = data.lanes.map((lane, laneIndex) => {
    if (lane.bars.length === 0) {
      throw new RangeError(`lane "${lane.id}" has no bars`)
    }
    const y = (data.y0Frac + laneIndex * data.lanePitchFrac) * viewBox.height
    const bars: LaneBarLayout[] = lane.bars.map((bar, barIndex) => {
      if (!(bar.xFrac >= 0 && bar.xFrac < 1) || !(bar.wFrac > 0) || bar.xFrac + bar.wFrac > 1) {
        throw new RangeError(`bar ${barIndex} on lane "${lane.id}" spans (${bar.xFrac} + ${bar.wFrac}) — outside the [0, 1] canvas-fraction range`)
      }
      const hFrac = bar.hFrac ?? data.barHFrac
      if (!(hFrac > 0 && hFrac <= 1)) {
        throw new RangeError(`bar ${barIndex} on lane "${lane.id}" height ${hFrac} is outside the (0, 1] canvas-fraction range`)
      }
      if (bar.xFrac + bar.wFrac <= TICK_X_FRAC) {
        throw new RangeError(`bar ${barIndex} on lane "${lane.id}" ends at ${bar.xFrac + bar.wFrac} — at or left of the tick rail (${TICK_X_FRAC}); no sweep to pop`)
      }
      click += 1
      const x = bar.xFrac * viewBox.width
      const w = bar.wFrac * viewBox.width
      const popX = TICK_X_FRAC * viewBox.width
      return {
        laneIndex,
        barIndex,
        x,
        y,
        w,
        h: hFrac * viewBox.height,
        popX,
        popW: x + w - popX,
        tone: bar.tone,
        click: click * 2 - 1,
        settleClick: click * 2,
      }
    })
    return { id: lane.id, index: laneIndex, label: lane.label, y, bars, firstClick: bars[0].click }
  })

  // Tick markers: one amber tick per lane at the measured left-edge rail,
  // centered on the lane's tallest bar; they spread across lanes on the
  // closing beat.
  const ticks: LaneTick[] = lanes.map((lane) => {
    const tallest = Math.max(...lane.bars.map((bar) => bar.h))
    return {
      x: TICK_X_FRAC * viewBox.width,
      y: lane.y + tallest / 2,
      h: TICK_H_FRAC * viewBox.height,
    }
  })

  const box: LaneBox = {
    x: BOX_X_FRAC * viewBox.width,
    y: BOX_Y_FRAC * viewBox.height,
    w: BOX_W_FRAC * viewBox.width,
    h: BOX_H_FRAC * viewBox.height,
  }

  return { lanes, ticks, box, clickCount: click * 2 + 1, viewBox }
}
