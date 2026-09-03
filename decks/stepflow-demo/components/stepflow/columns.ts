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
   * (accentTertiary field, else accent), `status` (the statusAmber accent).
   */
  tone: 'accent' | 'alt' | 'tertiary' | 'status'
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
   * Optional text rows below the columns — row 0 is the measured dot row
   * (tiny white glyphs), row 1 the label row (slightly larger white glyphs).
   * Each row must carry exactly one string per column.
   */
  labelRows?: string[][]
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
}

/** One text cell of a label row, centered under its column. */
export interface LabelCell {
  x: number
  text: string
}

/** A text row below the columns at its measured y (px baseline anchor). */
export interface LabelRowLayout {
  y: number
  cells: LabelCell[]
}

export interface ColumnRowLayout {
  columns: ColumnRect[]
  labelRows: LabelRowLayout[]
  viewBox: { width: number; height: number }
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
    if (row.length !== data.columns.length) {
      throw new RangeError(`labelRows[${r}] needs one string per column (${data.columns.length}), received ${row.length}`)
    }
    return {
      y: rowYs[r] * viewBox.height,
      cells: row.map((text, i) => ({
        x: (COL_X0_FRAC + i * COL_PITCH_X_FRAC + COL_W_FRAC / 2) * viewBox.width,
        text,
      })),
    }
  })

  return { columns, labelRows, viewBox }
}
