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
 * font-size pixel in the rendered 1920×1080 canvas (repo-measured for this
 * font stack — VerticalSpine report §2: "measured cap 8.83%h at ~0.752 glyph
 * ratio"). Font size for a sheet-measured cap height is capHeight / ratio.
 */
export const CAP_HEIGHT_RATIO = 0.752

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
