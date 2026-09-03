/**
 * RatioStrip data contract + pure layout math (Wave-2 addendum, spec
 * art_3VsrSvLm; measured blueprint art_2kSBGNmJ §3.3 — source video 95–101s).
 *
 * One proportional band that builds at initial segment proportions (click 1,
 * all segments growing rightward in parallel) and then re-proportions to the
 * settled measured widths (click 2) — a live re-flow. Both clicks are
 * state-driven width transitions on revealed-state classes; this module only
 * computes the two width states and the re-proportion spans between them.
 *
 * Measured on the 1280×720 source frame: band x184–1099 (14.4–85.9%w, 71.5%w
 * wide), y370–528 (21.9%h tall); settled shares red 146px / salmon 92px /
 * teal 696px of the 915px band (16% / 10% / 76%). The teal region carries a
 * mint label chip 80px wide at its left edge and a darker-teal sub-band 298px
 * wide right-aligned; a caption row of small glyphs sits below (y557).
 *
 * Pure and SSR-safe: no DOM access, no mutation of the inputs.
 */

/** Palette role of one strip segment. */
export type StripTone = 'accent' | 'alt' | 'tertiary' | 'plain'

/** One proportional segment of the band. */
export interface StripSegment {
  /** Stable key — Vue keys and test selectors. */
  id: string
  /** Palette role: `accent` | `alt` | `tertiary` fill, or `plain` chrome white. */
  tone: StripTone
  /**
   * Initial width as a fraction of the band (click 1). Values are relative —
   * the layout normalizes whatever the segments sum to, so the band always
   * reads as shares of 100%.
   */
  wFrac: number
  /**
   * Final width fraction after the re-proportion (click 2). Defaults to
   * `wFrac` — a segment without one holds its width through the re-flow.
   */
  wFracFinal?: number
  /** Short label rendered in the caption row under the segment's final left edge. */
  label?: string
}

/** The proportional band: segments, vertical placement, optional caption line. */
export interface RatioStripData {
  segments: StripSegment[]
  /** Band top edge as a fraction of the canvas height (measured 370/720). */
  yFrac: number
  /** Band height as a fraction of the canvas height (measured 158/720). */
  hFrac: number
  /** Optional single caption line at the band's left edge — author labels XOR caption. */
  caption?: string
}

export interface Canvas {
  width: number
  height: number
}

/** Measured band x-extent, fractions of the 1280px source width: x184–1099. */
export const BAND_X0_FRAC = 184 / 1280 // 0.14375
export const BAND_X1_FRAC = 1099 / 1280 // 0.85859375

/** Caption-row baseline (measured glyph row at y557 of the 720px source height). */
export const CAPTION_Y_FRAC = 557 / 720 // 0.773611

/**
 * Measured internals of the teal region (settled frame, §3.3): a mint label
 * chip 80px wide at the region's LEFT edge and a darker-teal sub-band 298px
 * wide RIGHT-aligned — both full band height, as fractions of the 696px
 * region. Rendered on `tertiary` segments only.
 */
export const CHIP_WFRAC = 80 / 696 // 0.114943
export const SUBBAND_WFRAC = 298 / 696 // 0.428161

/** Resolved px geometry for one segment, ready to render. */
export interface StripSegmentLayout {
  id: string
  tone: StripTone
  label?: string
  /** Click-1 state: x is fixed for the life of the segment; w builds 0 → w0. */
  x0: number
  w0: number
  /** Click-2 state: the re-proportion destination (w0 → w1 width transition). */
  x1: number
  w1: number
  /** Re-proportion span, final − initial (asserted in tests; Σdw = 0). */
  dx: number
  dw: number
}

export interface RatioStripLayout {
  band: { x: number; y: number; w: number; h: number }
  segments: StripSegmentLayout[]
  /** Caption-row baseline in viewBox units. */
  captionY: number
  viewBox: Canvas
}

/**
 * Resolve the full render layout for a RatioStrip band.
 *
 * - Segment widths are PROPORTIONS: both states normalize over their own sum,
 *   so the band always reads as shares of 100% — the measured seed fractions
 *   (146/92/696 px of a 915px band) overshoot 1.0 by measurement noise and
 *   normalize cleanly.
 * - Contiguity: each segment starts where the previous one ends, per state.
 *   The final state therefore tiles the band exactly, which is what lets the
 *   component stack a final-state copy over the initial one (the StepFlow
 *   dim-base + stacked-copy pattern) with no residue.
 * - Violations throw RangeError, never render blank.
 */
export function ratioStripLayout(data: RatioStripData, viewBox: Canvas = { width: 1920, height: 1080 }): RatioStripLayout {
  if (data.segments.length === 0) {
    throw new RangeError('RatioStrip needs at least one segment')
  }
  if (!(data.yFrac >= 0 && data.yFrac <= 1)) {
    throw new RangeError(`band yFrac ${data.yFrac} is outside the [0, 1] canvas-fraction range`)
  }
  if (!(data.hFrac > 0 && data.hFrac <= 1) || data.yFrac + data.hFrac > 1) {
    throw new RangeError(`band hFrac ${data.hFrac} must be positive and keep the band inside the canvas`)
  }
  if (data.segments.some((s) => !(s.wFrac > 0))) {
    throw new RangeError('segment wFrac values must be positive')
  }
  const w0Sum = data.segments.reduce((total, s) => total + s.wFrac, 0)

  const finalOf = (s: StripSegment): number => s.wFracFinal ?? s.wFrac
  if (data.segments.some((s) => !(finalOf(s) > 0))) {
    throw new RangeError('segment wFracFinal values must be positive')
  }
  const w1Sum = data.segments.reduce((total, s) => total + finalOf(s), 0)

  const bandX = BAND_X0_FRAC * viewBox.width
  const bandW = (BAND_X1_FRAC - BAND_X0_FRAC) * viewBox.width

  let x0 = bandX
  let x1 = bandX
  const segments = data.segments.map((s) => {
    const w0 = (s.wFrac / w0Sum) * bandW
    const w1 = (finalOf(s) / w1Sum) * bandW
    const seg: StripSegmentLayout = {
      id: s.id,
      tone: s.tone,
      label: s.label,
      x0,
      w0,
      x1,
      w1,
      dx: x1 - x0,
      dw: w1 - w0,
    }
    x0 += w0
    x1 += w1
    return seg
  })

  return {
    band: { x: bandX, y: data.yFrac * viewBox.height, w: bandW, h: data.hFrac * viewBox.height },
    segments,
    captionY: CAPTION_Y_FRAC * viewBox.height,
    viewBox,
  }
}
