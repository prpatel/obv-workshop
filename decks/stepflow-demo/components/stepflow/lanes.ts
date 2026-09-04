/**
 * MilestoneLanes data contract + pure layout math (diagram-family spec, MilestoneLanes).
 *
 * A four-lane Gantt/milestone chart: horizontal bars in two tones at
 * non-uniform lane positions, milestone diamonds on the left marker column,
 * dark captions inside the long bars, a header row above lane 1 and a footer
 * row below lane 4. Bar sizes, offsets and lane tops are DATA (canvas
 * fractions), never computed. Pure and SSR-safe: no DOM access, no mutation
 * of the inputs.
 *
 * Measured from the true settled reference frame (clip 6600 ms, native
 * 2560×1440 → 1920×1080; exact-trace sheet art_kYBddwt9): bar bboxes
 * x1218–1604/y525–575, x420–763/y597–632, x1307–1604/y694–745,
 * x420–1423/y766–802; fills #ED4342 (lanes 1–2) and #F9BB21 (lanes 3–4),
 * flat (the sheet's "interior texture" samples land on the dark on-bar
 * captions — measured fill std < 0.6 luma across all four bars); milestone
 * diamonds: rotated-45° hollow squares at (347,551) red and (347,719) amber,
 * outer core ≈38px side (≈54px bbox incl. stroke), lane 3 carries a second
 * ≈21px inner ring, each with a soft ≈52px radial glow; no tick markers, no
 * container frame, no lane-wide washes in the settled reference.
 *
 * Choreography (sheet §5 motion trace; two native v-clicks per bar plus a
 * closing beat — the contract is unchanged, the data order carries the
 * recording's reveal order): bar 2 sweeps its full rail then re-proportions
 * (clicks 1–2), bar 1 pops at final width (clicks 3–4), bar 4 grows ease-out
 * (clicks 5–6), bar 3 expands center-out (clicks 7–8), the footer row fades
 * last (click 9). Milestone diamonds ride the measured beats: lane 1's with
 * the opening sweep (click 1), lane 3's outer ring on click 4 and inner ring
 * on click 8. Backward navigation snaps instantly (component concern).
 */

/** One horizontal bar in a lane. `(xFrac, wFrac)` span the canvas width. */
export interface LaneBar {
  /** Left edge x as a fraction of the canvas width. */
  xFrac: number
  /** Bar width as a fraction of the canvas width. */
  wFrac: number
  /** Palette role: `accent` (amber) or `alt` (red) under the measured preset. */
  tone: 'accent' | 'alt'
  /**
   * Optional bar-height override as a fraction of the canvas height; omitted
   * bars take the data-level `barHFrac`.
   */
  hFrac?: number
  /** Optional dark caption rendered inside the bar, left-aligned (ref: the long bars carry mono captions). */
  text?: string
  /**
   * Pinned caption ink extent in px at 1920 scale — a spacing-only SVG
   * textLength pin, matching the measured condensed-face extent the deck's
   * mono face cannot hit naturally at the measured cap height.
   */
  textLength?: number
  /**
   * Reveal style (sheet §5): `sweep` grows along the rail past the final
   * width then re-proportions; `pop` appears at final width; `grow` eases
   * out along the rail; `center` expands from the bar's center. Defaults to
   * `sweep` (the original rail-anchored behavior).
   */
  reveal?: BarReveal
  /**
   * Sweep overshoot: the right edge the `sweep` reveal grows to before
   * re-proportioning (ref: bar 2 sweeps to x1511 before settling at 763).
   */
  sweepToFrac?: number
}

/** Reveal styles, one per bar per the sheet's motion table. */
export type BarReveal = 'sweep' | 'pop' | 'grow' | 'center'

