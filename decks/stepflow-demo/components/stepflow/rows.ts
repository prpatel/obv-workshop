/**
 * SchematicRows data contract + pure layout math (diagram-family spec, SchematicRows).
 *
 * A terminal-style token listing: mono rows of colored tokens with an optional
 * embedded thin-line schematic and an optional dim highlight band behind one
 * row. Rows render as HTML — token `<span>`s inside v-click'd row divs, one
 * click per row (SVG text makes per-token coloring awkward); schematic lines
 * are SVG polylines drawn with the StepFlow dim-base + stacked accent-copy
 * dashoffset draw, each within its attached row's click; the band fades in on
 * its row's click. Pure and SSR-safe: no DOM access, no mutation of the inputs.
 *
 * Measured from the v6 recording (research art_0AzKGXnD §F5, re-measured this
 * session against the settled frame at t≈13.5s): 8 body rows at a ~5.8%h
 * pitch, first row top ≈31.5%h, code margin ≈6.5%w, one indent step ≈4.1%w,
 * glyph size ≈2.5%h. The recording's continuous auto-run (a typing effect) is
 * re-paced to one click per row — the locked deviation; no typewriter is
 * built. Tone roles map to palette fields, except `plain` (chrome white
 * #f5f4f7) and `chrome` (terminal green #66fb00) — both constants of the tone
 * convention, resolved in the component, never palette fields.
 *
 * Wave-1 fidelity rework (report art_v4jVdTnp §5): the demo seed grows to ten
 * 60–110-char rows spanning ~94% of the canvas width with token tones weighted
 * white > green > amber > blue (measured t=14.1 masses 42,920 / 14,008 / 8,419
 * / 3,210 px), and the band prop carries the recording's one dim highlight
 * band behind a middle row.
 */

import { polylineLength, polylinePath } from './paths'

/** Tone of one row token. `accent`/`alt` map to palette fields; `plain` (chrome white) and `chrome` (terminal green) are constants. */
export type RowTokenTone = 'accent' | 'alt' | 'plain' | 'chrome'

/** One colored token of a row's text stream. Whitespace inside `text` is preserved (mono, `white-space: pre`). */
export interface RowToken {
  text: string
  tone: RowTokenTone
}

/** One mono row of the listing: a stable id, an optional indent level, and its tokens. */
export interface CodeRow {
  /** Stable key — schematic line attachment and test selectors. */
  id: string
  /** Indent steps (each ~4.1%w); 0 aligns to the measured code margin. Default 0. */
  indent?: number
  tokens: RowToken[]
}

/** Tone of a schematic stroke: `accent` (cool) or `plain` (chrome white). */
export type SchematicLineTone = 'accent' | 'plain'

/**
 * One dim-tinted highlight band behind a row — the recording's "current line"
 * (wave-1 ref t=14.1). The band shares its row's click: same 150ms fade,
 * instant backward snap.
 */
export interface HighlightSpec {
  /** Id of the row (`CodeRow.id`) the band sits behind; the band shares its click. */
  row: string
  /** Band rect as canvas fractions — defaults are the measured t=14.1 band. */
  xFrac?: number
  wFrac?: number
  hFrac?: number
}

/**
 * A thin polyline of the embedded schematic, as canvas fractions. It draws on
 * its attached row's click — `attach` names the row id; when omitted, lines
 * distribute in order over the LAST rows of the listing (the measured
 * schematic belongs to the listing's closing rows).
 */
export interface SchematicLine {
  /** Polyline vertices as canvas fractions, first → last (≥ 2 points). */
  points: [number, number][]
  tone: SchematicLineTone
  /** Id of the row (`CodeRow.id`) whose click carries this line's draw. */
  attach?: string
}

/** The full SchematicRows diagram: token rows plus the optional schematic. */
export interface SchematicRowsData {
  rows: CodeRow[]
  schematic?: SchematicLine[]
  /** Optional dim band behind one row (the recording's "current line"). */
  highlight?: HighlightSpec
}

export interface Canvas {
  width: number
  height: number
}

/** Measured listing geometry, v6 recording (fractions of the 1920×1080 canvas). */
export const ROW_PITCH_FRAC = 0.058 // row pitch ≈ 66px on the 1144-tall source (5.8%h)
export const FIRST_ROW_Y_FRAC = 0.315 // first body row top ≈ y360 of 1144
export const LEFT_FRAC = 0.065 // code margin ≈ x132 of 2038
export const INDENT_FRAC = 0.041 // one indent step ≈ 83px of 2038
export const ROW_FONT_FRAC = 0.025 // mono glyph size ≈ 27px at 1080

/** Measured highlight band, wave-1 ref t=14.1 (x 54/2038, w 1210/2038, h 59/1144). */
export const BAND_X_FRAC = 0.0265
export const BAND_W_FRAC = 0.5937
export const BAND_H_FRAC = 0.052

/** Resolved px geometry for one row, ready to render. */
export interface RowLayout {
  id: string
  /** Left edge of the row's first token, px. */
  x: number
  /** Top edge of the row (rendered with line-height 1), px. */
  y: number
  indent: number
  tokens: RowToken[]
}

