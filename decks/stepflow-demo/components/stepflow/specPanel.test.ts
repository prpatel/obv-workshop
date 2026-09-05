import { describe, expect, it } from 'vitest'
import {
  SPEC_PANEL_CLICKS,
  SPEC_PANEL_SEED,
  STEP_SCHEDULE_SEC,
  specPanelLayout,
  specRowBaseline,
  specRowFont,
  type SpecRow,
} from './specPanel'

// Hand-computed constants for the default 1920×1080 viewBox, from the seg14
// report.json bboxes (2560×1440 crop, seg14_153s-160s) mapped 1:1 (R-2: the
// crop frames the full 16:9 slide — fractions × 1920 / × 1080):
//   plate      [0.1156, 0.3083, 0.8828, 0.8514] → [221.952, 332.964, 1473.024, 586.548]
//   status     [0.1922, 0.3472, 0.3672, 0.3667] → [369.024, 374.976, 336.000, 21.060]
//   statusTeal [0.7426, 0.3424, 0.8621, 0.3646] → [1425.792, 369.792, 229.440, 23.976]
//   heading    [0.1711, 0.4444, 0.4156, 0.4639] → [328.512, 479.952, 469.440, 21.060]
//   body       [0.1727, 0.5208, 0.4813, 0.6056] → [331.584, 562.464, 592.512, 91.584]
//   redLine    [0.2430, 0.5917, 0.4602, 0.6069] → [466.560, 639.036, 417.024, 16.416]
//   tealLine   [0.2438, 0.6944, 0.4984, 0.7257] → [468.096, 749.952, 488.832, 33.804]
//   lastLine   [0.2438, 0.7514, 0.5234, 0.7667] → [468.096, 811.512, 536.832, 16.524]
//   redStrip   [0.1434, 0.5097, 0.1504, 0.6285] → [275.328, 550.476, 13.440, 128.304]
//   tealStrip  [0.1434, 0.6688, 0.1504, 0.7875] → [275.328, 722.304, 13.440, 128.196]
//   tealTile   [0.1719, 0.6979, 0.2238, 0.7583] → [330.048, 753.732, 99.648, 65.232]
//   tealGlyph  [0.1891, 0.7125, 0.2066, 0.7438] → [363.072, 769.500, 33.600, 33.804]
const PLATE = { x: 221.952, y: 332.964, w: 1473.024, h: 586.548 }
const STATUS = { x: 369.024, y: 374.976, w: 336.0, h: 21.06 }
const STATUS_TEAL = { x: 1425.792, y: 369.792, w: 229.44, h: 23.976 }
const HEADING = { x: 328.512, y: 479.952, w: 469.44, h: 21.06 }
const BODY = { x: 331.584, y: 562.464, w: 592.512, h: 91.584 }
const RED_LINE = { x: 466.56, y: 639.036, w: 417.024, h: 16.416 }
const TEAL_LINE = { x: 468.096, y: 749.952, w: 488.832, h: 33.804 }
const LAST_LINE = { x: 468.096, y: 811.512, w: 536.832, h: 16.524 }
const RED_STRIP = { x: 275.328, y: 550.476, w: 13.44, h: 128.304 }
const TEAL_STRIP = { x: 275.328, y: 722.304, w: 13.44, h: 128.196 }
const TEAL_TILE = { x: 330.048, y: 753.732, w: 99.648, h: 65.232 }
const TEAL_GLYPH = { x: 363.072, y: 769.5, w: 33.6, h: 33.804 }

function rowById(rows: SpecRow[], id: string): SpecRow {
  const row = rows.find((row) => row.id === id)
  if (!row) throw new Error(`missing row ${id}`)
  return row
}

