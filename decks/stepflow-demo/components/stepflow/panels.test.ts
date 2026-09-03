import { describe, expect, it } from 'vitest'
import { panelsLayout, revealPlan, SWEEP_FRAC, type StackPanel } from './panels'

// Hand-computed constants for the default 1920×1080 canvas, from the measured
// v4 mosaic fractions (research art_0AzKGXnD §F3, re-measured this session
// from the recording frames at source scale 2038×1144):
//   band  x240–1701 y381–707  → 0.1178, 0.3330, 0.7168, 0.2850
//   amber x240–798  y708–1035 → 0.1178, 0.6189, 0.2738, 0.2858
//   green x798–1701 y708–1035 → 0.3916, 0.6189, 0.4431, 0.2858
const SEED: StackPanel[] = [
  { id: 'band', xFrac: 0.1178, yFrac: 0.333, wFrac: 0.7168, hFrac: 0.285, tone: 'accent', bandReveal: 'sweep' },
  { id: 'amber', xFrac: 0.1178, yFrac: 0.6189, wFrac: 0.2738, hFrac: 0.2858, tone: 'alt', bandReveal: 'pop' },
  { id: 'green', xFrac: 0.3916, yFrac: 0.6189, wFrac: 0.4431, hFrac: 0.2858, tone: 'tertiary', bandReveal: 'pop' },
]

describe('panelsLayout — absolute rects', () => {
  it('resolves the measured three-panel mosaic on the default 1920×1080 stage', () => {
    const l = panelsLayout(SEED)

    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
    expect(l.panels).toHaveLength(3)

    const [band, amber, green] = l.panels
    // 0.1178 · 1920 = 226.176   0.3330 · 1080 = 359.64
    // 0.7168 · 1920 = 1376.256  0.2850 · 1080 = 307.8
    expect(band.x).toBeCloseTo(226.176, 6)
    expect(band.y).toBeCloseTo(359.64, 6)
    expect(band.w).toBeCloseTo(1376.256, 6)
    expect(band.h).toBeCloseTo(307.8, 6)
    // 0.6189 · 1080 = 668.412   0.2738 · 1920 = 525.696
    // 0.2858 · 1080 = 308.664
    expect(amber.x).toBeCloseTo(226.176, 6)
    expect(amber.y).toBeCloseTo(668.412, 6)
    expect(amber.w).toBeCloseTo(525.696, 6)
    expect(amber.h).toBeCloseTo(308.664, 6)
    // 0.3916 · 1920 = 751.872   0.4431 · 1920 = 850.752
    expect(green.x).toBeCloseTo(751.872, 6)
    expect(green.y).toBeCloseTo(668.412, 6)
    expect(green.w).toBeCloseTo(850.752, 6)
    expect(green.h).toBeCloseTo(308.664, 6)
  })

  it('scales every rect with a custom viewBox (off-nominal stage)', () => {
    const l = panelsLayout(SEED, { width: 960, height: 540 })
    const [band] = l.panels

    expect(l.viewBox).toEqual({ width: 960, height: 540 })
    // Halving the stage halves every coordinate.
    expect(band.x).toBeCloseTo(113.088, 6)
    expect(band.y).toBeCloseTo(179.82, 6)
    expect(band.w).toBeCloseTo(688.128, 6)
    expect(band.h).toBeCloseTo(153.9, 6)
  })

  it('keeps content and reveal fields on the resolved rects (5-panel off-nominal seed)', () => {
    const five: StackPanel[] = [
      ...SEED,
      { id: 't4', xFrac: 0.05, yFrac: 0.05, wFrac: 0.1, hFrac: 0.1, tone: 'accent', title: 'T4', rows: ['a', 'b'] },
      { id: 't5', xFrac: 0.85, yFrac: 0.05, wFrac: 0.1, hFrac: 0.1, tone: 'alt' },
    ]
    const l = panelsLayout(five)

    expect(l.panels).toHaveLength(5)
    const t4 = l.panels[3]
    expect(t4.id).toBe('t4')
    expect(t4.tone).toBe('accent')
    expect(t4.title).toBe('T4')
    expect(t4.rows).toEqual(['a', 'b'])
    expect(t4.bandReveal).toBeUndefined() // default pop
    expect(t4.x).toBeCloseTo(0.05 * 1920, 6)
    expect(l.panels[0].bandReveal).toBe('sweep')
  })

  it('accepts an empty panel list (renders nothing, throws nothing)', () => {
    const l = panelsLayout([])
    expect(l.panels).toEqual([])
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
  })
})

