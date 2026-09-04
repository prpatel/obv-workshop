/**
 * ColumnRow data contract + pure layout math (diagram-family spec, ColumnRow;
 * wave-2 research art_2kSBGNmJ §3.2, src 223–229s; exact-trace rework per
 * sheet art_7yZkdmCE).
 *
 * Two compositions share this contract:
 *
 * - Legacy plain-row composition (the recording's 230–237s four-column
 *   comparison variant): columns with inside labels, an optional thin amber
 *   underline, and dot/tinted text rows below that arrive on one shared click.
 *
 * - Exact-trace composition (the settled ref frame, sheet art_7yZkdmCE):
 *   opaque tone-coded plates carrying centered dark two-digit numerals, the
 *   column label rendered BELOW its plate as hue-matched text (`labelPosition:
 *   'below'` — the sheet's §3 "underline" band y854–868 resolves to glyph
 *   text, not bars: a solid-run census over y815–915 finds zero runs ≥40px,
 *   while the band's glyphs read as the resolved strings), a measured heading
 *   (amber bar-chip + white numeral glyph) landing with the last column's
 *   beat, deferred below-labels for the columns named in `lateLabels`, and an
 *   amber note row on the final beat.
 *
 * Every position is a fraction of the 1920×1080 stage, so the same numbers
 * serve the deck canvas and any future embed. All functions here are pure and
 * deterministic: same inputs produce equal output, and nothing touches the DOM
 * (SSR-safe build).
 */
import { CAP_HEIGHT_RATIO } from './chrome'

/** One tone-coded column. Click order is data order (left → right). */
export interface Column {
  /** Stable key — a11y labels and test selectors. */
  id: string
  /**
   * Palette role resolved against the merged palette: `accent` (house cyan),
   * `alt` (accentAlt override, else the orangeSpine accent), `tertiary`
   * (accentTertiary field, else accent), `status` (the statusAmber accent),
   * `blue` (the measured wave-2 step blue `stepBlue`).
   */
  tone: 'accent' | 'alt' | 'tertiary' | 'status' | 'blue'
  /**
   * Short label. `labelPosition: 'inside'` (default) renders it centered
   * inside the column block in white; `'below'` renders it centered under the
   * plate in the column's tone (the exact-trace measured treatment, sheet
   * art_7yZkdmCE §3).
   */
  label: string
  /** Optional thin amber underline under this column (the measured middle-column mark). */
  underline?: boolean
}

/** Content that travels with the slide as one prop. */
export interface ColumnRowData {
  columns: Column[]
  /** Top edge of every column, as a fraction of stage height (measured 51.4%h). */
  yFrac: number
  /** Column height, as a fraction of stage height (measured 23.3%h). */
  hFrac: number
  /**
   * Optional text rows below the columns. Plain strings render at the legacy
   * row sizing (row 0 the measured dot row, row 1 the label row); a
   * `{ texts, tone: 'column' }` row renders at the measured tinted-label size
   * with every cell filled in its column's tone (the ref t=229.0 label row).
   * Each row must carry exactly one string per column.
   */
  labelRows?: LabelRowInput[]
  /** Measured heading chrome above the field: amber bar-chip, white icon badge, white caption. */
  heading?: ColumnRowHeading
  /**
   * `'inside'` (default) keeps the legacy in-block white label; `'below'`
   * moves the label under the plate as tone-colored text (exact-trace §3:
   * the measured y854–868 band) and drops the in-block label.
   */
  labelPosition?: 'inside' | 'below'
  /**
   * Render centered dark two-digit numerals (`01`…`0n`) inside the plates
   * (exact-trace: the measured y761–784 in-plate band). They ride their
   * column's rise — no click of their own.
   */
  numerals?: boolean
  /**
   * Column indices (0-based, ascending, unique) whose below-labels get their
   * own deferred beat immediately after their column's beat instead of riding
   * it. The exact-trace motion trace measures col-4's label landing between
   * col-4 and col-5 (333–667ms) and col-5's a beat after col-5
   * (3170–3250ms); columns 1–3's label cadence is unrecoverable from the
   * source, so they keep riding their column beats. Only meaningful with
   * `labelPosition: 'below'`.
   */
  lateLabels?: number[]
  /**
   * Centered amber note row under the field (exact-trace §4: the measured
   * y920–943 band). Renders on the final beat, after every label.
   */
  note?: string
}

