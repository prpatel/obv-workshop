import { describe, expect, it } from 'vitest'
import {
  SEG01_CAPTIONS,
  SEG01_INK,
  SEG01_PLACEMENT,
  SEG01_WEDGES,
  stairDips,
  stairLayout,
} from './stair'

// Hand-computed constants for the family default 1920×1080 walk (kept for the
// no-placement fallback; the seg01 slide pins SEG01_PLACEMENT):
//   block ⌀ = 146            left = 63          top = 758
//   gaps     = [332, 324, 317, 315, 268]      (left-edge → left-edge, px of 1920)
//   deltas   = [-65, +41, -122, -74, -73]     (top-edge deltas, px of 1080)
// → block lefts 63/395/719/1036/1351/1619 and tops 758/693/734/612/538/465.
const SIZE = 146
const XS = [63, 395, 719, 1036, 1351, 1619]
const TOPS = [758, 693, 734, 612, 538, 465]
const GAPS = [332, 324, 317, 315, 268]
const DELTAS = [-65, 41, -122, -74, -73]

describe('stairLayout — family default walk', () => {
  it('n=6: six blocks on the non-uniform walk, hand-computed to 1e-6', () => {
    const l = stairLayout(6)
    expect(l.blocks).toHaveLength(6)
    l.blocks.forEach((b, i) => {
      expect(b.x).toBeCloseTo(XS[i]!, 6)
      expect(b.y).toBeCloseTo(TOPS[i]!, 6)
      expect(b.w).toBeCloseTo(SIZE, 6)
      expect(b.h).toBeCloseTo(SIZE, 6)
      expect(b.index).toBe(i)
    })
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
  })

  it('left-edge gaps are the measured 332/324/317/315/268 — not a uniform pitch', () => {
    const l = stairLayout(6)
    const gaps = l.blocks.slice(1).map((b, i) => b.x - l.blocks[i]!.x)
    gaps.forEach((gap, i) => expect(gap).toBeCloseTo(GAPS[i]!, 6))
    // The last gap is the outlier that pins the composition to the canvas edge.
    expect(gaps[4]).toBeLessThan(gaps[3]!)
  })

  it('top-edge deltas are the measured −65/+41/−122/−74/−73 — block 3 dips below block 2', () => {
    const l = stairLayout(6)
    const deltas = l.blocks.slice(1).map((b, i) => b.y - l.blocks[i]!.y)
    deltas.forEach((delta, i) => expect(delta).toBeCloseTo(DELTAS[i]!, 6))
    expect(l.blocks[2]!.y).toBeGreaterThan(l.blocks[1]!.y)
    expect(stairDips(l.blocks)).toEqual([{ index: 2, dipPx: 41 }])
  })

  it('blocks are circles: width equals height at the measured 146px diameter', () => {
    const l = stairLayout(6)
    l.blocks.forEach((b) => {
      expect(b.w).toBeCloseTo(b.h, 6)
      expect(b.w).toBeCloseTo(SIZE, 6)
    })
  })

  it('honors a custom canvas: 1280×720 rescales every derived length', () => {
    const l = stairLayout(2, { width: 1280, height: 720 })
    // ⌀ = 146/1080·720; left = 63/1920·1280; top = 758/1080·720.
    expect(l.blocks[0]!.w).toBeCloseTo((146 / 1080) * 720, 6)
    expect(l.blocks[0]!.h).toBeCloseTo(l.blocks[0]!.w, 6)
    expect(l.blocks[0]!.x).toBeCloseTo(42, 6)
    expect(l.blocks[0]!.y).toBeCloseTo((758 / 1080) * 720, 6)
    expect(l.blocks[1]!.x).toBeCloseTo(42 + (332 / 1920) * 1280, 6)
    expect(l.blocks[1]!.y).toBeCloseTo(((758 - 65) / 1080) * 720, 6)
  })

  it('rejects counts below 1 and non-integer counts with RangeError', () => {
    expect(() => stairLayout(0)).toThrow(RangeError)
    expect(() => stairLayout(-1)).toThrow(RangeError)
    expect(() => stairLayout(2.5)).toThrow(RangeError)
  })

  it('rejects walk arrays that do not cover the requested count', () => {
    expect(() => stairLayout(6, { gapsXFrac: [0.1, 0.1, 0.1] })).toThrow(RangeError)
    expect(() => stairLayout(6, { topDeltasYFrac: [0.1, 0.1, 0.1] })).toThrow(RangeError)
  })

  it('is byte-identical across runs for the same inputs', () => {
    expect(JSON.stringify(stairLayout(6))).toBe(JSON.stringify(stairLayout(6)))
  })

  it('default n=6 walk snapshot is stable across runs', () => {
    expect(stairLayout(6)).toMatchSnapshot()
  })
})

