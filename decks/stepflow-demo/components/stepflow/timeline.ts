/**
 * SegmentTimeline data contract + pure layout math (wave-2 family, spec
 * art_3VsrSvLm Wave-2 addendum; measured blueprint research art_2kSBGNmJ §3.1,
 * source 211–222s).
 *
 * One horizontal bar split into contiguous tone-coded segments, three tick
 * markers hanging below it, and an optional right-side label chip. Segment
 * sweeps are revealed-state width transitions (the established .sf-track-fill
 * pattern applied to a rect) — no path-length math.
 *
 * Measured from the source video (all numbers 1280×720 source px; canvas
 * fractions = px/1280 (x), px/720 (y)): bar x208–972, y297–365 (68px tall);
 * cool blue segment x208–674 (466px) then orange x676–972 (296px) —
 * contiguous; three 2×95px tick lines at x340/639/938, y367–462, small labels
 * beneath (12px glyphs, tops y508); a right-side label chip 89×22 @1006,320,
 * vertically centered on the bar. The source's 2px segment separation is
 * sub-tolerance: segments are modeled as contiguous and their widths as
 * proportional shares of the bar span, normalized to fill x0→x1 exactly.
 *
 * Pure and SSR-safe: no DOM access, no mutation of the inputs.
 */

/** One contiguous bar segment. Tones map to palette roles (`accent` = chainBlue blue, `alt` = orangeSpine orange). */
export interface TimelineSegment {
  /** Stable key — test selectors and per-segment reveal identity. */
  id: string
  /** Palette role: `accent` (cool blue) or `alt` (orange). */
  tone: 'accent' | 'alt'
  /** Short label rendered centered inside the segment (reveals with the ticks layer). */
  label?: string
  /**
   * Proportional share of the bar span, in canvas-width-fraction units
   * (the measured composition is 0.3640625 blue + 0.23125 orange). Shares are
   * normalized across segments so the bar always fills x0Frac → x1Frac
   * exactly, keeping segments contiguous. Omitted = one equal share.
   */
  wFrac?: number
}

/** A tick marker below the bar. `xFrac` is a canvas-width fraction. */
export interface TimelineTick {
  /** Tick line x as a fraction of the canvas width. */
  xFrac: number
  /** Small label rendered beneath the tick line. */
  label: string
}

/** The full SegmentTimeline composition: segments, ticks, bar geometry, chip. */
export interface SegmentTimelineData {
  /** Contiguous segments, left → right. At least one. */
  segments: TimelineSegment[]
  /** Tick markers below the bar (may be empty). */
  ticks: TimelineTick[]
  /** Bar top y as a fraction of the canvas height. */
  yFrac: number
  /** Bar height as a fraction of the canvas height. */
  hFrac: number
  /** Bar left x as a fraction of the canvas width. */
  x0Frac: number
  /** Bar right x as a fraction of the canvas width. */
  x1Frac: number
  /** Right-side label chip text (legend tag); omit for no chip. */
  chip?: string
}

export interface Canvas {
  width: number
  height: number
}

/** Measured tick-line length below the bar: 95px at source height 720 (fraction of canvas height). */
export const TICK_LEN_FRAC = 95 / 720
/** Gap between the bar bottom and the tick tops: 2px at source height 720. */
export const TICK_GAP_FRAC = 2 / 720
/** Gap from the tick-line end to the tick-label baseline: 58px at source height 720 (glyph tops y508, 12px tall). */
export const TICK_LABEL_GAP_FRAC = 58 / 720
/** Measured chip width: 89px at source width 1280 (fraction of canvas width). */
export const CHIP_W_FRAC = 89 / 1280
/** Measured chip height: 22px at source height 720 (fraction of canvas height). */
export const CHIP_H_FRAC = 22 / 720
/** Gap between the bar's right end and the chip's left edge: 34px at source width 1280. */
export const CHIP_GAP_FRAC = 34 / 1280

/** Typography in viewBox (1920×1080) units — measured glyph heights, rescaled ×1.5 from the 720p source. */
export const SEG_LABEL_SIZE = 20 // in-segment labels — no glyph measurement in the source, inferred [I]
export const TICK_LABEL_SIZE = 18 // measured 12px glyphs at 720p
export const CHIP_LABEL_SIZE = 15 // inferred [I] for the 22px-tall chip
export const TICK_STROKE = 3 // measured 2px tick lines at 720p
export const CHIP_STROKE = 2
export const CHIP_RADIUS = 9 // inferred [I]; rounded like the family's outlined boxes

/** Resolved px geometry for the bar, ready to render. */
export interface BarLayout {
  x: number
  y: number
  width: number
  height: number
}

/** Resolved px geometry for one segment, ready to render. */
export interface SegmentLayout {
  id: string
  tone: TimelineSegment['tone']
  label?: string
  /** Left edge px. Segments are contiguous: segment i+1 starts where segment i ends. */
  x: number
  /** Sweep width px — the revealed-state `--seg-w` (hidden state is width 0). */
  width: number
  /** Label center (segment midpoint, bar vertical center) for the labels layer. */
  labelCx: number
  labelCy: number
}

