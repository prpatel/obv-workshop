import { describe, expect, it } from 'vitest'
import { stairDips, stairLayout } from './stair'

// Hand-computed constants for the default 1920×1080 canvas, from the measured
// rhythm (exact-trace sheet art_4A7yguGJ; traces on the settled frame):
//   block ⌀ = 146            left = 63          top = 758
//   gaps     = [332, 324, 317, 315, 268]      (left-edge → left-edge, px of 1920)
//   deltas   = [-65, +41, -122, -74, -73]     (top-edge deltas, px of 1080)
// → block lefts 63/395/719/1036/1351/1619, tops 758/693/734/612/538/465.
const SIZE = 146
const XS = [63, 395, 719, 1036, 1351, 1619]
const TOPS = [758, 693, 734, 612, 538, 465]
const GAPS = [332, 324, 317, 315, 268]
const DELTAS = [-65, 41, -122, -74, -73]

describe('stairLayout — measured rhythm', () => {
  it('n=6: six blocks on the measured non-uniform rhythm, hand-computed to 1e-6', () => {
    const l = stairLayout(6)
    expect(l.blocks).toHaveLength(6)
    l.blocks.forEach((b, i) => {
      expect(b.x).toBeCloseTo(XS[i], 6)
      expect(b.y).toBeCloseTo(TOPS[i], 6)
      expect(b.w).toBeCloseTo(SIZE, 6)
      expect(b.h).toBeCloseTo(SIZE, 6)
      expect(b.index).toBe(i)
    })
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
  })

  it('left-edge gaps are the measured 332/324/317/315/268 — not a uniform pitch', () => {
    const l = stairLayout(6)
    const gaps = l.blocks.slice(1).map((b, i) => b.x - l.blocks[i].x)
    gaps.forEach((gap, i) => expect(gap).toBeCloseTo(GAPS[i], 6))
    // The old uniform pitch (316.8) would misplace block 6 by 28px — the last
    // gap is the outlier that pins the composition to the canvas edge.
    expect(gaps[4]).toBeLessThan(gaps[3])
  })

  it('top-edge deltas are the measured −65/+41/−122/−74/−73 — block 3 dips 41px below block 2', () => {
    const l = stairLayout(6)
    const deltas = l.blocks.slice(1).map((b, i) => b.y - l.blocks[i].y)
    deltas.forEach((delta, i) => expect(delta).toBeCloseTo(DELTAS[i], 6))
    // The dip: block 3 sits numerically LOWER on screen than block 2.
    expect(l.blocks[2].y).toBeGreaterThan(l.blocks[1].y)
    expect(stairDips(l.blocks)).toEqual([{ index: 2, dipPx: 41 }])
  })

  it('blocks are circles: width equals height at the measured 146px diameter', () => {
    const l = stairLayout(6)
    l.blocks.forEach((b) => {
      expect(b.w).toBeCloseTo(b.h, 6)
      expect(b.w).toBeCloseTo(SIZE, 6)
    })
  })
})

describe('stairLayout — punched numbers', () => {
  it('per-block cap heights 40/62/53/62/62/56 and ink widths 69/53/66/50/57/56', () => {
    const l = stairLayout(6)
    const caps = l.blocks.map((b) => b.punchCap)
    const widths = l.blocks.map((b) => b.punchWidth)
    ;[40, 62, 53, 62, 62, 56].forEach((cap, i) => expect(caps[i]).toBeCloseTo(cap, 6))
    ;[69, 53, 66, 50, 57, 56].forEach((width, i) => expect(widths[i]).toBeCloseTo(width, 6))
  })

  it('punch baselines center the band at 0.49 of the block size', () => {
    const l = stairLayout(6)
    l.blocks.forEach((b, i) => {
      expect(b.punchBaseline).toBeCloseTo(TOPS[i] + 0.49 * SIZE + b.punchCap / 2, 6)
    })
    expect(l.blocks[0].punchBaseline).toBeCloseTo(849.54, 6)
  })
})

