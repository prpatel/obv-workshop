import { describe, expect, it } from 'vitest'
import {
  BAR_ORANGE,
  CONVERGE_BEAT_SCHEDULE,
  CONVERGE_SEED,
  FOOTER_GRAY,
  FUNNEL_ORANGE,
  LABEL_GRAY,
  convergeDrawPaths,
  convergeLayout,
  convergePalette,
} from './converge'

// Hand-computed constants for the default 1920×1080 canvas, from the seg11
// settled-frame traces (fractions of 2560×1440 × 1920 / × 1080):
//   funnel ring  center (0.5000, 0.33685)  r 0.0109375
//   cone lines   (0.4906/0.5094, 0.3569) → (0.4813/0.5188, 0.3875)
//   DATA ENGINEERS row  x0.4273–0.5711, cap band y0.4229–0.4410
//   stem         x0.4998, y0.4833 → bar line (report red[0] top)
//   bar bracket  x0.3102–0.6895, line centered y549 (4.5px), feet to y0.5382
//   left table   outline centerline [547, 628, w98, h79] (stroke 6 → ink
//                x544–648, y625–710); dividers y≈653/680 (h6, outer x544 w104);
//                cell bars x≈578.75/611.75 (w5.5), cells y≈658.75/685.75
//   right column rounded plate (centerline x1271, y648, w103, h39, stroke 6 →
//                ink x1268–1377, y645–690, rx6.5) + through-pins x≈1288/1357
//                (w6.5, y636→699.5) + two plate-height inner bars x≈1300.5/1339.5
//   text runs    SQL x553, cap 30.5, w88.5 · PIPELINES x1207, cap 31, w234
//                (both baseline y791.5)
//   labels       left [0.2145, w0.1921]  right [0.58, w0.2157], cap 17.1, baseline 840.5
//   footer       [0.1934, 0.8410, w0.6129, h0.0041], ticks to y0.8035
const RING = { cx: 960, cy: 363.798, r: 21 }

describe('convergeLayout — measured funnel (initial state, clip opens mid-state)', () => {
  it('ring center/radius and diverging cone lines, hand-computed to 1e-6', () => {
    const l = convergeLayout()
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
    expect(l.funnel.ring.cx).toBeCloseTo(RING.cx, 6)
    expect(l.funnel.ring.cy).toBeCloseTo(RING.cy, 6)
    expect(l.funnel.ring.r).toBeCloseTo(RING.r, 6)
    // Left cone: 0.4906·1920=941.952 → 0.4813·1920=924.096; 0.3569·1080=385.452 → 0.3875·1080=418.5.
    expect(l.funnel.cone.left.x1).toBeCloseTo(941.952, 6)
    expect(l.funnel.cone.left.y1).toBeCloseTo(385.452, 6)
    expect(l.funnel.cone.left.x2).toBeCloseTo(924.096, 6)
    expect(l.funnel.cone.left.y2).toBeCloseTo(418.5, 6)
    // Right cone mirrors: 0.5094·1920=978.048 → 0.5188·1920=996.096.
    expect(l.funnel.cone.right.x1).toBeCloseTo(978.048, 6)
    expect(l.funnel.cone.right.y1).toBeCloseTo(385.452, 6)
    expect(l.funnel.cone.right.x2).toBeCloseTo(996.096, 6)
    expect(l.funnel.cone.right.y2).toBeCloseTo(418.5, 6)
  })

  it('DATA ENGINEERS row spans x0.4273–0.5711 in the y0.4229–0.4410 cap band', () => {
    const l = convergeLayout()
    expect(l.funnel.label.x).toBeCloseTo(820.416, 6)
    expect(l.funnel.label.width).toBeCloseTo(276.096, 6)
    expect(l.funnel.label.capHeight).toBeCloseTo(19.548, 6)
    expect(l.funnel.label.baseline).toBeCloseTo(476.28, 6)
  })

  it('stem drops from y0.4833 (report red[0] top) to the bar line at x0.4998', () => {
    const l = convergeLayout()
    expect(l.funnel.stem.x).toBeCloseTo(959.616, 6)
    expect(l.funnel.stem.y1).toBeCloseTo(521.964, 6)
    // Meets the bar line's bottom edge: (0.50625+0.004166666666666667)·1080.
    expect(l.funnel.stem.y2).toBeCloseTo(551.25, 6)
  })
})

