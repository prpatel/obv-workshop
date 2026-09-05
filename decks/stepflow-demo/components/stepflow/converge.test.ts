import { describe, expect, it } from 'vitest'
import {
  BAR_ORANGE,
  CONVERGE_BEAT_SCHEDULE,
  CONVERGE_SEED,
  FOOTER_GRAY,
  FUNNEL_ORANGE,
  LABEL_WHITE,
  convergeDrawPaths,
  convergeLayout,
  convergePalette,
} from './converge'

// Hand-computed constants for the default 1920×1080 canvas, from the seg11
// settled-frame traces (fractions of 2560×1440 × 1920 / × 1080):
//   funnel ring  center (0.5000, 0.33685)  r 0.0109375
//   cone lines   (0.4906/0.5094, 0.3569) → (0.4813/0.5188, 0.3875)
//   tick row     x0.4273–0.5711, cap band y0.4229–0.4410
//   stem         x0.4998, y0.4833 → bar line (report red[0] top)
//   bar bracket  x0.3102–0.6895, line y0.508–0.511, feet to y0.5382
//   left column  main [0.2836, 0.5799, w0.0543, h0.0770]  lower [0.2883, 0.7049, w0.0457, h0.0347]
//   right column main [0.6605, 0.5889, w0.0567, h0.0590]  row [0.6289, 0.7049, w0.1211, h0.0277]
//   labels       left [0.2145, w0.1921]  right [0.58, w0.2157], cap 0.0174, baseline 0.777
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

  it('tick row spans x0.4273–0.5711 in the y0.4229–0.4410 cap band', () => {
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
    // Meets the bar line's bottom edge: (0.508+0.003)·1080.
    expect(l.funnel.stem.y2).toBeCloseTo(551.88, 6)
  })
})

describe('convergeLayout — measured bar bracket', () => {
  it('line x0.3102–0.6895 at y0.508–0.511 with feet hanging to y0.5382', () => {
    const l = convergeLayout()
    expect(l.bar.x).toBeCloseTo(595.584, 6)
    expect(l.bar.y).toBeCloseTo(548.64, 6)
    expect(l.bar.w).toBeCloseTo(728.256, 6)
    expect(l.bar.h).toBeCloseTo(3.24, 6)
    expect(l.bar.footW).toBeCloseTo(3.072, 6)
    expect(l.bar.footBottom).toBeCloseTo(581.256, 6)
  })

  it('draws as two dashoffset paths in f15 order: stem drops, then the bracket sweeps', () => {
    const l = convergeLayout()
    const { stem, bracket } = convergeDrawPaths(l)
    // Stem: straight drop at the funnel's center x.
    expect(stem.d).toBe('M 959.616 521.964 L 959.616 550.26')
    expect(stem.len).toBeCloseTo(28.296, 6) // 550.26 − 521.964
    // Bracket: left foot rises, line sweeps left→right, right foot drops —
    // one path, drawn bottom-left → up → across → down.
    expect(bracket.d).toBe('M 595.584 581.256 L 595.584 550.26 L 1323.84 550.26 L 1323.84 581.256')
    // footLen 30.996 × 2 + line 728.256.
    expect(bracket.len).toBeCloseTo(790.248, 6)
  })
})

describe('convergeLayout — measured columns', () => {
  it('cyan left column: main box + lower box at the measured bboxes', () => {
    const l = convergeLayout()
    expect(l.columns.left.x).toBeCloseTo(544.512, 6)
    expect(l.columns.left.y).toBeCloseTo(626.292, 6)
    expect(l.columns.left.w).toBeCloseTo(104.256, 6)
    expect(l.columns.left.h).toBeCloseTo(83.16, 6)
    expect(l.columns.leftLower.x).toBeCloseTo(553.536, 6)
    expect(l.columns.leftLower.y).toBeCloseTo(761.292, 6)
    expect(l.columns.leftLower.w).toBeCloseTo(87.744, 6)
    expect(l.columns.leftLower.h).toBeCloseTo(37.476, 6)
  })

  it('blue right column: main box + a row of six small boxes across x0.6289–0.7500', () => {
    const l = convergeLayout()
    expect(l.columns.right.x).toBeCloseTo(1268.16, 6)
    expect(l.columns.right.y).toBeCloseTo(636.012, 6)
    expect(l.columns.right.w).toBeCloseTo(108.864, 6)
    expect(l.columns.right.h).toBeCloseTo(63.72, 6)
    // The brief's "double height" wording is artifact shorthand; the measured
    // boxes win: main 63.72px tall, row 29.916px tall, sharing the y0.7049 base.
    expect(l.columns.rightRow).toHaveLength(6)
    l.columns.rightRow.forEach((box, i) => {
      expect(box.w).toBeCloseTo(27.84, 6)
      expect(box.h).toBeCloseTo(29.916, 6)
      expect(box.y).toBeCloseTo(761.292, 6)
      // Even pitch across the measured span: box 27.84 + gap 13.0944 = 40.9344.
      expect(box.x).toBeCloseTo(1207.488 + i * 40.9344, 6)
    })
    // The row ends exactly at x0.75·1920.
    expect(l.columns.rightRow[5]!.x + l.columns.rightRow[5]!.w).toBeCloseTo(1440, 6)
  })
})

