import { describe, expect, it } from 'vitest'
import { hexLayout } from './hex'

// Hand-computed constants for the default 1920×1080 canvas, from the measured
// fractions (this PR's v5 re-measure; derivations in hex.ts's MEASURED block):
//   R      = 0.203  · 1080 = 219.24            (outline across ≈ 0.4056·h → 2R)
//   pitchX = 0.684  · 1920 = 1313.28          (same-row center spacing 1394/2038)
//   drop   = 0.2395 · 1080 = 258.66           (V row drop 274/1144)
//   yTop   = 0.5439 · 1080 = 587.412          (top row cy 622/1144)
//   axisX  = 0.5    · 1920 = 960
// and (√3 / 2) · R = 189.86740952570034 for the pointy-top x-extent.
const R = 219.24
const HALF_SQRT3_R = 189.86740952570034
const HALF_R = 109.62

// n = 3 'v' centers: top row at axisX ± pitchX/2, bottom cell on the axis.
const TOP_LEFT_CX = 960 - 1313.28 / 2 // 303.36
const TOP_RIGHT_CX = 960 + 1313.28 / 2 // 1616.64
const TOP_CY = 587.412
const BOTTOM_CX = 960
const BOTTOM_CY = 587.412 + 258.66 // 846.072

describe('hexLayout — measured n=3 V arrangement', () => {
  const layout = hexLayout(3)

  it('lays out two top cells and one bottom cell on the axis', () => {
    expect(layout.cells).toHaveLength(3)
    expect(layout.arrangement).toBe('v')
    expect(layout.cells[0].cx).toBeCloseTo(TOP_LEFT_CX, 6)
    expect(layout.cells[0].cy).toBeCloseTo(TOP_CY, 6)
    expect(layout.cells[1].cx).toBeCloseTo(TOP_RIGHT_CX, 6)
    expect(layout.cells[1].cy).toBeCloseTo(TOP_CY, 6)
    // The bottom cell sits centered between and below the top row — half a slot lower.
    expect(layout.cells[2].cx).toBeCloseTo(BOTTOM_CX, 6)
    expect(layout.cells[2].cy).toBeCloseTo(BOTTOM_CY, 6)
  })

  it('emits pointy-top vertices clockwise from the top vertex (bottom cell, exact)', () => {
    const v = layout.cells[2].vertices
    expect(v[0][0]).toBeCloseTo(960, 6)
    expect(v[0][1]).toBeCloseTo(846.072 - R, 6) // 626.832
    expect(v[1][0]).toBeCloseTo(960 + HALF_SQRT3_R, 6) // 1149.867409...
    expect(v[1][1]).toBeCloseTo(846.072 - HALF_R, 6) // 736.452
    expect(v[2][0]).toBeCloseTo(960 + HALF_SQRT3_R, 6)
    expect(v[2][1]).toBeCloseTo(846.072 + HALF_R, 6) // 955.692
    expect(v[3][0]).toBeCloseTo(960, 6)
    expect(v[3][1]).toBeCloseTo(846.072 + R, 6) // 1065.312
    expect(v[4][0]).toBeCloseTo(960 - HALF_SQRT3_R, 6) // 770.132591...
    expect(v[4][1]).toBeCloseTo(846.072 + HALF_R, 6)
    expect(v[5][0]).toBeCloseTo(960 - HALF_SQRT3_R, 6)
    expect(v[5][1]).toBeCloseTo(846.072 - HALF_R, 6)
  })

  it('builds the exact path data string (top-left cell)', () => {
    // fmt() trims to 4 decimals: 189.867409... → 189.8674, 113.492590... → 113.4926.
    expect(layout.cells[0].path).toBe(
      'M 303.36 368.172 L 493.2274 477.792 L 493.2274 697.032 L 303.36 806.652 L 113.4926 697.032 L 113.4926 477.792 Z',
    )
    expect(layout.cells[2].path).toBe(
      'M 960 626.832 L 1149.8674 736.452 L 1149.8674 955.692 L 960 1065.312 L 770.1326 955.692 L 770.1326 736.452 Z',
    )
  })

  it('analytic perimeter is exactly 6·R — the full stroke-draw span', () => {
    // A regular hexagon's side equals its circumradius, so the perimeter is 6R
    // with no rounding: this is the length the dashoffset reveal must cover.
    for (const cell of layout.cells) {
      expect(cell.perimeter).toBeCloseTo(6 * R, 6) // 1315.44
      expect(cell.perimeter).toBe(6 * layout.hexR)
    }
    expect(layout.hexR).toBeCloseTo(R, 6)
  })

  it('vertex ring closes with all six sides equal to R', () => {
    for (const cell of layout.cells) {
      const v = cell.vertices
      expect(v).toHaveLength(6)
      for (let k = 0; k < 6; k++) {
        const [ax, ay] = v[k]
        const [bx, by] = v[(k + 1) % 6] // wraps v5 → v0: the ring closes
        const side = Math.hypot(bx - ax, by - ay)
        expect(side).toBeCloseTo(R, 6)
      }
    }
  })

  it('exposes the measured stroke width and viewBox', () => {
    expect(layout.strokeWidth).toBeCloseTo(0.008 * 1080, 6) // 8.64
    expect(layout.viewBox).toEqual({ width: 1920, height: 1080 })
  })
})