describe('convergeLayout — measured bar bracket', () => {
  it('line x0.3102–0.6895 centered y549 (4.5px) with 5px feet hanging to y0.5382', () => {
    const l = convergeLayout()
    expect(l.bar.x).toBeCloseTo(595.584, 6)
    expect(l.bar.y).toBeCloseTo(546.75, 6)
    expect(l.bar.w).toBeCloseTo(728.256, 6)
    expect(l.bar.h).toBeCloseTo(4.5, 6)
    expect(l.bar.footW).toBeCloseTo(5, 6)
    expect(l.bar.footBottom).toBeCloseTo(581.256, 6)
  })

  it('draws as two dashoffset paths in f15 order: stem drops, then the bracket sweeps', () => {
    const l = convergeLayout()
    const { stem, bracket } = convergeDrawPaths(l)
    // Stem: straight drop at the funnel's center x, meeting the line center y549.
    expect(stem.d).toBe('M 959.616 521.964 L 959.616 549')
    expect(stem.len).toBeCloseTo(27.036, 6) // 549 − 521.964
    // Bracket: left foot rises, line sweeps left→right, right foot drops —
    // one path, drawn bottom-left → up → across → down.
    expect(bracket.d).toBe('M 595.584 581.256 L 595.584 549 L 1323.84 549 L 1323.84 581.256')
    // footLen 32.256 × 2 + line 728.256.
    expect(bracket.len).toBeCloseTo(792.768, 6)
  })
})

describe('convergeLayout — measured left cyan table', () => {
  it('outline centerline box: stroke 6 renders ink x544–648, y625–710', () => {
    const l = convergeLayout()
    expect(l.columns.left.x).toBeCloseTo(547, 6)
    expect(l.columns.left.y).toBeCloseTo(628, 6)
    expect(l.columns.left.w).toBeCloseTo(98, 6)
    expect(l.columns.left.h).toBeCloseTo(79, 6)
  })

  it('two full-width dividers split three cells at y≈653 and y≈680', () => {
    const l = convergeLayout()
    expect(l.columns.leftTable.dividers).toHaveLength(2)
    const [d1, d2] = l.columns.leftTable.dividers
    expect(d1!.y).toBeCloseTo(653, 6)
    expect(d2!.y).toBeCloseTo(680, 6)
    for (const divider of l.columns.leftTable.dividers) {
      expect(divider.x).toBeCloseTo(544, 6)
      expect(divider.w).toBeCloseTo(104, 6)
      expect(divider.h).toBeCloseTo(6, 6)
    }
  })

  it('two vertical-bar glyph pairs in cells 2 and 3 at x≈578.75/611.75', () => {
    const l = convergeLayout()
    expect(l.columns.leftTable.bars).toHaveLength(4)
    const [b1, b2, b3, b4] = l.columns.leftTable.bars
    // Cell 2 pair (y≈658.75, 20.5 tall) and cell 3 pair (y≈685.75, 17.25 tall).
    expect(b1!.x).toBeCloseTo(578.75, 6)
    expect(b2!.x).toBeCloseTo(611.75, 6)
    expect(b3!.x).toBeCloseTo(578.75, 6)
    expect(b4!.x).toBeCloseTo(611.75, 6)
    for (const bar of [b1, b2]) {
      expect(bar!.y).toBeCloseTo(658.75, 6)
      expect(bar!.h).toBeCloseTo(20.5, 6)
    }
    for (const bar of [b3, b4]) {
      expect(bar!.y).toBeCloseTo(685.75, 6)
      expect(bar!.h).toBeCloseTo(17.25, 6)
    }
    for (const bar of l.columns.leftTable.bars) expect(bar!.w).toBeCloseTo(5.5, 6)
  })
})

describe('convergeLayout — measured right blue column', () => {
  it('rounded plate centerline x1271 y648 w103 h39 rx6.5 (stroke 6)', () => {
    const l = convergeLayout()
    expect(l.columns.right.plate.x).toBeCloseTo(1271, 6)
    expect(l.columns.right.plate.y).toBeCloseTo(648, 6)
    expect(l.columns.right.plate.w).toBeCloseTo(103, 6)
    expect(l.columns.right.plate.h).toBeCloseTo(39, 6)
    expect(l.columns.right.plate.rx).toBe(6.5)
  })

  it('two plate-height inner bars sit inside the plate at x≈1300.5/1339.5', () => {
    const l = convergeLayout()
    const { slots } = l.columns.right
    expect(slots.x1).toBeCloseTo(1300.5, 6)
    expect(slots.x2).toBeCloseTo(1339.5, 6)
    expect(slots.width).toBeCloseTo(6, 6)
    for (const slotX of [slots.x1, slots.x2]) {
      expect(slotX).toBeGreaterThan(l.columns.right.pins.x1)
      expect(slotX).toBeLessThan(l.columns.right.pins.x2)
    }
    expect(slots.top).toBeCloseTo(645, 6)
    expect(slots.bottom).toBeCloseTo(690, 6)
  })

  it('two through-pins at x≈1288/1357 (6.5px) crossing y636→699.5', () => {
    const l = convergeLayout()
    expect(l.columns.right.pins.x1).toBeCloseTo(1288, 6)
    expect(l.columns.right.pins.x2).toBeCloseTo(1357, 6)
    expect(l.columns.right.pins.top).toBeCloseTo(636, 6)
    expect(l.columns.right.pins.bottom).toBeCloseTo(699.5, 6)
    expect(l.columns.right.pins.width).toBeCloseTo(6.5, 6)
  })
})

