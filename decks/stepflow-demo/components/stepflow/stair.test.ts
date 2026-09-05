import { describe, expect, it } from 'vitest'
import { SEG01_PLACEMENT, glowTraceSegments, stairDips, stairLayout } from './stair'

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

describe('glowTraceSegments — quiet ascent trace', () => {
  it('emits one two-point diagonal per block past the first, top-center to top-center', () => {
    const { blocks } = stairLayout(6)
    const segs = glowTraceSegments(blocks)

    expect(segs).toHaveLength(5)
    segs.forEach((seg, i) => expect(seg.index).toBe(i + 1))
    // Segment i connects block i−1's top-center to block i's: exact endpoints
    // from the measured rhythm (x 63/395/719/1036/1351/1619, y 758/693/734/612/538/465, w = h = 146).
    expect(segs[0]!.d).toBe('M 136 758 L 468 693')
    expect(segs[4]!.d).toBe('M 1424 538 L 1692 465')
  })

  it('carries analytic lengths matching the measured diagonals', () => {
    const { blocks } = stairLayout(6)
    const segs = glowTraceSegments(blocks)

    // Hand-computed diagonals over the measured pitches (dx, dy):
    // 332/−65, 324/41, 317/−122, 315/−74, 268/−73.
    expect(segs[0]!.len).toBeCloseTo(Math.sqrt(332 * 332 + 65 * 65), 6) // ≈338.303119
    expect(segs[1]!.len).toBeCloseTo(Math.sqrt(324 * 324 + 41 * 41), 6) // ≈326.583833
    expect(segs[2]!.len).toBeCloseTo(Math.sqrt(317 * 317 + 122 * 122), 6) // ≈339.666012
    expect(segs[3]!.len).toBeCloseTo(Math.sqrt(315 * 315 + 74 * 74), 6) // ≈323.575339
    expect(segs[4]!.len).toBeCloseTo(Math.sqrt(268 * 268 + 73 * 73), 6) // ≈277.764289
  })

  it('is empty for a single block and traces n−1 segments off-nominal', () => {
    expect(glowTraceSegments(stairLayout(1).blocks)).toEqual([])
    const off = stairLayout(3, {
      gapsXFrac: [0.2, 0.2],
      topDeltasYFrac: [-0.1, 0.05],
    })
    const segs = glowTraceSegments(off.blocks)
    expect(segs).toHaveLength(2)
    for (const seg of segs) expect(seg.len).toBeGreaterThan(0)
  })
})