/** One horizontal lane: an id, its bars in click order, and an optional label. */
export interface Lane {
  /** Stable key — test selectors and template keys. */
  id: string
  /** Bars on this lane, revealed one click per bar in data order. */
  bars: LaneBar[]
  /** Short label rendered left of the bars, riding the lane's first bar click. */
  label?: string
  /**
   * Bar top y as a fraction of the canvas height — overrides the uniform
   * `y0Frac + i * lanePitchFrac` grid (the reference lanes sit at
   * non-uniform measured positions y525/597/694/766 at 1080).
   */
  yFrac?: number
  /** Click the label fades in on; defaults to the lane's first bar click. */
  labelClick?: number
}

/** One milestone diamond on the left marker column. */
export interface MilestoneDiamond {
  /** Stable key — template keys. */
  id: string
  /** Center x as a fraction of the canvas width (ref marker column x347). */
  centerXFrac: number
  /** Center y as a fraction of the canvas height. */
  centerYFrac: number
  /** Palette role: `accent` (amber) or `alt` (red). */
  tone: 'accent' | 'alt'
  /** Native v-click the diamond pops on. */
  click: number
  /** Render the small inner ring instead of the outer one (ref lane 3 double outline). */
  inner?: boolean
}

/** The full MilestoneLanes chart: lanes, optional diamonds, and the grid fallback. */
export interface MilestoneLanesData {
  /** Lanes in click order; each lane's bar top sits at `yFrac` or the grid fallback. */
  lanes: Lane[]
  /** Grid fallback: bar top of the first lane as a fraction of the canvas height. */
  y0Frac: number
  /** Grid fallback: vertical lane pitch as a fraction of the canvas height. */
  lanePitchFrac: number
  /** Default bar height as a fraction of the canvas height (per-bar `hFrac` overrides). */
  barHFrac: number
  /** Milestone diamonds, revealed on their own beats. */
  diamonds?: MilestoneDiamond[]
}

export interface Canvas {
  width: number
  height: number
}

/**
 * Measured diamond geometry at 1920 scale (sheet §3 + native frame): rotated
 * squares of ≈38px side (≈54px bbox incl. stroke — the sheet's 40×40 core
 * within the 50–56px marker region), lane 3's inner ring ≈21px side, ≈3.5px
 * stroke, soft radial glow ≈52px across.
 */
export const DIAMOND_SIDE_PX = 38
export const DIAMOND_INNER_SIDE_PX = 21
export const DIAMOND_STROKE_PX = 3.5
export const DIAMOND_GLOW_RADIUS_PX = 26
export const DIAMOND_GLOW_OPACITY = 0.22

/** Measured caption/label typography at 1920 scale. */
export const BAR_TEXT_INSET_PX = 26
export const BAR_TEXT_SIZE_PX = 33
export const BAR_TEXT_FILL = '#0a0202'
export const LANE_LABEL_X_FRAC = 404 / 1920
export const LANE_LABEL_SIZE_PX = 35
export const LANE_LABEL_TRACKING_EM = 0.4

/**
 * Measured text-row chrome (ref frame clip 6600 ms at 1920×1080): a header
 * label row above lane 1 (amber leading glyph + light mono text) and a footer
 * row with a teal chip glyph.
 */
export const HEADER_ROW_Y_FRAC = 412 / 1080
export const HEADER_ROW_X_FRAC = 364 / 1920
export const HEADER_ICON_X_FRAC = 315 / 1920
export const HEADER_ICON_Y_FRAC = 406 / 1080
export const HEADER_ROW_SIZE_PX = 34
export const FOOTER_CHIP_X_FRAC = 326 / 1920
export const FOOTER_CHIP_Y_FRAC = 856 / 1080
export const FOOTER_CHIP_W_FRAC = 36 / 1920
export const FOOTER_CHIP_H_FRAC = 45 / 1080
export const FOOTER_ROW_Y_FRAC = 868 / 1080
export const FOOTER_ROW_X_FRAC = 392 / 1920
export const FOOTER_ROW_SIZE_PX = 26