describe('convergeLayout — measured text runs, labels and footer', () => {
  it('SQL run x553 and PIPELINES run x1207 share the y791.5 baseline', () => {
    const l = convergeLayout()
    expect(l.textRuns.leftLower.x).toBeCloseTo(553, 6)
    expect(l.textRuns.leftLower.capHeight).toBeCloseTo(30.5, 6)
    expect(l.textRuns.leftLower.width).toBeCloseTo(88.5, 6)
    expect(l.textRuns.slab.x).toBeCloseTo(1207, 6)
    expect(l.textRuns.slab.capHeight).toBeCloseTo(31, 6)
    expect(l.textRuns.slab.width).toBeCloseTo(234, 6)
    expect(l.textRuns.leftLower.baseline).toBeCloseTo(791.5, 6)
    expect(l.textRuns.slab.baseline).toBeCloseTo(791.5, 6)
  })

  it('gray base labels sit in the y823–840 cap band over each column', () => {
    const l = convergeLayout()
    expect(l.labels.left.x).toBeCloseTo(411.84, 6)
    expect(l.labels.left.width).toBeCloseTo(368.832, 6)
    expect(l.labels.right.x).toBeCloseTo(1113.6, 6)
    expect(l.labels.right.width).toBeCloseTo(414.144, 6)
    for (const label of [l.labels.left, l.labels.right]) {
      expect(label.capHeight).toBeCloseTo(17.1, 6)
      expect(label.baseline).toBeCloseTo(840.5, 6)
    }
  })

  it('footer band x0.1934–0.8063 y0.8410–0.8451 with end ticks rising to y0.8035', () => {
    const l = convergeLayout()
    expect(l.footer.x).toBeCloseTo(371.328, 6)
    expect(l.footer.y).toBeCloseTo(908.28, 6)
    expect(l.footer.w).toBeCloseTo(1176.768, 6)
    expect(l.footer.h).toBeCloseTo(4.428, 6)
    expect(l.footer.tickTop).toBeCloseTo(867.78, 6)
    expect(l.footer.tickW).toBeCloseTo(4.416, 6)
  })
})

describe('convergeLayout — proportional-face per-glyph boxes', () => {
  it('carries the 9 measured PIPELINES glyph boxes', () => {
    const l = convergeLayout()
    expect(l.charRuns.pipelines.map((c) => c.char)).toEqual([...'PIPELINES'])
    expect(l.charRuns.pipelines[0]).toEqual({ char: 'P', x: 1207, width: 29 })
    expect(l.charRuns.pipelines[1]!.x).toBeCloseTo(1238, 6)
    expect(l.charRuns.pipelines[5]).toEqual({ char: 'I', x: 1338, width: 11 })
    expect(l.charRuns.pipelines[8]).toEqual({ char: 'S', x: 1414, width: 27 })
  })

  it('carries the 23 measured title-tail glyph boxes (spaces unboxed)', () => {
    const l = convergeLayout()
    expect(l.charRuns.titleTail.map((c) => c.char)).toEqual([...'andpipelinesstillmatter'])
    expect(l.charRuns.titleTail[0]).toEqual({ char: 'a', x: 573, width: 45 })
    expect(l.charRuns.titleTail[22]).toEqual({ char: 'r', x: 1491, width: 31 })
  })

  it('scales per-glyph boxes on a custom canvas', () => {
    const l = convergeLayout({ width: 1280, height: 720 })
    expect(l.charRuns.pipelines[0]!.x).toBeCloseTo((1207 * 2) / 3, 6)
    expect(l.charRuns.pipelines[0]!.width).toBeCloseTo((29 * 2) / 3, 6)
    expect(l.charRuns.titleTail[22]!.x).toBeCloseTo((1491 * 2) / 3, 6)
  })
})