describe('stairLayout — seg01 explicit placement', () => {
  // seg01 settled-frame placement (settled_full.png connected components,
  // 2560×1440 source): six circles of ⌀ ≈ 117 canvas px (blockFrac 117/1080),
  // lefts 267/538/802/1059/1317/1535 and tops 675/623/656/557/497/438 on the
  // 1920×1080 canvas, block 3 dipping 33px below block 2. Explicit placement,
  // not the gap walk.
  it('matches the measured seg01 bboxes to 1e-6, hand-computed from the settled frame', () => {
    const l = stairLayout(6, SEG01_PLACEMENT)
    l.blocks.forEach((b, i) => {
      expect(b.x).toBeCloseTo(SEG01_PLACEMENT.leftsFrac![i]! * 1920, 6)
      expect(b.y).toBeCloseTo(SEG01_PLACEMENT.topsFrac![i]! * 1080, 6)
      expect(b.w).toBeCloseTo(SEG01_PLACEMENT.blockFrac! * 1080, 6)
      expect(b.h).toBeCloseTo(SEG01_PLACEMENT.blockFrac! * 1080, 6)
      expect(b.index).toBe(i)
    })
    // Measured anchors straight from the settled-frame bboxes (canvas px):
    expect(l.blocks[0]!.x).toBeCloseTo(267, 6)
    expect(l.blocks[0]!.y).toBeCloseTo(675, 6)
    expect(l.blocks[2]!.y).toBeCloseTo(656, 6) // the dip
    expect(l.blocks[5]!.x).toBeCloseTo(1535, 6)
    expect(l.blocks[5]!.y).toBeCloseTo(438, 6)
    expect(l.blocks[0]!.w).toBeCloseTo(117, 6)
  })

  it('preserves the block-3 dip under explicit placement: +33px', () => {
    const l = stairLayout(6, SEG01_PLACEMENT)
    const dips = stairDips(l.blocks)
    expect(dips).toHaveLength(1)
    expect(dips[0]!.index).toBe(2)
    expect(dips[0]!.dipPx).toBeCloseTo(33, 6)
    expect(l.blocks[2]!.y).toBeGreaterThan(l.blocks[1]!.y)
  })

  it('bypasses the x walk: explicit lefts win over leftFrac/gapsXFrac, which go ignored', () => {
    const lefts = [0.1, 0.3, 0.5]
    const l = stairLayout(3, {
      leftsFrac: lefts,
      // Bogus walk inputs would skew x if the walk still ran.
      leftFrac: 0.9,
      gapsXFrac: [0.4, 0.4],
    })
    l.blocks.forEach((b, i) => expect(b.x).toBeCloseTo(lefts[i]! * 1920, 6))
    // The y axis keeps its default walk when only x is explicit.
    expect(l.blocks[0]!.y).toBeCloseTo(758, 6)
    expect(l.blocks[1]!.y).toBeCloseTo(693, 6)
  })

  it('walks x under topsFrac-only placement', () => {
    const tops = [0.7, 0.6, 0.5]
    const l = stairLayout(3, { topsFrac: tops })
    l.blocks.forEach((b, i) => expect(b.y).toBeCloseTo(tops[i]! * 1080, 6))
    expect(l.blocks[0]!.x).toBeCloseTo(63, 6)
    expect(l.blocks[1]!.x).toBeCloseTo(63 + 332, 6)
  })

  it('rescales explicit placement on a custom canvas', () => {
    const l = stairLayout(2, { ...SEG01_PLACEMENT, width: 1280, height: 720 })
    expect(l.blocks[0]!.x).toBeCloseTo(SEG01_PLACEMENT.leftsFrac![0]! * 1280, 6)
    expect(l.blocks[0]!.y).toBeCloseTo(SEG01_PLACEMENT.topsFrac![0]! * 720, 6)
    expect(l.blocks[0]!.w).toBeCloseTo(SEG01_PLACEMENT.blockFrac! * 720, 6)
    expect(l.blocks[0]!.h).toBeCloseTo(l.blocks[0]!.w, 6)
  })

  it('is byte-identical across runs for explicit placement', () => {
    expect(JSON.stringify(stairLayout(6, SEG01_PLACEMENT))).toBe(
      JSON.stringify(stairLayout(6, SEG01_PLACEMENT)),
    )
  })

  it('rejects invalid fractions with RangeError: short arrays, out of range, non-finite', () => {
    expect(() => stairLayout(3, { leftsFrac: [0.1, 0.1] })).toThrow(RangeError)
    expect(() => stairLayout(3, { topsFrac: [0.1] })).toThrow(RangeError)
    expect(() => stairLayout(2, { leftsFrac: [-0.1, 0.2] })).toThrow(RangeError)
    expect(() => stairLayout(2, { topsFrac: [0.1, 1.2] })).toThrow(RangeError)
    expect(() => stairLayout(2, { leftsFrac: [Number.NaN, 0.2] })).toThrow(RangeError)
    expect(() => stairLayout(2, { topsFrac: [0.1, Number.POSITIVE_INFINITY] })).toThrow(RangeError)
  })
})

