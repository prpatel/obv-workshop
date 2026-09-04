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
 * text: a centered white + chrome-green headline row (caps y110–161), the
 * big light-cyan #84eef8 data-text block (two ~29px-cap rows y411/485 plus
 * a ~21px row y559, all left-anchored on the bar anchor), ~32px dark on-bar
 * labels over ~28px gray under-bar notes, and the teal #1cd797 top-right
 * chip. Those layers ship as the optional `dataText` / `subhead` props
 * below. A second evidence pass on the same frame (ink census against the
 * ref) added the block's caption/note rows and the two dim full-width
 * divider rules: a ~22px dim caption row (baseline y767), a ~47px white
 * note row (baseline y836), and 2px #1e1e20 rules at y722/y970 spanning
 * x234–1685 — they frame the two bar bands and carry ~5.7k ink px in the
 * ref census.
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
 * The big light-cyan data-text block above the bars — the family's largest
 * text layer (report art_iHm120ov §TwoBarCompare: "the single largest missing
 * element"). All rows are left-anchored on the shared bar anchor.
 */
export interface DataTextBlock {
  /** Two headline rows at the measured ~29px-cap size. */
  lines: [string, string]
  /** Optional smaller third row (~21px cap) in bar 1's chip band. */
  subline?: string
  /** Small dim caption row (~22px, baseline y767) between the bars — the ref frame's y752–767 row. */
  caption?: string
  /** Big white note row (~47px, baseline y836) between the bars — the ref frame's y789–838 heading. */
  note?: string
  /** Two dim 2px divider rules framing the bar bands (y722/y970, x234–1685 on the ref frame). */
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
  /** The big light-cyan data-text block above the bars (reveals with the annotation click). */
  dataText?: DataTextBlock
  /** Centered white headline row under the header band (measured y110–161 composition). */
  subhead?: string
  /** Chrome-green tail rendered after `subhead` (two-tone chrome convention). */
  subheadAccent?: string
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

/**
 * Data-text block, measured from the ref frame t=168.7s at 1920×1080 (report
 * art_iHm120ov §TwoBarCompare): rows are left-anchored on the bar anchor with
 * cap tops y411/485/559 and cap heights ~29/~29/~21px (≈40/40/29px font at
 * the mono stack's 0.73 cap ratio) — baselines y440/514/580.
 */
export const DATA_TEXT_LINE_SIZE = 40
export const DATA_TEXT_SUB_SIZE = 29
export const DATA_TEXT_Y_FRACS: [number, number, number] = [440 / 1080, 514 / 1080, 580 / 1080]
/** The measured light-cyan data-text tone (#84eef8 on the ref frame). */
export const DATA_TEXT_COLOR = '#84eef8'
/**
 * Centered white + chrome-green headline row (ref t=168.7s: caps y110–161 →
 * ~52px cap ≈ 71px font, baseline y161). Chrome, not a palette field — the
 * green half is the deck's CHROME_GREEN.
 */
export const SUBHEAD_SIZE = 71
export const SUBHEAD_Y_FRAC = 161 / 1080

/**
 * Between-the-bars glyph rows, measured on the ref frame t=168.7s at
 * 1920×1080: a small dim caption row (y752–767, ~16px cap ≈ 22px font,
 * baseline y767) over the big white note row (y789–838, ~35px cap ≈ 47px
 * font, baseline y836) — both left-anchored on the shared bar anchor.
 */
export const NOTE_SIZE = 47
export const NOTE_Y_FRAC = 836 / 1080
export const CAPTION_SIZE = 22
export const CAPTION_Y_FRAC = 767 / 1080
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

/** Resolved geometry of the centered headline row (x = canvas mid). */
export interface SubheadLayout {
  x: number
  y: number
  text: string
  accent: string
}

export interface TwoBarCompareLayout {
  bars: BarLayout[]
  topChip: TopChipLayout
  dataText: DataTextLineLayout[]
  /** Small dim caption row between the bars; null when absent. */
  caption: DataTextLineLayout | null
  /** Big white note row between the bars; null when absent. */
  note: DataTextLineLayout | null
  /** The two divider rules framing the bar bands (px rects). */
  rules: Array<{ x: number; y: number; w: number; h: number }>
  subhead: SubheadLayout | null
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

  const subhead: SubheadLayout | null = data.subhead
    ? { x: viewBox.width / 2, y: SUBHEAD_Y_FRAC * viewBox.height, text: data.subhead, accent: data.subheadAccent ?? '' }
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

  return { bars, topChip, dataText, caption, note, rules, subhead, viewBox }
}
