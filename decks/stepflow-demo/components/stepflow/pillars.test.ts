import { describe, expect, it } from 'vitest'
import { pillarRowLayout, REVEAL_BEATS_SEC, type PillarCard } from './pillars'

// Hand-computed constants for the default 1920×1080 canvas, from the measured
// settled-frame structure (report.json seg05_61s-63s; fractions of 1920/1080):
//   glyph lefts  0.1512/0.4125/0.6738   widths 0.0511/0.0508/0.0508
//   glyph band   y 0.4688–0.5597        → cx 339.36/840.768/1342.464, cy 555.39
//   badge lefts  0.282/0.543/0.804      widths 0.0508/0.0511/0.0508
//   badge box    y 0.5486–0.6389        → cx 590.208/1091.616/1592.448, cy 641.25
//   badge ring   0.0422×0.0847 → rx 40.512, ry 45.738; core 0.0258×0.0466 →
//   coreRx 24.768, coreRy 25.164 (measured on station 1, shared by all)
//   labels       x 0.1594/0.4133/0.6785, cap band 0.5771–0.591 → baseline
//   638.28, cap 15.012, advance 0.00708·1920 = 13.5936/char
//   plates       x 0.13/0.385/0.64, y 0.45, 0.16×0.20 → 249.6/739.2/1228.8,
//   486, 307.2×216
//   text rows    r1 x 535.488 baseline 728.244 cap 21.708 ink 1090.56;
//   r2 x 553.536 baseline 754.488 cap 18.684 ink 1080
const SEED: PillarCard[] = [
  { id: 's1', label: 'FETCH', icon: 'cassette-tape' },
  { id: 's2', label: 'QUERY', icon: 'table-2' },
  { id: 's3', label: 'SHIP', icon: 'flag' },
]

describe('pillarRowLayout — measured stations', () => {
  it('three cards on the measured uniform pitch, hand-computed to 1e-6', () => {
    const l = pillarRowLayout(SEED)
    expect(l.cards).toHaveLength(3)
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })

    const cxs = l.cards.map((c) => c.glyph.cx)
    expect(cxs[0]).toBeCloseTo(339.36, 6)
    expect(cxs[1]).toBeCloseTo(840.768, 6)
    expect(cxs[2]).toBeCloseTo(1342.464, 6)
    // All three glyph clusters share the y band 0.4688–0.5597.
    l.cards.forEach((c) => expect(c.glyph.cy).toBeCloseTo(555.39, 6))
    // Per-station measured ink widths (98.112 / 97.536 / 97.536).
    expect(l.cards[0]!.glyph.size).toBeCloseTo(98.112, 6)
    expect(l.cards[1]!.glyph.size).toBeCloseTo(97.536, 6)
    expect(l.cards[2]!.glyph.size).toBeCloseTo(97.536, 6)
  })

  it('station lefts sit on the uniform 0.2613·width pitch', () => {
    const l = pillarRowLayout(SEED)
    // The measured LEFTS are uniform (0.1512/0.4125/0.6738); glyph centers
    // wobble ±0.15px around the pitch because station 1's ink box is a hair
    // wider (0.0511 vs 0.0508).
    const leftPitch = l.cards[1]!.plate.x - l.cards[0]!.plate.x
    expect(leftPitch).toBeCloseTo(0.255 * 1920, 6)
    expect(l.cards[2]!.glyph.cx - l.cards[1]!.glyph.cx).toBeCloseTo(0.2613 * 1920, 6)
    expect(l.cards[1]!.glyph.cx - l.cards[0]!.glyph.cx).toBeCloseTo(501.408, 6)
    expect(l.cards[2]!.glyph.cx - l.cards[1]!.glyph.cx).toBeCloseTo(501.696, 6)
  })

  it('badges sit lower-right of their glyphs at the measured boxes', () => {
    const l = pillarRowLayout(SEED)
    // Union-box centers: x 0.3074/0.56855/0.8294, y 0.59375.
    expect(l.cards[0]!.badge.cx).toBeCloseTo(590.208, 6)
    expect(l.cards[1]!.badge.cx).toBeCloseTo(1091.616, 6)
    // Station 3 extends station 2 by the 0.261 badge pitch (left 0.804).
    expect(l.cards[2]!.badge.cx).toBeCloseTo(1592.448, 6)
    l.cards.forEach((c) => expect(c.badge.cy).toBeCloseTo(641.25, 6))
    // Ring + core geometry measured on station 1, shared by every station.
    l.cards.forEach((c) => {
      expect(c.badge.rx).toBeCloseTo(40.512, 6)
      expect(c.badge.ry).toBeCloseTo(45.738, 6)
      expect(c.badge.coreRx).toBeCloseTo(24.768, 6)
      expect(c.badge.coreRy).toBeCloseTo(25.164, 6)
    })
  })

  it('labels sit in the measured cap band with the measured per-char advance', () => {
    const l = pillarRowLayout(SEED)
    expect(l.cards[0]!.label.x).toBeCloseTo(306.048, 6)
    expect(l.cards[1]!.label.x).toBeCloseTo(793.536, 6)
    expect(l.cards[2]!.label.x).toBeCloseTo(1302.72, 6)
    l.cards.forEach((c) => {
      expect(c.label.baselineY).toBeCloseTo(638.28, 6)
      expect(c.label.capHeight).toBeCloseTo(15.012, 6)
    })
    // Ink width pins to label length × 0.00708·1920 = 13.5936/char.
    expect(l.cards[0]!.label.textLength).toBeCloseTo(5 * 13.5936, 6)
    expect(l.cards[2]!.label.textLength).toBeCloseTo(4 * 13.5936, 6)
  })

  it('plates are the near-black organizing boxes at the composition pins', () => {
    const l = pillarRowLayout(SEED)
    const [p1, p2, p3] = l.cards.map((c) => c.plate)
    expect(p1!.x).toBeCloseTo(249.6, 6)
    expect(p2!.x).toBeCloseTo(739.2, 6)
    expect(p3!.x).toBeCloseTo(1228.8, 6)
    l.cards.forEach((c) => {
      expect(c.plate.y).toBeCloseTo(486, 6)
      expect(c.plate.w).toBeCloseTo(307.2, 6)
      expect(c.plate.h).toBeCloseTo(216, 6)
    })
  })

  it('two summary rows below the card band at the measured geometry', () => {
    const l = pillarRowLayout(SEED)
    expect(l.textRows).toHaveLength(2)
    expect(l.textRows[0]!.x).toBeCloseTo(535.488, 6)
    expect(l.textRows[0]!.baselineY).toBeCloseTo(728.244, 6)
    expect(l.textRows[0]!.capHeight).toBeCloseTo(21.708, 6)
    expect(l.textRows[0]!.textLength).toBeCloseTo(1090.56, 6)
    expect(l.textRows[1]!.x).toBeCloseTo(553.536, 6)
    expect(l.textRows[1]!.baselineY).toBeCloseTo(754.488, 6)
    expect(l.textRows[1]!.capHeight).toBeCloseTo(18.684, 6)
    expect(l.textRows[1]!.textLength).toBeCloseTo(1080, 6)
  })
})

