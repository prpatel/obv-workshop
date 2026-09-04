import { describe, expect, it } from 'vitest'
import {
  SCHEMATIC_ROWS_CALLOUTS,
  SCHEMATIC_ROWS_ROWS,
  SCHEMATIC_ROWS_SCENE,
  schematicRowsLayout,
  TOKEN_COLORS,
  CLICK_BAND,
  CLICK_CALLOUT_1,
  CLICK_CHROME,
  CLICK_RAIL,
  FIRST_ROW_CLICK,
  HIGHLIGHT_BAND,
  CONNECTOR_RAIL,
  ROW_BASELINE,
  ROW_EM_TO_INK,
  ROW_FONT,
  ROW_SCALE_X,
  TAB_TEXT,
  TRAFFIC_DOTS,
  TYPEWRITER_TOTAL_MS,
  WINDOW_FRAME,
  rowCharDelayMs,
  rowChars,
  rowClick,
  rowText,
} from './rows'

/** The verbatim listing, sheet art_mkVNxsft §2.2 (OCR flags resolved from 2× crops). */
const VERBATIM_ROWS = [
  'from mrk import service, depends',
  'def answer(question: str) -> str:',
  '# the AI application',
  'api = service("answer-api")',
  'ctx = depends("mart.orders")',
  'model = depends("ai.answer_v2")',
  'return model.ask(question, ctx)',
]

describe('verbatim listing (sheet §2.2, crops resolved)', () => {
  it('carries the seven reference rows verbatim, in order', () => {
    expect(SCHEMATIC_ROWS_ROWS).toHaveLength(7)
    SCHEMATIC_ROWS_ROWS.forEach((row, i) => {
      expect(rowText(row), `row ${i + 1}`).toBe(VERBATIM_ROWS[i])
    })
  })

  it('numbers the gutter 1–7', () => {
    expect(SCHEMATIC_ROWS_ROWS.map((row) => row.number)).toEqual(['1', '2', '3', '4', '5', '6', '7'])
  })

  it('indents rows 3–7 one step (measured x160.5) and leaves rows 1–2 at the code margin (x99)', () => {
    for (const i of [0, 1])
      expect(SCHEMATIC_ROWS_ROWS[i].x, `row ${i + 1}`).toBe(99)
    for (const i of [2, 3, 4, 5, 6])
      expect(SCHEMATIC_ROWS_ROWS[i].x, `row ${i + 1}`).toBe(160.5)
  })

  it('tokens row 1: blue keywords, near-white identifiers', () => {
    expect(SCHEMATIC_ROWS_ROWS[0].tokens).toEqual([
      { text: 'from ', tone: 'keyword' },
      { text: 'mrk ', tone: 'ident' },
      { text: 'import ', tone: 'keyword' },
      { text: 'service, depends', tone: 'ident' },
    ])
  })

  it('tokens row 4: the string core is its own near-white token (no trailing ; — crop-verified)', () => {
    expect(SCHEMATIC_ROWS_ROWS[3].tokens).toEqual([
      { text: 'api = ', tone: 'ident' },
      { text: 'service(', tone: 'ident' },
      { text: '"answer-api"', tone: 'string' },
      { text: ')', tone: 'ident' },
    ])
  })

  it('tokens row 3: the whole line is one dim comment', () => {
    expect(SCHEMATIC_ROWS_ROWS[2].tokens).toEqual([{ text: '# the AI application', tone: 'comment' }])
  })

  it('keeps the ASCII arrow on row 2 (OCR read an em-dash; the crop shows ->)', () => {
    expect(rowText(SCHEMATIC_ROWS_ROWS[1])).toContain(') -> str:')
  })
})

