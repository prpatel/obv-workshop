import { describe, expect, it } from 'vitest'
import {
  panelsLayout,
  panelPath,
  plateLayout,
  PLATE,
  revealPlan,
  STACKPANELS_CAPTION,
  STACKPANELS_HEADER,
  STACKPANELS_SEED,
} from './panels'

// Hand-derived rect for the path tests (geometry independent of the sheet).
const rect = { x: 100, y: 200, w: 300, h: 150 }

describe('plateLayout — the settled-state white plate (art_mkVNxsft §1.2)', () => {
  it('resolves the sheet-measured plate rect, cut, fill, and border', () => {
    const plate = plateLayout()

    expect(plate.x).toBeCloseTo(222.2, 6)
    expect(plate.y).toBeCloseTo(356.9, 6)
    expect(plate.w).toBeCloseTo(1382.5, 6)
    expect(plate.h).toBeCloseTo(623.0, 6)
    expect(plate.cut).toBeCloseTo(10, 6)
    expect(plate.fill).toBe('#f5f5f5')
    expect(plate.border).toBe('#989898')
    expect(plate.borderWidth).toBe(1)
  })

  it('carries the cut as a stage-height fraction in the spec', () => {
    expect(PLATE.cutFrac).toBeCloseTo(10 / 1080, 8)
    expect(PLATE.xFrac).toBeCloseTo(222.2 / 1920, 8)
    expect(PLATE.hFrac).toBeCloseTo(623.0 / 1080, 8)
  })

  it('scales with the viewBox (off-nominal stage)', () => {
    const plate = plateLayout({ width: 960, height: 540 })

    expect(plate.w).toBeCloseTo(1382.5 / 2, 6)
    expect(plate.h).toBeCloseTo(623.0 / 2, 6)
    expect(plate.cut).toBeCloseTo(5, 6)
    expect(plate.fill).toBe('#f5f5f5')
  })
})

describe('panelPath — 45° corner cuts', () => {
  it('cuts the top-left corner (outer corner of the TL panel)', () => {
    expect(panelPath(rect, 10, 'tl')).toBe('M 110 200 H 400 V 350 H 100 V 210 Z')
  })

  it('cuts the top-right corner (outer corner of the TR panel)', () => {
    expect(panelPath(rect, 10, 'tr')).toBe('M 100 200 H 390 L 400 210 V 350 H 100 Z')
  })

  it('cuts the bottom-left corner (outer corner of the BL panel)', () => {
    expect(panelPath(rect, 10, 'bl')).toBe('M 100 200 H 400 V 350 H 110 L 100 340 Z')
  })

  it('cuts the bottom-right corner (outer corner of the BR panel)', () => {
    expect(panelPath(rect, 10, 'br')).toBe('M 100 200 H 400 V 340 L 390 350 H 100 Z')
  })

  it('degenerates to the plain rect outline at cut 0 (corner irrelevant)', () => {
    expect(panelPath(rect, 0, 'br')).toBe('M 100 200 H 400 V 350 H 100 Z')
  })

  it('throws when the cut overruns the rect or goes negative', () => {
    expect(() => panelPath(rect, 80, 'tl')).toThrow(RangeError)
    expect(() => panelPath(rect, -1, 'tl')).toThrow(RangeError)
    expect(() => panelPath(rect, Number.NaN, 'tl')).toThrow(RangeError)
  })
})

