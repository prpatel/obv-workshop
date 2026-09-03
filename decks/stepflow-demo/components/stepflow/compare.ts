/**
 * TwoBarCompare data contract + pure layout math (diagram-family spec, Wave-2).
 *
 * Two large left-anchored comparison bars — the simplest contract of the wave.
 * Both bars share one left anchor; each carries an icon chip at its left and
 * small glyph rows on/under it; an optional top-right chip floats apart from
 * the bars. Pure and SSR-safe: no DOM access, no mutation of the inputs.
 *
 * Measured from the source recording 161–169s (research art_2kSBGNmJ §3.6,
 * crop twobar.png; 1280×720 pixel basis, fractions = px/1280 across, px/720
 * down): bar 1 red 416×50 @y411, bar 2 amber 440×50 @y582, both anchored at
 * x214 (16.7%w, ending 49.2/51.1%w); icon chips 23×28 @x180 (y363/529); a
 * top-right chip 124×30 @983,202. The recording's palette is the statusAmber
 * preset verbatim — amber #f7ba20 accent, red #e5413f alternate.
 */

/** One comparison bar. Both bars anchor at the shared `xFrac`; length is data. */
export interface CompareBar {
  /** Stable key — authoring reference and test selectors. */
  id: string
  /** Bar length as a fraction of the canvas width (0, 1]. */
  wFrac: number
  /** Palette role: `accent` (amber) or `alt` (red) under the statusAmber preset. */
  tone: 'accent' | 'alt'
  /** Key into the icon registry (`iconPath`); unknown keys render the fallback. */
  icon?: string
  /** Short label rendered ON the bar, inset from its left edge (chrome white). */
  label?: string
  /** One-line dim note rendered UNDER the bar (palette subtext). */
  sub?: string
}

/**
 * The full TwoBarCompare diagram. `xFrac`, `barHFrac`, and `yFracs` default to
 * the measured composition (two bars); other bar counts must pass `yFracs`
 * explicitly — see `twoBarCompareLayout`.
 */
export interface TwoBarCompareData {
  /** The comparison bars, in reveal order. */
  bars: CompareBar[]
  /** Shared left anchor of every bar, canvas width fraction. Default: measured 0.1671875. */
  xFrac?: number
  /** Bar height, canvas height fraction. Default: measured 0.069444… */
  barHFrac?: number
  /** One bar-top y per bar, canvas height fractions. Default: the measured pair. */
  yFracs?: number[]
  /** Optional text for the top-right chip (measured position; reveals with the annotation click). */
  chip?: string
}

export interface Canvas {
  width: number
  height: number
}

/**
 * Measured geometry, recording 161–169s (fractions; px sources on the
 * 1280×720 measurement basis). The two gaps calibrate bar 1's chip — the
 * cleaner of the two chip measures (bar 2's reads 22×28 @y529, within a few
 * source px of the same derivation).
 */
export const BAR_X_FRAC = 214 / 1280 // both bars left-anchored at 16.7%w
export const BAR_H_FRAC = 50 / 720 // bar height 5/72 of the canvas
/** The measured two-bar tops: y411 (57.08%h) and y582 (80.83%h). */
export const MEASURED_Y_FRACS: [number, number] = [411 / 720, 582 / 720]
export const CHIP_W_FRAC = 23 / 1280
export const CHIP_H_FRAC = 28 / 720
export const CHIP_GAP_X_FRAC = 11 / 1280 // chip right edge → bar left edge
export const CHIP_GAP_Y_FRAC = 20 / 720 // chip bottom → bar top
/** Top-right chip, measured 124×30 @983,202. */
export const TOP_CHIP_X_FRAC = 983 / 1280
export const TOP_CHIP_Y_FRAC = 202 / 720
export const TOP_CHIP_W_FRAC = 124 / 1280
export const TOP_CHIP_H_FRAC = 30 / 720
/**
 * Derived annotation anchors (crop-calibrated, not pixel-measured — the
 * glyph rows sit below single-glyph resolution): the on-bar label inset and
 * the bar-bottom → under-bar gap.
 */
export const LABEL_INSET_X_FRAC = 24 / 1280
export const SUB_GAP_Y_FRAC = 14 / 720

/** Resolved px geometry for one bar and its derived chip/label anchors. */
export interface BarLayout {
  id: string
  tone: CompareBar['tone']
  icon?: string
  label?: string
  sub?: string
  /** Bar rect, px. */
  x: number
  y: number
  w: number
  h: number
  /** Icon chip hung at the bar's upper left; null when the bar has no icon. */
  chip: { x: number; y: number; w: number; h: number; cx: number; cy: number } | null
  /** On-bar label anchor (left-inset, vertically centered), px. */
  labelX: number
  labelY: number
  /** Under-bar note anchor (aligned with the bar's left edge), px. */
  subX: number
  subY: number
}