describe('token colors (sheet-sampled tone constants)', () => {
  it('exposes the four measured tones', () => {
    expect(TOKEN_COLORS.keyword).toBe('#4298f2')
    expect(TOKEN_COLORS.ident).toBe('#f2f2f2')
    expect(TOKEN_COLORS.string).toBe('#e6ebf1')
    expect(TOKEN_COLORS.comment).toBe('#888791')
  })

  it('every token tone is one of the four constants', () => {
    for (const row of SCHEMATIC_ROWS_ROWS)
      for (const token of row.tokens)
        expect(TOKEN_COLORS[token.tone]).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('rowChars — the typewriter stream', () => {
  it('splits a row into per-character units carrying their token tone', () => {
    const chars = rowChars(SCHEMATIC_ROWS_ROWS[0])
    expect(chars).toHaveLength(rowText(SCHEMATIC_ROWS_ROWS[0]).length)
    expect(chars[0]).toEqual({ ch: 'f', tone: 'keyword' })
    expect(chars[4]).toEqual({ ch: ' ', tone: 'keyword' }) // 'from ' — the trailing space is a keyword-tone char
    expect(chars[5]).toEqual({ ch: 'm', tone: 'ident' })
    expect(chars.map((c) => c.ch).join('')).toBe(VERBATIM_ROWS[0])
  })

  it('preserves spaces (mono, white-space: pre)', () => {
    expect(rowChars(SCHEMATIC_ROWS_ROWS[6])[6]).toEqual({ ch: ' ', tone: 'keyword' })
  })
})

describe('window chrome + measured geometry (native × 0.75)', () => {
  it('ships the three traffic dots in macOS order with the sampled colors', () => {
    expect(TRAFFIC_DOTS.map((d) => d.fill)).toEqual(['#fb5c55', '#f5b839', '#30bf49'])
    expect(TRAFFIC_DOTS.every((d) => d.r === 7.2)).toBe(true)
  })

  it('ships the tab text, underline, and right-aligned path', () => {
    expect(TAB_TEXT.text).toBe('answer_service.py')
    expect(TAB_TEXT.underline.w).toBeCloseTo(152.25, 2)
    expect(TAB_TEXT.underline.y).toBeGreaterThan(TAB_TEXT.baseline - 1)
  })

  it('the frame is four rules with the divider at the code pane edge', () => {
    expect(WINDOW_FRAME.top.w).toBeCloseTo(1398.75, 2)
    expect(WINDOW_FRAME.divider.x).toBeCloseTo(972, 2)
  })

  it('row geometry: per-row measured tops at ~49.5px pitch (the frame, not the sheet note)', () => {
    const tops = SCHEMATIC_ROWS_ROWS.map((row) => row.inkTop)
    expect(tops[0]).toBe(355.5)
    for (let i = 1; i < tops.length; i++)
      expect(tops[i] - tops[i - 1]).toBeGreaterThan(45)
    expect(tops[6] - tops[0]).toBeCloseTo(298.5, 2)
  })

  it('typography constants: 32px rows condensed to the 16px measured advance', () => {
    expect(ROW_FONT).toBe(32)
    expect(ROW_SCALE_X).toBeCloseTo(16 / (0.6 * 32), 6)
    expect(ROW_EM_TO_INK).toBeGreaterThan(0)
    expect(ROW_BASELINE).toBeCloseTo(23.33, 2)
  })

  it('band behind rows 4–5 and rail alongside rows 4–6 (frame-corrected extents)', () => {
    expect(HIGHLIGHT_BAND.fill).toBe('#08272c')
    expect(HIGHLIGHT_BAND.y).toBeLessThan(SCHEMATIC_ROWS_ROWS[3].inkTop)
    expect(HIGHLIGHT_BAND.y + HIGHLIGHT_BAND.h).toBeGreaterThan(SCHEMATIC_ROWS_ROWS[4].inkTop)
    expect(CONNECTOR_RAIL.fill).toBe('#35c2ea')
    expect(CONNECTOR_RAIL.y + CONNECTOR_RAIL.h).toBeGreaterThan(SCHEMATIC_ROWS_ROWS[5].inkTop)
    expect(CONNECTOR_RAIL.x + CONNECTOR_RAIL.w).toBeLessThan(60)
  })
})

describe('callout ladder (four measured circle+label pairs)', () => {
  it('carries the OCR-verified labels in order', () => {
    expect(SCHEMATIC_ROWS_CALLOUTS.map((c) => c.label)).toEqual([
      'DEPENDENCIES TO MAINTAIN',
      'API IT CALLS',
      'DATA IT READS',
      'MODEL IT ASKS',
    ])
  })

  it('uses the frame-measured ring tones (callout 1 amber, not the sheet-assumed gray)', () => {
    expect(SCHEMATIC_ROWS_CALLOUTS.map((c) => c.ring.fill)).toEqual(['#f5b839', '#3dc0d4', '#4791de', '#39c596'])
  })

  it('labels 1/4 gray, 2/3 white (small caps gray, large caps white)', () => {
    expect(SCHEMATIC_ROWS_CALLOUTS[0].ink.fill).toBe('#a5a5af')
    expect(SCHEMATIC_ROWS_CALLOUTS[3].ink.fill).toBe('#afaeb2')
    expect(SCHEMATIC_ROWS_CALLOUTS[1].ink.fill).toBe('#f5f4f7')
    expect(SCHEMATIC_ROWS_CALLOUTS[2].ink.fill).toBe('#f5f4f7')
  })

  it('rings sit in the right-hand ladder column', () => {
    expect(SCHEMATIC_ROWS_CALLOUTS.every((c) => c.ring.cx > 1000 && c.ring.cx < 1100)).toBe(true)
    // cy ascends down the ladder in callout order
    const cys = SCHEMATIC_ROWS_CALLOUTS.map((c) => c.ring.cy)
    expect([...cys].sort((a, b) => a - b)).toEqual(cys)
  })

  it('tails are optional short strokes off the ring (callouts 2 and 4)', () => {
    expect(SCHEMATIC_ROWS_CALLOUTS[0].tail).toBeUndefined()
    expect(SCHEMATIC_ROWS_CALLOUTS[1].tail).toEqual([[1043, 628], [1034, 638]])
    expect(SCHEMATIC_ROWS_CALLOUTS[2].tail).toBeUndefined()
    expect(SCHEMATIC_ROWS_CALLOUTS[3].tail).toEqual([[1051, 772], [1047, 754]])
  })
})

describe('click choreography — 10 clicks, rail-aware', () => {
  it('chrome pops first, callout 1 second, rows start at click 3', () => {
    expect(CLICK_CHROME).toBe(1)
    expect(CLICK_CALLOUT_1).toBe(2)
    expect(FIRST_ROW_CLICK).toBe(3)
  })

  it('the rail draws on click 6, just before row 4', () => {
    expect(CLICK_RAIL).toBe(6)
    expect(rowClick(2)).toBe(5) // row 3
    expect(rowClick(3)).toBe(7) // row 4 — shifted past the rail
    expect(CLICK_BAND).toBe(7)
  })

  it('rows land on 3, 4, 5, 7, 8, 9, 10 — ten clicks total', () => {
    expect(SCHEMATIC_ROWS_ROWS.map((_, i) => rowClick(i))).toEqual([3, 4, 5, 7, 8, 9, 10])
  })

  it('callouts key to their target rows: 1 before the listing, 2/3/4 with rows 4/5/6', () => {
    const clicks = SCHEMATIC_ROWS_CALLOUTS.map((c) => c.click)
    expect(clicks[0]).toBe(CLICK_CALLOUT_1)
    expect(clicks[1]).toBe(rowClick(3)) // API IT CALLS → api row
    expect(clicks[2]).toBe(rowClick(4)) // DATA IT READS → ctx row
    expect(clicks[3]).toBe(rowClick(5)) // MODEL IT ASKS → model row
  })
})

describe('typewriter timing — the ≈9.8s recording re-paced', () => {
  it('spans 9800ms across the seven rows', () => {
    expect(TYPEWRITER_TOTAL_MS).toBe(9800)
    expect(TYPEWRITER_TOTAL_MS / 7).toBeCloseTo(1400, 6)
  })

  it('paces each row to its share of the total (per-character delay)', () => {
    for (const row of SCHEMATIC_ROWS_ROWS) {
      const chars = rowChars(row).length
      expect(rowCharDelayMsOf(row)).toBeCloseTo(TYPEWRITER_TOTAL_MS / 7 / chars, 6)
    }
  })

  it('rejects non-positive char counts instead of dividing by zero', () => {
    expect(() => rowCharDelayMsOf({ tokens: [] })).toThrow(RangeError)
  })
})

describe('schematicRowsLayout', () => {
  it('resolves rows at their measured positions with rail-aware clicks and char pacing', () => {
    const layout = schematicRowsLayout()
    expect(layout.viewBox).toEqual({ width: 1920, height: 1080 })
    expect(layout.rows).toHaveLength(7)

    const first = layout.rows[0]
    expect(first.x).toBe(99)
    expect(first.y).toBeCloseTo(355.5 - ROW_EM_TO_INK, 6)
    expect(first.click).toBe(3)
    expect(first.chars).toHaveLength(rowText(SCHEMATIC_ROWS_ROWS[0]).length)
    expect(first.charDelayMs).toBeCloseTo(1400 / first.chars.length, 6)

    expect(layout.rows[3].click).toBe(7) // row 4, past the rail
    expect(layout.rows[6].click).toBe(10) // last click of ten
  })

  it('resolves each callout label to its measured baseline and advance-matched tracking', () => {
    const layout = schematicRowsLayout()
    for (let i = 0; i < layout.callouts.length; i++) {
      const callout = layout.callouts[i]
      const spec = SCHEMATIC_ROWS_CALLOUTS[i]
      expect(callout.ink.baseline).toBeCloseTo(spec.ink.inkTop + spec.ink.cap, 6)
      expect(callout.ink.font).toBeCloseTo(spec.ink.cap / 0.729, 6)
      expect(callout.ink.tracking).toBeCloseTo(spec.ink.advance - 0.6 * callout.ink.font, 6)
      expect(callout.ink.fill).toBe(spec.ink.fill)
    }
  })

  it('keeps tails (empty when the spec omits them) and passes rings through verbatim', () => {
    const layout = schematicRowsLayout()
    expect(layout.callouts[0].tail).toEqual([])
    expect(layout.callouts[1].tail).toEqual([[1043, 628], [1034, 638]])
    expect(layout.callouts[3].ring).toEqual(SCHEMATIC_ROWS_CALLOUTS[3].ring)
  })

  it('throws on an empty scene instead of rendering blank', () => {
    expect(() => schematicRowsLayout({ rows: [], callouts: [] })).toThrow(RangeError)
  })

  it('is deterministic for the same inputs', () => {
    expect(JSON.stringify(schematicRowsLayout())).toBe(JSON.stringify(schematicRowsLayout()))
  })

  it('the demo seed is the scene the slide renders', () => {
    expect(SCHEMATIC_ROWS_SCENE.rows).toBe(SCHEMATIC_ROWS_ROWS)
    expect(SCHEMATIC_ROWS_SCENE.callouts).toBe(SCHEMATIC_ROWS_CALLOUTS)
  })
})

/** Per-character delay for a row, over the module surface under test. */
function rowCharDelayMsOf(row: { tokens: { text: string }[] }): number {
  const chars = row.tokens.reduce((n, t) => n + Array.from(t.text).length, 0)
  return rowCharDelayMs(chars)
}
