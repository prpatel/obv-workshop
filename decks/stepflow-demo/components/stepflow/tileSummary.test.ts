import { describe, expect, it } from 'vitest'
import {
  revealPlan,
  TILE_SUMMARY_PLATE_FILL,
  TILE_SUMMARY_RX,
  TILE_SUMMARY_SEED,
  tileSummaryLayout,
} from './tileSummary'

// Hand-computed constants for the default 1920×1080 canvas, from the measured
// seg16 fractions (spec art_PIYfX5iM / brief art_ykOcZXIM §3; full-res settled
// frame scans cross-checked against the report.json event bboxes):
//   tiles   x 0.2277/0.4613/0.6953   w 0.0770/0.0774/0.0770   (×1920 px)
//   tiles   y 0.4014                 h 0.1458                 (×1080 px)
//   plates  w 0.1172  y 0.3542  h 0.2902   centered per tile center
//   rail    y 0.4646  h 0.0167; segs 0.1992–0.2277 / 0.3070–0.4613 /
//           0.5410–0.6953 / 0.7723–0.8352 (clicks 4/2/3/4)
//   verticals left x 0.1945 w 0.0032 (delay 200ms), right x 0.8369 w 0.0030
//           (delay 0), y 0.4813 → 0.7694
//   bar     x 0.2000 w 0.6336  y 0.7694 h 0.0042
//   labels  line1 y 0.5806 cap 0.0243 (ink 0.0820/0.0910/0.0508),
//           line2 y 0.6308 cap 0.0132 (ink 0.0902)
//   summary ink center 0.4988  baseline 0.7944  cap 0.0152  ink 0.2148
//   header  lead 0.3016–0.4477  accent 0.4590–0.7004  cap band 0.0993–0.1486
const TILE_X = [437.184, 885.696, 1334.976]
const TILE_W = [147.84, 148.608, 147.84]
const TILE_Y = 433.512
const TILE_H = 157.464
const CENTERS = [511.104, 960, 1408.896]
const PLATE_X = [398.592, 847.488, 1296.384]
const PLATE_W = 225.024
const PLATE_Y = 382.536
const PLATE_H = 313.416
const RAIL_Y = 501.768
const RAIL_H = 18.036
const VERT_Y = 519.804
const VERT_H = 311.148
const BAR = { x: 384, y: 830.952, w: 1216.512, h: 4.536 }

describe('tileSummaryLayout — measured tile row', () => {
  it('seed: three tiles on the measured rhythm, hand-computed to 1e-6', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    expect(l.tiles).toHaveLength(3)
    l.tiles.forEach((t, i) => {
      expect(t.x).toBeCloseTo(TILE_X[i]!, 6)
      expect(t.y).toBeCloseTo(TILE_Y, 6)
      expect(t.w).toBeCloseTo(TILE_W[i]!, 6)
      expect(t.h).toBeCloseTo(TILE_H, 6)
      expect(t.click).toBe(i + 1)
    })
    expect(l.tiles.map(t => t.label)).toEqual(['EXTRACT', 'TRANSFORM', 'LOAD'])
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
  })

  it('tiles are taller than wide (148×157) — not the brief\'s 0.11w×0.17h guess', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    l.tiles.forEach((t, i) => {
      expect(t.h).toBeGreaterThan(t.w)
      expect(t.h / t.w).toBeCloseTo(TILE_H / TILE_W[i]!, 6)
    })
  })

  it('near-black plates back each tile, centered on its center at the measured band', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    l.tiles.forEach((t, i) => {
      expect(t.plate.x).toBeCloseTo(PLATE_X[i]!, 6)
      expect(t.plate.y).toBeCloseTo(PLATE_Y, 6)
      expect(t.plate.w).toBeCloseTo(PLATE_W, 6)
      expect(t.plate.h).toBeCloseTo(PLATE_H, 6)
      // Centered: plate center equals tile center.
      expect(t.plate.x + t.plate.w / 2).toBeCloseTo(t.x + t.w / 2, 6)
      // The plate top sits above the tile top.
      expect(t.plate.y).toBeLessThan(t.y)
    })
    // The plate spans tile + both label bands: y 0.3542–0.6444 covers the
    // 0.4014–0.5472 tiles and the 0.5806–0.6440 label ink.
    expect(PLATE_Y).toBeLessThan(TILE_Y)
    expect(PLATE_Y + PLATE_H).toBeCloseTo(0.6444 * 1080, 6)
    expect(TILE_SUMMARY_PLATE_FILL).toBe('#0c0d0c')
  })

  it('glyph ink band sits inside the tile at the measured fractions', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    const box = l.tiles[0]!.iconBox
    expect(box.x).toBeCloseTo(437.184 + 0.15 * 147.84, 6)
    expect(box.y).toBeCloseTo(TILE_Y + 0.2 * TILE_H, 6)
    expect(box.w).toBeCloseTo(0.7 * 147.84, 6)
    expect(box.h).toBeCloseTo(0.55 * TILE_H, 6)
    expect(TILE_SUMMARY_RX).toBe(16.4)
  })
})

