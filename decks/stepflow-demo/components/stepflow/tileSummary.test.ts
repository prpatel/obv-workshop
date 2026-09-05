import { describe, expect, it } from 'vitest'
import {
  revealPlan,
  TILE_SUMMARY_BADGE_FILL,
  TILE_SUMMARY_BADGES,
  TILE_SUMMARY_GLYPHS,
  TILE_SUMMARY_LABEL_CONFIDENCE,
  TILE_SUMMARY_PLATE_FILL,
  TILE_SUMMARY_RX,
  TILE_SUMMARY_GLYPH_STROKE,
  TILE_SUMMARY_SEED,
  TILE_SUMMARY_SUMMARY_OPACITY,
  tileSummaryLayout,
} from './tileSummary'

// Hand-computed constants for the default 1920×1080 canvas, from the measured
// seg16 fractions (spec art_PIYfX5iM / brief art_ykOcZXIM §3; native 2560×1440
// settled_full.png scans cross-checked against the report.json event bboxes
// and the packet's colors.json; the settled gate is settled_full.png):
//   tiles   x 0.2277/0.4613/0.6953   w 0.0770/0.0774/0.0770   (×1920 px)
//   tiles   y 0.4014                 h 0.1458                 (×1080 px)
//   plates  w 0.1172  y 0.3542  h 0.2902   centered per tile center
//   rail    y 0.4701  h 0.00625; segs 0.3070–0.4613 (click 2) /
//           0.5410–0.6953 (click 3) / click 4 fills chevron→seg1, both gaps,
//           and the stub 0.7723–0.8385 (continuous settled rail, x 416–1607)
//   leftMark chevron apex (0.225521, 0.470370), arms x 0.213542 at
//           y 0.459259/0.483333, stroke 0.002865, click 1
//   vertical right x 0.8367 w 0.0031 (delay 0), y 0.4722 → 0.7715 — the
//           settled frame has NO left vertical
//   bar     x 0.31521 w 0.52191  y 0.7681 h 0.00556 (settled extent)
//   badges  three traced amber marks above the plates (y 0.3565–0.378)
//   labels  line1 y 0.5806 cap 0.0243 (ink 0.0824/0.0457/0.0449 — EXTRACT /
//           MOVE/LOAD), line2 y 0.6308 cap 0.0132 (ink 0.1172/0.1246/0.1730)
//   summary ink x 0.2969–0.7180  baseline 0.7958  cap 0.0208  ink 0.4211
//           (settles at the ~8% ghost)
//   header  lead 0.3016–0.4477  accent 0.4590–0.7004  cap band 0.0993–0.1486
const TILE_X = [432.0, 880.50048, 1329.50016]
const TILE_W = [157.49952, 158.00064, 157.00032]
const TILE_Y = 433.512
const TILE_H = 157.464
const CENTERS = [510.74976, 959.5008, 1408.00032]
const PLATE_X = [398.23776, 846.9888, 1295.48832]
const PLATE_W = 225.024
const PLATE_Y = 382.536
const PLATE_H = 313.416
const RAIL_Y = 507.708
const RAIL_H = 6.75
const VERT_Y = 509.976
const VERT_H = 323.244
const BAR = { x: 605.2032, y: 829.548, w: 1002.0672, h: 6.0048 }

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
    expect(l.tiles.map(t => t.label)).toEqual(['EXTRACT', 'MOVE', 'LOAD'])
    expect(l.tiles.map(t => t.sublabel)).toEqual([
      'OUT OF THE SOURCE',
      'ACROSS THE NETWORK',
      'STRAIGHT INTO THE WAREHOUSE',
    ])
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
  })

  it('tiles are square cards (≈158×157.5) — not the brief\'s 0.11w×0.17h guess', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    l.tiles.forEach((t, i) => {
      // The corrected row-scans land the cards square within AA tolerance
      // (|w − h| ≤ 0.75px) — the old 148×157 read clipped the AA edges.
      expect(Math.abs(t.w - t.h)).toBeLessThanOrEqual(0.75)
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
    expect(TILE_SUMMARY_PLATE_FILL).toBe('#040b0b')
  })

  it('glyph ink bands are per-tile, traced, and sit inside the tiles', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    const b0 = l.tiles[0]!.iconBox
    expect(b0.x).toBeCloseTo(432.0 + 0.2424 * 157.49952, 6)
    expect(b0.y).toBeCloseTo(TILE_Y + 0.3095 * TILE_H, 6)
    expect(b0.w).toBeCloseTo(0.5304 * 157.49952, 6)
    expect(b0.h).toBeCloseTo(0.3762 * TILE_H, 6)
    // Tile 2 is wider (0.2982/0.3981) and tile 3 taller (0.2476/0.4762) —
    // the shared-box approximation is gone.
    expect(l.tiles[1]!.iconBox.w).not.toBeCloseTo(b0.w, 3)
    expect(l.tiles[2]!.iconBox.h).not.toBeCloseTo(b0.h, 3)
    l.tiles.forEach((t) => {
      expect(t.iconBox.x).toBeGreaterThanOrEqual(t.x)
      expect(t.iconBox.x + t.iconBox.w).toBeLessThanOrEqual(t.x + t.w + 1e-6)
      expect(t.iconBox.y).toBeGreaterThanOrEqual(t.y)
      expect(t.iconBox.y + t.iconBox.h).toBeLessThanOrEqual(t.y + t.h + 1e-6)
    })
    expect(TILE_SUMMARY_RX).toBe(16.4)
  })

  it('traced glyph marks cover the seed ids; every line-1 read is confirmed', () => {
    for (const tile of TILE_SUMMARY_SEED) {
      expect(TILE_SUMMARY_GLYPHS[tile.id]).toBeTruthy()
      expect(TILE_SUMMARY_GLYPHS[tile.id]).toContain('<')
      expect(TILE_SUMMARY_LABEL_CONFIDENCE[tile.id as keyof typeof TILE_SUMMARY_LABEL_CONFIDENCE]).toBe('confirmed')
    }
  })
})