describe('hexLayout — off-nominal counts', () => {
  it('n=1 centers a single cell on the axis', () => {
    const layout = hexLayout(1)
    expect(layout.cells).toHaveLength(1)
    expect(layout.cells[0].cx).toBeCloseTo(960, 6)
    expect(layout.cells[0].cy).toBeCloseTo(587.412, 6)
  })

  it('n=2 stacks one top and one bottom cell', () => {
    const layout = hexLayout(2)
    expect(layout.cells[0].cx).toBeCloseTo(960, 6)
    expect(layout.cells[0].cy).toBeCloseTo(587.412, 6)
    expect(layout.cells[1].cx).toBeCloseTo(960, 6)
    expect(layout.cells[1].cy).toBeCloseTo(846.072, 6)
  })

  it('n=4 puts two on top and two below, bottom row centered', () => {
    const layout = hexLayout(4)
    expect(layout.cells).toHaveLength(4)
    const tops = layout.cells.slice(0, 2)
    const bottoms = layout.cells.slice(2)
    for (const cell of tops) expect(cell.cy).toBeCloseTo(587.412, 6)
    for (const cell of bottoms) expect(cell.cy).toBeCloseTo(846.072, 6)
    // Both rows centered on the axis: tops at ±pitch/2, bottoms at ±pitch/2.
    expect(tops[0].cx).toBeCloseTo(tops[1].cx - 1313.28, 6)
    expect(bottoms[0].cx).toBeCloseTo(960 - 656.64, 6)
    expect(bottoms[1].cx).toBeCloseTo(960 + 656.64, 6)
  })

  it('n=5 fills three top slots and two half-slot bottom slots', () => {
    const layout = hexLayout(5)
    expect(layout.cells).toHaveLength(5)
    expect(layout.cells[0].cx).toBeCloseTo(960 - 1313.28, 6) // -353.28
    expect(layout.cells[1].cx).toBeCloseTo(960, 6)
    expect(layout.cells[2].cx).toBeCloseTo(960 + 1313.28, 6) // 2273.28
    expect(layout.cells[3].cx).toBeCloseTo(960 - 656.64, 6) // half-slot: midway between top slots
    expect(layout.cells[4].cx).toBeCloseTo(960 + 656.64, 6)
    expect(layout.cells[3].cy).toBeCloseTo(846.072, 6)
  })
})

describe('hexLayout — row arrangement', () => {
  it('places every cell on one row at topFrac', () => {
    const layout = hexLayout(3, 'row')
    expect(layout.arrangement).toBe('row')
    expect(layout.cells).toHaveLength(3)
    for (const cell of layout.cells) {
      expect(cell.cy).toBeCloseTo(587.412, 6)
      expect(cell.perimeter).toBeCloseTo(6 * R, 6)
    }
    expect(layout.cells[0].cx).toBeCloseTo(960 - 1313.28, 6)
    expect(layout.cells[1].cx).toBeCloseTo(960, 6)
    expect(layout.cells[2].cx).toBeCloseTo(960 + 1313.28, 6)
  })
})

describe('hexLayout — options', () => {
  it('scales geometry from custom fractions', () => {
    const layout = hexLayout(1, 'v', { width: 960, height: 540, hexRFrac: 0.1 })
    expect(layout.hexR).toBeCloseTo(54, 6)
    expect(layout.cells[0].perimeter).toBeCloseTo(324, 6) // 6 · 54
    expect(layout.strokeWidth).toBeCloseTo(4.32, 6) // 0.008 · 540 (unchanged fraction)
    expect(layout.cells[0].cx).toBeCloseTo(480, 6) // centerXFrac default 0.5 · 960
    expect(layout.cells[0].cy).toBeCloseTo(293.706, 6) // topFrac default 0.5439 · 540
  })

  it('honors explicit placement overrides', () => {
    const layout = hexLayout(1, 'v', { topFrac: 0.5, centerXFrac: 0.25, dropFrac: 0.1 })
    expect(layout.cells[0].cx).toBeCloseTo(480, 6)
    expect(layout.cells[0].cy).toBeCloseTo(540, 6)
    const dropped = hexLayout(3, 'v', { dropFrac: 0.1 })
    expect(dropped.cells[2].cy).toBeCloseTo(587.412 + 108, 6)
  })
})

describe('hexLayout — validation and determinism', () => {
  it('rejects non-positive and non-integer counts', () => {
    expect(() => hexLayout(0)).toThrow(RangeError)
    expect(() => hexLayout(-3)).toThrow(RangeError)
    expect(() => hexLayout(2.5)).toThrow(RangeError)
  })

  it('rejects unknown arrangements', () => {
    expect(() => hexLayout(3, 'grid' as never)).toThrow(RangeError)
  })

  it('is deterministic — same inputs, byte-identical output', () => {
    expect(JSON.stringify(hexLayout(3))).toBe(JSON.stringify(hexLayout(3)))
  })

  it('matches the locked snapshot', () => {
    expect(hexLayout(3)).toMatchSnapshot()
  })
})
