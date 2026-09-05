import { describe, expect, it } from 'vitest'
import { pillarRowLayout, REVEAL_BEATS_SEC, type PillarCard } from './pillars'

// Hand-computed constants for the default 1920×1080 canvas, from the settled
// reference frame census (settled_full.png; fractions of 1920/1080):
//   plates       x 0.1445/0.3598/0.6199 · y 0.4576 · w 0.1649/0.1996/0.1996
//                · h 0.2146/0.2139/0.2125
//                → 277.44/690.816/1190.208, 494.208, 316.608/383.232/383.232,
//                231.768/230.988/229.5
//   glyphs       lefts 0.1508/0.4098/0.6715, widths 0.0558/0.055/0.0562
//                → cx 343.104/839.616/1343.232, cy 555.39, size 107.136/105.6/107.904
//   badges       circle outlines centered (0.307292,0.593519)/
//                (0.56875,0.593519)/(0.822917,0.592593), radii
//                0.043983/0.043983/0.043057 of height → cx 590.00064/1092/
//                1580.00064, cy 641.00052/641.00052/640.00044,
//                r 47.50164/47.50164/46.50156 + mini-icon markup per station
//   labels A     x 0.159/0.4059/0.6781, cap band 0.5771–0.591 → baseline
//                638.28, cap 15.012, ink 67.392/122.112/81.024
//   labels B     x 0.1477/0.4086/0.6699, cap band 0.6042–0.6153 → baseline
//                664.524, cap 11.988, ink 110.208 (shared)
//   captions r1  x 0.2789/0.5328/0.7984, cap tops 0.6562/0.6562/0.6542,
//                cap heights 0.0174/0.0139/0.0173, ink 108.672/136.512/93.888
//   captions r2  x 0.2883/0.5398/0.7937, cap tops 0.684/0.684/0.6812,
//                cap heights 0.0139/0.0111/0.0112, ink 72/109.632/110.4
const SEED: PillarCard[] = [
  { id: 's1', label: 'FETCH', sublabel: 'STATION 1', caption: 'FETCHING', captionMeta: 'STEP 1', icon: 'cassette-tape' },
  { id: 's2', label: 'TRANSFORM', sublabel: 'STATION 2', caption: 'PROCESSING', captionMeta: 'STATION 2', icon: 'table-2' },
  { id: 's3', label: 'DEPLOY', sublabel: 'STATION 3', caption: 'DELIVER', captionMeta: 'STATION 3', icon: 'flag' },
]