describe('tileSummaryLayout — chevron, rail, verticals, bar', () => {
  it('left terminus is an open chevron riding tile 1\'s click', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    expect(l.leftMark.strokeW).toBeCloseTo(0.002865 * 1920, 6)
    expect(l.leftMark.click).toBe(1)
    // Parsed numerically — the template renders full float precision.
    const pts = l.leftMark.points.split(' ').map(p => p.split(',').map(Number))
    expect(pts).toHaveLength(3)
    const [armTop, apex, armBottom] = pts
    expect(armTop![0]).toBeCloseTo(0.213542 * 1920, 6)
    expect(armTop![1]).toBeCloseTo(0.459259 * 1080, 6)
    expect(apex![0]).toBeCloseTo(0.225521 * 1920, 6)
    expect(apex![1]).toBeCloseTo(0.47037 * 1080, 6)
    expect(armBottom![0]).toBeCloseTo(0.213542 * 1920, 6)
    expect(armBottom![1]).toBeCloseTo(0.483333 * 1080, 6)
    // The apex points right of the arms (into tile 1's edge).
    expect(apex![0]).toBeGreaterThan(armTop![0])
  })

  it('glyph strokes render at the measured weight', () => {
    expect(TILE_SUMMARY_GLYPH_STROKE).toBe(1.6)
  })

  it('six rail segments fill the continuous settled rail (x 416–1607)', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    expect(l.rail).toHaveLength(6)
    const [seg1, seg2, gap0, gap1, seg3, stub] = l.rail
    expect(seg1!.x).toBeCloseTo(589.44, 6)
    expect(seg1!.w).toBeCloseTo(291.072, 6)
    expect(seg1!.click).toBe(2)
    expect(seg2!.x).toBeCloseTo(1038.72, 6)
    expect(seg2!.w).toBeCloseTo(290.688, 6)
    expect(seg2!.click).toBe(3)
    // The bracket beat fills the chevron→seg1 gap, both mid gaps, and the stub.
    expect(gap0!.x).toBeCloseTo(409.49952, 6)
    expect(gap0!.w).toBeCloseTo(179.94048, 6)
    expect(gap0!.click).toBe(4)
    expect(gap1!.x).toBeCloseTo(880.512, 6)
    expect(gap1!.w).toBeCloseTo(158.208, 6)
    expect(gap1!.click).toBe(4)
    expect(seg3!.x).toBeCloseTo(1329.408, 6)
    expect(seg3!.w).toBeCloseTo(153.408, 6)
    expect(seg3!.click).toBe(4)
    expect(stub!.x).toBeCloseTo(1482.816, 6)
    expect(stub!.w).toBeCloseTo(127.104, 6)
    expect(stub!.click).toBe(4)
    // Adjacent segments abut: the composed rail has no holes.
    const spans = [...l.rail].sort((a, b) => a.x - b.x)
    for (let i = 1; i < spans.length; i++) {
      expect(spans[i]!.x).toBeCloseTo(spans[i - 1]!.x + spans[i - 1]!.w, 6)
    }
    l.rail.forEach((seg) => {
      expect(seg.y).toBeCloseTo(RAIL_Y, 6)
      expect(seg.h).toBeCloseTo(RAIL_H, 6)
    })
  })

  it('the settled bracket has ONE leg (right) rising from the rail to the bar', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    expect(l.vertical.x).toBeCloseTo(1606.464, 6)
    expect(l.vertical.w).toBeCloseTo(5.952, 6)
    expect(l.vertical.y).toBeCloseTo(VERT_Y, 6)
    expect(l.vertical.h).toBeCloseTo(VERT_H, 6)
    expect(l.vertical.delayMs).toBe(0)
    // The leg starts inside the rail band (its upper half, measured) and
    // dies inside the bar.
    expect(l.vertical.y).toBeGreaterThanOrEqual(RAIL_Y)
    expect(l.vertical.y).toBeLessThanOrEqual(RAIL_Y + RAIL_H)
    expect(l.vertical.y + l.vertical.h).toBeGreaterThan(BAR.y)
  })

  it('the settled bar runs from x 0.31521 and dies inside the right leg', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    expect(l.bar.x).toBeCloseTo(BAR.x, 6)
    expect(l.bar.y).toBeCloseTo(BAR.y, 6)
    expect(l.bar.w).toBeCloseTo(BAR.w, 6)
    expect(l.bar.h).toBeCloseTo(BAR.h, 6)
    // The settled bar's right end stops inside the leg's span (settled_full
    // rows 830–835 end at x≈1612; the leg spans 1606.5–1612.4).
    expect(l.bar.x).toBeLessThan(l.vertical.x)
    expect(l.bar.x + l.bar.w).toBeGreaterThan(l.vertical.x)
    expect(l.bar.x + l.bar.w).toBeLessThanOrEqual(l.vertical.x + l.vertical.w + 1e-6)
  })
})

