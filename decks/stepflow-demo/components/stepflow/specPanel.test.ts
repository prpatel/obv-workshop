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

// Hand-computed constants for the default 1920×1080 viewBox, from the
// settled-truth packet (fl_KbQNQoum: settled_full.png ink bboxes + OCR reads,
// 2560×1440 seg14 frame) mapped 1:1 (R-2: the crop frames the full 16:9
// slide — fractions × 1920 / × 1080):
//   plate       [0.1156, 0.3083, 0.8828, 0.8514] → [221.952, 332.964, 1473.024, 586.548]
//   status      [0.1922, 0.3477, 0.3688, 0.3643] → [369.024, 375.516, 339.072, 17.928]
//   statusTeal  [0.7750, 0.3509, 0.8625, 0.3681] → [1488.000, 378.972, 168.000, 18.576]
//   statusGlyph [0.7426, 0.3417, 0.7730, 0.3688] → [1425.792, 369.036, 58.368, 29.268]
//   heading     [0.1714, 0.4454, 0.4167, 0.4657] → [329.088, 481.032, 470.976, 21.924]
//   bodyIcon    [0.1727, 0.5208, 0.2230, 0.6042] → [331.584, 562.464, 96.576, 90.072]
//   bodyLine    [0.2432, 0.5352, 0.4813, 0.5667] → [466.944, 578.016, 457.152, 34.020]
//   redLine     [0.2427, 0.5917, 0.4620, 0.6083] → [465.984, 639.036, 421.056, 17.928]
//   tealLine    [0.2432, 0.6944, 0.4990, 0.7259] → [466.944, 749.952, 491.136, 34.020]
//   lastLine    [0.2432, 0.7500, 0.5234, 0.7667] → [466.944, 810.000, 537.984, 18.036]
//   redStrip    [0.1434, 0.5097, 0.1504, 0.6285] → [275.328, 550.476, 13.440, 128.304]
//   tealStrip   [0.1434, 0.6688, 0.1504, 0.7875] → [275.328, 722.304, 13.440, 128.196]
//   tealTile    [0.1719, 0.6979, 0.2238, 0.7583] → [330.048, 753.732, 99.648, 65.232]
//   tealGlyph   [0.1891, 0.7125, 0.2066, 0.7438] → [363.072, 769.500, 33.600, 33.804]
const PLATE = { x: 221.952, y: 332.964, w: 1473.024, h: 586.548 }
const STATUS = { x: 369.024, y: 375.516, w: 339.072, h: 17.928 }
const STATUS_TEAL = { x: 1488.0, y: 378.972, w: 168.0, h: 18.576 }
const STATUS_GLYPH = { x: 1425.792, y: 369.036, w: 58.368, h: 29.268 }
const HEADING = { x: 329.088, y: 481.032, w: 470.976, h: 21.924 }
const BODY_ICON = { x: 331.584, y: 562.464, w: 96.576, h: 90.072 }
const BODY_LINE = { x: 466.944, y: 578.016, w: 457.152, h: 34.02 }
const RED_LINE = { x: 465.984, y: 639.036, w: 421.056, h: 17.928 }
const TEAL_LINE = { x: 466.944, y: 749.952, w: 491.136, h: 34.02 }
const LAST_LINE = { x: 466.944, y: 810.0, w: 537.984, h: 18.036 }
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
    // V-3: the settled plate is #0f0e11 (rgb(15,14,17)) — luma ≈14 on the
    // black canvas, not a gray card. The dim wave's opacity is the
    // measured ratio 0.27.
    expect(l.plateDimOpacity).toBeCloseTo(0.27, 6)
    // Beat model: wave 1 = click 1 (t0.467), wave 2 rides click 2 (the
    // reference pins the row onset t0.600). Both waves render the SAME
    // plate box — asserted via the single layout plate the component
    // reveals twice.
  })

  it('title chrome constants: cap band y97.956–162.000, centered at x963.552, ink 634.944px', () => {
    const l = specPanelLayout()
    expect(l.title.capTop).toBeCloseTo(97.956, 6)
    expect(l.title.capHeight).toBeCloseTo(64.044, 6)
    expect(l.title.centerX).toBeCloseTo(963.552, 6)
    expect(l.title.inkWidth).toBeCloseTo(634.944, 6)
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

  it('the `<zap>` mark leads the teal cluster at its measured box (click 2, delay 66)', () => {
    const l = specPanelLayout()
    expect(l.statusGlyph.x).toBeCloseTo(STATUS_GLYPH.x, 6)
    // Rides the teal cluster's measured −2px lag (same cross-correlation as
    // the statusTeal row's yNudge).
    expect(l.statusGlyph.y).toBeCloseTo(STATUS_GLYPH.y - 1.85, 6)
    expect(l.statusGlyph.w).toBeCloseTo(STATUS_GLYPH.w, 6)
    expect(l.statusGlyph.h).toBeCloseTo(STATUS_GLYPH.h, 6)
  })

  it('heading is a click-2 sub-beat (reference onset t0.867 = t0.600 + 267ms), dim tone', () => {
    const l = specPanelLayout()
    const row = rowById(l.rows, 'heading')
    expect(row.box.x).toBeCloseTo(HEADING.x, 6)
    expect(row.box.y).toBeCloseTo(HEADING.y, 6)
    expect(row.box.w).toBeCloseTo(HEADING.w, 6)
    expect(row.box.h).toBeCloseTo(HEADING.h, 6)
    expect(row.tone).toBe('dim')
    expect(row.click).toBe(2)
    expect(row.delayMs).toBe(267)
  })

  it('body line rides click 3 one frame after the icon (delay 66ms), bright tone', () => {
    const l = specPanelLayout()
    const row = rowById(l.rows, 'bodyLine')
    expect(row.box.x).toBeCloseTo(BODY_LINE.x, 6)
    expect(row.box.y).toBeCloseTo(BODY_LINE.y, 6)
    expect(row.box.w).toBeCloseTo(BODY_LINE.w, 6)
    expect(row.box.h).toBeCloseTo(BODY_LINE.h, 6)
    expect(row.tone).toBe('bright')
    expect(row.click).toBe(3)
    expect(row.delayMs).toBe(66)
  })

  it('red strip line rides click 4 with a 334ms sub-beat delay (t3.467 after t3.133), dim tone', () => {
    const l = specPanelLayout()
    const row = rowById(l.rows, 'redLine')
    expect(row.box.x).toBeCloseTo(RED_LINE.x, 6)
    expect(row.box.y).toBeCloseTo(RED_LINE.y, 6)
    expect(row.box.w).toBeCloseTo(RED_LINE.w, 6)
    expect(row.box.h).toBeCloseTo(RED_LINE.h, 6)
    expect(row.tone).toBe('dim')
    expect(row.click).toBe(4)
    expect(row.delayMs).toBe(334)
  })

  it('teal statement on click 6 — the tallest row band (cap 34.02), bright tone', () => {
    const l = specPanelLayout()
    const row = rowById(l.rows, 'tealLine')
    expect(row.box.x).toBeCloseTo(TEAL_LINE.x, 6)
    expect(row.box.y).toBeCloseTo(TEAL_LINE.y, 6)
    expect(row.box.w).toBeCloseTo(TEAL_LINE.w, 6)
    expect(row.box.h).toBeCloseTo(TEAL_LINE.h, 6)
    expect(row.tone).toBe('bright')
    expect(row.click).toBe(6)
    expect(row.delayMs).toBe(0)
  })

  it('closing line on click 7 at the measured band, dim tone', () => {
    const l = specPanelLayout()
    const row = rowById(l.rows, 'lastLine')
    expect(row.box.x).toBeCloseTo(LAST_LINE.x, 6)
    expect(row.box.y).toBeCloseTo(LAST_LINE.y, 6)
    expect(row.box.w).toBeCloseTo(LAST_LINE.w, 6)
    expect(row.box.h).toBeCloseTo(LAST_LINE.h, 6)
    expect(row.tone).toBe('dim')
    expect(row.click).toBe(7)
    expect(row.delayMs).toBe(0)
  })

  it('every row is single-line — the frame shows one measured band per row', () => {
    const l = specPanelLayout()
    expect(l.rows.map((r) => r.id)).toEqual([
      'status',
      'statusTeal',
      'heading',
      'bodyLine',
      'redLine',
      'tealLine',
      'lastLine',
    ])
  })

  it('word spans: per-word ink extents match the seed copy word split', () => {
    const l = specPanelLayout()
    // Word counts must line up with the seed copy 1:1 (the renderer falls
    // back to row-level pinning otherwise).
    const expectWords: Record<string, number> = {
      status: 1,
      statusTeal: 2,
      heading: 3,
      bodyLine: 4,
      redLine: 5,
      tealLine: 3,
      lastLine: 6,
    }
    for (const row of l.rows) {
      expect(row.words.length, row.id).toBe(expectWords[row.id])
    }
    // bodyLine words: USING / AN / AI / TOOL — measured ink extents.
    const body = rowById(l.rows, 'bodyLine').words
    expect(body[0].box.x).toBeCloseTo(0.2436 * 1920, 6)
    expect(body[0].box.w).toBeCloseTo((0.3228 - 0.2436) * 1920, 6)
    expect(body[3].box.x).toBeCloseTo(0.4103 * 1920, 6)
    expect(body[3].box.w).toBeCloseTo((0.4822 - 0.4103) * 1920, 6)
  })

  it('ink plan: per-row weight + stroke interpolated from calibration renders', () => {
    const l = specPanelLayout()
    // The recording's face is heavier than any bundled JetBrains Mono weight
    // (measured stems ~12.8px on the 34px rows vs ~6.5px JBM Bold). Strokes
    // interpolate the settled frame's ink coverage between two calibration
    // renders; the teal status cluster matches Regular 400 ink exactly.
    expect(rowById(l.rows, 'bodyLine').strokePx).toBeCloseTo(4, 6)
    expect(rowById(l.rows, 'tealLine').strokePx).toBeCloseTo(4, 6)
    expect(rowById(l.rows, 'status').strokePx).toBeCloseTo(0.5, 6)
    expect(rowById(l.rows, 'heading').strokePx).toBeCloseTo(1, 6)
    expect(rowById(l.rows, 'redLine').strokePx).toBeCloseTo(0.75, 6)
    expect(rowById(l.rows, 'lastLine').strokePx).toBeCloseTo(0.65, 6)
    expect(rowById(l.rows, 'statusTeal').strokePx).toBe(0)
    // Weights: bold everywhere except the teal cluster (Regular 400).
    for (const row of l.rows) {
      expect(row.weight).toBe(row.id === 'statusTeal' ? 400 : 700)
    }
    // Baseline nudges: cross-correlated row-ink lags vs the settled frame
    // (status +2px, teal cluster −2px, teal/closing lines +1px at 1080;
    // 1080px → 1.85 viewBox units per px).
    expect(rowById(l.rows, 'status').yNudge).toBeCloseTo(1.85, 6)
    expect(rowById(l.rows, 'statusTeal').yNudge).toBeCloseTo(-1.85, 6)
    expect(rowById(l.rows, 'tealLine').yNudge).toBeCloseTo(0.9, 6)
    expect(rowById(l.rows, 'lastLine').yNudge).toBeCloseTo(0.9, 6)
    expect(rowById(l.rows, 'heading').yNudge).toBe(0)
    expect(rowById(l.rows, 'bodyLine').yNudge).toBe(0)
    expect(rowById(l.rows, 'redLine').yNudge).toBe(0)
  })
})