/** A column with its absolute stage rect resolved. */
export interface ColumnRect extends Omit<Column, 'underline'> {
  x: number
  y: number
  w: number
  h: number
  underline: boolean
  /** Thin amber mark centered under the column, present only when `underline`. */
  underlineRect?: { x: number; y: number; w: number; h: number }
  /** Thin dark plate rim behind the column (the measured outline layer). */
  plate: { x: number; y: number; w: number; h: number }
  /** Centered dark two-digit numeral inside the plate (only with `numerals`). */
  numeral?: { x: number; y: number; size: number; text: string }
}

/** A text row below the columns — plain strings, or a tone-tinted label row. */
export type LabelRowInput = string[] | { texts: string[]; tone: 'column' }

/**
 * Measured heading chrome above the field (ref t=229.0, art_iHm120ov
 * §ColumnRow; exact-trace sheet art_7yZkdmCE §5). Two modes:
 *
 * - `icon`: the wave-2 white badge disc with a dark Lucide glyph inside.
 * - `numeral`: the exact-trace treatment — the badge slot carries a white
 *   display numeral glyph instead (the settled ref reads a `5` at cap ≈89px,
 *   x970–1028 y322–411, centered on the same x999 axis).
 *
 * Either way the chip bars + badge/numeral land with the last column's beat
 * when gated (the exact-trace trace measures chip + numeral + col-5 as one
 * beat); the caption is static slide chrome.
 */
export interface ColumnRowHeading {
  /** Lucide registry key rendered dark inside the white badge disc. */
  icon?: string
  /** White display numeral rendered instead of the icon badge (exact-trace). */
  numeral?: string
  /** White caption line under the chip + badge group. */
  caption: string
}

/** The heading chrome resolved to stage px (see `headingLayout`). */
export interface HeadingLayout {
  /** Amber chip box (the 44×45 measured ornament). */
  chip: { x: number; y: number; w: number; h: number }
  /** The chip's four bars, bottom-aligned on the chip baseline. */
  bars: { x: number; y: number; w: number; h: number }[]
  /** White badge disc (center + radius). */
  badge: { cx: number; cy: number; r: number }
  /** Baseline plate under the chip bars. */
  baseline: { x: number; y: number; w: number; h: number }
  /** White display-numeral slot (badge center, measured baseline/size). */
  numeral: { x: number; y: number; size: number }
  /** Caption anchor: center x, baseline y, font size. */
  caption: { x: number; y: number; size: number }
}

/** One text cell of a label row, centered under its column. */
export interface LabelCell {
  x: number
  text: string
}

/** A text row below the columns at its measured y (px baseline anchor). */
export interface LabelRowLayout {
  y: number
  /** `'column'` → every cell renders in its host column's tone. */
  tone?: 'column'
  cells: LabelCell[]
}

/** A column's below-plate label at its measured baseline (exact-trace §3). */
export interface LabelBelowLayout {
  x: number
  y: number
  size: number
  text: string
  tone: Column['tone']
}

/** The centered amber note row under the field (exact-trace §4). */
export interface NoteLayout {
  x: number
  y: number
  size: number
  text: string
}

export interface ColumnRowLayout {
  columns: ColumnRect[]
  labelRows: LabelRowLayout[]
  /** Below-plate tone labels (exact-trace mode only; empty in the legacy mode). */
  labels: LabelBelowLayout[]
  /** Centered amber note row (only when the data carries `note`). */
  note?: NoteLayout
  viewBox: { width: number; height: number }
  /** Measured base rail under the field — the thin dark line the columns sit on. */
  rail: { x: number; y: number; w: number; h: number }
}

