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
 *
 * Fidelity rework (report art_iHm120ov §TwoBarCompare, ref frame t=168.7s
 * read at 1920×1080): the bars already match the source within 1px — bar
 * geometry here is unchanged. What the recording carries around them is
 * Fidelity rework (report art_iHm120ov §TwoBarCompare, ref frame t=168.7s
 * read at 1920×1080): the bars already match the source within 1px — bar
 * geometry here is unchanged. What the recording carries around them is
 * text: a centered white + chrome-green headline row (caps y110–161), the
 * big light-cyan #84eef8 data-text block, ~32px dark on-bar labels, and the
 * teal #1cd797 top-right chip. A second evidence pass (ink census) added
 * the caption/note rows and the two dim divider rules at y722/y970.
 * A third pass (2026-09-04) re-read the annotation layer's STRINGS from the
 * reference frame itself: the wave-2 sheet's headline/annotation strings are
 * spec-derived and appear nowhere in the source recording. The frame reads —
 * title "Is it actually correct?" (white lead + chrome-green tail, measured
 * ink x565–1359), legend "mart_revenue.sql", three ~30px SQL code rows, gray
 * caps "SUGGESTED PIPELINE DESIGN", the teal-marked mint row "backfill the
 * whole table every night", on-bar labels "EVERY CUSTOMER COMES BACK TWICE"
 * / "THIS BACKFILLS THE SAME DAY TWICE", and a teal "GENERATED" chip. All
 * constants below carry the frame's direct measurements. The separate
 * `subhead` prop is gone: the headline row IS the shared TitleChrome band
 * (cap 53, top 98, center x962, condensed to the measured extent).
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
 * The annotation text block — the family's largest text layer (report
 * art_iHm120ov §TwoBarCompare: "the single largest missing element"). Rows
 * are left-anchored on the shared bar anchor; strings come from the ref
 * frame's third-pass read (see module header).
 */
export interface DataTextBlock {
  /** Two code rows at the measured 30px size. */
  lines: [string, string]
  /** Optional third code row (same measured size) in bar 1's chip band. */
  subline?: string
  /** Small dim caps row (~16px cap, baseline y767) between the bars. */
  caption?: string
  /** Mint note row (~21px cap, baseline y827) between the bars, teal-marked. */
  note?: string
  /** Gray caps legend text right of the three tone chips (measured y315 band). */
  legend?: string
  /** Two dim 2px divider rules framing the bar bands (y722/y970 on the ref frame). */
  rules?: boolean
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
  /** The annotation text block above/around the bars (reveals with the annotation click). */
  dataText?: DataTextBlock
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
 * Derived annotation anchors: the on-bar label anchor sits 28px right of the
 * shared bar anchor (ref label ink starts x352 @1080p; the mono left bearing
 * eats ~2px) and under-bar notes hang 14px below their bar.
 */
export const LABEL_INSET_X_FRAC = 28 / 1920
export const SUB_GAP_Y_FRAC = 14 / 720

/**
 * Data-text block, measured from the ref frame t=168.7s at 1920×1080 (report
 * art_iHm120ov §TwoBarCompare): rows are left-anchored on the bar anchor with
 * cap tops y411/485/559 and cap heights ~29/~29/~21px (≈40/40/29px font at
 * the mono stack's 0.73 cap ratio) — baselines y440/514/580.
 */
export const DATA_TEXT_LINE_SIZE = 30
export const DATA_TEXT_SUB_SIZE = 30
/**
 * Baselines y436/509/579: the ref rows' ink bands sit at y411–441/485–514/
 * 549–587 — ascender tops y411/485/549, descender bottoms 441/514/587. The
 * rows' ~17.8–18.1px char advance over 25/55/46 chars gives a ~30px mono
 * size for all three rows (the frame's x-height measure agrees).
 */
export const DATA_TEXT_Y_FRACS: [number, number, number] = [436 / 1080, 509 / 1080, 579 / 1080]
/** The measured light-cyan data-text tone (#84eef8 on the ref frame). */
export const DATA_TEXT_COLOR = '#84eef8'

/**
 * Between-the-bars glyph rows, measured on the ref frame t=168.7s at
 * 1920×1080: a small dim caps row (y752–767, ~16px cap ≈ 22px font,
 * baseline y767) over the mint note row (ink y802–830, ~21px cap ≈ 29px
 * font, baseline y827) — both left-anchored on the shared bar anchor; the
 * mint row is introduced by the teal mark box x324–376.
 */
export const NOTE_SIZE = 29
export const NOTE_Y_FRAC = 827 / 1080
export const CAPTION_SIZE = 22
export const CAPTION_Y_FRAC = 767 / 1080
/** Mint note tone (#a2f9da median) and its teal mark (#24d19a median). */
export const MINT_COLOR = '#a2f9da'
export const MARK_COLOR = '#24d19a'
/** Teal mark ink box ahead of the mint row (measured x324–376, y791–839). */
export const MARK_BOX = { x: 324, y: 791, w: 52, h: 46 } as const
/** On-bar label ink tone (locked mission value; frame median #060203). */
export const LABEL_COLOR = '#0a0a0a'
/**
 * Legend row above the data block (measured ink y315–330): three 15×16
 * chips on a 28px pitch starting x259, then the gray legend text at x368
 * (~13px cap ≈ 19px font, baseline y328). Chip tones are the sheet's
 * measured red/amber/green trio (frame medians #fa5c55/#fab92d/#27c53f).
 */
export const LEGEND_CHIP_W = 15
export const LEGEND_CHIP_H = 16
export const LEGEND_CHIP_Y = 315
export const LEGEND_CHIP_XS = [259, 287, 315] as const
export const LEGEND_CHIP_COLORS = ['#fc5b55', '#fbb72f', '#26c53f'] as const
export const LEGEND_TEXT_X = 368
export const LEGEND_SIZE = 19
export const LEGEND_Y_FRAC = 328 / 1080
export const LEGEND_COLOR = '#a3a3ac'
/**
 * Divider rules framing the two bar bands (ref frame t=168.7s: 2px rows at
 * y722 and y970 spanning x234–1685, measured tone #1e1e20). Their ~5.7k ink
 * px register in the report's census (luminance 30.7 > 24) and structure the
 * composition the way the source does.
 */
export const RULE_X_FRAC = 234 / 1920
export const RULE_W_FRAC = 1451 / 1920
export const RULE_H = 2
export const RULE_Y_FRACS: [number, number] = [722 / 1080, 970 / 1080]
export const RULE_COLOR = '#1e1e20'

/**
 * Full-width dim band above the legend row (measured y276–304, x236–1682;
 * core median #161518 with a soft vertical feather) and the two side rails
 * flanking the lower band (y861–961; direct frame medians over each rail
 * box). Chrome-ambience layers: rendered with the annotation click.
 */
export const TOP_BAND = { x: 236, y: 276, w: 1446, h: 28, fill: '#161518' } as const
export const SIDE_RAILS = [
  { x: 233, y: 861, w: 5, h: 100, fill: '#1c170d' },
  { x: 1682, y: 861, w: 5, h: 100, fill: '#0c0b0f' },
] as const

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

/** One resolved data-text row: left-anchored on the bar anchor. */
export interface DataTextLineLayout {
  text: string
  x: number
  y: number
  size: number
}

/** Resolved geometry of the legend row: three fixed-tone chips + caps text. */
export interface LegendLayout {
  chips: Array<{ x: number; y: number; w: number; h: number; fill: string }>
  text: DataTextLineLayout
}

export interface TwoBarCompareLayout {
  bars: BarLayout[]
  topChip: TopChipLayout
  dataText: DataTextLineLayout[]
  /** Gray legend row above the data block; null when absent. */
  legend: LegendLayout | null
  /** Small dim caption row between the bars; null when absent. */
  caption: DataTextLineLayout | null
  /** Mint note row between the bars; null when absent. */
  note: DataTextLineLayout | null
  /** The two divider rules framing the bar bands (px rects). */
  rules: Array<{ x: number; y: number; w: number; h: number }>
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

