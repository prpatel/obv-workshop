/**
 * RatioStrip data contract + pure layout math (Wave-2 addendum, spec
 * art_3VsrSvLm; exact-trace rebuild per sheet art_7bTnqSB3 §RatioStrip —
 * source video 95–101s, settled clip frame t≈5.97s read at 1920×1080).
 *
 * One proportional band with a two-phase build: click 1 pops the band at
 * initial segment proportions; click 2 re-flows the band to its settled
 * three-segment shares in three bursts (measured clip-relative windows
 * 650–1350 / 1783–2133 / 3617–3967ms), then the mint segment settles
 * (4083–4200ms); click 3 reveals the in-band dark display text in two
 * left→right sweeps (4567–4950ms) with the caption row. All clicks are
 * state-driven transitions on revealed-state classes; this module computes
 * the width states, the re-flow burst waypoints, and the re-proportion
 * spans between them.
 *
 * Measured (settled frame, 1920×1080, sheet art_7bTnqSB3 §3.2 + native
 * 2560×1440 pixel reads): band x276–1648 (1372.5px), y555–791 (237px tall);
 * three segments — red gradient x276–605 (330px, 24.0%), solid-mint median
 * #9dfcd7 x605–760 (155px, 11.3%), teal gradient to #1bd69e-class x760–1648
 * (888px, 64.7%). Native reads show the mint→teal fill is ONE continuous
 * ramp (#a0fbd9 → #1ed496 sampled at the region edges, no discontinuity at
 * x760), so the mint and teal segments sample one shared gradient field —
 * the sheet's per-region medians are that ramp's slice medians. Above the
 * band: a dark panel plate y331–469 (x234–1685) with a 13px gray heading
 * row inside, a 16px gray second heading row under it, and a 9-tick
 * measurement row y509–534. In-band dark display text and the red caption
 * row complete the settled frame (constants below).
 *
 * Pure and SSR-safe: no DOM access, no mutation of the inputs.
 */

/** Palette role of one strip segment. */
export type StripTone = 'accent' | 'alt' | 'mint' | 'tertiary' | 'plain'

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

/** Caption-row baseline — measured glyph band y836–858, caps sit on the baseline. */
export const CAPTION_Y_FRAC = 858 / 1080 // 0.794444

/** Caption ink: measured red (sheet #e84442; slide passes it via `caption-color`). */
export const CAPTION_COLOR = '#e84442'

/** Measured panel plate above the band: y331–469 (h139), x234–1685. */
export const PLATE_X0_FRAC = 234 / 1920
export const PLATE_X1_FRAC = 1685 / 1920
export const PLATE_Y_FRAC = 331 / 1080
export const PLATE_H_FRAC = 139 / 1080

/**
 * Plate heading row 1 (inside the plate, sheet §3.2): gray tracked caps,
 * cap ≈13px, mask band y361–384, x259–708. Baseline at the band bottom
 * (chrome convention); cap height → font size via the shared chrome ratio.
 */
export const HEADING1_X_FRAC = 259 / 1920
export const HEADING1_BASELINE_FRAC = 383 / 1080
export const HEADING1_CAP_PX = 13
export const HEADING1_WIDTH_PX = 449

/** Heading row color: measured gray of both heading rows (glyph interiors). */
export const HEADING_COLOR = '#a8a8b8'

/**
 * Heading row 2 (under the plate, sheet §3.2): `COMPUTE UNITS · FY26`,
 * gray caps cap ≈16px, band y465–480, x276–672 (19 glyph components ✅).
 */
export const HEADING2_X_FRAC = 276 / 1920
export const HEADING2_BASELINE_FRAC = 480 / 1080
export const HEADING2_CAP_PX = 16
export const HEADING2_WIDTH_PX = 396

/**
 * Tick measurement row (sheet §3.2): 9 ticks 4×26px, y509–534, #3a3b42.
 * X-centers as measured (the first eight sit on a 171.57px pitch; the
 * ninth reads at 1639 — 13px left of the pitch, reproduced as measured).
 */
export const TICK_X_CENTERS: readonly number[] = [280, 451.6, 623.1, 794.7, 966.3, 1137.9, 1309.4, 1481, 1639]
export const TICK_Y_FRAC = 509 / 1080
export const TICK_W_PX = 4
export const TICK_H_PX = 26
export const TICK_COLOR = '#3a3b42'

/**
 * In-band dark display text (sheet §3.2, digits verified against
 * ratiostrip-band-right): bbox x706–1659, cap band y628–718 (cap ≈90px,
 * ~38% of band height), #0a0a0a bold condensed. Sweep split at x1282 —
 * the measured two-sweep reveal breaks between `·` and the digits.
 */
export const IN_BAND_X_FRAC = 706 / 1920
export const IN_BAND_RIGHT_FRAC = 1659 / 1920
export const IN_BAND_CAP_TOP_PX = 628
export const IN_BAND_CAP_PX = 90
export const IN_BAND_SWEEP_SPLIT_FRAC = 1282 / 1920
export const IN_BAND_COLOR = '#0a0a0a'

/**
 * Shared mint→teal gradient field: ONE continuous ramp across both the
 * mint and teal segments (native reads: #a0fbd9 at the mint's left edge →
 * #1ed496 at the band's right edge, no discontinuity at x760). The field
 * spans the mint segment's final left edge to the band's right edge.
 */
export const BAND_FIELD_START = '#a0fbd9'
export const BAND_FIELD_END = '#1ed496'

/** Measured red-segment gradient tail (t=99.1s): accentAlt red → salmon. */
export const RED_GRADIENT_END = '#f98c8c'

/**
 * Three-burst re-flow (click 2), measured clip-relative windows 650–1350 /
 * 1783–2133 / 3617–3967ms with the click applied at the burst-1 onset:
 * delays 0 / 1133 / 2967ms. BURST_WFRACS are the teal region's intermediate
 * band shares at bursts 1–2 (re-paced waypoints [I]; burst 3 is the
 * segment's settled width). BURST_DELAYS_MS pace the stacked burst rects;
 * the mint segment settles after burst 3 (measured 4083–4200ms → 3433ms).
 */
export const BURST_WFRACS: readonly [number, number] = [0.35, 0.55]
export const BURST_DELAYS_MS: readonly [number, number, number] = [0, 1133, 2967]
export const MINT_SETTLE_DELAY_MS = 3433

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