/** Resolved px geometry for one tick marker + its label, ready to render. */
export interface TickLayout {
  label: string
  x: number
  /** Tick-line top y (bar bottom + measured gap). */
  y0: number
  /** Tick-line length px. */
  len: number
  labelX: number
  /** Tick-label baseline y (tick end + measured glyph gap). */
  labelBaseline: number
}

/** Resolved px geometry for the right-side label chip, ready to render. */
export interface ChipLayout {
  x: number
  y: number
  width: number
  height: number
  text: string
}

export interface SegmentTimelineLayout {
  bar: BarLayout
  segments: SegmentLayout[]
  ticks: TickLayout[]
  chip?: ChipLayout
  viewBox: Canvas
}

function requireFraction(value: number, name: string, { positive = false } = {}): void {
  const inRange = positive ? value > 0 && value <= 1 : value >= 0 && value <= 1
  if (!inRange) {
    throw new RangeError(`${name} (${value}) is outside the ${positive ? '(0, 1]' : '[0, 1]'} canvas-fraction range`)
  }
}

/**
 * Resolve the full render layout for a SegmentTimeline.
 *
 * - The bar is the measured span x0Frac → x1Frac at yFrac, hFrac; segment
 *   shares are normalized to fill it exactly (contiguous, never short).
 * - Ticks hang below the bar at their authored canvas x fractions; the chip
 *   derives from the bar's right end (measured gap, vertically centered) —
 *   position is never authored.
 * - Violations (empty segments, unknown tone, non-positive wFrac, out-of-range
 *   fractions) throw RangeError, never render blank.
 * - Click choreography (native v-clicks): segment i sweeps on click i + 1,
 *   then the labels layer (segment labels, ticks, tick labels, chip) fades in
 *   on one final click — `segments.length + 1` clicks total.
 */
export function segmentTimelineLayout(data: SegmentTimelineData, viewBox: Canvas = { width: 1920, height: 1080 }): SegmentTimelineLayout {
  if (data.segments.length === 0) {
    throw new RangeError('SegmentTimeline needs at least one segment')
  }
  for (const segment of data.segments) {
    if (segment.tone !== 'accent' && segment.tone !== 'alt') {
      throw new RangeError(`segment "${segment.id}" has unknown tone "${String(segment.tone)}"`)
    }
    if (segment.wFrac !== undefined && !(segment.wFrac > 0 && Number.isFinite(segment.wFrac))) {
      throw new RangeError(`segment "${segment.id}" wFrac (${segment.wFrac}) must be a positive finite share`)
    }
  }
  requireFraction(data.x0Frac, 'x0Frac')
  requireFraction(data.x1Frac, 'x1Frac')
  requireFraction(data.yFrac, 'yFrac')
  requireFraction(data.hFrac, 'hFrac', { positive: true })
  if (data.x0Frac >= data.x1Frac) {
    throw new RangeError(`x0Frac (${data.x0Frac}) must be left of x1Frac (${data.x1Frac})`)
  }
  if (data.yFrac + data.hFrac > 1) {
    throw new RangeError(`yFrac + hFrac (${data.yFrac} + ${data.hFrac}) runs past the canvas bottom`)
  }

  const bar: BarLayout = {
    x: data.x0Frac * viewBox.width,
    y: data.yFrac * viewBox.height,
    width: (data.x1Frac - data.x0Frac) * viewBox.width,
    height: data.hFrac * viewBox.height,
  }

  // Proportional shares, normalized to fill the span exactly. Omitted wFrac
  // = one equal share, so `{a: 2}, {b}` splits 2:1.
  const shares = data.segments.map((segment) => segment.wFrac ?? 1)
  const shareSum = shares.reduce((total, share) => total + share, 0)
  let cursor = bar.x
  const segments: SegmentLayout[] = data.segments.map((segment, i) => {
    const width = (shares[i] / shareSum) * bar.width
    const layout: SegmentLayout = {
      id: segment.id,
      tone: segment.tone,
      label: segment.label,
      x: cursor,
      width,
      labelCx: cursor + width / 2,
      labelCy: bar.y + bar.height / 2,
    }
    cursor += width
    return layout
  })

  const tickY0 = bar.y + bar.height + TICK_GAP_FRAC * viewBox.height
  const ticks: TickLayout[] = data.ticks.map((tick) => {
    requireFraction(tick.xFrac, `tick "${tick.label}" xFrac`)
    const x = tick.xFrac * viewBox.width
    const len = TICK_LEN_FRAC * viewBox.height
    return {
      label: tick.label,
      x,
      y0: tickY0,
      len,
      labelX: x,
      labelBaseline: tickY0 + len + TICK_LABEL_GAP_FRAC * viewBox.height,
    }
  })

  const chip: ChipLayout | undefined = data.chip === undefined
    ? undefined
    : {
        x: bar.x + bar.width + CHIP_GAP_FRAC * viewBox.width,
        y: bar.y + bar.height / 2 - (CHIP_H_FRAC * viewBox.height) / 2,
        width: CHIP_W_FRAC * viewBox.width,
        height: CHIP_H_FRAC * viewBox.height,
        text: data.chip,
      }

  return { bar, segments, ticks, chip, viewBox }
}
