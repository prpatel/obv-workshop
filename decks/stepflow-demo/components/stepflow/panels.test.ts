import { describe, expect, it } from 'vitest'
import { panelsLayout, revealPlan, SWEEP_FRAC, type StackPanel } from './panels'

// Hand-computed constants for the default 1920×1080 canvas, from the wave-1
// re-measured v4 mosaic (tight fill masks on the settled frame, source scale
// 2038×1144): blue x244–1039, cyan x1040–1695 (abutting the blue seam), amber
// x244–797, green x800–1695; top row y386–707, bottom row y710–1029.
const SEED: StackPanel[] = [
  { id: 'blue', xFrac: 0.1197, yFrac: 0.3374, wFrac: 0.3906, hFrac: 0.2815, tone: 'accent', bandReveal: 'pop' },
  { id: 'cyan', xFrac: 0.5103, yFrac: 0.3374, wFrac: 0.3219, hFrac: 0.2815, tone: 'alt', bandReveal: 'pop' },
  { id: 'amber', xFrac: 0.1197, yFrac: 0.6206, wFrac: 0.2718, hFrac: 0.2797, tone: 'tertiary', bandReveal: 'pop' },
  { id: 'green', xFrac: 0.3925, yFrac: 0.6189, wFrac: 0.4396, hFrac: 0.2815, tone: 'quaternary', bandReveal: 'pop' },
]

// The legacy top-band sweep entry, kept for the styled sweep mechanism.
const BAND: StackPanel = { id: 'band', xFrac: 0.1178, yFrac: 0.333, wFrac: 0.7168, hFrac: 0.285, tone: 'accent', bandReveal: 'sweep' }

describe('panelsLayout — absolute rects', () => {
  it('resolves the measured four-panel mosaic on the default 1920×1080 stage', () => {
    const l = panelsLayout(SEED)

    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
    expect(l.panels).toHaveLength(4)

    const [blue, cyan, amber, green] = l.panels
    // blue:  0.1197·1920=229.824  0.3374·1080=364.392  0.3906·1920=749.952  0.2815·1080=304.02
    expect(blue.x).toBeCloseTo(229.824, 6)
    expect(blue.y).toBeCloseTo(364.392, 6)
    expect(blue.w).toBeCloseTo(749.952, 6)
    expect(blue.h).toBeCloseTo(304.02, 6)
    // cyan:  0.5103·1920=979.776  0.3219·1920=618.048
    expect(cyan.x).toBeCloseTo(979.776, 6)
    expect(cyan.y).toBeCloseTo(364.392, 6)
    expect(cyan.w).toBeCloseTo(618.048, 6)
    expect(cyan.h).toBeCloseTo(304.02, 6)
    // amber: 0.6206·1080=670.248  0.2718·1920=521.856  0.2797·1080=302.076
    expect(amber.x).toBeCloseTo(229.824, 6)
    expect(amber.y).toBeCloseTo(670.248, 6)
    expect(amber.w).toBeCloseTo(521.856, 6)
    expect(amber.h).toBeCloseTo(302.076, 6)
    // green: 0.3925·1920=753.6   0.6189·1080=668.412  0.4396·1920=844.032
    expect(green.x).toBeCloseTo(753.6, 6)
    expect(green.y).toBeCloseTo(668.412, 6)
    expect(green.w).toBeCloseTo(844.032, 6)
    expect(green.h).toBeCloseTo(304.02, 6)
  })

  it('scales every rect with a custom viewBox (off-nominal stage)', () => {
    const l = panelsLayout(SEED, { width: 960, height: 540 })
    const [blue] = l.panels

    expect(l.viewBox).toEqual({ width: 960, height: 540 })
    // Halving the stage halves every coordinate.
    expect(blue.x).toBeCloseTo(114.912, 6)
    expect(blue.y).toBeCloseTo(182.196, 6)
    expect(blue.w).toBeCloseTo(374.976, 6)
    expect(blue.h).toBeCloseTo(152.01, 6)
  })

  it('keeps content and reveal fields on the resolved rects (6-panel off-nominal seed)', () => {
    const six: StackPanel[] = [
      ...SEED,
      { id: 't5', xFrac: 0.05, yFrac: 0.05, wFrac: 0.1, hFrac: 0.1, tone: 'accent', title: 'T5', rows: ['a', 'b'] },
      { id: 't6', xFrac: 0.85, yFrac: 0.05, wFrac: 0.1, hFrac: 0.1, tone: 'alt' },
    ]
    const l = panelsLayout(six)

    expect(l.panels).toHaveLength(6)
    const t5 = l.panels[4]
    expect(t5.id).toBe('t5')
    expect(t5.tone).toBe('accent')
    expect(t5.title).toBe('T5')
    expect(t5.rows).toEqual(['a', 'b'])
    expect(t5.bandReveal).toBeUndefined() // default pop
    expect(t5.x).toBeCloseTo(0.05 * 1920, 6)
    expect(l.panels[0].bandReveal).toBe('pop')
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

describe('revealPlan — the re-paced 5-click choreography', () => {
  it('paces the measured mosaic to 5 clicks: blue, cyan, amber, green, labels', () => {
    const plan = revealPlan(SEED, true)
    expect(plan.panelClicks).toEqual([1, 2, 3, 4])
    expect(plan.labelClick).toBe(5)
    expect(plan.totalClicks).toBe(5)
  })

  it('gives the label click to caption-only slides too', () => {
    const bare: StackPanel[] = SEED.map(({ id, xFrac, yFrac, wFrac, hFrac, tone }) => ({ id, xFrac, yFrac, wFrac, hFrac, tone }))
    const plan = revealPlan(bare, true)
    expect(plan.labelClick).toBe(5)
    expect(plan.totalClicks).toBe(5)
  })

  it('omits the label click when no panel carries text and no caption is given', () => {
    const bare: StackPanel[] = SEED.map(({ id, xFrac, yFrac, wFrac, hFrac, tone }) => ({ id, xFrac, yFrac, wFrac, hFrac, tone }))
    const plan = revealPlan(bare, false)
    expect(plan.labelClick).toBe(0)
    expect(plan.totalClicks).toBe(4)
  })

  it('scales with panel count (off-nominal 6-panel seed)', () => {
    const six: StackPanel[] = [...SEED, { id: 't5', xFrac: 0.05, yFrac: 0.05, wFrac: 0.1, hFrac: 0.1, tone: 'accent', title: 'T5' }, { id: 't6', xFrac: 0.85, yFrac: 0.05, wFrac: 0.1, hFrac: 0.1, tone: 'alt' }]
    const plan = revealPlan(six, false)
    expect(plan.panelClicks).toEqual([1, 2, 3, 4, 5, 6])
    expect(plan.labelClick).toBe(7)
    expect(plan.totalClicks).toBe(7)
  })
})

describe('SWEEP_FRAC — the band sweep extent', () => {
  it('is 1: the recording sweeps the full band width (settled bbox x240–1694 of band x240–1701)', () => {
    expect(SWEEP_FRAC).toBe(1)
    // The component sizes the sweep element as w · SWEEP_FRAC — at 1 it covers
    // the band exactly (no unfilled strip at the right edge).
    const [band] = panelsLayout([BAND]).panels
    expect(band.w * SWEEP_FRAC).toBeCloseTo(1376.256, 6)
  })
})