describe('convergeLayout — options and validation', () => {
  it('honors a custom canvas: 1280×720 rescales every derived length', () => {
    const l = convergeLayout({ width: 1280, height: 720 })
    expect(l.viewBox).toEqual({ width: 1280, height: 720 })
    // x·(1280/1920) = x·(2/3), y·(720/1080) = y·(2/3).
    expect(l.funnel.ring.r).toBeCloseTo(14, 6)
    expect(l.bar.x).toBeCloseTo(397.056, 6)
    expect(l.bar.footBottom).toBeCloseTo(387.504, 6)
    expect(l.columns.left.x).toBeCloseTo(364.6666666666667, 6)
    expect(l.columns.leftTable.dividers[0]!.y).toBeCloseTo(435.3333333333333, 6)
    expect(l.columns.right.plate.x).toBeCloseTo(847.3333333333334, 6)
    expect(l.textRuns.slab.width).toBeCloseTo(156, 6)
  })

  it('rejects non-positive canvas dimensions with RangeError', () => {
    expect(() => convergeLayout({ width: 0 })).toThrow(RangeError)
    expect(() => convergeLayout({ height: -1 })).toThrow(RangeError)
  })

  it('is byte-identical across runs for the same inputs', () => {
    const a = JSON.stringify(convergeLayout())
    const b = JSON.stringify(convergeLayout())
    expect(a).toBe(b)
  })

  it('default layout snapshot is stable across runs', () => {
    expect(convergeLayout()).toMatchSnapshot()
  })
})

describe('measured tones — locked decisions', () => {
  it('the bar bracket re-measures dim: rgb(191,82,28), NOT the #f85721 token', () => {
    expect(BAR_ORANGE).toBe('#bf521c')
    expect(BAR_ORANGE).not.toBe('#f85721')
  })

  it('the funnel keeps its bright re-measured tone rgb(242,87,38)', () => {
    expect(FUNNEL_ORANGE).toBe('#f25726')
  })

  it('footer gray matches the settled-frame median; labels re-measure dim gray', () => {
    expect(FOOTER_GRAY).toBe('#403f42')
    expect(LABEL_GRAY).toBe('#a7a6ab')
  })

  it('family palette: right column blue accent, left column cyan tertiary', () => {
    expect(convergePalette.accent).toBe('#3799fb')
    expect(convergePalette.accentTertiary).toBe('#22cee5')
  })
})

describe('CONVERGE_BEAT_SCHEDULE — five clicks re-pinned from onsets.json', () => {
  it('is the measured [0.933, 1.533, 2.2, 2.533, 3.067] onset sequence', () => {
    expect([...CONVERGE_BEAT_SCHEDULE]).toEqual([0.933, 1.533, 2.2, 2.533, 3.067])
  })

  it('is strictly ascending — one beat per reveal click, 1:1 with v-click indexes', () => {
    const beats = [...CONVERGE_BEAT_SCHEDULE]
    for (let i = 1; i < beats.length; i++) expect(beats[i]!).toBeGreaterThan(beats[i - 1]!)
  })

  it('pins the bar beat at 2.533: the right label onset leads the line sweep 2.667', () => {
    // The draft's 2.6 moved earlier: onsets.json puts the right label at
    // 2.533 and the stem is present by f0039 (≈t2.57); the red line sweep
    // starts 2.667 — exactly the stem's 140ms draw delay after the click.
    expect(CONVERGE_BEAT_SCHEDULE[3]).toBe(2.533)
  })
})

describe('CONVERGE_SEED — OCR-confirmed settled-frame copy', () => {
  it('carries the two-tone title (green SQL lead, lowercase white tail) and labels', () => {
    expect(CONVERGE_SEED.titleAccent).toBe('SQL')
    expect(CONVERGE_SEED.title).toBe('and pipelines still matter')
    expect(CONVERGE_SEED.labels).toEqual({
      left: 'QUERIES DRAFTED IN SECONDS',
      right: 'WHAT MOVES THE DATA EVERY DAY',
    })
  })

  it('carries the funnel row and the two colored text runs', () => {
    expect(CONVERGE_SEED.funnelLabel).toBe('DATA ENGINEERS')
    expect(CONVERGE_SEED.leftLowerText).toBe('SQL')
    expect(CONVERGE_SEED.slabText).toBe('PIPELINES')
  })
})