/** Measured default stage (the deck canvas). */
export const MEASURED = { width: 1920, height: 1080 } as const

/**
 * Measured column-row geometry (research art_2kSBGNmJ §3.2; fractions of the
 * 1280×720 source canvas, spec-locked to the brief's percentages).
 */
export const COL_W_FRAC = 0.103 // measured 132px/1280 = 10.3125%w, spec-locked 10.3%w
export const COL_H_FRAC = 0.233 // measured 168px/720 = 23.33%h, spec-locked 23.3%h
export const COL_TOP_Y_FRAC = 0.514 // measured tops y370/720
export const COL_PITCH_X_FRAC = 0.1375 // measured 176px/1280
export const COL_X0_FRAC = 0.173 // measured first column x222/1280

/** Thin amber underline (measured 114×2 @586,538 in the source canvas). */
export const UNDERLINE_W_FRAC = 114 / 1280
export const UNDERLINE_H_FRAC = 2 / 720

/** Measured text-row tops: dot row y569, label row y613 (fractions of 720). */
export const DOT_ROW_Y_FRAC = 569 / 720
export const LABEL_ROW_Y_FRAC = 613 / 720

/**
 * Exact-trace constants (sheet art_7yZkdmCE; measured on the settled ref frame
 * at the native 2560×1440, quoted at the 1080 stage):
 *
 * - Below-plate labels: baseline y868 (band y854–868, cap 13px), centered per
 *   column; font size derives from the shared cap-height ratio.
 * - In-plate numerals: baseline y784 (band y761–784, cap 23px), centered per
 *   column — a fixed fraction of the column height above the block bottom
 *   (22.76 of 251.64 measured px).
 * - Note row: baseline y943 (band y920–943, cap 23px), centered at x958.5
 *   (measured span x619–1298).
 * - Heading numeral: baseline y411 (band y322–411, cap 89px) centered on the
 *   badge axis x999.
 */
export const LABEL_BELOW_BASELINE_FRAC = 868 / 1080
export const NUMERAL_BASELINE_RISE_FRAC = 0.0905
export const NOTE_BASELINE_FRAC = 943 / 1080
export const NOTE_CX_FRAC = 958.5 / 1920
export const HEADING_NUMERAL_BASELINE_FRAC = 411 / 1080
/** Glyph em size from measured cap height via the shared cap-height ratio. */
export function capSize(capPx: number): number {
  return capPx / CAP_HEIGHT_RATIO
}
/** Near-black in-plate numeral fill (measured RGB ≈ 3,4,6). */
export const NUMERAL_FILL = '#030406'
/** Below-label tracking: the measured 'SOFTWARE PRACTICES' span (208px) needs ≈0.05em over the mono advance. */
export const LABEL_BELOW_TRACKING = '0.05em'
/** Note-row tracking: the measured span (x619–1297 = 678px) needs ≈0.017em over the mono advance. */
export const NOTE_TRACKING = '0.017em'
/** Caption tracking: the measured 'TRENDS RESHAPING THE WORK' span (x670–1244) needs ≈0.135em. */
export const CAPTION_TRACKING = '0.135em'

/**
 * Measured heading chrome fractions (ref t=229.0, art_iHm120ov §ColumnRow):
 * 44×45 amber chip at (889,343) — four bars on a baseline — a white badge
 * disc r44 at (999,368), and the caption baseline at y499 over the middle
 * column (x≈959 at the measured geometry).
 */