describe('tileSummaryLayout — badges and summary ghost', () => {
  it('three traced amber badges ride their tile\'s wave', () => {
    expect(TILE_SUMMARY_BADGES).toHaveLength(3)
    expect(TILE_SUMMARY_BADGE_FILL).toBe('#e6b62e')
    // Every badge is a row-run path in the plate-top zone (y 385–408).
    TILE_SUMMARY_BADGES.forEach((d, i) => {
      expect(d.startsWith('M')).toBe(true)
      const l = tileSummaryLayout(TILE_SUMMARY_SEED)
      expect(l.badges[i]!.click).toBe(i + 1)
      expect(l.badges[i]!.path).toBe(d)
      const ys = [...d.matchAll(/V([\d.]+)/g)].map(m => Number(m[1]))
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(384)
      expect(Math.max(...ys)).toBeLessThanOrEqual(409)
    })
  })

  it('the summary settles at the measured ~8% ghost opacity', () => {
    expect(TILE_SUMMARY_SUMMARY_OPACITY).toBeCloseTo(0.08, 6)
  })
})

describe('tileSummaryLayout — typography', () => {
  it('label line 1 lands on the measured cap band with per-tile pinned ink', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    const inks = [158.208, 87.744, 86.208]
    l.tiles.forEach((t, i) => {
      expect(t.labelBox.centerX).toBeCloseTo(CENTERS[i]!, 6)
      expect(t.labelBox.baseline).toBeCloseTo(0.5806 * 1080 + 26.244, 6)
      expect(t.labelBox.capHeight).toBeCloseTo(26.244, 6)
      expect(t.labelBox.inkW).toBeCloseTo(inks[i]!, 6)
    })
  })

  it('label line 2 carries per-tile measured ink on the seed', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    const inks = [225.024, 239.232, 332.16]
    l.tiles.forEach((t, i) => {
      expect(t.sublabelBox).toBeDefined()
      expect(t.sublabelBox!.centerX).toBeCloseTo(CENTERS[i]!, 6)
      expect(t.sublabelBox!.baseline).toBeCloseTo(0.6308 * 1080 + 14.256, 6)
      expect(t.sublabelBox!.capHeight).toBeCloseTo(14.256, 6)
      expect(t.sublabelBox!.inkW).toBeCloseTo(inks[i]!, 6)
    })
    // A tile without a sublabel still omits line 2 entirely.
    const bare = tileSummaryLayout([{ id: 'a', label: 'A', xFrac: 0.2277, wFrac: 0.077 }])
    expect(bare.tiles[0]!.sublabelBox).toBeUndefined()
  })

  it('the summary line uses the f0030 ghost box, independent of copy', () => {
    const l = tileSummaryLayout(TILE_SUMMARY_SEED)
    expect(l.summaryBox.centerX).toBeCloseTo(974.304, 6)
    expect(l.summaryBox.baseline).toBeCloseTo(859.464, 6)
    expect(l.summaryBox.capHeight).toBeCloseTo(22.464, 6)
    expect(l.summaryBox.inkW).toBeCloseTo(808.512, 6)
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
    expect(l.tiles[0]!.x).toBeCloseTo(432.0 * 2 / 3, 6)
    expect(l.tiles[0]!.w).toBeCloseTo(157.49952 * 2 / 3, 6)
    expect(l.tiles[0]!.y).toBeCloseTo(433.512 * 2 / 3, 6)
    expect(l.tiles[0]!.h).toBeCloseTo(157.464 * 2 / 3, 6)
    expect(l.bar.w).toBeCloseTo(1002.0672 * 2 / 3, 6)
    expect(l.summaryBox.baseline).toBeCloseTo(859.464 * 2 / 3, 6)
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
