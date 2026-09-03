import { describe, expect, it } from 'vitest'
import { serpentineLayout } from './geometry'

// Hand-computed constants for the default 1920×1080 canvas, from the measured
// fractions (stepflow-visual-spec art_0VvS7Nb1 §3–§4):
//   pitchX = 0.363 · 1920 = 696.96        pitchY = 0.572 · 1080 = 617.76
const TOP_Y = 231.12 // (1080 − 617.76) / 2 — node rows centered vertically
const BOTTOM_Y = 848.88 // 231.12 + 617.76
const RETURN_Y = 583.2432 // 231.12 + 0.57 · 617.76
const DISC_R = 90.504 // 0.0838 · 1080
const TRACK_WIDTH = 26.784 // 0.0248 · 1080
const LEAD_IN = 139.392 // 0.2 · 696.96
const R_RIGHT = 176.0616 // (0.57 · 617.76) / 2 — right U-turn radius
const R_LEFT = 132.8184 // ((1 − 0.57) · 617.76) / 2 — left U-turn radius

describe('serpentineLayout — node coordinates', () => {
  it('n=1: lone disc on the top lane, left column of the minimum 2-column grid', () => {
    const l = serpentineLayout(1)
    expect(l.nodes).toHaveLength(1)
    expect(l.nodes[0].cx).toBeCloseTo(611.52, 6) // (1920 − 696.96) / 2
    expect(l.nodes[0].cy).toBeCloseTo(TOP_Y, 6)
    expect(l.nodes[0].lane).toBe(0)
    expect(l.nodes[0].index).toBe(0)
  })

  it('n=4: 2 + 2 on a 2-column grid', () => {
    const l = serpentineLayout(4)
    const expected = [
      { cx: 611.52, cy: TOP_Y, lane: 0 },
      { cx: 1308.48, cy: TOP_Y, lane: 0 },
      { cx: 611.52, cy: BOTTOM_Y, lane: 1 },
      { cx: 1308.48, cy: BOTTOM_Y, lane: 1 },
    ]
    expected.forEach((e, i) => {
      expect(l.nodes[i].cx).toBeCloseTo(e.cx, 6)
      expect(l.nodes[i].cy).toBeCloseTo(e.cy, 6)
      expect(l.nodes[i].lane).toBe(e.lane)
      expect(l.nodes[i].index).toBe(i)
    })
  })

  it('n=5: 3 + 2 — bottom lane one disc short', () => {
    const l = serpentineLayout(5)
    expect(l.nodes.filter((n) => n.lane === 0)).toHaveLength(3)
    expect(l.nodes.filter((n) => n.lane === 1)).toHaveLength(2)
    // 3-column grid: (1920 − 2 · 696.96) / 2 = 263.04 → columns 263.04, 960, 1656.96
    const xs = [263.04, 960, 1656.96]
    l.nodes.forEach((n, i) => {
      expect(n.cx).toBeCloseTo(xs[i < 3 ? i : i - 3], 6)
      expect(n.cy).toBeCloseTo(i < 3 ? TOP_Y : BOTTOM_Y, 6)
    })
    expect(l.nodes[4].lane).toBe(1) // last disc sits on the short bottom lane
  })

  it('n=6: 3 + 3 on the measured grid, with absolute discR / trackWidth / viewBox', () => {
    const l = serpentineLayout(6)
    const xs = [263.04, 960, 1656.96]
    l.nodes.forEach((n, i) => {
      expect(n.cx).toBeCloseTo(xs[i < 3 ? i : i - 3], 6)
      expect(n.cy).toBeCloseTo(i < 3 ? TOP_Y : BOTTOM_Y, 6)
      expect(n.lane).toBe(i < 3 ? 0 : 1)
      expect(n.index).toBe(i)
    })
    expect(l.discR).toBeCloseTo(DISC_R, 6)
    expect(l.trackWidth).toBeCloseTo(TRACK_WIDTH, 6)
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
  })
})

describe('serpentineLayout — path structure', () => {
  it('n=6: full path — stub start, two semicircular U-turns, terminates under the last disc', () => {
    const l = serpentineLayout(6)
    const d = l.track.d
    expect(d.match(/M /g)).toHaveLength(1) // one continuous path
    expect(d.match(/A /g)).toHaveLength(2) // exactly two U-turn arcs
    expect(d.match(/[LQCV]/g)).toBeNull() // straight runs + arcs only
    // Lead-in stub starts one stub-length left of the first disc's center.
    expect(d.startsWith(`M 123.648 ${TOP_Y}`)).toBe(true)
    // Right U-turn sweeps clockwise (bulges right); left U-turn sweeps
    // counter-clockwise (bulges left) — matching the measured outer extremes
    // on both sides (art_0VvS7Nb1 §4: x = 2062 right, x = 95 left).
    expect(d).toContain(`A 176.0616 176.0616 0 0 1 1656.96 ${RETURN_Y}`)
    expect(d).toContain(`A 132.8184 132.8184 0 0 0 263.04 ${BOTTOM_Y}`)
    // Final segment ends at the last disc's center — hidden beneath it, no tail.
    expect(d.endsWith('H 1656.96')).toBe(true)
    expect(l.nodes[5].cx).toBeCloseTo(1656.96, 6)
    expect(l.nodes[5].cy).toBeCloseTo(BOTTOM_Y, 6)
  })

  it('n=6: exact path string', () => {
    const l = serpentineLayout(6)
    expect(l.track.d).toBe(
      'M 123.648 231.12 H 1656.96 A 176.0616 176.0616 0 0 1 1656.96 583.2432 '
        + 'H 263.04 A 132.8184 132.8184 0 0 0 263.04 848.88 H 1656.96',
    )
  })

  it('n=4: U-turns anchor on the outer columns; path terminates under disc 4', () => {
    const l = serpentineLayout(4)
    expect(l.track.d).toBe(
      'M 472.128 231.12 H 1308.48 A 176.0616 176.0616 0 0 1 1308.48 583.2432 '
        + 'H 611.52 A 132.8184 132.8184 0 0 0 611.52 848.88 H 1308.48',
    )
    expect(l.nodes[3].cx).toBeCloseTo(1308.48, 6)
  })

  it('n=5: final segment terminates under the last (bottom-row) disc despite the short lane', () => {
    const l = serpentineLayout(5)
    expect(l.track.d.endsWith('H 960')).toBe(true)
    expect(l.nodes[4].cx).toBeCloseTo(960, 6)
    expect(l.nodes[4].cy).toBeCloseTo(BOTTOM_Y, 6)
  })

  it('n=1: stub into the lone disc — no U-turns, no return lane', () => {
    const l = serpentineLayout(1)
    expect(l.track.d).toBe(`M 472.128 ${TOP_Y} H 611.52`)
    expect(l.track.d.match(/A /g)).toBeNull()
  })
})

