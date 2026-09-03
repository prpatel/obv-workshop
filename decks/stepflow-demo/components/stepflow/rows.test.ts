import { describe, expect, it } from 'vitest'
import {
  schematicRowsLayout,
  ROW_PITCH_FRAC,
  FIRST_ROW_Y_FRAC,
  LEFT_FRAC,
  INDENT_FRAC,
  ROW_FONT_FRAC,
  type CodeRow,
  type SchematicLine,
} from './rows'

/** Minimal row fixture: one plain token per row. */
function row(id: string, indent = 0): CodeRow {
  return { id, indent, tokens: [{ text: id, tone: 'plain' }] }
}

describe('measured constants', () => {
  it('exposes the v6 fractions', () => {
    expect(ROW_PITCH_FRAC).toBe(0.058)
    expect(FIRST_ROW_Y_FRAC).toBe(0.315)
    expect(LEFT_FRAC).toBe(0.065)
    expect(INDENT_FRAC).toBe(0.041)
    expect(ROW_FONT_FRAC).toBe(0.025)
  })
})

describe('schematicRowsLayout — row grid, hand-computed px', () => {
  const rows = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => row(id))

  it('places the demo-count grid at the measured pitch', () => {
    const l = schematicRowsLayout({ rows })
    expect(l.rows).toHaveLength(8)
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
    // (0.315 + i × 0.058) × 1080 — row 0 and row 7 hand-computed:
    expect(l.rows[0].y).toBeCloseTo(340.2, 6)
    expect(l.rows[7].y).toBeCloseTo(778.68, 6)
    // pitch is exact: 0.058 × 1080
    expect(l.rows[1].y - l.rows[0].y).toBeCloseTo(62.64, 6)
    expect(l.rows[4].y).toBeCloseTo(340.2 + 4 * 62.64, 6)
  })

  it('aligns rows to the code margin plus measured indent steps', () => {
    const l = schematicRowsLayout({ rows: [row('x0'), row('x1', 1), row('x3', 3)] })
    // (0.065 + indent × 0.041) × 1920
    expect(l.rows[0].x).toBeCloseTo(124.8, 6)
    expect(l.rows[1].x).toBeCloseTo(203.52, 6)
    expect(l.rows[2].x).toBeCloseTo(360.96, 6)
    expect(l.rows[0].indent).toBe(0)
    expect(l.rows[2].indent).toBe(3)
  })

  it('defaults a missing indent to 0', () => {
    const l = schematicRowsLayout({ rows: [{ id: 'bare', tokens: [{ text: 'x', tone: 'plain' }] }] })
    expect(l.rows[0].indent).toBe(0)
    expect(l.rows[0].x).toBeCloseTo(124.8, 6)
  })

  it('carries the measured font size and passes tokens through verbatim', () => {
    const tokens: CodeRow['tokens'] = [
      { text: 'def ', tone: 'accent' },
      { text: 'x', tone: 'plain' },
    ]
    const l = schematicRowsLayout({ rows: [{ id: 'r', tokens }] })
    expect(l.rows[0].tokens).toBe(tokens)
    expect(l.rows[0].y + 0).toBeCloseTo(0.315 * 1080, 6)
    expect(ROW_FONT_FRAC * l.viewBox.height).toBeCloseTo(27, 6)
  })

  it('handles an off-nominal count (3 rows) and a custom viewBox', () => {
    const l = schematicRowsLayout({ rows: [row('a'), row('b'), row('c')] }, { width: 960, height: 540 })
    expect(l.rows).toHaveLength(3)
    // (0.315 + 0.058) × 540
    expect(l.rows[1].y).toBeCloseTo(201.42, 6)
    expect(l.rows[0].x).toBeCloseTo(0.065 * 960, 6)
  })

  it('is deterministic for the same inputs', () => {
    expect(JSON.stringify(schematicRowsLayout({ rows })))
      .toBe(JSON.stringify(schematicRowsLayout({ rows })))
  })
})

describe('schematicRowsLayout — schematic lines, hand-computed lengths', () => {
  it('resolves an L-shaped line exactly: d, and length 192 + 216 = 408', () => {
    const lines: SchematicLine[] = [{ points: [[0.1, 0.5], [0.2, 0.5], [0.2, 0.7]], tone: 'accent' }]
    const l = schematicRowsLayout({ rows: [row('a')], schematic: lines })
    expect(l.schematic[0].d).toBe('M 192 540 L 384 540 L 384 756')
    expect(l.schematic[0].length).toBeCloseTo(408, 6)
    expect(l.schematic[0].tone).toBe('accent')
  })

  it('scales with the viewBox: the same fractions at half size are half as long', () => {
    const lines: SchematicLine[] = [{ points: [[0.1, 0.5], [0.2, 0.5], [0.2, 0.7]], tone: 'accent' }]
    const l = schematicRowsLayout({ rows: [row('a')], schematic: lines }, { width: 960, height: 540 })
    expect(l.schematic[0].d).toBe('M 96 270 L 192 270 L 192 378')
    expect(l.schematic[0].length).toBeCloseTo(204, 6)
  })

  it('binds attached lines to their row index (api/ctx/model → 4/5/6 of 8)', () => {
    const rows = ['file', 'imports', 'signature', 'comment', 'api', 'ctx', 'model', 'return'].map((id) => row(id))
    const lines: SchematicLine[] = [
      { attach: 'api', tone: 'accent', points: [[0.02, 0.57], [0.03, 0.62]] },
      { attach: 'ctx', tone: 'accent', points: [[0.02, 0.63], [0.03, 0.68]] },
      { attach: 'model', tone: 'accent', points: [[0.02, 0.69], [0.03, 0.74]] },
    ]
    const l = schematicRowsLayout({ rows, schematic: lines })
    expect(l.schematic.map((s) => s.atIndex)).toEqual([4, 5, 6])
  })

  it('distributes unattached lines over the LAST rows in order', () => {
    const rows = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => row(id))
    const lines: SchematicLine[] = [0, 1, 2].map(() => ({ tone: 'plain' as const, points: [[0, 0], [1, 1]] as [number, number][] }))
    const l = schematicRowsLayout({ rows, schematic: lines })
    expect(l.schematic.map((s) => s.atIndex)).toEqual([5, 6, 7])
  })

  it('clamps when there are more lines than rows', () => {
    const l = schematicRowsLayout({ rows: [row('a'), row('b')], schematic: [
      { tone: 'plain', points: [[0, 0], [1, 1]] },
      { tone: 'plain', points: [[0, 0], [1, 1]] },
      { tone: 'plain', points: [[0, 0], [1, 1]] },
    ] })
    expect(l.schematic.map((s) => s.atIndex)).toEqual([0, 0, 1])
  })

  it('validates instead of rendering blank', () => {
    expect(() => schematicRowsLayout({ rows: [] })).toThrow(RangeError)
    expect(() => schematicRowsLayout({ rows: [row('a')], schematic: [{ attach: 'ghost', tone: 'accent', points: [[0, 0], [1, 1]] }] })).toThrow(RangeError)
    expect(() => schematicRowsLayout({ rows: [row('a')], schematic: [{ tone: 'accent', points: [[0.5, 0.5]] }] })).toThrow(RangeError)
    expect(() => schematicRowsLayout({ rows: [row('a')], schematic: [{ tone: 'accent', points: [[12, 0.5], [0.5, 0.5]] }] })).toThrow(RangeError)
    expect(() => schematicRowsLayout({ rows: [row('a')], schematic: [{ tone: 'accent', points: [[0.5, -0.1], [0.5, 0.5]] }] })).toThrow(RangeError)
  })
})
