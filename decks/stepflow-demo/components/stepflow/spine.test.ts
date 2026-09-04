import { describe, expect, it } from 'vitest'
import { heroTileLayout, spineLayout } from './spine'

/**
 * Hand-computed constants (geometry.test.ts pattern): every expected value is
 * derived from the measured fractions × the default 1920×1080 viewBox, worked
 * out by hand and asserted to 1e-6. Source: exact-trace sheet art_mkVNxsft
 * §3 (VerticalSpine) / §4 (HeroTile).
 */
describe('spineLayout', () => {
  it('places center elements on the axis with the measured y rhythm', () => {
    const layout = spineLayout(2)

    // cx = 0.475520833333 × 1920 = 913
    expect(layout.elements[0].cx).toBeCloseTo(913.0, 6)
    // cy0 = 0.367546296296 × 1080 = 396.95; pitch = 0.09662037037 × 1080 = 104.35
    expect(layout.elements[0].cy).toBeCloseTo(396.95, 6)
    expect(layout.elements[1].cy).toBeCloseTo(501.3, 6)
  })

  it('emits stable indices and identical cx for every element', () => {
    const layout = spineLayout(4)
    expect(layout.elements.map((e) => e.index)).toEqual([0, 1, 2, 3])
    expect(new Set(layout.elements.map((e) => e.cx)).size).toBe(1)
  })

  it('slots the side cards at the measured x positions with per-side sizes', () => {
    const layout = spineLayout(2)

    // Left (cyan) card, art_mkVNxsft §3.4: 130×103.9 plate at cx 468.
    expect(layout.cards.left.cx).toBeCloseTo(468.0, 6) // 0.24375 × 1920
    expect(layout.cards.left.cy).toBeCloseTo(749.55, 6) // 0.694027777778 × 1080
    expect(layout.cards.left.w).toBeCloseTo(130.0, 6) // 0.067708333333 × 1920
    expect(layout.cards.left.h).toBeCloseTo(103.9, 6) // 0.096203703704 × 1080
    expect(layout.cards.left.captionY).toBeCloseTo(883.1, 6) // 0.817685185185 × 1080

    // Right (blue) card is NOT equal to the left: 135.5×55.5 at cx 1358.95.
    expect(layout.cards.right.cx).toBeCloseTo(1358.95, 6) // 0.707786458333 × 1920
    expect(layout.cards.right.w).toBeCloseTo(135.5, 6) // 0.070572916667 × 1920
    expect(layout.cards.right.h).toBeCloseTo(55.5, 6) // 0.051388888889 × 1080
  })

  it('sizes the axis glyph box from the measured fractions', () => {
    const layout = spineLayout(1)
    expect(layout.iconW).toBeCloseTo(85.7, 6) // 0.044635416667 × 1920
    expect(layout.iconH).toBeCloseTo(93.5, 6) // 0.086574074074 × 1080
  })

  it('lays out the axis chrome: stub above the measured rule crossing the axis', () => {
    const layout = spineLayout(2)

    // Stub hangs from the label block down to the rule (art_mkVNxsft §3.5).
    expect(layout.axis.stubCx).toBeCloseTo(913.0, 6)
    expect(layout.axis.stubY).toBeCloseTo(567.4, 6) // 0.52537037037 × 1080
    expect(layout.axis.stubW).toBeCloseTo(6.3, 6) // 0.00328125 × 1920
    expect(layout.axis.stubH).toBeCloseTo(32.1, 6) // 0.029722222222 × 1080

    // The axis rule: burnt-orange, x464.3–1361.7 at y602.3, core 4.7px thick.
    expect(layout.axis.ruleX1).toBeCloseTo(464.3, 6) // 0.241822916667 × 1920
    expect(layout.axis.ruleX2).toBeCloseTo(1361.7, 6) // 0.70921875 × 1920
    expect(layout.axis.ruleY).toBeCloseTo(602.3, 6) // 0.557685185185 × 1080
    expect(layout.axis.ruleH).toBeCloseTo(4.7, 6) // 0.004351851852 × 1080
    // The stub hangs centered on the axis, which the rule crosses.
    expect(layout.axis.stubCx).toBeCloseTo((layout.axis.ruleX1 + layout.axis.ruleX2) / 2, 3)
  })

  it('lays out the footer chrome at the measured rhythm', () => {
    const layout = spineLayout(2)

    // Bottom rule: #403f48, x192.1–1633.9 (w 1441.8) at y1047.65, 5.7 thick
    // (fraction 0.970046296296 × 1080 — inside the sheet's y1045–1051 band).
    expect(layout.footer.ruleCx).toBeCloseTo(913.0, 6)
    expect(layout.footer.ruleCy).toBeCloseTo(1047.65, 6) // 0.970046296296 × 1080
    expect(layout.footer.ruleH).toBeCloseTo(5.7, 6) // 0.005277777778 × 1080
    expect(layout.footer.lineY).toBeCloseTo(959.4, 6) // 0.888333333333 × 1080
  })

  it('honors custom viewBox and fraction overrides (off-nominal)', () => {
    const layout = spineLayout(2, { width: 960, height: 540, centerXFrac: 0.5, markerYFrac: 0.1, pitchYFrac: 0.2 })
    expect(layout.elements[0].cx).toBeCloseTo(480, 6)
    expect(layout.elements[0].cy).toBeCloseTo(54, 6)
    expect(layout.elements[1].cy).toBeCloseTo(162, 6) // 54 + 1 × 108
    expect(layout.viewBox).toEqual({ width: 960, height: 540 })
  })

  it('rejects non-positive and non-integer counts', () => {
    expect(() => spineLayout(0)).toThrow(RangeError)
    expect(() => spineLayout(-1)).toThrow(RangeError)
    expect(() => spineLayout(1.5)).toThrow(RangeError)
  })
})

describe('heroTileLayout', () => {
  it('centers the measured 227px square on the spine axis, below canvas center', () => {
    const layout = heroTileLayout()
    expect(layout.size).toBeCloseTo(227.0, 6) // 0.118229166667 × 1920
    expect(layout.cx).toBeCloseTo(914.0, 6) // 0.476041666667 × 1920
    expect(layout.cy).toBeCloseTo(700.5, 6) // 0.648611111111 × 1080
  })

  it('fits the halo to the measured falloff and the cutout to its traced box', () => {
    const layout = heroTileLayout()
    // Tight halo ring: accent luma peaks ≈0.30 opacity at the tile edge and
    // dies to 0 by r ≈ 161.5px (linear falloff off the settled frame).
    expect(layout.glowR).toBeCloseTo(161.5, 6) // 0.084114583333 × 1920
    expect(layout.glowR).toBeCloseTo(layout.size / 2 + 48.0, 3) // 161.5 − 113.5 = 48.0px beyond the edge
    // Cutout glyph box, art_mkVNxsft §4.2 (ring/bar/legs mark).
    expect(layout.iconW).toBeCloseTo(95.0, 6) // 0.049479166667 × 1920
    expect(layout.iconH).toBeCloseTo(107.5, 6) // 0.099537037037 × 1080
  })

  it('honors overrides (off-nominal)', () => {
    const layout = heroTileLayout({ width: 800, height: 600, centerXFrac: 0.5, centerYFrac: 0.5, tileWFrac: 0.25 })
    expect(layout.size).toBeCloseTo(200, 6)
    expect(layout.cx).toBeCloseTo(400, 6)
    expect(layout.cy).toBeCloseTo(300, 6)
    expect(layout.viewBox).toEqual({ width: 800, height: 600 })
  })
})