describe('serpentineLayout — path lengths', () => {
  it('n=6: totalLength equals the analytic sum of its segments', () => {
    const l = serpentineLayout(6)
    const stubAndTop = 1656.96 - 123.648 // 1533.312
    const returnLane = 1656.96 - 263.04 // 1393.92
    const bottomLane = 1656.96 - 263.04 // 1393.92
    const expected = stubAndTop + Math.PI * R_RIGHT + returnLane + Math.PI * R_LEFT + bottomLane
    expect(l.track.totalLength).toBeGreaterThan(0)
    expect(l.track.totalLength).toBeCloseTo(expected, 6)
  })

  it('nodeDistances: length n, strictly increasing, last entry exactly totalLength (n = 1…9)', () => {
    for (let n = 1; n <= 9; n++) {
      const { track } = serpentineLayout(n)
      expect(track.nodeDistances).toHaveLength(n)
      for (let i = 1; i < n; i++) {
        expect(track.nodeDistances[i]).toBeGreaterThan(track.nodeDistances[i - 1])
      }
      expect(track.nodeDistances[n - 1]).toBe(track.totalLength)
    }
  })

  it('n=6: nodeDistances hit the hand-computed reveal boundaries', () => {
    const { track } = serpentineLayout(6)
    expect(track.nodeDistances[0]).toBeCloseTo(LEAD_IN, 6) // stub reaches disc 1
    expect(track.nodeDistances[1]).toBeCloseTo(836.352, 6) // 123.648 → 960
    expect(track.nodeDistances[2]).toBeCloseTo(1533.312, 6) // top lane done at the U-turn
    const throughTurns = 1533.312 + Math.PI * R_RIGHT + 1393.92 + Math.PI * R_LEFT
    expect(track.nodeDistances[3]).toBeCloseTo(throughTurns, 6) // left U-turn lands on disc 4
    expect(track.nodeDistances[4]).toBeCloseTo(throughTurns + 696.96, 6)
    expect(track.nodeDistances[5]).toBeCloseTo(throughTurns + 1393.92, 6) // = totalLength
  })

  it('n=1: the whole track is the stub into the first disc', () => {
    const { track } = serpentineLayout(1)
    expect(track.totalLength).toBeCloseTo(LEAD_IN, 6)
    expect(track.nodeDistances[0]).toBe(track.totalLength)
  })
})

describe('serpentineLayout — validation', () => {
  it('rejects stepCount below 1 with RangeError', () => {
    expect(() => serpentineLayout(0)).toThrow(RangeError)
    expect(() => serpentineLayout(-1)).toThrow(RangeError)
  })

  it('rejects non-integer step counts with RangeError', () => {
    expect(() => serpentineLayout(2.5)).toThrow(RangeError)
  })

  it('handles 1–9 steps: top lane ceil(n/2), bottom lane floor(n/2)', () => {
    for (let n = 1; n <= 9; n++) {
      const l = serpentineLayout(n)
      expect(l.nodes.filter((x) => x.lane === 0)).toHaveLength(Math.ceil(n / 2))
      expect(l.nodes.filter((x) => x.lane === 1)).toHaveLength(Math.floor(n / 2))
    }
  })
})

describe('serpentineLayout — options and determinism', () => {
  it('honors a pitchXFrac override', () => {
    const l = serpentineLayout(6, { pitchXFrac: 0.25 })
    // pitchX = 480; 3-column grid centered: (1920 − 2 · 480) / 2 = 480
    expect(l.nodes[0].cx).toBeCloseTo(480, 6)
    expect(l.nodes[1].cx).toBeCloseTo(960, 6)
    expect(l.nodes[2].cx).toBeCloseTo(1440, 6)
  })

  it('raises an explicit cols to fit the nodes and the 2-column minimum', () => {
    // n=2 with cols=1: forced to 2 → x0 = (1920 − 696.96) / 2 = 611.52
    const l = serpentineLayout(2, { cols: 1 })
    expect(l.nodes[0].cx).toBeCloseTo(611.52, 6)
    expect(l.nodes[1].cx).toBeCloseTo(611.52, 6)
  })

  it('is byte-identical across runs for the same inputs', () => {
    const a = JSON.stringify(serpentineLayout(6))
    const b = JSON.stringify(serpentineLayout(6))
    expect(a).toBe(b)
  })

  it('n=6 layout snapshot is stable across runs', () => {
    expect(serpentineLayout(6)).toMatchSnapshot()
  })
})
