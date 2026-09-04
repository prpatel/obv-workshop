/**
 * ColumnRow data contract + pure layout math (diagram-family spec, ColumnRow;
 * wave-2 research art_2kSBGNmJ §3.2, src 223–229s).
 *
 * Five equal tone-coded columns rising bottom→top, with two small text rows
 * below (a dot row and a label row) that arrive late in the reveal, and an
 * optional thin amber underline under a column. The recording's four-column
 * comparison variant (230–237s, blocks with underlines) folds in as seed data:
 * the same layout with fewer columns and `underline: true` per column — no
 * second component.
 *
 * Every position is a fraction of the 1920×1080 stage, so the same numbers
 * serve the deck canvas and any future embed. All functions here are pure and
 * deterministic: same inputs produce equal output, and nothing touches the DOM
 * (SSR-safe build).
 */

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
  /** Short label rendered inside the column. */
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
}

/** A text row below the columns — plain strings, or a tone-tinted label row. */
export type LabelRowInput = string[] | { texts: string[]; tone: 'column' }

/**
 * Measured heading chrome above the field (ref t=229.0, art_iHm120ov
 * §ColumnRow): a 44×45 amber bar-chip and a white icon badge centered over the
 * middle column, above a wide white caption line. Static slide chrome — no
 * click of its own, matching the source recording where the chip and badge are
 * already present when the first column pops.
 */
export interface ColumnRowHeading {
  /** Lucide registry key rendered dark inside the white badge disc. */
  icon: string
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

export interface ColumnRowLayout {
  columns: ColumnRect[]
  labelRows: LabelRowLayout[]
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

  const columns: ColumnRect[] = data.columns.map((col, i) => {
    const x = (COL_X0_FRAC + i * COL_PITCH_X_FRAC) * viewBox.width
    const y = data.yFrac * viewBox.height
    const w = COL_W_FRAC * viewBox.width
    const h = data.hFrac * viewBox.height
    return {
      ...col,
      underline: col.underline ?? false,
      x,
      y,
      w,
      h,
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

  return { columns, labelRows, rail, viewBox }
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
    caption: {
      x: CAPTION_CX_FRAC * viewBox.width,
      y: CAPTION_BASELINE_FRAC * viewBox.height,
      size: CAPTION_SIZE_SOURCE * k,
    },
  }
}