describe('stairLayout — slate wedges', () => {
  it('blocks 1–5 carry a wedge right of the circle at the measured bands; block 6 has none', () => {
    const l = stairLayout(6)
    l.blocks.slice(0, 5).forEach((b) => {
      expect(b.wedge).toBeDefined()
      // Starts 0.05 block sizes past the right edge, spans 0.97.
      expect(b.wedge!.x).toBeCloseTo(b.x + SIZE * 1.05, 6)
      expect(b.wedge!.w).toBeCloseTo(SIZE * 0.97, 6)
      expect(b.wedge!.h).toBeLessThan(SIZE)
    })
    // Per-block y bands (fractions of the block size from the block top).
    expect(l.blocks[0].wedge!.y).toBeCloseTo(758 + SIZE * 0.1, 6)
    expect(l.blocks[1].wedge!.y).toBeCloseTo(693 + SIZE * 0.47, 6)
    expect(l.blocks[2].wedge!.y).toBeCloseTo(734 - SIZE * 0.06, 6)
    expect(l.blocks[3].wedge!.y).toBeCloseTo(612 + SIZE * 0.04, 6)
    expect(l.blocks[4].wedge!.y).toBeCloseTo(538 - SIZE * 0.06, 6)
    expect(l.blocks[5].wedge).toBeUndefined()
  })
})

describe('stairLayout — options and validation', () => {
  it('n=4 (off-nominal): the same rhythm, first four blocks', () => {
    const l = stairLayout(4)
    expect(l.blocks).toHaveLength(4)
    l.blocks.forEach((b, i) => {
      expect(b.x).toBeCloseTo(XS[i], 6)
      expect(b.y).toBeCloseTo(TOPS[i], 6)
    })
  })

  it('n=1: a lone block at the measured origin', () => {
    const l = stairLayout(1)
    expect(l.blocks[0].x).toBeCloseTo(63, 6)
    expect(l.blocks[0].y).toBeCloseTo(758, 6)
    expect(l.blocks[0].punchCap).toBeCloseTo(40, 6)
    expect(stairDips(l.blocks)).toEqual([])
  })

  it('honors a custom canvas: 1280×720 rescales every derived length', () => {
    const l = stairLayout(2, { width: 1280, height: 720 })
    // ⌀ = 146/1080·720 = 97.3̄; left = 63/1920·1280 = 42; top = 758/1080·720.
    expect(l.blocks[0].w).toBeCloseTo(146 / 1080 * 720, 6)
    expect(l.blocks[0].h).toBeCloseTo(l.blocks[0].w, 6)
    expect(l.blocks[0].x).toBeCloseTo(42, 6)
    expect(l.blocks[0].y).toBeCloseTo(758 / 1080 * 720, 6)
    expect(l.blocks[1].x).toBeCloseTo(42 + 332 / 1920 * 1280, 6)
    expect(l.blocks[1].y).toBeCloseTo(758 / 1080 * 720 - 65 / 1080 * 720, 6)
    expect(l.blocks[0].punchCap).toBeCloseTo(40 / 1080 * 720, 6)
    expect(l.blocks[0].wedge!.x).toBeCloseTo(42 + l.blocks[0].w * 1.05, 6)
  })

  it('rejects counts below 1 with RangeError', () => {
    expect(() => stairLayout(0)).toThrow(RangeError)
    expect(() => stairLayout(-1)).toThrow(RangeError)
  })

  it('rejects non-integer counts with RangeError', () => {
    expect(() => stairLayout(2.5)).toThrow(RangeError)
  })

  it('rejects rhythm arrays that do not cover the requested count', () => {
    expect(() => stairLayout(6, { gapsXFrac: [0.1, 0.1, 0.1] })).toThrow(RangeError)
    expect(() => stairLayout(6, { topDeltasYFrac: [0.1, 0.1, 0.1] })).toThrow(RangeError)
  })

  it('is byte-identical across runs for the same inputs', () => {
    const a = JSON.stringify(stairLayout(6))
    const b = JSON.stringify(stairLayout(6))
    expect(a).toBe(b)
  })

  it('n=6 layout snapshot is stable across runs', () => {
    expect(stairLayout(6)).toMatchSnapshot()
  })
})