describe('convergeLayout — labels and footer', () => {
  it('white base labels sit in the y0.7625–0.7799 cap band over each column', () => {
    const l = convergeLayout()
    expect(l.labels.left.x).toBeCloseTo(411.84, 6)
    expect(l.labels.left.width).toBeCloseTo(368.832, 6)
    expect(l.labels.right.x).toBeCloseTo(1113.6, 6)
    expect(l.labels.right.width).toBeCloseTo(414.144, 6)
    for (const label of [l.labels.left, l.labels.right]) {
      expect(label.capHeight).toBeCloseTo(18.792, 6)
      expect(label.baseline).toBeCloseTo(839.16, 6)
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

describe('convergeLayout — options and validation', () => {
  it('honors a custom canvas: 1280×720 rescales every derived length', () => {
    const l = convergeLayout({ width: 1280, height: 720 })
    expect(l.viewBox).toEqual({ width: 1280, height: 720 })
    // x·(1280/1920) = x·(2/3), y·(720/1080) = y·(2/3).
    expect(l.funnel.ring.r).toBeCloseTo(14, 6)
    expect(l.bar.x).toBeCloseTo(397.056, 6)
    expect(l.bar.footBottom).toBeCloseTo(387.504, 6)
    expect(l.columns.left.x).toBeCloseTo(363.008, 6)
  })

  it('rightRowCount=3 (off-nominal): three boxes spanning the same measured band', () => {
    const l = convergeLayout({ rightRowCount: 3 })
    expect(l.columns.rightRow).toHaveLength(3)
    // gap = (232.512 − 3·27.84)/2 = 74.496; pitch = 27.84 + 74.496 = 102.336.
    l.columns.rightRow.forEach((box, i) => {
      expect(box.x).toBeCloseTo(1207.488 + i * 102.336, 6)
    })
    expect(l.columns.rightRow[2]!.x + l.columns.rightRow[2]!.w).toBeCloseTo(1440, 6)
  })

  it('rejects non-positive canvas dimensions with RangeError', () => {
    expect(() => convergeLayout({ width: 0 })).toThrow(RangeError)
    expect(() => convergeLayout({ height: -1 })).toThrow(RangeError)
  })

  it('rejects rightRowCount below 1 or non-integer with RangeError', () => {
    expect(() => convergeLayout({ rightRowCount: 0 })).toThrow(RangeError)
    expect(() => convergeLayout({ rightRowCount: -1 })).toThrow(RangeError)
    expect(() => convergeLayout({ rightRowCount: 2.5 })).toThrow(RangeError)
  })

  it('is byte-identical across runs for the same inputs', () => {
    const a = JSON.stringify(convergeLayout())
    const b = JSON.stringify(convergeLayout())
    expect(a).toBe(b)
  })

  it('n=6 layout snapshot is stable across runs', () => {
    expect(convergeLayout()).toMatchSnapshot()
  })
})

describe('measured tones — V-4 locked decisions', () => {
  it('the bar bracket re-measures dim: rgb(191,82,28), NOT the #f85721 token', () => {
    expect(BAR_ORANGE).toBe('#bf521c')
    expect(BAR_ORANGE).not.toBe('#f85721')
  })

  it('the funnel keeps its bright re-measured tone rgb(242,87,38)', () => {
    expect(FUNNEL_ORANGE).toBe('#f25726')
  })

  it('footer gray and label white match the settled-frame medians', () => {
    expect(FOOTER_GRAY).toBe('#403f42')
    expect(LABEL_WHITE).toBe('#f5f4f7')
  })

  it('family palette: right column blue accent, left column cyan tertiary', () => {
    expect(convergePalette.accent).toBe('#3c96f4')
    expect(convergePalette.accentTertiary).toBe('#22cee5')
  })
})

describe('CONVERGE_BEAT_SCHEDULE — five clicks pinned from the f15 dumps', () => {
  it('is the measured [1.07, 1.53, 2.20, 2.60, 3.07] onset sequence', () => {
    expect([...CONVERGE_BEAT_SCHEDULE]).toEqual([1.07, 1.53, 2.2, 2.6, 3.07])
  })

  it('is strictly ascending — one beat per reveal click, 1:1 with v-click indexes', () => {
    const beats = [...CONVERGE_BEAT_SCHEDULE]
    for (let i = 1; i < beats.length; i++) expect(beats[i]!).toBeGreaterThan(beats[i - 1]!)
  })

  it('pins the bar beat at 2.60: the stem is already present at f0039', () => {
    // The draft's 2.67 moved earlier — the report's 15fps event trace missed
    // the thin stem at that class; the direct frame scan did not.
    expect(CONVERGE_BEAT_SCHEDULE[3]).toBe(2.6)
  })
})

describe('CONVERGE_SEED — settled-frame copy', () => {
  it('carries the two-tone title (green ETL lead, white tail) and base labels', () => {
    expect(CONVERGE_SEED.titleAccent).toBe('ETL')
    expect(CONVERGE_SEED.title).toBe('EVERYTHING CONVERGES')
    expect(CONVERGE_SEED.labels).toEqual({ left: 'CI logs', right: 'PDF export' })
  })
})