describe('specPanelLayout — measured plate', () => {
  it('one huge plate filling x0.1156–0.8828, y0.3083–0.8514, hand-computed to 1e-6', () => {
    const l = specPanelLayout()
    expect(l.plate.x).toBeCloseTo(PLATE.x, 6)
    expect(l.plate.y).toBeCloseTo(PLATE.y, 6)
    expect(l.plate.w).toBeCloseTo(PLATE.w, 6)
    expect(l.plate.h).toBeCloseTo(PLATE.h, 6)
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
  })

  it('two plate waves: click 1 is the dim wash at luma 3.78/14, click 2 the full fill', () => {
    const l = specPanelLayout()
    // V-3: the settled plate is rgb(13,13,16) — luma ≈14 on the black canvas,
    // not a gray card. The dim wave's opacity is the measured ratio 0.27.
    expect(l.plateDimOpacity).toBeCloseTo(0.27, 6)
    // Beat model: wave 1 = click 1 (t0.467), wave 2 rides click 2 (draft pins
    // the row onset t0.600). Both waves render the SAME plate box — asserted
    // via the single layout plate the component reveals twice.
  })

  it('title chrome constants: cap band y107.244–162.000, centered at x963.744, ink 634.56px', () => {
    const l = specPanelLayout()
    expect(l.title.capTop).toBeCloseTo(107.244, 6)
    expect(l.title.capHeight).toBeCloseTo(54.756, 6)
    expect(l.title.centerX).toBeCloseTo(963.744, 6)
    expect(l.title.inkWidth).toBeCloseTo(634.56, 6)
  })
})

describe('specPanelLayout — fading rows', () => {
  it('status row at the measured band, dim tone, click 2', () => {
    const l = specPanelLayout()
    const row = rowById(l.rows, 'status')
    expect(row.box.x).toBeCloseTo(STATUS.x, 6)
    expect(row.box.y).toBeCloseTo(STATUS.y, 6)
    expect(row.box.w).toBeCloseTo(STATUS.w, 6)
    expect(row.box.h).toBeCloseTo(STATUS.h, 6)
    expect(row.tone).toBe('dim')
    expect(row.click).toBe(2)
    expect(row.delayMs).toBe(0)
  })

  it('teal status cluster one frame after the row (delay 66ms), click 2', () => {
    const l = specPanelLayout()
    const row = rowById(l.rows, 'statusTeal')
    expect(row.box.x).toBeCloseTo(STATUS_TEAL.x, 6)
    expect(row.box.y).toBeCloseTo(STATUS_TEAL.y, 6)
    expect(row.box.w).toBeCloseTo(STATUS_TEAL.w, 6)
    expect(row.box.h).toBeCloseTo(STATUS_TEAL.h, 6)
    expect(row.tone).toBe('teal')
    expect(row.click).toBe(2)
    expect(row.delayMs).toBe(66)
  })

  it('heading + body group on click 3 (sub-chunks 0.867–2.2 fold into the beat)', () => {
    const l = specPanelLayout()
    const heading = rowById(l.rows, 'heading')
    expect(heading.box.x).toBeCloseTo(HEADING.x, 6)
    expect(heading.box.y).toBeCloseTo(HEADING.y, 6)
    expect(heading.box.w).toBeCloseTo(HEADING.w, 6)
    expect(heading.box.h).toBeCloseTo(HEADING.h, 6)
    expect(heading.click).toBe(3)

    const body = rowById(l.rows, 'body')
    expect(body.box.x).toBeCloseTo(BODY.x, 6)
    expect(body.box.y).toBeCloseTo(BODY.y, 6)
    expect(body.box.w).toBeCloseTo(BODY.w, 6)
    expect(body.box.h).toBeCloseTo(BODY.h, 6)
    expect(body.click).toBe(3)
    expect(body.delayMs).toBe(120)
    expect(body.lines).toHaveLength(3)
  })

  it('red strip line rides click 4 with a 300ms sub-beat delay (t3.467 after t3.133)', () => {
    const l = specPanelLayout()
    const row = rowById(l.rows, 'redLine')
    expect(row.box.x).toBeCloseTo(RED_LINE.x, 6)
    expect(row.box.y).toBeCloseTo(RED_LINE.y, 6)
    expect(row.box.w).toBeCloseTo(RED_LINE.w, 6)
    expect(row.box.h).toBeCloseTo(RED_LINE.h, 6)
    expect(row.click).toBe(4)
    expect(row.delayMs).toBe(300)
  })

  it('spec statement on click 6 — the tallest row band (cap 33.804)', () => {
    const l = specPanelLayout()
    const row = rowById(l.rows, 'tealLine')
    expect(row.box.x).toBeCloseTo(TEAL_LINE.x, 6)
    expect(row.box.y).toBeCloseTo(TEAL_LINE.y, 6)
    expect(row.box.w).toBeCloseTo(TEAL_LINE.w, 6)
    expect(row.box.h).toBeCloseTo(TEAL_LINE.h, 6)
    expect(row.click).toBe(6)
    expect(row.delayMs).toBe(0)
  })

  it('closing line on click 7 at the measured band', () => {
    const l = specPanelLayout()
    const row = rowById(l.rows, 'lastLine')
    expect(row.box.x).toBeCloseTo(LAST_LINE.x, 6)
    expect(row.box.y).toBeCloseTo(LAST_LINE.y, 6)
    expect(row.box.w).toBeCloseTo(LAST_LINE.w, 6)
    expect(row.box.h).toBeCloseTo(LAST_LINE.h, 6)
    expect(row.click).toBe(7)
    expect(row.delayMs).toBe(0)
  })
})

