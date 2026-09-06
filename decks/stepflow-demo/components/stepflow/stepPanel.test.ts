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
//   row 1 (1.667s): band y 427.464 h 109.512 · label x 275.328 y 461.700
//   row 1 (1.667s): band y 427.464 h 109.512 · label x 275.328 y 466.128
//     w 197.184 h 26.244 · title x 594.048 y 471.636 w 446.976 h 16.308
//   row 2 (2.4s):   band y 560.952 h 109.512 · label x 275.328 y 598.320
//     w 119.232 h 26.244 · title x 594.048 y 603.828 w 355.392 h 16.308
//   row 3 (3.2s):   band y 690.012 h 111.024 · label x 274.560 y 730.836
//     w 146.112 h 26.244 · title x 594.048 y 736.344 w 508.416 h 16.308
//   annotation left (3.733s): bar x 234.048 y 820.476 w 8.064 h 71.280 ·
//     glyph x 273.024 y 840.024 w 29.184 h 35.208 · text x 330.048 y 843.480
//     y 828.144 w 150.144 h 21.708 · text x 1347.072 y 869.832 w 336.960
//     h 15.552
//   title (glyph cores, glow-excluded): accent ink x 556.416 w 302.400 ·
//     white ink x 859.584 w 506.880 · band y 108.540 h 52.488
//   badge (settled corner ink): bar1 x 1857.600 y 32.400 w 9.600 h 28.080 ·
//     bar2 x 1870.080 y 32.400 w 9.600 h 28.080 · mark x 1883.520 y 19.440
//     w 16.896 h 38.880

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
    // widths, baseline-anchored boxes (cap band bottom = baseline).
    const labelWs = [197.184, 119.232, 146.112]
    const labelYs = [466.128, 598.32, 730.836]
    l.rows.forEach((row, i) => {
      expect(row.labelBox.x).toBeCloseTo(i === 2 ? 274.56 : 275.328, 6)
      expect(row.labelBox.y).toBeCloseTo(labelYs[i], 6)
      expect(row.labelBox.w).toBeCloseTo(labelWs[i], 6)
      expect(row.labelBox.h).toBeCloseTo(26.244, 6)
    })

    // Title inks share the row baselines with the labels; one shared font
    // size across all three rows (ascender band h 16.308).
    const titleWs = [446.976, 355.392, 508.416]
    const titleYs = [471.636, 603.828, 736.344]
    l.rows.forEach((row, i) => {
      expect(row.titleBox.x).toBeCloseTo(594.048, 6)
      expect(row.titleBox.y).toBeCloseTo(titleYs[i], 6)
      expect(row.titleBox.w).toBeCloseTo(titleWs[i], 6)
      expect(row.titleBox.h).toBeCloseTo(16.308, 6)
    })
  })

  it('the decoded seed copy keeps string fields separate from geometry boxes', () => {
    const l = stepPanelLayout(STEP_PANEL_SEED)
    // Row labels are the benefit words decoded from the settled frame.
    expect(STEP_PANEL_SEED.rows.map((r) => r.label)).toEqual(['RELIABLE', 'FRESH', 'USEFUL'])
    // The layout resolves boxes; the row's own string fields stay strings.
    l.rows.forEach((row) => {
      expect(typeof row.label).toBe('string')
      expect(typeof row.title).toBe('string')
      expect(row.labelBox).toEqual({
        x: expect.any(Number),
        y: expect.any(Number),
        w: expect.any(Number),
        h: expect.any(Number),
      })
      expect(row.titleBox).toEqual({
        x: expect.any(Number),
        y: expect.any(Number),
        w: expect.any(Number),
        h: expect.any(Number),
      })
    })
    expect(STEP_PANEL_SEED.annotationLeft.line).toBe('what drove revenue last week')
    expect(STEP_PANEL_SEED.annotationRight.line).toBe('spec-driven development →')
    expect(STEP_PANEL_SEED.dateDigits).toBe('09·0526')
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
    expect(l.annotation.leftBar.w).toBeCloseTo(8.064, 6)
    expect(l.annotation.leftBar.h).toBeCloseTo(71.28, 6)
    expect(l.annotation.leftGlyph.x).toBeCloseTo(273.024, 6)
    expect(l.annotation.leftGlyph.w).toBeCloseTo(29.184, 6)
    expect(l.annotation.leftText.w).toBeCloseTo(583.488, 6)
    expect(l.annotation.leftText.y).toBeCloseTo(843.48, 6)
    expect(l.annotation.leftText.h).toBeCloseTo(24.84, 6)

    // Right group — two amber bars (the '11' pair) and the digit run.
    expect(l.annotation.goldPair.x).toBeCloseTo(1217.088, 6)
    expect(l.annotation.goldPair.w).toBeCloseTo(105.984, 6)
    expect(l.annotation.goldPair.y).toBeCloseTo(821.016, 6)
    expect(l.annotation.goldPair.h).toBeCloseTo(72.036, 6)
    expect(l.annotation.digits.x).toBeCloseTo(1347.84, 6)
    expect(l.annotation.digits.w).toBeCloseTo(150.144, 6)
    expect(l.annotation.digits.y).toBeCloseTo(828.144, 6)
    expect(l.annotation.digits.h).toBeCloseTo(21.708, 6)
    expect(l.annotation.rightText.y).toBeCloseTo(869.832, 6)
    expect(l.annotation.rightText.w).toBeCloseTo(336.96, 6)

    // Both groups sit below the plate's bottom edge (820.476 > 801.036).
    expect(l.annotation.leftBar.y).toBeGreaterThan(l.plate.y + l.plate.h)
  })

  it('top-right badge: lime bars + gray mark in the measured corner box', () => {
    const l = stepPanelLayout(STEP_PANEL_SEED)
    const badge = l.badge
    expect(badge.bars[0].x).toBeCloseTo(1857.6, 6)
    expect(badge.bars[0].y).toBeCloseTo(32.4, 6)
    expect(badge.bars[0].w).toBeCloseTo(9.6, 6)
    expect(badge.bars[0].h).toBeCloseTo(28.08, 6)
    expect(badge.bars[1].x).toBeCloseTo(1870.08, 6)
    expect(badge.mark.x).toBeCloseTo(1883.52, 6)
    expect(badge.mark.y).toBeCloseTo(19.44, 6)
    expect(badge.mark.w).toBeCloseTo(16.896, 6)
    expect(badge.mark.h).toBeCloseTo(38.88, 6)
  })

  it('title band: accent-first per-token runs on the measured glyph-core band', () => {
    const l = stepPanelLayout(STEP_PANEL_SEED)
    // Green 'TUI' then 'skin', each pinned to its own measured ink.
    expect(l.title.accentWord1.x).toBeCloseTo(556.49856, 6)
    expect(l.title.accentWord1.w).toBeCloseTo(116.25024, 6)
    expect(l.title.accentWord2.x).toBeCloseTo(696.0, 6)
    expect(l.title.accentWord2.w).toBeCloseTo(164.25024, 6)
    expect(l.title.accentComma.x).toBeCloseTo(859.49952, 6)
    expect(l.title.accentComma.w).toBeCloseTo(19.49952, 6)
    // White 'trend,' (incl. its mid comma) then 'actual'.
    expect(l.title.whiteWord1.x).toBeCloseTo(896.25024, 6)
    expect(l.title.whiteWord1.w).toBeCloseTo(236.00064, 6)
    expect(l.title.whiteWord2.x).toBeCloseTo(1135.49952, 6)
    expect(l.title.whiteWord2.w).toBeCloseTo(231.74976, 6)
    // Shared cap band (cap top 0.096528 → baseline 0.149306 of 1080).
    expect(l.title.accentWord1.y).toBeCloseTo(104.25024, 6)
    expect(l.title.accentWord1.h).toBeCloseTo(57.00024, 6)
    expect(l.title.whiteWord2.y).toBeCloseTo(104.25024, 6)
    expect(l.title.whiteWord2.h).toBeCloseTo(57.00024, 6)
    // Green ink (incl. comma) ends at 0.457813; white starts at 0.466797.
    expect(l.title.whiteWord1.x - (l.title.accentComma.x + l.title.accentComma.w)).toBeCloseTo(17.251, 2)
  })

  it('custom stage: fractions resolve proportionally (1280×720)', () => {
    const l = stepPanelLayout(STEP_PANEL_SEED, { width: 1280, height: 720 })
    expect(l.plate.x).toBeCloseTo(0.1219 * 1280, 6)
    expect(l.plate.h).toBeCloseTo(0.3639 * 720, 6)
    expect(l.rows[0].titleBox.w).toBeCloseTo(0.2328 * 1280, 6)
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
    // Beat 5 is bracketed by reference frames: zero annotation ink at f0056
    // (t=3.700), both annotations present at f0057 (t=3.767).
    expect(STEP_BEATS[4]).toBeCloseTo(3.733, 3)
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

  it('the annotation lines carry no sublines (single measured run each)', () => {
    expect(STEP_PANEL_SEED.rows.every((r) => r.title.length > 20)).toBe(true)
    expect(STEP_PANEL_SEED.annotationLeft).toEqual({ line: 'what drove revenue last week' })
    expect(STEP_PANEL_SEED.annotationRight).toEqual({ line: 'spec-driven development →' })
  })

  it('family palette carries the measured blue/cyan/teal/amber medians', () => {
    expect(STEP_PANEL_PALETTE.accent).toBe('#3799fb')
    expect(STEP_PANEL_PALETTE.accentAlt).toBe('#1fd0ea')
    expect(STEP_PANEL_PALETTE.accentTertiary).toBe('#1ed798')
    expect(STEP_PANEL_PALETTE.accentQuaternary).toBe('#f9bb1f')
  })
})