/** Resolved px geometry of the top-right chip. */
export interface TopChipLayout {
  x: number
  y: number
  w: number
  h: number
}

export interface TwoBarCompareLayout {
  bars: BarLayout[]
  topChip: TopChipLayout
  viewBox: Canvas
}

/** Validate one canvas fraction; a typo like `12.0` throws instead of exploding the layout. */
function requireFrac(name: string, value: number): void {
  if (!(value >= 0 && value <= 1)) {
    throw new RangeError(`${name} (${value}) is outside the [0, 1] canvas-fraction range`)
  }
}

/**
 * Resolve the full render layout for a TwoBarCompare diagram.
 *
 * - Defaults reproduce the measured two-bar composition: shared anchor
 *   `BAR_X_FRAC`, height `BAR_H_FRAC`, tops `MEASURED_Y_FRACS`. A different
 *   bar count must pass `yFracs` (one per bar) — violations throw
 *   RangeError, never render blank.
 * - The icon chip derives from its bar: right edge `CHIP_GAP_X_FRAC` left of
 *   the bar, bottom `CHIP_GAP_Y_FRAC` above the bar top; bars without an
 *   icon get no chip.
 * - Click choreography (native v-clicks): bar i is click i + 1 (pops whole —
 *   bar + its icon chip), then one shared annotation click for the glyph
 *   rows and the top-right chip.
 */
export function twoBarCompareLayout(data: TwoBarCompareData, viewBox: Canvas = { width: 1920, height: 1080 }): TwoBarCompareLayout {
  if (data.bars.length === 0) {
    throw new RangeError('TwoBarCompare needs at least one bar')
  }

  const xFrac = data.xFrac ?? BAR_X_FRAC
  const barHFrac = data.barHFrac ?? BAR_H_FRAC
  const yFracs = data.yFracs ?? (data.bars.length === 2 ? MEASURED_Y_FRACS : undefined)
  if (!yFracs) {
    throw new RangeError(`yFracs is required for a ${data.bars.length}-bar composition (the measured default covers exactly two bars)`)
  }
  if (yFracs.length !== data.bars.length) {
    throw new RangeError(`yFracs has ${yFracs.length} entries for ${data.bars.length} bars — one bar-top per bar is required`)
  }

  requireFrac('xFrac', xFrac)
  requireFrac('barHFrac', barHFrac)
  if (barHFrac <= 0) {
    throw new RangeError(`barHFrac (${barHFrac}) must be positive`)
  }

  const bars: BarLayout[] = data.bars.map((bar, i) => {
    requireFrac(`bar "${bar.id}" wFrac`, bar.wFrac)
    requireFrac(`bar "${bar.id}" yFrac`, yFracs[i])
    if (bar.wFrac <= 0) {
      throw new RangeError(`bar "${bar.id}" wFrac (${bar.wFrac}) must be positive`)
    }

    const x = xFrac * viewBox.width
    const y = yFracs[i] * viewBox.height
    const w = bar.wFrac * viewBox.width
    const h = barHFrac * viewBox.height

    // Chip hangs at the bar's upper left; only when the bar carries an icon.
    const chip = bar.icon
      ? {
          x: (xFrac - CHIP_GAP_X_FRAC - CHIP_W_FRAC) * viewBox.width,
          y: (yFracs[i] - CHIP_GAP_Y_FRAC - CHIP_H_FRAC) * viewBox.height,
          w: CHIP_W_FRAC * viewBox.width,
          h: CHIP_H_FRAC * viewBox.height,
          cx: (xFrac - CHIP_GAP_X_FRAC - CHIP_W_FRAC / 2) * viewBox.width,
          cy: (yFracs[i] - CHIP_GAP_Y_FRAC - CHIP_H_FRAC / 2) * viewBox.height,
        }
      : null

    return {
      id: bar.id,
      tone: bar.tone,
      icon: bar.icon,
      label: bar.label,
      sub: bar.sub,
      x,
      y,
      w,
      h,
      chip,
      labelX: (xFrac + LABEL_INSET_X_FRAC) * viewBox.width,
      labelY: y + h / 2,
      subX: x,
      subY: y + h + SUB_GAP_Y_FRAC * viewBox.height,
    }
  })

  const topChip: TopChipLayout = {
    x: TOP_CHIP_X_FRAC * viewBox.width,
    y: TOP_CHIP_Y_FRAC * viewBox.height,
    w: TOP_CHIP_W_FRAC * viewBox.width,
    h: TOP_CHIP_H_FRAC * viewBox.height,
  }

  return { bars, topChip, viewBox }
}
