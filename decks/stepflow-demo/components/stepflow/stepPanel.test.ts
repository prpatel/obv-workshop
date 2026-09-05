import { describe, expect, it } from 'vitest'
import {
  revealPlan,
  stepPanelLayout,
  STEP_BEATS,
  STEP_PANEL_CHIP,
  STEP_PANEL_PALETTE,
  STEP_PANEL_SEED,
} from './stepPanel'

// Hand-computed constants for the default 1920×1080 stage, from the measured
// seg15 trace (blueprint art_uJLWLoa8; 2560×1440 report.json bboxes map 1:1
// proportionally — x·1920, y·1080):
//
//   chip mark (blue[0] bbox 0.1234,0.3083 → 0.148,0.3431):
//     x 236.928  y 332.964  w 47.232  h 37.584
//   chip label (white chip-text union 0.1602,0.3188 → 0.2559,0.3382):
//     x 307.584  y 344.304  w 183.744  h 20.952
//   plate (1.2s draw top edge + row-band x extent + row-3 bottom):
//     x 234.048  y 408.024  w 1450.368  h 393.012
//   row 1 (1.667s): band y 427.464 h 109.512 · label x 275.328 y 466.452
//     w 197.184 h 26.244 · title x 594.048 y 474.012 w 446.976 h 18.036
//   row 2 (2.4s):   band y 560.952 h 109.512 · label x 275.328 y 598.536
//     w 119.232 h 26.244 · title x 594.048 y 605.988 w 355.392 h 15.012
//   row 3 (3.2s):   band y 690.012 h 111.024 · label x 274.560 y 730.512
//     w 146.112 h 26.244 · title x 594.048 y 737.964 w 508.416 h 13.500
//   annotation left (3.667s): bar x 234.048 y 820.476 w 5.184 h 71.280 ·
//     glyph x 273.024 y 840.024 w 29.184 h 35.208 · text x 330.048 y 843.048
//     w 583.488 h 23.976
//   annotation right (4.6s): bar1 x 1218.048 y 821.232 w 46.464 h 70.524 ·
//     bar2 x 1275.072 y 820.476 w 47.232 h 72.792 · digits x 1348.416
//     y 829.548 w 144.768 h 18.684 · text x 1347.072 y 870.048 w 334.464
//     h 16.416
//   title (glyph cores, glow-excluded): accent ink x 556.416 w 302.400 ·
//     white ink x 859.584 w 506.880 · band y 108.000 h 52.488

