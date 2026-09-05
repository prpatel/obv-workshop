import { describe, expect, it } from 'vitest'
import {
  CORE_FILL,
  PLATE_EDGE,
  PLATE_FILL,
  REVEAL_BEATS_SEC,
  ROW_IDS,
  SEG12_INK,
  compareBadgeLayout,
} from './compareBadge'

/**
 * Every expected number below is hand-computed from the settled-frame
 * measurements documented in compareBadge.ts: native 2560×1440 constants
 * scaled by 0.75 onto the default 1920×1080 stage (e.g. left plate
 * x = 310 × 0.75 = 232.5; bright cap = 38 × 0.75 = 28.5). Assertions use
 * toBeCloseTo(…, 6): the /1440×1080 scalings are not all exactly
 * representable in binary floating point.
 *
 * SEG12_INK tests parse the traced path data with a small coordinate
 * regex — the tracer emits `Mx,yLx,y…Z` stage-unit subpaths — so ink
 * extents are checked against the measured boxes without re-running
 * OpenCV.
 */
describe('compareBadgeLayout — measured seg12 composition', () => {
  it('resolves the four plate rows in alternating reveal order on the default stage', () => {
    const l = compareBadgeLayout()
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
    expect(l.rows.map((r) => r.id)).toEqual(['leftTop', 'rightTop', 'leftBottom', 'rightBottom'])
    expect(ROW_IDS).toEqual(['leftTop', 'rightTop', 'leftBottom', 'rightBottom'])

    // Plates: 668/666 × 176/177 native (border line included) → 501/499.5
    // × 132/132.75, margins 310 native → 232.5 (right column margin 312).
    const expectedPlates = [
      { x: 232.5, y: 430.5, w: 501, h: 132 },
      { x: 1186.5, y: 430.5, w: 499.5, h: 132 },
      { x: 232.5, y: 739.5, w: 501, h: 132.75 },
      { x: 1186.5, y: 739.5, w: 499.5, h: 132.75 },
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

  it('pins the measured text bands: 28.5px bright caps and 13.125px dim x-heights', () => {
    const l = compareBadgeLayout()
    // Bright rows: cap band 38 native → 28.5, cap tops 621/1035 → 465.75/776.25.
    for (const [i, capTop] of [465.75, 465.75, 776.25, 776.25].entries()) {
      expect(l.rows[i]!.bright.topY).toBeCloseTo(capTop, 6)
      expect(l.rows[i]!.bright.bandHeight).toBeCloseTo(28.5, 6)
      expect(l.rows[i]!.bright.baseline).toBeCloseTo(capTop + 28.5, 6)
    }
    // Dim rows: x-height band 17.5 native → 13.125, tops 691/1104 → 518.25/828.
    for (const [i, xTop] of [518.25, 518.25, 828, 828].entries()) {
      expect(l.rows[i]!.dim.topY).toBeCloseTo(xTop, 6)
      expect(l.rows[i]!.dim.bandHeight).toBeCloseTo(13.125, 6)
      expect(l.rows[i]!.dim.baseline).toBeCloseTo(xTop + 13.125, 6)
    }
    // Line ink starts: x 468 (left) / 1736 (right) native → 351/1302.
    for (const [i, inkStart] of [351, 1302, 351, 1302].entries()) {
      expect(l.rows[i]!.bright.x).toBeCloseTo(inkStart, 6)
      expect(l.rows[i]!.dim.x).toBeCloseTo(inkStart, 6)
    }
  })

  it('resolves badge glow, core, glyph, and leader geometry', () => {
    const l = compareBadgeLayout()
    // Radial glow: r 190 native at the core center (1280.5, 840) →
    // (960.375, 630) r 142.5; the Vue renders it as a gradient peaking at
    // the core edge (HALO_PEAK_FRAC), not a hard-edged circle.
    expect(l.halo.cx).toBeCloseTo(960.375, 6)
    expect(l.halo.cy).toBeCloseTo(630, 6)
    expect(l.halo.r).toBeCloseTo(142.5, 6)
    // Core: settled scanline box (1155, 714, 251×247, corner 64) × 0.75.
    expect(l.core.x).toBeCloseTo(866.25, 6)
    expect(l.core.y).toBeCloseTo(535.5, 6)
    expect(l.core.w).toBeCloseTo(188.25, 6)
    expect(l.core.h).toBeCloseTo(185.25, 6)
    expect(l.core.corner).toBeCloseTo(48, 6)
    // Dark glyph zone inside the core (1228, 782, 106×116) × 0.75.
    expect(l.glyph.x).toBeCloseTo(921, 6)
    expect(l.glyph.y).toBeCloseTo(586.5, 6)
    expect(l.glyph.w).toBeCloseTo(79.5, 6)
    expect(l.glyph.h).toBeCloseTo(87, 6)
    // Three measured strokes (UL, UR, LL) — the settled frame has no
    // lower-right leader.
    const expectedLeaders = [
      { x1: 746.25, y1: 497.25, x2: 864.75, y2: 570 },
      { x1: 1183.5, y1: 495, x2: 1056, y2: 574.5 },
      { x1: 746.25, y1: 799.5, x2: 862.5, y2: 706.5 },
    ]
    expect(l.leaders).toHaveLength(3)
    for (const [i, e] of expectedLeaders.entries()) {
      expect(l.leaders[i]!.x1).toBeCloseTo(e.x1, 6)
      expect(l.leaders[i]!.y1).toBeCloseTo(e.y1, 6)
      expect(l.leaders[i]!.x2).toBeCloseTo(e.x2, 6)
      expect(l.leaders[i]!.y2).toBeCloseTo(e.y2, 6)
    }
  })

  it('anchors the leaders as measured (no 4-fold symmetry)', () => {
    const l = compareBadgeLayout()
    const [ul, ur, ll] = l.leaders
    // UL/LL outer tips align on one vertical (x 995 native); both hover
    // just right of the left plates' inner edge (x 733.5 stage).
    expect(ul!.x1).toBeCloseTo(ll!.x1, 6)
    expect(ul!.x1).toBeGreaterThan(l.rows[0]!.plate.x + l.rows[0]!.plate.w)
    expect(ul!.x1 - (l.rows[0]!.plate.x + l.rows[0]!.plate.w)).toBeLessThan(20)
    // UL ends at the core's left edge; LL ends near the core's bottom-left
    // corner.
    expect(ul!.x2).toBeGreaterThan(l.core.x - 4)
    expect(ll!.y2).toBeLessThan(l.core.y + l.core.h + 4)
    // UR starts 4px off the right plates' inner edge (x 1186.5 stage).
    expect(l.rows[1]!.plate.x - ur!.x1).toBeCloseTo(3, 6)
  })

  it('scales the composition to an arbitrary canvas', () => {
    const l = compareBadgeLayout({ width: 1280, height: 720 })
    // ×2/3: core (1155, 714, 251×247, 64) → (577.5, 357, 125.5×123.5, 32).
    expect(l.core.x).toBeCloseTo(577.5, 6)
    expect(l.core.y).toBeCloseTo(357, 6)
    expect(l.core.w).toBeCloseTo(125.5, 6)
    expect(l.core.h).toBeCloseTo(123.5, 6)
    expect(l.core.corner).toBeCloseTo(32, 6)
    expect(l.halo.cx).toBeCloseTo(640.25, 6)
    expect(l.halo.cy).toBeCloseTo(420, 6)
    expect(l.halo.r).toBeCloseTo(95, 6)
    expect(l.rows[0]!.plate.x).toBeCloseTo(155, 6)
    expect(l.rows[0]!.plate.y).toBeCloseTo(287, 6)
    expect(l.rows[0]!.plate.w).toBeCloseTo(334, 6)
    expect(l.rows[0]!.plate.h).toBeCloseTo(88, 6)
    expect(l.rows[0]!.bright.x).toBeCloseTo(234, 6)
    expect(l.rows[0]!.bright.topY).toBeCloseTo(310.5, 6)
    expect(l.rows[0]!.bright.bandHeight).toBeCloseTo(19, 6)
    expect(l.rows[0]!.bright.baseline).toBeCloseTo(329.5, 6)
  })

  it('keeps plate fill near-black per V-3 (luma 6–40, not gray)', () => {
    const luma = (hex: string) => {
      const n = parseInt(hex.slice(1), 16)
      return 0.2126 * ((n >> 16) & 0xff) + 0.7152 * ((n >> 8) & 0xff) + 0.0722 * (n & 0xff)
    }
    // #12131a → luma ≈ 19.29: inside the measured near-black band.
    expect(luma(PLATE_FILL)).toBeGreaterThanOrEqual(6)
    expect(luma(PLATE_FILL)).toBeLessThanOrEqual(40)
    // The plates' edge accent line reads brighter than the fill but dimmer
    // than the bright ink (settled edge median rgb(45,46,55)).
    expect(luma(PLATE_EDGE.coreColor)).toBeGreaterThan(luma(PLATE_FILL))
    expect(luma(PLATE_EDGE.coreColor)).toBeLessThanOrEqual(55)
  })

  it('pins the settled core sample to the exact deck orange', () => {
    expect(CORE_FILL).toBe('#f85721')
  })

  it('reveals the badge on click 1 and the waves on clicks 2–5', () => {
    const l = compareBadgeLayout()
    expect(l.rows.map((r) => r.click)).toEqual([2, 3, 4, 5])
  })

  it('pins the five-beat schedule covering every click', () => {
    expect(REVEAL_BEATS_SEC).toEqual([0.6, 1.0, 1.733, 3.0, 4.4])
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

/** Parse traced `Mx,yLx,y…Z` subpath data into a bounding box + subpath count. */
function pathBBox(d: string): { x0: number; y0: number; x1: number; y1: number; subpaths: number } {
  const coords = [...d.matchAll(/[ML](\d+(?:\.\d+)?),(\d+(?:\.\d+)?)/g)].map(
    (m) => [Number(m[1]), Number(m[2])] as const,
  )
  expect(coords.length).toBeGreaterThan(2)
  const xs = coords.map((c) => c[0]!)
  const ys = coords.map((c) => c[1]!)
  return {
    x0: Math.min(...xs),
    y0: Math.min(...ys),
    x1: Math.max(...xs),
    y1: Math.max(...ys),
    subpaths: (d.match(/M/g) ?? []).length,
  }
}

const HEX = /^#[0-9a-f]{6}$/

/** Union bounding box of one region's paint entries (skirt + core). */
function regionBBox(paths: { d: string }[]): ReturnType<typeof pathBBox> {
  const boxes = paths.map((p) => pathBBox(p.d))
  return {
    x0: Math.min(...boxes.map((b) => b.x0)),
    y0: Math.min(...boxes.map((b) => b.y0)),
    x1: Math.max(...boxes.map((b) => b.x1)),
    y1: Math.max(...boxes.map((b) => b.y1)),
    subpaths: boxes.reduce((n, b) => n + b.subpaths, 0),
  }
}

describe('SEG12_INK — traced settled reference ink', () => {
  it('carries the four title runs as skirt+core pairs (three white, one green)', () => {
    // Each run paints a 0.5-alpha AA-skirt contour, then the opaque core.
    expect(SEG12_INK.title).toHaveLength(8)
    for (const [i, run] of SEG12_INK.title.entries()) {
      expect(run.fill).toMatch(HEX)
      expect(run.d.startsWith('M')).toBe(true)
      expect(run.d.endsWith('Z')).toBe(true)
      if (i % 2 === 0) expect(run.opacity).toBe(0.5)
      else expect(run.opacity).toBeUndefined()
    }
    expect(SEG12_INK.title.filter((r) => r.fill === '#ffffff')).toHaveLength(6)
    expect(SEG12_INK.title[7]!.fill).toBe('#66fb00')
    expect(SEG12_INK.title[6]!.fill).toBe('#66fb00')
  })

  it('places title run ink at the measured extents (stage 1920×1080)', () => {
    // Native runs (692, 978, 1288, 1758) × 0.75 stage; extents from the
    // settled white-component scan. The tracer works on the downsampled
    // frame, so allow ~2px of resampling drift.
    const expected = [
      { x0: 519, x1: 713.25 },
      { x0: 733.5, x1: 943.5 },
      { x0: 966, x1: 1301.25 },
      { x0: 1318.5, x1: 1399.5 },
    ]
    for (const [i, e] of expected.entries()) {
      const bb = regionBBox([SEG12_INK.title[2 * i]!, SEG12_INK.title[2 * i + 1]!])
      expect(bb.x0).toBeGreaterThanOrEqual(e.x0 - 2.5)
      expect(bb.x0).toBeLessThanOrEqual(e.x0 + 2.5)
      expect(bb.x1).toBeGreaterThanOrEqual(e.x1 - 2.5)
      expect(bb.x1).toBeLessThanOrEqual(e.x1 + 2.5)
      // Title band: caps top 104, descenders to 175 stage.
      expect(bb.y0).toBeGreaterThanOrEqual(96)
      expect(bb.y1).toBeLessThanOrEqual(180)
    }
  })

  it('renders the top-right reference-only mark in olive + pale', () => {
    // Single-pass two-tone (the split that measured best against the frame).
    expect(SEG12_INK.mark.olive.map((r) => r.fill)).toEqual(['#71803f'])
    expect(SEG12_INK.mark.pale.map((r) => r.fill)).toEqual(['#b8bd9f'])
    const olive = regionBBox(SEG12_INK.mark.olive)
    const pale = regionBBox(SEG12_INK.mark.pale)
    // Mark box: x 1849–1901, y 0–60 on the settled frame.
    expect(olive.x0).toBeGreaterThanOrEqual(1845)
    expect(olive.x1).toBeLessThanOrEqual(1905)
    expect(pale.x0).toBeGreaterThanOrEqual(1845)
    expect(pale.x1).toBeLessThanOrEqual(1905)
    expect(Math.max(olive.y1, pale.y1)).toBeLessThanOrEqual(70)
  })

  it('carries bright + dim + icon ink for every row, sitting inside its plate', () => {
    const l = compareBadgeLayout()
    for (const [i, rid] of ROW_IDS.entries()) {
      const ink = SEG12_INK.rows[rid]
      const plate = l.rows[i]!.plate
      for (const piece of [ink.bright, ink.dim, ink.icon]) {
        expect(piece.length).toBe(2)
        for (const run of piece) {
          expect(run.fill).toMatch(HEX)
          expect(run.d.startsWith('M')).toBe(true)
          expect(run.d.endsWith('Z')).toBe(true)
          const bb = pathBBox(run.d)
          expect(bb.x0).toBeGreaterThanOrEqual(plate.x)
          expect(bb.x1).toBeLessThanOrEqual(plate.x + plate.w)
          expect(bb.y0).toBeGreaterThanOrEqual(plate.y - 2)
          expect(bb.y1).toBeLessThanOrEqual(plate.y + plate.h + 2)
        }
      }
      // Bright ink sits in the bright band; dim ink in the dim band. The
      // AA skirt (thresholds 40-45) reaches ~7px past the core band tops
      // the layout measured from the settled white-component scan, and
      // descenders ('y','g','p') trail ~14px past either baseline.
      const bright = regionBBox(ink.bright)
      const dim = regionBBox(ink.dim)
      expect(bright.y0).toBeGreaterThanOrEqual(l.rows[i]!.bright.topY - 8)
      expect(bright.y1).toBeLessThanOrEqual(l.rows[i]!.bright.baseline + 14)
      expect(dim.y0).toBeGreaterThanOrEqual(l.rows[i]!.dim.topY - 8)
      expect(dim.y1).toBeLessThanOrEqual(l.rows[i]!.dim.baseline + 14)
    }
  })

  it('pins per-row sampled icon inks from the settled frame', () => {
    // 92nd-percentile stroke-core samples (compression-desaturated).
    for (const rid of ROW_IDS) {
      expect(SEG12_INK.rows[rid].icon.every((r) => r.fill === SEG12_INK.rows[rid].icon[0]!.fill)).toBe(true)
    }
    expect(SEG12_INK.rows.leftTop.icon[0]!.fill).toBe('#2dd1e8')
    expect(SEG12_INK.rows.rightTop.icon[0]!.fill).toBe('#f55f2d')
    expect(SEG12_INK.rows.leftBottom.icon[0]!.fill).toBe('#409bf7')
    expect(SEG12_INK.rows.rightBottom.icon[0]!.fill).toBe('#2dd2a5')
  })

  it('traces the dark core glyph inside the measured glyph zone', () => {
    expect(SEG12_INK.coreGlyph.every((r) => r.fill === '#080303')).toBe(true)
    const bb = regionBBox(SEG12_INK.coreGlyph)
    // Glyph zone (1228, 782, 106×116) × 0.75 → (921, 586.5, 79.5×87).
    expect(bb.x0).toBeGreaterThanOrEqual(918)
    expect(bb.x1).toBeLessThanOrEqual(1004)
    expect(bb.y0).toBeGreaterThanOrEqual(583)
    expect(bb.y1).toBeLessThanOrEqual(677)
  })

  it('traces multi-component even-odd contours (holes preserved)', () => {
    // The tracer's luma threshold merges some adjacent glyphs, so subpath
    // counts track connected ink components + counters, not the glyph
    // count — assert the multi-contour structure itself.
    expect(regionBBox([SEG12_INK.title[4]!, SEG12_INK.title[5]!]).subpaths).toBeGreaterThanOrEqual(8)
    expect(regionBBox([SEG12_INK.title[6]!, SEG12_INK.title[7]!]).subpaths).toBeGreaterThanOrEqual(3)
    expect(regionBBox(SEG12_INK.coreGlyph).subpaths).toBeGreaterThanOrEqual(3)
  })

  it('paints every region skirt-then-core (AA ramp reconstruction)', () => {
    // First entry of each pair is the translucent skirt; the core is opaque.
    for (const region of [SEG12_INK.rows.leftTop.bright, SEG12_INK.rows.rightTop.dim, SEG12_INK.rows.leftBottom.icon]) {
      expect(region[0]!.opacity).toBe(0.5)
      expect(region[1]!.opacity).toBeUndefined()
    }
  })

  it('is byte-identical across runs (traced ink is static data)', () => {
    const a = JSON.stringify(SEG12_INK)
    const b = JSON.stringify(SEG12_INK)
    expect(a).toBe(b)
  })

  it('SEG12_INK snapshot is stable across runs', () => {
    expect(JSON.parse(JSON.stringify(SEG12_INK))).toMatchSnapshot()
  })
})