export const CHIP_FRAC = { x: 889 / 1920, y: 343 / 1080, w: 44 / 1920, h: 45 / 1080 }
export const CHIP_BAR_LEFTS_FRAC = [889, 902, 915.5, 928.5].map((v) => v / 1920)
export const CHIP_BAR_W_FRAC = 4.5 / 1920
export const CHIP_BAR_HEIGHTS_FRAC = [34, 25, 25, 34].map((v) => v / 1080)
export const CHIP_BAR_BOTTOM_FRAC = 385 / 1080
export const BADGE_FRAC = { cx: 999 / 1920, cy: 368 / 1080, r: 44 / 1080 }
export const CAPTION_BASELINE_FRAC = 499 / 1080
export const CAPTION_CX_FRAC = 959.04 / 1920
/** Caption glyphs measured ~23px caps at 1080 → 21px source type (×typeScale). */
export const CAPTION_SIZE_SOURCE = 21
/** Badge icon box measured ~40px at the 1080 stage. */
export const BADGE_ICON_AT_1080 = 40
/** Tinted label row: ~24px glyphs at the 1080 stage (the brief's 24–30px band). */
export const TINTED_LABEL_SIZE_SOURCE = 16
/**
 * Plate rim outset and the field base rail (ref outline census: per-column
 * verticals at every column edge, per-column top rims, and a continuous rail
 * at y809 overhanging the outer columns by ~25px).
 */
export const PLATE_PAD = { x: 3 / 1920, y: 3 / 1080 }
export const RAIL_GAP = 2.25 / 1080
export const RAIL_H_FRAC = 2.5 / 1080
export const RAIL_OVERHANG = 25 / 1920

/**
 * Rise distance for the bottom→top entrance, as a fraction of stage height —
 * hidden columns sit this far below their resting position.
 */
export const RISE_FRAC = 0.03

/** Measured type, rescaled from the 720px source height (VerticalSpine pattern). */
export function typeScale(viewBox: { width: number; height: number } = MEASURED): number {
  return viewBox.height / 720
}

function assertFraction(name: string, value: number, id: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`column "${id}": ${name} must be a finite fraction in [0, 1], received ${value}`)
  }
}

/**
 * Resolve the full render layout for a ColumnRow row.
 *
 * - Column i sits at x = (COL_X0_FRAC + i × COL_PITCH_X_FRAC) × width — the
 *   measured pitch, regardless of the column count; the comparison variant is
 *   the same row with fewer columns.
 * - `yFrac + hFrac` must not push the columns off the canvas; labelRows may
 *   carry at most the two measured rows (dot row, label row) and one string
 *   per column — violations throw RangeError, never render blank.
 */
