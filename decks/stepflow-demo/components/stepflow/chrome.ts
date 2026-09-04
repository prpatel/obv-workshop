// Shared title-chrome geometry — the exact-trace sheets' consensus treatment:
// every family slide opens with a centered two-tone display title (white lead,
// chrome-green tail) in the reference title band, and the six families whose
// sheets document it carry the recording's top-right green pill.
//
// All numbers are 1920×1080 canvas pixels. The per-family values live with the
// family components (each sheet's Title row is authoritative); this module owns
// only the constants and the pure math so the mapping cap height → font size is
// testable in one place.

/** Chrome green of the two-tone headers — a convention constant, never a
 * palette field. Measured `#66fc00`-class across all sheets (wave-1 reads
 * `#66fb00`, wave-2 `#66fb00`/`#68f808`, team-D `#65fb00`); the deck's locked
 * convention constant is `#66fb00`. */
export const CHROME_GREEN = '#66fb00'

/** White lead of the two-tone headers (chrome white, not a palette role). */
export const TITLE_WHITE = '#ffffff'

/**
 * Measured glyph cap-height ratio of the deck's mono face: cap pixels per
 * font-size pixel. JetBrains Mono's true cap ratio is 0.730 (cap height
 * 0.730em); the deck previously used 0.752, measured off the pre-bundle
 * fallback rendering. All generation-7 cap constants are glyph-core reads
 * (per-column stem histograms on the settled reference frames), so they pair
 * with THIS ratio now that the bundled face actually renders.
 */
export const CAP_HEIGHT_RATIO = 0.730

/** Font size that renders `capHeight` cap pixels in the 1080 canvas. */
export function titleFontSize(capHeight: number): number {
  if (!(capHeight > 0)) throw new RangeError(`capHeight must be positive, received ${capHeight}`)
  return capHeight / CAP_HEIGHT_RATIO
}

/**
 * Baseline y for a title whose cap band starts at `capTop`: capitals sit on
 * the baseline, so the band bottom is the baseline (wave-2 sheets' "band
 * y98–176 with cap 78" and team-D's "cap top + cap height" both agree).
 */
export function titleBaseline(capTop: number, capHeight: number): number {
  if (!(capHeight > 0)) throw new RangeError(`capHeight must be positive, received ${capHeight}`)
  if (capTop < 0) throw new RangeError(`capTop must be >= 0, received ${capTop}`)
  return capTop + capHeight
}

/**
 * Measured x-height ratio of the deck's mono face: x-height pixels per
 * font-size pixel. Lowercase-only title runs (VerticalSpine's white tail is
 * specified as an x-height band, not a cap) are sized through this ratio —
 * cap equivalence is then xHeight / X_HEIGHT_RATIO × CAP_HEIGHT_RATIO.
 * JetBrains Mono's x-height ≈ 0.55em; validated against the settled v7 frame
 * in the VerticalSpine fidelity loop.
 */
export const X_HEIGHT_RATIO = 0.55

/** Font size that renders `xHeight` x-height pixels in the 1080 canvas. */
export function titleFontSizeFromXHeight(xHeight: number): number {
  if (!(xHeight > 0)) throw new RangeError(`xHeight must be positive, received ${xHeight}`)
  return xHeight / X_HEIGHT_RATIO
}

/**
 * JetBrains Mono advance width: 0.600em per character (monospace). Natural
 * ink runs are predicted from this plus the bearing constant below.
 */
export const ADVANCE_RATIO = 0.6

/**
 * Combined left+right side bearing of a mono ink run, in em. Calibrated
 * against the reference frames (StairChain "THE DATA": predicted 449px at
 * cap 68.8 vs 426.7px measured — the recorded face is slightly more
 * condensed than JBM, which the per-run pin logic absorbs).
 */
export const INK_BEARING_EM = 0.04

/**
 * Natural ink extent of a mono text run at the given font size, in px:
 * n×advance minus the run's side bearings. Letter-spacing is NOT included —
 * add (n−1)×letterSpacing×fontSize when tracking is applied.
 */