describe('STACKPANELS_SEED + sheet strings (art_mkVNxsft §1.2)', () => {
  it('carries the corrected header, caption, and panel-title strings', () => {
    expect(STACKPANELS_HEADER.lead).toBe('One')
    expect(STACKPANELS_HEADER.accent).toBe('unified environment')
    expect(STACKPANELS_CAPTION.text).toBe('ONE ENVIRONMENT')
    expect(STACKPANELS_SEED.map((panel) => panel.title)).toEqual([
      'INGESTION',
      'TRANSFORM',
      'STORAGE',
      'MONITORING',
    ])
  })

  it('pins the header and caption to the measured ink extents', () => {
    expect(STACKPANELS_HEADER.leadCapHeight).toBeCloseTo(42, 6)
    expect(STACKPANELS_HEADER.accentCapHeight).toBeCloseTo(64, 6)
    expect(STACKPANELS_HEADER.baseline).toBeCloseTo(162.0, 6)
    expect(STACKPANELS_HEADER.leadBox.xFrac * 1920).toBeCloseTo(480, 4)
    expect((STACKPANELS_HEADER.leadBox.xFrac + STACKPANELS_HEADER.leadBox.wFrac) * 1920).toBeCloseTo(640, 4)
    expect(STACKPANELS_HEADER.accentBox.xFrac * 1920).toBeCloseTo(662, 4)
    expect((STACKPANELS_HEADER.accentBox.xFrac + STACKPANELS_HEADER.accentBox.wFrac) * 1920).toBeCloseTo(1444, 4)

    const captionCenter = (STACKPANELS_CAPTION.box.xFrac + STACKPANELS_CAPTION.box.wFrac / 2) * 1920
    expect(captionCenter).toBeCloseTo(908.75, 4)
    expect((STACKPANELS_CAPTION.box.yFrac + STACKPANELS_CAPTION.box.hFrac) * 1080).toBeCloseTo(1065.9, 4)
  })

  it('renders the mosaic at the sheet-measured bboxes with outer corner cuts', () => {
    const l = panelsLayout(STACKPANELS_SEED)
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })

    const [blue, cyan, amber, green] = l.panels
    // Sheet bboxes: blue x229.8 y364.4 748.6×301.2, cyan x981.3 615.0 wide,
    // amber y670.3 520.8 wide, green x753.4 y668.7 842.9×302.7.
    expect(blue.x).toBeCloseTo(229.8, 4)
    expect(blue.y).toBeCloseTo(364.4, 4)
    expect(blue.w).toBeCloseTo(748.6, 4)
    expect(blue.h).toBeCloseTo(301.2, 4)
    expect(cyan.x).toBeCloseTo(981.3, 4)
    expect(cyan.w).toBeCloseTo(615.0, 4)
    expect(amber.y).toBeCloseTo(670.3, 4)
    expect(amber.w).toBeCloseTo(520.8, 4)
    expect(green.x).toBeCloseTo(753.4, 4)
    expect(green.y).toBeCloseTo(668.7, 4)
    expect(green.w).toBeCloseTo(842.9, 4)
    expect(green.h).toBeCloseTo(302.7, 4)

    expect(STACKPANELS_SEED.map((panel) => panel.cutCorner)).toEqual(['tl', 'tr', 'bl', 'br'])
    expect(STACKPANELS_SEED.map((panel) => panel.tone)).toEqual([
      'accent',
      'alt',
      'tertiary',
      'quaternary',
    ])
  })

  it('carries the four distinct sheet glyphs at measured ink boxes', () => {
    expect(STACKPANELS_SEED.map((panel) => panel.icon)).toEqual([
      'dash-grid',
      'filter',
      'database',
      'navigation-2',
    ])

    const blue = STACKPANELS_SEED[0]
    expect(blue.iconBox!.xFrac * 1920).toBeCloseTo(398.3, 4)
    expect(blue.iconBox!.yFrac * 1080).toBeCloseTo(489.0, 4)
    expect(blue.iconBox!.wFrac * 1920).toBeCloseTo(74.4, 4)
    expect(blue.iconBox!.hFrac * 1080).toBeCloseTo(49.1, 4)

    // Title boxes are the sheet's native ink bboxes × the 2038→1920 / 1144→1080
    // factors: INGESTION x550–854 native → 517.94–804.22 @1080-stage.
    expect(blue.titleBox!.xFrac * 1920).toBeCloseTo(550 * 0.94171, 2)
    expect(blue.titleBox!.wFrac * 1920).toBeCloseTo(304 * 0.94171, 2)
    expect(blue.titleBox!.yFrac * 1080).toBeCloseTo(526 * 0.944055, 2)
  })

  it('keeps the green panel empty below its title — the wave-1 rows are gone', () => {
    const green = STACKPANELS_SEED[3]
    expect(green.title).toBe('MONITORING')
    expect(Object.hasOwn(green, 'rows')).toBe(false)
    for (const panel of STACKPANELS_SEED) {
      expect(Object.hasOwn(panel, 'rows')).toBe(false)
    }
  })

  it('defaults bandReveal to the recording fade and ships the seed with it explicit', () => {
    for (const panel of STACKPANELS_SEED) {
      expect(panel.bandReveal).toBe('fade')
    }
  })
})

describe('panelsLayout — absolute rects (pure math)', () => {
  it('scales every rect with a custom viewBox (off-nominal stage)', () => {
    const l = panelsLayout(STACKPANELS_SEED, { width: 960, height: 540 })
    const [blue] = l.panels

    expect(l.viewBox).toEqual({ width: 960, height: 540 })
    // Halving the stage halves every coordinate.
    expect(blue.x).toBeCloseTo(114.9, 4)
    expect(blue.y).toBeCloseTo(182.2, 4)
    expect(blue.w).toBeCloseTo(374.3, 4)
    expect(blue.h).toBeCloseTo(150.6, 4)
  })

  it('keeps content fields on the resolved rects', () => {
    const l = panelsLayout(STACKPANELS_SEED)
    const [blue] = l.panels

    expect(blue.id).toBe('blue')
    expect(blue.tone).toBe('accent')
    expect(blue.title).toBe('INGESTION')
    expect(blue.icon).toBe('dash-grid')
    expect(blue.cutCorner).toBe('tl')
  })

  it('accepts an empty panel list (renders nothing, throws nothing)', () => {
    const l = panelsLayout([])
    expect(l.panels).toEqual([])
  })

  it('throws on out-of-range fractions', () => {
    const bad: StackPanelLike[] = [{ ...STACKPANELS_SEED[0], xFrac: 1.2 }]
    expect(() => panelsLayout(bad)).toThrow(RangeError)
  })
})

describe('revealPlan — re-paced click schedule', () => {
  it('paces the demo seed to five clicks: four fades + the closing beat', () => {
    const plan = revealPlan(STACKPANELS_SEED, true)
    expect(plan.panelClicks).toEqual([1, 2, 3, 4])
    expect(plan.labelClick).toBe(5)
    expect(plan.totalClicks).toBe(5)
  })

  it('ends on the last panel when there is no caption', () => {
    const plan = revealPlan(STACKPANELS_SEED)
    expect(plan.panelClicks).toEqual([1, 2, 3, 4])
    expect(plan.labelClick).toBe(0)
    expect(plan.totalClicks).toBe(4)
  })
})

/** Structural subset for the bad-fraction test (avoids importing types twice). */
interface StackPanelLike {
  xFrac: number
  yFrac: number
  wFrac: number
  hFrac: number
  id: string
  tone: 'accent'
}