describe('tileSummaryLayout — rail, verticals, bar', () => {
  it('four rail segments at the measured spans with their reveal clicks', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    expect(l.rail).toHaveLength(4)
    const [leftStub, seg1, seg2, rightStub] = l.rail
    expect(leftStub!.x).toBeCloseTo(382.464, 6)
    expect(leftStub!.w).toBeCloseTo(54.72, 6)
    expect(leftStub!.click).toBe(4)
    expect(seg1!.x).toBeCloseTo(589.44, 6)
    expect(seg1!.w).toBeCloseTo(296.256, 6)
    expect(seg1!.click).toBe(2)
    expect(seg2!.x).toBeCloseTo(1038.72, 6)
    expect(seg2!.w).toBeCloseTo(296.256, 6)
    expect(seg2!.click).toBe(3)
    expect(rightStub!.x).toBeCloseTo(1482.816, 6)
    expect(rightStub!.w).toBeCloseTo(120.768, 6)
    expect(rightStub!.click).toBe(4)
    l.rail.forEach((seg) => {
      expect(seg.y).toBeCloseTo(RAIL_Y, 6)
      expect(seg.h).toBeCloseTo(RAIL_H, 6)
    })
  })

  it('bracket legs rise from the rail to the bar at x≈0.196/0.838', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    expect(l.verticals.left.x).toBeCloseTo(373.44, 6)
    expect(l.verticals.left.w).toBeCloseTo(6.144, 6)
    expect(l.verticals.left.y).toBeCloseTo(VERT_Y, 6)
    expect(l.verticals.left.h).toBeCloseTo(VERT_H, 6)
    expect(l.verticals.left.delayMs).toBe(200)
    expect(l.verticals.right.x).toBeCloseTo(1606.848, 6)
    expect(l.verticals.right.w).toBeCloseTo(5.76, 6)
    expect(l.verticals.right.y).toBeCloseTo(VERT_Y, 6)
    expect(l.verticals.right.h).toBeCloseTo(VERT_H, 6)
    expect(l.verticals.right.delayMs).toBe(0)
    // Both legs span rail bottom → bar top.
    expect(l.verticals.left.y).toBeCloseTo(RAIL_Y + RAIL_H, 6)
    expect(l.verticals.left.h).toBeCloseTo(BAR.y - (RAIL_Y + RAIL_H), 6)
  })

  it('bottom bar spans the verticals at the measured hairline band', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    expect(l.bar.x).toBeCloseTo(BAR.x, 6)
    expect(l.bar.y).toBeCloseTo(BAR.y, 6)
    expect(l.bar.w).toBeCloseTo(BAR.w, 6)
    expect(l.bar.h).toBeCloseTo(BAR.h, 6)
    // Bar ends sit inside the verticals' x-extents (the bracket closes).
    expect(l.bar.x).toBeGreaterThan(l.verticals.left.x)
    expect(l.bar.x + l.bar.w).toBeLessThan(l.verticals.right.x + l.verticals.right.w)
  })
})

describe('tileSummaryLayout — typography', () => {
  it('label line 1 lands on the measured cap band with per-tile pinned ink', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    const inks = [157.44, 174.72, 97.536]
    l.tiles.forEach((t, i) => {
      expect(t.labelBox.centerX).toBeCloseTo(CENTERS[i]!, 6)
      expect(t.labelBox.baseline).toBeCloseTo(0.5806 * 1080 + 26.244, 6)
      expect(t.labelBox.capHeight).toBeCloseTo(26.244, 6)
      expect(t.labelBox.inkW).toBeCloseTo(inks[i]!, 6)
    })
  })

  it('label line 2 and the summary line resolve only with copy', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    // No sublabel on the seed → no line-2 geometry.
    l.tiles.forEach(t => expect(t.sublabelBox).toBeUndefined())
    const withSub = tileSummaryLayout([
      { id: 'a', label: 'A', xFrac: 0.2277, wFrac: 0.077, sublabel: 'sub' },
    ])
    const sub = withSub.tiles[0]!.sublabelBox
    expect(sub!.baseline).toBeCloseTo(0.6308 * 1080 + 14.256, 6)
    expect(sub!.capHeight).toBeCloseTo(14.256, 6)
    expect(sub!.inkW).toBeCloseTo(173.184, 6)
    // Summary box is measured geometry, independent of copy.
    expect(l.summaryBox.centerX).toBeCloseTo(957.696, 6)
    expect(l.summaryBox.baseline).toBeCloseTo(857.952, 6)
    expect(l.summaryBox.capHeight).toBeCloseTo(16.416, 6)
    expect(l.summaryBox.inkW).toBeCloseTo(412.416, 6)
  })

  it('header pins the two-tone split at the shared measured baseline', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    expect(l.header.lead.x).toBeCloseTo(579.072, 6)
    expect(l.header.lead.w).toBeCloseTo(280.512, 6)
    expect(l.header.accent.x).toBeCloseTo(881.28, 6)
    expect(l.header.accent.w).toBeCloseTo(463.488, 6)
    expect(l.header.capTop).toBeCloseTo(107.244, 6)
    expect(l.header.baseline).toBeCloseTo(160.488, 6)
    expect(l.header.capHeight).toBeCloseTo(53.244, 6)
    // Font size derives from the cap through the deck's 0.730 ratio.
    expect(l.header.capHeight / 0.73).toBeCloseTo(72.936986, 6)
  })
})