export function naturalInkExtent(text: string, fontSize: number): number {
  if (text.length === 0) return 0
  return text.length * ADVANCE_RATIO * fontSize - INK_BEARING_EM * fontSize
}

/**
 * Pin threshold (fraction of the measured extent) below which a run renders
 * at natural width: the deck renders JetBrains Mono natural and only pins
 * spacing when the recorded face is more than 2% off — never the
 * glyph-squeezing mode (glyphs must never squeeze).
 */
export const PIN_THRESHOLD = 0.02

/**
 * Whether a run needs a spacing-only textLength pin: |natural − measured|
 * exceeds `threshold × measured`. Returns the pin value (the measured
 * extent) or undefined for a natural render.
 */
export function spacingPin(
  natural: number,
  measured: number,
  threshold: number = PIN_THRESHOLD,
): number | undefined {
  if (measured <= 0) return undefined
  return Math.abs(natural - measured) > threshold * measured ? measured : undefined
}

/**
 * Letter-spacing (em) that stretches or condenses a natural run to a
 * measured ink extent: (measured − natural) / ((n−1) × fontSize). Runs
 * within the pin threshold should NOT use this — they render natural.
 */
export function trackingForExtent(
  text: string,
  fontSize: number,
  measured: number,
): number {
  if (text.length < 2) return 0
  const natural = naturalInkExtent(text, fontSize)
  return (measured - natural) / ((text.length - 1) * fontSize)
}

/**
 * Resolve a run's pin in one call: the measured extent when the natural
 * width misses it beyond the pin threshold, undefined for a natural render.
 * `measured == null` (no sheet extent) always renders natural.
 */
export function inkPin(
  text: string,
  fontSize: number,
  measured?: number,
): number | undefined {
  if (measured == null) return undefined
  return spacingPin(naturalInkExtent(text, fontSize), measured)
}
/**
 * Template-ready pin attributes for a measured text run: spread with
 * `v-bind="pinAttrs(text, fontSize, measured)"`. Empty object = natural
 * render; otherwise spacing-only textLength + lengthAdjust.
 */
export function pinAttrs(
  text: string,
  fontSize: number,
  measured?: number,
): { textLength?: number; lengthAdjust?: 'spacing' } {
  const pin = inkPin(text, fontSize, measured)
  return pin === undefined ? {} : { textLength: pin, lengthAdjust: 'spacing' }
}


/**
 * One measured token of a family title. Exact-trace sheets sometimes pin each
 * token's ink extent individually — the recordings set a condensed mono face,
 * so a family header may need per-token position, width, and even size
 * (VerticalSpine's green lead runs a taller cap on a lower baseline than its
 * white tail). Each token renders as its own condensate-fitted <text>:
 * `width` is the sheet-measured ink run, applied via textLength.
 */
export interface TitleToken {
  text: string
  /** Left edge of the token's ink run, 1920×1080 canvas px. */
  x: number
  /** Measured ink-run width the token is condensed to, canvas px. */
  width: number
  /** Render in chrome green instead of white. */
  accent?: boolean
  /** Per-token cap height; defaults to the chrome's `capHeight`. */
  capHeight?: number
  /** Per-token cap-band top; defaults to the chrome's `capTop`. */
  capTop?: number
}

/**
 * The recordings' top-right badge: a small green pill rendered by the six
 * families whose exact-trace sheets document it (TileGrid, RatioStrip,
 * TwoBarCompare, MilestoneLanes, SegmentTimeline, ColumnRow). Measured
 * x1850–1901, y19–61 at 1920×1080 (team-D sheets; wave-2 reads
 * (1850,21)–(1900,59) — the union box is used). Fill is the sheet's
 * `#7ca424`-class pill green; the glyph inside is not resolvable at 1080p, so
 * the pill renders solid.
 */
export const TOP_RIGHT_BADGE = {
  x: 1850,
  y: 19,
  width: 51,
  height: 42,
  fill: '#7ca424',
} as const