/** Dim plate behind the chart zone — the settled field inside the plate is a
 * neutral dim tone, not void black; outside the plate the field IS void black
 * (the plate does NOT span the canvas). The plate brightens toward the top. */
export const PLATE_X_FRAC = 260 / 1920
export const PLATE_Y_FRAC = 372 / 1080
export const PLATE_W_FRAC = 1400 / 1920
export const PLATE_H_FRAC = 588 / 1080
export const PLATE_FILL = '#0f0e11'
export const PLATE_TOP_FILL = '#19181d'

/** A rect state in px: one phase of a bar's three-phase motion. */
export interface BarRectState {
  x: number
  w: number
}

/** Resolved px geometry for one bar, ready to render. */
export interface LaneBarLayout {
  laneIndex: number
  barIndex: number
  /** Settled (final) rect: the measured seed geometry. */
  x: number
  y: number
  w: number
  h: number
  tone: LaneBar['tone']
  reveal: BarReveal
  /** Caption rendered inside the bar, or undefined. */
  text?: string
  /** Pinned caption ink extent in px, or undefined for natural width. */
  textLength?: number
  /** Rect while hidden (pre-reveal): sweep/grow collapse at their left edge, center at its centerline, pop holds the final rect. */
  hidden: BarRectState
  /** Rect while popped: the sweep's overshoot width, otherwise the final rect. */
  popped: BarRectState
  /** Rect while settled: always the measured seed. */
  settled: BarRectState
  /** 1-based native v-click index of the reveal (odd: 1, 3, 5, …). */
  click: number
  /** 1-based native v-click index of the re-proportion (reveal click + 1). */
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
  /** Click index of the lane's first bar — the optional label rides it unless `labelClick` overrides. */
  firstClick: number
  /** Click the label fades in on. */
  labelClick: number
}

/** Resolved px geometry for one milestone diamond. */
export interface DiamondLayout {
  id: string
  /** Center x in px. */
  cx: number
  /** Center y in px. */
  cy: number
  /** Rotated-square side length in px. */
  side: number
  /** Stroke width in px. */
  stroke: number
  /** Radial glow radius in px. */
  glowRadius: number
  tone: MilestoneDiamond['tone']
  inner: boolean
  /** 1-based native v-click index the diamond pops on. */
  click: number
}

export interface MilestoneLanesLayout {
  lanes: LaneLayout[]
  diamonds: DiamondLayout[]
  /** Dim plate behind the chart zone (gradient top → flat bottom). */
  plate: { x: number; y: number; w: number; h: number }
  /** Total native v-clicks: reveal + re-proportion per bar, then the closing beat. */
  clickCount: number
  viewBox: Canvas
}