export function columnRowLayout(
  data: ColumnRowData,
  viewBox: { width: number; height: number } = MEASURED,
): ColumnRowLayout {
  if (data.columns.length === 0) {
    throw new RangeError('ColumnRow needs at least one column')
  }
  assertFraction('yFrac', data.yFrac, data.columns[0].id)
  assertFraction('hFrac', data.hFrac, data.columns[0].id)
  if (data.yFrac + data.hFrac > 1) {
    throw new RangeError(`column "${data.columns[0].id}": yFrac + hFrac must not exceed 1`)
  }
  // Deferred-label indices: ascending, unique, in range — a bad index would
  // otherwise silently strand a label on a non-existent beat.
  const late = data.lateLabels ?? []
  late.forEach((j, k) => {
    if (!Number.isInteger(j) || j < 0 || j >= data.columns.length) {
      throw new RangeError(`lateLabels[${k}] must be a column index in [0, ${data.columns.length - 1}], received ${j}`)
    }
    if (k > 0 && j <= late[k - 1]) {
      throw new RangeError(`lateLabels must be strictly ascending and unique, received [${late.join(', ')}]`)
    }
  })

  const columns: ColumnRect[] = data.columns.map((col, i) => {
    const x = (COL_X0_FRAC + i * COL_PITCH_X_FRAC) * viewBox.width
    const y = data.yFrac * viewBox.height
    const w = COL_W_FRAC * viewBox.width
    const h = data.hFrac * viewBox.height
    const numeralSize = capSize(23) * (viewBox.height / 1080)
    return {
      ...col,
      underline: col.underline ?? false,
      x,
      y,
      w,
      h,
      // Centered dark two-digit numeral riding the plate (exact-trace: the
      // measured y761–784 band sits a fixed fraction above the block bottom).
      numeral: data.numerals
        ? {
            x: x + w / 2,
            y: y + h * (1 - NUMERAL_BASELINE_RISE_FRAC),
            size: numeralSize,
            text: String(i + 1).padStart(2, '0'),
          }
        : undefined,
      // Thin dark plate rim behind the column (the measured outline layer:
      // verticals at every column edge plus top/bottom rims).
      plate: {
        x: x - PLATE_PAD.x * viewBox.width,
        y: y - PLATE_PAD.y * viewBox.height,
        w: w + 2 * PLATE_PAD.x * viewBox.width,
        h: h + 2 * PLATE_PAD.y * viewBox.height,
      },
      // Thin amber mark centered under the column (the measured 0.2%w offset
      // normalizes to center), hanging flush below the column's bottom edge.
      underlineRect: col.underline
        ? {
            x: x + w / 2 - (UNDERLINE_W_FRAC * viewBox.width) / 2,
            y: y + h,
            w: UNDERLINE_W_FRAC * viewBox.width,
            h: UNDERLINE_H_FRAC * viewBox.height,
          }
        : undefined,
    }
  })

  const rows = data.labelRows ?? []
  if (rows.length > 2) {
    throw new RangeError(`ColumnRow supports at most 2 label rows (the measured dot + label rows), received ${rows.length}`)
  }
  const rowYs = [DOT_ROW_Y_FRAC, LABEL_ROW_Y_FRAC]
  const labelRows: LabelRowLayout[] = rows.map((row, r) => {
    const legacy = Array.isArray(row)
    const texts = legacy ? row : row.texts
    const tone = legacy ? undefined : row.tone
    if (texts.length !== data.columns.length) {
      throw new RangeError(`labelRows[${r}] needs one string per column (${data.columns.length}), received ${texts.length}`)
    }
    if (!legacy && tone !== 'column') {
      throw new RangeError(`labelRows[${r}]: the only supported row tone is 'column', received ${String(tone)}`)
    }
    return {
      y: rowYs[r] * viewBox.height,
      tone,
      cells: texts.map((text, i) => ({
        x: (COL_X0_FRAC + i * COL_PITCH_X_FRAC + COL_W_FRAC / 2) * viewBox.width,
        text,
      })),
    }
  })

  // Field base rail: the continuous thin dark line under the columns,
  // overhanging the outer columns by the measured ~25px.
  const fieldLeft = columns[0].x
  const fieldRight = columns[columns.length - 1].x + columns[columns.length - 1].w
  const rail = {
    x: fieldLeft - RAIL_OVERHANG * viewBox.width,
    y: (data.yFrac + data.hFrac) * viewBox.height + RAIL_GAP * viewBox.height,
    w: fieldRight - fieldLeft + 2 * RAIL_OVERHANG * viewBox.width,
    h: RAIL_H_FRAC * viewBox.height,
  }

  // Below-plate tone labels (exact-trace §3): one centered text per column on
  // the measured baseline, filled in the column's tone at render time.
  const labels: LabelBelowLayout[] =
    data.labelPosition === 'below'
      ? columns.map((col) => ({
          x: col.x + col.w / 2,
          y: LABEL_BELOW_BASELINE_FRAC * viewBox.height,
          size: capSize(13) * (viewBox.height / 1080),
          text: col.label,
          tone: col.tone,
        }))
      : []

  // Centered amber note row (exact-trace §4), on its own final beat.
  const note: NoteLayout | undefined = data.note
    ? {
        x: NOTE_CX_FRAC * viewBox.width,
        y: NOTE_BASELINE_FRAC * viewBox.height,
        size: capSize(23) * (viewBox.height / 1080),
        text: data.note,
      }
    : undefined

  return { columns, labelRows, labels, note, rail, viewBox }
}