describe('stepPanelLayout — measured geometry', () => {
  it('three seed rows resolve onto the measured band/label/title boxes, hand-computed to 1e-6', () => {
    const l = stepPanelLayout(STEP_PANEL_SEED)
    expect(l.rows).toHaveLength(3)
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })

    // Plate: the 1.2s draw event's top edge plus the row-band x extent.
    expect(l.plate.x).toBeCloseTo(234.048, 6)
    expect(l.plate.y).toBeCloseTo(408.024, 6)
    expect(l.plate.w).toBeCloseTo(1450.368, 6)
    expect(l.plate.h).toBeCloseTo(393.012, 6)

    // Row bands share the plate's x extent; the measured y bands differ.
    const bandYs = [427.464, 560.952, 690.012]
    const bandHs = [109.512, 109.512, 111.024]
    l.rows.forEach((row, i) => {
      expect(row.band.x).toBeCloseTo(234.048, 6)
      expect(row.band.y).toBeCloseTo(bandYs[i], 6)
      expect(row.band.w).toBeCloseTo(1450.368, 6)
      expect(row.band.h).toBeCloseTo(bandHs[i], 6)
    })

    // Label inks (blue / cyan / teal unions): shared left inset, row-specific
    // widths — row 2's label measures 119.232px, half of row 1's 197.184px.
    const labelWs = [197.184, 119.232, 146.112]
    const labelYs = [466.452, 598.536, 730.512]
    l.rows.forEach((row, i) => {
      expect(row.label.x).toBeCloseTo(i === 2 ? 274.56 : 275.328, 6)
      expect(row.label.y).toBeCloseTo(labelYs[i], 6)
      expect(row.label.w).toBeCloseTo(labelWs[i], 6)
      expect(row.label.h).toBeCloseTo(26.244, 6)
    })

    // Title inks (white unions) share the label baseline line of the plate.
    const titleWs = [446.976, 355.392, 508.416]
    const titleYs = [474.012, 605.988, 737.964]
    const titleHs = [18.036, 15.012, 13.5]
    l.rows.forEach((row, i) => {
      expect(row.title.x).toBeCloseTo(594.048, 6)
      expect(row.title.y).toBeCloseTo(titleYs[i], 6)
      expect(row.title.w).toBeCloseTo(titleWs[i], 6)
      expect(row.title.h).toBeCloseTo(titleHs[i], 6)
    })
  })

  it('chip mark and label sit on the measured pre-clip boxes', () => {
    const l = stepPanelLayout(STEP_PANEL_SEED)
    expect(l.chip.mark.x).toBeCloseTo(236.928, 6)
    expect(l.chip.mark.y).toBeCloseTo(332.964, 6)
    expect(l.chip.mark.w).toBeCloseTo(47.232, 6)
    expect(l.chip.mark.h).toBeCloseTo(37.584, 6)
    expect(l.chip.label.x).toBeCloseTo(307.584, 6)
    expect(l.chip.label.y).toBeCloseTo(344.304, 6)
    expect(l.chip.label.w).toBeCloseTo(183.744, 6)
    expect(l.chip.label.h).toBeCloseTo(20.952, 6)
    // The chip is settled pre-clip state: its box sits fully above the plate.
    expect(l.chip.mark.y + l.chip.mark.h).toBeLessThan(l.plate.y)
  })

  it('bottom annotation row: orange bar+glyph+text left, amber bars+digits+text right', () => {
    const l = stepPanelLayout(STEP_PANEL_SEED)
    // Left group — the bar hugs the plate's left edge, below the plate.
    expect(l.annotation.leftBar.x).toBeCloseTo(234.048, 6)
    expect(l.annotation.leftBar.y).toBeCloseTo(820.476, 6)
    expect(l.annotation.leftBar.w).toBeCloseTo(5.184, 6)
    expect(l.annotation.leftBar.h).toBeCloseTo(71.28, 6)
    expect(l.annotation.leftGlyph.x).toBeCloseTo(273.024, 6)
    expect(l.annotation.leftGlyph.w).toBeCloseTo(29.184, 6)
    expect(l.annotation.leftText.w).toBeCloseTo(583.488, 6)
    expect(l.annotation.leftText.y).toBeCloseTo(843.048, 6)

    // Right group — two amber bars (the '11' pair) and the digit run.
    expect(l.annotation.amberBars[0].x).toBeCloseTo(1218.048, 6)
    expect(l.annotation.amberBars[0].w).toBeCloseTo(46.464, 6)
    expect(l.annotation.amberBars[1].x).toBeCloseTo(1275.072, 6)
    expect(l.annotation.amberBars[1].w).toBeCloseTo(47.232, 6)
    expect(l.annotation.digits.x).toBeCloseTo(1348.416, 6)
    expect(l.annotation.digits.w).toBeCloseTo(144.768, 6)
    expect(l.annotation.rightText.y).toBeCloseTo(870.048, 6)

    // Both groups sit below the plate's bottom edge (820.476 > 801.036).
    expect(l.annotation.leftBar.y).toBeGreaterThan(l.plate.y + l.plate.h)
  })

  it('title band: accent-first runs on the measured glyph-core band', () => {
    const l = stepPanelLayout(STEP_PANEL_SEED)
    expect(l.title.accentInk.x).toBeCloseTo(556.416, 6)
    expect(l.title.accentInk.w).toBeCloseTo(302.4, 6)
    expect(l.title.whiteInk.x).toBeCloseTo(859.584, 6)
    expect(l.title.whiteInk.w).toBeCloseTo(506.88, 6)
    // Shared cap band (ascender top 0.1 → baseline 0.1486 of 1080).
    expect(l.title.accentInk.y).toBeCloseTo(108, 6)
    expect(l.title.accentInk.h).toBeCloseTo(52.488, 6)
    expect(l.title.whiteInk.y).toBeCloseTo(108, 6)
    // Measured runs nearly abut: green ends at 0.4473, white starts at
    // 0.4477 — a 0.77px trace gap, not an exact split point.
    expect(l.title.whiteInk.x - (l.title.accentInk.x + l.title.accentInk.w)).toBeLessThan(2)
  })

  it('custom stage: fractions resolve proportionally (1280×720)', () => {
    const l = stepPanelLayout(STEP_PANEL_SEED, { width: 1280, height: 720 })
    expect(l.plate.x).toBeCloseTo(0.1219 * 1280, 6)
    expect(l.plate.h).toBeCloseTo(0.3639 * 720, 6)
    expect(l.rows[0].title.w).toBeCloseTo(0.2328 * 1280, 6)
  })
})