describe('panelsLayout — validation', () => {
  it('rejects fractions outside [0, 1] with the panel id named', () => {
    expect(() => panelsLayout([{ id: 'x', xFrac: 1.5, yFrac: 0, wFrac: 0.1, hFrac: 0.1, tone: 'accent' }]))
      .toThrow(RangeError)
    expect(() => panelsLayout([{ id: 'y', xFrac: 0, yFrac: -0.1, wFrac: 0.1, hFrac: 0.1, tone: 'accent' }]))
      .toThrow(/panel "y"/)
  })

  it('rejects non-finite fractions and non-positive extents', () => {
    expect(() => panelsLayout([{ id: 'n', xFrac: Number.NaN, yFrac: 0, wFrac: 0.1, hFrac: 0.1, tone: 'accent' }]))
      .toThrow(RangeError)
    expect(() => panelsLayout([{ id: 'z', xFrac: 0, yFrac: 0, wFrac: 0, hFrac: 0.1, tone: 'accent' }]))
      .toThrow(/extent/)
  })
})

describe('revealPlan — the re-paced 4-click choreography', () => {
  it('paces the measured mosaic to 4 clicks: band, amber, green, labels', () => {
    const plan = revealPlan(SEED, true)
    expect(plan.panelClicks).toEqual([1, 2, 3])
    expect(plan.labelClick).toBe(4)
    expect(plan.totalClicks).toBe(4)
  })

  it('gives the label click to caption-only slides too', () => {
    const bare: StackPanel[] = SEED.map(({ id, xFrac, yFrac, wFrac, hFrac, tone }) => ({ id, xFrac, yFrac, wFrac, hFrac, tone }))
    const plan = revealPlan(bare, true)
    expect(plan.labelClick).toBe(4)
    expect(plan.totalClicks).toBe(4)
  })

  it('omits the label click when no panel carries text and no caption is given', () => {
    const bare: StackPanel[] = SEED.map(({ id, xFrac, yFrac, wFrac, hFrac, tone }) => ({ id, xFrac, yFrac, wFrac, hFrac, tone }))
    const plan = revealPlan(bare, false)
    expect(plan.labelClick).toBe(0)
    expect(plan.totalClicks).toBe(3)
  })

  it('scales with panel count (off-nominal 5-panel seed)', () => {
    const five: StackPanel[] = [...SEED, { id: 't4', xFrac: 0.05, yFrac: 0.05, wFrac: 0.1, hFrac: 0.1, tone: 'accent', title: 'T4' }, { id: 't5', xFrac: 0.85, yFrac: 0.05, wFrac: 0.1, hFrac: 0.1, tone: 'alt' }]
    const plan = revealPlan(five, false)
    expect(plan.panelClicks).toEqual([1, 2, 3, 4, 5])
    expect(plan.labelClick).toBe(6)
    expect(plan.totalClicks).toBe(6)
  })
})

describe('SWEEP_FRAC — the band sweep extent', () => {
  it('is 1: the recording sweeps the full band width (settled bbox x240–1694 of band x240–1701)', () => {
    expect(SWEEP_FRAC).toBe(1)
    // The component sizes the sweep element as w · SWEEP_FRAC — at 1 it covers
    // the band exactly (no unfilled strip at the right edge).
    const [band] = panelsLayout(SEED).panels
    expect(band.w * SWEEP_FRAC).toBeCloseTo(1376.256, 6)
  })
})