describe('pillarRowLayout — measured stations', () => {
  it('three cards at the measured per-station plates and glyph boxes, hand-computed to 1e-6', () => {
    const l = pillarRowLayout(SEED)
    expect(l.cards).toHaveLength(3)
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })

    const cxs = l.cards.map((c) => c.glyph.cx)
    expect(cxs[0]).toBeCloseTo(343.104, 6)
    expect(cxs[1]).toBeCloseTo(839.616, 6)
    expect(cxs[2]).toBeCloseTo(1343.232, 6)
    // All three glyph clusters share the y band 0.4681–0.5604.
    l.cards.forEach((c) => expect(c.glyph.cy).toBeCloseTo(555.39, 6))
    // Per-station measured ink widths (107.136 / 105.6 / 107.904).
    expect(l.cards[0]!.glyph.size).toBeCloseTo(107.136, 6)
    expect(l.cards[1]!.glyph.size).toBeCloseTo(105.6, 6)
    expect(l.cards[2]!.glyph.size).toBeCloseTo(107.904, 6)
  })

  it('plates are the settled dim-mask boxes with per-station extents', () => {
    const l = pillarRowLayout(SEED)
    const [p1, p2, p3] = l.cards.map((c) => c.plate)
    expect(p1!.x).toBeCloseTo(277.44, 6)
    expect(p1!.w).toBeCloseTo(316.608, 6)
    expect(p2!.x).toBeCloseTo(690.816, 6)
    expect(p2!.w).toBeCloseTo(383.232, 6)
    expect(p3!.x).toBeCloseTo(1190.208, 6)
    expect(p3!.w).toBeCloseTo(383.232, 6)
    expect(p1!.y).toBeCloseTo(494.208, 6)
    expect(p1!.h).toBeCloseTo(231.768, 6)
    expect(p2!.h).toBeCloseTo(231.012, 6)
    expect(p3!.h).toBeCloseTo(229.5, 6)
  })

  it('badges are thin circle outlines with per-station mini-icon markup', () => {
    const l = pillarRowLayout(SEED)
    // Centers/radii from the settled ASCII maps + chord fits (fractions of
    // the canvas; y as fraction of height).
    expect(l.cards[0]!.badge.cx).toBeCloseTo(590.00064, 6)
    expect(l.cards[1]!.badge.cx).toBeCloseTo(1092, 6)
    expect(l.cards[2]!.badge.cx).toBeCloseTo(1580.00064, 6)
    expect(l.cards[0]!.badge.cy).toBeCloseTo(641.00052, 6)
    expect(l.cards[1]!.badge.cy).toBeCloseTo(641.00052, 6)
    expect(l.cards[2]!.badge.cy).toBeCloseTo(640.00044, 6)
    expect(l.cards[0]!.badge.r).toBeCloseTo(47.50164, 6)
    expect(l.cards[1]!.badge.r).toBeCloseTo(47.50164, 6)
    expect(l.cards[2]!.badge.r).toBeCloseTo(46.50156, 6)
    // Mini-icon markup travels with the layout: station 1 reels+bar (rects),
    // station 2 solid diamond (polygon), station 3 pole+pennant (line+polygon).
    expect(l.cards[0]!.badge.icon).toContain('<rect')
    expect(l.cards[1]!.badge.icon).toContain('<polygon')
    expect(l.cards[2]!.badge.icon).toContain('<line')
    expect(l.cards[2]!.badge.icon).toContain('<polygon')
  })

  it('two label rows under each glyph: hue-matched row A and dim secondary row B', () => {
    const l = pillarRowLayout(SEED)
    expect(l.cards[0]!.label.x).toBeCloseTo(305.28, 6)
    expect(l.cards[1]!.label.x).toBeCloseTo(779.328, 6)
    expect(l.cards[2]!.label.x).toBeCloseTo(1301.952, 6)
    l.cards.forEach((c) => {
      expect(c.label.baselineY).toBeCloseTo(638.28, 6)
      expect(c.label.capHeight).toBeCloseTo(15.012, 6)
    })
    // Row A ink pins to the measured run extents (5/9/6 chars).
    expect(l.cards[0]!.label.textLength).toBeCloseTo(67.392, 6)
    expect(l.cards[1]!.label.textLength).toBeCloseTo(122.112, 6)
    expect(l.cards[2]!.label.textLength).toBeCloseTo(81.024, 6)
    // Row B (the previously deferred secondary row).
    expect(l.cards[0]!.sublabel.x).toBeCloseTo(283.584, 6)
    expect(l.cards[1]!.sublabel.x).toBeCloseTo(784.512, 6)
    expect(l.cards[2]!.sublabel.x).toBeCloseTo(1286.208, 6)
    l.cards.forEach((c) => {
      expect(c.sublabel.baselineY).toBeCloseTo(664.524, 6)
      expect(c.sublabel.capHeight).toBeCloseTo(11.988, 6)
      expect(c.sublabel.textLength).toBeCloseTo(110.208, 6)
    })
  })

  it('caption clusters replace the continuous summary rows, per station', () => {
    const l = pillarRowLayout(SEED)
    // Row 1 (badge-hued): x 535.488/1022.976/1532.928.
    expect(l.cards[0]!.caption.x).toBeCloseTo(535.488, 6)
    expect(l.cards[1]!.caption.x).toBeCloseTo(1022.976, 6)
    expect(l.cards[2]!.caption.x).toBeCloseTo(1532.928, 6)
    expect(l.cards[0]!.caption.baselineY).toBeCloseTo(727.488, 6)
    expect(l.cards[1]!.caption.baselineY).toBeCloseTo(723.708, 6)
    expect(l.cards[2]!.caption.baselineY).toBeCloseTo(725.22, 6)
    expect(l.cards[0]!.caption.capHeight).toBeCloseTo(18.792, 6)
    expect(l.cards[1]!.caption.capHeight).toBeCloseTo(15.012, 6)
    expect(l.cards[2]!.caption.capHeight).toBeCloseTo(18.684, 6)
    expect(l.cards[1]!.caption.textLength).toBeCloseTo(136.512, 6)
    // Row 2 (gray): x 553.536/1036.416/1523.904.
    expect(l.cards[0]!.captionMeta.x).toBeCloseTo(553.536, 6)
    expect(l.cards[1]!.captionMeta.x).toBeCloseTo(1036.416, 6)
    expect(l.cards[2]!.captionMeta.x).toBeCloseTo(1523.904, 6)
    expect(l.cards[0]!.captionMeta.baselineY).toBeCloseTo(753.732, 6)
    expect(l.cards[1]!.captionMeta.baselineY).toBeCloseTo(750.708, 6)
    expect(l.cards[2]!.captionMeta.baselineY).toBeCloseTo(747.792, 6)
    expect(l.cards[0]!.captionMeta.textLength).toBeCloseTo(72, 6)
    expect(l.cards[2]!.captionMeta.textLength).toBeCloseTo(110.4, 6)
  })
})

