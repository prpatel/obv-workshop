/**
 * RatioStrip data contract + pure layout math (Wave-2 addendum, spec
 * art_3VsrSvLm; fidelity rework per report art_iHm120ov §RatioStrip — source
 * video 95–101s, settled frame t=99.1s read at 1920×1080).
 *
 * One proportional band with a two-phase build: click 1 pops the band at
 * initial segment proportions; click 2 re-flows the teal region to its
 * settled share in three bursts ~470ms apart (measured 99.10 / 99.57 /
 * 99.83s); click 3 fades in the mint chip and the tone-colored caption row.
 * All clicks are state-driven transitions on revealed-state classes; this
 * module computes the width states, the re-flow burst waypoints, and the
 * re-proportion spans between them.
 *
 * Measured (t=99.1s, 1920×1080): band x276–1648 (14.4–85.9%w), y554–791
 * (238px tall); the red segment x276–609 (334px = 17.4%w) is a red→salmon
 * gradient #ec423f→#f98c8c — the "salmon segment" earlier research read as
 * a separate amber block is this gradient's tail; the teal region x604–1647
 * is a single bright left-to-right gradient #76eec5→#1fd898 (no dark
 * sub-band — that earlier read was a misread tone); the mint chip x605–700
 * (95px) sits at the region's left edge; the caption row of small glyphs
 * sits at y837–857. Above the band: a dark panel plate y331–440 (x234–1685)
 * and a white heading row (~y465–490).
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
   * Settled width fraction after the click-2 re-flow (burst 3). Defaults to
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

/** Measured panel plate above the band (t=99.1s): y331–440, x234–1685. */
export const PLATE_X0_FRAC = 234 / 1920
export const PLATE_X1_FRAC = 1685 / 1920
export const PLATE_Y_FRAC = 331 / 1080
export const PLATE_H_FRAC = 109 / 1080

/** White heading row above the band (t=99.1s): glyph baseline at y490. */
export const HEADING_Y_FRAC = 490 / 1080

/**
 * Measured internals of the teal region (settled frame t=99.1s): the mint
 * label chip 95px wide at the region's LEFT edge, full band height, as a
 * fraction of the 1043px region. Rendered on `tertiary` segments only.
 */
export const CHIP_WFRAC = 95 / 1043 // 0.0910834

/** Measured teal gradient (t=99.1s): bright-mint left edge → the teal token. */
export const TEAL_GRADIENT_START = '#76eec5'

/** Measured red-segment gradient tail (t=99.1s): accentAlt red → salmon. */
export const RED_GRADIENT_END = '#f98c8c'

/**
 * Three-burst teal re-flow (click 2), measured at 99.10 / 99.57 / 99.83s —
 * ~470ms between bursts. BURST_WFRACS are the teal region's intermediate
 * band shares at bursts 1–2 (re-paced waypoints [I]; burst 3 is the
 * segment's settled width). BURST_DELAYS_MS pace the stacked burst rects.
 */
export const BURST_WFRACS: readonly [number, number] = [0.35, 0.55]
export const BURST_DELAYS_MS: readonly [number, number, number] = [0, 470, 730]

/**
 * Stepped px widths for the three-burst re-flow: the two burst waypoints
 * (clamped to the final width) then the settled width — monotonically
 * increasing, last equals `finalW`.
 */
export function tealBurstWidths(bandW: number, finalW: number): [number, number, number] {
  if (!(bandW > 0)) {
    throw new RangeError(`band width ${bandW} must be positive`)
  }
  if (!(finalW > 0)) {
    throw new RangeError(`final width ${finalW} must be positive`)
  }
  const [b1, b2] = BURST_WFRACS
  const w1 = Math.min(b1 * bandW, finalW)
  const w2 = Math.max(w1, Math.min(b2 * bandW, finalW))
  return [w1, w2, finalW]
}

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
  /** Measured panel plate above the band (static chrome layer). */
  plate: { x: number; y: number; w: number; h: number }
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
    plate: {
      x: PLATE_X0_FRAC * viewBox.width,
      y: PLATE_Y_FRAC * viewBox.height,
      w: (PLATE_X1_FRAC - PLATE_X0_FRAC) * viewBox.width,
      h: PLATE_H_FRAC * viewBox.height,
    },
    segments,
    captionY: CAPTION_Y_FRAC * viewBox.height,
    viewBox,
  }
}