/**
 * Resolve the click choreography from the data (exact-trace motion order,
 * sheet art_7yZkdmCE §6): columns left→right, each below-label riding its
 * column's beat except the deferred indices in `lateLabels`, which take a
 * private beat immediately after their column; the heading numeral shares the
 * last column's beat (the trace measures chip + numeral + col-5 as one beat);
 * the note row lands on the final beat. Pure and deterministic — the template
 * consumes these numbers and the tests assert the exact ordering.
 */
export interface ColumnRowBeats {
  /** Per-column reveal beat (1-based v-click values, data order). */
  columnClicks: number[]
  /** Per-column below-label beat (rides the column unless deferred). */
  labelClicks: number[]
  /** The heading chip + numeral beat (the last column's beat). */
  headingNumeralClick: number
  /** The note row's beat — the final one when a note is authored. */
  noteClick?: number
  /** Total consumed beats. */
  total: number
}

export function columnRowBeats(data: ColumnRowData): ColumnRowBeats {
  const late = data.lateLabels ?? []
  // A deferred label between columns pushes subsequent columns' beats back by
  // one (col-4's label owns its own beat between col-4 and col-5).
  const columnClicks = data.columns.map((_, i) => 1 + i + late.filter((j) => j < i).length)
  const labelClicks = data.columns.map((_, i) =>
    late.includes(i) ? columnClicks[i] + 1 : columnClicks[i],
  )
  const headingNumeralClick = columnClicks[data.columns.length - 1]
  const last = Math.max(...columnClicks, ...labelClicks)
  const noteClick = data.note === undefined ? undefined : last + 1
  return { columnClicks, labelClicks, headingNumeralClick, noteClick, total: noteClick ?? last }
}

/**
 * Resolve the measured heading chrome to stage px: the amber bar-chip (four
 * bars on a baseline), the white badge disc, and the caption anchor centered
 * over the middle column. Pure and deterministic like the row layout.
 */
export function headingLayout(
  viewBox: { width: number; height: number } = MEASURED,
): HeadingLayout {
  const k = typeScale(viewBox)
  const bars = CHIP_BAR_LEFTS_FRAC.map((leftFrac, i) => {
    const h = CHIP_BAR_HEIGHTS_FRAC[i] * viewBox.height
    return {
      x: leftFrac * viewBox.width,
      y: CHIP_BAR_BOTTOM_FRAC * viewBox.height - h,
      w: CHIP_BAR_W_FRAC * viewBox.width,
      h,
    }
  })
  return {
    chip: {
      x: CHIP_FRAC.x * viewBox.width,
      y: CHIP_FRAC.y * viewBox.height,
      w: CHIP_FRAC.w * viewBox.width,
      h: CHIP_FRAC.h * viewBox.height,
    },
    bars,
    badge: {
      cx: BADGE_FRAC.cx * viewBox.width,
      cy: BADGE_FRAC.cy * viewBox.height,
      r: BADGE_FRAC.r * viewBox.height,
    },
    baseline: {
      x: CHIP_FRAC.x * viewBox.width,
      y: CHIP_BAR_BOTTOM_FRAC * viewBox.height,
      w: CHIP_FRAC.w * viewBox.width,
      h: (3 / 1080) * viewBox.height,
    },
    // White display-numeral slot (exact-trace §5): the badge disc's center
    // axis, with the measured cap-89 glyph's baseline and em size.
    numeral: {
      x: BADGE_FRAC.cx * viewBox.width,
      y: HEADING_NUMERAL_BASELINE_FRAC * viewBox.height,
      size: capSize(89) * (viewBox.height / 1080),
    },
    caption: {
      x: CAPTION_CX_FRAC * viewBox.width,
      y: CAPTION_BASELINE_FRAC * viewBox.height,
      size: CAPTION_SIZE_SOURCE * k,
    },
  }
}
