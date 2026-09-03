import { describe, expect, it } from 'vitest'
import { heroTileLayout, spineLayout } from './spine'

/**
 * Hand-computed constants (geometry.test.ts pattern): every expected value is
 * derived from the measured fractions × the default 1920×1080 viewBox, worked
 * out by hand and asserted to 1e-6.
 */
describe('spineLayout', () => {
  it('places center elements on the axis with the measured y rhythm', () => {
    const layout = spineLayout(3)

    // cx = 0.476 × 1920 = 913.92
    expect(layout.elements[0].cx).toBeCloseTo(913.92, 6)
    // cy0 = 0.368 × 1080 = 397.44; pitch = 0.0966 × 1080 = 104.328
    expect(layout.elements[0].cy).toBeCloseTo(397.44, 6)
    expect(layout.elements[1].cy).toBeCloseTo(501.768, 6)
    expect(layout.elements[2].cy).toBeCloseTo(606.096, 6)
  })

  it('emits stable indices and identical cx for every element', () => {
    const layout = spineLayout(4)
    expect(layout.elements.map((e) => e.index)).toEqual([0, 1, 2, 3])
    expect(new Set(layout.elements.map((e) => e.cx)).size).toBe(1)
  })

  it('slots the side cards at the measured x positions', () => {
    const layout = spineLayout(3)

    expect(layout.cards.left.cx).toBeCloseTo(468.48, 6) // 0.244 × 1920
    expect(layout.cards.right.cx).toBeCloseTo(1359.36, 6) // 0.708 × 1920
    expect(layout.cards.left.cy).toBeCloseTo(749.52, 6) // 0.694 × 1080
    expect(layout.cards.left.w).toBeCloseTo(129.024, 6) // 0.0672 × 1920
    expect(layout.cards.left.h).toBeCloseTo(104.76, 6) // 0.097 × 1080
    expect(layout.cards.left.captionY).toBeCloseTo(883.44, 6) // 0.818 × 1080
  })

  it('sizes the marker rhombus from the measured fractions', () => {
    const layout = spineLayout(1)
    expect(layout.markerW).toBeCloseTo(84.48, 6) // 0.044 × 1920
    expect(layout.markerH).toBeCloseTo(92.88, 6) // 0.086 × 1080
  })

  it('honors custom viewBox and fraction overrides (off-nominal)', () => {
    const layout = spineLayout(3, { width: 960, height: 540, centerXFrac: 0.5, markerYFrac: 0.1, pitchYFrac: 0.2 })
    expect(layout.elements[0].cx).toBeCloseTo(480, 6)
    expect(layout.elements[0].cy).toBeCloseTo(54, 6)
    expect(layout.elements[2].cy).toBeCloseTo(270, 6) // 54 + 2 × 108
    expect(layout.viewBox).toEqual({ width: 960, height: 540 })
  })

  it('rejects non-positive and non-integer counts', () => {
    expect(() => spineLayout(0)).toThrow(RangeError)
    expect(() => spineLayout(-1)).toThrow(RangeError)
    expect(() => spineLayout(1.5)).toThrow(RangeError)
  })
})

describe('heroTileLayout', () => {
  it('centers the measured 12%w square on the spine axis, below canvas center', () => {
    const layout = heroTileLayout()
    expect(layout.size).toBeCloseTo(230.4, 6) // 0.12 × 1920
    expect(layout.cx).toBeCloseTo(913.92, 6) // 0.476 × 1920
    expect(layout.cy).toBeCloseTo(700.92, 6) // 0.649 × 1080
  })

  it('honors overrides (off-nominal)', () => {
    const layout = heroTileLayout({ width: 800, height: 600, centerXFrac: 0.5, centerYFrac: 0.5, tileWFrac: 0.25 })
    expect(layout.size).toBeCloseTo(200, 6)
    expect(layout.cx).toBeCloseTo(400, 6)
    expect(layout.cy).toBeCloseTo(300, 6)
    expect(layout.viewBox).toEqual({ width: 800, height: 600 })
  })
})