describe('specPanelLayout — edge accents and traffic dots', () => {
  it('red strip at the measured band, click 4', () => {
    const l = specPanelLayout()
    const accent = l.accents.find((a) => a.id === 'redStrip')
    expect(accent!.box.x).toBeCloseTo(RED_STRIP.x, 6)
    expect(accent!.box.y).toBeCloseTo(RED_STRIP.y, 6)
    expect(accent!.box.w).toBeCloseTo(RED_STRIP.w, 6)
    expect(accent!.box.h).toBeCloseTo(RED_STRIP.h, 6)
    expect(accent!.click).toBe(4)
    expect(accent!.glyph).toBeUndefined()
  })

  it('teal strip and tile on click 5; the tile carries its centered glyph', () => {
    const l = specPanelLayout()
    const strip = l.accents.find((a) => a.id === 'tealStrip')
    expect(strip!.box.x).toBeCloseTo(TEAL_STRIP.x, 6)
    expect(strip!.box.y).toBeCloseTo(TEAL_STRIP.y, 6)
    expect(strip!.box.w).toBeCloseTo(TEAL_STRIP.w, 6)
    expect(strip!.box.h).toBeCloseTo(TEAL_STRIP.h, 6)
    expect(strip!.click).toBe(5)

    const tile = l.accents.find((a) => a.id === 'tealTile')
    expect(tile!.box.x).toBeCloseTo(TEAL_TILE.x, 6)
    expect(tile!.box.y).toBeCloseTo(TEAL_TILE.y, 6)
    expect(tile!.box.w).toBeCloseTo(TEAL_TILE.w, 6)
    expect(tile!.box.h).toBeCloseTo(TEAL_TILE.h, 6)
    expect(tile!.click).toBe(5)
    expect(tile!.glyph!.x).toBeCloseTo(TEAL_GLYPH.x, 6)
    expect(tile!.glyph!.y).toBeCloseTo(TEAL_GLYPH.y, 6)
    expect(tile!.glyph!.w).toBeCloseTo(TEAL_GLYPH.w, 6)
    expect(tile!.glyph!.h).toBeCloseTo(TEAL_GLYPH.h, 6)
  })

  it('traffic dots: three ~7px circles at y385.128 on click 2', () => {
    const l = specPanelLayout()
    expect(l.dots.map((d) => d.id)).toEqual(['red', 'amber', 'green'])
    ;[265.92, 294.336, 322.944].forEach((cx, i) => expect(l.dots[i]!.cx).toBeCloseTo(cx, 6))
    ;[7.872, 6.336, 7.104].forEach((r, i) => expect(l.dots[i]!.r).toBeCloseTo(r, 6))
    l.dots.forEach((d) => {
      expect(d.cy).toBeCloseTo(385.128, 6)
      expect(d.click).toBe(2)
    })
  })
})

describe('specPanelLayout — the seven-beat schedule', () => {
  it('STEP_SCHEDULE_SEC pins the draft onsets exactly', () => {
    expect(STEP_SCHEDULE_SEC).toEqual([0.47, 0.6, 2.0, 3.13, 4.47, 5.07, 6.53])
    expect(STEP_SCHEDULE_SEC).toHaveLength(SPEC_PANEL_CLICKS)
    const times = [...STEP_SCHEDULE_SEC]
    for (let i = 1; i < times.length; i++) expect(times[i]!).toBeGreaterThan(times[i - 1]!)
  })

  it('clicks 2–7 are each claimed by a row, accent, or dot (click 1 is the plate dim wave)', () => {
    const l = specPanelLayout()
    const claimed = new Set<number>()
    l.rows.forEach((r) => claimed.add(r.click))
    l.accents.forEach((a) => claimed.add(a.click))
    l.dots.forEach((d) => claimed.add(d.click))
    for (let click = 2; click <= SPEC_PANEL_CLICKS; click++) {
      expect(claimed.has(click)).toBe(true)
    }
    expect(claimed.size).toBe(SPEC_PANEL_CLICKS - 1)
  })

  it('the seed carries copy for every row id', () => {
    expect(SPEC_PANEL_SEED.status.length).toBeGreaterThan(0)
    expect(SPEC_PANEL_SEED.statusTeal.length).toBeGreaterThan(0)
    expect(SPEC_PANEL_SEED.heading.length).toBeGreaterThan(0)
    expect(SPEC_PANEL_SEED.body).toHaveLength(3)
    expect(SPEC_PANEL_SEED.redLine.length).toBeGreaterThan(0)
    expect(SPEC_PANEL_SEED.tealLine.length).toBeGreaterThan(0)
    expect(SPEC_PANEL_SEED.lastLine.length).toBeGreaterThan(0)
  })
})