describe('pillarRowLayout — options and validation', () => {
  it('honors a custom canvas: 1280×720 rescales every derived length', () => {
    const l = pillarRowLayout(SEED, { width: 1280, height: 720 })
    expect(l.viewBox).toEqual({ width: 1280, height: 720 })
    expect(l.cards[0]!.glyph.cx).toBeCloseTo(343.104 * (2 / 3), 6)
    expect(l.cards[0]!.glyph.size).toBeCloseTo(107.136 * (2 / 3), 6)
    expect(l.cards[0]!.badge.cy).toBeCloseTo(641.00052 * (2 / 3), 6)
    expect(l.cards[0]!.plate.x).toBeCloseTo(277.44 * (2 / 3), 6)
    expect(l.cards[0]!.caption.textLength).toBeCloseTo(108.672 * (2 / 3), 6)
  })

  it('accepts a single card off-nominal at station 1', () => {
    const l = pillarRowLayout([SEED[0]!])
    expect(l.cards).toHaveLength(1)
    expect(l.cards[0]!.glyph.cx).toBeCloseTo(343.104, 6)
  })

  it('rejects an empty station list with RangeError', () => {
    expect(() => pillarRowLayout([])).toThrow(RangeError)
  })

  it('rejects more stations than the composition has with RangeError', () => {
    const four = [...SEED, { id: 's4', label: 'EXTRA', sublabel: 'X', caption: 'X', captionMeta: 'X', icon: 'flag' }]
    expect(() => pillarRowLayout(four)).toThrow(RangeError)
  })

  it('rejects duplicate ids with RangeError', () => {
    const dup: PillarCard[] = [
      { id: 's1', label: 'A', sublabel: 'B1', caption: 'C', captionMeta: 'D', icon: 'flag' },
      { id: 's1', label: 'B', sublabel: 'B2', caption: 'C', captionMeta: 'D', icon: 'flag' },
      { id: 's3', label: 'C', sublabel: 'B3', caption: 'C', captionMeta: 'D', icon: 'flag' },
    ]
    expect(() => pillarRowLayout(dup)).toThrow(RangeError)
  })

  it('rejects blank labels with RangeError', () => {
    const blank: PillarCard[] = [
      { id: 's1', label: 'A', sublabel: 'B', caption: 'C', captionMeta: 'D', icon: 'flag' },
      { id: 's2', label: '   ', sublabel: 'B', caption: 'C', captionMeta: 'D', icon: 'flag' },
      { id: 's3', label: 'C', sublabel: 'B', caption: 'C', captionMeta: 'D', icon: 'flag' },
    ]
    expect(() => pillarRowLayout(blank)).toThrow(RangeError)
  })

  it('is byte-identical across runs for the same inputs', () => {
    const a = JSON.stringify(pillarRowLayout(SEED))
    const b = JSON.stringify(pillarRowLayout(SEED))
    expect(a).toBe(b)
  })

  it('n=3 layout snapshot is stable across runs', () => {
    expect(pillarRowLayout(SEED)).toMatchSnapshot()
  })
})

describe('REVEAL_BEATS_SEC — measured f15 onsets', () => {
  it('pins the six measured beats: cards 1/3/5, badges 2/4/5, captions 6', () => {
    expect([...REVEAL_BEATS_SEC]).toEqual([0.067, 0.267, 0.6, 0.733, 1.0, 1.467])
  })
})