describe('SEG01_INK — exact-trace ink set', () => {
  it('carries the settled-frame ink groups with the packet modal hexes', () => {
    expect(SEG01_INK.titleWhite.fill).toBe('#f4f4f6')
    expect(SEG01_INK.titleGreen.fill).toBe('#66f605')
    expect(SEG01_INK.amber01.fill).toBe('#eab72a')
    expect(SEG01_INK.badge.fill).toBe('#859e4e')
    expect(SEG01_INK.icons).toHaveLength(6)
    SEG01_INK.icons.forEach((icon) => {
      expect(icon.fill).toBe('#02050d')
      expect(icon.id).toMatch(/^icon-[1-6]$/)
    })
  })

  it('every trace is a closed absolute-coordinate path (M…L…Z subpaths)', () => {
    const all = [SEG01_INK.titleWhite, SEG01_INK.titleGreen, SEG01_INK.amber01, SEG01_INK.badge, ...SEG01_INK.icons]
    for (const ink of all) {
      expect(ink.d.startsWith('M')).toBe(true)
      expect(ink.d.includes('Z')).toBe(true)
      // Tracer output contract: absolute M/L commands with closed Z subpaths —
      // no relative commands, no arc/curve shorthands.
      expect([...new Set(ink.d.match(/[A-Za-z]/g) ?? [])].sort()).toEqual(['L', 'M', 'Z'])
    }
  })

  it('title traces span the measured title band (y 92–182, x 360–1564)', () => {
    for (const ink of [SEG01_INK.titleWhite, SEG01_INK.titleGreen]) {
      const xs: number[] = []
      const ys: number[] = []
      for (const pair of ink.d.match(/[\d.]+ [\d.]+/g) ?? []) {
        const [x, y] = pair.split(' ').map(Number)
        xs.push(x!)
        ys.push(y!)
      }
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(60)
      expect(Math.max(...ys)).toBeLessThanOrEqual(220)
      expect(Math.min(...xs)).toBeGreaterThanOrEqual(250)
      expect(Math.max(...xs)).toBeLessThanOrEqual(1600)
    }
  })
})

describe('SEG01_WEDGES — measured slate bands', () => {
  it('blocks 1–5 carry measured bands; block 6 has none', () => {
    expect(SEG01_WEDGES).toHaveLength(5)
    // First band, hand-computed from the settled frame: x394–527, y682–733.
    expect(SEG01_WEDGES[0]!.xFrac * 1920).toBeCloseTo(394, 6)
    expect(SEG01_WEDGES[0]!.yFrac * 1080).toBeCloseTo(682, 6)
    expect(SEG01_WEDGES[0]!.wFrac * 1920).toBeCloseTo(133, 6)
    expect(SEG01_WEDGES[0]!.hFrac * 1080).toBeCloseTo(51, 6)
    // Every band is a fraction in [0, 1].
    for (const w of SEG01_WEDGES) {
      for (const f of [w.xFrac, w.yFrac, w.wFrac, w.hFrac]) {
        expect(f).toBeGreaterThanOrEqual(0)
        expect(f).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('SEG01_CAPTIONS — measured caption typography', () => {
  it('pins the measured baseline gap, size, and per-block ink widths', () => {
    expect(SEG01_CAPTIONS.gapPx).toBe(36)
    expect(SEG01_CAPTIONS.sizeFrac * 1080).toBeCloseTo(22.333, 3)
    expect(SEG01_CAPTIONS.textLengthsPx).toEqual([121, 121, 106, 38, 65, 65])
  })

  it('carries the measured block-tinted caption inks', () => {
    expect(SEG01_CAPTIONS.blue).toBe('#4999f2')
    expect(SEG01_CAPTIONS.cyan).toBe('#3dcadc')
  })
})