describe('typography helpers', () => {
  it('specRowFont derives font size from the measured cap at the 0.730 ratio', () => {
    const l = specPanelLayout()
    expect(specRowFont(rowById(l.rows, 'status'))).toBeCloseTo(21.06 / 0.73, 6)
    expect(specRowFont(rowById(l.rows, 'tealLine'))).toBeCloseTo(33.804 / 0.73, 6)
    expect(specRowFont(rowById(l.rows, 'lastLine'))).toBeCloseTo(16.524 / 0.73, 6)
    expect(specRowFont(rowById(l.rows, 'redLine'))).toBeCloseTo(16.416 / 0.73, 6)
  })

  it('specRowBaseline sits one cap below the band top; body lines split the block evenly', () => {
    const l = specPanelLayout()
    const status = rowById(l.rows, 'status')
    expect(specRowBaseline(status)).toBeCloseTo(374.976 + 21.06, 6)
    const body = rowById(l.rows, 'body')
    const pitch = BODY.h / 3
    expect(pitch).toBeCloseTo(30.528, 6)
    expect(specRowBaseline(body, 0)).toBeCloseTo(562.464 + 21.06, 6)
    expect(specRowBaseline(body, 2)).toBeCloseTo(562.464 + 21.06 + 2 * pitch, 6)
  })

  it('specRowFont rejects a non-positive cap with RangeError', () => {
    const l = specPanelLayout()
    const status = rowById(l.rows, 'status')
    expect(() => specRowFont({ ...status, cap: 0 })).toThrow(RangeError)
    expect(() => specRowFont({ ...status, cap: -3 })).toThrow(RangeError)
  })

  it('specRowBaseline rejects fractional, negative lines and empty rows with RangeError', () => {
    const l = specPanelLayout()
    const status = rowById(l.rows, 'status')
    expect(() => specRowBaseline(status, 1.5)).toThrow(RangeError)
    expect(() => specRowBaseline(status, -1)).toThrow(RangeError)
    expect(() => specRowBaseline({ ...status, lines: [] })).toThrow(RangeError)
  })
})

describe('validation and determinism', () => {
  it('rejects non-positive viewbox dimensions with RangeError', () => {
    expect(() => specPanelLayout({ width: 0 })).toThrow(RangeError)
    expect(() => specPanelLayout({ height: 0 })).toThrow(RangeError)
    expect(() => specPanelLayout({ width: -1920 })).toThrow(RangeError)
    expect(() => specPanelLayout({ height: -1080 })).toThrow(RangeError)
    expect(() => specPanelLayout({ width: Number.NaN })).toThrow(RangeError)
  })

  it('scales linearly: an explicit 960×540 viewBox halves every measured constant', () => {
    const l = specPanelLayout({ width: 960, height: 540 })
    expect(l.plate.x).toBeCloseTo(PLATE.x / 2, 6)
    expect(l.plate.y).toBeCloseTo(PLATE.y / 2, 6)
    expect(l.plate.w).toBeCloseTo(PLATE.w / 2, 6)
    expect(l.plate.h).toBeCloseTo(PLATE.h / 2, 6)
    expect(l.title.inkWidth).toBeCloseTo(634.56 / 2, 6)
  })

  it('byte-identical determinism: repeated calls stringify identically', () => {
    const a = JSON.stringify(specPanelLayout())
    const b = JSON.stringify(specPanelLayout())
    const c = JSON.stringify(specPanelLayout({ width: 1920, height: 1080 }))
    expect(a).toBe(b)
    expect(a).toBe(c)
    expect(a.length).toBeGreaterThan(0)
  })

  it('layout snapshot (default viewBox)', () => {
    expect(specPanelLayout()).toMatchSnapshot()
  })
})