describe('stairLayout — seg01 explicit placement', () => {
  // seg01 split-ascent placement, measured on the 2560×1440 settled frame
  // (user8-analysis report.json connected components, blue-class list): six
  // circles of ≈0.061w (⌀ ≈ 156 native px), lefts 0.1391/0.2797/0.4172 (blue)
  // and 0.5516/0.6855/0.7992 (cyan), tops 0.625 → 0.4056 with block 3 dipping
  // below block 2 (0.6062 vs 0.5757). Explicit placement, not the gap walk.
  it('matches the measured seg01 bboxes to 1e-6, hand-computed from the report fractions', () => {
    const l = stairLayout(6, SEG01_PLACEMENT)
    l.blocks.forEach((b, i) => {
      expect(b.x).toBeCloseTo(SEG01_PLACEMENT.leftsFrac![i] * 1920, 6)
      expect(b.y).toBeCloseTo(SEG01_PLACEMENT.topsFrac![i] * 1080, 6)
      expect(b.w).toBeCloseTo(SEG01_PLACEMENT.blockFrac! * 1080, 6)
      expect(b.h).toBeCloseTo(SEG01_PLACEMENT.blockFrac! * 1080, 6)
      expect(b.index).toBe(i)
    })
    // Hand-computed anchors straight from the report bboxes (fraction × canvas):
    expect(l.blocks[0].x).toBeCloseTo(0.1391 * 1920, 6) // 267.072
    expect(l.blocks[0].y).toBeCloseTo(0.625 * 1080, 6) // 675
    expect(l.blocks[2].y).toBeCloseTo(0.6062 * 1080, 6) // 654.696 — the dip
    expect(l.blocks[5].x).toBeCloseTo(0.7992 * 1920, 6) // 1534.464
    expect(l.blocks[5].y).toBeCloseTo(0.4056 * 1080, 6) // 438.048
  })

  it('preserves the block-3 dip under explicit placement: +0.0305 of height', () => {
    const l = stairLayout(6, SEG01_PLACEMENT)
    const dips = stairDips(l.blocks)
    expect(dips).toHaveLength(1)
    expect(dips[0]!.index).toBe(2)
    expect(dips[0]!.dipPx).toBeCloseTo((0.6062 - 0.5757) * 1080, 6) // ≈32.94px
    expect(l.blocks[2].y).toBeGreaterThan(l.blocks[1].y)
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
    expect(l.blocks[0]!.x).toBeCloseTo(SEG01_PLACEMENT.leftsFrac![0] * 1280, 6)
    expect(l.blocks[0]!.y).toBeCloseTo(SEG01_PLACEMENT.topsFrac![0] * 720, 6)
    expect(l.blocks[0]!.w).toBeCloseTo(SEG01_PLACEMENT.blockFrac! * 720, 6)
    expect(l.blocks[0]!.h).toBeCloseTo(l.blocks[0]!.w, 6)
  })

  it('is byte-identical across runs for explicit placement', () => {
    const a = JSON.stringify(stairLayout(6, SEG01_PLACEMENT))
    const b = JSON.stringify(stairLayout(6, SEG01_PLACEMENT))
    expect(a).toBe(b)
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

describe('stairLayout — default walk unchanged by explicit placement', () => {
  // The gen-7 gap/delta walk is frozen: with leftsFrac/topsFrac now living in
  // StairOptions, the default output must stay byte-identical to the
  // pre-explicit-placement baseline (captured on this branch's release base).
  const BASELINE =
    '{"blocks":[{"x":63,"y":758,"w":146,"h":146,"index":0,"punchCap":40,"punchWidth":69,"punchBaseline":849.54,"wedge":{"x":216.3,"y":772.6,"w":141.62,"h":56.940000000000005}},' +
    '{"x":395,"y":693,"w":146,"h":146,"index":1,"punchCap":62,"punchWidth":53,"punchBaseline":795.54,"wedge":{"x":548.3,"y":761.62,"w":141.62,"h":42.34}},' +
    '{"x":719,"y":734,"w":146,"h":146,"index":2,"punchCap":53,"punchWidth":66,"punchBaseline":832.04,"wedge":{"x":872.3,"y":725.24,"w":141.62,"h":73}},' +
    '{"x":1036,"y":612,"w":146,"h":146,"index":3,"punchCap":62,"punchWidth":50,"punchBaseline":714.54,"wedge":{"x":1189.3,"y":617.84,"w":141.62,"h":64.24}},' +
    '{"x":1351,"y":538,"w":146,"h":146,"index":4,"punchCap":62,"punchWidth":57,"punchBaseline":640.54,"wedge":{"x":1504.3,"y":529.24,"w":141.62,"h":80.30000000000001}},' +
    '{"x":1619,"y":465,"w":146,"h":146,"index":5,"punchCap":56,"punchWidth":56,"punchBaseline":564.54}],"viewBox":{"width":1920,"height":1080}}'

  it('the default n=6 walk is byte-identical to the pre-explicit-placement baseline', () => {
    expect(JSON.stringify(stairLayout(6))).toBe(BASELINE)
  })

  it('SEG01_PLACEMENT exports the measured report fractions verbatim', () => {
    expect(SEG01_PLACEMENT.leftsFrac).toEqual([0.1391, 0.2797, 0.4172, 0.5516, 0.6855, 0.7992])
    expect(SEG01_PLACEMENT.topsFrac).toEqual([0.625, 0.5757, 0.6062, 0.5153, 0.4611, 0.4056])
    expect(SEG01_PLACEMENT.blockFrac).toBeCloseTo(156.2 / 1440, 4)
  })
})