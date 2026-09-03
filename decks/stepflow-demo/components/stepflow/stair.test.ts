import { describe, expect, it } from 'vitest'
import { stairLayout } from './stair'

// Hand-computed constants for the default 1920×1080 canvas, from the measured
// fractions (art_0AzKGXnD §2/F1):
//   left   = 0.033 · 1920 = 63.36      pitchX = 0.165 · 1920 = 316.8
//   w      = 0.078 · 1920 = 149.76     h      = 0.137 · 1080 = 147.96
//   base   = 0.837 · 1080 = 903.96     lift   = 0.068 · 1080 = 73.44
const W = 149.76
const H = 147.96
const LEFT = 63.36
const BASE_BOTTOM = 903.96
const LIFT = 73.44

// Uniform-ascent tops: block k sits its bottom LIFT·k above the base bottom.
const TOPS = [756, 682.56, 609.12, 535.68, 462.24, 388.8]
const XS = [63.36, 380.16, 696.96, 1013.76, 1330.56, 1647.36]

describe('stairLayout — block rectangles', () => {
  it('n=6: six blocks on the measured uniform ramp, rects hand-computed to 1e-6', () => {
    const l = stairLayout(6)
    expect(l.blocks).toHaveLength(6)
    l.blocks.forEach((b, i) => {
      expect(b.x).toBeCloseTo(XS[i], 6)
      expect(b.y).toBeCloseTo(TOPS[i], 6)
      expect(b.w).toBeCloseTo(W, 6)
      expect(b.h).toBeCloseTo(H, 6)
      expect(b.index).toBe(i)
    })
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
  })

  it('n=4 (off-nominal): the same ramp, first four blocks', () => {
    const l = stairLayout(4)
    expect(l.blocks).toHaveLength(4)
    l.blocks.forEach((b, i) => {
      expect(b.x).toBeCloseTo(XS[i], 6)
      expect(b.y).toBeCloseTo(TOPS[i], 6)
    })
  })

  it('n=1: a lone base block at the left margin', () => {
    const l = stairLayout(1)
    expect(l.blocks[0].x).toBeCloseTo(LEFT, 6)
    expect(l.blocks[0].y).toBeCloseTo(BASE_BOTTOM - H, 6)
    expect(l.blocks[0].y).toBeCloseTo(756, 6)
  })

  it('blocks ascend: every top is strictly above its left neighbor', () => {
    const l = stairLayout(6)
    for (let i = 1; i < l.blocks.length; i++) {
      expect(l.blocks[i].y).toBeLessThan(l.blocks[i - 1].y)
    }
  })

  it('the last block clears the right canvas edge on the measured ramp', () => {
    const l = stairLayout(6)
    const last = l.blocks[5]
    expect(last.x + last.w).toBeCloseTo(1647.36 + 149.76, 6)
    expect(last.x + last.w).toBeLessThanOrEqual(1920)
  })
})

describe('stairLayout — per-block lift override', () => {
  it('lifts[1] = 0.05 raises block 1 only; neighbors keep the uniform ramp', () => {
    const l = stairLayout(3, { lifts: [undefined, 0.05] })
    // Block 0: default (base block, no lift).
    expect(l.blocks[0].y).toBeCloseTo(BASE_BOTTOM - H, 6)
    // Block 1: bottom = 903.96 − 0.05·1080 = 849.96 → top 702.00.
    expect(l.blocks[1].y).toBeCloseTo(903.96 - 54 - H, 6)
    expect(l.blocks[1].y).toBeCloseTo(702, 6)
    // Block 2: unaffected by block 1's override (no cascade) — 2 × 73.44.
    expect(l.blocks[2].y).toBeCloseTo(BASE_BOTTOM - 2 * LIFT - H, 6)
    expect(l.blocks[2].y).toBeCloseTo(609.12, 6)
  })

  it('the v1 recording silhouette: measured lifts reproduce the RETRY dip', () => {
    // Measured rises above the base (px of 1144): 0, 69, 26, 154, 232, 310 —
    // the RETRY block dips 43px below TRANSFORM, then the climb resumes.
    const lifts = [0, 0.0603, 0.0227, 0.1346, 0.2028, 0.271]
    const l = stairLayout(6, { lifts })
    const bottoms = l.blocks.map((b) => b.y + b.h)
    expect(bottoms[2]).toBeGreaterThan(bottoms[1]) // RETRY sits lower than TRANSFORM
    expect(bottoms[3]).toBeLessThan(bottoms[2]) // the climb resumes past RETRY
    // Hand-computed dip: (0.0603 − 0.0227) · 1080 = 40.608 — the measured
    // 43px-at-1144 dip, rescaled (40.6) and landed within a pixel.
    expect(bottoms[2] - bottoms[1]).toBeCloseTo(40.608, 6)
  })

  it('a liftFrac override rescales the uniform ramp', () => {
    const l = stairLayout(3, { liftFrac: 0.05 })
    // lift = 0.05 · 1080 = 54: tops 756, 702, 648.
    expect(l.blocks[1].y).toBeCloseTo(702, 6)
    expect(l.blocks[2].y).toBeCloseTo(648, 6)
  })
})

describe('stairLayout — options and validation', () => {
  it('honors a custom canvas: 1280×720 rescales every derived length', () => {
    const l = stairLayout(2, { width: 1280, height: 720 })
    // Per-field closeness — 0.137 · 720 lands on 98.64000000000001 in IEEE 754.
    expect(l.blocks[0].x).toBeCloseTo(42.24, 6) // 0.033 · 1280
    expect(l.blocks[0].y).toBeCloseTo(504, 6) // 0.837·720 − 0.137·720 = 602.64 − 98.64
    expect(l.blocks[0].w).toBeCloseTo(99.84, 6) // 0.078 · 1280
    expect(l.blocks[0].h).toBeCloseTo(98.64, 6) // 0.137 · 720
    expect(l.blocks[0].index).toBe(0)
    expect(l.blocks[1].x).toBeCloseTo(42.24 + 0.165 * 1280, 6)
    expect(l.blocks[1].y).toBeCloseTo(504 - 0.068 * 720, 6)
  })

  it('rejects counts below 1 with RangeError', () => {
    expect(() => stairLayout(0)).toThrow(RangeError)
    expect(() => stairLayout(-1)).toThrow(RangeError)
  })

  it('rejects non-integer counts with RangeError', () => {
    expect(() => stairLayout(2.5)).toThrow(RangeError)
  })

  it('is byte-identical across runs for the same inputs', () => {
    const a = JSON.stringify(stairLayout(6))
    const b = JSON.stringify(stairLayout(6))
    expect(a).toBe(b)
  })

  it('n=6 layout snapshot is stable across runs', () => {
    expect(stairLayout(6)).toMatchSnapshot()
  })
})