describe('pillarRowLayout — options and validation', () => {
  it('honors a custom canvas: 1280×720 rescales every derived length', () => {
    const l = pillarRowLayout(SEED, { width: 1280, height: 720 })
    expect(l.viewBox).toEqual({ width: 1280, height: 720 })
    expect(l.cards[0]!.glyph.cx).toBeCloseTo(339.36 * (2 / 3), 6)
    expect(l.cards[0]!.glyph.size).toBeCloseTo(98.112 * (2 / 3), 6)
    expect(l.cards[0]!.badge.cy).toBeCloseTo(641.25 * (2 / 3), 6)
    expect(l.cards[0]!.plate.x).toBeCloseTo(249.6 * (2 / 3), 6)
    expect(l.textRows[0]!.textLength).toBeCloseTo(1090.56 * (2 / 3), 6)
  })

  it('accepts a single card off-nominal at station 1', () => {
    const l = pillarRowLayout([SEED[0]!])
    expect(l.cards).toHaveLength(1)
    expect(l.cards[0]!.glyph.cx).toBeCloseTo(339.36, 6)
  })

  it('rejects an empty station list with RangeError', () => {
    expect(() => pillarRowLayout([])).toThrow(RangeError)
  })

  it('rejects more stations than the composition has with RangeError', () => {
    const four = [...SEED, { id: 's4', label: 'EXTRA', icon: 'flag' }]
    expect(() => pillarRowLayout(four)).toThrow(RangeError)
  })

  it('rejects duplicate ids with RangeError', () => {
    const dup: PillarCard[] = [
      { id: 's1', label: 'A', icon: 'flag' },
      { id: 's1', label: 'B', icon: 'flag' },
      { id: 's3', label: 'C', icon: 'flag' },
    ]
    expect(() => pillarRowLayout(dup)).toThrow(RangeError)
  })

  it('rejects blank labels with RangeError', () => {
    const blank: PillarCard[] = [
      { id: 's1', label: 'A', icon: 'flag' },
      { id: 's2', label: '   ', icon: 'flag' },
      { id: 's3', label: 'C', icon: 'flag' },
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
  it('pins the six measured beats, superseding the draft schedule', () => {
    expect([...REVEAL_BEATS_SEC]).toEqual([0.067, 0.267, 0.6, 0.733, 1.0, 1.467])
  })
})