/** Resolved px geometry for one schematic line, ready to render. */
export interface LineLayout {
  d: string
  /** Analytic length — the dashoffset draw distance (`--sf-drawn`). */
  length: number
  tone: SchematicLineTone
  /** 0-based index of the row whose v-click carries this line's draw. */
  atIndex: number
}

/** Resolved px geometry for the highlight band, ready to render. */
export interface HighlightLayout {
  x: number
  y: number
  width: number
  height: number
  /** 0-based index of the row whose v-click carries the band's fade. */
  atIndex: number
}

export interface SchematicRowsLayout {
  rows: RowLayout[]
  schematic: LineLayout[]
  /** Resolved band rect, or null when no `highlight` was given. */
  highlight: HighlightLayout | null
  viewBox: Canvas
}

/**
 * Resolve the highlight band rect: centered on the attached row's glyph box
 * (glyph height = ROW_FONT_FRAC × height), x/width/height from the measured
 * t=14.1 defaults unless overridden. Unknown row ids and out-of-range fracs
 * throw RangeError — the same contract as schematic `attach`.
 */
function resolveHighlight(spec: HighlightSpec, rows: RowLayout[], viewBox: Canvas): HighlightLayout {
  const atIndex = rows.findIndex((row) => row.id === spec.row)
  if (atIndex === -1) {
    throw new RangeError(`highlight band references unknown row "${spec.row}"`)
  }
  const xFrac = spec.xFrac ?? BAND_X_FRAC
  const wFrac = spec.wFrac ?? BAND_W_FRAC
  const hFrac = spec.hFrac ?? BAND_H_FRAC
  for (const [name, value] of [['x', xFrac], ['w', wFrac], ['h', hFrac]] as const) {
    if (!(value >= 0 && value <= 1)) {
      throw new RangeError(`highlight band ${name}Frac (${value}) is outside the [0, 1] canvas-fraction range`)
    }
  }
  const glyphHeight = ROW_FONT_FRAC * viewBox.height
  const height = hFrac * viewBox.height
  return {
    x: xFrac * viewBox.width,
    y: rows[atIndex].y + (glyphHeight - height) / 2,
    width: wFrac * viewBox.width,
    height,
    atIndex,
  }
}

/**
 * Convert canvas-fraction line points to absolute px in the given viewBox.
 * Pure; validates the fraction range so a typo like `12.0` throws instead of
 * silently exploding the layout.
 */
function linePoints(points: [number, number][], viewBox: Canvas): [number, number][] {
  if (points.length < 2) {
    throw new RangeError(`schematic line needs at least 2 points, got ${points.length}`)
  }
  return points.map(([xFrac, yFrac]) => {
    if (!(xFrac >= 0 && xFrac <= 1) || !(yFrac >= 0 && yFrac <= 1)) {
      throw new RangeError(`schematic line point (${xFrac}, ${yFrac}) is outside the [0, 1] canvas-fraction range`)
    }
    return [xFrac * viewBox.width, yFrac * viewBox.height] as [number, number]
  })
}

/**
 * Resolve the full render layout for a SchematicRows diagram.
 *
 * - Row i sits at top `(FIRST_ROW_Y_FRAC + i × ROW_PITCH_FRAC) × height`,
 *   left `(LEFT_FRAC + indent × INDENT_FRAC) × width` — a uniform grid; the
 *   blueprint's "lineHeightFrac constant only" layout.
 * - Schematic lines must reference known row ids when `attach` is set and
 *   keep their points inside the canvas — violations throw RangeError, never
 *   render blank. Lines without `attach` bind to the last rows in order
 *   (clamped into the listing when there are more lines than rows).
 * - Click choreography (native v-clicks): row i is click i + 1; a schematic
 *   line shares its attached row's click — no line ever adds a click.
 */
export function schematicRowsLayout(data: SchematicRowsData, viewBox: Canvas = { width: 1920, height: 1080 }): SchematicRowsLayout {
  if (data.rows.length === 0) {
    throw new RangeError('SchematicRows needs at least one row')
  }

  const rows: RowLayout[] = data.rows.map((row, i) => {
    const indent = row.indent ?? 0
    return {
      id: row.id,
      x: (LEFT_FRAC + indent * INDENT_FRAC) * viewBox.width,
      y: (FIRST_ROW_Y_FRAC + i * ROW_PITCH_FRAC) * viewBox.height,
      indent,
      tokens: row.tokens,
    }
  })

  const schematic = data.schematic ?? []
  const schematicLayout: LineLayout[] = schematic.map((line, k) => {
    const fallback = Math.max(0, Math.min(rows.length - schematic.length + k, rows.length - 1))
    let atIndex = fallback
    if (line.attach !== undefined) {
      const found = rows.findIndex((row) => row.id === line.attach)
      if (found === -1) {
        throw new RangeError(`schematic line references unknown row "${line.attach}"`)
      }
      atIndex = found
    }
    const pts = linePoints(line.points, viewBox)
    return { d: polylinePath(pts), length: polylineLength(pts), tone: line.tone, atIndex }
  })

  const highlight = data.highlight ? resolveHighlight(data.highlight, rows, viewBox) : null

  return { rows, schematic: schematicLayout, highlight, viewBox }
}