/**
 * Resolve the full render layout for a MilestoneLanes chart.
 *
 * - Bar offsets, sizes and lane tops are data; fractions must stay inside the
 *   canvas — violations throw RangeError, never render blank.
 * - Click choreography (native v-clicks): bar k (in data order — the data
 *   carries the recording's reveal order) reveals on click 2k−1 and
 *   re-proportions on click 2k; the footer row is the final click 2n+1.
 * - Reveal styles reshape the hidden/popped rects: `sweep` grows along the
 *   rail to its overshoot, `pop` holds the final rect throughout, `grow`
 *   collapses to zero width at its left edge, `center` collapses at its
 *   centerline.
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
    const yFrac = lane.yFrac ?? data.y0Frac + laneIndex * data.lanePitchFrac
    if (!(yFrac >= 0 && yFrac <= 1)) {
      throw new RangeError(`lane "${lane.id}" yFrac ${yFrac} is outside the [0, 1] canvas-fraction range`)
    }
    const y = yFrac * viewBox.height
    const bars: LaneBarLayout[] = lane.bars.map((bar, barIndex) => {
      if (!(bar.xFrac >= 0 && bar.xFrac < 1) || !(bar.wFrac > 0) || bar.xFrac + bar.wFrac > 1) {
        throw new RangeError(`bar ${barIndex} on lane "${lane.id}" spans (${bar.xFrac} + ${bar.wFrac}) — outside the [0, 1] canvas-fraction range`)
      }
      const hFrac = bar.hFrac ?? data.barHFrac
      if (!(hFrac > 0 && hFrac <= 1)) {
        throw new RangeError(`bar ${barIndex} on lane "${lane.id}" height ${hFrac} is outside the (0, 1] canvas-fraction range`)
      }
      const reveal: BarReveal = bar.reveal ?? 'sweep'
      if (reveal === 'sweep' && bar.sweepToFrac !== undefined && bar.sweepToFrac < bar.xFrac + bar.wFrac) {
        throw new RangeError(`bar ${barIndex} on lane "${lane.id}" sweepToFrac ${bar.sweepToFrac} ends left of its settled right edge — no sweep to pop`)
      }
      click += 1
      const x = bar.xFrac * viewBox.width
      const w = bar.wFrac * viewBox.width
      const sweepRight = (bar.sweepToFrac ?? bar.xFrac + bar.wFrac) * viewBox.width
      // Per-style phase rects: sweep collapses at its left edge and pops to
      // the overshoot; grow collapses at its left edge and pops to the final
      // width; center collapses at its centerline; pop holds the final rect
      // (the component veils it with opacity instead of geometry).
      const hiddenState: BarRectState = reveal === 'center' ? { x: x + w / 2, w: 0 } : reveal === 'pop' ? { x, w } : { x, w: 0 }
      const poppedState: BarRectState = reveal === 'sweep' ? { x, w: sweepRight - x } : { x, w }
      return {
        laneIndex,
        barIndex,
        x,
        y,
        w,
        h: hFrac * viewBox.height,
        tone: bar.tone,
        reveal,
        text: bar.text,
        textLength: bar.textLength,
        hidden: hiddenState,
        popped: poppedState,
        settled: { x, w },
        click: click * 2 - 1,
        settleClick: click * 2,
      }
    })
    const firstClick = bars[0].click
    return {
      id: lane.id,
      index: laneIndex,
      label: lane.label,
      y,
      bars,
      firstClick,
      labelClick: lane.labelClick ?? firstClick,
    }
  })

  // Milestone diamonds: rotated-square outlines with a soft radial glow,
  // resolved to px on the marker column (ref centers (347,551) and (347,719)).
  const diamonds: DiamondLayout[] = (data.diamonds ?? []).map((diamond) => {
    if (!(diamond.centerXFrac >= 0 && diamond.centerXFrac <= 1) || !(diamond.centerYFrac >= 0 && diamond.centerYFrac <= 1)) {
      throw new RangeError(`diamond "${diamond.id}" center (${diamond.centerXFrac}, ${diamond.centerYFrac}) is outside the [0, 1] canvas-fraction range`)
    }
    return {
      id: diamond.id,
      cx: diamond.centerXFrac * viewBox.width,
      cy: diamond.centerYFrac * viewBox.height,
      side: (diamond.inner ? DIAMOND_INNER_SIDE_PX : DIAMOND_SIDE_PX) * (viewBox.width / 1920),
      stroke: DIAMOND_STROKE_PX * (viewBox.width / 1920),
      glowRadius: DIAMOND_GLOW_RADIUS_PX * (viewBox.width / 1920),
      tone: diamond.tone,
      inner: diamond.inner ?? false,
      click: diamond.click,
    }
  })

  const plate = {
    x: PLATE_X_FRAC * viewBox.width,
    y: PLATE_Y_FRAC * viewBox.height,
    w: PLATE_W_FRAC * viewBox.width,
    h: PLATE_H_FRAC * viewBox.height,
  }
  return { lanes, diamonds, plate, clickCount: click * 2 + 1, viewBox }
}