describe('stepPanelLayout — validation', () => {
  it('rejects more rows than the measured plate holds (3)', () => {
    const four = { ...STEP_PANEL_SEED, rows: [...STEP_PANEL_SEED.rows, STEP_PANEL_SEED.rows[0]] }
    expect(() => stepPanelLayout(four)).toThrow(RangeError)
  })

  it('rejects an empty plate', () => {
    expect(() => stepPanelLayout({ ...STEP_PANEL_SEED, rows: [] })).toThrow(RangeError)
  })

  it('rejects non-positive or non-finite stage dimensions', () => {
    expect(() => stepPanelLayout(STEP_PANEL_SEED, { width: 0 })).toThrow(RangeError)
    expect(() => stepPanelLayout(STEP_PANEL_SEED, { height: -720 })).toThrow(RangeError)
    expect(() => stepPanelLayout(STEP_PANEL_SEED, { width: Number.NaN })).toThrow(RangeError)
  })
})

describe('revealPlan — pinned seg15 beat mapping', () => {
  it('maps the 7 pinned onsets: plate, rows, left annotation, amber group, burst', () => {
    const plan = revealPlan(3)
    expect(plan.plateClick).toBe(1)
    expect(plan.rowClicks).toEqual([2, 3, 4])
    expect(plan.annotationClick).toBe(5)
    expect(plan.amberClick).toBe(6)
    expect(plan.burstClick).toBe(7)
    expect(plan.clicksTotal).toBe(7)
  })

  it('off-nominal row counts keep the plan contiguous and compact', () => {
    expect(revealPlan(1)).toEqual({
      plateClick: 1,
      rowClicks: [2],
      annotationClick: 3,
      amberClick: 4,
      burstClick: 5,
      clicksTotal: 5,
    })
    expect(revealPlan(2).burstClick).toBe(6)
  })

  it('the click indexes line up with the pinned STEP_BEATS schedule', () => {
    // STEP_BEATS is the AutoAdvance :step-schedule-sec payload for the slide;
    // its length must equal the 3-row click total.
    expect(STEP_BEATS).toHaveLength(revealPlan(3).clicksTotal)
    expect(STEP_BEATS[0]).toBeCloseTo(1.2, 3)
    expect(STEP_BEATS[6]).toBeCloseTo(5.867, 3)
  })

  it('rejects row counts outside the measured 1..3 plate', () => {
    expect(() => revealPlan(0)).toThrow(RangeError)
    expect(() => revealPlan(4)).toThrow(RangeError)
  })
})

describe('stepPanelLayout — determinism', () => {
  it('is byte-identical across runs for the same inputs', () => {
    const a = JSON.stringify(stepPanelLayout(STEP_PANEL_SEED))
    const b = JSON.stringify(stepPanelLayout(STEP_PANEL_SEED))
    expect(a).toBe(b)
  })

  it('the seed layout snapshot is stable across runs', () => {
    expect(stepPanelLayout(STEP_PANEL_SEED)).toMatchSnapshot()
  })

  it('measured constants are frozen module data (same object every import)', () => {
    expect(STEP_PANEL_CHIP.mark.xFrac).toBe(0.1234)
    expect(STEP_PANEL_CHIP.mark.hFrac).toBe(0.0348)
  })

  it('seed row tones match the measured label hues: blue / cyan / teal', () => {
    expect(STEP_PANEL_SEED.rows.map((r) => r.tone)).toEqual(['accent', 'alt', 'tertiary'])
  })

  it('family palette carries the measured blue/cyan/teal/amber medians', () => {
    expect(STEP_PANEL_PALETTE.accent).toBe('#3799fb')
    expect(STEP_PANEL_PALETTE.accentAlt).toBe('#1fd0ea')
    expect(STEP_PANEL_PALETTE.accentTertiary).toBe('#1ed798')
    expect(STEP_PANEL_PALETTE.accentQuaternary).toBe('#f9bb1f')
  })
})
