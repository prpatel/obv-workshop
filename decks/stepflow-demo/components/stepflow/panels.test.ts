import { describe, expect, it } from 'vitest'
import {
  panelsLayout,
  panelPath,
  plateLayout,
  PLATE,
  revealPlan,
  STACKPANELS_BADGE,
  STACKPANELS_CAPTION,
  STACKPANELS_FRAME,
  STACKPANELS_HEADER,
  STACKPANELS_SEED,
} from './panels'

// Hand-derived rect for the path tests (geometry independent of the reference).
const rect = { x: 100, y: 200, w: 300, h: 150 }

describe('plateLayout — the legacy light-trace white plate (art_mkVNxsft §1.2)', () => {
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

describe('STACKPANELS_SEED + settled-frame strings (packet fl_bRELEFpX)', () => {
  it('carries the settled header, caption, and panel-title strings', () => {
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
    expect(STACKPANELS_HEADER.leadCapHeight).toBeCloseTo(54, 6)
    expect(STACKPANELS_HEADER.accentCapHeight).toBeCloseTo(63, 6)
    expect(STACKPANELS_HEADER.baseline).toBeCloseTo(161.5, 6)
    // MAD-tuned pin boxes (lead 480–640, accent 655–1453; measured reference
    // ink: lead x481–638, accent x660–1443).
    expect(STACKPANELS_HEADER.leadBox.xFrac * 1920).toBeCloseTo(480, 4)
    expect((STACKPANELS_HEADER.leadBox.xFrac + STACKPANELS_HEADER.leadBox.wFrac) * 1920).toBeCloseTo(640, 4)
    expect(STACKPANELS_HEADER.accentBox.xFrac * 1920).toBeCloseTo(655, 4)
    expect((STACKPANELS_HEADER.accentBox.xFrac + STACKPANELS_HEADER.accentBox.wFrac) * 1920).toBeCloseTo(1453, 4)

    const captionCenter = (STACKPANELS_CAPTION.box.xFrac + STACKPANELS_CAPTION.box.wFrac / 2) * 1920
    expect(captionCenter).toBeCloseTo(956.65, 4)
    expect((STACKPANELS_CAPTION.box.yFrac + STACKPANELS_CAPTION.box.hFrac) * 1080).toBeCloseTo(928, 4)
  })

  it('ships the top-right source mark at its measured raster box', () => {
    expect(STACKPANELS_BADGE.box.xFrac * 1920).toBeCloseTo(1849, 4)
    expect(STACKPANELS_BADGE.box.yFrac * 1080).toBeCloseTo(17, 4)
    expect(STACKPANELS_BADGE.box.wFrac * 1920).toBeCloseTo(53, 4)
    expect(STACKPANELS_BADGE.box.hFrac * 1080).toBeCloseTo(46, 4)
    expect(STACKPANELS_BADGE.dataUri.startsWith('data:image/png;base64,')).toBe(true)
  })

  it('renders the mosaic at the measured bboxes in onset order with outer corner cuts', () => {
    const l = panelsLayout(STACKPANELS_SEED)
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })

    const [blue, cyan, amber, green] = l.panels
    // Measured settled bboxes (2560×1440 ×0.75): blue x402 y354 610.5×247.5,
    // cyan x1013.25 504.75 wide, amber y603 426×246, green x828 y601.5 690 wide.
    expect(blue.x).toBeCloseTo(402, 6)
    expect(blue.y).toBeCloseTo(354, 6)
    expect(blue.w).toBeCloseTo(610.5, 6)
    expect(blue.h).toBeCloseTo(247.5, 6)
    expect(cyan.x).toBeCloseTo(1013.25, 6)
    expect(cyan.w).toBeCloseTo(504.75, 6)
    expect(amber.y).toBeCloseTo(603, 6)
    expect(amber.w).toBeCloseTo(426, 6)
    expect(green.x).toBeCloseTo(828, 6)
    expect(green.y).toBeCloseTo(601.5, 6)
    expect(green.w).toBeCloseTo(690, 6)
    expect(green.h).toBeCloseTo(247.5, 6)

    // Onset order: blue 0.067s → cyan 0.267s → amber 0.867s → green 1.2s.
    expect(STACKPANELS_SEED.map((panel) => panel.id)).toEqual(['blue', 'cyan', 'amber', 'green'])
    expect(STACKPANELS_SEED.map((panel) => panel.cutCorner)).toEqual(['tl', 'tr', 'bl', 'br'])
    expect(STACKPANELS_SEED.map((panel) => panel.tone)).toEqual([
      'accent',
      'alt',
      'tertiary',
      'quaternary',
    ])
  })

  it('carries the four distinct glyphs at measured ink boxes', () => {
    expect(STACKPANELS_SEED.map((panel) => panel.icon)).toEqual([
      'dash-grid',
      'filter',
      'database',
      'navigation-2',
    ])

    const blue = STACKPANELS_SEED[0]
    expect(blue.iconBox!.xFrac * 1920).toBeCloseTo(533.04, 6)
    expect(blue.iconBox!.yFrac * 1080).toBeCloseTo(445.4, 6)
    expect(blue.iconBox!.wFrac * 1920).toBeCloseTo(73.92, 6)
    expect(blue.iconBox!.hFrac * 1080).toBeCloseTo(61.2, 6)

    // INGESTION ink run x637.5–872.2, cap band y462–492 @1080.
    expect(blue.titleBox!.xFrac * 1920).toBeCloseTo(637.5, 6)
    expect(blue.titleBox!.wFrac * 1920).toBeCloseTo(234.7, 6)
    expect(blue.titleBox!.yFrac * 1080).toBeCloseTo(462, 6)
    expect(blue.titleBox!.hFrac * 1080).toBeCloseTo(30, 6)
  })

  it('defaults bandReveal to the recording fade and ships the seed with it explicit', () => {
    for (const panel of STACKPANELS_SEED) {
      expect(panel.bandReveal).toBe('fade')
    }
  })
})

