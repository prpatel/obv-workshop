import { describe, expect, it } from 'vitest'
import {
  CORE_FILL,
  PLATE_FILL,
  REVEAL_BEATS_SEC,
  ROW_IDS,
  compareBadgeLayout,
} from './compareBadge'

/**
 * Every expected number below is hand-computed from the settled-frame
 * measurements documented in compareBadge.ts: native 2560×1440 constants
 * scaled by 0.75 onto the default 1920×1080 stage (e.g. left plate
 * x = 314 × 0.75 = 235.5; bright cap = 36 × 0.75 = 27). Assertions use
 * toBeCloseTo(…, 6): the /1440×1080 scalings are not all exactly
 * representable in binary floating point.
 */
describe('compareBadgeLayout — measured seg12 composition', () => {
  it('resolves the four plate rows in alternating reveal order on the default stage', () => {
    const l = compareBadgeLayout()
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
    expect(l.rows.map((r) => r.id)).toEqual(['leftTop', 'rightTop', 'leftBottom', 'rightBottom'])
    expect(ROW_IDS).toEqual(['leftTop', 'rightTop', 'leftBottom', 'rightBottom'])

    // Plates: 664×172/171 native → 498×129/128.25, margins 314 → 235.5.
    const expectedPlates = [
      { x: 235.5, y: 432, w: 498, h: 129 },
      { x: 1186.5, y: 432, w: 498, h: 129 },
      { x: 235.5, y: 742.5, w: 498, h: 128.25 },
      { x: 1186.5, y: 742.5, w: 498, h: 128.25 },
    ]
    for (const [i, e] of expectedPlates.entries()) {
      expect(l.rows[i]!.plate.x).toBeCloseTo(e.x, 6)
      expect(l.rows[i]!.plate.y).toBeCloseTo(e.y, 6)
      expect(l.rows[i]!.plate.w).toBeCloseTo(e.w, 6)
      expect(l.rows[i]!.plate.h).toBeCloseTo(e.h, 6)
    }

    // Icon glyph boxes inside the plates (measured colored-bits bboxes).
    const expectedIcons = [
      { x: 267, y: 472.5, w: 51, h: 47.25 },
      { x: 1215, y: 472.5, w: 60, h: 47.25 },
      { x: 267, y: 784.5, w: 63, h: 43.5 },
      { x: 1215, y: 772.5, w: 61.5, h: 57.75 },
    ]
    for (const [i, e] of expectedIcons.entries()) {
      expect(l.rows[i]!.icon.x).toBeCloseTo(e.x, 6)
      expect(l.rows[i]!.icon.y).toBeCloseTo(e.y, 6)
      expect(l.rows[i]!.icon.w).toBeCloseTo(e.w, 6)
      expect(l.rows[i]!.icon.h).toBeCloseTo(e.h, 6)
    }
  })

  it('pins the measured text bands: 27px bright caps and 15px dim x-heights', () => {
    const l = compareBadgeLayout()
    // Bright rows: cap band 36 native → 27, cap tops 622/1036 → 466.5/777.
    for (const [i, capTop] of [466.5, 466.5, 777, 777].entries()) {
      expect(l.rows[i]!.bright.topY).toBeCloseTo(capTop, 6)
      expect(l.rows[i]!.bright.bandHeight).toBeCloseTo(27, 6)
      expect(l.rows[i]!.bright.baseline).toBeCloseTo(capTop + 27, 6)
    }
    // Dim rows: x-height band 20 native → 15, tops 690/1104 → 517.5/828.
    for (const [i, xTop] of [517.5, 517.5, 828, 828].entries()) {
      expect(l.rows[i]!.dim.topY).toBeCloseTo(xTop, 6)
      expect(l.rows[i]!.dim.bandHeight).toBeCloseTo(15, 6)
      expect(l.rows[i]!.dim.baseline).toBeCloseTo(xTop + 15, 6)
    }
    // Line ink starts: x 468 (left) / 1736 (right) native → 351/1302.
    for (const [i, inkStart] of [351, 1302, 351, 1302].entries()) {
      expect(l.rows[i]!.bright.x).toBeCloseTo(inkStart, 6)
      expect(l.rows[i]!.dim.x).toBeCloseTo(inkStart, 6)
    }
  })

  it('resolves badge halo, core, glyph, and leader geometry', () => {
    const l = compareBadgeLayout()
    // Halo: r 163 native at (1281, 839) → (960.75, 629.25) r 122.25.
    expect(l.halo.cx).toBeCloseTo(960.75, 6)
    expect(l.halo.cy).toBeCloseTo(629.25, 6)
    expect(l.halo.r).toBeCloseTo(122.25, 6)
    // Core: report orange[0] bbox (1152, 715, 261×245, corner 30) × 0.75.
    expect(l.core.x).toBeCloseTo(864, 6)
    expect(l.core.y).toBeCloseTo(536.25, 6)
    expect(l.core.w).toBeCloseTo(195.75, 6)
    expect(l.core.h).toBeCloseTo(183.75, 6)
    expect(l.core.corner).toBeCloseTo(22.5, 6)
    // Dark glyph zone inside the core (1230, 784, 115×112) × 0.75.
    expect(l.glyph.x).toBeCloseTo(922.5, 6)
    expect(l.glyph.y).toBeCloseTo(588, 6)
    expect(l.glyph.w).toBeCloseTo(86.25, 6)
    expect(l.glyph.h).toBeCloseTo(84, 6)
    // Leaders: outer tips (±297, ∓175), inner tips (±161, ±94) native.
    const expectedLeaders = [
      { x1: 738, y1: 498, x2: 840, y2: 558.75 },
      { x1: 1183.5, y1: 498, x2: 1081.5, y2: 558.75 },
      { x1: 738, y1: 760.5, x2: 840, y2: 699.75 },
      { x1: 1183.5, y1: 760.5, x2: 1081.5, y2: 699.75 },
    ]
    for (const [i, e] of expectedLeaders.entries()) {
      expect(l.leaders[i]!.x1).toBeCloseTo(e.x1, 6)
      expect(l.leaders[i]!.y1).toBeCloseTo(e.y1, 6)
      expect(l.leaders[i]!.x2).toBeCloseTo(e.x2, 6)
      expect(l.leaders[i]!.y2).toBeCloseTo(e.y2, 6)
    }
  })

  it('keeps the composition symmetric around its measured centers', () => {
    const l = compareBadgeLayout()
    const { cx, cy } = l.halo
    // Plates mirror around the STAGE center (frame margins are equal, 314px
    // native on each side). The halo sits 1px right of the frame center —
    // its own measured center, not the plate mirror axis.
    expect(l.rows[0]!.plate.x + l.rows[1]!.plate.x + l.rows[1]!.plate.w).toBeCloseTo(1920, 6)
    expect(l.rows[2]!.plate.x + l.rows[3]!.plate.x + l.rows[3]!.plate.w).toBeCloseTo(1920, 6)
    // Leaders mirror across both axes around the halo center.
    expect(l.leaders[0]!.x1 + l.leaders[1]!.x1).toBeCloseTo(2 * cx, 6)
    expect(l.leaders[2]!.x1 + l.leaders[3]!.x1).toBeCloseTo(2 * cx, 6)
    expect(l.leaders[0]!.y1).toBeCloseTo(2 * cy - l.leaders[2]!.y1, 6)
    expect(l.leaders[0]!.y2).toBeCloseTo(2 * cy - l.leaders[2]!.y2, 6)
    expect(l.leaders[0]!.x2).toBeCloseTo(l.leaders[2]!.x2, 6)
    // Plates hug the stage edges symmetrically.
    expect(l.rows[0]!.plate.x).toBeCloseTo(1920 - (l.rows[1]!.plate.x + l.rows[1]!.plate.w), 6)
  })

  it('scales the composition to an arbitrary canvas', () => {
    const l = compareBadgeLayout({ width: 1280, height: 720 })
    // ×0.5: core (1152, 715, 261×245, 30) → (576, 357.5, 130.5×122.5, 15).
    expect(l.core.x).toBeCloseTo(576, 6)
    expect(l.core.y).toBeCloseTo(357.5, 6)
    expect(l.core.w).toBeCloseTo(130.5, 6)
    expect(l.core.h).toBeCloseTo(122.5, 6)
    expect(l.core.corner).toBeCloseTo(15, 6)
    expect(l.halo.cx).toBeCloseTo(640.5, 6)
    expect(l.halo.cy).toBeCloseTo(419.5, 6)
    expect(l.halo.r).toBeCloseTo(81.5, 6)
    expect(l.rows[0]!.plate.x).toBeCloseTo(157, 6)
    expect(l.rows[0]!.plate.y).toBeCloseTo(288, 6)
    expect(l.rows[0]!.plate.w).toBeCloseTo(332, 6)
    expect(l.rows[0]!.plate.h).toBeCloseTo(86, 6)
    expect(l.rows[0]!.bright.x).toBeCloseTo(234, 6)
    expect(l.rows[0]!.bright.topY).toBeCloseTo(311, 6)
    expect(l.rows[0]!.bright.bandHeight).toBeCloseTo(18, 6)
    expect(l.rows[0]!.bright.baseline).toBeCloseTo(329, 6)
  })

  it('keeps plate fill near-black per V-3 (luma 6–40, not gray)', () => {
    const n = parseInt(PLATE_FILL.slice(1), 16)
    const r = (n >> 16) & 0xff
    const g = (n >> 8) & 0xff
    const b = n & 0xff
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
    // #12131a → luma ≈ 19.29: inside the measured near-black band.
    expect(luma).toBeGreaterThanOrEqual(6)
    expect(luma).toBeLessThanOrEqual(40)
  })

  it('pins the settled core sample to the exact deck orange', () => {
    expect(CORE_FILL).toBe('#f85721')
  })

  it('reveals the badge on click 1 and the waves on clicks 2–5', () => {
    const l = compareBadgeLayout()
    expect(l.rows.map((r) => r.click)).toEqual([2, 3, 4, 5])
  })

  it('drafts a five-beat schedule covering every click', () => {
    expect(REVEAL_BEATS_SEC).toEqual([0.6, 1.0, 1.73, 3.0, 4.4])
    for (let i = 1; i < REVEAL_BEATS_SEC.length; i += 1) {
      expect(REVEAL_BEATS_SEC[i]!).toBeGreaterThan(REVEAL_BEATS_SEC[i - 1]!)
    }
  })

  it('rejects invalid canvas dimensions with RangeError', () => {
    expect(() => compareBadgeLayout({ width: 0 })).toThrow(RangeError)
    expect(() => compareBadgeLayout({ width: -1920 })).toThrow(RangeError)
    expect(() => compareBadgeLayout({ height: 0 })).toThrow(RangeError)
    expect(() => compareBadgeLayout({ height: -1 })).toThrow(RangeError)
    expect(() => compareBadgeLayout({ width: Number.NaN })).toThrow(RangeError)
    expect(() => compareBadgeLayout({ width: Number.POSITIVE_INFINITY })).toThrow(RangeError)
  })

  it('is byte-identical across runs for the same inputs', () => {
    const a = JSON.stringify(compareBadgeLayout())
    const b = JSON.stringify(compareBadgeLayout())
    expect(a).toBe(b)
  })

  it('default layout snapshot is stable across runs', () => {
    expect(compareBadgeLayout()).toMatchSnapshot()
  })
})