describe('tileSummaryLayout — options and validation', () => {
  it('honors a custom canvas: 1280×720 rescales every derived length', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED, { width: 1280, height: 720 })
    expect(l.tiles[0]!.x).toBeCloseTo(437.184 * 2 / 3, 6)
    expect(l.tiles[0]!.w).toBeCloseTo(147.84 * 2 / 3, 6)
    expect(l.tiles[0]!.y).toBeCloseTo(433.512 * 2 / 3, 6)
    expect(l.tiles[0]!.h).toBeCloseTo(157.464 * 2 / 3, 6)
    expect(l.bar.w).toBeCloseTo(1216.512 * 2 / 3, 6)
    expect(l.summaryBox.baseline).toBeCloseTo(857.952 * 2 / 3, 6)
    expect(l.viewBox).toEqual({ width: 1280, height: 720 })
  })

  it('rejects an empty tile list with RangeError', () => {
    expect(() => tileSummaryLayout([])).toThrow(RangeError)
  })

  it('rejects fractions outside [0, 1] and non-finite values with RangeError', () => {
    expect(() => tileSummaryLayout([{ id: 'a', label: 'A', xFrac: -0.1, wFrac: 0.077 }])).toThrow(RangeError)
    expect(() => tileSummaryLayout([{ id: 'a', label: 'A', xFrac: 1.1, wFrac: 0.077 }])).toThrow(RangeError)
    expect(() => tileSummaryLayout([{ id: 'a', label: 'A', xFrac: Number.NaN, wFrac: 0.077 }])).toThrow(RangeError)
    expect(() => tileSummaryLayout([{ id: 'a', label: 'A', xFrac: 0.2277, wFrac: Number.POSITIVE_INFINITY }])).toThrow(RangeError)
  })

  it('rejects zero-width tiles, blank ids, and blank labels with RangeError', () => {
    expect(() => tileSummaryLayout([{ id: 'a', label: 'A', xFrac: 0.2, wFrac: 0 }])).toThrow(RangeError)
    expect(() => tileSummaryLayout([{ id: '', label: 'A', xFrac: 0.2, wFrac: 0.077 }])).toThrow(RangeError)
    expect(() => tileSummaryLayout([{ id: 'a', label: '', xFrac: 0.2, wFrac: 0.077 }])).toThrow(RangeError)
  })

  it('rejects non-positive viewBoxes with RangeError', () => {
    expect(() => tileSummaryLayout(TILE_SUMMARY_SEED, { width: 0 })).toThrow(RangeError)
    expect(() => tileSummaryLayout(TILE_SUMMARY_SEED, { height: -720 })).toThrow(RangeError)
  })

  it('is byte-identical across runs for the same inputs', () => {
    const a = JSON.stringify(tileSummaryLayout(TILE_SUMMARY_SEED))
    const b = JSON.stringify(tileSummaryLayout(TILE_SUMMARY_SEED))
    expect(a).toBe(b)
  })

  it('the seed layout snapshot is stable across runs', () => {
    expect(tileSummaryLayout(TILE_SUMMARY_SEED)).toMatchSnapshot()
  })
})

describe('revealPlan — the locked four-click contract', () => {
  it('one wave per tile, bracket on the closing beat, 4 total', () => {
    const plan = revealPlan(TILE_SUMMARY_SEED)
    expect(plan.tileClicks).toEqual([1, 2, 3])
    expect(plan.bracketClick).toBe(4)
    expect(plan.totalClicks).toBe(4)
    expect(plan.summaryDelaySec).toBeCloseTo(0.266, 6)
  })

  it('omitting the summary copy keeps the bracket beat (still 4 clicks)', () => {
    const plan = revealPlan(TILE_SUMMARY_SEED, false)
    expect(plan.totalClicks).toBe(4)
    expect(plan.summaryDelaySec).toBe(0)
  })

  it('rejects an empty tile list with RangeError', () => {
    expect(() => revealPlan([])).toThrow(RangeError)
  })
})