describe('STACKPANELS_FRAME — the white perimeter frame + chamfer patches', () => {
  it('hugs the mosaic with four ~6px open-cornered bars at measured extents', () => {
    const { width, height } = { width: 1920, height: 1080 }
    const byId = new Map(STACKPANELS_FRAME.segments.map((seg) => [seg.id, seg]))

    const top = byId.get('top')!
    expect(top.xFrac * width).toBeCloseTo(406.5, 6)
    expect(top.yFrac * height).toBeCloseTo(348, 6)
    expect(top.wFrac * width).toBeCloseTo(1107, 6)
    expect(top.hFrac * height).toBeCloseTo(6, 6)

    const left = byId.get('left')!
    expect(left.xFrac * width).toBeCloseTo(396, 6)
    expect(left.wFrac * width).toBeCloseTo(6, 6)

    const right = byId.get('right')!
    expect(right.xFrac * width).toBeCloseTo(1518, 6)
    expect(right.wFrac * width).toBeCloseTo(6, 6)

    const bottom = byId.get('bottom')!
    expect(bottom.yFrac * height).toBeCloseTo(849, 6)
    expect(bottom.hFrac * height).toBeCloseTo(7.5, 6)

    expect(STACKPANELS_FRAME.color).toBe('#f5f4f7')
  })

  it('delays the segments as the recording draws the perimeter clockwise', () => {
    const delays = STACKPANELS_FRAME.segments.map((seg) => [seg.id, seg.delayMs])
    expect(delays).toEqual([
      ['top', 933],
      ['right', 1000],
      ['bottom', 1067],
      ['left', 1200],
    ])
    // Patches ride the segment that reaches their corner.
    const patches = new Map(STACKPANELS_FRAME.patches.map((patch) => [patch.id, patch.delayMs]))
    expect(patches.get('tl')).toBe(933)
    expect(patches.get('tr')).toBe(1000)
    expect(patches.get('br')).toBe(1067)
    expect(patches.get('bl')).toBe(1200)
    expect(STACKPANELS_FRAME.labelDelayMs).toBe(933)
    expect(STACKPANELS_FRAME.captionDelayMs).toBe(1400)
  })

  it('squares the patches at the panel outer corners with the shared chamfer leg', () => {
    const l = panelsLayout(STACKPANELS_SEED)
    const cut = STACKPANELS_FRAME.cutFrac * 1080
    expect(cut).toBeCloseTo(17, 6)

    const patchByCorner = new Map(STACKPANELS_FRAME.patches.map((patch) => [patch.id, patch]))
    for (const [i, panel] of l.panels.entries()) {
      const patch = patchByCorner.get(panel.cutCorner!)!
      const px = patch.xFrac * 1920
      const py = patch.yFrac * 1080
      // The patch sits exactly at the panel's outer corner (cut-sized square).
      const cornerX = panel.cutCorner === 'tl' || panel.cutCorner === 'bl' ? panel.x : panel.x + panel.w - cut
      const cornerY = panel.cutCorner === 'tl' || panel.cutCorner === 'tr' ? panel.y : panel.y + panel.h - cut
      expect(px).toBeCloseTo(cornerX, 6)
      expect(py).toBeCloseTo(cornerY, 6)
      expect(patch.id).toBe(STACKPANELS_SEED[i].cutCorner)
    }
  })
})

describe('panelsLayout — absolute rects (pure math)', () => {
  it('scales every rect with a custom viewBox (off-nominal stage)', () => {
    const l = panelsLayout(STACKPANELS_SEED, { width: 960, height: 540 })
    const [blue] = l.panels

    expect(l.viewBox).toEqual({ width: 960, height: 540 })
    // Halving the stage halves every coordinate.
    expect(blue.x).toBeCloseTo(201, 6)
    expect(blue.y).toBeCloseTo(177, 6)
    expect(blue.w).toBeCloseTo(305.25, 6)
    expect(blue.h).toBeCloseTo(123.75, 6)
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
  it('paces the legacy variant to five clicks: four fades + the closing beat', () => {
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

  it('exposes the late-annotation click as the final panel click (annotate mode)', () => {
    // The seg08 annotate mode binds frame/labels/caption to this click — the
    // recording draws them ~0.93–1.4s after the last panel onset.
    const plan = revealPlan(STACKPANELS_SEED, true)
    expect(plan.panelClicks[plan.panelClicks.length - 1]).toBe(4)
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