  // Data-text rows share the bar anchor; sizes/baselines are measured constants.
  const dataText: DataTextLineLayout[] = []
  if (data.dataText) {
    const sizes = [DATA_TEXT_LINE_SIZE, DATA_TEXT_LINE_SIZE, DATA_TEXT_SUB_SIZE]
    ;[data.dataText.lines[0], data.dataText.lines[1], data.dataText.subline].forEach((text, i) => {
      if (text !== undefined) {
        dataText.push({ text, x: xFrac * viewBox.width, y: DATA_TEXT_Y_FRACS[i] * viewBox.height, size: sizes[i] })
      }
    })
  }

  // Legend row: three fixed-tone chips + gray caps text (ref frame y315 band).
  const legend: LegendLayout | null = data.dataText?.legend
    ? {
        chips: LEGEND_CHIP_XS.map((x, i) => ({
          x,
          y: LEGEND_CHIP_Y,
          w: LEGEND_CHIP_W,
          h: LEGEND_CHIP_H,
          fill: LEGEND_CHIP_COLORS[i],
        })),
        text: { text: data.dataText.legend, x: LEGEND_TEXT_X, y: LEGEND_Y_FRAC * viewBox.height, size: LEGEND_SIZE },
      }
    : null

  // Caption/note share the bar anchor and the data-text block's click.
  const caption = data.dataText?.caption
    ? { text: data.dataText.caption, x: xFrac * viewBox.width, y: CAPTION_Y_FRAC * viewBox.height, size: CAPTION_SIZE }
    : null
  const note = data.dataText?.note
    ? { text: data.dataText.note, x: xFrac * viewBox.width, y: NOTE_Y_FRAC * viewBox.height, size: NOTE_SIZE }
    : null
  const rules = data.dataText?.rules
    ? RULE_Y_FRACS.map((yFrac) => ({
        x: RULE_X_FRAC * viewBox.width,
        y: yFrac * viewBox.height,
        w: RULE_W_FRAC * viewBox.width,
        h: RULE_H,
      }))
    : []

  return { bars, topChip, dataText, legend, caption, note, rules, viewBox }
}