describe('specPanelLayout — accents, glyphs, and traffic dots', () => {
  it('cursor-square icon on click 3 (reference t1.933) before its line', () => {
    const l = specPanelLayout()
    const icon = l.accents.find((a) => a.id === 'bodyIcon')
    expect(icon!.kind).toBe('cursorSquare')
    expect(icon!.box.x).toBeCloseTo(BODY_ICON.x, 6)
    expect(icon!.box.y).toBeCloseTo(BODY_ICON.y, 6)
    expect(icon!.box.w).toBeCloseTo(BODY_ICON.w, 6)
    expect(icon!.box.h).toBeCloseTo(BODY_ICON.h, 6)
    expect(icon!.click).toBe(3)
    expect(icon!.delayMs).toBe(0)
    expect(icon!.glyph).toBeUndefined()
  })

  it('red strip at the measured band, click 4', () => {
    const l = specPanelLayout()
    const accent = l.accents.find((a) => a.id === 'redStrip')
    expect(accent!.kind).toBe('strip')
    expect(accent!.box.x).toBeCloseTo(RED_STRIP.x, 6)
    expect(accent!.box.y).toBeCloseTo(RED_STRIP.y, 6)
    expect(accent!.box.w).toBeCloseTo(RED_STRIP.w, 6)
    expect(accent!.box.h).toBeCloseTo(RED_STRIP.h, 6)
    expect(accent!.click).toBe(4)
    expect(accent!.delayMs).toBe(0)
    expect(accent!.glyph).toBeUndefined()
  })

  it('teal tile (smileTile) on click 5; the teal strip lands 200ms later (t4.667)', () => {
    const l = specPanelLayout()
    const strip = l.accents.find((a) => a.id === 'tealStrip')
    expect(strip!.kind).toBe('strip')
    expect(strip!.box.x).toBeCloseTo(TEAL_STRIP.x, 6)
    expect(strip!.box.y).toBeCloseTo(TEAL_STRIP.y, 6)
    expect(strip!.box.w).toBeCloseTo(TEAL_STRIP.w, 6)
    expect(strip!.box.h).toBeCloseTo(TEAL_STRIP.h, 6)
    expect(strip!.click).toBe(5)
    expect(strip!.delayMs).toBe(200)

    const tile = l.accents.find((a) => a.id === 'tealTile')
    expect(tile!.kind).toBe('smileTile')
    expect(tile!.box.x).toBeCloseTo(TEAL_TILE.x, 6)
    expect(tile!.box.y).toBeCloseTo(TEAL_TILE.y, 6)
    expect(tile!.box.w).toBeCloseTo(TEAL_TILE.w, 6)
    expect(tile!.box.h).toBeCloseTo(TEAL_TILE.h, 6)
    expect(tile!.click).toBe(5)
    expect(tile!.delayMs).toBe(0)
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
  it('STEP_SCHEDULE_SEC pins the reference onsets exactly', () => {
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

  it('the seed carries the OCR-read copy for every row id', () => {
    expect(SPEC_PANEL_SEED.status).toBe('data.mrk.shop/workspace')
    expect(SPEC_PANEL_SEED.statusTeal).toBe('AI ASSISTED')
    expect(SPEC_PANEL_SEED.heading).toBe('THE IMPORTANT SKILL')
    expect(SPEC_PANEL_SEED.bodyLine).toBe('USING AN AI TOOL')
    expect(SPEC_PANEL_SEED.redLine).toBe('ANYONE CAN OPEN THE PANEL')
    expect(SPEC_PANEL_SEED.tealLine).toBe('USING IT PROPERLY')
    expect(SPEC_PANEL_SEED.lastLine).toBe('KNOWING WHEN THE OUTPUT IS WRONG')
  })
})

describe('typography helpers', () => {
  it('specRowFont derives font size from the measured cap at the 0.730 ratio', () => {
    const l = specPanelLayout()
    expect(specRowFont(rowById(l.rows, 'status'))).toBeCloseTo(17.928 / 0.73, 6)
    expect(specRowFont(rowById(l.rows, 'statusTeal'))).toBeCloseTo(18.576 / 0.73, 6)
    expect(specRowFont(rowById(l.rows, 'heading'))).toBeCloseTo(21.924 / 0.73, 6)
    expect(specRowFont(rowById(l.rows, 'bodyLine'))).toBeCloseTo(34.02 / 0.73, 6)
    expect(specRowFont(rowById(l.rows, 'redLine'))).toBeCloseTo(17.928 / 0.73, 6)
    expect(specRowFont(rowById(l.rows, 'tealLine'))).toBeCloseTo(34.02 / 0.73, 6)
    expect(specRowFont(rowById(l.rows, 'lastLine'))).toBeCloseTo(18.036 / 0.73, 6)
  })

  it('specRowBaseline sits one cap below the measured band top plus the row nudge', () => {
    const l = specPanelLayout()
    const status = rowById(l.rows, 'status')
    // status carries the measured +2px (1.85 viewBox) cluster lag.
    expect(specRowBaseline(status)).toBeCloseTo(375.516 + 17.928 + 1.85, 6)
    const tealLine = rowById(l.rows, 'tealLine')
    // tealLine carries the measured −1px (0.9 viewBox) lag.
    expect(specRowBaseline(tealLine)).toBeCloseTo(749.952 + 34.02 + 0.9, 6)
  })

  it('specRowFont rejects a non-positive cap with RangeError', () => {
    const l = specPanelLayout()
    const status = rowById(l.rows, 'status')
    expect(() => specRowFont({ ...status, cap: 0 })).toThrow(RangeError)
    expect(() => specRowFont({ ...status, cap: -3 })).toThrow(RangeError)
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
    expect(l.statusGlyph.w).toBeCloseTo(STATUS_GLYPH.w / 2, 6)
    expect(l.title.inkWidth).toBeCloseTo(634.944 / 2, 6)
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
